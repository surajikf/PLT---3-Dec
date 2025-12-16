import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, Filter, FolderKanban, Loader2, CheckSquare, Square, Trash2, MoreVertical } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { authService } from '../services/authService';
import { UserRole } from '../utils/roles';
import { formatCurrency } from '../utils/currency';
import Breadcrumbs from '../components/Breadcrumbs';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useTableSort } from '../utils/tableSort';
import Avatar from '../components/Avatar';

const ProjectsPage = () => {
  const user = authService.getCurrentUser();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  // Debounce search input to prevent multiple requests while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 800); // Wait 800ms after user stops typing to reduce requests

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Build query params once - use stable key
  const queryKey = useMemo(() => {
    const key: any[] = ['projects'];
    if (debouncedSearch.trim()) key.push('search', debouncedSearch.trim());
    if (statusFilter) key.push('status', statusFilter);
    if (showArchived) key.push('archived');
    return key;
  }, [debouncedSearch, statusFilter, showArchived]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
    if (statusFilter) params.append('status', statusFilter);
    if (showArchived) {
      params.append('includeArchived', 'archived');
    }
    return params.toString();
  }, [debouncedSearch, statusFilter, showArchived]);

  // Single optimized query with smart retry logic
  const { data, isLoading, error } = useQuery(
    queryKey,
    async () => {
      try {
        const res = await api.get(`/projects?${queryParams}`);
        setIsRateLimited(false); // Reset rate limit flag on success
        setHasInitialLoad(true);
        return res.data.data;
      } catch (err: any) {
        if (err.response?.status === 429) {
          setIsRateLimited(true);
          // Wait 15 seconds before allowing retry (rate limit window)
          setTimeout(() => setIsRateLimited(false), 15000);
        }
        throw err;
      }
    },
    {
      enabled: !isRateLimited, // Don't run query if rate limited
      onSuccess: () => {
        setHasInitialLoad(true);
      },
      onError: (error: any) => {
        // Don't show error toast for rate limiting - user will see it's loading
        if (error.response?.status !== 429) {
          const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to load projects';
          toast.error(errorMessage);
        } else {
          // Only show toast once
          if (!hasInitialLoad) {
            toast.error('Too many requests. Please wait a moment.');
          }
        }
      },
      retry: false, // Disable all retries to prevent multiple requests
      refetchOnWindowFocus: false,
      refetchOnMount: hasInitialLoad ? false : 'always', // Only fetch once on mount
      refetchOnReconnect: false, // Don't refetch on reconnect
      staleTime: 60000, // Consider data fresh for 60 seconds
      cacheTime: 600000, // Keep in cache for 10 minutes
    }
  );

  const canCreate = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role as UserRole);
  const canBulkEdit = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role as UserRole);
  const canBulkDelete = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as UserRole);

  // Table sorting
  const { sortedData: sortedProjects, SortableHeader } = useTableSort({
    data: data || [],
    getValue: (item: any, field: string) => {
      switch (field) {
        case 'name':
          return item.name || '';
        case 'customer':
          return item.customer?.name || 'N/A';
        case 'manager':
          return item.manager ? `${item.manager.firstName} ${item.manager.lastName}` : 'N/A';
        case 'status':
          return item.status || '';
        case 'budget':
          return item.budget || 0;
        default:
          return (item as any)[field];
      }
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(new Set(data?.map((p: any) => p.id) || []));
    } else {
      setSelectedProjects(new Set());
    }
  };

  const handleSelectProject = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedProjects);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedProjects(newSelected);
  };

  const bulkStatusUpdateMutation = useMutation(
    async ({ ids, status }: { ids: string[]; status: string }) => {
      const res = await api.post('/projects/bulk/status', { ids, status });
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Projects status updated successfully');
        setSelectedProjects(new Set());
        queryClient.invalidateQueries(['projects']);
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to update projects';
        toast.error(errorMessage);
      },
    }
  );

  const bulkArchiveMutation = useMutation(
    async (ids: string[]) => {
      const res = await api.post('/projects/bulk/delete', { ids });
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Projects archived successfully');
        setSelectedProjects(new Set());
        queryClient.invalidateQueries(['projects']);
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to archive projects';
        toast.error(errorMessage);
      },
    }
  );

  const bulkRestoreMutation = useMutation(
    async (ids: string[]) => {
      const res = await api.post('/projects/bulk/restore', { ids });
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Projects restored successfully');
        setSelectedProjects(new Set());
        queryClient.invalidateQueries(['projects']);
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to restore projects';
        toast.error(errorMessage);
      },
    }
  );

  const handleBulkStatusChange = (status: string) => {
    if (selectedProjects.size === 0) {
      toast.error('Please select at least one project');
      return;
    }
    if (!status) {
      return; // Don't show dialog if no status selected
    }
    const statusLabel = status.replace('_', ' ');
    setConfirmDialog({
      isOpen: true,
      title: 'Change Project Status',
      message: `Are you sure you want to change the status of ${selectedProjects.size} project(s) to "${statusLabel}"?`,
      type: 'warning',
      onConfirm: () => {
        bulkStatusUpdateMutation.mutate({ ids: Array.from(selectedProjects), status });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleBulkArchive = () => {
    if (selectedProjects.size === 0) {
      toast.error('Please select at least one project');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Projects',
      message: `Are you sure you want to archive ${selectedProjects.size} project(s)? Archived projects will be moved to trash and can be restored later.`,
      type: 'danger',
      onConfirm: () => {
        bulkArchiveMutation.mutate(Array.from(selectedProjects));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleBulkRestore = () => {
    if (selectedProjects.size === 0) {
      toast.error('Please select at least one project');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Projects',
      message: `Are you sure you want to restore ${selectedProjects.size} archived project(s)? They will be moved back to active projects.`,
      type: 'info',
      onConfirm: () => {
        bulkRestoreMutation.mutate(Array.from(selectedProjects));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const allSelected = data && data.length > 0 && data.every((p: any) => selectedProjects.has(p.id));
  const someSelected = selectedProjects.size > 0 && !allSelected;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Projects' }]} />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track all your projects</p>
        </div>
        {canCreate && (
          <Link to="/projects/new" className="btn btn-primary inline-flex items-center justify-center whitespace-nowrap">
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Link>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {canBulkEdit && selectedProjects.size > 0 && (
        <div className="card bg-indigo-50 border-indigo-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-indigo-900">
                {selectedProjects.size} project{selectedProjects.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusChange(e.target.value);
                      // Reset dropdown after selection
                      setTimeout(() => {
                        const select = e.target as HTMLSelectElement;
                        select.value = '';
                      }, 100);
                    }
                  }}
                  className="input pr-8 text-sm"
                  disabled={bulkStatusUpdateMutation.isLoading}
                >
                  <option value="">Change Status...</option>
                  <option value="PLANNING">Planning</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <MoreVertical className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {canBulkDelete && !showArchived && (
                <button
                  onClick={handleBulkArchive}
                  disabled={bulkArchiveMutation.isLoading}
                  className="btn btn-warning text-sm inline-flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Archive ({selectedProjects.size})
                </button>
              )}
              {canBulkDelete && showArchived && (
                <button
                  onClick={handleBulkRestore}
                  disabled={bulkRestoreMutation.isLoading}
                  className="btn btn-success text-sm inline-flex items-center"
                >
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Restore ({selectedProjects.size})
                </button>
              )}
              <button
                onClick={() => setSelectedProjects(new Set())}
                className="btn btn-secondary text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by project name or code..."
              className="input pl-10 w-full"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="relative sm:w-56">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <select
              className="input pl-10 w-full appearance-none bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          {canBulkDelete && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => {
                    setShowArchived(e.target.checked);
                    setSelectedProjects(new Set());
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Show Archived</span>
              </label>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isRateLimited ? (
          <div className="text-center py-12">
            <p className="text-yellow-600 mb-2 font-semibold">Rate Limit Reached</p>
            <p className="text-sm text-gray-500 mb-4">
              Too many requests. Please wait 15 seconds before trying again.
            </p>
            <button
              onClick={() => {
                setIsRateLimited(false);
                queryClient.invalidateQueries(['projects']);
              }}
              className="btn btn-primary text-sm"
            >
              Try Again
            </button>
          </div>
        ) : isLoading ? (
          <LoadingSkeleton rows={8} showHeader={false} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-2 font-semibold">Failed to load projects</p>
            <p className="text-sm text-gray-500 mb-4">
              {error instanceof Error ? error.message : 'Please try refreshing the page'}
            </p>
            <button
              onClick={() => {
                setIsRateLimited(false);
                queryClient.invalidateQueries(['projects']);
              }}
              className="btn btn-primary text-sm"
            >
              Retry
            </button>
          </div>
        ) : data && data.length > 0 ? (
          <>
            {showArchived && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Viewing archived projects.</strong> These projects are in trash and can be restored.
                </p>
              </div>
            )}
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {canBulkEdit && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(input) => {
                            if (input) input.indeterminate = someSelected;
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                    )}
                    <SortableHeader field="name">
                      Project
                    </SortableHeader>
                    <SortableHeader field="customer">
                      Customer
                    </SortableHeader>
                    <SortableHeader field="manager">
                      Manager
                    </SortableHeader>
                    <SortableHeader field="status">
                      Status
                    </SortableHeader>
                    <SortableHeader field="budget" className="text-right">
                      Budget
                    </SortableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProjects.map((project: any) => (
                    <tr 
                      key={project.id} 
                      className={`hover:bg-primary-50/30 transition-colors duration-150 ${selectedProjects.has(project.id) ? 'bg-primary-50' : ''}`}
                    >
                      {canBulkEdit && (
                        <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedProjects.has(project.id)}
                            onChange={(e) => handleSelectProject(project.id, e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                      )}
                      <td 
                        className="px-4 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => window.location.href = `/projects/${project.id}`}
                      >
                        <Link 
                          to={`/projects/${project.id}`} 
                          className="group flex items-center gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FolderKanban className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                              {project.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{project.code}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{project.customer?.name || <span className="text-gray-400 italic">No customer</span>}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {project.manager ? (
                          <div className="flex items-center gap-2">
                            <Avatar
                              firstName={project.manager.firstName}
                              lastName={project.manager.lastName}
                              profilePicture={project.manager.profilePicture}
                              size="sm"
                            />
                            <span className="text-sm text-gray-900">
                              {project.manager.firstName} {project.manager.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            project.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : project.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : project.status === 'ON_HOLD'
                              ? 'bg-yellow-100 text-yellow-800'
                              : project.status === 'PLANNING'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {project.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(project.budget || 0)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          </>
        ) : (
          <div className="text-center py-12">
            <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No projects found</h3>
            <p className="text-sm text-gray-500 mb-6">
              {debouncedSearch || statusFilter 
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by creating a new project'}
            </p>
            {canCreate && !debouncedSearch && !statusFilter && (
              <Link to="/projects/new" className="btn btn-primary inline-flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Project
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.type === 'danger' ? 'Yes, Archive' : confirmDialog.type === 'warning' ? 'Yes, Change Status' : 'Confirm'}
        cancelText="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ProjectsPage;


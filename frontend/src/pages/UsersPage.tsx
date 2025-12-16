import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, ExternalLink, Users, Loader2, Filter, Trash2, MoreVertical, UserCheck, UserX } from 'lucide-react';
import { roleLabels } from '../utils/roles';
import { useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import Avatar from '../components/Avatar';
import { authService } from '../services/authService';
import { UserRole } from '../utils/roles';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';

const UsersPage = () => {
  const user = authService.getCurrentUser();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
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

  const { data, isLoading } = useQuery('users', async () => {
    const res = await api.get('/users');
    return res.data.data;
  });

  const filteredUsers = data?.filter((user: any) => {
    const matchesSearch = !searchTerm || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  const canBulkEdit = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as UserRole);
  const canBulkDelete = user && user.role === UserRole.SUPER_ADMIN;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map((u: any) => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedUsers(newSelected);
  };

  const bulkStatusUpdateMutation = useMutation(
    async ({ ids, isActive }: { ids: string[]; isActive: boolean }) => {
      const res = await api.post('/users/bulk/status', { ids, isActive });
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Employees updated successfully');
        setSelectedUsers(new Set());
        queryClient.invalidateQueries('users');
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to update employees';
        toast.error(errorMessage);
      },
    }
  );

  const bulkRoleUpdateMutation = useMutation(
    async ({ ids, role }: { ids: string[]; role: string }) => {
      const res = await api.post('/users/bulk/role', { ids, role });
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Employee roles updated successfully');
        setSelectedUsers(new Set());
        queryClient.invalidateQueries('users');
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to update employee roles';
        toast.error(errorMessage);
      },
    }
  );

  const bulkDeleteMutation = useMutation(
    async (ids: string[]) => {
      const res = await api.post('/users/bulk/delete', { ids });
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Employees deleted successfully');
        setSelectedUsers(new Set());
        queryClient.invalidateQueries('users');
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to delete employees';
        toast.error(errorMessage);
      },
    }
  );

  const handleBulkActivate = () => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Activate Employees',
      message: `Are you sure you want to activate ${selectedUsers.size} employee(s)? They will be able to log in and access the system.`,
      type: 'success',
      onConfirm: () => {
        bulkStatusUpdateMutation.mutate({ ids: Array.from(selectedUsers), isActive: true });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleBulkDeactivate = () => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Deactivate Employees',
      message: `Are you sure you want to deactivate ${selectedUsers.size} employee(s)? They will not be able to log in until reactivated.`,
      type: 'warning',
      onConfirm: () => {
        bulkStatusUpdateMutation.mutate({ ids: Array.from(selectedUsers), isActive: false });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleBulkRoleChange = (role: string) => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Change Employee Role',
      message: `Are you sure you want to change the role of ${selectedUsers.size} employee(s) to ${roleLabels[role as keyof typeof roleLabels] || role}? This will affect their permissions and access.`,
      type: 'warning',
      onConfirm: () => {
        bulkRoleUpdateMutation.mutate({ ids: Array.from(selectedUsers), role });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Employees',
      message: `Are you sure you want to permanently delete ${selectedUsers.size} employee(s)? This action cannot be undone and will remove all associated data.`,
      type: 'danger',
      onConfirm: () => {
        bulkDeleteMutation.mutate(Array.from(selectedUsers));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const allSelected = filteredUsers.length > 0 && filteredUsers.every((u: any) => selectedUsers.has(u.id));
  const someSelected = selectedUsers.size > 0 && !allSelected;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Employees' }]} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage employees. Use Master Management for full CRUD operations.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/master-management?tab=employees"
            className="btn btn-secondary inline-flex items-center text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Master Management
          </Link>
          <Link
            to="/master-management?tab=employees"
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Employee
          </Link>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {canBulkEdit && selectedUsers.size > 0 && (
        <div className="card bg-indigo-50 border-indigo-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-indigo-900">
                {selectedUsers.size} employee{selectedUsers.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleBulkActivate}
                disabled={bulkStatusUpdateMutation.isLoading}
                className="btn btn-success text-sm inline-flex items-center"
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Activate
              </button>
              <button
                onClick={handleBulkDeactivate}
                disabled={bulkStatusUpdateMutation.isLoading}
                className="btn btn-warning text-sm inline-flex items-center"
              >
                <UserX className="w-4 h-4 mr-1" />
                Deactivate
              </button>
              {user?.role === UserRole.SUPER_ADMIN && (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkRoleChange(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="input pr-8 text-sm"
                    disabled={bulkRoleUpdateMutation.isLoading}
                  >
                    <option value="">Change Role...</option>
                    <option value="ADMIN">Admin</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="TEAM_MEMBER">Employee</option>
                    <option value="CLIENT">Client</option>
                  </select>
                  <MoreVertical className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}
              {canBulkDelete && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isLoading}
                  className="btn btn-danger text-sm inline-flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete ({selectedUsers.size})
                </button>
              )}
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="btn btn-secondary text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative sm:w-56">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <select
              className="input pl-10 w-full appearance-none bg-white"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
            <option value="TEAM_MEMBER">Employee</option>
            <option value="CLIENT">Client</option>
          </select>
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
            <p className="text-gray-500">Loading employees...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userItem: any) => (
                  <tr key={userItem.id} className={`hover:bg-primary-50/30 transition-colors duration-150 ${selectedUsers.has(userItem.id) ? 'bg-primary-50' : ''}`}>
                    {canBulkEdit && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(userItem.id)}
                          onChange={(e) => handleSelectUser(userItem.id, e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar
                          firstName={userItem.firstName}
                          lastName={userItem.lastName}
                          profilePicture={userItem.profilePicture}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {userItem.firstName} {userItem.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{userItem.email}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {roleLabels[userItem.role as keyof typeof roleLabels] || userItem.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userItem.department?.name || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {userItem.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <Link
                        to="/master-management?tab=employees"
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length < (data?.length || 0) && (
              <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600 border-t border-gray-200">
                Showing {filteredUsers.length} of {data?.length || 0} users
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {searchTerm || roleFilter ? 'No users match your filters' : 'No users found'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm || roleFilter 
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by creating a new user'}
            </p>
            {(searchTerm || roleFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                }}
                className="btn btn-secondary text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;


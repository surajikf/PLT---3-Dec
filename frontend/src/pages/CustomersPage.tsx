import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, ExternalLink, Building2, Loader2, Filter, Trash2, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import { authService } from '../services/authService';
import { UserRole } from '../utils/roles';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';

const CustomersPage = () => {
  const user = authService.getCurrentUser();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
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

  const { data, isLoading } = useQuery('customers', async () => {
    const res = await api.get('/customers');
    return res.data.data;
  });

  const filteredCustomers = data?.filter((customer: any) => {
    const matchesSearch = !searchTerm ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const canBulkEdit = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as UserRole);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(new Set(filteredCustomers.map((c: any) => c.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleSelectCustomer = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedCustomers);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedCustomers(newSelected);
  };

  const bulkStatusUpdateMutation = useMutation(
    async ({ ids, status }: { ids: string[]; status: string }) => {
      const res = await api.post('/customers/bulk/status', { ids, status });
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Customers updated successfully');
        setSelectedCustomers(new Set());
        queryClient.invalidateQueries('customers');
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to update customers';
        toast.error(errorMessage);
      },
    }
  );

  const bulkDeleteMutation = useMutation(
    async (ids: string[]) => {
      const res = await api.post('/customers/bulk/delete', { ids });
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Customers deleted successfully');
        setSelectedCustomers(new Set());
        queryClient.invalidateQueries('customers');
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to delete customers';
        toast.error(errorMessage);
      },
    }
  );

  const handleBulkStatusChange = (status: string) => {
    if (selectedCustomers.size === 0) {
      toast.error('Please select at least one customer');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Change Customer Status',
      message: `Are you sure you want to change the status of ${selectedCustomers.size} customer(s) to ${status}?`,
      type: 'warning',
      onConfirm: () => {
        bulkStatusUpdateMutation.mutate({ ids: Array.from(selectedCustomers), status });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedCustomers.size === 0) {
      toast.error('Please select at least one customer');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Customers',
      message: `Are you sure you want to permanently delete ${selectedCustomers.size} customer(s)? This action cannot be undone and will remove all associated data including projects.`,
      type: 'danger',
      onConfirm: () => {
        bulkDeleteMutation.mutate(Array.from(selectedCustomers));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const allSelected = filteredCustomers.length > 0 && filteredCustomers.every((c: any) => selectedCustomers.has(c.id));
  const someSelected = selectedCustomers.size > 0 && !allSelected;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Customers' }]} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">
            View customers. For full management (create, edit, delete), use{' '}
            <Link to="/master-management?tab=customers" className="text-primary-600 hover:text-primary-700 font-medium underline">
              Master Management
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/master-management?tab=customers"
            className="btn btn-primary inline-flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Manage Customers
          </Link>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {canBulkEdit && selectedCustomers.size > 0 && (
        <div className="card bg-indigo-50 border-indigo-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-indigo-900">
                {selectedCustomers.size} customer{selectedCustomers.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusChange(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="input pr-8 text-sm"
                  disabled={bulkStatusUpdateMutation.isLoading}
                >
                  <option value="">Change Status...</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <MoreVertical className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isLoading}
                className="btn btn-danger text-sm inline-flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete ({selectedCustomers.size})
              </button>
              <button
                onClick={() => setSelectedCustomers(new Set())}
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
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
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
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
            <p className="text-gray-500">Loading customers...</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Industry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer: any) => (
                  <tr key={customer.id} className={`hover:bg-primary-50/30 transition-colors duration-150 ${selectedCustomers.has(customer.id) ? 'bg-primary-50' : ''}`}>
                    {canBulkEdit && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.has(customer.id)}
                          onChange={(e) => handleSelectCustomer(customer.id, e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.industry || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.contactPerson || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.email || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          customer.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <Link
                        to="/master-management?tab=customers"
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCustomers.length < (data?.length || 0) && (
              <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600 border-t border-gray-200">
                Showing {filteredCustomers.length} of {data?.length || 0} customers
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {searchTerm || statusFilter ? 'No customers match your filters' : 'No customers found'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm || statusFilter 
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by creating a new customer'}
            </p>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
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

export default CustomersPage;


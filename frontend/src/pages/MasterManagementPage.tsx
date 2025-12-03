import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Users,
  Building2,
  FolderKanban,
  Briefcase,
  Layers,
  Settings,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Search
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { roleLabels } from '../utils/roles';

type TabType = 'customers' | 'projects' | 'employees' | 'departments' | 'stages';

const MasterManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const [activeTab, setActiveTab] = useState<TabType>(
    tabFromUrl && ['customers', 'projects', 'employees', 'departments', 'stages'].includes(tabFromUrl)
      ? tabFromUrl
      : 'customers'
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    if (tabFromUrl && ['customers', 'projects', 'employees', 'departments', 'stages'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'customers' as TabType, label: 'Clients', icon: Building2 },
    { id: 'projects' as TabType, label: 'Projects', icon: FolderKanban },
    { id: 'employees' as TabType, label: 'Employees', icon: Users },
    { id: 'departments' as TabType, label: 'Departments', icon: Briefcase },
    { id: 'stages' as TabType, label: 'Stages', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-600" />
              Master Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage all entities in the system - Clients, Projects, Employees, Departments, and Stages
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2 transition-colors
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'customers' && <CustomersManagement />}
          {activeTab === 'projects' && <ProjectsManagement />}
          {activeTab === 'employees' && <EmployeesManagement />}
          {activeTab === 'departments' && <DepartmentsManagement />}
          {activeTab === 'stages' && <StagesManagement />}
        </div>
      </div>
    </div>
  );
};

// Customers Management Component
const CustomersManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery('customers', async () => {
    const res = await api.get('/customers');
    return res.data.data || [];
  });

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Customer deleted successfully');
        queryClient.invalidateQueries('customers');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete customer');
      },
    }
  );

  const filteredCustomers = customers?.filter((c: any) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No customers found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.industry || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.contactPerson || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        customer.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {customer.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setEditingCustomer(customer);
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this customer?')) {
                          deleteMutation.mutate(customer.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
};

// Customer Modal Component
const CustomerModal = ({ customer, onClose }: { customer: any; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    industry: customer?.industry || '',
    address: customer?.address || '',
    contactPerson: customer?.contactPerson || '',
    status: customer?.status || 'ACTIVE',
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/customers', data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Customer created successfully');
        queryClient.invalidateQueries('customers');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create customer');
      },
    }
  );

  const updateMutation = useMutation(
    async (data: any) => {
      const res = await api.patch(`/customers/${customer.id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Customer updated successfully');
        queryClient.invalidateQueries('customers');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update customer');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customer) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : customer ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Projects Management Component
const ProjectsManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery('all-projects', async () => {
    const res = await api.get('/projects');
    return res.data.data || [];
  });

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Project deleted successfully');
        queryClient.invalidateQueries('all-projects');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete project');
      },
    }
  );

  const filteredProjects = projects?.filter((p: any) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Project
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No projects found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((project: any) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {project.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.customer?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.budget ? formatCurrency(project.budget) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : project.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'ON_HOLD'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project.status?.replace('_', ' ') || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this project?')) {
                          deleteMutation.mutate(project.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <ProjectModal
          project={editingProject}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
};

// Project Modal Component
const ProjectModal = ({ project, onClose }: { project: any; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    code: project?.code || '',
    name: project?.name || '',
    description: project?.description || '',
    customerId: project?.customerId || '',
    managerId: project?.managerId || '',
    departmentId: project?.departmentId || '',
    budget: project?.budget || '',
    startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    status: project?.status || 'PLANNING',
  });

  const queryClient = useQueryClient();

  const { data: customers } = useQuery('customers', async () => {
    const res = await api.get('/customers');
    return res.data.data || [];
  });

  const { data: users } = useQuery('users', async () => {
    const res = await api.get('/users?isActive=true');
    return res.data.data || [];
  });

  const { data: departments } = useQuery('departments', async () => {
    const res = await api.get('/departments');
    return res.data.data || [];
  });

  const managers = users?.filter((u: any) =>
    ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(u.role)
  ) || [];

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/projects', data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Project created successfully');
        queryClient.invalidateQueries('all-projects');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create project');
      },
    }
  );

  const updateMutation = useMutation(
    async (data: any) => {
      const res = await api.patch(`/projects/${project.id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Project updated successfully');
        queryClient.invalidateQueries('all-projects');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update project');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget.toString()) : null,
    };
    if (project) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {project ? 'Edit Project' : 'Add New Project'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="input"
                placeholder="PROJ-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="input"
              >
                <option value="">Select Customer</option>
                {customers?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="input"
              >
                <option value="">Select Manager</option>
                {managers.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({roleLabels[m.role as keyof typeof roleLabels]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="input"
              >
                <option value="">Select Department</option>
                {departments?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <input
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : project ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Employees Management Component
const EmployeesManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery('users', async () => {
    const res = await api.get('/users');
    return res.data.data || [];
  });

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Employee deleted successfully');
        queryClient.invalidateQueries('users');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete employee');
      },
    }
  );

  const filteredEmployees = employees?.filter((e: any) =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditingEmployee(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Employee
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No employees found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee: any) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {roleLabels[employee.role as keyof typeof roleLabels] || employee.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.department?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.hourlyRate ? formatCurrency(employee.hourlyRate) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setEditingEmployee(employee);
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this employee?')) {
                          deleteMutation.mutate(employee.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEmployee(null);
          }}
        />
      )}
    </div>
  );
};

// Employee Modal Component
const EmployeeModal = ({ employee, onClose }: { employee: any; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    password: '',
    role: employee?.role || 'TEAM_MEMBER',
    departmentId: employee?.departmentId || '',
    hourlyRate: employee?.hourlyRate || '',
    isActive: employee?.isActive !== undefined ? employee.isActive : true,
  });
  const queryClient = useQueryClient();

  const { data: departments } = useQuery('departments', async () => {
    const res = await api.get('/departments');
    return res.data.data || [];
  });

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/auth/register', data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Employee created successfully');
        queryClient.invalidateQueries('users');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create employee');
      },
    }
  );

  const updateMutation = useMutation(
    async (data: any) => {
      const res = await api.patch(`/users/${employee.id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Employee updated successfully');
        queryClient.invalidateQueries('users');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update employee');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      ...formData,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate.toString()) : null,
    };
    if (employee) {
      // Don't send password on update
      delete submitData.password;
      updateMutation.mutate(submitData);
    } else {
      if (!submitData.password) {
        toast.error('Password is required for new employees');
        return;
      }
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                disabled={!!employee}
              />
            </div>
            {!employee && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required={!employee}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  minLength={6}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input"
                required
              >
                <option value="TEAM_MEMBER">Team Member</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="input"
              >
                <option value="">Select Department</option>
                {departments?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
              <input
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                className="input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="input"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : employee ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Departments Management Component
const DepartmentsManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: departments, isLoading } = useQuery('departments', async () => {
    const res = await api.get('/departments');
    return res.data.data || [];
  });

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/departments/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Department deleted successfully');
        queryClient.invalidateQueries('departments');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete department');
      },
    }
  );

  const filteredDepartments = departments?.filter((d: any) =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.head?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.head?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditingDepartment(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Department
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredDepartments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No departments found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Head</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projects</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDepartments.map((dept: any) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept._count?.members || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept._count?.projects || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setEditingDepartment(dept);
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this department?')) {
                          deleteMutation.mutate(dept.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <DepartmentModal
          department={editingDepartment}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDepartment(null);
          }}
        />
      )}
    </div>
  );
};

// Department Modal Component
const DepartmentModal = ({ department, onClose }: { department: any; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    headId: department?.headId || '',
  });
  const queryClient = useQueryClient();

  const { data: users } = useQuery('users', async () => {
    const res = await api.get('/users?isActive=true');
    return res.data.data || [];
  });

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/departments', data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Department created successfully');
        queryClient.invalidateQueries('departments');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create department');
      },
    }
  );

  const updateMutation = useMutation(
    async (data: any) => {
      const res = await api.patch(`/departments/${department.id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Department updated successfully');
        queryClient.invalidateQueries('departments');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update department');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      headId: formData.headId || null,
    };
    if (department) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {department ? 'Edit Department' : 'Add New Department'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Head</label>
            <select
              value={formData.headId}
              onChange={(e) => setFormData({ ...formData, headId: e.target.value })}
              className="input"
            >
              <option value="">Select Department Head</option>
              {users?.filter((u: any) => u.role !== 'CLIENT').map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({roleLabels[u.role as keyof typeof roleLabels]})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : department ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stages Management Component
const StagesManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: stages, isLoading } = useQuery('stages', async () => {
    const res = await api.get('/stages');
    return res.data.data || [];
  });

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/stages/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Stage deleted successfully');
        queryClient.invalidateQueries('stages');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete stage');
      },
    }
  );

  const filteredStages = stages?.filter((s: any) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.type?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search stages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditingStage(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Stage
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredStages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No stages found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStages.map((stage: any) => (
                <tr key={stage.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stage.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stage.type || 'Standard'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stage.defaultWeight || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        stage.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {stage.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setEditingStage(stage);
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this stage?')) {
                          deleteMutation.mutate(stage.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <StageModal
          stage={editingStage}
          onClose={() => {
            setIsModalOpen(false);
            setEditingStage(null);
          }}
        />
      )}
    </div>
  );
};

// Stage Modal Component
const StageModal = ({ stage, onClose }: { stage: any; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: stage?.name || '',
    type: stage?.type || 'Standard',
    defaultWeight: stage?.defaultWeight || 0,
    isActive: stage?.isActive !== undefined ? stage.isActive : true,
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/stages', data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Stage created successfully');
        queryClient.invalidateQueries('stages');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create stage');
      },
    }
  );

  const updateMutation = useMutation(
    async (data: any) => {
      const res = await api.patch(`/stages/${stage.id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Stage updated successfully');
        queryClient.invalidateQueries('stages');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update stage');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      defaultWeight: parseFloat(formData.defaultWeight.toString()),
    };
    if (stage) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {stage ? 'Edit Stage' : 'Add New Stage'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Planning, Development, Testing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
              placeholder="Standard, Custom, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Weight</label>
            <input
              type="number"
              step="0.1"
              value={formData.defaultWeight}
              onChange={(e) => setFormData({ ...formData, defaultWeight: e.target.value })}
              className="input"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.isActive ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
              className="input"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : stage ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterManagementPage;


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
// Note: Plus and X were removed as they were unused
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';

const ProjectCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    customerId: '',
    managerId: '',
    departmentId: '',
    budget: '',
    startDate: '',
    endDate: '',
    stageIds: [] as string[],
    memberIds: [] as string[],
  });

  // Fetch data for dropdowns
  const { data: customers } = useQuery('customers', async () => {
    try {
      const res = await api.get('/customers');
      return res.data.data || [];
    } catch {
      return [];
    }
  });

  const { data: users } = useQuery('users', async () => {
    try {
      const res = await api.get('/users?isActive=true');
      return res.data.data || [];
    } catch {
      return [];
    }
  });

  const { data: departments } = useQuery('departments', async () => {
    try {
      const res = await api.get('/departments');
      return res.data.data || [];
    } catch {
      return [];
    }
  });

  const { data: stages } = useQuery('stages', async () => {
    try {
      const res = await api.get('/stages');
      return res.data.data || [];
    } catch {
      return [];
    }
  });

  // Filter managers from users
  const managers = users?.filter((u: any) => 
    ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(u.role)
  ) || [];

  // Filter team members (exclude clients)
  const teamMembers = users?.filter((u: any) => 
    u.role !== 'CLIENT' && u.isActive
  ) || [];

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.code.trim()) newErrors.code = 'Project code is required';
      if (!formData.name.trim()) newErrors.name = 'Project name is required';
      if (formData.budget && parseFloat(formData.budget) < 0) {
        newErrors.budget = 'Budget must be positive';
      }
    }

    if (step === 2) {
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (end < start) {
          newErrors.endDate = 'End date must be after start date';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create project mutation
  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/projects', data);
      return res.data.data;
    },
    {
      onSuccess: async (project) => {
        // Assign team members if selected
        if (formData.memberIds.length > 0) {
          try {
            await api.post(`/projects/${project.id}/members`, {
              userIds: formData.memberIds,
            });
          } catch (err) {
            console.error('Failed to assign members:', err);
          }
        }

        toast.success('Project created successfully!');
        queryClient.invalidateQueries('all-projects');
        navigate(`/projects/${project.id}`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create project');
      },
    }
  );

  const handleSubmit = () => {
    if (!validateStep(3)) return;

    const submitData = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      customerId: formData.customerId || null,
      managerId: formData.managerId || null,
      departmentId: formData.departmentId || null,
      budget: formData.budget ? parseFloat(formData.budget) : 0,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      stageIds: formData.stageIds,
    };

    createMutation.mutate(submitData);
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const toggleStage = (stageId: string) => {
    setFormData(prev => ({
      ...prev,
      stageIds: prev.stageIds.includes(stageId)
        ? prev.stageIds.filter(id => id !== stageId)
        : [...prev.stageIds, stageId],
    }));
  };

  const toggleMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter(id => id !== memberId)
        : [...prev.memberIds, memberId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="text-primary-600 hover:text-primary-700 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </button>
      </div>

      <div className="card max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
        <p className="text-gray-600 mb-6">Fill in the project details step by step</p>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[
              { number: 1, label: 'Basic Info' },
              { number: 2, label: 'Details' },
              { number: 3, label: 'Team & Stages' },
            ].map((step) => (
              <div key={step.number} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {currentStep > step.number ? (
                    <span className="text-white">✓</span>
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                </div>
                {step.number < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={`input ${errors.code ? 'border-red-500' : ''}`}
                placeholder="e.g., PRJ-2024-001"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.code}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">Unique identifier for the project</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="e.g., Website Redesign Project"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={4}
                placeholder="Describe the project objectives and scope..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (₹)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className={`input ${errors.budget ? 'border-red-500' : ''}`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.budget && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.budget}
                </p>
              )}
              {formData.budget && (
                <p className="mt-1 text-xs text-gray-500">
                  Budget: {formatCurrency(parseFloat(formData.budget) || 0)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Project Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="input"
              >
                <option value="">Select a customer (optional)</option>
                {customers?.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Manager
              </label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="input"
              >
                <option value="">Select a project manager (optional)</option>
                {managers.map((manager: any) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName} ({manager.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="input"
              >
                <option value="">Select a department (optional)</option>
                {departments?.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={`input ${errors.endDate ? 'border-red-500' : ''}`}
                  min={formData.startDate || undefined}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Team & Stages */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Stages
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 border border-gray-200 rounded-lg">
                {stages?.filter((s: any) => s.isActive).map((stage: any) => (
                  <label
                    key={stage.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.stageIds.includes(stage.id)}
                      onChange={() => toggleStage(stage.id)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{stage.name}</p>
                      <p className="text-xs text-gray-500">Weight: {stage.defaultWeight}%</p>
                    </div>
                  </label>
                ))}
              </div>
              {formData.stageIds.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">No stages selected. Stages can be added later.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assign Team Members
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 border border-gray-200 rounded-lg">
                {teamMembers.map((member: any) => (
                  <label
                    key={member.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.memberIds.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.email} • {member.role}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {formData.memberIds.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">No team members selected. Members can be added later.</p>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`btn btn-secondary ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Previous
          </button>

          <div className="flex gap-3">
            {currentStep < 3 ? (
              <button onClick={handleNext} className="btn btn-primary">
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isLoading}
                className="btn btn-primary inline-flex items-center"
              >
                {createMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Project
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreatePage;


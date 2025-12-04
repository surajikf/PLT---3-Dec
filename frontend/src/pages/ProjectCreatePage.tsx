import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import Breadcrumbs from '../components/Breadcrumbs';

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

  // Filter managers from users - with safety checks
  const managers = Array.isArray(users) 
    ? users.filter((u: any) => u && u.role && ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(u.role))
    : [];

  // Filter employees (exclude clients) - with safety checks
  const teamMembers = Array.isArray(users)
    ? users.filter((u: any) => u && u.role !== 'CLIENT' && u.isActive !== false)
    : [];

  // Format project code - remove invalid characters and format
  const formatProjectCode = (value: string): string => {
    // Remove all invalid characters (keep only alphanumeric, dashes, underscores)
    let formatted = value.replace(/[^A-Z0-9-_]/gi, '').toUpperCase();
    // Limit length
    if (formatted.length > 50) {
      formatted = formatted.substring(0, 50);
    }
    return formatted;
  };

  // Validate project code format
  const validateProjectCodeFormat = (code: string): string | null => {
    if (!code.trim()) {
      return 'Project code is required';
    }
    if (code.length < 3) {
      return 'Project code must be at least 3 characters';
    }
    if (code.length > 50) {
      return 'Project code must be 50 characters or less';
    }
    if (!/^[A-Z0-9-_]+$/i.test(code)) {
      return 'Project code can only contain letters, numbers, dashes (-), and underscores (_)';
    }
    return null;
  };

  // Validation - check only (doesn't set state to avoid infinite loops)
  const checkStepValid = (step: number): boolean => {
    if (step === 1) {
      const codeError = validateProjectCodeFormat(formData.code);
      if (codeError) return false;
      
      if (!formData.name.trim() || formData.name.trim().length < 3) {
        return false;
      }
      
      if (formData.budget) {
        const budgetNum = parseFloat(formData.budget);
        if (isNaN(budgetNum) || budgetNum < 0 || budgetNum > 1000000000) {
          return false;
        }
      }
    }

    if (step === 2) {
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (end < start) {
          return false;
        }
      }
    }

    return true;
  };

  // Validation - with state update (only call when actually validating)
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      const codeError = validateProjectCodeFormat(formData.code);
      if (codeError) newErrors.code = codeError;
      
      if (!formData.name.trim()) {
        newErrors.name = 'Project name is required';
      } else if (formData.name.trim().length < 3) {
        newErrors.name = 'Project name must be at least 3 characters';
      }
      
      if (formData.budget) {
        const budgetNum = parseFloat(formData.budget);
        if (isNaN(budgetNum)) {
          newErrors.budget = 'Budget must be a valid number';
        } else if (budgetNum < 0) {
          newErrors.budget = 'Budget must be positive';
        } else if (budgetNum > 1000000000) {
          newErrors.budget = 'Budget is too large (max: 1 billion)';
        }
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
        // Assign employees if selected
        if (formData.memberIds.length > 0) {
          try {
            await api.post(`/projects/${project.id}/members`, {
              userIds: formData.memberIds,
            });
          } catch (err) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Failed to assign members:', err);
            }
          }
        }

        toast.success('Project created successfully!');
        queryClient.invalidateQueries('all-projects');
        navigate(`/projects/${project.id}`);
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to create project';
        
        // If it's a code validation error, go back to step 1 and show the error
        if (errorMessage.toLowerCase().includes('code')) {
          setCurrentStep(1);
          setErrors({ code: errorMessage });
        }
        
        toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = () => {
    // Validate all steps before submitting
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      // If validation fails, go to the first step with errors
      if (!validateStep(1)) setCurrentStep(1);
      else if (!validateStep(2)) setCurrentStep(2);
      else setCurrentStep(3);
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Ensure code is properly formatted
    const formattedCode = formatProjectCode(formData.code.trim());
    if (!formattedCode || formattedCode.length < 3) {
      setCurrentStep(1);
      setErrors({ code: 'Project code is required and must be at least 3 characters' });
      toast.error('Please enter a valid project code');
      return;
    }

    const submitData = {
      code: formattedCode,
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

  // Auto-generate project code suggestion based on name
  const generateCodeSuggestion = (name: string): string => {
    if (!name || name.length < 3) return '';
    
    // Extract first letters of words, max 3-4 words
    const words = name.trim().split(/\s+/).slice(0, 4);
    const initials = words.map(w => w[0].toUpperCase()).join('');
    
    // Add year
    const year = new Date().getFullYear();
    
    // Create code: INITIALS-YEAR-001 format
    return `${initials}-${year}-001`;
  };

  // Handle project name change and suggest code
  const handleNameChange = (value: string) => {
    setFormData(prev => {
      // Auto-suggest code if code is empty or matches old suggestion pattern
      if (!prev.code || prev.code.match(/-\d{4}-\d{3}$/)) {
        const suggestion = generateCodeSuggestion(value);
        if (suggestion) {
          return { ...prev, name: value, code: suggestion };
        }
      }
      return { ...prev, name: value };
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Projects', path: '/projects' },
          { label: 'Create New Project' },
        ]}
      />

      <div className="card max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
          <p className="text-gray-600">Fill in the project details step by step. All required fields are marked with *</p>
        </div>

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
                onChange={(e) => {
                  const formatted = formatProjectCode(e.target.value);
                  setFormData({ ...formData, code: formatted });
                  // Clear error when user starts typing
                  if (errors.code) {
                    const codeError = validateProjectCodeFormat(formatted);
                    if (!codeError) {
                      setErrors({ ...errors, code: '' });
                    } else {
                      setErrors({ ...errors, code: codeError });
                    }
                  }
                }}
                onBlur={() => {
                  // Validate on blur
                  const codeError = validateProjectCodeFormat(formData.code);
                  setErrors(prev => ({ ...prev, code: codeError || '' }));
                }}
                className={`input ${errors.code ? 'border-red-500 focus:ring-red-500' : formData.code && !errors.code ? 'border-green-500 focus:ring-green-500' : ''}`}
                placeholder="e.g., PRJ-2024-001"
                maxLength={50}
                autoComplete="off"
              />
              {errors.code ? (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.code}
                </p>
              ) : formData.code && formData.code.length >= 3 ? (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Code format is valid
                </p>
              ) : formData.code ? (
                <p className="mt-1 text-sm text-amber-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Code must be at least 3 characters
                </p>
              ) : null}
              <p className="mt-1 text-xs text-gray-500">
                Use letters, numbers, dashes (-), and underscores (_). Example: PRJ-2024-001, WEB_DEV_2024
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  handleNameChange(e.target.value);
                  // Clear error when user starts typing
                  if (errors.name && e.target.value.trim().length >= 3) {
                    setErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                onBlur={() => {
                  if (!formData.name.trim()) {
                    setErrors(prev => ({ ...prev, name: 'Project name is required' }));
                  } else if (formData.name.trim().length < 3) {
                    setErrors(prev => ({ ...prev, name: 'Project name must be at least 3 characters' }));
                  } else {
                    setErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                className={`input ${errors.name ? 'border-red-500 focus:ring-red-500' : formData.name && formData.name.length >= 3 ? 'border-green-500 focus:ring-green-500' : ''}`}
                placeholder="e.g., Website Redesign Project"
                maxLength={200}
              />
              {errors.name ? (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.name}
                </p>
              ) : formData.name && formData.name.length >= 3 ? (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Name looks good
                </p>
              ) : formData.name ? (
                <p className="mt-1 text-sm text-amber-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Name must be at least 3 characters
                </p>
              ) : null}
              {formData.name && formData.name.length >= 3 && !formData.code && (
                <p className="mt-1 text-xs text-blue-600">
                  💡 Tip: Project code will be auto-generated based on the name
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                className={`input ${errors.budget ? 'border-red-500' : ''}`}
                placeholder="0.00"
                title="Enter project budget in your currency. Leave 0 if budget not set yet."
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
                onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                className="input"
              >
                <option value="">Select a customer (optional)</option>
                {Array.isArray(customers) && customers.map((customer: any) => (
                  customer && customer.id ? (
                    <option key={customer.id} value={customer.id}>
                      {customer.name || 'Unnamed Customer'}
                    </option>
                  ) : null
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Manager
              </label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData(prev => ({ ...prev, managerId: e.target.value }))}
                className="input"
              >
                <option value="">Select a project manager (optional)</option>
                {managers.length > 0 ? managers.map((manager: any) => (
                  manager && manager.id ? (
                    <option key={manager.id} value={manager.id}>
                      {manager.firstName || ''} {manager.lastName || ''} ({manager.role || 'No role'})
                    </option>
                  ) : null
                )) : (
                  <option disabled>No managers available</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                className="input"
              >
                <option value="">Select a department (optional)</option>
                {Array.isArray(departments) && departments.map((dept: any) => (
                  dept && dept.id ? (
                    <option key={dept.id} value={dept.id}>
                      {dept.name || 'Unnamed Department'}
                    </option>
                  ) : null
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
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, endDate: e.target.value }));
                    // Clear error when user changes date
                    if (errors.endDate && formData.startDate && e.target.value) {
                      const start = new Date(formData.startDate);
                      const end = new Date(e.target.value);
                      if (end >= start) {
                        setErrors(prev => ({ ...prev, endDate: '' }));
                      }
                    }
                  }}
                  onBlur={() => {
                    if (formData.startDate && formData.endDate) {
                      const start = new Date(formData.startDate);
                      const end = new Date(formData.endDate);
                      if (end < start) {
                        setErrors(prev => ({ ...prev, endDate: 'End date must be after start date' }));
                      } else {
                        setErrors(prev => ({ ...prev, endDate: '' }));
                      }
                    }
                  }}
                  className={`input ${errors.endDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                  min={formData.startDate || undefined}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.endDate}
                  </p>
                )}
                {formData.startDate && !formData.endDate && (
                  <p className="mt-1 text-xs text-gray-500">
                    Select an end date after {new Date(formData.startDate).toLocaleDateString()}
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
                {Array.isArray(stages) && stages
                  .filter((s: any) => s && s.isActive !== false)
                  .map((stage: any) => (
                    stage && stage.id ? (
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
                          <p className="text-sm font-medium text-gray-900">{stage.name || 'Unnamed Stage'}</p>
                          <p className="text-xs text-gray-500">Weight: {stage.defaultWeight || 0}%</p>
                        </div>
                      </label>
                    ) : null
                  ))}
                {(!Array.isArray(stages) || stages.length === 0) && (
                  <p className="col-span-2 text-sm text-gray-500 text-center py-4">No stages available</p>
                )}
              </div>
              {formData.stageIds.length === 0 && (
                <p className="mt-2 text-sm text-amber-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  No stages selected. You can add stages later, but it's recommended to select at least one.
                </p>
              )}
              {formData.stageIds.length > 0 && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {formData.stageIds.length} stage{formData.stageIds.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assign Employees
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 border border-gray-200 rounded-lg">
                {teamMembers.length > 0 ? teamMembers.map((member: any) => (
                  member && member.id ? (
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
                          {member.firstName || ''} {member.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.email || 'No email'} • {member.role || 'No role'}
                        </p>
                      </div>
                    </label>
                  ) : null
                )) : (
                  <p className="col-span-2 text-sm text-gray-500 text-center py-4">No employees available</p>
                )}
              </div>
              {formData.memberIds.length === 0 && (
                <p className="mt-2 text-sm text-amber-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  No employees selected. You can assign employees later from the project page.
                </p>
              )}
              {formData.memberIds.length > 0 && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {formData.memberIds.length} employee{formData.memberIds.length > 1 ? 's' : ''} selected
                </p>
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
              <button 
                onClick={handleNext} 
                className="btn btn-primary"
                disabled={!checkStepValid(currentStep)}
              >
                Next Step →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isLoading || !formData.code.trim() || !formData.name.trim()}
                className="btn btn-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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


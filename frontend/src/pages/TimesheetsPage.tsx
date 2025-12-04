import { useQuery, useMutation } from 'react-query';
import api from '../services/api';
import { Plus, Clock, Calendar, FileText, CheckCircle, XCircle, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { authService } from '../services/authService';
import { UserRole } from '../utils/roles';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import { format } from 'date-fns';
import Breadcrumbs from '../components/Breadcrumbs';

// Helper function to extract task name from description
const extractTaskName = (description: string | null | undefined): string => {
  if (!description) return '-';
  
  // Check if description contains "Task:" pattern
  const taskMatch = description.match(/Task:\s*(.+?)(?:\n|$)/i);
  if (taskMatch && taskMatch[1]) {
    return taskMatch[1].trim();
  }
  
  // Check for predefined task names in description
  const predefinedTasks = [
    'Content Writing', 'Content Research', 'UI/UX Design', 'Frontend Development',
    'Backend Development', 'Testing', 'Deployment', 'Bug Fixing'
  ];
  
  for (const task of predefinedTasks) {
    if (description.includes(task)) {
      return task;
    }
  }
  
  return '-';
};

// Helper function to get clean description (without task info and completion status)
const getCleanDescription = (description: string | null | undefined): string => {
  if (!description) return '-';
  
  // Remove task info and completion status lines
  let cleanDesc = description
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('Task:') && 
             !trimmed.startsWith('Complete Status:') &&
             trimmed.length > 0;
    })
    .join('\n')
    .trim();
  
  return cleanDesc || '-';
};

const TimesheetsPage = () => {
  const user = authService.getCurrentUser();
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [selectedTimesheets, setSelectedTimesheets] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    projectId: '',
    taskId: '',
    taskName: '', // For predefined task names
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    minutes: 0,
    description: '',
    isComplete: false,
  });

  const { data, refetch, isLoading, error } = useQuery(
    ['timesheets', currentPage, pageSize, statusFilter, projectFilter],
    async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      if (statusFilter) params.append('status', statusFilter);
      if (projectFilter) params.append('projectId', projectFilter);
      const res = await api.get(`/timesheets?${params.toString()}`);
      return {
        data: res.data.data || [],
        pagination: res.data.pagination || { page: 1, limit: pageSize, total: 0, pages: 1 },
      };
    },
    {
      onError: (error: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch timesheets:', error);
        }
        toast.error(error.response?.data?.error || 'Failed to load timesheets');
      },
      refetchOnWindowFocus: true,
      keepPreviousData: true,
    }
  );

  const timesheets = data?.data || [];
  const paginationInfo = data?.pagination || { page: 1, limit: pageSize, total: 0, pages: 1 };

  const { data: projectsData } = useQuery('projects-for-timesheets', async () => {
    const res = await api.get('/projects');
    return res.data.data;
  });

  // Fetch tasks when project is selected
  const { data: tasksData } = useQuery(
    ['tasks-for-timesheets', formData.projectId],
    async () => {
      if (!formData.projectId) return [];
      const res = await api.get(`/tasks?projectId=${formData.projectId}`);
      return res.data.data || [];
    },
    { enabled: !!formData.projectId }
  );

  // Calculate total hours from hours and minutes
  const totalHours = useMemo(() => {
    const hours = Number(formData.hours) || 0;
    const minutes = Number(formData.minutes) || 0;
    return hours + (minutes / 60);
  }, [formData.hours, formData.minutes]);

  // Calculate total hours and minutes for display
  const displayHours = useMemo(() => {
    const total = totalHours;
    const hrs = Math.floor(total);
    const mins = Math.round((total - hrs) * 60);
    return { hours: hrs, minutes: mins };
  }, [totalHours]);

  // Get hours logged for selected date (DCR - Daily Completion Report)
  const hoursForDate = useMemo(() => {
    if (!formData.date || !timesheets) return 0;
    const dateStr = formData.date;
    return timesheets
      .filter((ts: any) => format(new Date(ts.date), 'yyyy-MM-dd') === dateStr)
      .reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0);
  }, [formData.date, timesheets]);

  const createTimesheetMutation = useMutation(
    async (payload: any) => {
      const res = await api.post('/timesheets', payload);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Timesheet submitted successfully');
        setShowModal(false);
        setFormData({
          projectId: '',
          taskId: '',
          taskName: '',
          date: new Date().toISOString().split('T')[0],
          hours: 0,
          minutes: 0,
          description: '',
          isComplete: false,
        });
        setCurrentPage(1); // Reset to first page to see the new entry
        refetch();
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to submit timesheet';
      toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.projectId) {
      toast.error('Please select a project');
      return;
    }
    if (!formData.taskId && !formData.taskName) {
      toast.error('Please select a task or enter task name');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (totalHours < 0.5) {
      toast.error('Minimum time required is 30 minutes (0.5 hours)');
      return;
    }
    if (totalHours > 24) {
      toast.error('Total time cannot exceed 24 hours');
      return;
    }

    const selectedTask = tasksData?.find((t: any) => t.id === formData.taskId);
    const taskInfo = selectedTask ? `Task: ${selectedTask.title}` : '';
    const completeStatus = formData.isComplete ? 'Yes' : 'No';
    
    // Combine description with task and completion status
    const fullDescription = `${formData.description}\n${taskInfo}\nComplete Status: ${completeStatus}`;

    createTimesheetMutation.mutate({
      projectId: formData.projectId,
      date: formData.date,
      hours: totalHours,
      description: fullDescription,
      status: 'SUBMITTED', // Submit directly for approval
    });
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/timesheets/${id}/approve`);
      toast.success('Timesheet approved');
      refetch();
    } catch (error: any) {
      const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to approve timesheet';
      toast.error(errorMessage);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      try {
        await api.post(`/timesheets/${id}/reject`, { reason });
        toast.success('Timesheet rejected');
        refetch();
      } catch (error: any) {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to reject timesheet';
        toast.error(errorMessage);
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select submitted timesheets that can be approved/rejected
      const selectableIds = timesheets
        .filter((ts: any) => ts.status === 'SUBMITTED')
        .map((ts: any) => ts.id);
      setSelectedTimesheets(new Set(selectableIds));
    } else {
      setSelectedTimesheets(new Set());
    }
  };

  const handleSelectTimesheet = (id: string, checked: boolean, status: string) => {
    // Only allow selecting SUBMITTED timesheets
    if (checked && status !== 'SUBMITTED') {
      toast.error('Only submitted timesheets can be approved or rejected');
      return;
    }
    
    const newSelected = new Set(selectedTimesheets);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTimesheets(newSelected);
  };

  const handleBulkApprove = async () => {
    if (selectedTimesheets.size === 0) {
      toast.error('Please select at least one timesheet');
      return;
    }

    // Filter to only include SUBMITTED timesheets
    const submittedIds = timesheets
      .filter((ts: any) => selectedTimesheets.has(ts.id) && ts.status === 'SUBMITTED')
      .map((ts: any) => ts.id);

    if (submittedIds.length === 0) {
      toast.error('Please select only submitted timesheets. Only submitted timesheets can be approved.');
      // Clear selection of non-submitted timesheets
      setSelectedTimesheets(new Set());
      return;
    }

    // If some selected timesheets are not submitted, warn the user
    if (submittedIds.length < selectedTimesheets.size) {
      const nonSubmittedCount = selectedTimesheets.size - submittedIds.length;
      toast.error(`${nonSubmittedCount} selected timesheet(s) are not in submitted status and will be skipped.`);
    }

    try {
      const response = await api.post('/timesheets/bulk/approve', {
        ids: submittedIds,
      });
      toast.success(`Successfully approved ${response.data.data.approved} timesheet(s)`);
      setSelectedTimesheets(new Set());
      refetch();
    } catch (error: any) {
      const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to approve timesheets';
      toast.error(errorMessage);
      // Clear selection on error
      setSelectedTimesheets(new Set());
    }
  };

  const handleBulkReject = async () => {
    if (selectedTimesheets.size === 0) {
      toast.error('Please select at least one timesheet');
      return;
    }

    // Filter to only include SUBMITTED timesheets
    const submittedIds = timesheets
      .filter((ts: any) => selectedTimesheets.has(ts.id) && ts.status === 'SUBMITTED')
      .map((ts: any) => ts.id);

    if (submittedIds.length === 0) {
      toast.error('Please select only submitted timesheets. Only submitted timesheets can be rejected.');
      // Clear selection of non-submitted timesheets
      setSelectedTimesheets(new Set());
      return;
    }

    // If some selected timesheets are not submitted, warn the user
    if (submittedIds.length < selectedTimesheets.size) {
      const nonSubmittedCount = selectedTimesheets.size - submittedIds.length;
      toast.error(`${nonSubmittedCount} selected timesheet(s) are not in submitted status and will be skipped.`);
    }

    if (!confirm(`Are you sure you want to reject ${submittedIds.length} timesheet(s)?`)) {
      return;
    }

    try {
      const response = await api.post('/timesheets/bulk/reject', {
        ids: submittedIds,
        reason: 'Bulk rejected by manager',
      });
      toast.success(`Successfully rejected ${response.data.data.rejected} timesheet(s)`);
      setSelectedTimesheets(new Set());
      refetch();
    } catch (error: any) {
      const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to reject timesheets';
      toast.error(errorMessage);
      // Clear selection on error
      setSelectedTimesheets(new Set());
    }
  };

  // Check if all selectable timesheets are selected
  const selectableTimesheets = timesheets.filter((ts: any) => ts.status === 'SUBMITTED');
  const allSelected = selectableTimesheets.length > 0 && 
    selectableTimesheets.every((ts: any) => selectedTimesheets.has(ts.id));
  const someSelected = selectedTimesheets.size > 0 && !allSelected;

  // Clean up selection: remove any timesheets that are no longer SUBMITTED
  // This handles cases where status changes or timesheets are filtered out
  useEffect(() => {
    const validSelected = timesheets
      .filter((ts: any) => selectedTimesheets.has(ts.id) && ts.status === 'SUBMITTED')
      .map((ts: any) => ts.id);
    
    if (validSelected.length !== selectedTimesheets.size) {
      setSelectedTimesheets(new Set(validSelected));
    }
  }, [timesheets]);

  const canApprove = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role as UserRole);

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  // Generate minute options (0, 15, 30, 45)
  const minuteOptions = [0, 15, 30, 45];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Timesheets' }]} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Timesheets</h1>
          <p className="mt-1 text-sm text-gray-600">Log your work hours and track time spent on projects</p>
        </div>
        {user?.role !== UserRole.CLIENT && (
          <button 
            onClick={() => setShowModal(true)} 
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Log Time
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Log Time</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="input w-full"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {hoursForDate.toFixed(1)} Hours DCR Filled for this date.
                </p>
              </div>

              {/* Project Name Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Project Name <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="input w-full"
                  value={formData.projectId}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      projectId: e.target.value,
                      taskId: '', // Reset task when project changes
                      taskName: '' // Reset task name when project changes
                    });
                  }}
                >
                  <option value="">Select Project</option>
                  {projectsData?.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Name Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Task Name <span className="text-red-500">*</span>
                </label>
                {tasksData && tasksData.length > 0 ? (
                  <select
                    required
                    className="input w-full"
                    value={formData.taskId}
                    onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                    disabled={!formData.projectId}
                  >
                    <option value="">Select Task</option>
                    {tasksData.map((task: any) => (
                      <option key={task.id} value={task.id}>
                        {task.title} {task.status ? `(${task.status})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    required
                    className="input w-full"
                    value={formData.taskId || ''}
                    onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                    disabled={!formData.projectId}
                  >
                    <option value="">Select Task Type</option>
                    <optgroup label="Planning & Content">
                      <option value="content-writing">Content Writing</option>
                      <option value="content-research">Content Research & Planning</option>
                      <option value="content-editing">Content Editing & Proofreading</option>
                      <option value="seo-optimization">SEO Content Optimization</option>
                    </optgroup>
                    <optgroup label="Design Phase">
                      <option value="ui-ux-design">UI/UX Design</option>
                      <option value="wireframing">Wireframing</option>
                      <option value="prototype-design">Prototype Design</option>
                      <option value="design-review">Design Review</option>
                      <option value="asset-creation">Asset Creation</option>
                    </optgroup>
                    <optgroup label="Frontend Development">
                      <option value="frontend-development">Frontend Development</option>
                      <option value="html-css">HTML/CSS Implementation</option>
                      <option value="javascript-dev">JavaScript Development</option>
                      <option value="react-components">React Component Development</option>
                      <option value="responsive-design">Responsive Design Implementation</option>
                      <option value="state-management">Frontend State Management</option>
                      <option value="api-integration-fe">API Integration (Frontend)</option>
                    </optgroup>
                    <optgroup label="Backend Development">
                      <option value="backend-development">Backend Development</option>
                      <option value="database-design">Database Design</option>
                      <option value="api-development">API Development</option>
                      <option value="authentication">Authentication Implementation</option>
                      <option value="business-logic">Business Logic Implementation</option>
                      <option value="third-party-integration">Third-party Integration</option>
                    </optgroup>
                    <optgroup label="Testing">
                      <option value="unit-testing">Unit Testing</option>
                      <option value="integration-testing">Integration Testing</option>
                      <option value="functional-testing">Functional Testing</option>
                      <option value="uat">User Acceptance Testing (UAT)</option>
                      <option value="performance-testing">Performance Testing</option>
                      <option value="security-testing">Security Testing</option>
                      <option value="cross-browser-testing">Cross-browser Testing</option>
                      <option value="mobile-testing">Mobile Testing</option>
                      <option value="bug-fixing">Bug Fixing</option>
                      <option value="regression-testing">Regression Testing</option>
                    </optgroup>
                    <optgroup label="Deployment & Production">
                      <option value="environment-setup">Environment Setup</option>
                      <option value="ci-cd-setup">CI/CD Pipeline Setup</option>
                      <option value="deployment-prep">Deployment Preparation</option>
                      <option value="staging-deployment">Staging Deployment</option>
                      <option value="production-deployment">Production Deployment</option>
                      <option value="post-deployment-testing">Post-deployment Testing</option>
                      <option value="monitoring-setup">Production Monitoring Setup</option>
                      <option value="documentation">Documentation</option>
                      <option value="code-review">Code Review</option>
                    </optgroup>
                    <optgroup label="Maintenance">
                      <option value="production-support">Production Support</option>
                      <option value="performance-optimization">Performance Optimization</option>
                      <option value="feature-enhancement">Feature Enhancement</option>
                      <option value="server-maintenance">Server Maintenance</option>
                    </optgroup>
                  </select>
                )}
                {formData.projectId && (!tasksData || tasksData.length === 0) && (
                  <p className="mt-1 text-xs text-amber-600">
                    No tasks available for this project. Select a task type from the list above.
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  className="input w-full"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the work done in detail..."
                  title="Provide a clear description of the work completed. This helps managers understand what was accomplished."
                />
              </div>

              {/* Time Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hours</label>
                    <select
                      className="input w-full"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                    >
                      {hourOptions.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour} {hour === 1 ? 'Hour' : 'Hours'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minutes</label>
                    <select
                      className="input w-full"
                      value={formData.minutes}
                      onChange={(e) => setFormData({ ...formData, minutes: Number(e.target.value) })}
                    >
                      {minuteOptions.map((min) => (
                        <option key={min} value={min}>
                          {min} {min === 1 ? 'Minute' : 'Minutes'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Total Hours Display */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Hours
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <span className="text-2xl font-bold text-primary-600">
                      {displayHours.hours}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">
                      {displayHours.hours === 1 ? 'Hour' : 'Hours'}
                    </span>
                  </div>
                  <div className="text-gray-400">:</div>
                  <div className="flex-1">
                    <span className="text-2xl font-bold text-primary-600">
                      {displayHours.minutes}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">
                      {displayHours.minutes === 1 ? 'Minute' : 'Minutes'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ({totalHours.toFixed(2)} hours)
                  </div>
                </div>
              </div>

              {/* Complete Status Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Complete Status <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="isComplete"
                      value="yes"
                      checked={formData.isComplete === true}
                      onChange={() => setFormData({ ...formData, isComplete: true })}
                      className="mr-2 w-4 h-4 text-primary-600 focus:ring-primary-500"
                      required
                    />
                    <span className="text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="isComplete"
                      value="no"
                      checked={formData.isComplete === false}
                      onChange={() => setFormData({ ...formData, isComplete: false })}
                      className="mr-2 w-4 h-4 text-primary-600 focus:ring-primary-500"
                      required
                    />
                    <span className="text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createTimesheetMutation.isLoading}
                >
                  {createTimesheetMutation.isLoading ? 'Submitting...' : 'Submit Timesheet'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                  disabled={createTimesheetMutation.isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {canApprove && selectedTimesheets.size > 0 && (
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedTimesheets.size} timesheet(s) selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                className="btn btn-primary inline-flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Selected
              </button>
              <button
                onClick={handleBulkReject}
                className="btn btn-secondary inline-flex items-center bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Selected
              </button>
              <button
                onClick={() => setSelectedTimesheets(new Set())}
                className="btn btn-secondary"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <select
              className="input pl-10 w-full appearance-none bg-white"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <select
              className="input w-full appearance-none bg-white"
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Projects</option>
              {projectsData?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </select>
          </div>
          <div className="relative sm:w-32">
            <select
              className="input w-full appearance-none bg-white"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timesheets List */}
      <div className="card">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
            <p className="text-gray-500">Loading timesheets...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">Error loading timesheets</p>
            <p className="text-gray-400 text-sm mt-2">Please refresh the page</p>
            <button
              onClick={() => refetch()}
              className="mt-4 btn btn-primary"
            >
              Retry
            </button>
          </div>
        ) : timesheets && timesheets.length > 0 ? (
          <>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {canApprove && (
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Task Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Hours</th>
                    {canApprove && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cost</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    {canApprove && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timesheets.map((timesheet: any) => (
                  <tr key={timesheet.id} className={`hover:bg-primary-50/30 transition-colors duration-150 ${selectedTimesheets.has(timesheet.id) ? 'bg-primary-50' : ''}`}>
                    {canApprove && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTimesheets.has(timesheet.id)}
                          onChange={(e) => handleSelectTimesheet(timesheet.id, e.target.checked, timesheet.status)}
                          disabled={timesheet.status !== 'SUBMITTED'}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={timesheet.status !== 'SUBMITTED' ? `Only submitted timesheets can be selected. Current status: ${timesheet.status}` : 'Select timesheet'}
                        />
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(timesheet.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {timesheet.user?.firstName && timesheet.user?.lastName
                            ? `${timesheet.user.firstName} ${timesheet.user.lastName}`
                            : timesheet.user?.email || 'N/A'}
                        </span>
                        {timesheet.user?.email && timesheet.user?.firstName && timesheet.user?.lastName && (
                          <span className="text-xs text-gray-500">{timesheet.user.email}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timesheet.project?.name || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <span className="font-medium text-gray-700">
                        {extractTaskName(timesheet.description)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={getCleanDescription(timesheet.description)}>
                        {getCleanDescription(timesheet.description)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timesheet.hours.toFixed(2)}h
                    </td>
                    {canApprove && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timesheet.cost ? formatCurrency(timesheet.cost, { maximumFractionDigits: 2 }) : formatCurrency(0, { maximumFractionDigits: 2 })}
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          timesheet.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : timesheet.status === 'SUBMITTED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : timesheet.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {timesheet.status}
                      </span>
                    </td>
                    {canApprove && timesheet.status === 'SUBMITTED' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleApprove(timesheet.id)}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(timesheet.id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Reject
                        </button>
                      </td>
                    )}
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paginationInfo.pages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="flex items-center text-sm text-gray-700">
                  <span>
                    Showing <span className="font-medium">{(paginationInfo.page - 1) * paginationInfo.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}
                    </span>{' '}
                    of <span className="font-medium">{paginationInfo.total}</span> results
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={paginationInfo.page === 1}
                    className={`btn btn-secondary inline-flex items-center ${
                      paginationInfo.page === 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, paginationInfo.pages) }, (_, i) => {
                      let pageNum;
                      if (paginationInfo.pages <= 5) {
                        pageNum = i + 1;
                      } else if (paginationInfo.page <= 3) {
                        pageNum = i + 1;
                      } else if (paginationInfo.page >= paginationInfo.pages - 2) {
                        pageNum = paginationInfo.pages - 4 + i;
                      } else {
                        pageNum = paginationInfo.page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            paginationInfo.page === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(paginationInfo.pages, prev + 1))}
                    disabled={paginationInfo.page === paginationInfo.pages}
                    className={`btn btn-secondary inline-flex items-center ${
                      paginationInfo.page === paginationInfo.pages ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No timesheets found</p>
            <p className="text-gray-400 text-sm mt-2">
              {statusFilter || projectFilter 
                ? 'Try adjusting your filters' 
                : 'Click "Log Time" to create your first timesheet'}
            </p>
            {(statusFilter || projectFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setProjectFilter('');
                }}
                className="mt-4 btn btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetsPage;

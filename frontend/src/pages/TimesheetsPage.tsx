import { useQuery, useMutation } from 'react-query';
import api from '../services/api';
import { Plus, Clock, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { authService } from '../services/authService';
import { UserRole } from '../utils/roles';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import { format } from 'date-fns';

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
    'timesheets',
    async () => {
      const res = await api.get('/timesheets');
      return res.data.data || [];
    },
    {
      onError: (error: any) => {
        console.error('Failed to fetch timesheets:', error);
        toast.error(error.response?.data?.error || 'Failed to load timesheets');
      },
      refetchOnWindowFocus: true,
    }
  );

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
    if (!formData.date || !data) return 0;
    const dateStr = formData.date;
    return data
      .filter((ts: any) => format(new Date(ts.date), 'yyyy-MM-dd') === dateStr)
      .reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0);
  }, [formData.date, data]);

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
        refetch();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to submit timesheet');
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
      toast.error(error.response?.data?.error || 'Failed to approve timesheet');
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
        toast.error(error.response?.data?.error || 'Failed to reject timesheet');
      }
    }
  };

  const canApprove = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role as UserRole);

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  // Generate minute options (0, 15, 30, 45)
  const minuteOptions = [0, 15, 30, 45];

  return (
    <div className="space-y-6">
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
                      taskId: '' // Reset task when project changes
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
                  placeholder="Describe the work done..."
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

      {/* Timesheets List */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
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
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  {canApprove && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  {canApprove && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((timesheet: any) => (
                  <tr key={timesheet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(timesheet.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timesheet.project?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="font-medium text-gray-700">
                        {extractTaskName(timesheet.description)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={getCleanDescription(timesheet.description)}>
                        {getCleanDescription(timesheet.description)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timesheet.hours.toFixed(2)}h
                    </td>
                    {canApprove && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timesheet.cost ? formatCurrency(timesheet.cost, { maximumFractionDigits: 2 }) : formatCurrency(0, { maximumFractionDigits: 2 })}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
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
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No timesheets found</p>
            <p className="text-gray-400 text-sm mt-2">Click "Log Time" to create your first timesheet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetsPage;

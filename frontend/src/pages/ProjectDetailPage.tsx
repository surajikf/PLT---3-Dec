import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { ArrowLeft, Users, Clock, TrendingUp, AlertCircle, Plus, CheckCircle, Edit, Link as LinkIcon, FileText, Trash2, Save, X, Loader2, Calendar } from 'lucide-react';
import { formatCurrency, formatCurrencyTooltip } from '../utils/currency';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import { authService } from '../services/authService';
import { UserRole } from '../utils/roles';
import toast from 'react-hot-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Breadcrumbs from '../components/Breadcrumbs';
import { useTableSort } from '../utils/tableSort';
import ConfirmDialog from '../components/ConfirmDialog';
import Avatar from '../components/Avatar';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'stages' | 'team' | 'tasks' | 'resources' | 'timesheets'>('overview');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [teamMemberModalOpen, setTeamMemberModalOpen] = useState(false);
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

  const { data: project, isLoading, isError, error } = useQuery(
    ['project', id],
    async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data.data;
    },
    { 
      enabled: !!id,
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to load project';
        toast.error(errorMessage);
      },
      retry: 2,
    }
  );

  // Fetch both explicit tasks and tasks from timesheets
  const { data: explicitTasks } = useQuery(
    ['tasks', id],
    async () => {
      const res = await api.get(`/tasks?projectId=${id}`);
      return res.data.data || [];
    },
    { enabled: !!id }
  );

  // Fetch timesheets to extract tasks from them
  const { data: projectTimesheets } = useQuery(
    ['project-timesheets-for-tasks', id],
    async () => {
      const res = await api.get(`/timesheets?projectId=${id}`);
      return res.data.data || [];
    },
    { enabled: !!id }
  );

  // Determine user permissions (before early returns to ensure hooks are always called)
  const canEdit = !!(user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role as UserRole));
  const isEmployee = user?.role === UserRole.TEAM_MEMBER;
  const canViewFinancials = !!(user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role as UserRole));

  // Fetch employee's timesheet data for this project (must be before early returns)
  const { data: employeeTimesheets } = useQuery(
    ['employee-project-timesheets', id, user?.id],
    async () => {
      if (!id || !user?.id || !isEmployee) return [];
      const res = await api.get(`/timesheets?projectId=${id}`);
      const allTimesheets = res.data.data || [];
      // Filter to only this employee's timesheets
      return allTimesheets.filter((ts: any) => ts.userId === user.id || ts.user?.id === user.id);
    },
    { enabled: !!id && !!user?.id && isEmployee }
  );

  // Helper function to extract task name from timesheet description
  const extractTaskName = (description: string | null | undefined): string | null => {
    if (!description) return null;
    
    // Check if description contains "Task:" pattern
    const taskMatch = description.match(/Task:\s*(.+?)(?:\n|$)/i);
    if (taskMatch && taskMatch[1]) {
      return taskMatch[1].trim();
    }
    
    // Check for predefined task names in description
    const predefinedTasks = [
      'Content Writing', 'Content Research', 'UI/UX Design', 'Frontend Development',
      'Backend Development', 'Testing', 'Deployment', 'Bug Fixing', 'Code Review',
      'Database Design', 'API Integration', 'Mobile Development', 'Quality Assurance'
    ];
    
    for (const task of predefinedTasks) {
      if (description.includes(task)) {
        return task;
      }
    }
    
    return null;
  };

  // Combine explicit tasks with tasks extracted from timesheets
  const tasks = useMemo(() => {
    const taskMap = new Map();
    
    // Add explicit tasks first
    if (explicitTasks) {
      explicitTasks.forEach((task: any) => {
        taskMap.set(task.id, {
          ...task,
          fromTimesheet: false,
          timesheetCount: 0,
        });
      });
    }

    // Extract tasks from timesheets
    if (projectTimesheets) {
      projectTimesheets.forEach((timesheet: any) => {
        // Check if timesheet has a taskId and task object (if backend supports it)
        if (timesheet.taskId && timesheet.task) {
          if (!taskMap.has(timesheet.taskId)) {
            taskMap.set(timesheet.taskId, {
              ...timesheet.task,
              fromTimesheet: true,
              timesheetCount: 1,
            });
          } else {
            const existing = taskMap.get(timesheet.taskId);
            existing.timesheetCount = (existing.timesheetCount || 0) + 1;
            existing.fromTimesheet = true;
          }
        }
        // Extract task name from description
        else if (timesheet.description) {
          const taskName = extractTaskName(timesheet.description);
          if (taskName) {
            const taskKey = `timesheet-${taskName.toLowerCase().replace(/\s+/g, '-')}`;
            if (!taskMap.has(taskKey)) {
              taskMap.set(taskKey, {
                id: taskKey,
                title: taskName,
                description: `Task extracted from timesheet entries. Total hours logged: ${timesheet.hours || 0}`,
                status: 'IN_PROGRESS',
                priority: 'MEDIUM',
                fromTimesheet: true,
                timesheetCount: 1,
                totalHours: timesheet.hours || 0,
                assignedTo: timesheet.user,
                projectId: id,
                createdAt: timesheet.date,
              });
            } else {
              const existing = taskMap.get(taskKey);
              existing.timesheetCount = (existing.timesheetCount || 0) + 1;
              existing.totalHours = (existing.totalHours || 0) + (timesheet.hours || 0);
            }
          }
        }
      });
    }

    return Array.from(taskMap.values());
  }, [explicitTasks, projectTimesheets, id]);

  // Calculate employee metrics (must be before early returns)
  const employeeMetrics = useMemo(() => {
    if (!isEmployee || !employeeTimesheets) {
      return {
        totalHours: 0,
        approvedHours: 0,
        pendingHours: 0,
        timesheetCount: 0,
        tasksAssigned: 0,
      };
    }

    const totalHours = employeeTimesheets.reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0);
    const approvedHours = employeeTimesheets
      .filter((ts: any) => ts.status === 'APPROVED')
      .reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0);
    const pendingHours = employeeTimesheets
      .filter((ts: any) => ts.status === 'SUBMITTED' || ts.status === 'DRAFT')
      .reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0);
    
    // Count unique tasks assigned to employee
    const employeeTasks = tasks?.filter((t: any) => 
      t.assignedTo?.id === user?.id || t.assignedToId === user?.id
    ) || [];
    
    return {
      totalHours,
      approvedHours,
      pendingHours,
      timesheetCount: employeeTimesheets.length,
      tasksAssigned: employeeTasks.length,
    };
  }, [isEmployee, employeeTimesheets, tasks, user?.id]);

  const updateStageMutation = useMutation(
    async ({ projectStageId, status }: { projectStageId: string; status: string }) => {
      const res = await api.patch(`/projects/${id}/stages/${projectStageId}`, { status });
      return res.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        toast.success('Stage updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update stage');
      },
    }
  );

  const handleStageUpdate = async (projectStageId: string, newStatus: string) => {
    updateStageMutation.mutate({ projectStageId, status: newStatus });
  };

  // Calculate hours analytics for admins/managers (MUST be before early returns to follow Rules of Hooks)
  const hoursAnalytics = useMemo(() => {
    try {
      if (!canViewFinancials || !projectTimesheets || !Array.isArray(projectTimesheets) || projectTimesheets.length === 0) {
        return null;
      }

      const totalHours = projectTimesheets.reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0);
      const approvedHours = projectTimesheets
        .filter((ts: any) => ts.status === 'APPROVED')
        .reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0);
      const pendingHours = projectTimesheets
        .filter((ts: any) => ts.status === 'SUBMITTED' || ts.status === 'DRAFT')
        .reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0);
      const rejectedHours = projectTimesheets
        .filter((ts: any) => ts.status === 'REJECTED')
        .reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0);

      // Group hours by employee
      const hoursByEmployee = projectTimesheets.reduce((acc: any, ts: any) => {
        if (!ts) return acc;
        const userId = ts.userId || ts.user?.id;
        const userName = ts.user ? `${ts.user.firstName} ${ts.user.lastName}` : 'Unknown';
        if (!userId) return acc;
        
        if (!acc[userId]) {
          acc[userId] = {
            userId,
            userName,
            totalHours: 0,
            approvedHours: 0,
            pendingHours: 0,
            rejectedHours: 0,
            entries: 0,
          };
        }
        acc[userId].totalHours += ts.hours || 0;
        acc[userId].entries += 1;
        if (ts.status === 'APPROVED') acc[userId].approvedHours += ts.hours || 0;
        if (ts.status === 'SUBMITTED' || ts.status === 'DRAFT') acc[userId].pendingHours += ts.hours || 0;
        if (ts.status === 'REJECTED') acc[userId].rejectedHours += ts.hours || 0;
        return acc;
      }, {});

      const employeeHoursList = Object.values(hoursByEmployee).sort((a: any, b: any) => b.totalHours - a.totalHours);

      // Chart data for hours by status
      const hoursStatusData = [
        { name: 'Approved', value: approvedHours, fill: '#10b981' },
        { name: 'Pending', value: pendingHours, fill: '#f59e0b' },
        { name: 'Rejected', value: rejectedHours, fill: '#ef4444' },
      ].filter(item => item.value > 0);

      // Recent submissions (last 10)
      const recentSubmissions = [...projectTimesheets]
        .filter((ts: any) => ts && ts.date)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      return {
        totalHours,
        approvedHours,
        pendingHours,
        rejectedHours,
        employeeHoursList,
        hoursStatusData,
        recentSubmissions,
        totalEntries: projectTimesheets.length,
      };
    } catch (error) {
      console.error('Error calculating hours analytics:', error);
      return null;
    }
  }, [canViewFinancials, projectTimesheets]);

  // Table sorting for Hours by Employee (after hoursAnalytics is defined)
  const { sortedData: sortedEmployeeHours, SortableHeader: EmployeeHoursSortableHeader } = useTableSort({
    data: hoursAnalytics?.employeeHoursList || [],
    getValue: (item: any, field: string) => {
      switch (field) {
        case 'employee':
          return item.userName || '';
        case 'totalHours':
          return item.totalHours || 0;
        case 'approvedHours':
          return item.approvedHours || 0;
        case 'pendingHours':
          return item.pendingHours || 0;
        case 'rejectedHours':
          return item.rejectedHours || 0;
        case 'entries':
          return item.entries || 0;
        default:
          return (item as any)[field];
      }
    },
  });

  // Table sorting for Recent Submissions
  const { sortedData: sortedRecentSubmissions, SortableHeader: RecentSubmissionsSortableHeader } = useTableSort({
    data: hoursAnalytics?.recentSubmissions || [],
    getValue: (item: any, field: string) => {
      switch (field) {
        case 'date':
          return new Date(item.date).getTime();
        case 'employee':
          return item.user ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() || item.user.email || 'N/A' : 'N/A';
        case 'hours':
          return item.hours || 0;
        case 'status':
          return item.status || '';
        case 'description':
          return item.description || '';
        default:
          return (item as any)[field];
      }
    },
  });

  // Table sorting for Team Members (MUST be before early returns)
  const { sortedData: sortedTeamMembers, SortableHeader: TeamSortableHeader } = useTableSort({
    data: project?.members?.filter(Boolean) || [],
    getValue: (item: any, field: string) => {
      switch (field) {
        case 'name':
          return item.user ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() : 'N/A';
        case 'email':
          return item.user?.email || 'N/A';
        case 'role':
          return item.user?.role || 'N/A';
        case 'hourlyRate':
          return item.user?.hourlyRate || 0;
        default:
          return (item as any)[field];
      }
    },
  });

  // Calculate budget metrics (MUST be before early returns, using optional chaining)
  const budgetUtilization = project?.budget > 0 ? ((project.totalCost || 0) / project.budget) * 100 : 0;
  const isOverBudget = (project?.totalCost || 0) > (project?.budget || 0);
  const isAtRisk = budgetUtilization > 90;

  // Chart data for budget visualization (MUST be before early returns)
  const budgetData = [
    { name: 'Budget', value: project?.budget || 0, fill: '#3b82f6' },
    { name: 'Spent', value: project?.totalCost || 0, fill: isOverBudget ? '#ef4444' : '#10b981' },
  ];

  const progressData = project?.stages?.map((stage: any) => ({
    name: stage.stage.name,
    progress: stage.status === 'CLOSED' ? 100 : stage.status === 'IN_PROGRESS' ? 50 : 0,
  })) || [];

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
        <p className="text-gray-500">Loading project...</p>
      </div>
    );
  }

  if (isError) {
    const errorMessage = (error as any)?.userMessage || (error as any)?.response?.data?.error || 'Failed to load project';
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-900 font-semibold mb-2">Error loading project</p>
        <p className="text-gray-500 mb-4">{errorMessage}</p>
        <button onClick={() => navigate('/projects')} className="btn btn-primary">
          Back to Projects
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Project not found</p>
        <button onClick={() => navigate('/projects')} className="btn btn-primary">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Projects', path: '/projects' },
          { label: project.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/projects')} 
          className="text-primary-600 hover:text-primary-700 flex items-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </button>
        {canEdit && (
          <div className="flex gap-2">
            <button 
              onClick={() => navigate(`/master-management?tab=projects&edit=${id}`)}
              className="btn btn-secondary inline-flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Project
            </button>
          </div>
        )}
      </div>

      {/* Project Header - Reorganized */}
      <div className="card">
        {/* Project Title and Status Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap ${
                  project.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800'
                    : project.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : project.status === 'ON_HOLD'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-lg text-gray-600 font-medium mb-2">{project.code}</p>
            {project.description && (
              <p className="text-gray-700 leading-relaxed">{project.description}</p>
            )}
          </div>
        </div>

        {/* Project Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
          {project.customer && (
            <div className="flex items-start gap-2">
              <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
                <p className="text-sm font-semibold text-gray-900">{project.customer.name}</p>
              </div>
            </div>
          )}
          {project.manager && (
            <div className="flex items-start gap-2">
              <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex items-center gap-2">
                <Avatar
                  firstName={project.manager.firstName}
                  lastName={project.manager.lastName}
                  profilePicture={project.manager.profilePicture}
                  size="sm"
                />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Project Manager</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {project.manager.firstName} {project.manager.lastName}
                  </p>
                </div>
              </div>
            </div>
          )}
          {project.department && (
            <div className="flex items-start gap-2">
              <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
                <p className="text-sm font-semibold text-gray-900">{project.department.name}</p>
              </div>
            </div>
          )}
          {(project.startDate || project.endDate) && (
            <div className="flex items-start gap-2">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Timeline</p>
                <p className="text-sm font-semibold text-gray-900">
                  {project.startDate && new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {project.startDate && project.endDate && ' - '}
                  {project.endDate && new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {!project.startDate && !project.endDate && 'Not set'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics - Reorganized for Better Logic */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isEmployee ? (
            <>
              {/* Employee View - Personal Metrics First */}
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">My Hours Logged</p>
                <p className="text-2xl font-bold text-gray-900">{employeeMetrics.totalHours.toFixed(1)}h</p>
                <p className="text-xs text-gray-500 mt-1">
                  {employeeMetrics.approvedHours.toFixed(1)}h approved
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">My Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{employeeMetrics.tasksAssigned}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {tasks?.filter((t: any) => (t.assignedTo?.id === user?.id || t.assignedToId === user?.id) && t.status === 'DONE').length || 0} completed
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Timesheet Entries</p>
                <p className="text-2xl font-bold text-gray-900">{employeeMetrics.timesheetCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {employeeMetrics.pendingHours > 0 ? `${employeeMetrics.pendingHours.toFixed(1)}h pending` : 'All approved'}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Team Size</p>
                <p className="text-2xl font-bold text-gray-900">{project.members?.length || 0}</p>
                <p className="text-xs text-gray-500 mt-1">team members</p>
              </div>
            </>
          ) : (
            <>
              {/* Admin/Manager View - Financial Metrics in Logical Order */}
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Budget</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(project.budget || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Total allocated</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{project.calculatedProgress || 0}%</p>
                <p className="text-xs text-gray-500 mt-1">Completion rate</p>
              </div>
              <div className={`p-4 rounded-lg border-l-4 ${isOverBudget ? 'bg-red-50 border-red-500' : isAtRisk ? 'bg-yellow-50 border-yellow-500' : 'bg-gray-50 border-gray-400'}`}>
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className={`w-5 h-5 ${isOverBudget ? 'text-red-600' : isAtRisk ? 'text-yellow-600' : 'text-gray-600'}`} />
                </div>
                <p className="text-sm text-gray-600 mb-1">Spent</p>
                <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatCurrency(project.totalCost || 0)}
                </p>
                {isOverBudget ? (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Over Budget
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    {budgetUtilization.toFixed(1)}% utilized
                  </p>
                )}
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Health Score</p>
                <p className="text-2xl font-bold text-gray-900">{project.healthScore || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {project.healthScore && project.healthScore >= 70 ? 'Good' : project.healthScore && project.healthScore >= 50 ? 'Fair' : 'Needs attention'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'stages', label: 'Stages', icon: TrendingUp },
            { id: 'team', label: 'Team', icon: Users },
            { id: 'tasks', label: 'Tasks', icon: CheckCircle },
            { id: 'resources', label: 'Resources', icon: LinkIcon },
            { id: 'timesheets', label: 'Timesheets', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Main Content Grid - Unique content only, no repetition */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Admin/Manager: Budget Analysis Chart */}
              {canViewFinancials ? (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Budget vs. Actual Spending</h2>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={budgetData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrencyTooltip(value)} />
                      <Bar dataKey="value" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Remaining Budget</p>
                        <p className={`text-lg font-semibold ${(project.budget || 0) - (project.totalCost || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency((project.budget || 0) - (project.totalCost || 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Budget Utilization</p>
                        <p className={`text-lg font-semibold ${isAtRisk || isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                          {budgetUtilization.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    {/* Profit/Loss for Admins */}
                    {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && project.financials && (
                      <div className="pt-3 mt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Profit/Loss:</span>
                          <span className={`font-bold text-lg ${project.financials.isProfit ? 'text-green-600' : project.financials.isLoss ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatCurrency(project.financials.profitLoss || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">Margin:</span>
                          <span className={`text-sm font-semibold ${project.financials.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {project.financials.profitLossPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Employee View - Project Timeline & Information */
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Project Timeline</h2>
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    {project.startDate && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Start Date</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(project.startDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    {project.endDate && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Calendar className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Target End Date</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(project.endDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          {new Date(project.endDate) < new Date() && (
                            <p className="text-xs text-red-600 mt-1 flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Past due
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <Users className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Team Size</p>
                        <p className="font-semibold text-gray-900">
                          {project.members?.length || 0} {project.members?.length === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                    </div>
                    {project.department && (
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <Users className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Department</p>
                          <p className="font-semibold text-gray-900">{project.department.name}</p>
                        </div>
                      </div>
                    )}
                    {project.manager && (
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <Users className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Project Manager</p>
                          <p className="font-semibold text-gray-900">
                            {project.manager.firstName} {project.manager.lastName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stage Progress Chart - Shown for all roles */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Stage Progress</h2>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                {project.stages && project.stages.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                      {project.stages.slice(0, 4).map((stage: any) => (
                        <div key={stage.id} className="text-center">
                          <p className="text-xs text-gray-500 mb-1">{stage.stage.name}</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {stage.status === 'CLOSED' ? '100%' : stage.status === 'IN_PROGRESS' ? '50%' : '0%'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hours Submitted Analytics - Admin/Manager Only */}
            {hoursAnalytics && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Hours Submitted Analytics</h2>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs text-gray-600 mb-1">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{hoursAnalytics.totalHours.toFixed(1)}h</p>
                    <p className="text-xs text-gray-500 mt-1">{hoursAnalytics.totalEntries} entries</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <p className="text-xs text-gray-600 mb-1">Approved</p>
                    <p className="text-2xl font-bold text-green-700">{hoursAnalytics.approvedHours.toFixed(1)}h</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {hoursAnalytics.totalHours > 0 ? ((hoursAnalytics.approvedHours / hoursAnalytics.totalHours) * 100).toFixed(1) : 0}% of total
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <p className="text-xs text-gray-600 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700">{hoursAnalytics.pendingHours.toFixed(1)}h</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(projectTimesheets?.filter((ts: any) => ts.status === 'SUBMITTED' || ts.status === 'DRAFT') || []).length} entries
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <p className="text-xs text-gray-600 mb-1">Rejected</p>
                    <p className="text-2xl font-bold text-red-700">{hoursAnalytics.rejectedHours.toFixed(1)}h</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(projectTimesheets?.filter((ts: any) => ts.status === 'REJECTED') || []).length} entries
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Hours by Status Chart */}
                  {hoursAnalytics.hoursStatusData.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Hours by Status</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={hoursAnalytics.hoursStatusData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `${value.toFixed(1)}h`} />
                          <Bar dataKey="value" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Top Contributors */}
                  {hoursAnalytics.employeeHoursList.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
                      <div className="space-y-3">
                        {hoursAnalytics.employeeHoursList.slice(0, 5).map((emp: any, idx: number) => (
                          <div key={emp.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                                idx === 1 ? 'bg-gray-100 text-gray-800' :
                                idx === 2 ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{emp.userName}</p>
                                <p className="text-xs text-gray-500">{emp.entries} {emp.entries === 1 ? 'entry' : 'entries'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{emp.totalHours.toFixed(1)}h</p>
                              <p className="text-xs text-gray-500">
                                {emp.approvedHours.toFixed(1)}h approved
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Hours by Employee Table */}
                {hoursAnalytics.employeeHoursList.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hours by Employee</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <EmployeeHoursSortableHeader field="employee">Employee</EmployeeHoursSortableHeader>
                            <EmployeeHoursSortableHeader field="totalHours" className="text-right">Total Hours</EmployeeHoursSortableHeader>
                            <EmployeeHoursSortableHeader field="approvedHours" className="text-right">Approved</EmployeeHoursSortableHeader>
                            <EmployeeHoursSortableHeader field="pendingHours" className="text-right">Pending</EmployeeHoursSortableHeader>
                            <EmployeeHoursSortableHeader field="rejectedHours" className="text-right">Rejected</EmployeeHoursSortableHeader>
                            <EmployeeHoursSortableHeader field="entries" className="text-right">Entries</EmployeeHoursSortableHeader>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedEmployeeHours.map((emp: any) => (
                            <tr key={emp.userId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {emp.userName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                {emp.totalHours.toFixed(1)}h
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-green-700">
                                {emp.approvedHours.toFixed(1)}h
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-yellow-700">
                                {emp.pendingHours.toFixed(1)}h
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-red-700">
                                {emp.rejectedHours.toFixed(1)}h
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                                {emp.entries}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{hoursAnalytics.totalHours.toFixed(1)}h</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-green-700">{hoursAnalytics.approvedHours.toFixed(1)}h</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-yellow-700">{hoursAnalytics.pendingHours.toFixed(1)}h</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-red-700">{hoursAnalytics.rejectedHours.toFixed(1)}h</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{hoursAnalytics.totalEntries}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Recent Submissions */}
                {hoursAnalytics.recentSubmissions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <RecentSubmissionsSortableHeader field="date">Date</RecentSubmissionsSortableHeader>
                            <RecentSubmissionsSortableHeader field="employee">Employee</RecentSubmissionsSortableHeader>
                            <RecentSubmissionsSortableHeader field="hours" className="text-right">Hours</RecentSubmissionsSortableHeader>
                            <RecentSubmissionsSortableHeader field="status">Status</RecentSubmissionsSortableHeader>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedRecentSubmissions.map((ts: any) => (
                            <tr key={ts.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(ts.date), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {ts.user ? `${ts.user.firstName} ${ts.user.lastName}` : 'Unknown'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                {ts.hours.toFixed(2)}h
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  ts.status === 'APPROVED'
                                    ? 'bg-green-100 text-green-800'
                                    : ts.status === 'SUBMITTED'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : ts.status === 'REJECTED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {ts.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                                {ts.description || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Employee Cost Breakdown - Admin Only */}
            {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && project.employeeCosts && project.employeeCosts.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Employee Cost Breakdown</h2>
                  <Link to="/profit-loss" className="text-sm text-primary-600 hover:text-primary-700">
                    View Full P&L →
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hours Logged</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {project.employeeCosts.map((emp: any) => {
                        const percentageOfTotal = project.totalCost > 0 
                          ? (emp.totalCost / project.totalCost) * 100 
                          : 0;
                        return (
                          <tr key={emp.user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {emp.user.firstName} {emp.user.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{emp.user.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                              {formatCurrency(emp.user.hourlyRate || 0, { maximumFractionDigits: 2 })}/hr
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                              {emp.totalHours.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                              {formatCurrency(emp.totalCost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                              {percentageOfTotal.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                          Total:
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                          {formatCurrency(project.totalCost || 0)}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stages' && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Project Stages</h2>
            {project.stages && project.stages.length > 0 ? (
              <div className="space-y-4">
                {project.stages.map((projectStage: any) => (
                  <div key={projectStage.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{projectStage.stage.name}</h3>
                        <p className="text-sm text-gray-500">Weight: {projectStage.weight}%</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          projectStage.status === 'CLOSED'
                            ? 'bg-green-100 text-green-800'
                            : projectStage.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : projectStage.status === 'ON'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {projectStage.status.replace('_', ' ')}
                      </span>
                    </div>
                    {projectStage.completedDate && (
                      <p className="text-xs text-gray-500">Completed: {new Date(projectStage.completedDate).toLocaleDateString()}</p>
                    )}
                    {canEdit && (
                      <div className="mt-3 flex gap-2">
                        {projectStage.status === 'OFF' && (
                          <button
                            onClick={() => handleStageUpdate(projectStage.id, 'ON')}
                            className="btn btn-secondary text-sm"
                          >
                            Activate
                          </button>
                        )}
                        {projectStage.status === 'ON' && (
                          <>
                            <button
                              onClick={() => handleStageUpdate(projectStage.id, 'IN_PROGRESS')}
                              className="btn btn-primary text-sm"
                            >
                              Start Progress
                            </button>
                            <button
                              onClick={() => handleStageUpdate(projectStage.id, 'CLOSED')}
                              className="btn btn-success text-sm"
                            >
                              Close
                            </button>
                          </>
                        )}
                        {projectStage.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleStageUpdate(projectStage.id, 'CLOSED')}
                            className="btn btn-success text-sm"
                          >
                            Close Stage
                          </button>
                        )}
                        {projectStage.status === 'CLOSED' && (
                          <span className="text-sm text-gray-500 italic">Stage completed</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No stages configured</p>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Team Members</h2>
              {canEdit && (
                <button
                  onClick={() => setTeamMemberModalOpen(true)}
                  className="btn btn-primary inline-flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </button>
              )}
            </div>
            {project.members && Array.isArray(project.members) && project.members.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <TeamSortableHeader field="name">Name</TeamSortableHeader>
                      <TeamSortableHeader field="email">Email</TeamSortableHeader>
                      <TeamSortableHeader field="role">Role</TeamSortableHeader>
                      {canViewFinancials && (
                        <TeamSortableHeader field="hourlyRate">Hourly Rate</TeamSortableHeader>
                      )}
                      {canEdit && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedTeamMembers
                      .filter((member: any) => member && member.user) // Filter out invalid members
                      .map((member: any) => {
                      const user = member.user;
                      return (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar
                                firstName={user.firstName}
                                lastName={user.lastName}
                                profilePicture={user.profilePicture}
                                size="sm"
                              />
                              <span className="text-sm font-medium text-gray-900">
                                {user.firstName || ''} {user.lastName || ''}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.role ? (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                user.role === 'SUPER_ADMIN'
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.role === 'ADMIN'
                                  ? 'bg-blue-100 text-blue-800'
                                  : user.role === 'PROJECT_MANAGER'
                                  ? 'bg-green-100 text-green-800'
                                  : user.role === 'TEAM_MEMBER'
                                  ? 'bg-gray-100 text-gray-800'
                                  : user.role === 'CLIENT'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {String(user.role).replace('_', ' ')}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">Not assigned</span>
                            )}
                          </td>
                          {canViewFinancials && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.hourlyRate ? formatCurrency(user.hourlyRate, { maximumFractionDigits: 2 }) : 'N/A'}
                            </td>
                          )}
                          {canEdit && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Remove Employee',
                                    message: `Are you sure you want to remove ${user.firstName} ${user.lastName} from this project? They will no longer be able to log time for this project.`,
                                    type: 'warning',
                                    onConfirm: async () => {
                                      try {
                                        // Get current members and remove the selected one
                                        const currentMemberIds = (project?.members || [])
                                          .map((m: any) => m.userId || m.user?.id)
                                          .filter((memberId: string) => memberId !== (user.id || member.userId));
                                        
                                        // Update members list via API
                                        await api.post(`/projects/${id}/members`, { userIds: currentMemberIds });
                                        toast.success('Team member removed successfully');
                                        queryClient.invalidateQueries(['project', id]);
                                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                      } catch (error: any) {
                                        const errorMessage = error.response?.data?.error || 'Failed to remove team member';
                                        toast.error(errorMessage);
                                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                      }
                                    },
                                  });
                                }}
                                className="text-red-600 hover:text-red-700 font-medium"
                              >
                                Remove
                              </button>
                          </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No employees assigned</p>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {tasks && tasks.length > 0 
                    ? `${tasks.length} task${tasks.length > 1 ? 's' : ''} total`
                    : 'No tasks yet'}
                </p>
              </div>
              {canEdit && (
                <button 
                  onClick={() => {
                    setEditingTask(null);
                    setTaskModalOpen(true);
                  }}
                  className="btn btn-primary inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </button>
              )}
            </div>

            {tasks && tasks.length > 0 ? (
              <div className="space-y-6">
                {/* Explicit Tasks Section */}
                {tasks.filter((t: any) => !t.fromTimesheet).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Project Tasks</h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {tasks.filter((t: any) => !t.fromTimesheet).length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {tasks
                        .filter((t: any) => !t.fromTimesheet)
                        .map((task: any) => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            canEdit={!!canEdit}
                            onEdit={() => {
                              setEditingTask(task);
                              setTaskModalOpen(true);
                            }}
                            onDelete={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Delete Task',
                                message: 'Are you sure you want to delete this task? This action cannot be undone.',
                                type: 'danger',
                                onConfirm: () => {
                                  api.delete(`/tasks/${task.id}`).then(() => {
                                    toast.success('Task deleted successfully');
                                    queryClient.invalidateQueries(['tasks', id]);
                                    queryClient.invalidateQueries(['project', id]);
                                  }).catch((error: any) => {
                                    const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to delete task';
                                    toast.error(errorMessage);
                                  });
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                },
                              });
                            }}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Timesheet Tasks Section */}
                {tasks.filter((t: any) => t.fromTimesheet).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Tasks from Timesheets</h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {tasks.filter((t: any) => t.fromTimesheet).length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tasks
                        .filter((t: any) => t.fromTimesheet)
                        .sort((a: any, b: any) => (b.totalHours || 0) - (a.totalHours || 0))
                        .map((task: any) => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            canEdit={false}
                            isFromTimesheet={true}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Create a task to get started, or tasks will appear here when timesheets are logged for this project.
                </p>
                {canEdit && (
                  <button
                    onClick={() => {
                      setEditingTask(null);
                      setTaskModalOpen(true);
                    }}
                    className="btn btn-primary inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Task
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Resources</h2>
              {canEdit && (
                <button
                  onClick={() => {
                    setEditingResource(null);
                    setResourceModalOpen(true);
                  }}
                  className="btn btn-primary inline-flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </button>
              )}
            </div>
            {project.resources && project.resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.resources.map((resource: any) => (
                  <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{resource.name}</h3>
                      {canEdit && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingResource(resource);
                              setResourceModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Delete Resource',
                                message: 'Are you sure you want to delete this resource? This action cannot be undone.',
                                type: 'danger',
                                onConfirm: () => {
                                api.delete(`/resources/${resource.id}`).then(() => {
                                  toast.success('Resource deleted successfully');
                                  queryClient.invalidateQueries(['project', id]);
                                }).catch((error: any) => {
                                  const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to delete resource';
                                  toast.error(errorMessage);
                                });
                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                              },
                            });
                          }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{resource.type}</p>
                    {resource.description && <p className="text-sm text-gray-600 mb-2">{resource.description}</p>}
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm inline-flex items-center"
                      >
                        <LinkIcon className="w-4 h-4 mr-1" />
                        Access Resource
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No resources added yet</p>
            )}
          </div>
        )}

        {activeTab === 'timesheets' && (
          <ProjectTimesheetsTab projectId={id!} />
        )}
      </div>

      {/* Modals */}
      {taskModalOpen && (
        <TaskModal
          projectId={id!}
          task={editingTask}
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {resourceModalOpen && (
        <ResourceModal
          projectId={id!}
          resource={editingResource}
          onClose={() => {
            setResourceModalOpen(false);
            setEditingResource(null);
          }}
        />
      )}

      {teamMemberModalOpen && (
        <TeamMemberModal
          projectId={id!}
          existingMembers={project?.members?.map((m: any) => m.userId || m.user?.id) || []}
          onClose={() => setTeamMemberModalOpen(false)}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

// Project Timesheets Tab Component
const ProjectTimesheetsTab = ({ projectId }: { projectId: string }) => {
  const { data: timesheets, isLoading } = useQuery(
    ['project-timesheets', projectId],
    async () => {
      const res = await api.get(`/timesheets?projectId=${projectId}`);
      return res.data.data || [];
    }
  );

  const user = authService.getCurrentUser();
  const canViewCost = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role as UserRole);

  if (isLoading) {
    return (
      <div className="card">
        <p className="text-gray-500">Loading timesheets...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Timesheet History</h2>
        <span className="text-sm text-gray-500">
          {timesheets?.length || 0} {timesheets?.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      {timesheets && timesheets.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                {canViewCost && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timesheets.map((timesheet: any) => (
                <tr key={timesheet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(timesheet.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {timesheet.user.firstName} {timesheet.user.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {timesheet.hours.toFixed(2)}
                  </td>
                  {canViewCost && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {timesheet.user.hourlyRate
                        ? formatCurrency(timesheet.hours * timesheet.user.hourlyRate)
                        : 'N/A'}
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                    {timesheet.description || '-'}
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No timesheet entries for this project yet.</p>
      )}
    </div>
  );
};

// Task Modal Component
const TaskModal = ({ projectId, task, onClose }: { projectId: string; task: any; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO',
    priority: task?.priority || 'MEDIUM',
    assignedToId: task?.assignedToId || '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    stageId: task?.stageId || '',
  });
  const queryClient = useQueryClient();

  const { data: users } = useQuery('users-for-task', async () => {
    const res = await api.get('/users?isActive=true');
    return res.data.data || [];
  });

  const { data: stages } = useQuery(['project-stages', projectId], async () => {
    const res = await api.get(`/projects/${projectId}`);
    return res.data.data?.stages || [];
  });

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/tasks', { ...data, projectId });
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Task created successfully');
        queryClient.invalidateQueries(['tasks', projectId]);
        queryClient.invalidateQueries(['project', projectId]);
        onClose();
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to create task';
        toast.error(errorMessage);
      },
    }
  );

  const updateMutation = useMutation(
    async (data: any) => {
      const res = await api.patch(`/tasks/${task.id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Task updated successfully');
        queryClient.invalidateQueries(['tasks', projectId]);
        queryClient.invalidateQueries(['project', projectId]);
        onClose();
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to update task';
        toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      assignedToId: formData.assignedToId || null,
      dueDate: formData.dueDate || null,
      stageId: formData.stageId || null,
    };
    if (task) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
            />
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                className="input"
              >
                <option value="">Unassigned</option>
                {users?.filter((u: any) => u.role !== 'CLIENT').map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input"
              />
            </div>
            {stages && stages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={formData.stageId}
                  onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                  className="input"
                >
                  <option value="">No Stage</option>
                  {stages.map((ps: any) => (
                    <option key={ps.stage.id} value={ps.stage.id}>
                      {ps.stage.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Resource Modal Component
const ResourceModal = ({ projectId, resource, onClose }: { projectId: string; resource: any; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: resource?.name || '',
    description: resource?.description || '',
    type: resource?.type || 'Sitemap Documents',
    url: resource?.url || '',
    accessLevel: resource?.accessLevel || 'Team',
  });
  const queryClient = useQueryClient();

  const resourceTypes = [
    'Sitemap Documents',
    'Content Folders',
    'Design Assets',
    'Development Handoff Files',
    'QA Checklists',
    'Templates',
    'Libraries',
  ];

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/resources', { ...data, projectId });
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Resource created successfully');
        queryClient.invalidateQueries(['project', projectId]);
        onClose();
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to create resource';
        toast.error(errorMessage);
      },
    }
  );

  const updateMutation = useMutation(
    async (data: any) => {
      const res = await api.patch(`/resources/${resource.id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Resource updated successfully');
        queryClient.invalidateQueries(['project', projectId]);
        onClose();
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to update resource';
        toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resource) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{resource ? 'Edit Resource' : 'Add New Resource'}</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
            >
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="input"
              placeholder="https://..."
            />
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
            <select
              value={formData.accessLevel}
              onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
              className="input"
            >
              <option value="Team">Team</option>
              <option value="Public">Public</option>
              <option value="Restricted">Restricted</option>
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
              {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : resource ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Employee Modal Component
const TeamMemberModal = ({ projectId, existingMembers, onClose }: { projectId: string; existingMembers: string[]; onClose: () => void }) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: users } = useQuery('users-for-team', async () => {
    const res = await api.get('/users?isActive=true');
    return res.data.data || [];
  });

  const availableUsers = users?.filter((u: any) => u.role !== 'CLIENT' && !existingMembers.includes(u.id)) || [];

  const addMembersMutation = useMutation(
    async (userIds: string[]) => {
      // Combine existing members with new ones to avoid replacing
      const allMemberIds = [...existingMembers, ...userIds];
      const res = await api.post(`/projects/${projectId}/members`, { userIds: allMemberIds });
      return res.data;
    },
    {
      onSuccess: () => {
        toast.success('Employees added successfully');
        queryClient.invalidateQueries(['project', projectId]);
        onClose();
      },
      onError: (error: any) => {
        const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to add employees';
        toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    addMembersMutation.mutate(selectedUserIds);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Employees</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
            {availableUsers.length > 0 ? (
              availableUsers.map((user: any) => (
                <label
                  key={user.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="mr-3"
                  />
                  <Avatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    profilePicture={user.profilePicture}
                    size="sm"
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </label>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No available users to add</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
              disabled={addMembersMutation.isLoading || selectedUserIds.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {addMembersMutation.isLoading ? 'Adding...' : `Add ${selectedUserIds.length} Member(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Task Card Component
const TaskCard = ({ 
  task, 
  canEdit, 
  isFromTimesheet = false,
  onEdit,
  onDelete 
}: { 
  task: any; 
  canEdit: boolean; 
  isFromTimesheet?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  return (
    <div className={`card hover:shadow-lg transition-all duration-200 ${isFromTimesheet ? 'border-l-4 border-l-blue-500' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base">{task.title}</h3>
            {isFromTimesheet && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                From Timesheets
              </span>
            )}
            {task.timesheetCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full whitespace-nowrap">
                {task.timesheetCount} {task.timesheetCount > 1 ? 'entries' : 'entry'}
              </span>
            )}
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            {task.assignedTo && (
              <div className="flex items-center gap-1.5">
                <Avatar
                  firstName={task.assignedTo.firstName}
                  lastName={task.assignedTo.lastName}
                  profilePicture={task.assignedTo.profilePicture}
                  size="xs"
                />
                <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            {task.stage && (
              <div className="flex items-center gap-1">
                <span>Stage: {task.stage.name}</span>
              </div>
            )}
            {task.totalHours > 0 && (
              <div className="flex items-center gap-1 text-primary-600 font-semibold">
                <Clock className="w-3 h-3" />
                <span>{task.totalHours.toFixed(1)} hours</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 ml-4">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {task.priority && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                  task.priority === 'URGENT'
                    ? 'bg-red-100 text-red-800'
                    : task.priority === 'HIGH'
                    ? 'bg-orange-100 text-orange-800'
                    : task.priority === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {task.priority}
              </span>
            )}
            {task.status && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                  task.status === 'DONE'
                    ? 'bg-green-100 text-green-800'
                    : task.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800'
                    : task.status === 'BLOCKED'
                    ? 'bg-red-100 text-red-800'
                    : task.status === 'IN_REVIEW'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {task.status.replace('_', ' ')}
              </span>
            )}
          </div>
          {canEdit && !isFromTimesheet && onEdit && onDelete && (
            <div className="flex gap-1 mt-1">
              <button
                onClick={onEdit}
                className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                title="Edit task"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;

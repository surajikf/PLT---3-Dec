import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { ArrowLeft, Users, Clock, TrendingUp, AlertCircle, Plus, CheckCircle, Edit, Link as LinkIcon, FileText, Trash2, Save, X, Loader2 } from 'lucide-react';
import { formatCurrency, formatCurrencyTooltip } from '../utils/currency';
import { format } from 'date-fns';
import { useState } from 'react';
import { authService } from '../services/authService';
import { UserRole } from '../utils/roles';
import toast from 'react-hot-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Breadcrumbs from '../components/Breadcrumbs';

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

  const { data: project, isLoading } = useQuery(
    ['project', id],
    async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data.data;
    },
    { enabled: !!id }
  );

  const { data: tasks } = useQuery(
    ['tasks', id],
    async () => {
      const res = await api.get(`/tasks?projectId=${id}`);
      return res.data.data || [];
    },
    { enabled: !!id }
  );

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
        <p className="text-gray-500">Loading project...</p>
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

  const canEdit = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role as UserRole);
  const budgetUtilization = project.budget > 0 ? ((project.totalCost || 0) / project.budget) * 100 : 0;
  const isOverBudget = (project.totalCost || 0) > project.budget;
  const isAtRisk = budgetUtilization > 90;

  // Chart data for budget visualization
  const budgetData = [
    { name: 'Budget', value: project.budget || 0, fill: '#3b82f6' },
    { name: 'Spent', value: project.totalCost || 0, fill: isOverBudget ? '#ef4444' : '#10b981' },
  ];

  const progressData = project.stages?.map((stage: any) => ({
    name: stage.stage.name,
    progress: stage.status === 'CLOSED' ? 100 : stage.status === 'IN_PROGRESS' ? 50 : 0,
  })) || [];

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

      {/* Project Header */}
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <p className="text-gray-600 mb-4">{project.code}</p>
            {project.description && <p className="text-gray-700">{project.description}</p>}
          </div>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
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

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Budget</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(project.budget || 0)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Progress</p>
            <p className="text-2xl font-bold text-gray-900">{project.calculatedProgress || 0}%</p>
          </div>
          <div className={`p-4 rounded-lg ${isOverBudget ? 'bg-red-50' : isAtRisk ? 'bg-yellow-50' : 'bg-gray-50'}`}>
            <p className="text-sm text-gray-600 mb-1">Spent</p>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(project.totalCost || 0)}
            </p>
            {isOverBudget && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Over Budget
              </p>
            )}
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Health Score</p>
            <p className="text-2xl font-bold text-gray-900">{project.healthScore || 'N/A'}</p>
          </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Budget Visualization */}
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Budget vs. Actual</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrencyTooltip(value)} />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-semibold">{formatCurrency(project.budget || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Spent:</span>
                    <span className={`font-semibold ${isOverBudget ? 'text-red-600' : ''}`}>
                      {formatCurrency(project.totalCost || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className={`font-semibold ${(project.budget || 0) - (project.totalCost || 0) < 0 ? 'text-red-600' : ''}`}>
                      {formatCurrency((project.budget || 0) - (project.totalCost || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Utilization:</span>
                    <span className={`font-semibold ${isAtRisk || isOverBudget ? 'text-red-600' : ''}`}>
                      {budgetUtilization.toFixed(1)}%
                    </span>
                  </div>
                  {/* Profit/Loss for Admins */}
                  {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && project.financials && (
                    <>
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Profit/Loss:</span>
                          <span className={`font-bold text-lg ${project.financials.isProfit ? 'text-green-600' : project.financials.isLoss ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatCurrency(project.financials.profitLoss || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Margin:</span>
                          <span className={`text-sm font-semibold ${project.financials.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {project.financials.profitLossPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Chart */}
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Stage Progress</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

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
                        {projectStage.status !== 'CLOSED' && (
                          <>
                            <button
                              onClick={() => handleStageUpdate(projectStage.id, 'IN_PROGRESS')}
                              className="btn btn-secondary text-sm"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => handleStageUpdate(projectStage.id, 'CLOSED')}
                              className="btn btn-primary text-sm"
                            >
                              Close
                            </button>
                          </>
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
              <h2 className="text-xl font-bold">Employees</h2>
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
            {project.members && project.members.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
                      {canEdit && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {project.members.map((member: any) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.user.firstName} {member.user.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.user.hourlyRate ? formatCurrency(member.user.hourlyRate, { maximumFractionDigits: 2 }) : 'N/A'}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Remove Employee',
                                  message: `Are you sure you want to remove ${member.user.firstName} ${member.user.lastName} from this project? They will no longer be able to log time for this project.`,
                                  type: 'warning',
                                  onConfirm: () => {
                                    // API call to remove member would go here
                                    // For now, we'll need to create an endpoint or use project update
                                    toast.error('Remove member functionality requires backend endpoint');
                                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                  },
                                });
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No employees assigned</p>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Tasks</h2>
              {canEdit && (
                <button 
                  onClick={() => {
                    setEditingTask(null);
                    setTaskModalOpen(true);
                  }}
                  className="btn btn-primary inline-flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </button>
              )}
            </div>
            {tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task: any) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {task.assignedTo && (
                            <span>Assigned to: {task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                          )}
                          {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                          {task.stage && <span>Stage: {task.stage.name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
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
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.status === 'DONE'
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : task.status === 'BLOCKED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                        {canEdit && (
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => {
                                setEditingTask(task);
                                setTaskModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit task"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
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
                              className="text-red-600 hover:text-red-900"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No tasks yet. Create one to get started!</p>
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
          existingMembers={project?.members?.map((m: any) => m.userId) || []}
          onClose={() => setTeamMemberModalOpen(false)}
        />
      )}
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
      const res = await api.post(`/projects/${projectId}/members`, { userIds });
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

export default ProjectDetailPage;

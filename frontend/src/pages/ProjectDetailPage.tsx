import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { ArrowLeft, Users, Clock, TrendingUp, AlertCircle, Plus, CheckCircle, XCircle, Edit, Link as LinkIcon, FileText } from 'lucide-react';
import { RupeeIcon } from '../components/RupeeIcon';
import { formatCurrency, formatCurrencyTooltip } from '../utils/currency';
import { useState } from 'react';
import { authService } from '../services/authService';
import { UserRole } from '../utils/roles';
import toast from 'react-hot-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'stages' | 'team' | 'tasks' | 'resources' | 'timesheets'>('overview');

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
      // API call would go here - for now just update local state
      return { projectStageId, status };
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        toast.success('Stage updated successfully');
      },
    }
  );

  const handleStageUpdate = async (projectStageId: string, newStatus: string) => {
    updateStageMutation.mutate({ projectStageId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/projects')} className="text-primary-600 hover:text-primary-700 flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </button>
        {canEdit && (
          <button className="btn btn-primary inline-flex items-center">
            <Edit className="w-4 h-4 mr-2" />
            Edit Project
          </button>
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
              <h2 className="text-xl font-bold">Team Members</h2>
              {canEdit && (
                <button className="btn btn-primary inline-flex items-center text-sm">
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
                            <button className="text-red-600 hover:text-red-700">Remove</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No team members assigned</p>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Tasks</h2>
              {canEdit && (
                <button className="btn btn-primary inline-flex items-center text-sm">
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
                <button className="btn btn-primary inline-flex items-center text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </button>
              )}
            </div>
            {project.resources && project.resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.resources.map((resource: any) => (
                  <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-1">{resource.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{resource.type}</p>
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
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Timesheet History</h2>
            <p className="text-gray-500">Timesheet entries for this project will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;

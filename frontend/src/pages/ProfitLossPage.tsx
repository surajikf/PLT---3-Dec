import { useQuery } from 'react-query';
import api from '../services/api';
import { TrendingUp, TrendingDown, Users, Briefcase } from 'lucide-react';
import { RupeeIcon } from '../components/RupeeIcon';
import { formatCurrency, formatCurrencyTooltip } from '../utils/currency';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

const ProfitLossPage = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'employees'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Fetch P&L Dashboard
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'profit-loss-dashboard',
    async () => {
      const res = await api.get('/profit-loss/dashboard');
      return res.data.data;
    }
  );

  // Fetch all projects P&L
  const { data: projectsData, isLoading: projectsLoading } = useQuery(
    'all-projects-profit-loss',
    async () => {
      const res = await api.get('/profit-loss/projects');
      return res.data.data;
    }
  );

  // Fetch employee cost analysis
  const { data: employeesData, isLoading: employeesLoading } = useQuery(
    'employee-cost-analysis',
    async () => {
      const res = await api.get('/profit-loss/employees');
      return res.data.data;
    }
  );

  // Fetch detailed project P&L if selected
  const { data: projectDetail } = useQuery(
    ['project-profit-loss', selectedProjectId],
    async () => {
      if (!selectedProjectId) return null;
      const res = await api.get(`/profit-loss/projects/${selectedProjectId}`);
      return res.data.data;
    },
    { enabled: !!selectedProjectId }
  );

  if (dashboardLoading || projectsLoading || employeesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profit & loss data...</p>
      </div>
    );
  }

  const summary = dashboardData?.summary || {};
  const projects = projectsData?.projects || [];
  const employees = employeesData || [];

  // Prepare chart data
  const profitLossChartData = projects.slice(0, 10).map((p: any) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    profit: p.financials.profitLoss > 0 ? p.financials.profitLoss : 0,
    loss: p.financials.profitLoss < 0 ? Math.abs(p.financials.profitLoss) : 0,
    budget: p.financials.fixedProjectCost,
    actual: p.financials.totalActualCost,
  }));

  const projectStatusData = [
    { name: 'Profit', value: summary.profitProjects || 0, fill: '#10b981' },
    { name: 'Loss', value: summary.lossProjects || 0, fill: '#ef4444' },
    { name: 'Break Even', value: summary.breakEvenProjects || 0, fill: '#6b7280' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Management</h1>
          <p className="mt-2 text-gray-600">Track project costs, employee expenses, and financial performance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'projects', label: 'Projects', icon: Briefcase },
            { id: 'employees', label: 'Employee Costs', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedProjectId(null);
                }}
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

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(summary.totalFixedCost || 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <RupeeIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Actual Cost</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(summary.totalActualCost || 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className={`card ${(summary.totalProfitLoss || 0) >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Profit/Loss</p>
                  <p className={`text-2xl font-bold mt-1 ${(summary.totalProfitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.totalProfitLoss || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.totalFixedCost > 0 
                      ? `${((summary.totalProfitLoss / summary.totalFixedCost) * 100).toFixed(1)}% margin`
                      : 'N/A'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${(summary.totalProfitLoss || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {(summary.totalProfitLoss || 0) >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(summary.totalHours || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg: {summary.totalHours > 0 
                      ? formatCurrency(summary.totalActualCost / summary.totalHours, { maximumFractionDigits: 2 })
                      : formatCurrency(0)}/hr
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit/Loss by Project */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Profit & Loss by Project</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitLossChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value: number) => formatCurrencyTooltip(value)} />
                  <Legend />
                  <Bar dataKey="profit" fill="#10b981" name="Profit" />
                  <Bar dataKey="loss" fill="#ef4444" name="Loss" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Project Status Distribution */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Project Status Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {projectStatusData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Profit Projects */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Top Profit Projects</h2>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              {dashboardData?.topProfitProjects && dashboardData.topProfitProjects.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.topProfitProjects.map((project: any) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{project.name}</p>
                          <p className="text-sm text-gray-500">{project.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(project.profitLoss)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.budget > 0 
                              ? `${((project.profitLoss / project.budget) * 100).toFixed(1)}%`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No profit projects yet</p>
              )}
            </div>

            {/* Top Loss Projects */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Top Loss Projects</h2>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              {dashboardData?.topLossProjects && dashboardData.topLossProjects.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.topLossProjects.map((project: any) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{project.name}</p>
                          <p className="text-sm text-gray-500">{project.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            {formatCurrency(project.profitLoss)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.budget > 0 
                              ? `${((project.profitLoss / project.budget) * 100).toFixed(1)}%`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No loss projects</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">All Projects - Profit & Loss</h2>
          </div>
          {projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fixed Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit/Loss</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project: any) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <Link to={`/projects/${project.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                            {project.name}
                          </Link>
                          <p className="text-sm text-gray-500">{project.code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            project.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : project.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {project.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatCurrency(project.financials.fixedProjectCost || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatCurrency(project.financials.totalActualCost || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {(project.financials.totalHours || 0).toFixed(1)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${
                        project.financials.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(project.financials.profitLoss || 0)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${
                        project.financials.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {project.financials.profitLossPercentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm">
                        <button
                          onClick={() => setSelectedProjectId(project.id)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No projects found</p>
          )}
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Employee Cost Analysis</h2>
            {employees.length > 0 ? (
              <div className="space-y-6">
                {employees.map((employee: any) => (
                  <div key={employee.user.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {employee.user.firstName} {employee.user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{employee.user.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Hourly Rate: {formatCurrency(employee.user.hourlyRate || 0, { maximumFractionDigits: 0 })}/hr | 
                          Role: {employee.user.role}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Cost</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(employee.totalCost)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {employee.totalHours.toFixed(1)} hours
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Projects:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {employee.projects.map((proj: any) => (
                          <Link
                            key={proj.project.id}
                            to={`/projects/${proj.project.id}`}
                            className="p-2 border border-gray-200 rounded hover:bg-gray-50"
                          >
                            <p className="text-sm font-medium text-gray-900">{proj.project.name}</p>
                            <p className="text-xs text-gray-500">
                              {proj.hours.toFixed(1)}h × {formatCurrency(employee.user.hourlyRate || 0, { maximumFractionDigits: 0 })} = {formatCurrency(proj.cost)}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No employee data available</p>
            )}
          </div>
        </div>
      )}

      {/* Project Detail Modal/View */}
      {selectedProjectId && projectDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{projectDetail.project.name}</h2>
                  <p className="text-gray-500">{projectDetail.project.code}</p>
                </div>
                <button
                  onClick={() => setSelectedProjectId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Financial Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Fixed Cost</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(projectDetail.financials.fixedProjectCost || 0)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Actual Cost</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(projectDetail.financials.totalActualCost || 0)}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${projectDetail.financials.isProfit ? 'bg-green-50' : projectDetail.financials.isLoss ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className="text-sm text-gray-600">Profit/Loss</p>
                  <p className={`text-xl font-bold ${projectDetail.financials.isProfit ? 'text-green-600' : projectDetail.financials.isLoss ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(projectDetail.financials.profitLoss || 0)}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-xl font-bold text-gray-900">
                    {(projectDetail.financials.totalHours || 0).toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Employee Costs */}
              <div>
                <h3 className="text-lg font-bold mb-4">Cost Breakdown by Employee</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projectDetail.employeeCosts.map((emp: any) => (
                        <tr key={emp.user.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">
                                {emp.user.firstName} {emp.user.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{emp.user.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatCurrency(emp.user.hourlyRate || 0, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                            {emp.totalHours.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                            {formatCurrency(emp.totalCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLossPage;


import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../services/api';
import { BarChart3, Download } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportsToCSV } from '../utils/csvExport';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const [reportType, setReportType] = useState<'budget' | 'department'>('budget');

  const { data: budgetReport } = useQuery(
    'budget-report',
    async () => {
      const res = await api.get('/reports/budget');
      return res.data.data;
    },
    { enabled: reportType === 'budget' }
  );

  const { data: departmentReport } = useQuery(
    'department-report',
    async () => {
      const res = await api.get('/reports/department');
      return res.data.data;
    },
    { enabled: reportType === 'department' }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Reports</h1>

      <div className="card">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setReportType('budget')}
            className={`btn ${reportType === 'budget' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Budget Report
          </button>
          <button
            onClick={() => setReportType('department')}
            className={`btn ${reportType === 'department' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Department Report
          </button>
        </div>

        {reportType === 'budget' && budgetReport && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Budget Overview</h2>
              <button
                onClick={() => {
                  exportReportsToCSV(budgetReport, 'budget');
                  toast.success('Budget report exported successfully');
                }}
                className="btn btn-secondary inline-flex items-center text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(budgetReport.summary.totalBudget)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(budgetReport.summary.totalSpent)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-500">Over Budget</p>
                <p className="text-2xl font-bold text-red-600">{budgetReport.summary.overBudgetCount}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-500">At Risk</p>
                <p className="text-2xl font-bold text-yellow-600">{budgetReport.summary.atRiskCount}</p>
              </div>
            </div>

            {/* Budget vs Actual Chart */}
            {budgetReport.projects && budgetReport.projects.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Budget vs Actual by Project</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={budgetReport.projects.slice(0, 10).map((p: any) => ({
                    name: p.code.length > 10 ? p.code.substring(0, 10) + '...' : p.code,
                    Budget: p.budget || 0,
                    Spent: p.totalCost || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Budget" fill="#3b82f6" />
                    <Bar dataKey="Spent" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Projects Table */}
            {budgetReport.projects && budgetReport.projects.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spent</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Utilization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {budgetReport.projects.map((project: any) => {
                        const utilization = project.budget ? ((project.totalCost || 0) / project.budget) * 100 : 0;
                        const isOverBudget = (project.totalCost || 0) > project.budget;
                        return (
                          <tr key={project.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="font-medium text-gray-900">{project.code}</p>
                                <p className="text-sm text-gray-500">{project.name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                              {formatCurrency(project.budget || 0)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${isOverBudget ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                              {formatCurrency(project.totalCost || 0)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${(project.budget || 0) - (project.totalCost || 0) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatCurrency((project.budget || 0) - (project.totalCost || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <span className={utilization > 100 ? 'text-red-600 font-semibold' : utilization > 90 ? 'text-yellow-600' : 'text-gray-900'}>
                                {utilization.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {project.status?.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {reportType === 'department' && departmentReport && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Department Overview</h2>
              <button
                onClick={() => {
                  exportReportsToCSV(departmentReport, 'department');
                  toast.success('Department report exported successfully');
                }}
                className="btn btn-secondary inline-flex items-center text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
            {departmentReport.departments && departmentReport.departments.length > 0 ? (
              <>
                {/* Department Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Departments</p>
                    <p className="text-2xl font-bold">{departmentReport.departments.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Projects</p>
                    <p className="text-2xl font-bold">
                      {departmentReport.departments.reduce((sum: number, d: any) => sum + (d.projectCount || 0), 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Budget</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(departmentReport.departments.reduce((sum: number, d: any) => sum + (d.totalBudget || 0), 0))}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(departmentReport.departments.reduce((sum: number, d: any) => sum + (d.totalSpent || 0), 0))}
                    </p>
                  </div>
                </div>

                {/* Department Budget Pie Chart */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Budget Distribution by Department</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={departmentReport.departments.map((d: any) => ({
                          name: d.name,
                          value: d.totalBudget || 0,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentReport.departments.map((entry: any, index: number) => {
                          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Department Table */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Department Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Head</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Projects</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spent</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {departmentReport.departments.map((dept: any) => (
                          <tr key={dept.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{dept.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                              {dept.projectCount || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                              {formatCurrency(dept.totalBudget || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                              {formatCurrency(dept.totalSpent || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500">No department data available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;


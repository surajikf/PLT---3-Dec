import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../services/api';
import { Download, BarChart3, TrendingUp, AlertCircle, CheckCircle, Loader2, Building2 } from 'lucide-react';
import { RupeeIcon } from '../components/RupeeIcon';
import { formatCurrency } from '../utils/currency';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportsToCSV } from '../utils/csvExport';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const ReportsPage = () => {
  const [reportType, setReportType] = useState<'budget' | 'department'>('budget');

  const { data: budgetReport, isLoading: budgetLoading, error: budgetError } = useQuery(
    'budget-report',
    async () => {
      const res = await api.get('/reports/budget');
      return res.data.data;
    },
    { enabled: reportType === 'budget' }
  );

  const { data: departmentReport, isLoading: departmentLoading, error: departmentError } = useQuery(
    'department-report',
    async () => {
      const res = await api.get('/reports/department');
      return res.data.data;
    },
    { enabled: reportType === 'department' }
  );

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7'];

  return (
    <div className="space-y-6 pb-8">
      <Breadcrumbs items={[{ label: 'Reports' }]} />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Comprehensive insights into budget utilization and department performance</p>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 inline-flex gap-1">
        <button
          onClick={() => setReportType('budget')}
          className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
            reportType === 'budget'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <RupeeIcon className="w-4 h-4" />
            Budget Report
          </div>
        </button>
        <button
          onClick={() => setReportType('department')}
          className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
            reportType === 'department'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Department Report
          </div>
        </button>
      </div>

      {/* Budget Report */}
      {reportType === 'budget' && (
        <div className="space-y-6">
          {budgetLoading ? (
            <LoadingSkeleton />
          ) : budgetError ? (
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error loading budget report</p>
                  <p className="text-sm text-red-600 mt-1">Please try again later</p>
                </div>
              </div>
            </div>
          ) : budgetReport ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-700">Total Budget</p>
                    <RupeeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{formatCurrency(budgetReport.summary.totalBudget)}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-700">Total Spent</p>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-900">{formatCurrency(budgetReport.summary.totalSpent)}</p>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-red-700">Over Budget</p>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-900">{budgetReport.summary.overBudgetCount}</p>
                  <p className="text-xs text-red-600 mt-1">Projects</p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-yellow-700">At Risk</p>
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-yellow-900">{budgetReport.summary.atRiskCount}</p>
                  <p className="text-xs text-yellow-600 mt-1">Projects</p>
                </div>
              </div>

              {/* Chart Section */}
              {budgetReport.projects && budgetReport.projects.length > 0 && (
                <div className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Budget vs Actual by Project</h2>
                      <p className="text-sm text-gray-500">Comparison of allocated budget versus actual spending</p>
                    </div>
                    <button
                      onClick={() => {
                        exportReportsToCSV(budgetReport, 'budget');
                        toast.success('Budget report exported successfully');
                      }}
                      className="btn btn-secondary inline-flex items-center text-sm whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </button>
                  </div>
                  
                  <div className="w-full" style={{ minHeight: '400px' }}>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart 
                        data={budgetReport.projects.slice(0, 10).map((p: any) => ({
                          name: p.name && p.name.length > 20 ? p.name.substring(0, 20) + '...' : (p.name || p.code),
                          fullName: p.name || p.code,
                          Budget: p.budget || 0,
                          Spent: p.totalCost || 0,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="rect"
                        />
                        <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Budget" />
                        <Bar dataKey="Spent" fill="#10b981" radius={[4, 4, 0, 0]} name="Spent" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Projects Table */}
              {budgetReport.projects && budgetReport.projects.length > 0 && (
                <div className="card">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Project Details</h2>
                    <p className="text-sm text-gray-500">Detailed breakdown of budget utilization by project</p>
                  </div>
                  
                  <div className="overflow-x-auto -mx-6 px-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Project</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Budget</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Spent</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Remaining</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Utilization</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {budgetReport.projects.map((project: any) => {
                          const utilization = project.budget ? ((project.totalCost || 0) / project.budget) * 100 : 0;
                          const isOverBudget = (project.totalCost || 0) > project.budget;
                          const remaining = (project.budget || 0) - (project.totalCost || 0);
                          return (
                            <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div>
                                  <p className="font-semibold text-gray-900">{project.name}</p>
                                  <p className="text-sm text-gray-500 mt-0.5">{project.code}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right">
                                <span className="text-sm font-medium text-gray-900">{formatCurrency(project.budget || 0)}</span>
                              </td>
                              <td className={`px-4 py-4 whitespace-nowrap text-right ${isOverBudget ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                                <span className="text-sm font-medium">{formatCurrency(project.totalCost || 0)}</span>
                              </td>
                              <td className={`px-4 py-4 whitespace-nowrap text-right ${remaining < 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                                <span className="text-sm font-medium">{formatCurrency(remaining)}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        utilization > 100 ? 'bg-red-500' :
                                        utilization > 90 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(utilization, 100)}%` }}
                                    />
                                  </div>
                                  <span className={`text-sm font-medium min-w-[3rem] text-right ${
                                    utilization > 100 ? 'text-red-600' :
                                    utilization > 90 ? 'text-yellow-600' :
                                    'text-gray-900'
                                  }`}>
                                    {utilization.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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

              {(!budgetReport.projects || budgetReport.projects.length === 0) && (
                <EmptyState
                  icon={BarChart3}
                  title="No Budget Data Available"
                  description="There are no projects with budget information to display."
                />
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Department Report */}
      {reportType === 'department' && (
        <div className="space-y-6">
          {departmentLoading ? (
            <LoadingSkeleton />
          ) : departmentError ? (
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error loading department report</p>
                  <p className="text-sm text-red-600 mt-1">Please try again later</p>
                </div>
              </div>
            </div>
          ) : departmentReport && departmentReport.departments && departmentReport.departments.length > 0 ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-700">Total Departments</p>
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{departmentReport.departments.length}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-700">Total Projects</p>
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    {departmentReport.departments.reduce((sum: number, d: any) => sum + (d.projectCount || 0), 0)}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-purple-700">Total Budget</p>
                    <RupeeIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-900">
                    {formatCurrency(departmentReport.departments.reduce((sum: number, d: any) => sum + (d.totalBudget || 0), 0))}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-orange-700">Total Spent</p>
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-orange-900">
                    {formatCurrency(departmentReport.departments.reduce((sum: number, d: any) => sum + (d.totalSpent || 0), 0))}
                  </p>
                </div>
              </div>

              {/* Chart Section */}
              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Budget Distribution by Department</h2>
                    <p className="text-sm text-gray-500">Visual breakdown of budget allocation across departments</p>
                  </div>
                  <button
                    onClick={() => {
                      exportReportsToCSV(departmentReport, 'department');
                      toast.success('Department report exported successfully');
                    }}
                    className="btn btn-secondary inline-flex items-center text-sm whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </button>
                </div>
                
                <div className="w-full" style={{ minHeight: '450px' }}>
                  <ResponsiveContainer width="100%" height={450}>
                    <PieChart>
                      <Pie
                        data={departmentReport.departments
                          .map((d: any) => ({
                            name: d.name.length > 25 ? d.name.substring(0, 25) + '...' : d.name,
                            fullName: d.name,
                            value: d.totalBudget || 0,
                          }))
                          .filter((d: any) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                          if (percent >= 0.05) {
                            return `${(percent * 100).toFixed(0)}%`;
                          }
                          return '';
                        }}
                        outerRadius={120}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {departmentReport.departments
                          .filter((d: any) => (d.totalBudget || 0) > 0)
                          .map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: any, props: any) => [
                          formatCurrency(value),
                          props.payload.fullName || name
                        ]}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={50}
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                        formatter={(value: string) => {
                          const dept = departmentReport.departments.find((d: any) => {
                            const shortName = d.name.length > 25 ? d.name.substring(0, 25) + '...' : d.name;
                            return d.name === value || shortName === value;
                          });
                          if (dept) {
                            const total = departmentReport.departments.reduce((sum: number, d: any) => sum + (d.totalBudget || 0), 0);
                            const percent = total > 0 ? ((dept.totalBudget || 0) / total * 100) : 0;
                            return `${dept.name} (${percent.toFixed(1)}%)`;
                          }
                          return value;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Table */}
              <div className="card">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Department Details</h2>
                  <p className="text-sm text-gray-500">Comprehensive overview of department budgets and spending</p>
                </div>
                
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Head</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Projects</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Budget</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Spent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {departmentReport.departments.map((dept: any) => (
                        <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="font-semibold text-gray-900">{dept.name}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : <span className="text-gray-400">N/A</span>}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-gray-900">{dept.projectCount || 0}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(dept.totalBudget || 0)}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(dept.totalSpent || 0)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Building2}
              title="No Department Data Available"
              description="There are no departments with data to display."
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

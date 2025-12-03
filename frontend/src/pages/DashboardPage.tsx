import { useQuery } from 'react-query';
import api from '../services/api';
import { authService } from '../services/authService';
import { 
  FolderKanban, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  CheckCircle2,
  Activity,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DashboardPage = () => {
  const user = authService.getCurrentUser();
  const userRole = user?.role;

  // Fetch all data
  const { data: allProjects, isLoading: projectsLoading } = useQuery('all-projects', async () => {
    const res = await api.get('/projects');
    return res.data.data || [];
  });

  const { data: allTimesheets, isLoading: timesheetsLoading } = useQuery('all-timesheets', async () => {
    const res = await api.get('/timesheets');
    return res.data.data || [];
  });

  const { data: allUsers } = useQuery('all-users', async () => {
    try {
      const res = await api.get('/users');
      return res.data.data || [];
    } catch {
      return [];
    }
  });

  const isLoading = projectsLoading || timesheetsLoading;

  // Calculate statistics
  const totalProjects = allProjects?.length || 0;
  const activeProjects = allProjects?.filter((p: any) => p.status === 'IN_PROGRESS').length || 0;
  const completedProjects = allProjects?.filter((p: any) => p.status === 'COMPLETED').length || 0;
  const totalUsers = allUsers?.length || 0;
  
  const approvedTimesheets = allTimesheets?.filter((ts: any) => ts.status === 'APPROVED') || [];
  const pendingTimesheets = allTimesheets?.filter((ts: any) => ts.status === 'SUBMITTED').length || 0;
  const totalHours = approvedTimesheets.reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0);
  
  // Calculate total cost
  const totalCost = approvedTimesheets.reduce((sum: number, ts: any) => {
    const hourlyRate = ts.user?.hourlyRate || 0;
    return sum + (ts.hours || 0) * hourlyRate;
  }, 0);

  // Project Status Distribution for Pie Chart
  const projectStatusData = [
    { name: 'In Progress', value: allProjects?.filter((p: any) => p.status === 'IN_PROGRESS').length || 0 },
    { name: 'Completed', value: allProjects?.filter((p: any) => p.status === 'COMPLETED').length || 0 },
    { name: 'On Hold', value: allProjects?.filter((p: any) => p.status === 'ON_HOLD').length || 0 },
    { name: 'Planning', value: allProjects?.filter((p: any) => p.status === 'PLANNING').length || 0 },
  ].filter(item => item.value > 0);

  // Timesheet Status Distribution
  const timesheetStatusData = [
    { name: 'Approved', value: allTimesheets?.filter((ts: any) => ts.status === 'APPROVED').length || 0 },
    { name: 'Submitted', value: allTimesheets?.filter((ts: any) => ts.status === 'SUBMITTED').length || 0 },
    { name: 'Draft', value: allTimesheets?.filter((ts: any) => ts.status === 'DRAFT').length || 0 },
    { name: 'Rejected', value: allTimesheets?.filter((ts: any) => ts.status === 'REJECTED').length || 0 },
  ].filter(item => item.value > 0);

  // Hours logged over last 7 days
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const hoursByDay = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayTimesheets = approvedTimesheets.filter((ts: any) => 
      format(new Date(ts.date), 'yyyy-MM-dd') === dayStr
    );
    const hours = dayTimesheets.reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0);
    return {
      date: format(day, 'MMM dd'),
      hours: hours,
      fullDate: dayStr
    };
  });

  // Top Projects by Hours
  const projectHoursMap: Record<string, number> = {};
  approvedTimesheets.forEach((ts: any) => {
    const projectName = ts.project?.name || 'Unknown';
    projectHoursMap[projectName] = (projectHoursMap[projectName] || 0) + (ts.hours || 0);
  });

  const topProjectsByHours = Object.entries(projectHoursMap)
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  // Budget Utilization (if projects have budget data)
  const budgetData = allProjects
    ?.filter((p: any) => p.budget && p.budget > 0)
    .map((p: any) => {
      const projectTimesheets = approvedTimesheets.filter((ts: any) => ts.projectId === p.id);
      const spent = projectTimesheets.reduce((sum: number, ts: any) => {
        const hourlyRate = ts.user?.hourlyRate || 0;
        return sum + (ts.hours || 0) * hourlyRate;
      }, 0);
      const utilization = (spent / p.budget) * 100;
      return {
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        budget: p.budget,
        spent: spent,
        remaining: p.budget - spent,
        utilization: Math.min(utilization, 100)
      };
    })
    .slice(0, 6) || [];

  const stats = [
    {
      name: 'Total Projects',
      value: totalProjects,
      icon: FolderKanban,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Active Projects',
      value: activeProjects,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Total Hours',
      value: totalHours.toFixed(0),
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Total Cost',
      value: `$${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      change: '+15%',
      changeType: 'positive'
    },
    {
      name: 'Pending Timesheets',
      value: pendingTimesheets,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: pendingTimesheets > 0 ? 'Action needed' : 'All clear',
      changeType: pendingTimesheets > 0 ? 'warning' : 'positive'
    },
    {
      name: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: '+3',
      changeType: 'positive'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.firstName}! Here's what's happening today.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/reports"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hours Logged Over Time */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Hours Logged (Last 7 Days)</h2>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={hoursByDay}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Project Status Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Project Status</h2>
            <FolderKanban className="w-5 h-5 text-gray-400" />
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : projectStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">No project data available</div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Projects by Hours */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top Projects by Hours</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : topProjectsByHours.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProjectsByHours} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis dataKey="name" type="category" width={120} stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">No timesheet data available</div>
            </div>
          )}
        </div>

        {/* Timesheet Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Timesheet Status</h2>
            <CheckCircle2 className="w-5 h-5 text-gray-400" />
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : timesheetStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timesheetStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">No timesheet data available</div>
            </div>
          )}
        </div>
      </div>

      {/* Budget Utilization Chart */}
      {budgetData.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Budget Utilization by Project</h2>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'budget' || name === 'spent' || name === 'remaining') {
                    return [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="budget" stackId="a" fill="#e5e7eb" radius={[0, 0, 0, 0]} />
              <Bar dataKey="spent" stackId="a" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Budget Alerts */}
      {(() => {
        const projectsWithAlerts = allProjects?.filter((p: any) => {
          if (!p.budget || p.budget === 0) return false;
          const spent = p.totalCost || 0;
          const utilization = (spent / p.budget) * 100;
          return utilization >= 90 || spent > p.budget;
        }) || [];

        if (projectsWithAlerts.length === 0) return null;

        return (
          <div className="card border-l-4 border-yellow-500 bg-yellow-50">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-yellow-900 mb-2">Budget Alerts</h2>
                <div className="space-y-2">
                  {projectsWithAlerts.map((project: any) => {
                    const spent = project.totalCost || 0;
                    const utilization = (spent / project.budget) * 100;
                    const isOverBudget = spent > project.budget;
                    return (
                      <Link
                        key={project.id}
                        to={`/projects/${project.id}`}
                        className="block p-3 bg-white rounded-lg border border-yellow-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{project.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Budget: ${project.budget.toLocaleString()} | 
                              Spent: <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                                ${spent.toLocaleString()}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Utilization: <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                                {utilization.toFixed(1)}%
                              </span>
                            </p>
                          </div>
                          {isOverBudget ? (
                            <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex-shrink-0">
                              Over Budget
                            </span>
                          ) : (
                            <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex-shrink-0">
                              At Risk
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Recent Projects and Timesheets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
            <Link
              to="/projects"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all →
            </Link>
          </div>
          {isLoading ? (
            <div className="text-gray-500">Loading...</div>
          ) : allProjects && allProjects.length > 0 ? (
            <div className="space-y-3">
              {allProjects.slice(0, 5).map((project: any) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{project.name}</p>
                      <p className="text-sm text-gray-500">{project.code}</p>
                    </div>
                    <span
                      className={`ml-3 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                        project.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : project.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project.status?.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No projects found</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Timesheets</h2>
            <Link
              to="/timesheets"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all →
            </Link>
          </div>
          {isLoading ? (
            <div className="text-gray-500">Loading...</div>
          ) : allTimesheets && allTimesheets.length > 0 ? (
            <div className="space-y-3">
              {allTimesheets.slice(0, 5).map((timesheet: any) => (
                <div
                  key={timesheet.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {timesheet.project?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(timesheet.date), 'MMM dd, yyyy')} - {timesheet.hours}h
                      </p>
                    </div>
                    <span
                      className={`ml-3 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                        timesheet.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : timesheet.status === 'SUBMITTED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {timesheet.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No timesheets found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

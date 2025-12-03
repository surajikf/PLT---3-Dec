import { useQuery } from 'react-query';
import { useMemo, useState } from 'react';
import api from '../services/api';
import { authService } from '../services/authService';
import { 
  FolderKanban, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertCircle, 
  Users, 
  CheckCircle2,
  Activity,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { RupeeIcon } from '../components/RupeeIcon';
import { formatCurrency, formatCurrencyTooltip } from '../utils/currency';
import { Link } from 'react-router-dom';
import { 
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
  ResponsiveContainer
} from 'recharts';
import { format, subDays, eachDayOfInterval, isValid, parseISO, startOfWeek } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const DashboardPage = () => {
  const user = authService.getCurrentUser();

  // Fetch all data with error handling
  const { 
    data: allProjects, 
    isLoading: projectsLoading, 
    isError: projectsError,
    refetch: refetchProjects 
  } = useQuery('all-projects', async () => {
    const res = await api.get('/projects');
    return res.data.data || [];
  }, {
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to load projects');
    },
    retry: 2,
    refetchOnWindowFocus: false
  });

  const { 
    data: allTimesheets, 
    isLoading: timesheetsLoading,
    isError: timesheetsError,
    refetch: refetchTimesheets 
  } = useQuery('all-timesheets', async () => {
    const res = await api.get('/timesheets');
    return res.data.data || [];
  }, {
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to load timesheets');
    },
    retry: 2,
    refetchOnWindowFocus: false
  });

  const { 
    data: allUsers
  } = useQuery('all-users', async () => {
    const res = await api.get('/users');
    return res.data.data || [];
  }, {
    onError: () => {
      // Silently fail for users as it's not critical for dashboard
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  const isLoading = projectsLoading || timesheetsLoading;
  const hasError = projectsError || timesheetsError;

  // Memoized calculations with trend analysis and intelligent insights
  const dashboardData = useMemo(() => {
    const safeProjects = Array.isArray(allProjects) ? allProjects : [];
    const safeTimesheets = Array.isArray(allTimesheets) ? allTimesheets : [];
    const safeUsers = Array.isArray(allUsers) ? allUsers : [];

    const totalProjects = safeProjects.length;
    const activeProjects = safeProjects.filter((p: any) => p?.status === 'IN_PROGRESS').length;
    const completedProjects = safeProjects.filter((p: any) => p?.status === 'COMPLETED').length;
    const totalUsers = safeUsers.length;
    
    const approvedTimesheets = safeTimesheets.filter((ts: any) => ts?.status === 'APPROVED');
    const pendingTimesheets = safeTimesheets.filter((ts: any) => ts?.status === 'SUBMITTED').length;
    
    // Calculate total hours and cost
    const totalHours = approvedTimesheets.reduce((sum: number, ts: any) => {
      const hours = Number(ts?.hours) || 0;
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);
    
    const totalCost = approvedTimesheets.reduce((sum: number, ts: any) => {
      const hours = Number(ts?.hours) || 0;
      const hourlyRate = Number(ts?.user?.hourlyRate) || 0;
      return sum + (isNaN(hours) || isNaN(hourlyRate) ? 0 : hours * hourlyRate);
    }, 0);

    // Trend Analysis: Compare this week vs last week
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekStart, 1);

    const thisWeekHours = approvedTimesheets.reduce((sum: number, ts: any) => {
      if (!ts?.date) return sum;
      try {
        const tsDate = typeof ts.date === 'string' ? parseISO(ts.date) : new Date(ts.date);
        if (!isValid(tsDate)) return sum;
        if (tsDate >= thisWeekStart) {
          const hours = Number(ts?.hours) || 0;
          return sum + (isNaN(hours) ? 0 : hours);
        }
      } catch {
        return sum;
      }
      return sum;
    }, 0);

    const lastWeekHours = approvedTimesheets.reduce((sum: number, ts: any) => {
      if (!ts?.date) return sum;
      try {
        const tsDate = typeof ts.date === 'string' ? parseISO(ts.date) : new Date(ts.date);
        if (!isValid(tsDate)) return sum;
        if (tsDate >= lastWeekStart && tsDate <= lastWeekEnd) {
          const hours = Number(ts?.hours) || 0;
          return sum + (isNaN(hours) ? 0 : hours);
        }
      } catch {
        return sum;
      }
      return sum;
    }, 0);

    const hoursTrend = lastWeekHours > 0 
      ? ((thisWeekHours - lastWeekHours) / lastWeekHours) * 100 
      : thisWeekHours > 0 ? 100 : 0;

    // Average hours per day this week
    const avgHoursPerDay = thisWeekHours / 7;

    // Calculate average hourly rate
    const avgHourlyRate = totalHours > 0 
      ? totalCost / totalHours 
      : 0;

    // Project completion rate
    const completionRate = totalProjects > 0 
      ? (completedProjects / totalProjects) * 100 
      : 0;

    // Intelligent Insights
    const insights = [];
    if (pendingTimesheets > 0) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        message: `${pendingTimesheets} timesheet${pendingTimesheets > 1 ? 's' : ''} pending approval`,
        action: 'Review Now',
        link: '/timesheets'
      });
    }

    const projectsWithAlerts = safeProjects.filter((p: any) => {
      const budget = Number(p?.budget);
      if (isNaN(budget) || budget === 0) return false;
      const spent = Number(p?.totalCost) || 0;
      const utilization = budget > 0 ? (spent / budget) * 100 : 0;
      return utilization >= 90;
    });

    if (projectsWithAlerts.length > 0) {
      insights.push({
        type: 'danger',
        icon: AlertTriangle,
        message: `${projectsWithAlerts.length} project${projectsWithAlerts.length > 1 ? 's' : ''} approaching budget limit`,
        action: 'View Details',
        link: '/projects'
      });
    }

    if (hoursTrend < -10 && thisWeekHours > 0) {
      insights.push({
        type: 'info',
        icon: TrendingDown,
        message: `Hours logged decreased by ${Math.abs(hoursTrend).toFixed(1)}% compared to last week`,
        action: null,
        link: null
      });
    } else if (hoursTrend > 10) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        message: `Great progress! Hours logged increased by ${hoursTrend.toFixed(1)}%`,
        action: null,
        link: null
      });
    }

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalUsers,
      approvedTimesheets,
      pendingTimesheets,
      totalHours,
      totalCost,
      thisWeekHours,
      lastWeekHours,
      hoursTrend,
      avgHoursPerDay,
      avgHourlyRate,
      completionRate,
      insights
    };
  }, [allProjects, allTimesheets, allUsers]);

  // Memoized chart data for performance
  const chartData = useMemo(() => {
    const safeProjects = Array.isArray(allProjects) ? allProjects : [];
    const safeTimesheets = Array.isArray(allTimesheets) ? allTimesheets : [];
    const approvedTimesheets = safeTimesheets.filter((ts: any) => ts?.status === 'APPROVED');

    // Project Status Distribution
    const projectStatusData = [
      { name: 'In Progress', value: safeProjects.filter((p: any) => p?.status === 'IN_PROGRESS').length },
      { name: 'Completed', value: safeProjects.filter((p: any) => p?.status === 'COMPLETED').length },
      { name: 'On Hold', value: safeProjects.filter((p: any) => p?.status === 'ON_HOLD').length },
      { name: 'Planning', value: safeProjects.filter((p: any) => p?.status === 'PLANNING').length },
    ].filter(item => item.value > 0);

    // Timesheet Status Distribution
    const timesheetStatusData = [
      { name: 'Approved', value: safeTimesheets.filter((ts: any) => ts?.status === 'APPROVED').length },
      { name: 'Submitted', value: safeTimesheets.filter((ts: any) => ts?.status === 'SUBMITTED').length },
      { name: 'Draft', value: safeTimesheets.filter((ts: any) => ts?.status === 'DRAFT').length },
      { name: 'Rejected', value: safeTimesheets.filter((ts: any) => ts?.status === 'REJECTED').length },
    ].filter(item => item.value > 0);

    // Hours logged over last 7 days with safe date handling
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    const hoursByDay = last7Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTimesheets = approvedTimesheets.filter((ts: any) => {
        if (!ts?.date) return false;
        try {
          const tsDate = typeof ts.date === 'string' ? parseISO(ts.date) : new Date(ts.date);
          if (!isValid(tsDate)) return false;
          return format(tsDate, 'yyyy-MM-dd') === dayStr;
        } catch {
          return false;
        }
      });
      const hours = dayTimesheets.reduce((sum: number, ts: any) => {
        const h = Number(ts?.hours) || 0;
        return sum + (isNaN(h) ? 0 : h);
      }, 0);
      return {
        date: format(day, 'MMM dd'),
        hours: Math.round(hours * 100) / 100, // Round to 2 decimals
        fullDate: dayStr
      };
    });

    // Top Projects by Hours
    const projectHoursMap: Record<string, number> = {};
    approvedTimesheets.forEach((ts: any) => {
      const projectName = ts?.project?.name || 'Unknown';
      const hours = Number(ts?.hours) || 0;
      if (!isNaN(hours)) {
        projectHoursMap[projectName] = (projectHoursMap[projectName] || 0) + hours;
      }
    });

    const topProjectsByHours = Object.entries(projectHoursMap)
      .map(([name, hours]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, hours: Math.round(hours * 100) / 100 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Budget Utilization with safe calculations
    const budgetData = safeProjects
      .filter((p: any) => {
        const budget = Number(p?.budget);
        return !isNaN(budget) && budget > 0;
      })
      .map((p: any) => {
        const projectTimesheets = approvedTimesheets.filter((ts: any) => ts?.projectId === p?.id);
        const spent = projectTimesheets.reduce((sum: number, ts: any) => {
          const hours = Number(ts?.hours) || 0;
          const hourlyRate = Number(ts?.user?.hourlyRate) || 0;
          return sum + (isNaN(hours) || isNaN(hourlyRate) ? 0 : hours * hourlyRate);
        }, 0);
        const budget = Number(p.budget);
        const utilization = budget > 0 ? (spent / budget) * 100 : 0;
        return {
          name: (p?.name || 'Unknown').length > 15 ? (p.name.substring(0, 15) + '...') : (p.name || 'Unknown'),
          budget: budget,
          spent: Math.round(spent * 100) / 100,
          remaining: Math.round((budget - spent) * 100) / 100,
          utilization: Math.min(Math.max(utilization, 0), 100)
        };
      })
      .slice(0, 6);

    return {
      projectStatusData,
      timesheetStatusData,
      hoursByDay,
      topProjectsByHours,
      budgetData
    };
  }, [allProjects, allTimesheets]);

  const stats = useMemo(() => {
    const hoursTrendValue = Math.abs(dashboardData.hoursTrend || 0);
    const hoursTrendDirection = dashboardData.hoursTrend >= 0 ? 'up' : 'down';
    
    return [
      {
        name: 'Total Projects',
        value: dashboardData.totalProjects,
        icon: FolderKanban,
        color: 'text-blue-600',
        bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
        borderColor: 'border-blue-200',
        change: null,
        changeType: 'neutral',
        trend: null,
        description: `${dashboardData.activeProjects} active, ${dashboardData.completedProjects} completed`
      },
      {
        name: 'Active Projects',
        value: dashboardData.activeProjects,
        icon: Activity,
        color: 'text-green-600',
        bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
        borderColor: 'border-green-200',
        change: null,
        changeType: 'neutral',
        trend: null,
        description: `${dashboardData.completionRate.toFixed(1)}% completion rate`
      },
      {
        name: 'Total Hours',
        value: dashboardData.totalHours.toFixed(0),
        icon: Clock,
        color: 'text-purple-600',
        bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
        borderColor: 'border-purple-200',
        change: dashboardData.hoursTrend !== null ? `${hoursTrendValue.toFixed(1)}% ${hoursTrendDirection === 'up' ? '↑' : '↓'}` : null,
        changeType: dashboardData.hoursTrend >= 0 ? 'positive' : 'negative',
        trend: dashboardData.hoursTrend,
        description: `${dashboardData.avgHoursPerDay.toFixed(1)}h avg/day this week`
      },
      {
        name: 'Total Cost',
        value: formatCurrency(dashboardData.totalCost, { maximumFractionDigits: 0 }),
        icon: RupeeIcon,
        color: 'text-emerald-600',
        bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
        borderColor: 'border-emerald-200',
        change: dashboardData.avgHourlyRate > 0 ? `₹${dashboardData.avgHourlyRate.toFixed(0)}/hr avg` : null,
        changeType: 'neutral',
        trend: null,
        description: 'Based on approved timesheets'
      },
      {
        name: 'Pending Timesheets',
        value: dashboardData.pendingTimesheets,
        icon: AlertCircle,
        color: dashboardData.pendingTimesheets > 0 ? 'text-yellow-600' : 'text-green-600',
        bgColor: dashboardData.pendingTimesheets > 0 
          ? 'bg-gradient-to-br from-yellow-50 to-yellow-100' 
          : 'bg-gradient-to-br from-green-50 to-green-100',
        borderColor: dashboardData.pendingTimesheets > 0 ? 'border-yellow-200' : 'border-green-200',
        change: dashboardData.pendingTimesheets > 0 ? 'Action needed' : 'All clear',
        changeType: dashboardData.pendingTimesheets > 0 ? 'warning' : 'positive',
        trend: null,
        description: dashboardData.pendingTimesheets > 0 ? 'Requires review' : 'Everything approved'
      },
      {
        name: 'Total Users',
        value: dashboardData.totalUsers,
        icon: Users,
        color: 'text-indigo-600',
        bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
        borderColor: 'border-indigo-200',
        change: null,
        changeType: 'neutral',
        trend: null,
        description: 'Team members'
      },
    ];
  }, [dashboardData]);

  const handleRetry = () => {
    if (projectsError) refetchProjects();
    if (timesheetsError) refetchTimesheets();
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProjects(), refetchTimesheets()]);
      toast.success('Dashboard refreshed');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Optimized Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              <p className="text-sm text-gray-600">
                Welcome back, <span className="font-medium text-gray-900">{user?.firstName || 'User'}</span> • {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-2">
              {hasError && (
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 transition-colors"
                  aria-label="Retry loading data"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Retry
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing || isLoading}
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                aria-label="Refresh dashboard"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                to="/reports"
                className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors font-medium"
                aria-label="View detailed reports"
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                Reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {hasError && (
        <div className="card border-l-4 border-red-500 bg-red-50" role="alert">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900">Failed to load some data</h3>
              <p className="mt-1 text-sm text-red-700">
                Some dashboard data couldn't be loaded. Please try refreshing or contact support if the problem persists.
              </p>
              <button
                onClick={handleRetry}
                className="mt-2 text-sm font-medium text-red-900 hover:text-red-700 underline"
              >
                Retry loading data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optimized Insights Banner */}
      {dashboardData.insights && dashboardData.insights.length > 0 && (
        <div className="space-y-2">
          {dashboardData.insights.map((insight: any, index: number) => {
            const InsightIcon = insight.icon;
            return (
              <div
                key={index}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border-l-4 ${
                  insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  insight.type === 'danger' ? 'border-red-500 bg-red-50' :
                  insight.type === 'success' ? 'border-green-500 bg-green-50' :
                  'border-blue-500 bg-blue-50'
                }`}
                role="alert"
              >
                <div className="flex items-center gap-3 flex-1">
                  <InsightIcon className={`w-5 h-5 flex-shrink-0 ${
                    insight.type === 'warning' ? 'text-yellow-600' :
                    insight.type === 'danger' ? 'text-red-600' :
                    insight.type === 'success' ? 'text-green-600' :
                    'text-blue-600'
                  }`} />
                  <p className={`text-sm font-medium ${
                    insight.type === 'warning' ? 'text-yellow-900' :
                    insight.type === 'danger' ? 'text-red-900' :
                    insight.type === 'success' ? 'text-green-900' :
                    'text-blue-900'
                  }`}>
                    {insight.message}
                  </p>
                </div>
                {insight.action && insight.link && (
                  <Link
                    to={insight.link}
                    className={`ml-4 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                      insight.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                      insight.type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                      'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {insight.action}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Stats Grid with Enhanced Design */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" role="region" aria-label="Dashboard statistics">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.name} 
              className={`relative overflow-hidden bg-white rounded-xl border-2 ${stat.borderColor} shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              role="article"
              aria-label={`${stat.name}: ${stat.value}`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                <Icon className={`w-full h-full ${stat.color}`} />
              </div>
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-xl ${stat.bgColor} shadow-sm`} aria-hidden="true">
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  {stat.change && stat.trend !== null && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      stat.changeType === 'positive' 
                        ? 'bg-green-100 text-green-700' 
                        : stat.changeType === 'negative'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {stat.changeType === 'positive' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : stat.changeType === 'negative' ? (
                        <ArrowDownRight className="w-3 h-3" />
                      ) : null}
                      {stat.change}
                    </div>
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1" aria-live="polite">
                  {isLoading ? (
                    <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="text-xs font-medium text-gray-500 mb-2">{stat.name}</p>
                {stat.description && (
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* All Charts in One Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Hours Logged Over Time */}
        <div className="card">
          <div className="flex flex-col items-start mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-1">Hours Logged</h2>
            <p className="text-xs text-gray-500">Last 7 Days</p>
            <Clock className="w-4 h-4 text-gray-400 mt-1" />
          </div>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center" role="status" aria-label="Loading hours chart">
              <div className="animate-pulse text-gray-400 text-xs">Loading chart...</div>
            </div>
          ) : chartData.hoursByDay.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center" role="status">
              <Clock className="w-8 h-8 text-gray-300 mb-2" aria-hidden="true" />
              <div className="text-gray-500 text-xs text-center">No hours logged in the last 7 days</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData.hoursByDay} aria-label="Hours logged over last 7 days">
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" fontSize={10} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
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
          <div className="flex flex-col items-start mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-1">Project Status</h2>
            <FolderKanban className="w-4 h-4 text-gray-400 mt-1" />
          </div>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center" role="status" aria-label="Loading project status chart">
              <div className="animate-pulse text-gray-400 text-xs">Loading chart...</div>
            </div>
          ) : chartData.projectStatusData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center" role="status">
              <FolderKanban className="w-8 h-8 text-gray-300 mb-2" aria-hidden="true" />
              <div className="text-gray-500 text-xs text-center">No project data available</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart aria-label="Project status distribution">
                <Pie
                  data={chartData.projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.projectStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [value, name]}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Projects by Hours */}
        <div className="card">
          <div className="flex flex-col items-start mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-1">Top Projects</h2>
            <p className="text-xs text-gray-500">By Hours</p>
            <TrendingUp className="w-4 h-4 text-gray-400 mt-1" />
          </div>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center" role="status" aria-label="Loading top projects chart">
              <div className="animate-pulse text-gray-400 text-xs">Loading chart...</div>
            </div>
          ) : chartData.topProjectsByHours.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center" role="status">
              <TrendingUp className="w-8 h-8 text-gray-300 mb-2" aria-hidden="true" />
              <div className="text-gray-500 text-xs text-center">No project hours data available</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.topProjectsByHours.slice(0, 3)} layout="vertical" aria-label="Top projects by hours">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#6b7280" fontSize={10} tick={{ fill: '#6b7280' }} />
                <YAxis dataKey="name" type="category" width={60} stroke="#6b7280" fontSize={10} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Timesheet Status */}
        <div className="card">
          <div className="flex flex-col items-start mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-1">Timesheet Status</h2>
            <CheckCircle2 className="w-4 h-4 text-gray-400 mt-1" />
          </div>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center" role="status" aria-label="Loading timesheet status chart">
              <div className="animate-pulse text-gray-400 text-xs">Loading chart...</div>
            </div>
          ) : chartData.timesheetStatusData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center" role="status">
              <CheckCircle2 className="w-8 h-8 text-gray-300 mb-2" aria-hidden="true" />
              <div className="text-gray-500 text-xs text-center">No timesheet data available</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.timesheetStatusData} aria-label="Timesheet status distribution">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tick={{ fill: '#6b7280' }} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#6b7280" fontSize={10} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Budget Utilization Chart */}
        {chartData.budgetData.length > 0 ? (
          <div className="card">
            <div className="flex flex-col items-start mb-3">
              <h2 className="text-sm font-bold text-gray-900 mb-1">Budget Utilization</h2>
              <p className="text-xs text-gray-500">By Project</p>
              <RupeeIcon className="w-4 h-4 text-gray-400 mt-1" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.budgetData.slice(0, 3)} aria-label="Budget utilization by project">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} angle={-15} textAnchor="end" height={50} tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" fontSize={10} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => formatCurrencyTooltip(value)}
                />
                <Bar dataKey="budget" stackId="a" fill="#e5e7eb" radius={[0, 0, 0, 0]} />
                <Bar dataKey="spent" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>

      {/* Budget Alerts */}
      {(() => {
        const safeProjects = Array.isArray(allProjects) ? allProjects : [];
        const projectsWithAlerts = safeProjects.filter((p: any) => {
          const budget = Number(p?.budget);
          if (isNaN(budget) || budget === 0) return false;
          const spent = Number(p?.totalCost) || 0;
          const utilization = budget > 0 ? (spent / budget) * 100 : 0;
          return utilization >= 90 || spent > budget;
        });

        if (projectsWithAlerts.length === 0) return null;

        return (
          <div className="card border-l-4 border-yellow-500 bg-yellow-50" role="alert">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-yellow-900 mb-2">Budget Alerts</h2>
                <div className="space-y-2">
                  {projectsWithAlerts.map((project: any) => {
                    const budget = Number(project?.budget) || 0;
                    const spent = Number(project?.totalCost) || 0;
                    const utilization = budget > 0 ? (spent / budget) * 100 : 0;
                    const isOverBudget = spent > budget;
                    return (
                      <Link
                        key={project?.id}
                        to={`/projects/${project?.id}`}
                        className="block p-3 bg-white rounded-lg border border-yellow-200 hover:shadow-md transition-shadow"
                        aria-label={`${project?.name || 'Project'}: ${isOverBudget ? 'Over budget' : 'At risk'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{project?.name || 'Unknown Project'}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Budget: {formatCurrency(budget)} | 
                              Spent: <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                                {formatCurrency(spent)}
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
            <div className="text-gray-500" role="status" aria-label="Loading projects">
              <div className="animate-pulse">Loading projects...</div>
            </div>
          ) : allProjects && allProjects.length > 0 ? (
            <div className="space-y-3" role="list" aria-label="Recent projects">
              {allProjects.slice(0, 5).map((project: any) => (
                <Link
                  key={project?.id}
                  to={`/projects/${project?.id}`}
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  role="listitem"
                  aria-label={`Project: ${project?.name || 'Unknown'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{project?.name || 'Unknown Project'}</p>
                      <p className="text-sm text-gray-500">{project?.code || 'N/A'}</p>
                    </div>
                    <span
                      className={`ml-3 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                        project?.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : project?.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project?.status?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" role="status">
              <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-gray-500">No projects found</p>
            </div>
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
            <div className="text-gray-500" role="status" aria-label="Loading timesheets">
              <div className="animate-pulse">Loading timesheets...</div>
            </div>
          ) : allTimesheets && allTimesheets.length > 0 ? (
            <div className="space-y-3" role="list" aria-label="Recent timesheets">
              {allTimesheets.slice(0, 5).map((timesheet: any) => {
                let dateStr = 'N/A';
                try {
                  if (timesheet?.date) {
                    const date = typeof timesheet.date === 'string' ? parseISO(timesheet.date) : new Date(timesheet.date);
                    if (isValid(date)) {
                      dateStr = format(date, 'MMM dd, yyyy');
                    }
                  }
                } catch {
                  dateStr = 'Invalid date';
                }
                const hours = Number(timesheet?.hours) || 0;
                return (
                  <div
                    key={timesheet?.id}
                    className="p-3 border border-gray-200 rounded-lg"
                    role="listitem"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {timesheet?.project?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {dateStr} - {isNaN(hours) ? '0' : hours}h
                        </p>
                      </div>
                      <span
                        className={`ml-3 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                          timesheet?.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : timesheet?.status === 'SUBMITTED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {timesheet?.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8" role="status">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-gray-500">No timesheets found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

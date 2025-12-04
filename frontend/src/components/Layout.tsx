import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { UserRole, roleLabels } from '../utils/roles';
import { LayoutDashboard, FolderKanban, Clock, BarChart3, LogOut, Link as LinkIcon, User, Menu, X, TrendingUp, Database } from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.CLIENT] },
    { path: '/projects', label: 'Projects', icon: FolderKanban, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.CLIENT] },
    { path: '/timesheets', label: 'Timesheets', icon: Clock, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER] },
    { path: '/resources', label: 'Resources', icon: LinkIcon, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.CLIENT] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER] },
    { path: '/profit-loss', label: 'Profit & Loss', icon: TrendingUp, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { path: '/master-management', label: 'Master Management', icon: Database, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    user && item.roles.includes(user.role as UserRole)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Glossy Header */}
      <nav className="sticky top-0 z-50 w-full border-b border-gray-200/80 backdrop-blur-xl bg-white/90 shadow-sm overflow-hidden">
        {/* Glossy overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/100 via-white/95 to-white/90 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/0 via-primary-50/30 to-primary-50/0 pointer-events-none"></div>
        
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 overflow-hidden">
            {/* Left Section: Logo and Navigation */}
            <div className="flex items-center flex-1 min-w-0 overflow-hidden">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center mr-3 lg:mr-6">
                <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent whitespace-nowrap">
                  IKF Livetracker
                </h1>
              </div>
              
              {/* Desktop Navigation Links - No scrollbar */}
              <div className="hidden lg:flex lg:items-center lg:gap-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-0.5 min-w-0">
                  {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`${
                          isActive(item.path)
                            ? 'bg-primary-50/80 text-primary-700 shadow-sm border-primary-500/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 border-transparent'
                        } inline-flex items-center px-2.5 py-2 rounded-lg text-sm font-medium border transition-all duration-200 whitespace-nowrap flex-shrink-0`}
                      >
                        <Icon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 flex-shrink-0"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {/* Right Section: User Info and Actions */}
            <div className="flex items-center flex-shrink-0 ml-3">
              <div className="flex items-center gap-2">
                {/* Desktop User Info */}
                <div className="hidden sm:flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50/80 backdrop-blur-sm transition-all duration-200">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white shadow-md ring-2 ring-white/50">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-tight truncate max-w-[140px]">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 leading-tight truncate max-w-[140px]">
                      {user && roleLabels[user.role as UserRole]}
                    </p>
                  </div>
                </div>

                {/* Mobile User Avatar */}
                <div className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white shadow-md ring-2 ring-white/50">
                  <User className="w-4 h-4" />
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200/80 bg-white/95 backdrop-blur-sm py-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
              <div className="space-y-0.5">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${
                        isActive(item.path)
                          ? 'bg-primary-50/80 text-primary-700 border-l-4 border-primary-500'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 border-l-4 border-transparent'
                      } flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-r-lg`}
                    >
                      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;


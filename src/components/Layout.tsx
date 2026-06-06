import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Target, Users, Trophy, User, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  path: string;
  label: string;
  icon: ReactNode;
}

const menuItems: MenuItem[] = [
  { path: '/', label: '首页', icon: <Home className="w-5 h-5" /> },
  { path: '/habits', label: '习惯', icon: <Target className="w-5 h-5" /> },
  { path: '/teams', label: '队伍', icon: <Users className="w-5 h-5" /> },
  { path: '/leaderboard', label: '排行榜', icon: <Trophy className="w-5 h-5" /> },
  { path: '/profile', label: '我的', icon: <User className="w-5 h-5" /> },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = (path: string) => {
    const item = menuItems.find((m) => m.path === path);
    return item?.label || '习惯打卡';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:bg-white lg:border-r lg:border-gray-100 lg:shadow-sm z-50">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            习惯打卡
          </h1>
        </div>

        <div className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          {user && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-orange-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-red-500 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            退出登录
          </Button>
        </div>
      </nav>

      <div className="lg:hidden">
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {getPageTitle(window.location.pathname)}
          </h2>
          <div className="w-10" />
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 bg-white z-30 animate-in slide-in-from-top duration-200">
            <div className="p-4 space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                        : 'text-gray-600 hover:bg-gray-100'
                    )
                  }
                >
                  {item.icon}
                  <span className="text-base">{item.label}</span>
                </NavLink>
              ))}
              <div className="border-t border-gray-100 pt-4 mt-4">
                {user && (
                  <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-orange-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{user.username}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-red-500 hover:bg-red-50 py-4"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  退出登录
                </Button>
              </div>
            </div>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around z-40">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center flex-1 h-full transition-all duration-200',
                  isActive
                    ? 'text-orange-500'
                    : 'text-gray-400 hover:text-gray-600'
                )
              }
            >
              <div
                className={cn(
                  'p-1.5 rounded-xl transition-all duration-200',
                  window.location.pathname === item.path &&
                    'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                )}
              >
                {item.icon}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

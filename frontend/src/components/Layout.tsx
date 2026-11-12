import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Shirt,
  ShoppingCart,
  Truck,
  Receipt,
  Users,
  Building2,
  Boxes,
  FileBarChart,
  RefreshCw,
  LogOut,
  ExternalLink,
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/sales', label: 'Sales & POS', icon: ShoppingCart },
    { to: '/purchases', label: 'Purchases', icon: Truck },
    { to: '/products', label: 'Products', icon: Shirt },
    { to: '/inventory', label: 'Inventory Movements', icon: Boxes },
    { to: '/expenses', label: 'Daily Expenses', icon: Receipt },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/suppliers', label: 'Suppliers', icon: Building2 },
    { to: '/reports', label: 'ERPNext Reports', icon: FileBarChart },
    { to: '/sync-logs', label: 'Sync Logs', icon: RefreshCw },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Brand header */}
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-sky-500/30">
                  TS
                </span>
                Textile Shop
              </h1>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ERPNext Connected
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User profile & footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-200 truncate w-32">{user?.name}</div>
                <div className="text-slate-500 uppercase tracking-wider text-[10px]">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <a
            href="http://localhost:5000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <span>Swagger API Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>

      {/* Main content view */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};


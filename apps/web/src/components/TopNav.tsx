import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const TABS = [
  { label: 'Cases', path: '/cases' },
  { label: 'Institutions', path: '/institutions' },
  { label: 'Overlaps', path: '/overlaps' },
  { label: 'Reports', path: '/reports' },
];

export function TopNav() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', 'unread'],
    queryFn: api.getUnreadAlerts,
    refetchInterval: 30000,
  });

  const unreadCount = (alerts as any[]).length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Synthetic data banner */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-1 flex items-center justify-center gap-2">
        <Shield size={12} className="text-amber-600" />
        <span className="text-xs text-amber-700 font-medium">
          Synthetic demo data · SIH 2026 Prototype · Problem SIH26264
        </span>
      </div>

      <div className="flex items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link to="/cases" className="flex items-center gap-1 py-3">
            <span className="text-xl font-bold text-navy-500">In</span>
            <span className="text-xl font-bold text-teal-500">Solver</span>
          </Link>

          {/* Navigation Tabs */}
          <nav className="flex items-center">
            {TABS.map((tab) => {
              const isActive = location.pathname.startsWith(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  id={`nav-tab-${tab.label.toLowerCase()}`}
                  aria-label={`Navigate to ${tab.label}`}
                  className={`nav-tab ${isActive ? 'nav-tab-active' : ''}`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Bell + Avatar */}
        <div className="flex items-center gap-3">
          <Link
            to="/alerts"
            id="bell-alerts-btn"
            aria-label={`${unreadCount} unread alerts`}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Bell size={20} className="text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AR'}
              </span>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-slate-800 leading-tight">{user?.name || 'A. Rao'}</p>
              <p className="text-slate-500 text-xs capitalize">{user?.role || 'Supervisor'}</p>
            </div>
            <button
              onClick={logout}
              id="logout-btn"
              aria-label="Logout"
              className="ml-2 text-xs text-slate-400 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

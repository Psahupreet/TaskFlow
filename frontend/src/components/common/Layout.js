import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const icons = {
  dashboard: (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="1.8"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="1.8"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="1.8"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="1.8"/>
    </svg>
  ),
  tasks: (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="1.8" strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1.5" strokeWidth="1.8"/>
      <path strokeWidth="1.8" strokeLinecap="round" d="M9 12l2 2 4-4"/>
    </svg>
  ),
  team: (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="1.8" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4" strokeWidth="1.8"/>
      <path strokeWidth="1.8" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  logout: (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="1.8" strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
    </svg>
  ),
};

const avatarColors = ['#7c6af7','#22c55e','#3b82f6','#f97316','#f59e0b','#ec4899'];
const getColor = (str) => avatarColors[(str?.charCodeAt(0) || 0) % avatarColors.length];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">TM</div>
          <div>
            <div className="logo-text">TaskFlow</div>
            <div className="logo-sub">Team Manager</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Main</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {icons.dashboard}<span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/tasks"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {icons.tasks}<span>Tasks</span>
          </NavLink>
          {user?.role === 'admin' && (
            <>
              <div className="nav-section-title" style={{ marginTop: 12 }}>Admin</div>
              <NavLink
                to="/team"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                {icons.team}<span>Team</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div
              className="avatar sm"
              style={{ background: getColor(user?.name), borderRadius: 8 }}
            >
              {user?.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: 6 }} title="Logout">
              {icons.logout}
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

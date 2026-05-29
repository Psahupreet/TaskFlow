import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';

const priorityColors = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };
const statusColors = { pending: '#f59e0b', 'in-progress': '#3b82f6', completed: '#22c55e', 'on-hold': '#a09cbd' };

function StatCard({ label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-dot" style={{ background: color }} />
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => {
      setData(data.dashboard);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!data) return null;

  const { stats, recentTasks, memberWorkload } = data;

  return (
    <>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">{format(new Date(), 'EEEE, MMMM d yyyy')} · Overview</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tasks?new=1')}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14"/>
          </svg>
          Assign Task
        </button>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Total Tasks" value={stats.totalTasks} color="var(--accent2)" />
          <StatCard label="Today Assigned" value={stats.todayAssigned} color="var(--blue)" sub="new today" />
          <StatCard label="In Progress" value={stats.inProgressTasks} color="var(--yellow)" />
          <StatCard label="Completed Today" value={stats.completedToday} color="var(--green)" />
          <StatCard label="Pending" value={stats.pendingTasks} color="var(--orange)" />
          <StatCard label="Overdue" value={stats.overdueCount} color="var(--red)" sub="needs attention" />
          <StatCard label="Active Members" value={stats.totalMembers} color="var(--accent2)" />
        </div>

        <div className="grid-2 mt-24">
          {/* Recent Tasks */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Recent Tasks</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View all →</button>
            </div>
            {recentTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-title">No tasks yet</div>
              </div>
            ) : (
              recentTasks.slice(0, 6).map((task) => (
                <div
                  key={task._id}
                  className="flex-between"
                  style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                >
                  <div className="flex-center gap-8">
                    <div className="priority-dot" style={{ background: priorityColors[task.priority] }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <div className="avatar sm" style={{ width: 18, height: 18, fontSize: 9 }}>{task.assignedTo?.avatar}</div>
                        {task.assignedTo?.name}
                      </div>
                    </div>
                  </div>
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                </div>
              ))
            )}
          </div>

          {/* Member Workload */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              Team Workload
            </div>
            {memberWorkload.length === 0 ? (
              <div className="empty-state"><div className="empty-title">No data yet</div></div>
            ) : (
              memberWorkload.slice(0, 8).map((m) => {
                const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                return (
                  <div key={m._id} style={{ marginBottom: 14 }}>
                    <div className="flex-between" style={{ marginBottom: 4 }}>
                      <div className="flex-center gap-8">
                        <div className="avatar sm" style={{ width: 24, height: 24, fontSize: 10 }}>{m.avatar}</div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{m.department}</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{m.completed}/{m.total}</span>
                    </div>
                    <div className="progress-bar-wrap">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct === 100 ? 'var(--green)' : 'var(--accent)',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

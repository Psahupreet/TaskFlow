import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isToday } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusLabels = { pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed', 'on-hold': 'On Hold' };
const priorityColors = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--orange)', urgent: 'var(--red)' };

export default function MemberDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/member').then(({ data }) => {
      setData(data.dashboard);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!data) return null;

  const { stats, todayTasks, myTasks } = data;

  return (
    <>
      <div className="page-header">
        <div className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</div>
        <div className="page-subtitle">{format(new Date(), 'EEEE, MMMM d')} · Here's your task overview</div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Tasks', value: stats.total, color: 'var(--accent2)' },
            { label: 'Pending', value: stats.pending, color: 'var(--yellow)' },
            { label: 'In Progress', value: stats.inProgress, color: 'var(--blue)' },
            { label: 'Completed', value: stats.completed, color: 'var(--green)' },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-dot" style={{ background: s.color }} />
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Today's Tasks */}
        <div className="card mt-24">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
              Today's Tasks
              <span style={{
                marginLeft: 10, padding: '2px 8px', borderRadius: 20,
                background: 'var(--accent-glow)', color: 'var(--accent2)', fontSize: 12,
              }}>{todayTasks.length}</span>
            </div>
          </div>
          {todayTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <div className="empty-title">No tasks assigned today</div>
              <div className="empty-sub">Enjoy your day!</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {todayTasks.map((task) => (
                <div
                  key={task._id}
                  className={`task-card ${isPast(new Date(task.dueDate)) && task.status !== 'completed' ? 'overdue' : ''}`}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                >
                  <div className="flex-center gap-8" style={{ marginBottom: 8 }}>
                    <div className="priority-dot" style={{ background: priorityColors[task.priority] }} />
                    <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {task.priority}
                    </span>
                    <span className={`badge badge-${task.status}`} style={{ marginLeft: 'auto', fontSize: 10 }}>
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  <div className="task-title">{task.title}</div>
                  {task.description && (
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6, lineHeight: 1.4 }}>
                      {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
                    </div>
                  )}
                  <div className="task-footer">
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      Due {format(new Date(task.dueDate), 'MMM d')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>by {task.assignedBy?.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All my tasks */}
        <div className="card mt-20">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>All My Tasks</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View all →</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Assigned By</th>
                </tr>
              </thead>
              <tbody>
                {myTasks.slice(0, 10).map((task) => (
                  <tr key={task._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks/${task._id}`)}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                      {task.category && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{task.category}</div>}
                    </td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td><span className={`badge badge-${task.status}`}>{statusLabels[task.status]}</span></td>
                    <td>
                      <span style={{ color: isPast(new Date(task.dueDate)) && task.status !== 'completed' ? 'var(--red)' : 'inherit' }}>
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td>
                      <div className="flex-center gap-8">
                        <div className="avatar sm" style={{ width: 22, height: 22, fontSize: 9 }}>{task.assignedBy?.avatar}</div>
                        {task.assignedBy?.name}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {myTasks.length === 0 && (
              <div className="empty-state">
                <div className="empty-title">No tasks assigned</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

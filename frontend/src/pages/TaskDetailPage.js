import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusOptions = ['pending', 'in-progress', 'completed', 'on-hold'];

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [commenting, setCommenting] = useState(false);

  const fetchTask = async () => {
    try {
      const { data } = await api.get(`/tasks/${id}`);
      setTask(data.task);
    } catch { navigate('/tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTask(); }, [id]);

  const handleStatusChange = async (status) => {
    setStatusUpdating(true);
    try {
      await api.put(`/tasks/${id}`, { status });
      await fetchTask();
    } finally { setStatusUpdating(false); }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      await api.post(`/tasks/${id}/comments`, { text: comment });
      setComment('');
      await fetchTask();
    } finally { setCommenting(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!task) return null;

  const isOverdue = isPast(new Date(task.dueDate)) && task.status !== 'completed';

  return (
    <>
      <div className="page-header flex-between">
        <div className="flex-center gap-12">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
            ← Back
          </button>
          <div>
            <div className="page-title" style={{ fontSize: 20 }}>{task.title}</div>
            <div className="page-subtitle">
              Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
              {' · '}by {task.assignedBy?.name}
            </div>
          </div>
        </div>
        <div className="flex-center gap-8">
          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          <span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span>
        </div>
      </div>

      <div className="page-body">
        <div className="grid-2">
          {/* Left: Details */}
          <div>
            {/* Task info */}
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Details</div>
              {task.description && (
                <div style={{ marginBottom: 16 }}>
                  <div className="form-label">Description</div>
                  <div style={{ color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{task.description}</div>
                </div>
              )}

              <div className="grid-2" style={{ gap: 12 }}>
                {[
                  { label: 'Assigned To', value: task.assignedTo?.name, sub: task.assignedTo?.department },
                  { label: 'Assigned By', value: task.assignedBy?.name },
                  { label: 'Category', value: task.category },
                  { label: 'Due Date', value: format(new Date(task.dueDate), 'MMM d, yyyy'), overdue: isOverdue },
                  { label: 'Created', value: format(new Date(task.createdAt), 'MMM d, yyyy') },
                  task.completedAt && { label: 'Completed', value: format(new Date(task.completedAt), 'MMM d, yyyy') },
                ].filter(Boolean).map((item) => (
                  <div key={item.label} style={{ padding: '10px', background: 'var(--surface2)', borderRadius: 9 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>
                      {item.label}
                    </div>
                    <div style={{ fontWeight: 500, color: item.overdue ? 'var(--red)' : 'var(--text)' }}>
                      {item.value}{item.overdue && ' ⚠'}
                    </div>
                    {item.sub && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.sub}</div>}
                  </div>
                ))}
              </div>

              {task.tags?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="form-label">Tags</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {task.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* Status update */}
            <div className="card mt-16">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14 }}>Update Status</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {statusOptions.map((s) => (
                  <button
                    key={s}
                    className={`btn ${task.status === s ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'center' }}
                    onClick={() => handleStatusChange(s)}
                    disabled={statusUpdating || task.status === s}
                  >
                    {s.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Comments */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>
              Comments ({task.comments?.length || 0})
            </div>

            {/* Add comment */}
            <div style={{ marginBottom: 20 }}>
              <textarea
                className="form-textarea"
                placeholder="Add a comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 8 }}
                onClick={handleComment}
                disabled={commenting || !comment.trim()}
              >
                {commenting ? 'Posting…' : 'Post Comment'}
              </button>
            </div>

            {/* Comments list */}
            <div>
              {task.comments?.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <div className="empty-title">No comments yet</div>
                  <div className="empty-sub">Be the first to comment</div>
                </div>
              ) : (
                [...task.comments].reverse().map((c) => (
                  <div key={c._id} className="comment">
                    <div
                      className="avatar sm"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    >
                      {c.author?.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex-between">
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{c.author?.name}</span>
                        <span className="comment-time">
                          {format(new Date(c.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <div className="comment-text" style={{ marginTop: 4 }}>{c.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

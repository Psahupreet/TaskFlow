import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusOptions = ['pending', 'in-progress', 'completed', 'on-hold'];
const priorityOptions = ['low', 'medium', 'high', 'urgent'];
const categoryOptions = ['development', 'design', 'testing', 'marketing', 'hr', 'other'];

function TaskModal({ task, members, onClose, onSave }) {
  const isEdit = Boolean(task?._id);
  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: task?.assignedTo?._id || task?.assignedTo || '',
    priority: task?.priority || 'medium',
    category: task?.category || 'other',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : today,
    status: task?.status || 'pending',
    tags: task?.tags?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.assignedTo || !form.dueDate) {
      setError('Title, assignee, and due date are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [] };
      if (isEdit) {
        await api.put(`/tasks/${task._id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Task' : 'Assign New Task'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input className="form-input" value={form.title} onChange={set('title')} placeholder="What needs to be done?" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={set('description')} placeholder="Add details…" rows={3} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign To *</label>
              <select className="form-select" value={form.assignedTo} onChange={set('assignedTo')}>
                <option value="">Select member</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} — {m.department}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={set('dueDate')} min={today} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={set('priority')}>
                {priorityOptions.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={set('category')}>
                {categoryOptions.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          {isEdit && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                {statusOptions.map((s) => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" value={form.tags} onChange={set('tags')} placeholder="frontend, urgent, review…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Update Task' : 'Assign Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | task object
  const [filters, setFilters] = useState({ status: '', priority: '', assignedTo: '', search: '' });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === '1') setModal('create');
  }, [searchParams]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const { data } = await api.get(`/tasks?${params}`);
      setTasks(data.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/users').then(({ data }) => setMembers(data.users));
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    fetchTasks();
  };

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">Tasks</div>
          <div className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</div>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setModal('create')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14"/>
            </svg>
            Assign Task
          </button>
        )}
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="filter-bar">
          <input
            className="search-input"
            placeholder="🔍  Search tasks…"
            value={filters.search}
            onChange={setFilter('search')}
          />
          <select className="filter-select" value={filters.status} onChange={setFilter('status')}>
            <option value="">All Status</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
          </select>
          <select className="filter-select" value={filters.priority} onChange={setFilter('priority')}>
            <option value="">All Priority</option>
            {priorityOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {user?.role === 'admin' && (
            <select className="filter-select" value={filters.assignedTo} onChange={setFilter('assignedTo')}>
              <option value="">All Members</option>
              {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          )}
          {Object.values(filters).some(Boolean) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '', assignedTo: '', search: '' })}>
              Clear
            </button>
          )}
        </div>

        {/* Task Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  {user?.role === 'admin' && <th>Assigned To</th>}
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Category</th>
                  {user?.role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading…</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <div className="empty-title">No tasks found</div>
                      <div className="empty-sub">Adjust filters or create a new task</div>
                    </div>
                  </td></tr>
                ) : tasks.map((task) => {
                  const isOverdue = isPast(new Date(task.dueDate)) && task.status !== 'completed';
                  return (
                    <tr
                      key={task._id}
                      style={{ cursor: 'pointer', borderLeft: isOverdue ? '3px solid var(--red)' : '' }}
                      onClick={() => navigate(`/tasks/${task._id}`)}
                    >
                      <td>
                        <div style={{ fontWeight: 500, maxWidth: 280 }}>{task.title}</div>
                        {task.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                            {task.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
                          </div>
                        )}
                      </td>
                      {user?.role === 'admin' && (
                        <td>
                          <div className="flex-center gap-8">
                            <div className="avatar sm">{task.assignedTo?.avatar}</div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{task.assignedTo?.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{task.assignedTo?.department}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td><span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span></td>
                      <td>
                        <span style={{ color: isOverdue ? 'var(--red)' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          {isOverdue && <span style={{ marginLeft: 4, fontSize: 11 }}>⚠</span>}
                        </span>
                      </td>
                      <td><span style={{ color: 'var(--text3)', fontSize: 13 }}>{task.category}</span></td>
                      {user?.role === 'admin' && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex-center gap-8">
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setModal(task)}
                            >Edit</button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(task._id)}
                            >Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <TaskModal
          task={modal === 'create' ? null : modal}
          members={members}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchTasks(); }}
        />
      )}
    </>
  );
}

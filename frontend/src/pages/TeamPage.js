import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const departments = ['Engineering', 'Design', 'Marketing', 'QA', 'HR', 'Management', 'General'];

function MemberModal({ member, onClose, onSave }) {
  const isEdit = Boolean(member?._id);
  const [form, setForm] = useState({
    name: member?.name || '',
    email: member?.email || '',
    password: '',
    department: member?.department || 'Engineering',
    isActive: member?.isActive !== false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === 'isActive' ? e.target.checked : e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email) { setError('Name and email are required'); return; }
    if (!isEdit && !form.password) { setError('Password required for new member'); return; }
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await api.put(`/users/${member._id}`, { name: form.name, email: form.email, department: form.department, isActive: form.isActive });
      } else {
        await api.post('/users', form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Member' : 'Add Team Member'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="Jane Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" value={form.email} onChange={set('email')} placeholder="jane@team.com" />
            </div>
          </div>
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" className="form-input" value={form.password} onChange={set('password')} placeholder="Min 6 characters" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-select" value={form.department} onChange={set('department')}>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {isEdit && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={set('isActive')} />
              <label htmlFor="isActive" className="form-label" style={{ margin: 0 }}>Account Active</label>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Update' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [taskCounts, setTaskCounts] = useState({});

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setMembers(data.users);

      // Fetch task counts per member
      const counts = {};
      await Promise.all(
        data.users.map(async (m) => {
          const { data: td } = await api.get(`/tasks?assignedTo=${m._id}`);
          counts[m._id] = {
            total: td.count,
            completed: td.tasks.filter((t) => t.status === 'completed').length,
            inProgress: td.tasks.filter((t) => t.status === 'in-progress').length,
          };
        })
      );
      setTaskCounts(counts);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this team member? Their tasks will remain.')) return;
    await api.delete(`/users/${id}`);
    fetchMembers();
  };

  const byDept = members.reduce((acc, m) => {
    (acc[m.department] = acc[m.department] || []).push(m);
    return acc;
  }, {});

  return (
    <>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">Team</div>
          <div className="page-subtitle">{members.length} members · {Object.keys(byDept).length} departments</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14"/>
          </svg>
          Add Member
        </button>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
        ) : (
          Object.entries(byDept).map(([dept, deptMembers]) => (
            <div key={dept} style={{ marginBottom: 28 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                marginBottom: 12, color: 'var(--text2)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {dept}
                <span style={{
                  padding: '2px 8px', borderRadius: 20,
                  background: 'var(--surface2)', color: 'var(--text3)', fontSize: 12,
                }}>{deptMembers.length}</span>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Email</th>
                      <th>Tasks</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptMembers.map((m) => {
                      const tc = taskCounts[m._id] || { total: 0, completed: 0 };
                      const pct = tc.total > 0 ? Math.round((tc.completed / tc.total) * 100) : 0;
                      return (
                        <tr key={m._id}>
                          <td>
                            <div className="flex-center gap-10">
                              <div className="avatar" style={{ opacity: m.isActive ? 1 : 0.4 }}>{m.avatar}</div>
                              <div>
                                <div style={{ fontWeight: 500 }}>{m.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Joined {new Date(m.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text3)', fontSize: 13 }}>{m.email}</td>
                          <td>
                            <div style={{ fontSize: 13 }}>
                              <span style={{ fontWeight: 600 }}>{tc.completed}</span>
                              <span style={{ color: 'var(--text3)' }}>/{tc.total} done</span>
                            </div>
                          </td>
                          <td style={{ width: 120 }}>
                            <div className="progress-bar-wrap" style={{ width: 100 }}>
                              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)' }} />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{pct}%</div>
                          </td>
                          <td>
                            <span style={{
                              padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                              background: m.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(160,156,189,0.12)',
                              color: m.isActive ? 'var(--green)' : 'var(--text3)',
                            }}>
                              {m.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="flex-center gap-8">
                              <button className="btn btn-ghost btn-sm" onClick={() => setModal(m)}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m._id)}>Remove</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

        {!loading && members.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No team members yet</div>
            <div className="empty-sub">Add your first team member to get started</div>
          </div>
        )}
      </div>

      {modal && (
        <MemberModal
          member={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchMembers(); }}
        />
      )}
    </>
  );
}

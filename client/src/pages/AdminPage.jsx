import { useState, useEffect, useCallback } from 'react';
import { admin, oaq } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [sections, setSections] = useState([]);
  const [issueTotal, setIssueTotal] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const [issuePage, setIssuePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [issueFilter, setIssueFilter] = useState({ status: '', search: '' });
  const [userFilter, setUserFilter] = useState({ role: '', search: '' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [modQueue, setModQueue] = useState({ flagged: [], noAnswer: [], downvoted: [] });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const showMsg = useCallback((text, type = 'info') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(''), 3000);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await admin.getStats();
      setStats(data);
    } catch (e) {
      showMsg(e.message, 'error');
    }
  }, [showMsg]);

  const loadIssues = useCallback(async (page = 1, filters = issueFilter) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      if (!params.status) delete params.status;
      if (!params.search) delete params.search;
      const data = await admin.getIssues(params);
      setIssues(data.issues);
      setIssueTotal(data.total);
      setIssuePage(data.page);
    } catch (e) {
      showMsg(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [issueFilter, showMsg]);

  const loadUsers = useCallback(async (page = 1, filters = userFilter) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      if (!params.role) delete params.role;
      if (!params.search) delete params.search;
      const data = await admin.getUsers(params);
      setUsers(data.users);
      setUserTotal(data.total);
      setUserPage(data.page);
    } catch (e) {
      showMsg(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [userFilter, showMsg]);

  const loadModeration = useCallback(async () => {
    try {
      const data = await oaq.getModerationQueue();
      setModQueue(data);
    } catch (e) {
      showMsg(e.message, 'error');
    }
  }, [showMsg]);

  const loadSections = useCallback(async () => {
    try {
      const data = await admin.getSections();
      setSections(data);
    } catch (e) {
      showMsg(e.message, 'error');
    }
  }, [showMsg]);

  useEffect(() => {
    if (tab === 'overview') loadStats();
    if (tab === 'issues') loadIssues();
    if (tab === 'users') loadUsers();
    if (tab === 'sections') loadSections();
    if (tab === 'moderation') loadModeration();
  }, [tab]);

  const handlePin = async (issue) => {
    try {
      await admin.pinIssue(issue._id);
      showMsg(`Issue #${issue.issueId} ${!issue.isPinned ? 'pinned' : 'unpinned'}`);
      loadIssues(issuePage, issueFilter);
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleFeature = async (issue) => {
    try {
      await admin.featureIssue(issue._id);
      showMsg(`Issue #${issue.issueId} ${!issue.isFeatured ? 'featured' : 'unfeatured'}`);
      loadIssues(issuePage, issueFilter);
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleDelete = async (issue) => {
    if (!confirm(`Delete issue #${issue.issueId}?`)) return;
    try {
      await admin.deleteIssue(issue._id);
      showMsg('Issue deleted');
      loadIssues(issuePage, issueFilter);
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleResolve = async (issue) => {
    const answer = prompt('Enter resolution answer:');
    if (!answer) return;
    try {
      await admin.resolveIssue(issue._id, answer);
      showMsg('Issue resolved');
      loadIssues(issuePage, issueFilter);
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleUpdateUser = async (user, field, value) => {
    try {
      await admin.updateUser(user._id, { [field]: value });
      showMsg('User updated');
      loadUsers(userPage, userFilter);
    } catch (e) { showMsg(e.message, 'error'); }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await admin.createSection({
        name: fd.get('name'),
        code: fd.get('code'),
        description: fd.get('description'),
        color: fd.get('color') || '#3b82f6'
      });
      showMsg('Section created');
      e.target.reset();
      loadSections();
    } catch (e) { showMsg(e.message, 'error'); }
  };

  return (
    <div style={{ padding: '24px', minHeight: 'calc(100vh - 52px)', background: '#f9fafb' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: '#111' }}>Admin Dashboard</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>Manage issues, users, and content</p>
        </div>

        {msg && (
          <div style={{
            padding: '10px 16px', marginBottom: 16, borderRadius: 6,
            background: msg.type === 'error' ? '#fee2e2' : '#dbeafe',
            color: msg.type === 'error' ? '#991b1b' : '#1e40af', fontSize: 14
          }}>{msg.text}</div>
        )}

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
          {['overview', 'issues', 'users', 'sections', 'moderation'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 14,
              background: 'transparent', color: tab === t ? '#2563eb' : '#6b7280',
              borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent',
              fontWeight: tab === t ? 600 : 400, textTransform: 'capitalize'
            }}>{t}</button>
          ))}
        </div>

        {tab === 'overview' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Issues', val: stats.issues.total, sub: `${stats.issues.open} open / ${stats.issues.resolved} resolved` },
                { label: 'Total Users', val: stats.users.total, sub: `${stats.users.mentors} mentors / ${stats.users.admins} admins` },
                { label: 'Pinned Issues', val: stats.pinned, sub: `${stats.featured} featured` },
                { label: 'Top SP Holder', val: stats.topHolders[0]?.name || 'N/A', sub: `${stats.topHolders[0]?.sp || 0} SP` }
              ].map(({ label, val, sub }) => (
                <div key={label} style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{val}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>

            {stats.topHolders.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb', marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Top SP Holders</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      {['#', 'Name', 'Email', 'Role', 'SP'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topHolders.map((u, i) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 12px', color: '#9ca3af' }}>{i + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{u.name}</td>
                        <td style={{ padding: '8px 12px', color: '#6b7280' }}>{u.email}</td>
                        <td style={{ padding: '8px 12px' }}><span style={{ background: u.role === 'admin' ? '#dbeafe' : u.role === 'mentor' ? '#d1fae5' : '#f3f4f6', padding: '2px 8px', borderRadius: 10, fontSize: 12, textTransform: 'capitalize' }}>{u.role}</span></td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#2563eb' }}>{u.sp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {stats.recentActivity.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Recent SP Activity</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      {['User', 'Event', 'Delta', 'Reason', 'When'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActivity.map(a => (
                      <tr key={a._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 12px' }}>{a.userId?.name || 'Unknown'}</td>
                        <td style={{ padding: '8px 12px' }}><span style={{ background: a.delta > 0 ? '#d1fae5' : '#fee2e2', padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>{a.event}</span></td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: a.delta > 0 ? '#059669' : '#dc2626' }}>{a.delta > 0 ? '+' : ''}{a.delta}</td>
                        <td style={{ padding: '8px 12px', color: '#6b7280', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reason}</td>
                        <td style={{ padding: '8px 12px', color: '#9ca3af' }}>{new Date(a.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'issues' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={issueFilter.status} onChange={e => { setIssueFilter(f => ({ ...f, status: e.target.value })); loadIssues(1, { ...issueFilter, status: e.target.value }); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}>
                  <option value="">All Status</option>
                  <option value="Open">Open</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <input placeholder="Search..." value={issueFilter.search} onChange={e => setIssueFilter(f => ({ ...f, search: e.target.value }))} onKeyDown={e => e.key === 'Enter' && loadIssues(1, issueFilter)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: 200 }} />
                <button onClick={() => loadIssues(1, issueFilter)} className="btn btn-sm" style={{ background: '#2563eb', color: '#fff' }}>Search</button>
                <button onClick={async () => { try { const r = await oaq.seedBaseline(); showMsg(r.message || `${r.seeded} entries seeded`); loadIssues(); } catch(e) { showMsg(e.message, 'error'); } }} className="btn btn-sm" style={{ background: '#059669', color: '#fff' }}>Seed Baseline</button>
              </div>
            </div>

            {loading ? <p>Loading...</p> : (
              <>
                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['#', 'Query', 'Category', 'Status', 'Priority', 'Upvotes', 'Pinned', 'Actions'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#6b7280', fontWeight: 500, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map(issue => (
                        <tr key={issue._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 14px', color: '#9ca3af' }}>#{issue.issueId}</td>
                          <td style={{ padding: '10px 14px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={issue.queryText}>{issue.queryText}</td>
                          <td style={{ padding: '10px 14px' }}>{issue.categoryTag}</td>
                          <td style={{ padding: '10px 14px' }}><span style={{ background: issue.status === 'Resolved' ? '#d1fae5' : '#fef3c7', padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>{issue.status}</span></td>
                          <td style={{ padding: '10px 14px' }}><span style={{ background: issue.priority === 'HIGH' ? '#fee2e2' : '#f3f4f6', padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>{issue.priority}</span></td>
                          <td style={{ padding: '10px 14px', fontWeight: 500 }}>{issue.upvoteCount}</td>
                          <td style={{ padding: '10px 14px' }}>
                            {issue.isPinned && <span style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: 8, fontSize: 11 }}>📌</span>}
                            {issue.isFeatured && <span style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 8, fontSize: 11, marginLeft: 4 }}>⭐</span>}
                          </td>
                          <td style={{ padding: '10px 14px', display: 'flex', gap: 4 }}>
                            <button onClick={() => handlePin(issue)} title={issue.isPinned ? 'Unpin' : 'Pin'} style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontSize: 12 }}>📌</button>
                            <button onClick={() => handleFeature(issue)} title={issue.isFeatured ? 'Unfeature' : 'Feature'} style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontSize: 12 }}>⭐</button>
                            {issue.status === 'Open' && <button onClick={() => handleResolve(issue)} title="Resolve" style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontSize: 12 }}>✓</button>}
                            <button onClick={() => handleDelete(issue)} title="Delete" style={{ padding: '4px 8px', border: '1px solid #fca5a5', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#dc2626' }}>✕</button>
                          </td>
                        </tr>
                      ))}
                      {issues.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No issues found</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Total: {issueTotal}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button disabled={issuePage <= 1} onClick={() => loadIssues(issuePage - 1, issueFilter)} className="btn btn-sm" style={{ background: issuePage <= 1 ? '#f3f4f6' : '#111', color: issuePage <= 1 ? '#9ca3af' : '#fff' }}>Prev</button>
                    <span style={{ padding: '6px 12px', fontSize: 13 }}>Page {issuePage}</span>
                    <button disabled={issuePage * 15 >= issueTotal} onClick={() => loadIssues(issuePage + 1, issueFilter)} className="btn btn-sm" style={{ background: issuePage * 15 >= issueTotal ? '#f3f4f6' : '#111', color: issuePage * 15 >= issueTotal ? '#9ca3af' : '#fff' }}>Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={userFilter.role} onChange={e => { setUserFilter(f => ({ ...f, role: e.target.value })); loadUsers(1, { ...userFilter, role: e.target.value }); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}>
                  <option value="">All Roles</option>
                  <option value="intern">Intern</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
                <input placeholder="Search name/email..." value={userFilter.search} onChange={e => setUserFilter(f => ({ ...f, search: e.target.value }))} onKeyDown={e => e.key === 'Enter' && loadUsers(1, userFilter)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: 220 }} />
                <button onClick={() => loadUsers(1, userFilter)} className="btn btn-sm" style={{ background: '#2563eb', color: '#fff' }}>Search</button>
              </div>
              {currentUser?.role === 'superadmin' && (
                <button onClick={() => setShowAddUser(v => !v)} className="btn btn-sm" style={{ background: '#059669', color: '#fff' }}>
                  {showAddUser ? 'Cancel' : '+ Add User'}
                </button>
              )}
            </div>
            {showAddUser && (
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 12px' }}>Create New User</h4>
                <form onSubmit={async e => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  try {
                    await admin.createUser({
                      name: fd.get('name'), email: fd.get('email'),
                      password: fd.get('password'), role: fd.get('role')
                    });
                    showMsg('User created');
                    e.target.reset();
                    setShowAddUser(false);
                    loadUsers(userPage, userFilter);
                  } catch (err) { showMsg(err.message, 'error'); }
                }} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <input name="name" placeholder="Name" required style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: 150 }} />
                  <input name="email" type="email" placeholder="Email" required style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: 200 }} />
                  <input name="password" placeholder="Password" required style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: 150 }} />
                  <select name="role" style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}>
                    <option value="intern">Intern</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                  <button type="submit" className="btn btn-sm" style={{ background: '#059669', color: '#fff', padding: '8px 16px' }}>Create</button>
                </form>
              </div>
            )}

            {loading ? <p>Loading...</p> : (
              <>
                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['Name', 'Email', 'Role', 'SP Balance', 'Joined', 'Actions'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#6b7280', fontWeight: 500, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 500 }}>{u.name}</td>
                          <td style={{ padding: '10px 14px', color: '#6b7280' }}>{u.email}</td>
                          <td style={{ padding: '10px 14px' }}>
                            {currentUser?.role === 'superadmin' ? (
                              <select value={u.role} onChange={e => handleUpdateUser(u, 'role', e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12, textTransform: 'capitalize' }}>
                                <option value="intern">Intern</option>
                                <option value="mentor">Mentor</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Superadmin</option>
                              </select>
                            ) : (
                              <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{u.role}</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>{u.sp}</td>
                          <td style={{ padding: '10px 14px', color: '#9ca3af' }}>{new Date(u.joinDate).toLocaleDateString()}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <button onClick={() => {
                              const newSp = parseInt(prompt(`Adjust SP for ${u.name} (current: ${u.sp}):`));
                              if (!isNaN(newSp)) handleUpdateUser(u, 'sp', newSp);
                            }} style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontSize: 12 }}>Adjust SP</button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No users found</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Total: {userTotal}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button disabled={userPage <= 1} onClick={() => loadUsers(userPage - 1, userFilter)} className="btn btn-sm" style={{ background: userPage <= 1 ? '#f3f4f6' : '#111', color: userPage <= 1 ? '#9ca3af' : '#fff' }}>Prev</button>
                    <span style={{ padding: '6px 12px', fontSize: 13 }}>Page {userPage}</span>
                    <button disabled={userPage * 15 >= userTotal} onClick={() => loadUsers(userPage + 1, userFilter)} className="btn btn-sm" style={{ background: userPage * 15 >= userTotal ? '#f3f4f6' : '#111', color: userPage * 15 >= userTotal ? '#9ca3af' : '#fff' }}>Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'sections' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Add New Section</h3>
              <form onSubmit={handleCreateSection} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Name</label>
                  <input name="name" required style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: 160 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Code</label>
                  <input name="code" required style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: 80 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Color</label>
                  <input name="color" type="color" defaultValue="#3b82f6" style={{ padding: '4px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 14, width: 60 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Description</label>
                  <input name="description" style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: 200 }} />
                </div>
                <button type="submit" className="btn btn-sm" style={{ background: '#2563eb', color: '#fff', padding: '8px 16px' }}>Add</button>
              </form>
            </div>

            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Code', 'Name', 'Color', 'Description'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#6b7280', fontWeight: 500, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sections.map(s => (
                    <tr key={s._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{s.code}</td>
                      <td style={{ padding: '10px 14px' }}>{s.name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 4, background: s.color || '#3b82f6' }} />
                      </td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>{s.description || '-'}</td>
                    </tr>
                  ))}
                  {sections.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No sections yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'moderation' && (
          <div>
            {[
              { key: 'flagged',   label: 'Flagged by Mentors',   color: '#dc2626' },
              { key: 'downvoted', label: 'Heavily Downvoted (2+)', color: '#f59e0b' },
              { key: 'noAnswer',  label: 'No Answers Yet',        color: '#6b7280' },
            ].map(({ key, label, color }) => (
              modQueue[key]?.length > 0 && (
                <div key={key} style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color, marginBottom: 12 }}>{label} ({modQueue[key].length})</h3>
                  <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    {modQueue[key].map(issue => (
                      <div key={issue._id} style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.queryText}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>
                            {issue.communityReplies?.length || 0} replies · Raised by {issue.raisedBy?.name || 'Unknown'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={async () => {
                            if (!confirm('Promote the top reply as the answer?')) return;
                            try {
                              const replyId = issue.communityReplies?.[0]?._id;
                              if (!replyId) return;
                              await oaq.promoteReply(issue._id, replyId);
                              showMsg('Reply promoted to answer');
                              loadModeration();
                            } catch (e) { showMsg(e.message, 'error'); }
                          }} style={{ padding: '5px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Promote Best</button>
                          <button onClick={async () => {
                            try {
                              await admin.deleteIssue(issue._id);
                              showMsg('Issue deleted');
                              loadModeration();
                            } catch (e) { showMsg(e.message, 'error'); }
                          }} style={{ padding: '5px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
            {modQueue.flagged?.length === 0 && modQueue.noAnswer?.length === 0 && modQueue.downvoted?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>Moderation queue is clear ✅</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
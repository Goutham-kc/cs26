const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('oaq_token');
}

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem('oaq_token');
    localStorage.removeItem('oaq_user');
    window.dispatchEvent(new CustomEvent('oaq:session-expired', { detail: data }));
    throw Object.assign(new Error('Session expired'), { code: 'SESSION_EXPIRED' });
  }
  if (!res.ok) throw new Error(data.reason || data.message || data.code || 'Request failed');
  return data;
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined
  });
  return handleResponse(res);
}

export const api = {
  get:    (path)       => request('GET', path),
  post:   (path, body) => request('POST', path, body),
  patch:  (path, body) => request('PATCH', path, body),
  delete: (path)       => request('DELETE', path),
};

export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password });
  localStorage.setItem('oaq_token', data.token);
  localStorage.setItem('oaq_user', JSON.stringify(data.user));
  return data;
}

export async function register(name, email, password, role = 'intern') {
  const data = await api.post('/auth/register', { name, email, password, role });
  localStorage.setItem('oaq_token', data.token);
  localStorage.setItem('oaq_user', JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem('oaq_token');
  localStorage.removeItem('oaq_user');
}

export async function getWallet() {
  return api.get('/sp/wallet');
}

export async function getLedger({ page = 1, limit = 20, event } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (event) params.set('event', event);
  return api.get(`/sp/ledger?${params}`);
}

export async function getLeaderboard(limit = 10) {
  return api.get(`/sp/leaderboard?limit=${limit}`);
}

export async function getMyIssues() {
  return api.get('/sp/my-issues');
}

export async function getTrending() {
  return api.get('/oaq/trending');
}

export async function resolveIssue(issueId, answer) {
  return api.post(`/oaq/issues/${issueId}/resolve`, { answer });
}

export async function upvoteIssue(issueId) {
  return api.patch(`/oaq/issues/${issueId}/upvote`);
}

export const admin = {
  getStats: (range = 'all') => {
    const q = range !== 'all' ? `?range=${range}` : '';
    return api.get(`/admin/stats${q}`);
  },
  getIssues: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/issues?${q}`);
  },
  getIssue: (id) => api.get(`/admin/issues/${id}`),
  createIssue: (data) => api.post('/admin/issues', data),
  updateIssue: (id, data) => api.patch(`/admin/issues/${id}`, data),
  deleteIssue: (id) => api.delete(`/admin/issues/${id}`),
  pinIssue: (id) => api.patch(`/admin/issues/${id}/pin`),
  featureIssue: (id) => api.patch(`/admin/issues/${id}/feature`),
  resolveIssue: (id, answer) => api.patch(`/admin/issues/${id}/resolve`, { answer }),
  getUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/users?${q}`);
  },
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  createUser: (data) => api.post('/admin/users', data),
  getUserSPHistory: (id) => api.get(`/admin/users/${id}/sp-history`),
  getSections: () => api.get('/admin/sections'),
  createSection: (data) => api.post('/admin/sections', data),
  getModerationQueue: () => api.get('/oaq/moderation-queue'),
};

export const users = {
  getProfile: (id) => api.get(`/users/${id}/stats`),
};

export const oaq = {
  seedBaseline: () => api.post('/oaq/seed-baseline'),
  voteReply: (issueId, replyId, type) => api.patch(`/oaq/issues/${issueId}/replies/${replyId}/vote`, { type }),
  flagReply: (issueId, replyId) => api.patch(`/oaq/issues/${issueId}/replies/${replyId}/flag`),
  promoteReply: (issueId, replyId) => api.patch(`/oaq/issues/${issueId}/replies/${replyId}/promote`),
  getModerationQueue: () => api.get('/oaq/moderation-queue'),
  getOpenQueries: () => api.get('/oaq/open-queries'),
  submitReply: (issueId, answer) => api.post(`/oaq/issues/${issueId}/community-reply`, { answer }),
  markDuplicate: (issueId, duplicateOfId) => api.patch(`/oaq/issues/${issueId}/duplicate`, { duplicateOfId }),
};

export const threads = {
  list: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));
    const q = new URLSearchParams(clean).toString();
    return api.get(`/threads${q ? '?' + q : ''}`);
  },
  get: (id) => api.get(`/threads/${id}`),
  create: (data) => api.post('/threads', data),
  reply: (id, data) => api.post(`/threads/${id}/reply`, data),
  voteReply: (id, replyId, type) => api.patch(`/threads/${id}/reply/${replyId}/vote`, { type }),
  acceptReply: (id, replyId) => api.patch(`/threads/${id}/reply/${replyId}/accept`),
  upvote: (id) => api.patch(`/threads/${id}/upvote`),
  lock: (id) => api.patch(`/threads/${id}/lock`),
  unlock: (id) => api.patch(`/threads/${id}/unlock`),
  close: (id, { spReward, rewardUserId }) => api.patch(`/threads/${id}/close`, { spReward, rewardUserId }),
  resolve: (id, data) => api.patch(`/threads/${id}/resolve`, data),
  assign: (id, userId) => api.patch(`/threads/${id}/assign`, { userId }),
  setPriority: (id, priority) => api.patch(`/threads/${id}/priority`, { priority }),
  delete: (id) => api.delete(`/threads/${id}`),
};

export const rag = {
  chat: (messages, token) => {
    const BASE = import.meta.env.VITE_API_URL || '/api';
    return fetch(`${BASE}/rag/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ messages }),
    });
  },
};
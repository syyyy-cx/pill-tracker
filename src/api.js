// src/api.js - Frontend API client
const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error);
  }
  return res.json();
}

export const api = {
  // 药局
  createPharmacy: (nickname, avatar) =>
    request('/pharmacy/create', { method: 'POST', body: JSON.stringify({ nickname, avatar }) }),
  joinPharmacy: (nickname, inviteCode, avatar) =>
    request('/pharmacy/join', { method: 'POST', body: JSON.stringify({ nickname, inviteCode, avatar }) }),
  getPharmacy: () => request('/pharmacy/info'),

  // 药品
  getMedicines: () => request('/medicines'),
  addMedicine: (data) => request('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicine: (id, data) => request(`/medicines?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedicine: (id) => request(`/medicines?id=${id}`, { method: 'DELETE' }),

  // 打卡
  getTodayCheckIns: () => request('/checkins/today'),
  doCheckIn: (medicineId, message) =>
    request('/checkins/do', { method: 'POST', body: JSON.stringify({ medicineId, message }) }),
  getCheckInHistory: (period) => request(`/checkins/history?period=${period}`),

  // 成就
  getAchievements: () => request('/achievements'),

  // 消息
  getMessages: (since) => request(`/messages${since ? `?since=${since}` : ''}`),
  sendMessage: (content) => request('/messages', { method: 'POST', body: JSON.stringify({ content }) }),

  // 契约
  getContract: () => request('/contracts'),
  createContract: (data) => request('/contracts', { method: 'POST', body: JSON.stringify(data) }),

  // 统计
  getStats: (period) => request(`/stats?period=${period}`),

  // AI
  generateEncouragement: () => request('/ai/encourage', { method: 'POST' }),
};

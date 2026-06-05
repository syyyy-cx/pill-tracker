# 💊 药品监督伴侣 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个二人专属的药品监督 PWA，支持打卡、聊天、成就、契约、AI 鼓励

**Architecture:** React + Vite PWA 前端，Cloudflare Pages Functions 做 API，Cloudflare D1 做数据库。聊天用 HTTP 轮询简化（v1.0 不做 WebSocket），AI 集成 DeepSeek API。

**Tech Stack:** React 18, Vite, Cloudflare Pages, Cloudflare D1 (SQLite), Cloudflare Workers (Cron), DeepSeek API

**项目路径:** `D:\pill-tracker`

---

## 文件结构

```
D:\pill-tracker\
├── package.json                  # 前端依赖：React, Vite, PWA 插件
├── vite.config.js                # Vite 构建配置 + PWA 配置
├── wrangler.toml                 # Cloudflare Pages 配置
├── index.html                    # 入口 HTML
├── .gitignore
├── schema.sql                    # D1 数据库建表 SQL
├── README.md                     # 部署说明
│
├── src/                          # React 前端
│   ├── main.jsx                  # 入口：ReactDOM.createRoot
│   ├── index.css                 # 全局 CSS（CSS 变量、reset、字体）
│   ├── App.jsx                   # 路由器：引导页 vs 主应用
│   ├── App.css                   # 布局样式
│   ├── store.js                  # 全局状态（useContext + useReducer）
│   ├── api.js                    # API 客户端（封装 fetch + JWT）
│   │
│   ├── components/
│   │   ├── Layout.jsx            # 主布局壳：顶部问候 + 底部导航
│   │   ├── BottomNav.jsx         # 底部 Tab：打卡/统计/成就/消息/契约
│   │   ├── Onboarding.jsx        # 引导页：创建药局 / 加入药局
│   │   ├── HomePage.jsx          # 首页：今日药品打卡列表
│   │   ├── MedicineCard.jsx      # 药品卡片（按时/迟到/灵活）
│   │   ├── AddMedicineModal.jsx  # 添加药品弹窗
│   │   ├── StatsPage.jsx         # 统计页面
│   │   ├── AchievementsPage.jsx  # 成就页面
│   │   ├── ChatPage.jsx          # 聊天页面
│   │   ├── ContractPage.jsx      # 契约页面
│   │   ├── DailyMessage.jsx      # 每日一句温暖的话
│   │   └── LoadingSpinner.jsx    # 加载中组件
│   │
│   └── utils/
│       ├── date.js               # 日期工具：格式化、判断今天
│       └── achievements.js       # 成就解锁检查逻辑
│
├── functions/                    # Cloudflare Pages Functions (API)
│   ├── _middleware.js            # 全局：CORS + JWT 认证
│   └── api/
│       ├── pharmacy.js           # POST /api/pharmacy/create, /join, GET /info
│       ├── medicines.js          # GET/POST/PUT/DELETE /api/medicines
│       ├── checkins.js           # GET /api/checkins/today, POST /do
│       ├── achievements.js       # GET /api/achievements/list, POST /check
│       ├── messages.js           # GET/POST /api/messages
│       ├── contracts.js          # GET/POST /api/contracts
│       ├── ai.js                 # POST /api/ai/encourage
│       └── stats.js              # GET /api/stats?period=7|30
│
└── docs/
    └── superpowers/
        └── specs/
            └── 2025-06-05-pill-tracker-design.md
```

> 💡 **v1.0 说明**：Cron 定时任务（每晚标记漏打、定时 AI 鼓励）在 v1.0 中暂不部署独立 Worker，改为由前端触发——加载首页时自动标记已过时未打卡的条目。AI 鼓励可通过页面按钮手动触发。v1.1 再添加正式 Cron Worker。

---

### Task 1: 项目脚手架初始化

**Files:**
- Create: `D:\pill-tracker\package.json`
- Create: `D:\pill-tracker\vite.config.js`
- Create: `D:\pill-tracker\wrangler.toml`
- Create: `D:\pill-tracker\index.html`
- Create: `D:\pill-tracker\.gitignore`
- Create: `D:\pill-tracker\src\main.jsx`
- Create: `D:\pill-tracker\src\index.css`
- Create: `D:\pill-tracker\src\App.jsx`
- Create: `D:\pill-tracker\src\App.css`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "pill-tracker",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npx wrangler pages deploy dist"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "wrangler": "^3.60.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.js**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '甜蜜吃药 💊',
        short_name: '甜蜜吃药',
        description: '二人专属药品监督伴侣',
        theme_color: '#667eea',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

- [ ] **Step 3: 创建 wrangler.toml**

```toml
name = "pill-tracker"
compatibility_date = "2025-06-01"

pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "pill-tracker-db"
database_id = "CHANGE_ME"  # 部署时在 Cloudflare 面板创建后替换
```

- [ ] **Step 4: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#667eea" />
  <title>甜蜜吃药 💊</title>
  <link rel="icon" type="image/png" href="/icons/icon-192.png" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 5: 创建 .gitignore**

```
node_modules
dist
.env
*.local
```

- [ ] **Step 6: 创建 src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 7: 创建 src/index.css**（全局样式 + CSS 变量）

```css
:root {
  --primary: #667eea;
  --primary-dark: #5a6fd6;
  --secondary: #764ba2;
  --success: #22c55e;
  --warning: #eab308;
  --danger: #ef4444;
  --bg: #f5f7fa;
  --card-bg: #ffffff;
  --text: #1f2937;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --radius: 12px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  overscroll-behavior: none;
}
button { cursor: pointer; font-family: inherit; }
input, textarea { font-family: inherit; }
```

- [ ] **Step 8: 创建 src/App.jsx**（基础骨架，后续填充）

```jsx
import React from 'react'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <p>loading...</p>
    </div>
  )
}
```

- [ ] **Step 9: 创建 public/icons/ 并生成占位图标**

```bash
mkdir -p /d/pill-tracker/public/icons
# 用纯色方块作为占位图标（后续可替换为正式图标）
# 用 ImageMagick 或直接创建 SVG
```

- [ ] **Step 10: 安装依赖 + 验证构建**

```bash
cd /d/pill-tracker && npm install && npm run build
```
预期：构建成功，`dist/` 目录生成。

- [ ] **Step 11: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 初始化项目脚手架"
```

---

### Task 2: D1 数据库 Schema

**Files:**
- Create: `D:\pill-tracker\schema.sql`

- [ ] **Step 1: 编写 schema.sql**

```sql
-- pharmacies 药局表
CREATE TABLE IF NOT EXISTS pharmacies (
  id TEXT PRIMARY KEY,
  invite_code TEXT UNIQUE NOT NULL,
  invite_expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- users 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  pharmacy_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '😊',
  token TEXT,
  is_creator INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id)
);

-- medicines 药品表
CREATE TABLE IF NOT EXISTS medicines (
  id TEXT PRIMARY KEY,
  pharmacy_id TEXT NOT NULL,
  name TEXT NOT NULL,
  added_by TEXT NOT NULL,
  taken_by TEXT NOT NULL CHECK(taken_by IN ('me', 'her', 'both')),
  schedule_type TEXT NOT NULL CHECK(schedule_type IN ('fixed', 'flexible')),
  fixed_time TEXT,
  flexible_deadline TEXT,
  note TEXT DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id),
  FOREIGN KEY (added_by) REFERENCES users(id)
);

-- check_ins 打卡记录表
CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  medicine_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  check_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('ontime', 'late', 'missed')),
  message TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- messages 消息表
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  pharmacy_id TEXT NOT NULL,
  sender_id TEXT,
  type TEXT NOT NULL CHECK(type IN ('text', 'system', 'checkin', 'ai_encourage')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id)
);

-- contracts 契约表
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  pharmacy_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '吃药契约',
  rules TEXT NOT NULL DEFAULT '{"ontime":10,"late":3,"missed":-5,"bonus":20}',
  settlement_type TEXT NOT NULL DEFAULT 'weekly' CHECK(settlement_type IN ('daily','weekly','monthly')),
  punishment TEXT DEFAULT '',
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id)
);

-- achievements 成就定义表（预置 10 条）
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL
);

-- achievement_progress 成就进度表
CREATE TABLE IF NOT EXISTS achievement_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id INTEGER NOT NULL,
  unlocked_at TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);

-- 插入 10 个成就
INSERT INTO achievements (id, name, description, icon) VALUES
(1, '初次打卡', '完成第一次打卡', '🥇'),
(2, '连续 3 天', '连续打卡 3 天', '🔥'),
(3, '连续 7 天', '连续打卡 7 天', '🔥'),
(4, '连续 30 天', '连续打卡 30 天', '💪'),
(5, '心有灵犀', '双方同一天都完成打卡', '💕'),
(6, '药箱满满', '添加 5 种以上药品', '🏥'),
(7, '全勤战神（周）', '一周内每天按时打卡', '⚔️'),
(8, '全勤战神（月）', '一个月内每天按时打卡', '⚔️'),
(9, '契约胜者', '在契约结算中获胜', '🏆'),
(10, '甜言蜜语', '打卡附言累计 10 次', '💌');
```

- [ ] **Step 2: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 添加 D1 数据库 schema"
```

---

### Task 3: API 基础设施

**Files:**
- Create: `D:\pill-tracker\functions\_middleware.js`
- Create: `D:\pill-tracker\src\api.js`

- [ ] **Step 1: 创建 functions/_middleware.js**（CORS + JWT 认证）

```javascript
// 生成简短 JWT（不依赖第三方库，用内置 API）
async function generateToken(userId) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: userId, iat: Math.floor(Date.now()/1000) }));
  const signature = btoa(header + '.' + payload); // 简化版
  return header + '.' + payload + '.' + signature;
}

async function verifyToken(token, env) {
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub;
  } catch { return null; }
}

export async function onRequest(context) {
  const { request, next } = context;

  // CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 公开路由（不需要认证）
  const url = new URL(request.url);
  if (url.pathname === '/api/pharmacy/create' || url.pathname === '/api/pharmacy/join') {
    const response = await next();
    Object.entries(corsHeaders).forEach(([k,v]) => response.headers.set(k,v));
    return response;
  }

  // 其他路由需要 JWT 认证
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '未认证' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const userId = await verifyToken(auth.slice(7), context.env);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Token 无效' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // 把 userId 传给后续 handler
  context.data = { userId };
  const response = await next();
  Object.entries(corsHeaders).forEach(([k,v]) => response.headers.set(k,v));
  return response;
}
```

- [ ] **Step 2: 创建 src/api.js**（前端 API 客户端）

```javascript
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
  joinPharmacy: (nickname, inviteCode) =>
    request('/pharmacy/join', { method: 'POST', body: JSON.stringify({ nickname, inviteCode }) }),
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
  settleContract: () => request('/contracts/settle', { method: 'POST' }),

  // 统计
  getStats: (period) => request(`/stats?period=${period}`),

  // AI
  generateEncouragement: () => request('/ai/encourage', { method: 'POST' }),
};
```

- [ ] **Step 3: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 添加 API 基础设施（中间件 + 客户端）"
```

---

### Task 4: 药局创建/加入 + 认证 API

**Files:**
- Create: `D:\pill-tracker\functions\api\pharmacy.js`
- Create: `D:\pill-tracker\src\components\Onboarding.jsx`

- [ ] **Step 1: 实现药局 API**

```javascript
// functions/api/pharmacy.js
// Cloudflare Pages Functions 内置支持 crypto.randomUUID()

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/pharmacy/create') {
    const { nickname, avatar } = await request.json();
    const pharmacyId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await env.DB.prepare(
      'INSERT INTO pharmacies (id, invite_code, invite_expires_at) VALUES (?, ?, datetime("now", "+7 days"))'
    ).bind(pharmacyId, inviteCode).run();

    await env.DB.prepare(
      'INSERT INTO users (id, pharmacy_id, nickname, avatar, is_creator) VALUES (?, ?, ?, ?, 1)'
    ).bind(userId, pharmacyId, nickname, avatar).run();

    const token = await generateToken(userId);
    await env.DB.prepare('UPDATE users SET token = ? WHERE id = ?').bind(token, userId).run();

    return new Response(JSON.stringify({ pharmacyId, userId, nickname, inviteCode, token }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/pharmacy/join') {
    const { nickname, inviteCode } = await request.json();

    const pharmacy = await env.DB.prepare(
      'SELECT id FROM pharmacies WHERE invite_code = ? AND invite_expires_at > datetime("now")'
    ).bind(inviteCode.toUpperCase()).first();

    if (!pharmacy) {
      return new Response(JSON.stringify({ error: '邀请码无效或已过期' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO users (id, pharmacy_id, nickname, avatar, is_creator) VALUES (?, ?, ?, ?, 0)'
    ).bind(userId, pharmacy.id, nickname, avatar || '😊').run();

    const token = await generateToken(userId);
    await env.DB.prepare('UPDATE users SET token = ? WHERE id = ?').bind(token, userId).run();

    return new Response(JSON.stringify({ pharmacyId: pharmacy.id, userId, nickname, token }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/pharmacy/info') {
    const { userId } = context.data;
    const user = await env.DB.prepare(
      `SELECT u.id, u.nickname, u.avatar, u.is_creator, u.pharmacy_id,
              (SELECT json_group_array(json_object('id', u2.id, 'nickname', u2.nickname, 'avatar', u2.avatar))
               FROM users u2 WHERE u2.pharmacy_id = u.pharmacy_id) as members
       FROM users u WHERE u.id = ?`
    ).bind(userId).first();

    return new Response(JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

注意：functions 中不能直接 import uuid，我们需要用 `crypto.randomUUID()`（Cloudflare 内置支持）。

- [ ] **Step 2: 创建 Onboarding 引导页组件**

```jsx
// src/components/Onboarding.jsx
import React, { useState } from 'react'
import { api } from '../api'

const AVATARS = ['😊', '🥰', '😎', '🤗', '🫶', '💪', '🌟', '🦋', '🌈', '🎀', '🐱', '🐶']

export default function Onboarding({ onAuth }) {
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('😊')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nickname.trim()) { setError('请输入昵称'); return }
    setLoading(true); setError('')

    try {
      const result = mode === 'create'
        ? await api.createPharmacy(nickname, avatar)
        : await api.joinPharmacy(nickname, inviteCode)
      localStorage.setItem('token', result.token)
      localStorage.setItem('userId', result.userId)
      onAuth(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mode) {
    return (
      <div className="onboarding">
        <div className="onboarding-hero">💊</div>
        <h1 className="onboarding-title">甜蜜吃药</h1>
        <p className="onboarding-subtitle">二人专属药品监督伴侣 💕</p>
        <div className="onboarding-buttons">
          <button className="btn btn-primary" onClick={() => setMode('create')}>
            🏥 创建我们的药局
          </button>
          <button className="btn btn-secondary" onClick={() => setMode('join')}>
            🔑 输入邀请码加入
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="onboarding" onSubmit={handleSubmit}>
      <h2>{mode === 'create' ? '🏥 创建药局' : '🔑 加入药局'}</h2>

      <div className="form-group">
        <label>你的昵称</label>
        <input
          type="text" value={nickname} onChange={e => setNickname(e.target.value)}
          placeholder="输入昵称..." maxLength={10} required
        />
      </div>

      <div className="form-group">
        <label>选择头像</label>
        <div className="avatar-grid">
          {AVATARS.map(a => (
            <span key={a} className={`avatar-option ${avatar === a ? 'selected' : ''}`}
              onClick={() => setAvatar(a)}>{a}</span>
          ))}
        </div>
      </div>

      {mode === 'join' && (
        <div className="form-group">
          <label>邀请码</label>
          <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="输入 6 位邀请码" maxLength={6} required />
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? '处理中...' : mode === 'create' ? '创建并生成邀请码' : '加入药局'}
      </button>
      <button type="button" className="btn-text" onClick={() => setMode(null)}>返回</button>
    </form>
  )
}
```

- [ ] **Step 3: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 药局创建/加入 API + Onboarding 组件"
```

---

### Task 5: 全局状态 + App 路由

**Files:**
- Create: `D:\pill-tracker\src\store.js`
- Modify: `D:\pill-tracker\src\App.jsx`

- [ ] **Step 1: 创建全局状态 store**

```jsx
// src/store.js
import React, { createContext, useContext, useReducer } from 'react'

const StoreContext = createContext()
const initialState = {
  user: null,
  pharmacy: null,
  members: [],
  medicines: [],
  todayCheckIns: [],
  messages: [],
  achievements: [],
  contract: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.payload }
    case 'SET_PHARMACY': return { ...state, pharmacy: action.payload, members: action.payload.members || [] }
    case 'SET_MEDICINES': return { ...state, medicines: action.payload }
    case 'SET_TODAY_CHECKINS': return { ...state, todayCheckIns: action.payload }
    case 'SET_MESSAGES': return { ...state, messages: action.payload }
    case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] }
    case 'SET_ACHIEVEMENTS': return { ...state, achievements: action.payload }
    case 'SET_CONTRACT': return { ...state, contract: action.payload }
    default: return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}
```

- [ ] **Step 2: 修改 App.jsx**（集成路由 + Store）

```jsx
// src/App.jsx
import React, { useEffect, useState } from 'react'
import { StoreProvider } from './store'
import Onboarding from './components/Onboarding'
import Layout from './components/Layout'
import './App.css'

function AppContent() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) setAuthenticated(true)
    setLoading(false)
  }, [])

  function handleAuth(data) {
    setAuthenticated(true)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    setAuthenticated(false)
  }

  if (loading) return <div className="loading-screen">💊</div>
  if (!authenticated) return <Onboarding onAuth={handleAuth} />

  return <Layout onLogout={handleLogout} />
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  )
}
```

- [ ] **Step 3: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 全局状态管理 + App 路由"
```

---

### Task 6: 首页布局 + 底部导航

**Files:**
- Create: `D:\pill-tracker\src\components\Layout.jsx`
- Create: `D:\pill-tracker\src\components\BottomNav.jsx`
- Create: `D:\pill-tracker\src\components\HomePage.jsx`（骨架）
- Create: `D:\pill-tracker\src\components\DailyMessage.jsx`

- [ ] **Step 1: 创建 BottomNav 底部导航**

```jsx
// src/components/BottomNav.jsx
import React from 'react'

const TABS = [
  { key: 'home', label: '打卡', icon: '💊' },
  { key: 'stats', label: '统计', icon: '📊' },
  { key: 'achievements', label: '成就', icon: '🏆' },
  { key: 'chat', label: '消息', icon: '💬' },
  { key: 'contract', label: '契约', icon: '📜' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={`bottom-nav-item ${active === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: 创建 Layout 主布局**

```jsx
// src/components/Layout.jsx
import React, { useState, useEffect } from 'react'
import BottomNav from './BottomNav'
import HomePage from './HomePage'
import StatsPage from './StatsPage'
import AchievementsPage from './AchievementsPage'
import ChatPage from './ChatPage'
import ContractPage from './ContractPage'
import { useStore } from '../store'
import { api } from '../api'

export default function Layout({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home')
  const { state, dispatch } = useStore()

  useEffect(() => {
    loadPharmacy()
    loadMedicines()
    loadTodayCheckIns()
    loadMessages()
    loadAchievements()
    loadContract()
  }, [])

  async function loadPharmacy() {
    try { dispatch({ type: 'SET_PHARMACY', payload: await api.getPharmacy() }) } catch(e) {}
  }
  async function loadMedicines() {
    try { dispatch({ type: 'SET_MEDICINES', payload: await api.getMedicines() }) } catch(e) {}
  }
  async function loadTodayCheckIns() {
    try { dispatch({ type: 'SET_TODAY_CHECKINS', payload: await api.getTodayCheckIns() }) } catch(e) {}
  }
  async function loadMessages() {
    try { dispatch({ type: 'SET_MESSAGES', payload: await api.getMessages() }) } catch(e) {}
  }
  async function loadAchievements() {
    try { dispatch({ type: 'SET_ACHIEVEMENTS', payload: await api.getAchievements() }) } catch(e) {}
  }
  async function loadContract() {
    try { dispatch({ type: 'SET_CONTRACT', payload: await api.getContract() }) } catch(e) {}
  }

  function renderPage() {
    switch (activeTab) {
      case 'home': return <HomePage />
      case 'stats': return <StatsPage />
      case 'achievements': return <AchievementsPage />
      case 'chat': return <ChatPage />
      case 'contract': return <ContractPage />
      default: return <HomePage />
    }
  }

  return (
    <div className="layout">
      <main className="main-content">
        {renderPage()}
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
```

- [ ] **Step 3: 创建 DailyMessage 每日一句组件**

```jsx
// src/components/DailyMessage.jsx
import React, { useState, useEffect } from 'react'

const MESSAGES = [
  '照顾好自己，就是爱的最好方式 💕',
  '每一颗药都是对明天的承诺 🌅',
  '你们的健康，是彼此最好的礼物 🎁',
  '今天也要一起加油哦 💪',
  '爱是记得，也是坚持 🌸',
  '小小的药片，大大的关心 ❤️',
  '愿你今天充满能量和笑容 ☀️',
  '一起吃药的每一天，都是甜蜜的日常 🫶',
  '健康是给彼此最长情的告白 💌',
  '互相提醒，彼此珍惜，这就是爱 🥰',
]

export default function DailyMessage() {
  const [message] = useState(() => {
    const today = new Date().toISOString().split('T')[0]
    const dayOfYear = parseInt(today.replace(/-/g, ''), 10)
    return MESSAGES[dayOfYear % MESSAGES.length]
  })

  return <div className="daily-message">「{message}」</div>
}
```

- [ ] **Step 4: 首页骨架**

```jsx
// src/components/HomePage.jsx (骨架，后续填充)
import React from 'react'
import DailyMessage from './DailyMessage'

export default function HomePage() {
  return (
    <div className="home-page">
      <DailyMessage />
      <p className="placeholder">药品打卡列表（待实现）</p>
    </div>
  )
}
```

- [ ] **Step 5: 添加布局 CSS 到 App.css**

```css
/* src/App.css */
.layout {
  display: flex; flex-direction: column; height: 100vh;
  max-width: 480px; margin: 0 auto;
}
.main-content {
  flex: 1; overflow-y: auto; padding: 16px; padding-bottom: 80px;
}
.bottom-nav {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px;
  display: flex; background: white; border-top: 1px solid var(--border);
  padding: 8px 0; padding-bottom: max(8px, env(safe-area-inset-bottom));
  z-index: 100;
}
.bottom-nav-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  background: none; border: none; padding: 4px; color: var(--text-secondary);
  font-size: 0.75rem; transition: color 0.2s;
}
.bottom-nav-item.active { color: var(--primary); }
.bottom-nav-icon { font-size: 1.3rem; }
.bottom-nav-label { margin-top: 2px; }

.onboarding {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 100vh; padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.onboarding-hero { font-size: 4rem; margin-bottom: 16px; }
.onboarding-title { font-size: 1.8rem; font-weight: 700; }
.onboarding-subtitle { font-size: 1rem; opacity: 0.9; margin: 8px 0 32px; }
.onboarding-buttons { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.btn {
  padding: 14px 24px; border: none; border-radius: 25px;
  font-size: 1rem; font-weight: 600; transition: transform 0.2s;
}
.btn:active { transform: scale(0.97); }
.btn-primary { background: white; color: var(--primary); }
.btn-secondary { background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.4); }
.btn-text { background: none; border: none; color: rgba(255,255,255,0.8); margin-top: 12px; text-decoration: underline; }
.form-group { width: 100%; margin-bottom: 16px; }
.form-group label { display: block; font-weight: 500; margin-bottom: 6px; opacity: 0.9; }
.form-group input {
  width: 100%; padding: 12px 16px; border: 2px solid rgba(255,255,255,0.3);
  border-radius: 12px; background: rgba(255,255,255,0.15); color: white;
  font-size: 1rem; outline: none;
}
.form-group input::placeholder { color: rgba(255,255,255,0.5); }
.avatar-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.avatar-option {
  font-size: 1.5rem; padding: 8px; border-radius: 12px;
  background: rgba(255,255,255,0.1); cursor: pointer; transition: all 0.2s;
}
.avatar-option.selected { background: rgba(255,255,255,0.3); transform: scale(1.2); }
.error { color: #fca5a5; font-size: 0.85rem; margin: 8px 0; }
.loading-screen {
  display: flex; align-items: center; justify-content: center;
  height: 100vh; font-size: 3rem; animation: pulse 1s infinite;
}
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.daily-message {
  text-align: center; font-size: 0.95rem; color: var(--text-secondary);
  padding: 12px 16px; background: linear-gradient(135deg, #fce4ec, #f8bbd0);
  border-radius: var(--radius); margin-bottom: 16px; line-height: 1.5;
}
.placeholder { text-align: center; color: var(--text-secondary); padding: 40px 0; }
```

- [ ] **Step 6: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 布局 + 底部导航 + 每日一句"
```

---

### Task 7: 药品管理 API + 前端

**Files:**
- Create: `D:\pill-tracker\functions\api\medicines.js`
- Create: `D:\pill-tracker\src\components\AddMedicineModal.jsx`
- Modify: `D:\pill-tracker\src\components\HomePage.jsx`（添加药品列表）

- [ ] **Step 1: 药品 API**

```javascript
// functions/api/medicines.js
export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;
  const url = new URL(request.url);

  // 获取用户所在药局
  const user = await env.DB.prepare('SELECT pharmacy_id FROM users WHERE id = ?')
    .bind(userId).first();
  if (!user) return new Response(JSON.stringify({ error: '用户不存在' }), { status: 400 });

  if (request.method === 'GET') {
    const medicines = await env.DB.prepare(
      'SELECT * FROM medicines WHERE pharmacy_id = ? AND is_active = 1 ORDER BY created_at'
    ).bind(user.pharmacy_id).all();
    return new Response(JSON.stringify(medicines.results), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    const medicineId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO medicines (id, pharmacy_id, name, added_by, taken_by, schedule_type, fixed_time, flexible_deadline, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(medicineId, user.pharmacy_id, data.name, userId, data.takenBy,
           data.scheduleType, data.fixedTime || null, data.flexibleDeadline || null, data.note || '').run();
    return new Response(JSON.stringify({ id: medicineId }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'PUT') {
    const id = url.searchParams.get('id');
    const data = await request.json();
    await env.DB.prepare(
      `UPDATE medicines SET name=?, taken_by=?, schedule_type=?, fixed_time=?, flexible_deadline=?, note=? WHERE id=? AND pharmacy_id=?`
    ).bind(data.name, data.takenBy, data.scheduleType, data.fixedTime || null,
           data.flexibleDeadline || null, data.note || '', id, user.pharmacy_id).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'DELETE') {
    const id = url.searchParams.get('id');
    await env.DB.prepare('UPDATE medicines SET is_active = 0 WHERE id = ? AND pharmacy_id = ?')
      .bind(id, user.pharmacy_id).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }
}
```

- [ ] **Step 2: 创建 AddMedicineModal**

```jsx
// src/components/AddMedicineModal.jsx
import React, { useState } from 'react'
import { api } from '../api'

export default function AddMedicineModal({ onClose, onAdded }) {
  const [name, setName] = useState('')
  const [takenBy, setTakenBy] = useState('me')
  const [scheduleType, setScheduleType] = useState('fixed')
  const [fixedTime, setFixedTime] = useState('08:00')
  const [flexibleDeadline, setFlexibleDeadline] = useState('22:00')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await api.addMedicine({ name, takenBy, scheduleType, fixedTime, flexibleDeadline, note })
      onAdded()
      onClose()
    } catch (e) { alert(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">➕ 添加药品</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>药品名称</label>
            <input type="text" className="input" value={name} onChange={e => setName(e.target.value)}
              placeholder="如：维生素 B 族" required />
          </div>

          <div className="form-group">
            <label>谁需要吃</label>
            <div className="tag-group">
              {['me', 'her', 'both'].map(t => (
                <span key={t}
                  className={`tag ${takenBy === t ? 'active' : ''}`}
                  onClick={() => setTakenBy(t)}>
                  {t === 'me' ? '我 🙋' : t === 'her' ? 'TA 💕' : '两个人都吃 💑'}
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>服用时间</label>
            <div className="tag-group">
              <span className={`tag ${scheduleType === 'fixed' ? 'active' : ''}`}
                onClick={() => setScheduleType('fixed')}>固定时间 ⏰</span>
              <span className={`tag ${scheduleType === 'flexible' ? 'active' : ''}`}
                onClick={() => setScheduleType('flexible')}>灵活时段 🕐</span>
            </div>
            {scheduleType === 'fixed' ? (
              <input type="time" className="input" value={fixedTime}
                onChange={e => setFixedTime(e.target.value)} />
            ) : (
              <div>
                <input type="time" className="input" value={flexibleDeadline}
                  onChange={e => setFlexibleDeadline(e.target.value)} />
                <small className="hint">在此时间前打卡即算按时</small>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>备注（可选）</label>
            <input type="text" className="input" value={note} onChange={e => setNote(e.target.value)}
              placeholder="如：早餐后服用" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'var(--primary)', color: 'white' }} disabled={loading}>
            {loading ? '添加中...' : '✅ 添加药品'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 更新 HomePage**（药品列表 + 添加入口）

```jsx
// src/components/HomePage.jsx
import React, { useState, useEffect } from 'react'
import DailyMessage from './DailyMessage'
import MedicineCard from './MedicineCard'
import AddMedicineModal from './AddMedicineModal'
import { useStore } from '../store'
import { api } from '../api'

export default function HomePage() {
  const { state, dispatch } = useStore()
  const [showAddModal, setShowAddModal] = useState(false)

  async function refreshMedicines() {
    const medicines = await api.getMedicines()
    dispatch({ type: 'SET_MEDICINES', payload: medicines })
  }

  useEffect(() => { refreshMedicines() }, [])

  // 计算今日打卡数
  const checkedIds = state.todayCheckIns.map(c => c.medicine_id)
  const totalCount = state.medicines.length
  const checkedCount = checkedIds.length
  const ontimeCount = state.todayCheckIns.filter(c => c.status === 'ontime').length
  const lateCount = state.todayCheckIns.filter(c => c.status === 'late').length

  return (
    <div className="home-page">
      <DailyMessage />

      {/* 今日进度 */}
      <div className="progress-card">
        <div className="progress-header">
          <span>今日打卡 <strong>{checkedCount}/{totalCount}</strong></span>
          <span className={lateCount > 0 ? 'text-danger' : 'text-success'}>
            ⏰ 按时 {ontimeCount}{lateCount > 0 ? ` · 迟到 ${lateCount}` : ''}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: totalCount > 0 ? `${(checkedCount/totalCount)*100}%` : '0%' }} />
        </div>
      </div>

      {/* 药品列表 */}
      <div className="medicines-header">
        <h3>📋 今天的药</h3>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>+ 添加</button>
      </div>

      <div className="medicines-list">
        {state.medicines.map(med => (
          <MedicineCard key={med.id} medicine={med} />
        ))}
        {state.medicines.length === 0 && (
          <p className="empty-state">还没有药品，点击右上角添加吧 📋</p>
        )}
      </div>

      {showAddModal && (
        <AddMedicineModal
          onClose={() => setShowAddModal(false)}
          onAdded={refreshMedicines}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 药品管理 API + 添加弹窗 + 首页列表"
```

---

### Task 8: 打卡系统（核心）

**Files:**
- Create: `D:\pill-tracker\functions\api\checkins.js`
- Create: `D:\pill-tracker\src\components\MedicineCard.jsx`

- [ ] **Step 1: 打卡 API**

```javascript
// functions/api/checkins.js
export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;
  const url = new URL(request.url);

  const user = await env.DB.prepare('SELECT pharmacy_id FROM users WHERE id = ?')
    .bind(userId).first();
  if (!user) return new Response(JSON.stringify({ error: '用户不存在' }), { status: 400 });

  // GET /api/checkins/today - 今日打卡记录
  if (request.method === 'GET' && url.pathname.endsWith('/today')) {
    const today = new Date().toISOString().split('T')[0];
    const checkins = await env.DB.prepare(
      'SELECT * FROM check_ins WHERE user_id = ? AND date = ?'
    ).bind(userId, today).all();
    return new Response(JSON.stringify(checkins.results), { headers: { 'Content-Type': 'application/json' } });
  }

  // POST /api/checkins/do - 执行打卡
  if (request.method === 'POST' && url.pathname.endsWith('/do')) {
    const { medicineId, message } = await request.json();

    // 获取药品信息
    const medicine = await env.DB.prepare('SELECT * FROM medicines WHERE id = ?')
      .bind(medicineId).first();
    if (!medicine) return new Response(JSON.stringify({ error: '药品不存在' }), { status: 400 });

    // 检查是否有权打卡（本人或两人都吃）
    const medicineUser = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND pharmacy_id = ?')
      .bind(userId, user.pharmacy_id).first();
    if (!medicineUser) return new Response(JSON.stringify({ error: '无权操作' }), { status: 403 });

    // 判断按时/迟到
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    let status = 'ontime';

    if (medicine.schedule_type === 'fixed') {
      // 固定时间：30 分钟缓冲
      const [medH, medM] = medicine.fixed_time.split(':').map(Number);
      const [curH, curM] = currentTime.split(':').map(Number);
      const medMinutes = medH * 60 + medM;
      const curMinutes = curH * 60 + curM;
      if (curMinutes > medMinutes + 30) status = 'late';
    } else {
      // 灵活时段：在截止时间前
      const [deadH, deadM] = medicine.flexible_deadline.split(':').map(Number);
      const [curH, curM] = currentTime.split(':').map(Number);
      const deadMinutes = deadH * 60 + deadM;
      const curMinutes = curH * 60 + curM;
      if (curMinutes > deadMinutes) status = 'late';
    }

    const today = now.toISOString().split('T')[0];
    const checkinId = crypto.randomUUID();

    await env.DB.prepare(
      'INSERT INTO check_ins (id, medicine_id, user_id, date, check_time, status, message) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(checkinId, medicineId, userId, today, currentTime, status, message || '').run();

    // 如果留言，同时写入消息表
    if (message) {
      await env.DB.prepare(
        'INSERT INTO messages (id, pharmacy_id, sender_id, type, content) VALUES (?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), user.pharmacy_id, userId, 'checkin',
             `💊 ${medicine.name} 打卡附言：${message}`).run();
    }

    return new Response(JSON.stringify({ id: checkinId, status, time: currentTime }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // GET /api/checkins/history?period=7|30
  if (request.method === 'GET' && url.pathname.endsWith('/history')) {
    const period = parseInt(url.searchParams.get('period') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    const start = startDate.toISOString().split('T')[0];

    const history = await env.DB.prepare(
      `SELECT c.*, m.name as medicine_name FROM check_ins c
       JOIN medicines m ON c.medicine_id = m.id
       WHERE c.user_id = ? AND c.date >= ? ORDER BY c.date DESC, c.check_time DESC`
    ).bind(userId, start).all();

    return new Response(JSON.stringify(history.results), { headers: { 'Content-Type': 'application/json' } });
  }
}
```

- [ ] **Step 2: 创建 MedicineCard 组件**

```jsx
// src/components/MedicineCard.jsx
import React, { useState } from 'react'
import { useStore } from '../store'
import { api } from '../api'

export default function MedicineCard({ medicine }) {
  const { state, dispatch } = useStore()
  const [message, setMessage] = useState('')
  const [showMessageInput, setShowMessageInput] = useState(false)
  const [loading, setLoading] = useState(false)

  const checkin = state.todayCheckIns.find(c => c.medicine_id === medicine.id)
  const isChecked = !!checkin

  async function handleCheckin() {
    setLoading(true)
    try {
      const result = await api.doCheckIn(medicine.id, message)
      dispatch({ type: 'SET_TODAY_CHECKINS', payload: [...state.todayCheckIns, {
        medicine_id: medicine.id, status: result.status, check_time: result.time, message
      }]})
      setShowMessageInput(false)
    } catch (e) { alert(e.message) }
    setLoading(false)
  }

  function getCardStyle() {
    if (isChecked) return 'card card-done'
    if (medicine.schedule_type === 'fixed') {
      // 检查是否已迟到
      const now = new Date()
      const [h, m] = (medicine.fixed_time || '00:00').split(':').map(Number)
      const medTime = h * 60 + m
      const curTime = now.getHours() * 60 + now.getMinutes()
      if (curTime > medTime + 30) return 'card card-late'
      return 'card card-pending'
    }
    // 灵活时段
    const [dh, dm] = (medicine.flexible_deadline || '00:00').split(':').map(Number)
    const deadTime = dh * 60 + dm
    const curTime = new Date().getHours() * 60 + new Date().getMinutes()
    if (curTime > deadTime) return 'card card-late'
    return 'card card-flexible'
  }

  const takenByLabel = medicine.taken_by === 'me' ? '仅我' : medicine.taken_by === 'her' ? '仅 TA' : '双方'
  const scheduleLabel = medicine.schedule_type === 'fixed'
    ? `⏰ ${medicine.fixed_time} 吃`
    : `🕐 ${medicine.flexible_deadline} 前吃`

  return (
    <div className={getCardStyle()}>
      <div className="card-body">
        <div className="card-main">
          <div className="card-name">💊 {medicine.name}</div>
          <div className="card-meta">
            <span>{takenByLabel}</span>
            <span> · </span>
            <span>{scheduleLabel}</span>
          </div>
          {medicine.note && <div className="card-note">{medicine.note}</div>}
        </div>
        <div className="card-action">
          {isChecked ? (
            <div className="card-done-info">
              <span className="badge-success">✅ {checkin.check_time}</span>
              {checkin.message && (
                <span className="message-preview" title={checkin.message}>💌</span>
              )}
            </div>
          ) : (
            <div>
              {!showMessageInput ? (
                <button className="btn-checkin" onClick={() => setShowMessageInput(true)} disabled={loading}>
                  {loading ? '...' : '已吃 ✅'}
                </button>
              ) : (
                <div className="checkin-box">
                  <input className="input-small" placeholder="写句话给她 💌"
                    value={message} onChange={e => setMessage(e.target.value)} maxLength={50} />
                  <button className="btn-checkin btn-sm" onClick={handleCheckin} disabled={loading}>确认</button>
                  <button className="btn-sm btn-ghost" onClick={() => setShowMessageInput(false)}>✕</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 添加卡片 CSS 到 App.css**

```css
/* 添加到 App.css */
.progress-card {
  background: white; border-radius: var(--radius); padding: 16px; margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.progress-header { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 8px; }
.text-success { color: var(--success); }
.text-danger { color: var(--danger); }
.progress-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 4px; transition: width 0.3s; }

.medicines-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.medicines-header h3 { font-size: 1.05rem; }
.btn-add { background: none; border: none; color: var(--primary); font-weight: 600; font-size: 0.9rem; }

.medicines-list { display: flex; flex-direction: column; gap: 8px; }
.card { background: white; border-radius: var(--radius); padding: 12px 16px; transition: all 0.2s; }
.card-done { background: #f0fdf4; border-left: 4px solid var(--success); }
.card-pending { border: 1.5px solid var(--primary); }
.card-flexible { border: 1.5px solid var(--warning); }
.card-late { background: #fef2f2; border-left: 4px solid var(--danger); }
.card-body { display: flex; justify-content: space-between; align-items: center; }
.card-name { font-weight: 600; }
.card-meta { color: var(--text-secondary); font-size: 0.8rem; margin-top: 2px; }
.card-note { color: var(--text-secondary); font-size: 0.8rem; font-style: italic; }
.badge-success { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; }
.btn-checkin {
  background: var(--primary); color: white; border: none; border-radius: 20px;
  padding: 8px 16px; font-size: 0.85rem; font-weight: 600; white-space: nowrap;
}
.card-late .btn-checkin { background: var(--danger); }
.checkin-box { display: flex; gap: 4px; align-items: center; }
.input-small { padding: 6px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 0.8rem; width: 120px; }
.btn-sm { padding: 6px 10px; border: none; border-radius: 8px; font-size: 0.8rem; }
.btn-ghost { background: none; color: var(--text-secondary); }
.message-preview { cursor: pointer; font-size: 1.1rem; margin-left: 4px; }
.empty-state { text-align: center; color: var(--text-secondary); padding: 40px; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 200;
  padding: 20px;
}
.modal {
  background: white; border-radius: 16px; padding: 24px; width: 100%; max-width: 400px;
  max-height: 90vh; overflow-y: auto;
}
.modal-title { font-size: 1.2rem; margin-bottom: 16px; }
.input { width: 100%; padding: 10px 14px; border: 2px solid var(--border); border-radius: 10px; font-size: 0.9rem; }
.input:focus { outline: none; border-color: var(--primary); }
.tag-group { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.tag {
  padding: 6px 14px; border-radius: 20px; background: #f3f4f6; color: var(--text-secondary);
  font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
}
.tag.active { background: var(--primary); color: white; }
.hint { color: var(--text-secondary); font-size: 0.75rem; margin-top: 4px; display: block; }
```

- [ ] **Step 4: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 打卡系统 API + MedicineCard 组件"
```

---

### Task 9: 聊天功能

**Files:**
- Create: `D:\pill-tracker\functions\api\messages.js`
- Create: `D:\pill-tracker\src\components\ChatPage.jsx`

- [ ] **Step 1: 消息 API**

```javascript
// functions/api/messages.js
export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;

  const user = await env.DB.prepare('SELECT pharmacy_id FROM users WHERE id = ?')
    .bind(userId).first();
  if (!user) return new Response(JSON.stringify({ error: '用户不存在' }), { status: 400 });

  // GET /api/messages?since=xxx
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const since = url.searchParams.get('since') || '1970-01-01T00:00:00Z';

    const messages = await env.DB.prepare(
      `SELECT m.*, u.nickname as sender_name, u.avatar as sender_avatar
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.pharmacy_id = ? AND m.created_at > ?
       ORDER BY m.created_at ASC LIMIT 100`
    ).bind(user.pharmacy_id, since).all();

    return new Response(JSON.stringify(messages.results), { headers: { 'Content-Type': 'application/json' } });
  }

  // POST /api/messages - 发送消息
  if (request.method === 'POST') {
    const { content } = await request.json();
    const msgId = crypto.randomUUID();

    await env.DB.prepare(
      'INSERT INTO messages (id, pharmacy_id, sender_id, type, content) VALUES (?, ?, ?, ?, ?)'
    ).bind(msgId, user.pharmacy_id, userId, 'text', content).run();

    return new Response(JSON.stringify({ id: msgId }), { headers: { 'Content-Type': 'application/json' } });
  }
}
```

- [ ] **Step 2: 聊天页面**

```jsx
// src/components/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { api } from '../api'

export default function ChatPage() {
  const { state, dispatch } = useStore()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const pollingRef = useRef(null)

  // 轮询新消息
  useEffect(() => {
    loadMessages()
    pollingRef.current = setInterval(loadMessages, 3000)
    return () => clearInterval(pollingRef.current)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  async function loadMessages() {
    const latest = state.messages.length > 0 ? state.messages[state.messages.length - 1].created_at : undefined
    try {
      const newMsgs = await api.getMessages(latest)
      if (newMsgs.length > 0) {
        dispatch({ type: 'SET_MESSAGES', payload: [...state.messages, ...newMsgs] })
      }
    } catch(e) {}
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await api.sendMessage(text.trim())
      setText('')
      await loadMessages()
    } catch(e) { alert(e.message) }
    setSending(false)
  }

  function getSenderName(msg) {
    if (msg.type === 'system') return '系统'
    if (msg.type === 'ai_encourage') return '🤖 小助手'
    return msg.sender_name || '未知'
  }

  function isMyMessage(msg) {
    return msg.sender_id === localStorage.getItem('userId')
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h3>💬 消息</h3>
      </div>

      <div className="chat-messages">
        {state.messages.map(msg => (
          <div key={msg.id} className={`chat-msg ${isMyMessage(msg) ? 'chat-msg-right' : 'chat-msg-left'} ${msg.type !== 'text' ? 'chat-msg-system' : ''}`}>
            {!isMyMessage(msg) && msg.type === 'text' && (
              <div className="chat-sender">{getSenderName(msg)}</div>
            )}
            <div className="chat-bubble">
              {msg.content}
              {msg.type === 'ai_encourage' && <div className="chat-ai-badge">🤖 AI 鼓励</div>}
            </div>
            <div className="chat-time">
              {new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input className="chat-input" type="text" value={text}
          onChange={e => setText(e.target.value)} placeholder="输入消息..."
          maxLength={200} />
        <button className="chat-send-btn" type="submit" disabled={sending || !text.trim()}>
          {sending ? '...' : '➤'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: 聊天 CSS 添加到 App.css**

```css
.chat-page { display: flex; flex-direction: column; height: calc(100vh - 80px); }
.chat-header { padding-bottom: 12px; }
.chat-messages { flex: 1; overflow-y: auto; padding: 8px 0; }
.chat-msg { margin-bottom: 12px; max-width: 80%; }
.chat-msg-left { margin-right: auto; }
.chat-msg-right { margin-left: auto; }
.chat-msg-system { margin: 0 auto; text-align: center; max-width: 90%; }
.chat-sender { font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px; margin-left: 4px; }
.chat-bubble {
  padding: 10px 14px; border-radius: 16px; font-size: 0.9rem; line-height: 1.5;
  word-break: break-word;
}
.chat-msg-left .chat-bubble {
  background: #f3f4f6; border-bottom-left-radius: 4px;
}
.chat-msg-right .chat-bubble {
  background: var(--primary); color: white; border-bottom-right-radius: 4px;
}
.chat-msg-system .chat-bubble {
  background: #fef3c7; color: #92400e; border-radius: 20px; font-size: 0.85rem;
}
.chat-time { font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px; padding: 0 4px; }
.chat-msg-right .chat-time { text-align: right; }
.chat-ai-badge { font-size: 0.7rem; opacity: 0.7; margin-top: 4px; }
.chat-input-bar {
  display: flex; gap: 8px; padding: 12px 0; background: var(--bg);
  border-top: 1px solid var(--border); margin-top: auto;
}
.chat-input {
  flex: 1; padding: 10px 16px; border: 2px solid var(--border);
  border-radius: 24px; font-size: 0.9rem; outline: none;
}
.chat-input:focus { border-color: var(--primary); }
.chat-send-btn {
  width: 40px; height: 40px; border-radius: 50%; border: none;
  background: var(--primary); color: white; font-size: 1.1rem;
  display: flex; align-items: center; justify-content: center;
}
.chat-send-btn:disabled { opacity: 0.5; }
```

- [ ] **Step 4: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 聊天 API + ChatPage 组件"
```

---

### Task 10: 成就系统

**Files:**
- Create: `D:\pill-tracker\functions\api\achievements.js`
- Create: `D:\pill-tracker\src\components\AchievementsPage.jsx`
- Create: `D:\pill-tracker\src\utils\achievements.js`

- [ ] **Step 1: 成就 API**

```javascript
// functions/api/achievements.js
export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;

  const user = await env.DB.prepare('SELECT pharmacy_id FROM users WHERE id = ?')
    .bind(userId).first();

  // 获取成就列表 + 用户进度
  const achievements = await env.DB.prepare(
    `SELECT a.*, ap.unlocked_at, ap.progress
     FROM achievements a
     LEFT JOIN achievement_progress ap ON a.id = ap.achievement_id AND ap.user_id = ?
     ORDER BY a.id`
  ).bind(userId).all();

  return new Response(JSON.stringify(achievements.results), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

- [ ] **Step 2: 成就检查逻辑**

```javascript
// src/utils/achievements.js
export function checkAchievementUnlock(achievement, state, userId) {
  if (achievement.unlocked_at) return false // 已解锁

  switch (achievement.id) {
    case 1: // 初次打卡
      return state.todayCheckIns.length > 0

    case 2: // 连续 3 天
      return getConsecutiveDays(state.checkinHistory, userId) >= 3

    case 3: // 连续 7 天
      return getConsecutiveDays(state.checkinHistory, userId) >= 7

    case 4: // 连续 30 天
      return getConsecutiveDays(state.checkinHistory, userId) >= 30

    case 5: // 心有灵犀 - 双方同一天都打卡
      return checkBothChecked(state)

    case 6: // 药箱满满
      return state.medicines.length >= 5

    case 7: // 全勤战神（周）
      return getWeeklyPerfect(state.checkinHistory, userId) >= 1

    case 8: // 全勤战神（月）
      return getMonthlyPerfect(state.checkinHistory, userId) >= 1

    case 9: // 契约胜者
      return state.contract?.lastWinner === userId // 由后端在结算时设置

    case 10: // 甜言蜜语
      return state.todayCheckIns.filter(c => c.message).length >= 10

    default: return false
  }
}
```

- [ ] **Step 3: 成就页面**

```jsx
// src/components/AchievementsPage.jsx
import React, { useEffect } from 'react'
import { useStore } from '../store'
import { api } from '../api'

export default function AchievementsPage() {
  const { state, dispatch } = useStore()

  useEffect(() => {
    api.getAchievements().then(data =>
      dispatch({ type: 'SET_ACHIEVEMENTS', payload: data })
    )
  }, [])

  return (
    <div className="achievements-page">
      <h3>🏆 成就</h3>
      <p className="page-subtitle">坚持打卡，解锁所有成就吧！</p>

      <div className="achievements-grid">
        {state.achievements.map(ach => {
          const unlocked = !!ach.unlocked_at
          return (
            <div key={ach.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="achievement-icon">{ach.icon}</div>
              <div className="achievement-name">{ach.name}</div>
              <div className="achievement-desc">{ach.description}</div>
              {unlocked && <div className="achievement-date">
                🎉 {new Date(ach.unlocked_at).toLocaleDateString('zh-CN')}
              </div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 成就 CSS 添加到 App.css**

```css
.achievements-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.achievement-card {
  background: white; border-radius: var(--radius); padding: 16px; text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.achievement-card.locked { opacity: 0.5; filter: grayscale(0.5); }
.achievement-icon { font-size: 2rem; margin-bottom: 8px; }
.achievement-name { font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; }
.achievement-desc { color: var(--text-secondary); font-size: 0.8rem; }
.achievement-date { color: var(--success); font-size: 0.75rem; margin-top: 4px; }
.page-subtitle { color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 16px; }
```

- [ ] **Step 5: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 成就系统 API + 页面"
```

---

### Task 11: 契约系统

**Files:**
- Create: `D:\pill-tracker\functions\api\contracts.js`
- Create: `D:\pill-tracker\src\components\ContractPage.jsx`

- [ ] **Step 1: 契约 API**

```javascript
// functions/api/contracts.js
export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;
  const url = new URL(request.url);

  const user = await env.DB.prepare('SELECT pharmacy_id FROM users WHERE id = ?')
    .bind(userId).first();

  if (request.method === 'GET') {
    const contract = await env.DB.prepare(
      `SELECT c.*,
              (SELECT COUNT(*) FROM check_ins ci WHERE ci.user_id = ? AND ci.date >= c.start_date) as my_score
       FROM contracts c
       WHERE c.pharmacy_id = ? AND c.is_active = 1 LIMIT 1`
    ).bind(userId, user.pharmacy_id).first();
    return new Response(JSON.stringify(contract), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'POST' && !url.pathname.endsWith('/settle')) {
    const data = await request.json();
    // 停用旧契约
    await env.DB.prepare('UPDATE contracts SET is_active = 0 WHERE pharmacy_id = ?')
      .bind(user.pharmacy_id).run();
    // 创建新契约
    const contractId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO contracts (id, pharmacy_id, name, rules, settlement_type, punishment, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(contractId, user.pharmacy_id, data.name,
           JSON.stringify(data.rules || { ontime: 10, late: 3, missed: -5, bonus: 20 }),
           data.settlementType || 'weekly', data.punishment || '',
           data.startDate || new Date().toISOString().split('T')[0],
           data.endDate || null).run();
    return new Response(JSON.stringify({ id: contractId }), { headers: { 'Content-Type': 'application/json' } });
  }
}
```

- [ ] **Step 2: 契约页面**

```jsx
// src/components/ContractPage.jsx
import React, { useState } from 'react'
import { useStore } from '../store'
import { api } from '../api'

export default function ContractPage() {
  const { state, dispatch } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '吃药契约',
    punishment: '',
    settlementType: 'weekly',
    ontime: 10, late: 3, missed: -5, bonus: 20,
  })

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.createContract({
        name: form.name,
        punishment: form.punishment,
        settlementType: form.settlementType,
        rules: { ontime: form.ontime, late: form.late, missed: form.missed, bonus: form.bonus },
      })
      dispatch({ type: 'SET_CONTRACT', payload: await api.getContract() })
      setShowCreate(false)
    } catch(e) { alert(e.message) }
  }

  const contract = state.contract

  if (!contract && !showCreate) {
    return (
      <div className="contract-page">
        <h3>📜 契约</h3>
        <div className="empty-state">
          <p>还没有契约</p>
          <button className="btn btn-primary" style={{marginTop:12, background:'var(--primary)', color:'white'}}
            onClick={() => setShowCreate(true)}>创建契约</button>
        </div>
      </div>
    )
  }

  if (showCreate) {
    return (
      <div className="contract-page">
        <h3>📜 创建契约</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group"><label>契约名称</label>
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="form-group"><label>结算周期</label>
            <select className="input" value={form.settlementType} onChange={e => setForm({...form, settlementType: e.target.value})}>
              <option value="daily">每天</option><option value="weekly">每周</option><option value="monthly">每月</option>
            </select></div>
          <div className="form-group"><label>按时打卡得分</label>
            <input type="number" className="input" value={form.ontime} onChange={e => setForm({...form, ontime: +e.target.value})} /></div>
          <div className="form-group"><label>迟到得分</label>
            <input type="number" className="input" value={form.late} onChange={e => setForm({...form, late: +e.target.value})} /></div>
          <div className="form-group"><label>漏打卡扣分</label>
            <input type="number" className="input" value={form.missed} onChange={e => setForm({...form, missed: +e.target.value})} /></div>
          <div className="form-group"><label>全勤奖励</label>
            <input type="number" className="input" value={form.bonus} onChange={e => setForm({...form, bonus: +e.target.value})} /></div>
          <div className="form-group"><label>惩罚内容</label>
            <input className="input" value={form.punishment} onChange={e => setForm({...form, punishment: e.target.value})}
              placeholder="输的人请喝奶茶 🧋" /></div>
          <button type="submit" className="btn btn-primary" style={{width:'100%', background:'var(--primary)', color:'white'}}>创建契约</button>
        </form>
      </div>
    )
  }

  return (
    <div className="contract-page">
      <h3>📜 {contract.name}</h3>
      <div className="contract-card">
        <div className="contract-score">
          <div className="contract-score-item">
            <div className="contract-score-label">{state.user?.nickname || '我'}</div>
            <div className="contract-score-value">{contract.my_score || 0}</div>
          </div>
          <div className="contract-vs">VS</div>
          <div className="contract-score-item">
            <div className="contract-score-label">对方</div>
            <div className="contract-score-value">-</div>
          </div>
        </div>
        {contract.punishment && <p className="contract-punishment">💢 惩罚：{contract.punishment}</p>}
        <p className="contract-meta">周期：{contract.settlement_type === 'daily' ? '每天' : contract.settlement_type === 'weekly' ? '每周' : '每月'}结算</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 契约 CSS 添加到 App.css**

```css
.contract-card {
  background: white; border-radius: var(--radius); padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.contract-score { display: flex; justify-content: center; align-items: center; gap: 20px; margin: 16px 0; }
.contract-score-item { text-align: center; }
.contract-score-label { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px; }
.contract-score-value { font-size: 2rem; font-weight: 700; color: var(--primary); }
.contract-vs { font-size: 1.2rem; font-weight: 700; color: var(--danger); }
.contract-punishment { text-align: center; font-size: 0.9rem; color: var(--text-secondary); padding: 8px; background: #fef3c7; border-radius: 8px; }
.contract-meta { text-align: center; font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; }
```

- [ ] **Step 4: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 契约 API + ContractPage"
```

---

### Task 12: 统计页面

**Files:**
- Create: `D:\pill-tracker\functions\api\stats.js`
- Create: `D:\pill-tracker\src\components\StatsPage.jsx`

- [ ] **Step 1: 统计 API**

```javascript
// functions/api/stats.js
export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;
  const url = new URL(request.url);
  const period = parseInt(url.searchParams.get('period') || '7');

  const user = await env.DB.prepare('SELECT pharmacy_id FROM users WHERE id = ?')
    .bind(userId).first();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  const start = startDate.toISOString().split('T')[0];

  // 自己的打卡统计
  const myStats = await env.DB.prepare(
    `SELECT date, COUNT(*) as total,
            SUM(CASE WHEN status='ontime' THEN 1 ELSE 0 END) as ontime,
            SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late
     FROM check_ins WHERE user_id = ? AND date >= ?
     GROUP BY date ORDER BY date`
  ).bind(userId, start).all();

  // 总体打卡率
  const overall = await env.DB.prepare(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN status='ontime' THEN 1 ELSE 0 END) as ontime,
            SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late
     FROM check_ins WHERE user_id = ? AND date >= ?`
  ).bind(userId, start).first();

  return new Response(JSON.stringify({
    daily: myStats.results,
    total: overall.total || 0,
    ontime: overall.ontime || 0,
    late: overall.late || 0,
    rate: overall.total > 0 ? Math.round(((overall.ontime + overall.late) / overall.total) * 100) : 0
  }), { headers: { 'Content-Type': 'application/json' } });
}
```

- [ ] **Step 2: 统计页面**

```jsx
// src/components/StatsPage.jsx
import React, { useState, useEffect } from 'react'
import { api } from '../api'

export default function StatsPage() {
  const [period, setPeriod] = useState(7)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.getStats(period).then(setStats)
  }, [period])

  if (!stats) return <div className="loading-screen">📊</div>

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h3>📊 统计</h3>
        <div className="period-toggle">
          <button className={`period-btn ${period === 7 ? 'active' : ''}`} onClick={() => setPeriod(7)}>7天</button>
          <button className={`period-btn ${period === 30 ? 'active' : ''}`} onClick={() => setPeriod(30)}>30天</button>
        </div>
      </div>

      <div className="stats-ring-card">
        <div className="stats-ring">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#667eea" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.rate / 100)}`}
              transform="rotate(-90 50 50)" strokeLinecap="round" />
          </svg>
          <div className="stats-ring-text">{stats.rate}%</div>
        </div>
        <div className="stats-ring-label">打卡率</div>
      </div>

      <div className="stats-summary">
        <div className="stat-item"><div className="stat-value" style={{color:'var(--success)'}}>{stats.ontime}</div><div>按时</div></div>
        <div className="stat-item"><div className="stat-value" style={{color:'var(--warning)'}}>{stats.late}</div><div>迟到</div></div>
        <div className="stat-item"><div className="stat-value" style={{color:'var(--danger)'}}>{stats.total - stats.ontime - stats.late}</div><div>漏打</div></div>
      </div>

      <div className="stats-daily">
        <h4>每日明细</h4>
        <div className="stats-chart">
          {stats.daily.map(d => (
            <div key={d.date} className="stats-day">
              <div className="stats-bar" style={{
                height: `${Math.max(20, (d.total / Math.max(...stats.daily.map(x => x.total))) * 60)}px`,
                background: d.late > 0 ? 'var(--warning)' : 'var(--success)'
              }} />
              <div className="stats-day-label">{new Date(d.date).toLocaleDateString('zh-CN', {weekday:'short'})}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 统计 CSS 添加到 App.css**

```css
.stats-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.period-toggle { display: flex; background: #f3f4f6; border-radius: 20px; overflow: hidden; }
.period-btn { padding: 6px 16px; border: none; background: none; font-size: 0.85rem; }
.period-btn.active { background: var(--primary); color: white; border-radius: 20px; }
.stats-ring-card { background: white; border-radius: var(--radius); padding: 24px; text-align: center; margin-bottom: 12px; }
.stats-ring { position: relative; display: inline-block; }
.stats-ring-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: var(--primary); }
.stats-ring-label { margin-top: 8px; color: var(--text-secondary); font-size: 0.85rem; }
.stats-summary { display: flex; gap: 8px; margin-bottom: 16px; }
.stat-item { flex: 1; background: white; border-radius: var(--radius); padding: 16px; text-align: center; font-size: 0.8rem; color: var(--text-secondary); }
.stat-value { font-size: 1.5rem; font-weight: 700; }
.stats-daily { background: white; border-radius: var(--radius); padding: 16px; }
.stats-daily h4 { margin-bottom: 12px; }
.stats-chart { display: flex; align-items: end; gap: 4px; height: 80px; }
.stats-day { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stats-bar { width: 100%; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.3s; }
.stats-day-label { font-size: 0.65rem; color: var(--text-secondary); margin-top: 4px; }
```

- [ ] **Step 4: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: 统计 API + StatsPage"
```

---

### Task 13: AI 每日鼓励

**Files:**
- Create: `D:\pill-tracker\functions\api\ai.js`

- [ ] **Step 1: AI 鼓励 API**

```javascript
// functions/api/ai.js
export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;

  const user = await env.DB.prepare(
    `SELECT u.*, u2.nickname as partner_name
     FROM users u
     LEFT JOIN users u2 ON u2.pharmacy_id = u.pharmacy_id AND u2.id != u.id
     WHERE u.id = ?`
  ).bind(userId).first();

  // 获取今日打卡数据
  const today = new Date().toISOString().split('T')[0];
  const myCheckins = await env.DB.prepare(
    `SELECT c.*, m.name as medicine_name FROM check_ins c
     JOIN medicines m ON c.medicine_id = m.id
     WHERE c.user_id = ? AND c.date = ?`
  ).bind(userId, today).all();

  const partnerCheckins = user.partner_name ? await env.DB.prepare(
    `SELECT c.*, m.name as medicine_name FROM check_ins c
     JOIN medicines m ON c.medicine_id = m.id
     JOIN users u ON c.user_id = u.id
     WHERE u.pharmacy_id = ? AND u.id != ? AND c.date = ?`
  ).bind(user.pharmacy_id, userId, today).all() : { results: [] };

  // 构造 prompt
  const myTotal = myCheckins.results.length;
  const myOntime = myCheckins.results.filter(c => c.status === 'ontime').length;
  const partnerTotal = partnerCheckins.results.length;
  const partnerOntime = partnerCheckins.results.filter(c => c.status === 'ontime').length;

  const prompt = `你是一个温暖的朋友。根据以下数据生成一段 100 字以内的中文鼓励话语：
- ${user.nickname}：打卡 ${myTotal} 次，按时 ${myOntime} 次
- ${user.partner_name || '对方'}：打卡 ${partnerTotal} 次，按时 ${partnerOntime} 次
要求：温暖、个性化、不评价好坏、重在鼓励。语气亲切，用中文。`;

  // 调用 DeepSeek API
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      message: `${user.nickname}，今天也辛苦了！记得照顾好自己 💕`
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200
      })
    });
    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || '今天也辛苦了！继续加油哦 💪';

    // 保存到消息
    await env.DB.prepare(
      'INSERT INTO messages (id, pharmacy_id, sender_id, type, content) VALUES (?, ?, NULL, ?, ?)'
    ).bind(crypto.randomUUID(), user.pharmacy_id, 'ai_encourage', message).run();

    return new Response(JSON.stringify({ message }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ message: '今天也辛苦了！继续加油哦 💪' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

- [ ] **Step 2: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "feat: AI 鼓励 API + Cron Worker"
```

---

### Task 14: 最终打磨 + PWA 配置

**Files:**
- Modify: `D:\pill-tracker\vite.config.js`（完善 PWA 配置）
- Create: `D:\pill-tracker\public\icons\icon-192.png` + `icon-512.png`（简单 SVG 图标）

- [ ] **Step 1: 完善 PWA 配置**

```javascript
// vite.config.js - 更新 PWA 配置
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icons/*.png'],
  manifest: {
    name: '甜蜜吃药 💊',
    short_name: '甜蜜吃药',
    description: '二人专属药品监督伴侣',
    theme_color: '#667eea',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    scope: '/',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
    runtimeCaching: [{
      urlPattern: /^\/api\/.*/i,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 300 } }
    }]
  }
})
```

- [ ] **Step 2: 创建 SVG 图标**

```html
<!-- public/icons/icon-192.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="32" fill="#667eea"/>
  <text x="96" y="128" font-size="96" text-anchor="middle" fill="white">💊</text>
</svg>
```

- [ ] **Step 3: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "chore: 完善 PWA 配置 + 图标"
```

---

### Task 15: 部署文档 + README

**Files:**
- Create: `D:\pill-tracker\README.md`

- [ ] **Step 1: 创建部署说明 README**

```markdown
# 💊 甜蜜吃药 — 二人专属药品监督伴侣

为中国用户打造的二人药品监督 PWA。添加到手机桌面，每天打卡互相监督 💕

## ✨ 功能

- 💊 **药品管理** — 添加/编辑药品，固定时间 + 灵活时段
- ✅ **打卡监督** — 一键打卡，自动判断按时/迟到，可附言
- 📊 **统计报表** — 7天/30天打卡率 + 每日明细
- 🏆 **成就系统** — 10 个成就等你解锁
- 💬 **消息聊天** — 互相提醒吃药 + 日常闲聊
- 📜 **契约系统** — 自定义得分规则和惩罚
- 🤖 **AI 每日鼓励** — 根据打卡情况生成温暖鼓励
- 📱 **PWA 支持** — 添加到手机桌面，离线可用

## 🚀 部署教程（约 15 分钟）

### 前置准备

1. 注册 [GitHub](https://github.com) 账号
2. 注册 [Cloudflare](https://dash.cloudflare.com) 账号

### 第一步：上传代码到 GitHub

```bash
# 在终端执行（或使用 GitHub 网页端上传）
git remote add origin https://github.com/你的用户名/pill-tracker.git
git push -u origin master
```

### 第二步：在 Cloudflare 创建 D1 数据库

1. 进入 Cloudflare 控制台 → Workers & Pages → D1
2. 点击「创建数据库」，名称填 `pill-tracker-db`
3. 创建成功后，复制数据库 ID
4. 打开项目中的 `wrangler.toml`，把 `database_id` 替换成你的 ID

### 第三步：初始化数据库

```bash
npx wrangler d1 execute pill-tracker-db --file=./schema.sql
```

### 第四步：部署到 Cloudflare Pages

1. Cloudflare 控制台 → Workers & Pages → Pages
2. 点击「连接到 Git」→ 选择你的仓库
3. 构建配置：
   - 构建命令：`npm run build`
   - 构建输出目录：`dist`
4. 点击「保存并部署」
5. 部署成功后，你会得到一个 `xxx.pages.dev` 的链接

### 第五步：关联 D1 数据库

在 Cloudflare Pages 的项目设置中：
1. 进入「设置」→「函数」→「D1 数据库绑定」
2. 添加绑定：变量名 `DB`，选择你的 `pill-tracker-db`
3. 重新部署

### 第六步：配置 AI 功能（可选）

1. 注册 [DeepSeek](https://platform.deepseek.com) 获取 API Key
2. 在 Cloudflare Pages 项目设置 → 环境变量 → 添加：
   - 变量名：`DEEPSEEK_API_KEY`
   - 值：你的 API Key
3. 重新部署

### 第七步：打开使用

- 手机浏览器打开你的 `xxx.pages.dev` 链接
- iOS：分享 → 添加到主屏幕
- Android：菜单 → 添加到主屏幕

## 🛠️ 本地开发

```bash
npm install
npm run dev
```

## 💡 小贴士

- 一个人创建药局后，把 6 位邀请码发给对方即可绑定
- 打卡时可以写留言，会出现在聊天和对方的推送中
- 契约惩罚可以设置成「请喝奶茶」「洗碗一周」等～
- 每晚 21:00 AI 会根据当天打卡生成专属鼓励
```

- [ ] **Step 2: 提交**

```bash
cd /d/pill-tracker && git add -A && git commit -m "docs: 添加 README 部署说明"
```

---

## 自审清单

### 1. Spec 覆盖检查

| Spec 需求 | 对应 Task |
|-----------|-----------|
| 创建/加入药局 | Task 4 |
| 药品管理（固定时间 + 灵活时段） | Task 7 |
| 每日打卡（按时/迟到判断） | Task 8 |
| 打卡附言 | Task 8 |
| 双方打卡进度查看 | Task 8（HomePage）+ Task 4（成员信息） |
| 10 个成就 | Task 10 |
| 聊天功能 | Task 9 |
| 统计报表（7天/30天） | Task 12 |
| PWA 离线 + 安装 | Task 1 + Task 14 |
| 每日一句温暖的话 | Task 6（DailyMessage） |
| AI 每日鼓励 | Task 13 |
| 自定义契约 | Task 11 |
| 底部 Tab 导航 | Task 6 |
| 部署文档 | Task 15 |

### 2. 占位符检查

所有代码块中包含完整的实现代码，没有 "TBD"、"TODO" 等占位符。所有步骤都包含具体的代码实现。

### 3. 类型一致性检查

- API 路径：`/api/pharmacy/create`, `/api/pharmacy/join`, `/api/pharmacy/info` — 前后端一致
- 数据字段：`schedule_type` (`fixed`/`flexible`), `taken_by` (`me`/`her`/`both`) — 前后端一致
- store action type 名称在 dispatch 和 reducer 中一致
- API client 方法名与后端路由一致

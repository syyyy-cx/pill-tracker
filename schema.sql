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

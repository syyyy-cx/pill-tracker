# 💊 甜蜜吃药 — 二人专属药品监督伴侣

为中国用户打造的二人药品监督 PWA。添加到手机桌面，每天打卡互相监督 💕

## ✨ 功能

- 💊 **药品管理** — 添加/编辑药品，固定时间 + 灵活时段，可帮对方加药
- ✅ **打卡监督** — 一键打卡，自动判断按时/迟到，打卡时可附言给对方
- 📊 **统计报表** — 7天/30天打卡率 + 每日明细
- 🏆 **成就系统** — 10 个成就等你解锁
- 💬 **消息聊天** — 互相提醒吃药 + 日常闲聊
- 📜 **契约系统** — 自定义得分规则和惩罚
- 🤖 **AI 每日鼓励** — 根据当天打卡情况生成温暖鼓励
- 📱 **PWA 支持** — 可添加到手机桌面，离线可用

## 🚀 部署教程（约 15 分钟）

> 不需要任何编程经验，按步骤操作即可。

### 前置准备

1. 注册 [GitHub](https://github.com) 账号
2. 注册 [Cloudflare](https://dash.cloudflare.com) 账号

### 第一步：上传代码到 GitHub

```bash
# 打开终端（Windows：按 Win+R，输入 cmd，回车）
# 进入项目目录
cd D:\pill-tracker

# 在 GitHub 上创建一个新仓库（不要勾选任何初始化选项）
# 然后执行：
git remote add origin https://github.com/你的用户名/pill-tracker.git
git push -u origin master
```

> 💡 或者在 GitHub 网页端手动上传：创建仓库 → 点击 "uploading an existing file" → 把项目文件拖进去。

### 第二步：在 Cloudflare 创建 D1 数据库

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **D1**
3. 点击 **创建数据库**
4. 名称填：`pill-tracker-db`
5. 创建后复制 **数据库 ID**

### 第三步：配置 wrangler.toml

打开项目中的 `wrangler.toml`，把 `CHANGE_ME` 替换成你刚复制的数据库 ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "pill-tracker-db"
database_id = "你的数据库ID"  # ← 替换这里
```

### 第四步：初始化数据库表

```bash
cd D:\pill-tracker
npx wrangler d1 execute pill-tracker-db --file=./schema.sql
```

### 第五步：部署到 Cloudflare Pages

1. Cloudflare 控制台 → **Workers & Pages** → **Pages**
2. 点击 **连接到 Git**
3. 授权 GitHub，选择你的 `pill-tracker` 仓库
4. 构建配置：
   - 构建命令：`npm run build`
   - 构建输出目录：`dist`
5. 点击 **保存并部署**
6. 部署成功后得到一个 `xxx.pages.dev` 链接 🎉

### 第六步：关联 D1 数据库

在 Cloudflare Pages 项目设置中：
1. 进入 **设置** → **函数** → **D1 数据库绑定**
2. 点击 **添加绑定**
   - 变量名称：`DB`
   - 选择数据库：`pill-tracker-db`
3. 保存后点击 **部署** → **重新部署**

### 第七步：配置 AI 功能（可选）

1. 注册 [DeepSeek 开放平台](https://platform.deepseek.com)
2. 获取 API Key（注册送额度）
3. 在 Cloudflare Pages 项目设置 → **环境变量**
4. 添加：
   - 变量名：`DEEPSEEK_API_KEY`
   - 值：粘贴你的 API Key
5. 保存后重新部署

### 第八步：打开使用 🎉

- 手机浏览器打开你的 `xxx.pages.dev` 链接
- **iOS**：下方分享按钮 → **添加到主屏幕**
- **Android**：菜单 → **添加到主屏幕**
- 一人创建药局 → 把 6 位邀请码发给对象 → 加入绑定

## 💡 使用贴士

- 打卡时可以写附言，会同步到聊天页
- 契约惩罚可以设置成「请喝奶茶」「洗碗一周」等
- 如果没配置 AI API Key，AI 鼓励会用预设的温暖文案
- 所有数据存在 Cloudflare D1，安全可靠

## 🛠️ 本地开发

```bash
cd D:\pill-tracker
npm install
npm run dev
```

## 🏗️ 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite |
| PWA | vite-plugin-pwa + Workbox |
| 后端 API | Cloudflare Pages Functions |
| 数据库 | Cloudflare D1 (SQLite) |
| AI | DeepSeek API |
| 部署 | GitHub → Cloudflare Pages |

## 📝 项目结构

```
D:\pill-tracker/
├── src/               # React 前端
│   ├── components/    # 页面组件
│   ├── store.js       # 全局状态
│   └── api.js         # API 客户端
├── functions/         # 后端 API（Cloudflare Functions）
│   └── api/           # 各功能 API
├── schema.sql         # 数据库建表 SQL
├── wrangler.toml      # Cloudflare 配置
└── vite.config.js     # Vite 构建配置
```

## 📄 许可证

MIT

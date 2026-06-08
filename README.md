# 习惯打卡助手 (Habit Tracker)

## 📋 项目简介

一个功能完善的行为习惯打卡工具，帮助用户养成良好习惯。支持个人打卡、好友组队监督、排行榜激励等功能，通过游戏化的设计让习惯养成更有趣、更有动力。

**目标用户**：
- 想要培养良好生活习惯的个人用户
- 需要互相监督的朋友/家人小组
- 追求自律和自我提升的人群

**核心价值**：
- 🎯 可视化追踪习惯进度
- 👥 组队打卡互相激励
- 🏆 排行榜激发竞争力
- 📊 数据统计见证成长
- 🎨 精美界面愉悦体验

## 🚀 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | React | ^18.3.1 | UI 构建 |
| 状态管理 | Zustand | ^5.0.3 | 全局状态管理 |
| 路由 | React Router DOM | ^7.3.0 | 页面路由 |
| 样式 | TailwindCSS | ^3.4.17 | 原子化 CSS |
| 图表 | Recharts | ^2.15.1 | 数据可视化 |
| 图标 | Lucide React | ^0.511.0 | 图标库 |
| 语言 | TypeScript | ~5.8.3 | 类型安全 |
| 构建工具 | Vite | ^6.3.5 | 开发构建 |
| HTTP 客户端 | Axios | ^1.7.9 | API 请求 |
| 后端框架 | Express | ^4.21.2 | API 服务 |
| 数据库 | better-sqlite3 | ^11.6.0 | 本地数据库 |
| 认证 | jsonwebtoken | ^9.0.2 | JWT 令牌 |
| 加密 | bcryptjs | ^2.4.3 | 密码加密 |
| 工具函数 | clsx + tailwind-merge | ^3.0.2 | 类名合并 |

## 📁 项目结构

```
xyj-114/
├── api/                          # 后端 API
│   ├── middleware/              # 中间件
│   │   └── auth.ts             # 认证中间件
│   ├── repositories/            # 数据访问层
│   │   ├── checkinRepository.ts
│   │   ├── habitRepository.ts
│   │   ├── leaderboardRepository.ts
│   │   ├── statsRepository.ts
│   │   ├── teamRepository.ts
│   │   └── userRepository.ts
│   ├── routes/                  # API 路由
│   │   ├── auth.ts
│   │   ├── checkins.ts
│   │   ├── habits.ts
│   │   ├── leaderboard.ts
│   │   ├── teams.ts
│   │   └── users.ts
│   ├── services/                # 业务逻辑层
│   │   ├── authService.ts
│   │   ├── checkinService.ts
│   │   ├── habitService.ts
│   │   ├── leaderboardService.ts
│   │   └── teamService.ts
│   ├── utils/                   # 工具
│   │   └── db.ts               # 数据库连接
│   ├── app.ts                   # Express 应用
│   └── server.ts                # 服务器入口
├── shared/                       # 共享类型定义
│   └── types.ts
├── src/                          # 前端源码
│   ├── api/                     # API 客户端
│   │   ├── auth.ts
│   │   ├── checkins.ts
│   │   ├── client.ts           # Axios 实例 & 拦截器
│   │   ├── habits.ts
│   │   ├── leaderboard.ts
│   │   ├── teams.ts
│   │   └── users.ts
│   ├── components/              # 组件
│   │   ├── ui/                  # 基础 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── CheckinCalendar.tsx  # 打卡日历
│   │   ├── Confetti.tsx         # 庆祝动画
│   │   ├── Layout.tsx           # 布局组件
│   │   ├── Modal.tsx            # 模态框
│   │   ├── ShareModal.tsx       # 分享海报
│   │   └── Toast.tsx            # 消息提示
│   ├── hooks/                   # 自定义 Hooks
│   │   └── useTheme.ts
│   ├── lib/                     # 工具函数
│   │   └── utils.ts
│   ├── pages/                   # 页面组件
│   │   ├── HabitsPage.tsx       # 习惯管理页
│   │   ├── HomePage.tsx         # 首页（打卡页）
│   │   ├── LeaderboardPage.tsx  # 排行榜页
│   │   ├── LoginPage.tsx        # 登录页
│   │   ├── ProfilePage.tsx      # 个人中心页
│   │   ├── RegisterPage.tsx     # 注册页
│   │   ├── TeamDetailPage.tsx   # 队伍详情页
│   │   └── TeamsPage.tsx        # 队伍列表页
│   ├── store/                   # 状态管理
│   │   └── authStore.ts         # 认证状态
│   ├── App.tsx                  # 应用入口
│   ├── main.tsx                 # React 挂载点
│   └── index.css                # 全局样式
├── public/                      # 静态资源
├── .trae/documents/            # 项目文档
│   ├── PRD.md                  # 产品需求文档
│   └── TECH-ARCHITECTURE.md    # 技术架构文档
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

## ✨ 核心功能

### 1. 用户认证系统
- 用户注册（用户名/邮箱）
- 用户登录
- JWT 令牌认证
- 自动登录状态持久化

### 2. 习惯管理
- 创建习惯（名称、图标、颜色、频率、目标天数）
- 编辑习惯
- 删除习惯
- 习惯列表展示

### 3. 打卡系统
- 每日一键打卡
- 打卡成功庆祝动画（彩带效果）
- 打卡状态实时更新
- 取消打卡功能
- 打卡日历可视化

### 4. 数据统计
- 总打卡天数
- 连续打卡天数
- 本周/本月打卡统计
- 各习惯完成率图表
- 个人习惯分析

### 5. 队伍系统
- 创建队伍（名称、描述、邀请码）
- 通过邀请码加入队伍
- 队伍成员列表
- 队伍打卡统计

### 6. 排行榜
- 个人排行榜（按打卡天数排序）
- 队伍排行榜（按总打卡天数排序）
- 前 100 名展示
- 排名可视化

### 7. 个人中心
- 个人信息展示
- 习惯统计图表
- 分享打卡海报
- 退出登录

## 🛠️ 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
npm install
```

### 开发模式

**同时启动前端和后端：**
```bash
npm run dev
```

**仅启动前端：**
```bash
npm run client:dev
```

**仅启动后端：**
```bash
npm run server:dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

### 代码检查

```bash
# ESLint 检查
npm run lint

# TypeScript 类型检查
npm run check
```

## 📦 核心模块说明

### 状态管理 (Zustand)

**[authStore.ts](file:///Users/tog/Desktop/code/solo/xyj-114/src/store/authStore.ts)** - 认证状态管理
- `user` - 当前用户信息
- `token` - JWT 令牌
- `isAuthenticated` - 认证状态
- `login()` - 登录方法
- `logout()` - 登出方法
- `updateUser()` - 更新用户信息

### API 客户端

**[client.ts](file:///Users/tog/Desktop/code/solo/xyj-114/src/api/client.ts)** - Axios 实例配置
- 请求拦截器：自动添加 Authorization 头
- 响应拦截器：统一错误处理、Toast 提示
- 401 自动跳转登录页
- 统一的 `request` 方法封装

### 三层架构（后端）

1. **Routes 层** - API 路由定义，请求参数校验
2. **Services 层** - 业务逻辑处理
3. **Repositories 层** - 数据库操作

### 核心组件

**[CheckinCalendar.tsx](file:///Users/tog/Desktop/code/solo/xyj-114/src/components/CheckinCalendar.tsx)** - 打卡日历
- 月份切换
- 每日打卡次数可视化（彩色圆点）
- 悬停显示详情
- 今天高亮显示

**[ShareModal.tsx](file:///Users/tog/Desktop/code/solo/xyj-114/src/components/ShareModal.tsx)** - 分享海报
- 生成打卡统计海报
- 展示连续打卡、总打卡等数据
- 可截图分享

## 🎯 产品特性

- 🎨 **精美界面** - 橙红色渐变主题，卡片式布局，现代设计风格
- 📱 **响应式设计** - 完美适配桌面端和移动端
- ✨ **动画反馈** - 打卡成功彩带效果，按钮交互动画
- 🌙 **夜间模式** - 支持深色模式（可扩展）
- 🏆 **成就系统** - 连续打卡里程碑徽章（可扩展）
- 📤 **社交分享** - 生成精美打卡海报
- 🔒 **数据安全** - 密码加密存储，JWT 认证
- 💾 **本地存储** - 登录状态持久化

## 🔌 API 接口

### 认证接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |

### 习惯接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/habits` | 获取习惯列表 |
| POST | `/api/habits` | 创建习惯 |
| PUT | `/api/habits/:id` | 更新习惯 |
| DELETE | `/api/habits/:id` | 删除习惯 |

### 打卡接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/checkins` | 打卡 |
| DELETE | `/api/checkins` | 取消打卡 |
| GET | `/api/checkins/calendar` | 获取打卡日历 |
| GET | `/api/checkins/history` | 获取打卡历史 |

### 排行榜接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/leaderboard/personal` | 个人排行榜 |
| GET | `/api/leaderboard/team` | 队伍排行榜 |

### 队伍接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/teams` | 获取队伍列表 |
| POST | `/api/teams` | 创建队伍 |
| POST | `/api/teams/join` | 加入队伍 |
| GET | `/api/teams/:id` | 获取队伍详情 |

### 用户接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/users/stats` | 获取用户统计 |

## 📄 License

MIT

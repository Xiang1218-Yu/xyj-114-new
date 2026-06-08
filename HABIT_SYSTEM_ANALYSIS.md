# 习惯系统数据库与架构分析报告

## 一、项目概述

习惯系统是一个基于 **Node.js + Express + SQLite + TypeScript** 的全栈习惯追踪应用，支持用户习惯管理、打卡记录、团队协作和排行榜功能。

**技术栈：**
- 前端：React 18 + TypeScript + Vite + TailwindCSS
- 后端：Express 4 + TypeScript
- 数据库：SQLite (better-sqlite3)
- 认证：JWT + bcryptjs

---

## 二、数据库表结构与设计分析

### 2.1 数据库初始化

数据库初始化脚本位于 [db.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/utils/db.ts)，采用 WAL 模式并开启外键约束：

```sql
PRAGMA journal_mode = WAL;      -- 启用WAL日志模式，提高并发读写性能
PRAGMA foreign_keys = ON;       -- 启用外键约束
```

### 2.2 数据表结构

#### 2.2.1 users 表（用户表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户ID |
| username | VARCHAR(50) | UNIQUE NOT NULL | 用户名 |
| email | VARCHAR(100) | UNIQUE NOT NULL | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| avatar | VARCHAR(255) | DEFAULT '' | 头像 |
| total_checkins | INTEGER | DEFAULT 0 | 总打卡次数（冗余字段） |
| streak_days | INTEGER | DEFAULT 0 | 连续打卡天数（冗余字段） |
| last_checkin_date | DATE | - | 最后打卡日期 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**设计点评：**
- ✅ 使用 `password_hash` 存储加密密码，安全规范
- ✅ 冗余字段 `total_checkins` 和 `streak_days` 避免频繁聚合查询
- ❌ 缺少 `username` 和 `email` 字段的索引（虽有 UNIQUE 约束自动创建）

#### 2.2.2 habits 表（习惯表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 习惯ID |
| user_id | INTEGER | NOT NULL, FK | 用户ID |
| name | VARCHAR(100) | NOT NULL | 习惯名称 |
| icon | VARCHAR(50) | DEFAULT '✅' | 图标 |
| color | VARCHAR(20) | DEFAULT '#FF6B6B' | 颜色 |
| frequency | VARCHAR(10) | DEFAULT 'daily' | 频率：daily/weekly |
| target_days | INTEGER | DEFAULT 7 | 目标天数 |
| reminder_time | VARCHAR(5) | - | 提醒时间 HH:MM |
| reminder_enabled | INTEGER | DEFAULT 0 | 是否开启提醒 |
| short_term_goal | VARCHAR(255) | - | 短期目标 |
| long_term_goal | VARCHAR(255) | - | 长期目标 |
| category | VARCHAR(50) | - | 分类 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**设计点评：**
- ✅ 外键 `ON DELETE CASCADE`，删除用户时自动删除关联习惯
- ❌ 缺少 `user_id` 索引，查询用户习惯时可能全表扫描
- ❌ `frequency` 字段使用 VARCHAR，建议改用枚举类型或 CHECK 约束

#### 2.2.3 checkins 表（打卡记录表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 打卡ID |
| user_id | INTEGER | NOT NULL, FK | 用户ID |
| habit_id | INTEGER | NOT NULL, FK | 习惯ID |
| checkin_date | DATE | NOT NULL | 打卡日期 |
| mood | VARCHAR(10) | - | 心情 |
| notes | TEXT | - | 日记备注 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**关键约束：**
- `UNIQUE(user_id, habit_id, checkin_date)`：防止同一天同一习惯重复打卡
- 外键均为 `ON DELETE CASCADE`

**已有索引：**
- `idx_checkins_user_date` ON `checkins(user_id, checkin_date)`
- `idx_checkins_habit` ON `checkins(habit_id)`

**设计点评：**
- ✅ 联合唯一约束有效防止重复打卡
- ✅ 组合索引 `(user_id, checkin_date)` 支持按用户和日期范围查询
- ✅ 单独索引 `habit_id` 支持按习惯查询打卡记录

#### 2.2.4 teams 表（队伍表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 队伍ID |
| name | VARCHAR(100) | NOT NULL | 队伍名称 |
| description | TEXT | - | 描述 |
| invite_code | VARCHAR(20) | UNIQUE NOT NULL | 邀请码 |
| owner_id | INTEGER | NOT NULL, FK | 创建者ID |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**已有索引：**
- `idx_teams_invite_code` ON `teams(invite_code)`

#### 2.2.5 team_members 表（队伍成员表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 记录ID |
| team_id | INTEGER | NOT NULL, FK | 队伍ID |
| user_id | INTEGER | NOT NULL, FK | 用户ID |
| joined_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 加入时间 |

**关键约束：**
- `UNIQUE(team_id, user_id)`：防止重复加入队伍

### 2.3 ER 关系图

```
users ──┬──< habits >──┬──< checkins
        │               │
        ├──< teams >    │
        │     ∧         │
        └──< team_members >──┘
```

---

## 三、SQL 性能问题与优化建议

### 3.1 严重性能问题（P0）

#### 问题1：循环执行SQL查询（N+1问题变种）

**位置：** [checkinRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/checkinRepository.ts#L203-L225) `getStreakDays` 方法

```typescript
getStreakDays(userId: number): number {
  // ...
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM checkins
    WHERE user_id = ? AND checkin_date = ?
  `);

  while (true) {
    // 循环中逐天查询，最坏情况下需要执行数百次SQL
    const row = stmt.get(userId, dateStr);
    if (row.count > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
```

**问题分析：**
- 连续打卡N天，就需要执行N次SQL查询
- 用户连续打卡100天 → 100次数据库查询
- 高并发场景下会造成数据库连接耗尽

**优化方案：**
```sql
-- 一次性查询日期范围内的所有打卡记录，在内存中计算连续天数
SELECT DISTINCT checkin_date 
FROM checkins 
WHERE user_id = ? 
  AND checkin_date >= ?  -- 计算一个合理的起始日期（如365天前）
ORDER BY checkin_date DESC;
```

#### 问题2：重复执行相同的子查询

**位置：** [leaderboardRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/leaderboardRepository.ts#L20-L41) `getTeamLeaderboard` 方法

```sql
SELECT 
  ROW_NUMBER() OVER (ORDER BY 
    -- 子查询1：计算队伍打卡总数
    COALESCE((SELECT COUNT(*) FROM checkins c 
              JOIN team_members tm ON c.user_id = tm.user_id 
              WHERE tm.team_id = t.id), 0) DESC, 
    -- 子查询2：计算队伍成员数
    (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) DESC) as rank,
  t.id as teamId,
  t.name,
  -- 子查询3：重复计算成员数
  (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as memberCount,
  -- 子查询4：重复计算打卡总数
  COALESCE((SELECT COUNT(*) FROM checkins c 
            JOIN team_members tm ON c.user_id = tm.user_id 
            WHERE tm.team_id = t.id), 0) as totalCheckins
FROM teams t
ORDER BY 
  -- 子查询5：重复计算打卡总数
  COALESCE((SELECT COUNT(*) FROM checkins c ...), 0) DESC, 
  -- 子查询6：重复计算成员数
  (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) DESC
LIMIT ?
```

**问题分析：**
- 同一统计逻辑重复执行了2-3次
- 每条队伍记录执行4次独立的子查询
- 假设100条队伍记录 → 400次隐含的子查询

**优化方案：** 使用 JOIN + GROUP BY 预聚合，或使用 CTE 复用计算结果

```sql
WITH team_stats AS (
  SELECT 
    tm.team_id,
    COUNT(DISTINCT tm.user_id) as member_count,
    COUNT(c.id) as total_checkins
  FROM team_members tm
  LEFT JOIN checkins c ON tm.user_id = c.user_id
  GROUP BY tm.team_id
)
SELECT 
  ROW_NUMBER() OVER (ORDER BY COALESCE(ts.total_checkins, 0) DESC, COALESCE(ts.member_count, 0) DESC) as rank,
  t.id as teamId,
  t.name,
  COALESCE(ts.member_count, 0) as memberCount,
  COALESCE(ts.total_checkins, 0) as totalCheckins
FROM teams t
LEFT JOIN team_stats ts ON t.id = ts.team_id
ORDER BY COALESCE(ts.total_checkins, 0) DESC, COALESCE(ts.member_count, 0) DESC
LIMIT ?
```

#### 问题3：N+1 查询问题

**位置：** [habitRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/habitRepository.ts#L199-L209) `getHabitsWithStats` 方法

```typescript
getHabitsWithStats(userId: number, date: string) {
  // 查询1：获取用户所有习惯（假设返回N条）
  const habits = this.getHabitsWithCheckinStatus(userId, date);
  return habits.map((habit) => {
    // 查询N次：每个习惯单独查询统计信息
    const stats = this.getHabitStats(habit.id, userId);
    return { ...habit, ...stats };
  });
}
```

**问题分析：**
- 用户有10个习惯 → 1 + 10 = 11次查询
- `getHabitStats` 内部还会再次调用 `getHabitById`，实际查询更多

**优化方案：** 使用批量查询，一次性获取所有习惯的统计数据

```sql
-- 一次性查询所有习惯的打卡记录，在内存中分组统计
SELECT 
  h.id as habit_id,
  c.checkin_date
FROM habits h
LEFT JOIN checkins c ON h.id = c.habit_id AND c.user_id = h.user_id
WHERE h.user_id = ?
ORDER BY h.id, c.checkin_date DESC;
```

### 3.2 中等性能问题（P1）

#### 问题4：函数运算导致索引失效

**位置：** [checkinRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/checkinRepository.ts#L152-L167) `getCheckinCalendar` 方法

```sql
SELECT checkin_date as date, COUNT(*) as count
FROM checkins
WHERE user_id = ? 
  AND strftime('%Y', checkin_date) = ?   -- 函数运算，无法使用索引
  AND strftime('%m', checkin_date) = ?   -- 函数运算，无法使用索引
GROUP BY checkin_date
ORDER BY checkin_date
```

**问题分析：**
- 对字段使用 `strftime` 函数，导致 `idx_checkins_user_date` 索引失效
- 虽然索引包含 `checkin_date`，但函数运算后无法利用索引排序和过滤

**优化方案：** 使用日期范围查询替代函数运算

```sql
SELECT checkin_date as date, COUNT(*) as count
FROM checkins
WHERE user_id = ? 
  AND checkin_date BETWEEN ? AND ?  -- 使用日期范围，可命中索引
GROUP BY checkin_date
ORDER BY checkin_date
```

**同理优化位置：**
- [statsRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/statsRepository.ts#L57-L61) 月份统计查询

#### 问题5：重复查询相同数据

**位置：** [statsRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/statsRepository.ts#L37-L103) `getUserStats` 方法

```typescript
getUserStats(userId: number): UserStats {
  // 查询1：用户基本统计
  const userRow = userStmt.get(userId, userId);
  
  // 查询2：本周打卡数
  const weekRow = weekStmt.get(userId, weekStartDate);
  
  // 查询3：本月打卡数
  const monthRow = monthStmt.get(userId, monthStr);
  
  // 查询4：习惯统计
  const habitRows = habitStatsStmt.all(userId);

  return {
    // 重复查询5：再次调用 getTotalCheckins
    totalCheckins: checkinRepository.getTotalCheckins(userId),
    // 重复查询6：再次调用 getStreakDays（内部循环查询）
    streakDays: checkinRepository.getStreakDays(userId),
    habitsCount: userRow?.habits_count || 0,
    checkinsThisWeek: weekRow?.count || 0,
    checkinsThisMonth: monthRow?.count || 0,
    habitStats,
  };
}
```

**问题分析：**
- `userStmt` 已经查询了 `total_checkins` 和 `streak_days`，但返回时又重复调用 `checkinRepository` 的方法
- 造成不必要的数据库往返

**优化方案：** 复用已查询的数据

```typescript
return {
  totalCheckins: userRow?.total_checkins || 0,  // 直接使用已查询的数据
  streakDays: userRow?.streak_days || 0,        // 直接使用已查询的数据
  // ...
};
```

#### 问题6：多个Repository方法功能重复

| 重复方法 | 位置 | 说明 |
|---------|------|------|
| `create` / `createCheckin` | checkinRepository.ts | 完全相同的插入逻辑 |
| `findByUserAndDate` / `getCheckinsByDate` | checkinRepository.ts | 完全相同的查询逻辑 |
| `hasCheckinOnDate` / `hasCheckedIn` | checkinRepository.ts | 完全相同的存在性检查 |
| `getCalendarData` / `getCheckinCalendar` | checkinRepository.ts | 完全相同的日历查询 |
| `delete` / `deleteCheckin` | checkinRepository.ts | 完全相同的删除逻辑 |
| `getTotalCheckinsByUser` / `getTotalCheckins` | checkinRepository.ts | 完全相同的统计逻辑 |

**优化方案：** 统一方法命名，删除重复实现，保持单一入口。

### 3.3 轻微性能问题（P2）

#### 问题7：缺少必要的索引

| 表 | 建议添加的索引 | 用途 |
|----|--------------|------|
| habits | `idx_habits_user_id` ON habits(user_id) | 加速用户习惯列表查询 |
| team_members | `idx_team_members_user_id` ON team_members(user_id) | 加速查询用户加入的队伍 |
| checkins | `idx_checkins_user_habit_date` ON checkins(user_id, habit_id, checkin_date) | 利用覆盖索引优化重复打卡检查 |

#### 问题8：未充分利用覆盖索引

**位置：** [checkinRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/checkinRepository.ts#L119-L137) `hasCheckedIn` 方法

```sql
SELECT 1 FROM checkins
WHERE user_id = ? AND habit_id = ? AND checkin_date = ?
LIMIT 1
```

**优化建议：** 创建覆盖索引后，查询可以直接从索引返回，无需回表

```sql
CREATE INDEX IF NOT EXISTS idx_checkins_user_habit_date 
ON checkins(user_id, habit_id, checkin_date);
```

#### 问题9：分页查询缺失

排行榜查询 `getPersonalLeaderboard` 和 `getTeamLeaderboard` 均硬编码 `LIMIT 100`，无法支持分页。

**优化方案：** 增加 offset 参数支持分页

```typescript
getPersonalLeaderboard(limit = 100, offset = 0): LeaderboardEntry[] {
  return db.prepare(`... LIMIT ? OFFSET ?`).all(limit, offset);
}
```

### 3.4 SQL 优化总结表

| 优先级 | 问题类型 | 涉及文件 | 优化效果 |
|--------|---------|---------|---------|
| P0 | 循环SQL查询 | checkinRepository.ts | 减少99%的查询次数 |
| P0 | 重复子查询 | leaderboardRepository.ts | 查询性能提升3-4倍 |
| P0 | N+1查询 | habitRepository.ts | 查询次数从N+1降至2 |
| P1 | 函数导致索引失效 | checkinRepository.ts, statsRepository.ts | 索引命中率从0%→100% |
| P1 | 重复查询相同数据 | statsRepository.ts | 减少2次不必要查询 |
| P1 | 重复方法实现 | checkinRepository.ts | 代码可维护性提升 |
| P2 | 缺少索引 | db.ts | 相关查询性能提升 |
| P2 | 未使用覆盖索引 | db.ts | 避免回表查询 |
| P2 | 缺少分页 | leaderboardRepository.ts | 支持大数据量场景 |

---

## 四、三层架构职责、数据流与依赖关系

### 4.1 架构总览

系统采用经典的三层架构设计，位于 [api/](file:///Users/tog/Desktop/code/solo/xyj-114/api/) 目录下：

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Frontend)                    │
└─────────────────────────────┬───────────────────────────┘
                              │ HTTP Request
┌─────────────────────────────▼───────────────────────────┐
│                   Routes / Controller                   │
│  职责：请求路由、参数解析、响应封装、异常处理            │
└─────────────────────────────┬───────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────┐
│                     Services / 业务层                    │
│  职责：业务逻辑、参数校验、事务控制、多Repository协调    │
└─────────────────────────────┬───────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────┐
│                 Repositories / 数据访问层                │
│  职责：SQL执行、结果映射、单一表操作、原子数据访问       │
└─────────────────────────────┬───────────────────────────┘
                              │ SQL
┌─────────────────────────────▼───────────────────────────┐
│                     SQLite Database                      │
└─────────────────────────────────────────────────────────┘
```

### 4.2 各层职责详解

#### 4.2.1 Routes 层（Controller 层）

**目录：** [api/routes/](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/)

**核心职责：**
1. **路由注册**：定义 API 端点与 HTTP 方法的映射
2. **请求解析**：从 request 对象中提取参数（path params、query、body）
3. **认证鉴权**：应用 authMiddleware 进行 Token 验证
4. **响应封装**：调用 Service 层并统一返回 JSON 格式
5. **异常捕获**：捕获业务异常并返回合适的 HTTP 状态码

**文件列表：**
| 文件 | 路由前缀 | 主要职责 |
|------|---------|---------|
| [auth.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/auth.ts) | `/api/auth` | 登录、注册、获取当前用户 |
| [habits.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/habits.ts) | `/api/habits` | 习惯CRUD操作 |
| [checkins.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/checkins.ts) | `/api/checkins` | 打卡、撤销打卡、打卡历史 |
| [teams.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/teams.ts) | `/api/teams` | 队伍创建、加入、成员管理 |
| [leaderboard.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/leaderboard.ts) | `/api/leaderboard` | 个人/队伍排行榜 |
| [users.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/users.ts) | `/api/users` | 用户统计数据 |

**代码示例（habits.ts）：**
```typescript
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // 1. 从 request 中获取 userId（由 authMiddleware 注入）
    // 2. 调用 Service 层处理业务逻辑
    const result = await habitService.getHabits(req.userId!);
    // 3. 返回统一格式的响应
    res.json(result);
  } catch (error) {
    // 4. 异常处理，返回500状态码
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});
```

#### 4.2.2 Services 层（业务逻辑层）

**目录：** [api/services/](file:///Users/tog/Desktop/code/solo/xyj-114/api/services/)

**核心职责：**
1. **业务规则验证**：参数合法性校验、业务规则检查
2. **业务流程编排**：协调多个 Repository 完成复杂业务操作
3. **数据转换**：在业务层进行数据处理和转换
4. **事务边界**：理论上应在此层控制事务（当前代码未显式使用事务）

**文件列表：**
| 文件 | 主要职责 | 依赖的 Repository |
|------|---------|------------------|
| [authService.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/services/authService.ts) | 认证逻辑、密码校验、Token生成 | userRepository |
| [habitService.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/services/habitService.ts) | 习惯CRUD业务逻辑 | habitRepository |
| [checkinService.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/services/checkinService.ts) | 打卡业务逻辑、连续打卡计算 | checkinRepository, habitRepository, userRepository, statsRepository |
| [teamService.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/services/teamService.ts) | 队伍创建、加入、成员管理 | teamRepository, userRepository |
| [leaderboardService.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/services/leaderboardService.ts) | 排行榜业务逻辑 | leaderboardRepository |

**代码示例（checkinService.ts - checkin 方法）：**
```typescript
checkin(userId: number, habitId: number, date: string, mood?: string, notes?: string) {
  // 1. 参数校验
  if (!isDateValid(date)) {
    return { success: false, message: '日期格式无效' };
  }

  // 2. 业务规则校验：习惯是否存在
  const habit = habitRepository.getHabitById(habitId, userId);
  if (!habit) {
    return { success: false, message: '习惯不存在' };
  }

  // 3. 业务规则校验：是否已打卡
  const existingCheckin = checkinRepository.hasCheckedIn(userId, habitId, date);
  if (existingCheckin) {
    return { success: false, message: '今日已打卡' };
  }

  // 4. 执行数据操作
  const checkinId = checkinRepository.createCheckin(userId, habitId, date, mood, notes);
  
  // 5. 协调多个Repository：更新用户统计数据
  const streakDays = calculateStreak(userId);
  const totalCheckins = checkinRepository.getTotalCheckins(userId);
  userRepository.updateCheckinStats(userId, totalCheckins, streakDays, date);

  // 6. 返回业务结果
  return { success: true, data: checkin, message: '打卡成功' };
}
```

#### 4.2.3 Repositories 层（数据访问层）

**目录：** [api/repositories/](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/)

**核心职责：**
1. **数据访问**：执行 SQL 查询，与数据库交互
2. **结果映射**：将数据库行（Row）映射为类型化的实体对象
3. **原子操作**：每个方法通常对应一个或一组相关的 SQL 操作
4. **单一职责**：原则上每个 Repository 只操作一张表

**文件列表：**
| 文件 | 对应表 | 主要职责 |
|------|--------|---------|
| [userRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/userRepository.ts) | users | 用户CRUD、密码查询、排行榜 |
| [habitRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/habitRepository.ts) | habits | 习惯CRUD、打卡状态查询、统计计算 |
| [checkinRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/checkinRepository.ts) | checkins | 打卡CRUD、日历查询、连续打卡计算 |
| [teamRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/teamRepository.ts) | teams, team_members | 队伍CRUD、成员管理 |
| [leaderboardRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/leaderboardRepository.ts) | 多表关联 | 排行榜查询（跨表聚合） |
| [statsRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/statsRepository.ts) | 多表关联 | 用户统计数据查询 |

**代码示例（habitRepository.ts - mapHabit 映射函数）：**
```typescript
function mapHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    frequency: row.frequency as 'daily' | 'weekly',
    targetDays: row.target_days,
    reminderTime: row.reminder_time || undefined,
    reminderEnabled: Boolean(row.reminder_enabled),  // SQLite integer → boolean
    // ... 更多字段映射
  };
}
```

### 4.3 数据流分析

#### 4.3.1 典型请求数据流（打卡流程）

```
HTTP POST /api/checkins
        │
        ▼
[checkins.ts] router.post('/')
  │ 1. 应用 authMiddleware 验证 Token
  │ 2. 提取参数：habitId, date, mood, notes
  │ 3. 调用 checkinService.checkin()
  ▼
[checkinService.ts] checkin()
  │ 1. 校验日期格式 isDateValid()
  │ 2. 调用 habitRepository.getHabitById() → 验证习惯存在
  │ 3. 调用 checkinRepository.hasCheckedIn() → 验证未重复打卡
  │ 4. 调用 checkinRepository.createCheckin() → 插入打卡记录
  │ 5. 调用 checkinRepository.getStreakDays() → 计算连续天数（性能瓶颈）
  │ 6. 调用 checkinRepository.getTotalCheckins() → 计算总打卡数
  │ 7. 调用 userRepository.updateCheckinStats() → 更新用户冗余统计
  ▼
返回 { success: true, data: checkin }
        │
        ▼
HTTP Response 200 OK
```

#### 4.3.2 查询数据流（获取习惯列表）

```
HTTP GET /api/habits
        │
        ▼
[habits.ts] router.get('/')
  │ 1. authMiddleware 验证 Token
  │ 2. 调用 habitService.getHabits()
  ▼
[habitService.ts] getHabits()
  │ 1. 获取今日日期
  │ 2. 调用 habitRepository.getHabitsWithStats()
  ▼
[habitRepository.ts] getHabitsWithStats()
  │ 1. 调用 getHabitsWithCheckinStatus() → 查询习惯+今日打卡状态（1次查询）
  │ 2. 对每个习惯调用 getHabitStats() → 循环查询每个习惯的统计（N次查询，N+1问题）
  │    ├─ 查询打卡记录（1次）
  │    └─ 调用 getHabitById()（1次）
  ▼
返回 habits[] 数组（包含 currentStreak, completionRate）
```

### 4.4 依赖关系分析

#### 4.4.1 层间依赖关系

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Routes    │───▶│  Services   │───▶│Repositories │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       │                  │                  ▼
       │                  │            ┌───────────┐
       │                  │            │  Database │
       │                  │            └───────────┐
       │                  │
       │                  ▼
       │            ┌─────────────┐
       │            │  Shared     │
       │            │  Types      │
       │            └─────────────┘
       │
       ▼
┌─────────────┐
│ Middleware  │
│ (auth.ts)   │
└─────────────┘
```

**依赖规则：**
- ✅ Routes 只依赖 Services，不直接访问 Repositories
- ✅ Services 依赖 Repositories，不直接执行 SQL
- ✅ Repositories 只依赖 db 工具和类型定义
- ✅ 所有层共享 [shared/types.ts](file:///Users/tog/Desktop/code/solo/xyj-114/shared/types.ts) 中的类型定义

#### 4.4.2 Repository 间依赖关系

```
statsRepository ──┐
                  ├──▶ checkinRepository
teamService  ─────┤
                  ├──▶ userRepository
checkinService ───┤
                  └──▶ habitRepository
                  
teamRepository ──┐
                 ├──▶ teams 表
                 └──▶ team_members 表
```

**问题点：**
- `statsRepository` 直接依赖 `checkinRepository`，跨 Repository 调用可能导致事务问题
- Repository 之间存在隐式依赖，建议：
  1. 在 Service 层协调多个 Repository
  2. 或提取公共查询方法到共享模块

#### 4.4.3 模块依赖图（完整）

```
┌─────────────────────────────────────────────────────────┐
│                      app.ts                             │
│  路由注册、中间件配置、全局错误处理                      │
└─────┬───────────────────────────┬───────────────────┬───┘
      │                           │                   │
      ▼                           ▼                   ▼
┌─────────────┐           ┌─────────────┐     ┌─────────────┐
│ auth.ts     │           │ habits.ts   │     │ checkins.ts │
│ routes      │           │ routes      │     │ routes      │
└─────┬───────┘           └──────┬──────┘     └──────┬──────┘
      │                          │                   │
      ├──────────────────────────┼───────────────────┘
      │                          │
      ▼                          ▼
┌─────────────┐           ┌─────────────┐
│ authService │           │ habitService│
└─────┬───────┘           └──────┬──────┘
      │                          │
      ▼                          ▼
┌─────────────┐           ┌─────────────┐
│userRepository│          │habitRepository│
└─────────────┘           └──────┬──────┘
                                 │
      ┌──────────────────────────┘
      │
      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ checkinService │   │ teamService │   │ leaderboardService │
└──────┬──────┘     └──────┬──────┘     └────────┬──────┘
       │                   │                     │
       ▼                   ▼                     ▼
┌─────────────────┐ ┌────────────────┐ ┌────────────────────┐
│ checkinRepository │ │ teamRepository │ │ leaderboardRepository │
└─────────────────┘ └────────────────┘ └────────────────────┘
       │                   │                     │
       └───────────────────┼─────────────────────┘
                           ▼
                     ┌──────────┐
                     │   db.ts  │
                     │ (SQLite) │
                     └──────────┘
```

### 4.5 架构设计点评

#### 优点：
1. ✅ **职责清晰**：三层划分明确，各层职责单一
2. ✅ **类型安全**：全程使用 TypeScript，共享类型定义
3. ✅ **依赖方向正确**：上层依赖下层，没有反向依赖
4. ✅ **认证中间件**：统一的 JWT 认证逻辑，避免重复代码
5. ✅ **错误处理**：每一层都有 try-catch 异常捕获

#### 可改进点：
1. ❌ **缺少事务管理**：打卡操作涉及多张表更新，应使用事务保证原子性
2. ❌ **Repository 跨层调用**：statsRepository 直接调用 checkinRepository，破坏单一职责
3. ❌ **业务逻辑下沉**：部分统计计算逻辑应放在 Service 层而非 Repository 层
4. ❌ **缺少接口抽象**：Repository 未定义接口，不利于单元测试和替换实现
5. ❌ **循环依赖风险**：statsRepository 依赖 checkinRepository，未来可能引入循环依赖

---

## 五、优化建议汇总

### 5.1 数据库优化

| 序号 | 优化项 | 实施难度 | 预期收益 |
|------|--------|---------|---------|
| 1 | 优化 `getStreakDays` 循环查询 | 中 | 性能提升 10~100 倍 |
| 2 | 优化 `getTeamLeaderboard` 重复子查询 | 中 | 性能提升 3~5 倍 |
| 3 | 优化 `getHabitsWithStats` N+1 查询 | 中 | 性能提升 2~5 倍 |
| 4 | 替换 `strftime` 为日期范围查询 | 低 | 索引命中率 0% → 100% |
| 5 | 添加 `idx_habits_user_id` 索引 | 极低 | 习惯列表查询加速 |
| 6 | 添加 `idx_team_members_user_id` 索引 | 极低 | 用户队伍查询加速 |
| 7 | 添加 `idx_checkins_user_habit_date` 覆盖索引 | 极低 | 打卡存在性检查避免回表 |
| 8 | 复用 `getUserStats` 中已查询数据 | 极低 | 减少 2 次查询 |
| 9 | 删除 Repository 中重复方法 | 极低 | 代码可维护性提升 |
| 10 | 排行榜查询增加分页支持 | 低 | 支持大数据量场景 |

### 5.2 架构优化

| 序号 | 优化项 | 说明 |
|------|--------|------|
| 1 | 引入事务管理 | 打卡操作涉及多表更新，需保证原子性 |
| 2 | Repository 接口化 | 定义 IUserRepository 等接口，便于测试和扩展 |
| 3 | 调整统计逻辑位置 | 将复杂统计计算从 Repository 移至 Service 层 |
| 4 | 禁止 Repository 间调用 | Repository 只负责单表操作，跨表协调由 Service 完成 |
| 5 | 统一响应格式 | 目前 ApiResponse 格式基本统一，可进一步封装为工具函数 |

---

## 六、关键代码位置速查表

| 功能模块 | Repository 位置 | Service 位置 | Route 位置 |
|---------|----------------|-------------|-----------|
| 用户认证 | [userRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/userRepository.ts) | [authService.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/services/authService.ts) | [auth.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/auth.ts) |
| 习惯管理 | [habitRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/habitRepository.ts) | [habitService.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/services/habitService.ts) | [habits.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/habits.ts) |
| 打卡管理 | [checkinRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/checkinRepository.ts) | [checkinService.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/services/checkinService.ts) | [checkins.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/checkins.ts) |
| 队伍管理 | [teamRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/teamRepository.ts) | [teamService.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/services/teamService.ts) | [teams.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/teams.ts) |
| 排行榜 | [leaderboardRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/leaderboardRepository.ts) | [leaderboardService.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/services/leaderboardService.ts) | [leaderboard.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/leaderboard.ts) |
| 用户统计 | [statsRepository.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/repositories/statsRepository.ts) | - | [users.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/routes/users.ts) |
| 数据库初始化 | [db.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/utils/db.ts) | - | - |
| 认证中间件 | - | - | [auth.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/middleware/auth.ts) |
| 应用入口 | - | - | [app.ts](file:///Users/tog/Desktop/code/solo/xyj-114/api/app.ts) |
| 类型定义 | - | - | [types.ts](file:///Users/tog/Desktop/code/solo/xyj-114/shared/types.ts) |

---

## 七、总结

本习惯系统采用了经典的三层架构设计，整体结构清晰，职责划分明确。数据库设计合理，核心表结构完整且有基本的索引支撑。

**主要优势：**
- 类型安全的 TypeScript 全栈开发
- 清晰的三层架构划分
- 合理的数据库表结构设计
- 基本的安全措施（密码哈希、JWT认证）

**主要性能瓶颈：**
1. `getStreakDays` 循环查询（最严重）
2. `getTeamLeaderboard` 重复子查询
3. `getHabitsWithStats` N+1 查询
4. 函数运算导致索引失效

**建议优先实施 P0 和 P1 级别的 SQL 优化，可显著提升系统性能和并发能力。**

import Database from 'better-sqlite3';

let testDb: Database.Database | null = null;

export const getTestDb = (): Database.Database => {
  if (!testDb) {
    testDb = new Database(':memory:');
    testDb.pragma('journal_mode = WAL');
    testDb.pragma('foreign_keys = ON');

    const initTables = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT '',
        total_checkins INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        last_checkin_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50) DEFAULT '✅',
        color VARCHAR(20) DEFAULT '#FF6B6B',
        frequency VARCHAR(10) DEFAULT 'daily',
        target_days INTEGER DEFAULT 7,
        reminder_time VARCHAR(5),
        reminder_enabled INTEGER DEFAULT 0,
        short_term_goal VARCHAR(255),
        long_term_goal VARCHAR(255),
        category VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        habit_id INTEGER NOT NULL,
        checkin_date DATE NOT NULL,
        mood VARCHAR(10),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
        UNIQUE(user_id, habit_id, checkin_date)
      );

      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        invite_code VARCHAR(20) UNIQUE NOT NULL,
        owner_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(team_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, checkin_date);
      CREATE INDEX IF NOT EXISTS idx_checkins_habit ON checkins(habit_id);
      CREATE INDEX IF NOT EXISTS idx_teams_invite_code ON teams(invite_code);
    `;

    testDb.exec(initTables);
  }
  return testDb;
};

export const closeTestDb = (): void => {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
};

export const clearTestDb = (): void => {
  const db = getTestDb();
  const tables = ['checkins', 'habits', 'team_members', 'teams', 'users'];
  for (const table of tables) {
    db.exec(`DELETE FROM ${table}`);
    db.exec(`DELETE FROM sqlite_sequence WHERE name='${table}'`);
  }
};

export default getTestDb;

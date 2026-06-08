import jwt from 'jsonwebtoken';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import { getTestDb } from './mocks/testDb.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-2024';

export const generateTestToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
};

export const createTestUser = async (
  username: string = 'testuser',
  email: string = 'test@example.com',
  password: string = 'password123'
): Promise<{ userId: number; token: string; password: string }> => {
  const db = getTestDb();
  const passwordHash = await bcrypt.hash(password, 10);

  const result = db
    .prepare(
      'INSERT INTO users (username, email, password_hash, total_checkins, streak_days) VALUES (?, ?, ?, 0, 0)'
    )
    .run(username, email, passwordHash);

  const userId = result.lastInsertRowid as number;
  const token = generateTestToken(userId);

  return { userId, token, password };
};

export const createTestHabit = (
  userId: number,
  name: string = '测试习惯',
  icon: string = '✅',
  color: string = '#FF6B6B',
  frequency: 'daily' | 'weekly' = 'daily',
  targetDays: number = 7
): number => {
  const db = getTestDb();
  const result = db
    .prepare(
      'INSERT INTO habits (user_id, name, icon, color, frequency, target_days) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(userId, name, icon, color, frequency, targetDays);
  return result.lastInsertRowid as number;
};

export const createTestCheckin = (
  userId: number,
  habitId: number,
  date: string,
  mood?: string,
  notes?: string
): number => {
  const db = getTestDb();
  const result = db
    .prepare(
      'INSERT INTO checkins (user_id, habit_id, checkin_date, mood, notes) VALUES (?, ?, ?, ?, ?)'
    )
    .run(userId, habitId, date, mood || null, notes || null);

  const totalCheckins = db
    .prepare('SELECT COUNT(*) as count FROM checkins WHERE user_id = ?')
    .get(userId) as { count: number };

  db.prepare(
    'UPDATE users SET total_checkins = ?, last_checkin_date = ? WHERE id = ?'
  ).run(totalCheckins.count, date, userId);

  return result.lastInsertRowid as number;
};

export const createTestTeam = (
  ownerId: number,
  name: string = '测试团队',
  description: string = '这是一个测试团队',
  inviteCode: string = 'TEST123'
): number => {
  const db = getTestDb();
  const result = db
    .prepare(
      'INSERT INTO teams (name, description, invite_code, owner_id) VALUES (?, ?, ?, ?)'
    )
    .run(name, description, inviteCode, ownerId);

  const teamId = result.lastInsertRowid as number;

  db.prepare('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)').run(
    teamId,
    ownerId
  );

  return teamId;
};

export const addTeamMember = (teamId: number, userId: number): number => {
  const db = getTestDb();
  const result = db
    .prepare('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)')
    .run(teamId, userId);
  return result.lastInsertRowid as number;
};

export const authRequest = (token: string) => {
  return {
    get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) =>
      request(app).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      request(app).delete(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) =>
      request(app).patch(url).set('Authorization', `Bearer ${token}`),
  };
};

export const unauthRequest = () => {
  return {
    get: (url: string) => request(app).get(url),
    post: (url: string) => request(app).post(url),
    put: (url: string) => request(app).put(url),
    delete: (url: string) => request(app).delete(url),
    patch: (url: string) => request(app).patch(url),
  };
};

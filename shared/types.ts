export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  totalCheckins: number;
  streakDays: number;
  createdAt: string;
}

export interface Habit {
  id: number;
  userId: number;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetDays: number;
  createdAt: string;
  isCheckedToday?: boolean;
}

export interface Checkin {
  id: number;
  userId: number;
  habitId: number;
  checkinDate: string;
  createdAt: string;
}

export interface CheckinWithHabit extends Checkin {
  habitName: string;
  habitIcon: string;
  habitColor: string;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  inviteCode: string;
  ownerId: number;
  createdAt: string;
  memberCount: number;
  totalCheckins: number;
}

export interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  joinedAt: string;
  user: User;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  avatar: string;
  checkinCount: number;
}

export interface TeamLeaderboardEntry {
  rank: number;
  teamId: number;
  name: string;
  memberCount: number;
  totalCheckins: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CreateHabitRequest {
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetDays: number;
}

export interface CreateTeamRequest {
  name: string;
  description: string;
}

export interface JoinTeamRequest {
  inviteCode: string;
}

export interface UserStats {
  totalCheckins: number;
  streakDays: number;
  habitsCount: number;
  checkinsThisWeek: number;
  checkinsThisMonth: number;
  habitStats: {
    habitId: number;
    habitName: string;
    icon: string;
    color: string;
    count: number;
    completionRate: number;
  }[];
}

export interface CheckinCalendarDay {
  date: string;
  count: number;
}

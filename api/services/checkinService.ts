import type { ApiResponse, Checkin, CheckinCalendarDay } from '../../shared/types';
import { checkinRepository } from '../repositories/checkinRepository';
import { habitRepository } from '../repositories/habitRepository';
import { userRepository } from '../repositories/userRepository';
import { statsRepository } from '../repositories/statsRepository';

const calculateStreak = (userId: number): number => {
  return checkinRepository.getStreakDays(userId);
};

const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isDateValid = (dateStr: string): boolean => {
  const date = new Date(dateStr + 'T00:00:00');
  return !isNaN(date.getTime()) && dateStr === getLocalDateString(date);
};

export const checkinService = {
  checkin(userId: number, habitId: number, date: string): ApiResponse<Checkin> {
    if (!isDateValid(date)) {
      return { success: false, message: '日期格式无效' };
    }

    const habit = habitRepository.getHabitById(habitId, userId);
    if (!habit) {
      return { success: false, message: '习惯不存在' };
    }

    const existingCheckin = checkinRepository.hasCheckedIn(userId, habitId, date);
    if (existingCheckin) {
      return { success: false, message: '今日已打卡' };
    }

    const checkinId = checkinRepository.createCheckin(userId, habitId, date);
    const checkins = checkinRepository.getCheckinsByDate(userId, date);
    const checkin = checkins.find(c => c.id === checkinId);

    if (!checkin) {
      return { success: false, message: '打卡失败' };
    }

    const stats = statsRepository.getUserStats(userId);
    const today = getLocalDateString();
    const streakDays = date === today ? calculateStreak(userId) : stats.streakDays;
    userRepository.updateCheckinStats(userId, stats.totalCheckins, streakDays, date);

    return {
      success: true,
      data: checkin,
      message: '打卡成功',
    };
  },

  getCheckinsByDate(userId: number, date: string): ApiResponse<Checkin[]> {
    if (!isDateValid(date)) {
      return { success: false, message: '日期格式无效' };
    }

    const checkins = checkinRepository.getCheckinsByDate(userId, date);

    return {
      success: true,
      data: checkins,
    };
  },

  getCheckinHistory(
    userId: number,
    startDate: string,
    endDate: string
  ): ApiResponse<Checkin[]> {
    if (!isDateValid(startDate) || !isDateValid(endDate)) {
      return { success: false, message: '日期格式无效' };
    }

    if (new Date(startDate) > new Date(endDate)) {
      return { success: false, message: '开始日期不能晚于结束日期' };
    }

    const checkins = checkinRepository.getCheckinHistory(userId, startDate, endDate);

    return {
      success: true,
      data: checkins,
    };
  },

  getCheckinCalendar(
    userId: number,
    year: number,
    month: number
  ): ApiResponse<CheckinCalendarDay[]> {
    if (year < 2000 || year > 2100) {
      return { success: false, message: '年份无效' };
    }

    if (month < 1 || month > 12) {
      return { success: false, message: '月份无效' };
    }

    const calendarData = checkinRepository.getCheckinCalendar(userId, year, month);

    return {
      success: true,
      data: calendarData,
    };
  },

  undoCheckin(userId: number, habitId: number, date: string): ApiResponse {
    if (!isDateValid(date)) {
      return { success: false, message: '日期格式无效' };
    }

    const existingCheckin = checkinRepository.hasCheckedIn(userId, habitId, date);
    if (!existingCheckin) {
      return { success: false, message: '该日期没有打卡记录' };
    }

    const deleted = checkinRepository.deleteCheckin(userId, habitId, date);
    if (!deleted) {
      return { success: false, message: '取消打卡失败' };
    }

    const stats = statsRepository.getUserStats(userId);
    const today = getLocalDateString();
    const lastCheckinDate = date === today ? null : date;
    userRepository.updateCheckinStats(userId, stats.totalCheckins, stats.streakDays, lastCheckinDate || today);

    return {
      success: true,
      message: '取消打卡成功',
    };
  },
};

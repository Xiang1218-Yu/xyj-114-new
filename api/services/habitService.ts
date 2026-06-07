import type { ApiResponse, Habit, CreateHabitRequest } from '../../shared/types';
import { habitRepository } from '../repositories/habitRepository';

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

const VALID_CATEGORIES = ['健康', '学习', '工作', '生活', '运动', '阅读', '其他'];

export const habitService = {
  createHabit(userId: number, habitData: CreateHabitRequest): ApiResponse<Habit> {
    if (!habitData.name || habitData.name.trim() === '') {
      return { success: false, message: '习惯名称不能为空' };
    }

    if (!['daily', 'weekly'].includes(habitData.frequency)) {
      return { success: false, message: '频率只能是 daily 或 weekly' };
    }

    if (habitData.targetDays < 1 || habitData.targetDays > 365) {
      return { success: false, message: '目标天数必须在1-365之间' };
    }

    if (habitData.reminderEnabled && !habitData.reminderTime) {
      return { success: false, message: '开启提醒后必须设置提醒时间' };
    }

    if (habitData.reminderTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(habitData.reminderTime)) {
      return { success: false, message: '提醒时间格式不正确，应为 HH:MM 格式' };
    }

    if (habitData.shortTermGoal && habitData.shortTermGoal.length > 255) {
      return { success: false, message: '短期目标不能超过255个字符' };
    }

    if (habitData.longTermGoal && habitData.longTermGoal.length > 255) {
      return { success: false, message: '长期目标不能超过255个字符' };
    }

    if (habitData.category && !VALID_CATEGORIES.includes(habitData.category)) {
      return { success: false, message: `分类必须是以下之一：${VALID_CATEGORIES.join('、')}` };
    }

    const reminderEnabled = habitData.reminderEnabled ?? false;
    const reminderTime = reminderEnabled ? habitData.reminderTime : undefined;

    const habitId = habitRepository.createHabit(
      userId,
      habitData.name,
      habitData.icon,
      habitData.color,
      habitData.frequency,
      habitData.targetDays,
      reminderTime,
      reminderEnabled,
      habitData.shortTermGoal,
      habitData.longTermGoal,
      habitData.category
    );

    const habit = habitRepository.getHabitById(habitId, userId);

    if (!habit) {
      return { success: false, message: '创建习惯失败' };
    }

    const stats = habitRepository.getHabitStats(habitId, userId);

    return {
      success: true,
      data: {
        ...habit,
        currentStreak: stats.currentStreak,
        completionRate: stats.completionRate,
      },
      message: '习惯创建成功',
    };
  },

  getHabits(userId: number): ApiResponse<Habit[]> {
    const today = getTodayDate();
    const habits = habitRepository.getHabitsWithStats(userId, today);

    return {
      success: true,
      data: habits,
    };
  },

  updateHabit(
    userId: number,
    habitId: number,
    habitData: Partial<CreateHabitRequest>
  ): ApiResponse<Habit> {
    const existingHabit = habitRepository.getHabitById(habitId, userId);
    if (!existingHabit) {
      return { success: false, message: '习惯不存在' };
    }

    if (habitData.frequency && !['daily', 'weekly'].includes(habitData.frequency)) {
      return { success: false, message: '频率只能是 daily 或 weekly' };
    }

    if (habitData.targetDays !== undefined && (habitData.targetDays < 1 || habitData.targetDays > 365)) {
      return { success: false, message: '目标天数必须在1-365之间' };
    }

    if (habitData.shortTermGoal && habitData.shortTermGoal.length > 255) {
      return { success: false, message: '短期目标不能超过255个字符' };
    }

    if (habitData.longTermGoal && habitData.longTermGoal.length > 255) {
      return { success: false, message: '长期目标不能超过255个字符' };
    }

    if (habitData.category && !VALID_CATEGORIES.includes(habitData.category)) {
      return { success: false, message: `分类必须是以下之一：${VALID_CATEGORIES.join('、')}` };
    }

    const reminderEnabled = habitData.reminderEnabled ?? existingHabit.reminderEnabled;
    const reminderTime = habitData.reminderTime ?? existingHabit.reminderTime;

    if (reminderEnabled && !reminderTime) {
      return { success: false, message: '开启提醒后必须设置提醒时间' };
    }

    if (reminderTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
      return { success: false, message: '提醒时间格式不正确，应为 HH:MM 格式' };
    }

    const name = habitData.name ?? existingHabit.name;
    const icon = habitData.icon ?? existingHabit.icon;
    const color = habitData.color ?? existingHabit.color;
    const frequency = habitData.frequency ?? existingHabit.frequency;
    const targetDays = habitData.targetDays ?? existingHabit.targetDays;
    const shortTermGoal = habitData.shortTermGoal !== undefined ? habitData.shortTermGoal : existingHabit.shortTermGoal;
    const longTermGoal = habitData.longTermGoal !== undefined ? habitData.longTermGoal : existingHabit.longTermGoal;
    const category = habitData.category !== undefined ? habitData.category : existingHabit.category;

    const updated = habitRepository.updateHabit(
      habitId,
      userId,
      name,
      icon,
      color,
      frequency,
      targetDays,
      reminderTime,
      reminderEnabled,
      shortTermGoal,
      longTermGoal,
      category
    );
    if (!updated) {
      return { success: false, message: '更新失败' };
    }

    const today = getTodayDate();
    const habits = habitRepository.getHabitsWithStats(userId, today);
    const habit = habits.find(h => h.id === habitId);

    if (!habit) {
      return { success: false, message: '更新失败' };
    }

    return {
      success: true,
      data: habit,
      message: '习惯更新成功',
    };
  },

  deleteHabit(userId: number, habitId: number): ApiResponse {
    const existingHabit = habitRepository.getHabitById(habitId, userId);
    if (!existingHabit) {
      return { success: false, message: '习惯不存在' };
    }

    const deleted = habitRepository.deleteHabit(habitId, userId);
    if (!deleted) {
      return { success: false, message: '删除失败' };
    }

    return {
      success: true,
      message: '习惯删除成功',
    };
  },
};

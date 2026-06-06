import type { ApiResponse, Habit, CreateHabitRequest } from '../../shared/types';
import { habitRepository } from '../repositories/habitRepository';

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const habitService = {
  createHabit(userId: number, habitData: CreateHabitRequest): ApiResponse<Habit> {
    if (!habitData.name || habitData.name.trim() === '') {
      return { success: false, message: '习惯名称不能为空' };
    }

    if (!['daily', 'weekly'].includes(habitData.frequency)) {
      return { success: false, message: '频率只能是 daily 或 weekly' };
    }

    if (habitData.targetDays < 1 || habitData.targetDays > 7) {
      return { success: false, message: '目标天数必须在1-7之间' };
    }

    const habitId = habitRepository.createHabit(
      userId,
      habitData.name,
      habitData.icon,
      habitData.color,
      habitData.frequency,
      habitData.targetDays
    );

    const habit = habitRepository.getHabitById(habitId, userId);

    if (!habit) {
      return { success: false, message: '创建习惯失败' };
    }

    return {
      success: true,
      data: habit,
      message: '习惯创建成功',
    };
  },

  getHabits(userId: number): ApiResponse<Habit[]> {
    const today = getTodayDate();
    const habits = habitRepository.getHabitsWithCheckinStatus(userId, today);

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

    if (habitData.targetDays !== undefined && (habitData.targetDays < 1 || habitData.targetDays > 7)) {
      return { success: false, message: '目标天数必须在1-7之间' };
    }

    const name = habitData.name ?? existingHabit.name;
    const icon = habitData.icon ?? existingHabit.icon;
    const color = habitData.color ?? existingHabit.color;
    const frequency = habitData.frequency ?? existingHabit.frequency;
    const targetDays = habitData.targetDays ?? existingHabit.targetDays;

    const updated = habitRepository.updateHabit(habitId, userId, name, icon, color, frequency, targetDays);
    if (!updated) {
      return { success: false, message: '更新失败' };
    }

    const today = getTodayDate();
    const habits = habitRepository.getHabitsWithCheckinStatus(userId, today);
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

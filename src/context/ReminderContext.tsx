import { createContext, useContext, useEffect, useRef, useCallback, useState, ReactNode } from 'react';
import type { Habit } from '@shared/types';
import { checkin } from '@/api/checkins';
import { getHabits } from '@/api/habits';
import { getLocalDateString } from '@/lib/utils';

interface ReminderContextType {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  refreshHabits: () => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  notificationEnabled: boolean;
  markHabitChecked: (habitId: number) => void;
}

const ReminderContext = createContext<ReminderContextType | null>(null);

const NOTIFICATION_ICON = '/favicon.svg';

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const notifiedHabitsRef = useRef<Set<string>>(new Set());
  const checkinInProgressRef = useRef<Set<number>>(new Set());
  const intervalRef = useRef<number | null>(null);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('浏览器不支持通知功能');
      return false;
    }

    if (Notification.permission === 'granted') {
      setNotificationEnabled(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('通知权限已被拒绝，请在浏览器设置中开启');
      setNotificationEnabled(false);
      return false;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setNotificationEnabled(granted);
    return granted;
  }, []);

  const showNotification = useCallback((habit: Habit) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notificationKey = `${habit.id}-${new Date().toDateString()}`;
    if (notifiedHabitsRef.current.has(notificationKey)) {
      return;
    }

    const notification = new Notification(`⏰ 习惯提醒：${habit.name}`, {
      body: `点击通知立即完成「${habit.name}」打卡！`,
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_ICON,
      tag: `habit-${habit.id}`,
      requireInteraction: true,
      silent: false,
    });

    notifiedHabitsRef.current.add(notificationKey);

    notification.onclick = async () => {
      notification.close();
      window.focus();

      if (checkinInProgressRef.current.has(habit.id)) {
        return;
      }

      checkinInProgressRef.current.add(habit.id);

      try {
        const today = getLocalDateString();
        const response = await checkin(habit.id, today);
        if (response.success && response.data) {
          setHabits((prev) =>
            prev.map((h) =>
              h.id === habit.id ? { ...h, isCheckedToday: true } : h
            )
          );
        }
      } finally {
        checkinInProgressRef.current.delete(habit.id);
      }
    };
  }, []);

  const checkReminders = useCallback(() => {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;

    const today = getLocalDateString();

    habits.forEach((habit) => {
      if (!habit.reminderEnabled || !habit.reminderTime) {
        return;
      }

      if (habit.isCheckedToday) {
        return;
      }

      if (habit.reminderTime !== currentTime) {
        return;
      }

      const notificationKey = `${habit.id}-${today}`;
      if (notifiedHabitsRef.current.has(notificationKey)) {
        return;
      }

      showNotification(habit);
    });
  }, [habits, showNotification]);

  const refreshHabits = useCallback(async () => {
    try {
      const response = await getHabits();
      if (response.success && response.data) {
        setHabits(response.data);
      }
    } catch {}
  }, []);

  const markHabitChecked = useCallback((habitId: number) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId ? { ...h, isCheckedToday: true } : h
      )
    );
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationEnabled(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    if (habits.length === 0) {
      return;
    }

    const hasEnabledReminders = habits.some((h) => h.reminderEnabled);
    if (!hasEnabledReminders) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (notificationEnabled) {
      checkReminders();
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(checkReminders, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [habits, notificationEnabled, checkReminders]);

  useEffect(() => {
    const handleDateChange = () => {
      notifiedHabitsRef.current.clear();
    };

    const checkDate = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        handleDateChange();
      }
    };

    const dateInterval = setInterval(checkDate, 60000);

    return () => {
      clearInterval(dateInterval);
    };
  }, []);

  return (
    <ReminderContext.Provider
      value={{
        habits,
        setHabits,
        refreshHabits,
        requestNotificationPermission,
        notificationEnabled,
        markHabitChecked,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminderContext() {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminderContext must be used within a ReminderProvider');
  }
  return context;
}

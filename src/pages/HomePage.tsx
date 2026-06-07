import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Check, Flame, Loader2, PartyPopper, Bell } from 'lucide-react';
import { getHabits } from '@/api/habits';
import { checkin } from '@/api/checkins';
import { getUserStats } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import { cn, getLocalDateString } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import CheckinCalendar from '@/components/CheckinCalendar';
import { useReminderContext } from '@/context/ReminderContext';
import type { Habit } from '@shared/types';

interface Confetti {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}

export default function HomePage() {
  const { user, updateUser } = useAuthStore();
  const {
    habits,
    setHabits,
    requestNotificationPermission,
    notificationEnabled,
  } = useReminderContext();

  const [loading, setLoading] = useState(false);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [successHabitId, setSuccessHabitId] = useState<number | null>(null);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const notificationCheckRef = useRef<HTMLButtonElement>(null);

  const handleEnableNotification = async () => {
    await requestNotificationPermission();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const today = getLocalDateString();

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHabits();
      if (response.success && response.data) {
        setHabits(response.data);
      } else {
        setError(response.message || '获取习惯列表失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [setHabits]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const triggerConfetti = (clientX: number, clientY: number) => {
    const colors = ['#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6', '#22c55e', '#eab308'];
    const newConfetti: Confetti[] = [];

    for (let i = 0; i < 20; i++) {
      newConfetti.push({
        id: Date.now() + i,
        x: clientX + (Math.random() - 0.5) * 200,
        y: clientY + (Math.random() - 0.5) * 200,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
      });
    }

    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 1000);
  };

  const handleCheckin = async (habit: Habit, e: React.MouseEvent) => {
    if (habit.isCheckedToday || checkingInId !== null) return;

    setCheckingInId(habit.id);
    setError(null);

    try {
      const response = await checkin(habit.id, today);
      if (response.success && response.data) {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id ? { ...h, isCheckedToday: true } : h
          )
        );

        setSuccessHabitId(habit.id);
        setTimeout(() => setSuccessHabitId(null), 600);

        const statsRes = await getUserStats();
        if (statsRes.success && statsRes.data) {
          updateUser({
            totalCheckins: statsRes.data.totalCheckins,
            streakDays: statsRes.data.streakDays,
          });
        }

        setCalendarRefreshKey((prev) => prev + 1);
        triggerConfetti(e.clientX, e.clientY);
      } else {
        setError(response.message || '打卡失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setCheckingInId(null);
    }
  };

  const completedToday = habits.filter((h) => h.isCheckedToday).length;
  const totalHabits = habits.length;
  const progress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

  return (
    <div className="space-y-6 relative">
      {confetti.map((c) => (
        <div
          key={c.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: c.x,
            top: c.y,
            animation: `confetti 1s ease-out forwards`,
            animationDelay: `${c.delay}s`,
          }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: c.color }}
          />
        </div>
      ))}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {getGreeting()}，{user?.username || '朋友'} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            今天是坚持的第 {user?.streakDays || 0} 天，继续加油！
          </p>
        </div>
        <div className="flex gap-2">
          {!notificationEnabled && (
            <Button
              ref={notificationCheckRef}
              variant="outline"
              onClick={handleEnableNotification}
              className="gap-2"
            >
              <Bell className="w-5 h-5" />
              开启通知
            </Button>
          )}
          <Button className="gap-2">
            <Plus className="w-5 h-5" />
            添加习惯
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-8 h-8 text-yellow-300 animate-pulse" />
                <span className="text-sm font-medium text-orange-100">连续打卡</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold">{user?.streakDays || 0}</span>
                <span className="text-orange-100">天</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-orange-100 mb-2">今日进度</div>
              <div className="w-24 h-24 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-orange-400/30"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    className="text-white"
                    style={{
                      strokeDasharray: 251.2,
                      strokeDashoffset: 251.2 - (251.2 * progress) / 100,
                      transition: 'stroke-dashoffset 0.5s ease-out',
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {completedToday}/{totalHabits}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">今日习惯</h2>
          <span className="text-sm text-gray-500">
            已完成 {completedToday}/{totalHabits}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : habits.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                还没有习惯
              </h3>
              <p className="text-gray-500 mb-4">
                点击上方按钮添加你的第一个习惯吧！
              </p>
              <Button className="gap-2">
                <Plus className="w-5 h-5" />
                添加习惯
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => (
              <Card
                key={habit.id}
                hover
                className={cn(
                  'transition-all duration-300',
                  habit.isCheckedToday && 'bg-green-50 border-green-200',
                  successHabitId === habit.id && 'scale-105 shadow-xl'
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform duration-300"
                      style={{ backgroundColor: habit.color + '20' }}
                    >
                      <span style={{ color: habit.color }}>{habit.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={cn(
                          'font-bold text-lg truncate',
                          habit.isCheckedToday
                            ? 'text-green-700 line-through'
                            : 'text-gray-900'
                        )}
                      >
                        {habit.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {habit.frequency === 'daily' ? '每日' : '每周'}{' '}
                        {habit.targetDays} 天
                      </p>
                      {habit.reminderEnabled && habit.reminderTime && !habit.isCheckedToday && (
                        <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                          🔔 {habit.reminderTime} 提醒
                        </p>
                      )}
                    </div>
                    <Button
                      size="lg"
                      variant={habit.isCheckedToday ? 'secondary' : 'primary'}
                      disabled={habit.isCheckedToday || checkingInId === habit.id}
                      onClick={(e) => handleCheckin(habit, e)}
                      className={cn(
                        'w-14 h-14 p-0 rounded-2xl transition-all duration-300',
                        successHabitId === habit.id && 'animate-bounce',
                        habit.isCheckedToday && 'bg-green-500 text-white hover:bg-green-600 border-green-500'
                      )}
                    >
                      {checkingInId === habit.id ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : habit.isCheckedToday ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <span className="text-xl">✓</span>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">打卡日历</h2>
        <CheckinCalendar
          key={calendarRefreshKey}
          onCheckinChange={fetchHabits}
        />
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(
                ${Math.random() > 0.5 ? '' : '-'}${Math.random() * 100}px,
                ${200 + Math.random() * 200}px
              )
              rotate(${Math.random() * 720 - 360}deg)
              scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}

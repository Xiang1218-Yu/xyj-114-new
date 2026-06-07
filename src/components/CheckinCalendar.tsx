import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, X, Check, Trash2 } from 'lucide-react';
import { getCheckinCalendar, getCheckinsByDate, undoCheckin } from '@/api/checkins';
import { getHabits } from '@/api/habits';
import { getUserStats } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import { cn, getLocalDateString } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Modal from '@/components/Modal';
import type { CheckinCalendarDay, CheckinWithHabit, Habit } from '@shared/types';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const DOT_COLORS = [
  'bg-orange-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-purple-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
];

interface CheckinCalendarProps {
  onCheckinChange?: () => void;
}

export default function CheckinCalendar({ onCheckinChange }: CheckinCalendarProps) {
  const { updateUser } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CheckinCalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateCheckins, setSelectedDateCheckins] = useState<CheckinWithHabit[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [undoingId, setUndoingId] = useState<number | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingUndo, setPendingUndo] = useState<{ habitId: number; habitName: string } | null>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCheckinCalendar(year, month + 1);
      if (response.success && response.data) {
        setCalendarData(response.data);
      } else {
        setError(response.message || '获取日历数据失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const fetchDateDetail = useCallback(async (date: string) => {
    setDetailLoading(true);
    try {
      const response = await getCheckinsByDate(date);
      if (response.success && response.data) {
        setSelectedDateCheckins(response.data);
      } else {
        showToast(response.message || '获取详情失败', 'error');
      }
    } catch {
      showToast('网络错误，请稍后重试', 'error');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleDateClick = (date: string, checkinCount: number) => {
    setSelectedDate(date);
    setDetailModalOpen(true);
    if (checkinCount > 0) {
      fetchDateDetail(date);
    } else {
      setSelectedDateCheckins([]);
    }
  };

  const refreshAllData = useCallback(async () => {
    await fetchCalendarData();
    if (selectedDate) {
      await fetchDateDetail(selectedDate);
    }
    try {
      const statsRes = await getUserStats();
      if (statsRes.success && statsRes.data) {
        updateUser({
          totalCheckins: statsRes.data.totalCheckins,
          streakDays: statsRes.data.streakDays,
        });
      }
    } catch {
      // 忽略统计数据刷新错误
    }
    onCheckinChange?.();
  }, [selectedDate, fetchCalendarData, fetchDateDetail, updateUser, onCheckinChange]);

  const openConfirmModal = (habitId: number, habitName: string) => {
    setPendingUndo({ habitId, habitName });
    setConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setPendingUndo(null);
  };

  const confirmUndoCheckin = async () => {
    if (!selectedDate || !pendingUndo) return;

    setUndoingId(pendingUndo.habitId);
    try {
      const response = await undoCheckin(pendingUndo.habitId, selectedDate);
      if (response.success) {
        showToast(`已取消 "${pendingUndo.habitName}" 的打卡`, 'success');
        await refreshAllData();
        closeConfirmModal();
      } else {
        showToast(response.message || '取消打卡失败', 'error');
      }
    } catch {
      showToast('网络错误，请稍后重试', 'error');
    } finally {
      setUndoingId(null);
    }
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedDate(null);
    setSelectedDateCheckins([]);
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{
      day: number | null;
      date: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      checkinCount: number;
    }> = [];

    const todayStr = getLocalDateString();

    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
      const dateStr = `${prevMonthDay.getFullYear()}-${String(prevMonthDay.getMonth() + 1).padStart(2, '0')}-${String(prevMonthDay.getDate()).padStart(2, '0')}`;
      const checkinDay = calendarData.find((d) => d.date === dateStr);
      days.push({
        day: prevMonthDay.getDate(),
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        checkinCount: checkinDay?.count || 0,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const checkinDay = calendarData.find((d) => d.date === dateStr);
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        checkinCount: checkinDay?.count || 0,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      const dateStr = `${nextMonthDay.getFullYear()}-${String(nextMonthDay.getMonth() + 1).padStart(2, '0')}-${String(nextMonthDay.getDate()).padStart(2, '0')}`;
      const checkinDay = calendarData.find((d) => d.date === dateStr);
      days.push({
        day: nextMonthDay.getDate(),
        date: dateStr,
        isCurrentMonth: false,
        isToday: false,
        checkinCount: checkinDay?.count || 0,
      });
    }

    return days;
  }, [year, month, calendarData]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDotColors = (count: number) => {
    if (count === 0) return [];
    const colors: string[] = [];
    for (let i = 0; i < Math.min(count, 7); i++) {
      colors.push(DOT_COLORS[i % DOT_COLORS.length]);
    }
    return colors;
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchCalendarData} variant="outline">
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevMonth}
            className="p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-bold text-gray-900 min-w-[120px] text-center">
            {year}年 {monthNames[month]}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="p-2"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          今天
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => setHoveredDate(day.date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <div
                  onClick={() =>
                    day.isCurrentMonth && handleDateClick(day.date, day.checkinCount)
                  }
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200 relative',
                    day.isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-300',
                    day.isToday &&
                      'bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold shadow-lg shadow-orange-500/25',
                    day.checkinCount > 0 &&
                      day.isCurrentMonth &&
                      !day.isToday &&
                      'bg-orange-50',
                    day.isCurrentMonth &&
                      !day.isToday &&
                      'hover:bg-gray-100 cursor-pointer active:scale-95'
                  )}
                >
                  <span className="text-sm">{day.day}</span>
                  {day.checkinCount > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {getDotColors(day.checkinCount).map((color, i) => (
                        <div
                          key={i}
                          className={cn('w-1.5 h-1.5 rounded-full', color)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {hoveredDate === day.date && day.checkinCount > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                    打卡 {day.checkinCount} 次 · 点击查看详情
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={detailModalOpen} onClose={closeDetailModal}>
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {selectedDate && formatDateDisplay(selectedDate)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedDateCheckins.length > 0
                ? `已打卡 ${selectedDateCheckins.length} 个习惯`
                : '当天没有打卡记录'}
            </p>
          </div>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : selectedDateCheckins.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {selectedDateCheckins.map((checkin) => (
                <div
                  key={checkin.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${checkin.habitColor}20` }}
                  >
                    {checkin.habitIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {checkin.habitName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatTime(checkin.createdAt)} 打卡
                    </p>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: checkin.habitColor }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      openConfirmModal(checkin.habitId, checkin.habitName)
                    }
                    disabled={undoingId === checkin.habitId}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                  >
                    {undoingId === checkin.habitId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📅</div>
              <p className="text-gray-500">当天没有打卡记录</p>
            </div>
          )}

          {selectedDateCheckins.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                提示：点击右侧删除按钮可以取消当天的打卡记录
              </p>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={confirmModalOpen} onClose={closeConfirmModal}>
        <div className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">确认取消打卡</h3>
            <p className="text-gray-500 mb-6">
              确定要取消习惯 "{pendingUndo?.habitName}" 的打卡记录吗？此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={closeConfirmModal}
                className="flex-1"
                disabled={undoingId !== null}
              >
                取消
              </Button>
              <Button
                variant="danger"
                onClick={confirmUndoCheckin}
                className="flex-1"
                disabled={undoingId !== null}
              >
                {undoingId !== null ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    取消中...
                  </span>
                ) : (
                  '确认取消'
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {toast.show && (
        <div
          className={cn(
            'fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-bottom duration-300',
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          )}
        >
          {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getCheckinCalendar } from '@/api/checkins';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { CheckinCalendarDay } from '@shared/types';

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

export default function CheckinCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CheckinCalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
                      'hover:bg-gray-100 cursor-pointer'
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
                    打卡 {day.checkinCount} 次
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

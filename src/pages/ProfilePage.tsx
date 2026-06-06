import { useState, useEffect } from 'react';
import { Share2, LogOut, Calendar, TrendingUp, Target, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getUserStats } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import ShareModal from '@/components/ShareModal';
import type { UserStats } from '@shared/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const StatIcon = {
  total: Flame,
  streak: TrendingUp,
  habits: Target,
  week: Calendar,
};

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await getUserStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const chartData = stats?.habitStats.map((h) => ({
    name: h.habitName,
    count: h.count,
    completionRate: h.completionRate,
    color: h.color,
    icon: h.icon,
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-8">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">个人中心</h1>

        {user && (
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-400 to-red-400 h-24" />
            <CardContent className="-mt-12">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-300 to-red-400 flex items-center justify-center text-4xl text-white font-bold border-4 border-white shadow-lg">
                  {user.avatar}
                </div>
                <div className="flex-1 pb-2">
                  <h2 className="text-2xl font-bold text-gray-800">{user.username}</h2>
                  <p className="text-gray-500">{user.email}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    注册于 {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: '总打卡天数',
                    value: stats.totalCheckins,
                    icon: StatIcon.total,
                    color: 'from-orange-400 to-red-400',
                    bg: 'bg-orange-50',
                    emoji: '🔥',
                  },
                  {
                    label: '连续打卡',
                    value: stats.streakDays,
                    icon: StatIcon.streak,
                    color: 'from-green-400 to-emerald-500',
                    bg: 'bg-green-50',
                    emoji: '📈',
                  },
                  {
                    label: '习惯数量',
                    value: stats.habitsCount,
                    icon: StatIcon.habits,
                    color: 'from-blue-400 to-indigo-500',
                    bg: 'bg-blue-50',
                    emoji: '🎯',
                  },
                  {
                    label: '本周打卡',
                    value: stats.checkinsThisWeek,
                    icon: StatIcon.week,
                    color: 'from-purple-400 to-pink-500',
                    bg: 'bg-purple-50',
                    emoji: '📅',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.label} className={`${item.bg} border-0`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}
                          >
                            <Icon className="text-white" size={16} />
                          </div>
                          <span className="text-2xl">{item.emoji}</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{item.value}</p>
                        <p className="text-sm text-gray-500">{item.label}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-800">习惯统计</h2>
                </CardHeader>
                <CardContent>
                  {chartData.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      暂无习惯数据，快去创建第一个习惯吧！
                    </div>
                  ) : (
                    <>
                      <div className="h-64 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }}
                              formatter={(value: number, name: string) => [
                                name === 'count' ? `${value} 次` : `${value}%`,
                                name === 'count' ? '打卡次数' : '完成率',
                              ]}
                            />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stats.habitStats.map((habit) => (
                          <div
                            key={habit.habitId}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                              style={{ backgroundColor: `${habit.color}20` }}
                            >
                              {habit.icon}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{habit.habitName}</p>
                              <p className="text-sm text-gray-500">
                                {habit.count} 次 · 完成率 {habit.completionRate}%
                              </p>
                            </div>
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: habit.color }}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setShowShareModal(true)}
                >
                  <Share2 size={20} />
                  分享打卡海报
                </Button>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                  退出登录
                </Button>
              </div>
            </>
          )
        )}
      </div>

      {user && stats && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          data={{
            username: user.username,
            avatar: user.avatar,
            totalCheckins: stats.totalCheckins,
            streakDays: stats.streakDays,
            checkinsThisWeek: stats.checkinsThisWeek,
          }}
        />
      )}
    </div>
  );
}

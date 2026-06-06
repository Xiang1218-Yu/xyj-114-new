import { useState, useEffect } from 'react';
import { Medal, Users, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { getPersonalLeaderboard, getTeamLeaderboard } from '@/api/leaderboard';
import { useAuthStore } from '@/store/authStore';
import type { LeaderboardEntry, TeamLeaderboardEntry } from '@shared/types';
import { cn } from '@/lib/utils';

type TabType = 'personal' | 'team';

const medalColors = {
  1: 'from-yellow-400 to-amber-500',
  2: 'from-gray-300 to-gray-400',
  3: 'from-orange-400 to-orange-500',
};

const medalBgColors = {
  1: 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200',
  2: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200',
  3: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
};

const medalEmojis = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [personalData, setPersonalData] = useState<LeaderboardEntry[]>([]);
  const [teamData, setTeamData] = useState<TeamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'personal') {
        const res = await getPersonalLeaderboard();
        if (res.success && res.data) {
          setPersonalData(res.data);
        }
      } else {
        const res = await getTeamLeaderboard();
        if (res.success && res.data) {
          setTeamData(res.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const topThree = activeTab === 'personal' 
    ? personalData.slice(0, 3) 
    : teamData.slice(0, 3);
  const restList = activeTab === 'personal'
    ? personalData.slice(3, 100)
    : teamData.slice(3, 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-8">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">排行榜</h1>

        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('personal')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300',
              activeTab === 'personal'
                ? 'bg-white text-orange-500 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <User size={20} />
            个人排行
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300',
              activeTab === 'team'
                ? 'bg-white text-orange-500 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Users size={20} />
            队伍排行
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 0, 2].map((index) => {
                const entry = topThree[index];
                if (!entry) return null;
                const rank = index === 1 ? 1 : index === 0 ? 2 : 3;
                const actualRank = entry.rank;
                return (
                  <div
                    key={entry.rank}
                    className={cn(
                      'relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105',
                      medalBgColors[actualRank as 1 | 2 | 3],
                      actualRank === 1 && 'col-start-2 row-start-1'
                    )}
                    style={{
                      marginTop: actualRank === 1 ? '-20px' : '20px' }}
                  >
                    <div className="text-5xl mb-2">{medalEmojis[actualRank - 1]}</div>
                    <div
                      className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg',
                        `bg-gradient-to-br ${medalColors[actualRank as 1 | 2 | 3]}`
                      )}
                    >
                      {activeTab === 'personal'
                        ? (entry as LeaderboardEntry).avatar
                        : (entry as TeamLeaderboardEntry).name.charAt(0)}
                    </div>
                    <h3 className="mt-3 font-bold text-gray-800 text-lg">
                      {activeTab === 'personal'
                        ? (entry as LeaderboardEntry).username
                        : (entry as TeamLeaderboardEntry).name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {activeTab === 'personal'
                        ? `${(entry as LeaderboardEntry).checkinCount} 天`
                        : `${(entry as TeamLeaderboardEntry).totalCheckins} 打卡`}
                    </p>
                    {activeTab === 'team' && (
                      <p className="text-xs text-gray-400">
                      {(entry as TeamLeaderboardEntry).memberCount} 人
                    </p>
                    )}
                  </div>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Medal className="text-orange-500" size={20} />
                  <h2 className="text-lg font-semibold text-gray-800">
                    {activeTab === 'personal' ? '个人排行 4-100' : '队伍排行 4-100'}
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {restList.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">暂无更多数据</div>
                  ) : (
                    restList.map((entry) => {
                      const isCurrentUser = activeTab === 'personal' &&
                        user &&
                        (entry as LeaderboardEntry).userId === user.id;
                      return (
                        <div
                          key={entry.rank}
                          className={cn(
                            'flex items-center gap-4 p-4 rounded-xl transition-all duration-200',
                            isCurrentUser
                              ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200'
                              : 'hover:bg-gray-50'
                          )}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                              entry.rank <= 10
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-gray-100 text-gray-500'
                            )}
                          >
                            {entry.rank}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-semibold">
                            {activeTab === 'personal'
                              ? (entry as LeaderboardEntry).avatar
                              : (entry as TeamLeaderboardEntry).name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              'font-semibold',
                              isCurrentUser ? 'text-orange-600' : 'text-gray-800'
                            )}>
                              {activeTab === 'personal'
                                ? (entry as LeaderboardEntry).username
                                : (entry as TeamLeaderboardEntry).name}
                            </p>
                            {activeTab === 'team' && (
                              <p className="text-xs text-gray-400">
                              {(entry as TeamLeaderboardEntry).memberCount} 名成员
                            </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">
                              {activeTab === 'personal'
                                ? `${(entry as LeaderboardEntry).checkinCount} 天`
                                : `${(entry as TeamLeaderboardEntry).totalCheckins} 次`}
                            </p>
                            <p className="text-xs text-gray-400">
                              {activeTab === 'personal' ? '打卡天数' : '总打卡'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

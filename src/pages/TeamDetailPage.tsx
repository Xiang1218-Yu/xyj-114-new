import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Calendar, Users, Trophy, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getTeamDetail, getTeamMembers } from '@/api/teams';
import type { Team, TeamMember } from '@shared/types';
import { cn } from '@/lib/utils';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const fetchTeamData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const teamId = parseInt(id);

      const [teamResponse, membersResponse] = await Promise.all([
        getTeamDetail(teamId),
        getTeamMembers(teamId),
      ]);

      if (teamResponse.success && teamResponse.data) {
        setTeam(teamResponse.data);
      }

      if (membersResponse.success && membersResponse.data) {
        const sortedMembers = [...membersResponse.data].sort(
          (a, b) => (b.user.totalCheckins || 0) - (a.user.totalCheckins || 0)
        );
        setMembers(sortedMembers);
      }
    } catch (error) {
      showToast('获取队伍信息失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [id]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const copyInviteCode = async () => {
    if (!team) return;

    try {
      await navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
      showToast('邀请码已复制', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('复制失败', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center">{index + 1}</span>;
  };

  const getAvatarGradient = (userId: number) => {
    const gradients = [
      'from-pink-400 to-rose-500',
      'from-blue-400 to-indigo-500',
      'from-green-400 to-emerald-500',
      'from-yellow-400 to-orange-500',
      'from-purple-400 to-violet-500',
      'from-cyan-400 to-teal-500',
    ];
    return gradients[userId % gradients.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-32 mb-8" />
            <div className="bg-white rounded-2xl p-6 mb-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-6" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-20 bg-gray-200 rounded-xl" />
                <div className="h-20 bg-gray-200 rounded-xl" />
                <div className="h-20 bg-gray-200 rounded-xl" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-6" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="text-center py-16 max-w-md mx-auto">
          <div className="text-6xl mb-4">❓</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">队伍不存在</h3>
          <p className="text-gray-500 mb-6">找不到该队伍，请检查链接是否正确</p>
          <Button onClick={() => navigate('/teams')} className="flex items-center gap-2 mx-auto">
            <ArrowLeft size={18} />
            返回队伍列表
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/teams')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          返回队伍列表
        </button>

        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-32" />
          <CardContent className="pt-0 -mt-16">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{team.name}</h1>
                  <p className="text-gray-500">{team.description || '暂无描述'}</p>
                </div>
                <Button
                  onClick={copyInviteCode}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-purple-500/25"
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      已复制
                    </>
                  ) : (
                    <>
                      <Share2 size={18} />
                      分享邀请码
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                    <Users size={14} />
                    成员数
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {team.memberCount}
                    <span className="text-sm font-normal text-blue-500 ml-1">人</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
                    <Trophy size={14} />
                    总打卡
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    {team.totalCheckins}
                    <span className="text-sm font-normal text-purple-500 ml-1">次</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-pink-600 text-sm mb-1">
                    <Calendar size={14} />
                    创建时间
                  </div>
                  <div className="text-sm font-semibold text-pink-700 mt-1">
                    {formatDate(team.createdAt)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-600 text-sm mb-1">
                    <Copy size={14} />
                    邀请码
                  </div>
                  <div className="font-mono font-bold text-lg text-amber-700 tracking-wider">
                    {team.inviteCode}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">分享邀请码给好友</div>
                    <div className="text-xs text-gray-400">好友使用邀请码加入后即可一起打卡</div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={copyInviteCode}
                    className="flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        复制邀请码
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">成员排行榜</h2>
              <span className="text-sm text-gray-500">按打卡天数排序</span>
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无成员</h3>
                <p className="text-gray-500">分享邀请码，邀请好友加入队伍吧</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member, index) => (
                  <div
                    key={member.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl transition-all duration-300',
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200'
                        : index === 1
                        ? 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      {getRankBadge(index)}
                    </div>

                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br shadow-md',
                        getAvatarGradient(member.userId)
                      )}
                    >
                      {member.user.avatar || member.user.username.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">
                        {member.user.username}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={12} />
                        加入于 {formatDate(member.joinedAt)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {member.user.totalCheckins || 0}
                        <span className="text-sm font-normal text-gray-500 ml-1">天</span>
                      </div>
                      <div className="text-xs text-gray-400">累计打卡</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-800">队伍打卡统计</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="text-2xl font-bold text-green-700">
                    {Math.floor(team.totalCheckins / Math.max(team.memberCount, 1))}
                  </div>
                  <div className="text-sm text-green-600">人均打卡</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-blue-700">{team.totalCheckins}</div>
                  <div className="text-sm text-blue-600">总打卡次数</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-2xl font-bold text-purple-700">{team.memberCount}</div>
                  <div className="text-sm text-purple-600">活跃成员</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {members.length > 0 ? members[0].user.totalCheckins || 0 : 0}
                  </div>
                  <div className="text-sm text-orange-600">最高打卡</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {toast.show && (
        <div
          className={cn(
            'fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-bottom duration-300',
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          )}
        >
          {toast.type === 'success' ? <Check size={18} /> : <ArrowLeft size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

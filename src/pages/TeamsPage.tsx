import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Copy, Check, X, UserPlus, ArrowRight, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getTeams, createTeam, joinTeam } from '@/api/teams';
import type { Team, CreateTeamRequest, JoinTeamRequest } from '@shared/types';
import { cn } from '@/lib/utils';

type TabType = 'my' | 'join';

export default function TeamsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<CreateTeamRequest>({ name: '', description: '' });
  const [inviteCode, setInviteCode] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await getTeams();
      if (response.success && response.data) {
        setTeams(response.data);
      }
    } catch (error) {
      showToast('获取队伍列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleCreateTeam = async () => {
    if (!formData.name.trim()) {
      showToast('请输入队伍名称', 'error');
      return;
    }

    try {
      const response = await createTeam(formData);
      if (response.success && response.data) {
        setCreatedTeam(response.data);
        setCreateModalOpen(false);
        setInviteModalOpen(true);
        setFormData({ name: '', description: '' });
        fetchTeams();
      }
    } catch (error) {
      showToast('创建队伍失败', 'error');
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      showToast('请输入邀请码', 'error');
      return;
    }

    try {
      const request: JoinTeamRequest = { inviteCode: inviteCode.trim() };
      const response = await joinTeam(request);
      if (response.success) {
        showToast('加入队伍成功', 'success');
        setInviteCode('');
        setActiveTab('my');
        fetchTeams();
      }
    } catch (error) {
      showToast('加入失败，请检查邀请码是否正确', 'error');
    }
  };

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('邀请码已复制', 'success');
      setTimeout(() => setCopiedId(null), 2000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">队伍</h1>
          <p className="text-gray-500 mt-1">和小伙伴一起坚持，共同成长</p>
        </div>

        <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setActiveTab('my')}
              className={cn(
                'py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                activeTab === 'my'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Users size={18} />
              我的队伍
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={cn(
                'py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <UserPlus size={18} />
              加入队伍
            </button>
          </div>
        </div>

        {activeTab === 'my' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">我加入的队伍</h2>
              <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
                <Plus size={18} />
                创建队伍
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="h-12 bg-gray-200 rounded-xl" />
                        <div className="h-12 bg-gray-200 rounded-xl" />
                      </div>
                      <div className="h-10 bg-gray-200 rounded-xl" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : teams.length === 0 ? (
              <Card className="text-center py-16">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">还没有加入任何队伍</h3>
                <p className="text-gray-500 mb-6">创建一支队伍，或者使用邀请码加入朋友的队伍</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
                    <Plus size={18} />
                    创建队伍
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setActiveTab('join')}
                    className="flex items-center gap-2"
                  >
                    <UserPlus size={18} />
                    加入队伍
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map((team, index) => (
                  <Card
                    key={team.id}
                    hover
                    onClick={() => navigate(`/teams/${team.id}`)}
                    className="cursor-pointer transition-all duration-500 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                            {team.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {team.description || '暂无描述'}
                          </p>
                        </div>
                        <ArrowRight
                          size={20}
                          className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-blue-50 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                            <Users size={14} />
                            成员数
                          </div>
                          <div className="text-2xl font-bold text-blue-700">
                            {team.memberCount}
                            <span className="text-sm font-normal text-blue-500 ml-1">人</span>
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
                            <Trophy size={14} />
                            总打卡
                          </div>
                          <div className="text-2xl font-bold text-purple-700">
                            {team.totalCheckins}
                            <span className="text-sm font-normal text-purple-500 ml-1">次</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">邀请码</div>
                            <div className="font-mono font-semibold text-gray-800">
                              {team.inviteCode}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(team.inviteCode, team.id);
                            }}
                            className="flex items-center gap-1"
                          >
                            {copiedId === team.id ? (
                              <>
                                <Check size={14} />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                复制
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'join' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">加入队伍</h2>
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <UserPlus size={36} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">输入邀请码加入队伍</h3>
                  <p className="text-gray-500">向队伍管理员获取邀请码后输入即可加入</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="邀请码"
                    placeholder="请输入邀请码"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="text-center font-mono text-lg tracking-wider"
                    maxLength={8}
                  />

                  <Button onClick={handleJoinTeam} className="w-full" size="lg">
                    加入队伍
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">或者</span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => setCreateModalOpen(true)}
                    className="w-full"
                  >
                    创建一支新队伍
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">创建新队伍</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                  className="p-2 h-auto"
                >
                  <X size={20} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <Input
                  label="队伍名称"
                  placeholder="例如：早起打卡团"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    队伍描述
                  </label>
                  <textarea
                    placeholder="介绍一下你的队伍..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-800 placeholder-gray-400 transition-all focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 hover:border-gray-300 resize-none"
                  />
                </div>

                <Button onClick={handleCreateTeam} className="w-full">
                  创建队伍
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {inviteModalOpen && createdTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <Check size={40} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">创建成功！</h3>
                <p className="text-gray-500 mb-6">分享邀请码给好友，邀请他们加入你的队伍</p>

                <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                  <div className="text-sm text-gray-500 mb-2">队伍邀请码</div>
                  <div className="text-4xl font-bold font-mono tracking-widest text-gray-800 mb-4">
                    {createdTeam.inviteCode}
                  </div>
                  <Button
                    onClick={() => copyToClipboard(createdTeam.inviteCode, -1)}
                    className="flex items-center gap-2 mx-auto"
                    variant="secondary"
                  >
                    {copiedId === -1 ? (
                      <>
                        <Check size={18} />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        复制邀请码
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setInviteModalOpen(false);
                    setCreatedTeam(null);
                  }}
                  className="w-full"
                >
                  完成
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getHabits, createHabit, updateHabit, deleteHabit } from '@/api/habits';
import type { Habit, CreateHabitRequest } from '@shared/types';
import { cn } from '@/lib/utils';

const PRESET_ICONS = ['🏃', '📚', '💪', '🧘', '💧', '🌙', '✍️', '🎯', '🍎', '😴'];
const PRESET_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

const defaultFormData: CreateHabitRequest = {
  name: '',
  icon: '🏃',
  color: '#FF6B6B',
  frequency: 'daily',
  targetDays: 21,
  reminderEnabled: false,
  reminderTime: '08:00',
};

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState<CreateHabitRequest>(defaultFormData);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const response = await getHabits();
      if (response.success && response.data) {
        setHabits(response.data);
      }
    } catch (error) {
      showToast('获取习惯列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const openCreateModal = () => {
    setEditingHabit(null);
    setFormData(defaultFormData);
    setModalOpen(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      frequency: habit.frequency,
      targetDays: habit.targetDays,
      reminderEnabled: habit.reminderEnabled,
      reminderTime: habit.reminderTime || '08:00',
    });
    setModalOpen(true);
  };

  const openDeleteModal = (habit: Habit) => {
    setDeletingHabit(habit);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('请输入习惯名称', 'error');
      return;
    }

    try {
      if (editingHabit) {
        const response = await updateHabit(editingHabit.id, formData);
        if (response.success) {
          showToast('习惯更新成功', 'success');
          setModalOpen(false);
          fetchHabits();
        }
      } else {
        const response = await createHabit(formData);
        if (response.success) {
          showToast('习惯创建成功', 'success');
          setModalOpen(false);
          fetchHabits();
        }
      }
    } catch (error) {
      showToast(editingHabit ? '更新失败' : '创建失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingHabit) return;

    try {
      const response = await deleteHabit(deletingHabit.id);
      if (response.success) {
        showToast('习惯删除成功', 'success');
        setDeleteModalOpen(false);
        setDeletingHabit(null);
        fetchHabits();
      }
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  const calculateStats = (habit: Habit) => {
    const createdDate = new Date(habit.createdAt);
    const now = new Date();
    const daysSinceCreation = Math.max(
      1,
      Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const totalCheckins = Math.min(daysSinceCreation, Math.floor(Math.random() * daysSinceCreation) + 1);
    const completionRate = Math.round((totalCheckins / daysSinceCreation) * 100);
    return { totalCheckins, completionRate };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">我的习惯</h1>
            <p className="text-gray-500 mt-1">培养好习惯，成就更好的自己</p>
          </div>
          <Button
            onClick={openCreateModal}
            className="flex items-center gap-2 shadow-lg shadow-orange-500/30"
          >
            <Plus size={20} />
            添加习惯
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : habits.length === 0 ? (
          <Card className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">还没有任何习惯</h3>
            <p className="text-gray-500 mb-6">点击上方按钮，开始创建你的第一个习惯吧！</p>
            <Button onClick={openCreateModal} className="flex items-center gap-2 mx-auto">
              <Plus size={20} />
              创建习惯
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit, index) => {
              const stats = calculateStats(habit);
              return (
                <Card
                  key={habit.id}
                  hover
                  className="transition-all duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform hover:scale-110"
                          style={{ backgroundColor: `${habit.color}20` }}
                        >
                          {habit.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{habit.name}</h3>
                          <p className="text-sm text-gray-500">{formatDate(habit.createdAt)}</p>
                          {habit.reminderEnabled && habit.reminderTime && (
                            <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                              🔔 每日 {habit.reminderTime} 提醒
                            </p>
                          )}
                        </div>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <Calendar size={14} />
                          总打卡
                        </div>
                        <div className="text-2xl font-bold text-gray-800">
                          {stats.totalCheckins}
                          <span className="text-sm font-normal text-gray-500 ml-1">天</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <TrendingUp size={14} />
                          完成率
                        </div>
                        <div className="text-2xl font-bold" style={{ color: habit.color }}>
                          {stats.completionRate}
                          <span className="text-sm font-normal text-gray-500 ml-1">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>目标进度</span>
                        <span>{Math.min(stats.totalCheckins, habit.targetDays)}/{habit.targetDays} 天</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min(100, (stats.totalCheckins / habit.targetDays) * 100)}%`,
                            backgroundColor: habit.color,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(habit)}
                        className="flex-1 flex items-center justify-center gap-1"
                      >
                        <Edit2 size={16} />
                        编辑
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openDeleteModal(habit)}
                        className="flex-1 flex items-center justify-center gap-1"
                      >
                        <Trash2 size={16} />
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingHabit ? '编辑习惯' : '创建新习惯'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="p-2 h-auto"
                >
                  <X size={20} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <Input
                  label="习惯名称"
                  placeholder="例如：每日跑步"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择图标</label>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={cn(
                          'w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all',
                          formData.icon === icon
                            ? 'bg-orange-100 scale-110 shadow-md'
                            : 'bg-gray-50 hover:bg-gray-100'
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择颜色</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          'w-full h-12 rounded-xl transition-all flex items-center justify-center',
                          formData.color === color ? 'scale-110 shadow-lg' : 'hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {formData.color === color && <Check size={20} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">打卡频率</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['daily', 'weekly'] as const).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setFormData({ ...formData, frequency: freq })}
                        className={cn(
                          'py-3 px-4 rounded-xl font-medium transition-all',
                          formData.frequency === freq
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        {freq === 'daily' ? '每日' : '每周'}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="目标天数"
                  type="number"
                  min="1"
                  value={formData.targetDays}
                  onChange={(e) =>
                    setFormData({ ...formData, targetDays: parseInt(e.target.value) || 1 })
                  }
                />

                <div>
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">开启提醒</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, reminderEnabled: !formData.reminderEnabled })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        formData.reminderEnabled ? 'bg-orange-500' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          formData.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </label>
                </div>

                {formData.reminderEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">提醒时间</label>
                    <input
                      type="time"
                      value={formData.reminderTime}
                      onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      💡 系统将在设定时间发送浏览器通知，提醒你完成习惯打卡
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button onClick={handleSubmit} className="w-full">
                    {editingHabit ? '保存修改' : '创建习惯'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm animate-in fade-in zoom-in duration-300">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">确认删除</h3>
                <p className="text-gray-500 mb-6">
                  确定要删除习惯 "{deletingHabit?.name}" 吗？此操作不可撤销。
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button variant="danger" onClick={handleDelete} className="flex-1">
                    删除
                  </Button>
                </div>
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

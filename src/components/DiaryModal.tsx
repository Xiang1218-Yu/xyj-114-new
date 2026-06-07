import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/Modal';
import { cn } from '@/lib/utils';
import type { Habit } from '@shared/types';

const MOOD_EMOJIS = [
  { emoji: '😊', label: '开心' },
  { emoji: '😌', label: '平静' },
  { emoji: '🥳', label: '兴奋' },
  { emoji: '😤', label: '生气' },
  { emoji: '😢', label: '难过' },
  { emoji: '😴', label: '疲惫' },
  { emoji: '🤔', label: '思考' },
  { emoji: '💪', label: '坚持' },
];

interface DiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mood: string, notes: string) => void;
  habit?: Habit;
  initialMood?: string;
  initialNotes?: string;
  isLoading?: boolean;
}

export default function DiaryModal({
  isOpen,
  onClose,
  onSave,
  habit,
  initialMood = '',
  initialNotes = '',
  isLoading = false,
}: DiaryModalProps) {
  const [selectedMood, setSelectedMood] = useState(initialMood);
  const [notes, setNotes] = useState(initialNotes);

  const handleSave = () => {
    onSave(selectedMood, notes);
  };

  const handleClose = () => {
    setSelectedMood(initialMood);
    setNotes(initialNotes);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} closeOnOverlayClick={false}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {habit ? '打卡日记' : '编辑日记'}
            </h3>
            {habit && (
              <p className="text-sm text-gray-500 mt-1">
                记录一下完成「{habit.name}」的心情
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              今天的心情怎么样？
            </label>
            <div className="grid grid-cols-4 gap-3">
              {MOOD_EMOJIS.map((mood) => (
                <button
                  key={mood.emoji}
                  type="button"
                  onClick={() => setSelectedMood(mood.emoji)}
                  className={cn(
                    'flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200',
                    selectedMood === mood.emoji
                      ? 'bg-orange-100 scale-110 shadow-lg ring-2 ring-orange-400'
                      : 'bg-gray-50 hover:bg-gray-100 hover:scale-105'
                  )}
                >
                  <span className="text-3xl mb-1">{mood.emoji}</span>
                  <span className="text-xs text-gray-600">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              写点什么吧（选填）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录一下今天的感受、收获或者想要说的话..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 hover:border-gray-300 resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-2 text-right">
              {notes.length}/500
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              跳过
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Check size={18} />
                  保存日记
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

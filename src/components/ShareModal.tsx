import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import Modal from './Modal';
import { Button } from '@/components/ui/Button';

interface ShareData {
  username: string;
  avatar: string;
  totalCheckins: number;
  streakDays: number;
  checkinsThisWeek: number;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareData;
}

export default function ShareModal({ isOpen, onClose, data }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/share?user=${data.username}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveImage = () => {
    alert('图片保存功能开发中...');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">分享我的打卡</h3>

        <div className="relative overflow-hidden rounded-3xl mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-red-400 to-pink-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.3)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />

          <div className="relative p-6 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-2 border-white/40">
                {data.avatar}
              </div>
              <div>
                <p className="text-xl font-bold">{data.username}</p>
                <p className="text-white/80 text-sm">习惯打卡 · 坚持热爱</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold">{data.totalCheckins}</p>
                <p className="text-xs text-white/80">总打卡天数</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold">{data.streakDays}</p>
                <p className="text-xs text-white/80">连续打卡</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold">{data.checkinsThisWeek}</p>
                <p className="text-xs text-white/80">本周打卡</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold mb-1">扫码一起打卡</p>
                  <p className="text-xs text-white/70">加入习惯养成计划</p>
                </div>
                <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                    二维码
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            className="flex items-center justify-center gap-2"
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <Check size={18} className="text-green-500" />
                已复制
              </>
            ) : (
              <>
                <Copy size={18} />
                复制链接
              </>
            )}
          </Button>
          <Button
            variant="primary"
            className="flex items-center justify-center gap-2"
            onClick={handleSaveImage}
          >
            <Download size={18} />
            保存图片
          </Button>
        </div>
      </div>
    </Modal>
  );
}

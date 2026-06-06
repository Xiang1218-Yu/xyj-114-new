import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ConfettiProps {
  active: boolean;
  duration?: number;
  pieceCount?: number;
  className?: string;
}

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  xOffset: number;
}

const colors = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#95E1D3',
  '#F38181',
  '#AA96DA',
  '#FCBAD3',
  '#A8D8EA',
  '#FF9F43',
  '#6C5CE7',
];

export default function Confetti({
  active,
  duration = 3000,
  pieceCount = 50,
  className,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (active) {
      const newPieces: Piece[] = [];
      for (let i = 0; i < pieceCount; i++) {
        newPieces.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 10,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 720,
          xOffset: (Math.random() - 0.5) * 200,
        });
      }
      setPieces(newPieces);
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, pieceCount]);

  if (!isAnimating && pieces.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 pointer-events-none overflow-hidden z-50',
        className
      )}
    >
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100px) rotate(var(--rotation));
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 100px)) translateX(var(--x-offset)) rotate(calc(var(--rotation) + var(--rotation-speed)));
            opacity: 0;
          }
        }
      `}</style>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0"
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-fall ${piece.duration}s ease-in forwards`,
            animationDelay: `${piece.delay}s`,
            '--rotation': `${piece.rotation}deg`,
            '--rotation-speed': `${piece.rotationSpeed}deg`,
            '--x-offset': `${piece.xOffset}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

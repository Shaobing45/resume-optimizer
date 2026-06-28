'use client';
import { useRef, useCallback } from 'react';

export default function TiltCard({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    ref.current.style.transition = 'transform 0.08s ease-out';
  }, []);

  const onLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
    ref.current.style.transition = 'transform 0.4s ease-out';
  }, []);

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`will-change-transform ${className}`} style={style}>
      {children}
    </div>
  );
}

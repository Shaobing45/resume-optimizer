'use client';
import { useRef, useEffect } from 'react';

export default function MagneticButton({ children, href, className = '' }: { children: React.ReactNode; href: string; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - r.left - r.width / 2;
      const dy = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${dx * 0.2}px, ${dy * 0.2}px)`;
    };
    const onLeave = () => { el.style.transform = 'translate(0,0)'; el.style.transition = 'transform 0.3s ease-out'; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  return (
    <a ref={ref} href={href} className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 ${className}`}>
      {children}
    </a>
  );
}

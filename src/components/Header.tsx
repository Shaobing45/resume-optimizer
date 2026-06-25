'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DarkModeToggle from './DarkModeToggle';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-gray-200/80 bg-white/90 shadow-sm' : 'border-b border-transparent bg-white/80'} backdrop-blur-md`}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-gray-900"
        >
          <img src="/logo.svg" alt="简小优" className="h-9 w-auto" />
          <span className="hidden sm:inline text-lg">简小优</span>
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            首页
          </Link>
          <Link href="/upload" className="hover:text-gray-900 transition-colors">
            开始优化
          </Link>
          <Link
            href="/upload"
            className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 transition-colors"
          >
            免费试用
          </Link>
        </nav>

        {/* 暗黑模式 + 移动端菜单按钮 */}
        <div className="flex items-center gap-1">
          <DarkModeToggle />
          <button
          className="rounded-lg p-2.5 text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="菜单"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      </div>

      {/* 移动端菜单 */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'max-h-40 border-t border-gray-100' : 'max-h-0'
        }`}
      >
        <nav className="flex flex-col gap-3 bg-white px-4 py-3 text-sm font-medium text-gray-600">
          <Link href="/" onClick={() => setMobileOpen(false)} className="hover:text-gray-900 transition-colors">首页</Link>
          <Link href="/upload" onClick={() => setMobileOpen(false)} className="hover:text-gray-900 transition-colors">开始优化</Link>
        </nav>
      </div>
    </header>
  );
}

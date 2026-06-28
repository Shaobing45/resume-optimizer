'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function FreePage() {
  const router = useRouter();
  const ref = useSearchParams().get('ref') || '';
  const [info, setInfo] = useState('');
  const [targetPos, setTargetPos] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async () => {
    if (!info.trim()) return setError('请填写你的信息');
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/referral', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: ref, info: info.trim(), targetPosition: targetPos || undefined }),
      });
      const d = await res.json();
      if (!d.success) return setError(d.error || '领取失败');
      router.push(`/result/${d.data.id}?tier=free`);
    } catch { setError('网络错误'); }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24 text-center animate-fade-in-up">
      <div className="rounded-2xl border border-green-200 bg-gradient-to-b from-green-50 to-white p-6 sm:p-8 shadow-sm">
        <p className="text-3xl">🎁</p>
        <h1 className="mt-3 text-xl font-bold text-green-700">免费简历优化</h1>
        <p className="mt-1 text-sm text-gray-500">朋友送你的免费体验，直接写一段经历，AI 帮你生成简历</p>

        <div className="mt-6 space-y-3 text-left">
          <input
            value={targetPos} onChange={(e) => setTargetPos(e.target.value)}
            placeholder="目标职位（选填）"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
          <textarea
            rows={6} value={info} onChange={(e) => setInfo(e.target.value)}
            placeholder="把你的工作经历、教育背景、技能随便写下来…"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 resize-y"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button onClick={handleClaim} disabled={loading}
          className="mt-4 w-full rounded-xl bg-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-green-700 disabled:opacity-50 transition-all">
          {loading ? '⏳ 处理中…' : '🎯 免费生成简历'}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          朋友分享给你的 · 完全免费，无需付费
        </p>
      </div>
    </div>
  );
}

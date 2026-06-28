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
    if (!info.trim()) return setError('璇峰～鍐欎綘鐨勪俊鎭?);
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/referral', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: ref, info: info.trim(), targetPosition: targetPos || undefined }),
      });
      const d = await res.json();
      if (!d.success) return setError(d.error || '棰嗗彇澶辫触');
      router.push(`/result/${d.data.id}?tier=free`);
    } catch { setError('缃戠粶閿欒'); }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24 text-center animate-fade-in-up">
      <div className="rounded-2xl border border-green-200 bg-gradient-to-b from-green-50 to-white p-6 sm:p-8 shadow-sm">
        <p className="text-3xl">馃巵</p>
        <h1 className="mt-3 text-xl font-bold text-green-700">鍏嶈垂绠€鍘嗕紭鍖?/h1>
        <p className="mt-1 text-sm text-gray-500">鏈嬪弸閫佷綘鐨勫厤璐逛綋楠岋紝鐩存帴鍐欎竴娈电粡鍘嗭紝AI 甯綘鐢熸垚绠€鍘?/p>

        <div className="mt-6 space-y-3 text-left">
          <input
            value={targetPos} onChange={(e) => setTargetPos(e.target.value)}
            placeholder="鐩爣鑱屼綅锛堥€夊～锛?
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
          <textarea
            rows={6} value={info} onChange={(e) => setInfo(e.target.value)}
            placeholder="鎶婁綘鐨勫伐浣滅粡鍘嗐€佹暀鑲茶儗鏅€佹妧鑳介殢渚垮啓涓嬫潵鈥?
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 resize-y"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button onClick={handleClaim} disabled={loading}
          className="mt-4 w-full rounded-xl bg-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-green-700 disabled:opacity-50 transition-all">
          {loading ? '鈴?澶勭悊涓€? : '馃幆 鍏嶈垂鐢熸垚绠€鍘?}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          鏈嬪弸鍒嗕韩缁欎綘鐨?路 瀹屽叏鍏嶈垂锛屾棤闇€浠樿垂
        </p>
      </div>
    </div>
  );
}

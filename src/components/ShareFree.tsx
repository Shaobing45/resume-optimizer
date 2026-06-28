'use client';
import { useState } from 'react';

export default function ShareFree({ resumeId }: { resumeId: string }) {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');

  const generate = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      });
      const d = await r.json();
      if (d.success) setLink(d.data.url);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="mt-6 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
      <p className="text-sm font-semibold text-blue-800">🎁 分享免费体验</p>
      <p className="mt-1 text-xs text-blue-600">分享给朋友，TA 可以免费优化一次简历</p>

      {!link ? (
        <button onClick={generate} disabled={loading}
          className="mt-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:shadow-md disabled:opacity-50 transition-all">
          {loading ? '生成中…' : '🔗 生成分享链接'}
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input readOnly value={link} onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-xs text-blue-800 select-all" />
            <button onClick={() => navigator.clipboard?.writeText(link).then(() => alert('复制成功！')).catch(() => {})}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">
              复制
            </button>
          </div>
          <p className="text-[10px] text-blue-400">朋友点开链接就能免费使用，不花你的钱</p>
        </div>
      )}
    </div>
  );
}

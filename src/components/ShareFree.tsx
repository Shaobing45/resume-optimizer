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
      <p className="text-sm font-semibold text-blue-800">馃巵 鍒嗕韩鍏嶈垂浣撻獙</p>
      <p className="mt-1 text-xs text-blue-600">鍒嗕韩缁欐湅鍙嬶紝TA 鍙互鍏嶈垂浼樺寲涓€娆＄畝鍘?/p>

      {!link ? (
        <button onClick={generate} disabled={loading}
          className="mt-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:shadow-md disabled:opacity-50 transition-all">
          {loading ? '鐢熸垚涓€? : '馃敆 鐢熸垚鍒嗕韩閾炬帴'}
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input readOnly value={link} onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-xs text-blue-800 select-all" />
            <button onClick={() => navigator.clipboard?.writeText(link).then(() => alert('澶嶅埗鎴愬姛锛?)).catch(() => {})}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">
              澶嶅埗
            </button>
          </div>
          <p className="text-[10px] text-blue-400">鏈嬪弸鐐瑰紑閾炬帴灏辫兘鍏嶈垂浣跨敤锛屼笉鑺变綘鐨勯挶</p>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';

export default function InviteSection() {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/referral', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = await r.json();
      if (d.success) setLink(d.data.url);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
      <div className="mx-auto max-w-md rounded-2xl border border-green-200 bg-gradient-to-b from-green-50 to-white p-5 text-center shadow-sm">
        <p className="text-lg font-semibold text-green-700">馃巵 閭€璇峰ソ鍙嬪厤璐逛綋楠?/p>
        <p className="mt-1 text-xs text-green-600">鍒嗕韩缁欐湅鍙嬶紝TA 鍙互鍏嶈垂浼樺寲涓€娆＄畝鍘嗭紝浣犱篃鑳借幏寰楀鍔?/p>

        {!link ? (
          <button onClick={generate} disabled={loading}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-all">
            {loading ? '鈴?鐢熸垚涓€? : '馃敆 鐢熸垚鍒嗕韩閾炬帴'}
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input readOnly value={link} onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 rounded-lg border border-green-200 bg-white px-3 py-2.5 text-xs text-green-800 select-all" />
              <button onClick={() => navigator.clipboard.writeText(link).then(() => alert('宸插鍒讹紒鍒嗕韩缁欐湅鍙嬸煄?)).catch(() => {})}
                className="rounded-lg bg-green-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-700">
                澶嶅埗
              </button>
            </div>
            <p className="text-[10px] text-green-400">鏈嬪弸閫氳繃浣犵殑閾炬帴鍏嶈垂浣撻獙锛屼綘鍙湪绠＄悊鍚庡彴鏌ョ湅閭€璇疯褰?/p>
          </div>
        )}
      </div>
    </div>
  );
}

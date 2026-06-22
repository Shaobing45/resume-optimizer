'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { notifyBrowser } from '@/lib/notify';

interface PendingItem {
  id: string;
  shortId: string;
  preview: string;
  target: string;
  created_at: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState<PendingItem[]>([]);
  const prevCountRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // 加载待支付列表
  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${password}` },
      });
      const json = await res.json();
      if (json.success) {
        const prevCount = prevCountRef.current;
        const newCount = json.data.length;
        // 新订单提醒
        if (prevCount > 0 && newCount > prevCount) {
          const added = newCount - prevCount;
          notifyBrowser(`简小优 — ${added} 个新订单`, `当前 ${newCount} 个待支付订单`);
          playBeep();
        }
        prevCountRef.current = newCount;
        setItems(json.data);
      } else {
        setError(json.error);
      }
    } catch {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [password]);

  // 登录
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthed(true);
    loadPending();
  };

  useEffect(() => {
    if (authed) {
      loadPending();
      // 每30秒自动刷新
      const interval = setInterval(loadPending, 30_000);
      return () => clearInterval(interval);
    }
  }, [authed, loadPending]);

  // 确认收款
  const handleConfirm = async (id: string) => {
    setConfirming(id);
    setMessage('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage(`✅ ${id.slice(0, 8)} 已确认`);
        loadPending();
      } else {
        setMessage(`❌ ${json.error}`);
      }
    } catch {
      setMessage('❌ 操作失败');
    } finally {
      setConfirming(null);
    }
  };

  // 未登录
  if (!authed) {
    return (
      <div className="mx-auto flex max-w-sm items-center justify-center px-4 py-16 sm:py-24">
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🔐 管理后台</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">输入密码查看待支付订单</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理员密码"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            autoFocus
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            进入
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6 lg:py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">📋 待支付订单</h1>
        <button
          onClick={loadPending}
          disabled={loading}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
        >
          {loading ? '刷新中…' : '🔄 刷新'}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}
      {message && (
        <p className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">{message}</p>
      )}

      {items.length === 0 && !loading && (
        <p className="mt-8 text-center text-gray-400">暂无待支付订单 🎉</p>
      )}

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 transition-all hover:border-blue-300"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs sm:text-sm font-bold text-blue-600">
                    {item.shortId}
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] sm:text-xs text-gray-500">
                    {item.target}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs sm:text-sm text-gray-600">{item.preview}</p>
                <p className="mt-1 text-[10px] sm:text-xs text-gray-400">{item.created_at}</p>
              </div>
              <button
                onClick={() => handleConfirm(item.id)}
                disabled={confirming === item.id}
                className="flex-shrink-0 rounded-lg bg-green-600 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {confirming === item.id ? '…' : '✅ 确认'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
/** 提示音 */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.15;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* 忽略 */ }
}

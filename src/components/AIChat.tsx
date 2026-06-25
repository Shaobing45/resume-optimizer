'use client';

import { useState, useRef, useEffect } from 'react';

interface Msg { role: 'user' | 'assistant'; content: string }

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: '👋 你好！我是简历助手，有什么可以帮你？' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState({ x: 20, y: 80 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; btnX: number; btnY: number }>({ startX: 0, startY: 0, btnX: 0, btnY: 0 });
  const isDragging = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = false;
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, btnX: pos.x, btnY: pos.y };
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      isDragging.current = true;
      setPos({ x: dragRef.current.btnX + e.clientX - dragRef.current.startX, y: dragRef.current.btnY + e.clientY - dragRef.current.startY });
    };
    const onUp = () => { setDragging(false); setTimeout(() => { isDragging.current = false; }, 0); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMsgs((p) => [...p, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg }) });
      const d = await r.json();
      setMsgs((p) => [...p, { role: 'assistant', content: d.success ? d.data.reply : '抱歉，暂时无法回答。' }]);
    } catch {
      setMsgs((p) => [...p, { role: 'assistant', content: '网络错误，请重试。' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* 浮动按钮 */}
      <button
        onClick={() => { if (!isDragging.current) setOpen(!open); }}
        onMouseDown={onDragStart}
        style={{ right: pos.x, bottom: pos.y }}
        className={`fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors ${
          dragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-110'
        } ${open ? 'bg-gray-200 text-gray-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'}`}
        title="AI 简历助手"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          )}
        </svg>
      </button>

      {/* 聊天窗口 */}
      {open && (
        <div className="fixed z-50 flex h-[420px] w-[340px] max-w-[calc(100vw-40px)] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl animate-scale-in"
          style={{ right: pos.x, bottom: pos.y + 70 }}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
            <span className="text-sm font-semibold text-white">🤖 AI 简历助手</span>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-lg">&times;</button>
          </div>
          {/* 消息区 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-gray-100 px-4 py-2.5 text-xs text-gray-400">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0s' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.15s' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.3s' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {/* 输入区 */}
          <div className="border-t border-gray-100 px-3 py-2.5">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="问简历相关问题…"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button onClick={send} disabled={loading || !input.trim()} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

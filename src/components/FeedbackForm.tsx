'use client';

import { useState } from 'react';

export default function FeedbackForm({ resumeId }: { resumeId: string }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, name: name || '匿名用户', rating, content: content.trim() }),
      });
      setSubmitted(true);
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (!show && !submitted) {
    return (
      <div className="mt-6 text-center border-t border-gray-100 pt-6">
        <button onClick={() => setShow(true)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          💬 觉得怎么样？留下你的评价
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center animate-fade-in-up">
        <p className="text-base">🎉</p>
        <p className="mt-1 text-sm font-medium text-green-700">感谢你的评价！</p>
        <p className="text-xs text-green-600 mt-0.5">你的反馈会帮助更多人</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 animate-fade-in-up">
      <p className="text-sm font-semibold text-gray-700 mb-3">💬 分享你的体验</p>
      <div className="space-y-2.5">
        <input
          placeholder="你的名字（选填）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          maxLength={20}
        />
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => setRating(star)} className="text-base transition-transform hover:scale-110">
              {star <= rating ? '⭐' : '☆'}
            </button>
          ))}
          <span className="ml-2 text-[10px] text-gray-400">{rating} 分</span>
        </div>
        <textarea
          placeholder="说说你的使用感受…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
          maxLength={500}
        />
        <div className="flex gap-2">
          <button onClick={handleSubmit} disabled={loading || !content.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? '提交中…' : '提交评价'}
          </button>
          <button onClick={() => setShow(false)} className="rounded-lg bg-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-300">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

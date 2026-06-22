'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatePage() {
  const router = useRouter();
  const [info, setInfo] = useState('');
  const [targetPosition, setTargetPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (info.trim().length < 10) {
      setError('请至少输入10个字以上的个人信息');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ info, targetPosition: targetPosition || undefined }),
      });

      const json = await res.json();

      if (!json.success || !json.data?.id) {
        setError(json.error || '生成失败');
        return;
      }

      // 跳转到结果页（和优化简历流程一致：预览→付费→下载）
      router.push(`/result/${json.data.id}?tier=single&from=create`);
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">没有简历？直接生成</h1>
        <p className="mt-2 text-sm text-slate-500">
          把你的经历随便写下来，AI 帮你整理成专业简历
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            目标职位（选填）
          </label>
          <input
            type="text"
            value={targetPosition}
            onChange={(e) => setTargetPosition(e.target.value)}
            placeholder="例如：农业技术员、前端开发、产品经理"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            你的信息
            <span className="ml-1 text-xs text-slate-400">（想到什么写什么，越详细越好）</span>
          </label>
          <textarea
            rows={14}
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            placeholder={`随便写，格式不限，比如：

我叫张三，电话138xxxx，南京大学计算机专业2024年毕业。
在某某公司实习过半年，主要做Java后端开发，
参与了一个电商项目，负责订单模块。
会Java、Spring、MySQL、Redis。
英语六级，拿过校二等奖学金。`}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              AI 正在生成简历…
            </span>
          ) : (
            '✨ 生成简历'
          )}
        </button>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400">
          已有简历？去
          <Link href="/upload" className="text-blue-600 hover:underline">上传优化</Link>
        </p>
      </div>
    </div>
  );
}

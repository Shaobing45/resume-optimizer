'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import UploadZone from '@/components/UploadZone';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTier = searchParams.get('tier') || 'single';

  const [uploading, setUploading] = useState(false);
  const [jobDesc, setJobDesc] = useState('');
  const [targetPos, setTargetPos] = useState('');
  const [selectedTier, setSelectedTier] = useState(initialTier);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tier', selectedTier);
      formData.append('jobDescription', jobDesc);
      formData.append('targetPosition', targetPos);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        router.push(`/result/${data.data.id}?tier=${data.data.tier || selectedTier}`);
      } else {
        alert(data.error || '上传失败');
      }
    } catch {
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  }, [selectedTier, jobDesc, targetPos, router]);

  if (uploading) {
    return (
      <LoadingSpinner
        text="正在分析你的简历…"
        subtext="AI 正在解析内容并匹配岗位关键词"
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16 animate-fade-in-up">
      {/* 面包屑 / 步骤指示器 */}
      <div className="mb-8 flex items-center justify-center gap-2 text-sm">
        {['选套餐', '上传简历', 'AI 优化', '下载'].map((step, i) => (
          <span key={step} className={`flex items-center gap-1 ${i === 1 ? 'font-semibold text-blue-600' : 'text-gray-400'}`}>
            {i === 1 && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">2</span>}
            <span className={i === 1 ? '' : 'hidden sm:inline'}>{step}</span>
            {i < 3 && <span className="hidden sm:inline mx-1 text-gray-300">→</span>}
          </span>
        ))}
      </div>

      <h1 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">上传简历</h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        支持 PDF / DOCX / TXT，文件大小不超过 10MB
      </p>

      <div className="mt-8 space-y-6">
        {/* 套餐选择 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">选择套餐</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { key: 'single', name: '单次 ¥9.9', features: ['AI 智能优化', 'ATS 关键词匹配', '30% 预览免费看', 'TXT/PDF 导出'] },
              { key: 'pack5', name: '5次 ¥29.9', features: ['含单次全部功能', '多岗位定制', '优先处理', '多版本保留'] },
              { key: 'unlimited', name: '月费 ¥49.9', features: ['含前两项全部', '无限次优化', '求职信生成', '专属优先通道'] },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setSelectedTier(t.key)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  selectedTier === t.key
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-blue-200'
                }`}
              >
                <span className="font-semibold text-sm">{t.name}</span>
                <ul className="mt-1.5 space-y-0.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-1 text-[10px] text-gray-500">
                      <svg className="h-3 w-3 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* 岗位信息（新增） */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">
            🎯 目标岗位 <span className="text-gray-400 font-normal">（填得越详细，AI 匹配越精准）</span>
          </h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">目标职位</label>
              <input
                type="text"
                placeholder="如：高级前端工程师"
                value={targetPos}
                onChange={(e) => setTargetPos(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">岗位描述 / JD（可选，填得越详细，AI 匹配越精准）</label>
              <textarea
                placeholder="粘贴目标岗位的 JD 或职位要求…"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
                maxLength={10000}
              />
            </div>
          </div>
          {jobDesc && (
            <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
              <p className="text-xs text-green-700">
                ✅ 已填写 JD，AI 将针对该岗位关键词进行针对性优化
              </p>
            </div>
          )}
        </div>

        {/* 上传区域 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <UploadZone onUpload={handleUpload} uploading={uploading} />
        </div>

        {/* 信任提示 */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <span>🔒 加密传输</span>
            <span>📁 支持 PDF/DOCX/TXT</span>
            <span>📏 最大 10MB</span>
            <span>🚫 不上传第三方服务器</span>
          </div>
        </div>

        {/* 备用：从零创建 */}
        <p className="text-center text-sm text-gray-400">
          还没有简历？{' '}
          <Link href="/create" className="font-medium text-blue-600 hover:text-blue-700">
            从零创建一份 ✍️
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

interface ResumeCompareProps {
  original: string;
  optimized: string;
  previewMode?: boolean; // true = 只显示部分优化内容
  onPay?: () => void;
  paying?: boolean;
}

export default function ResumeCompare({
  original,
  optimized,
  previewMode = false,
  onPay,
  paying,
}: ResumeCompareProps) {
  const [activeTab, setActiveTab] = useState<'original' | 'optimized'>('optimized');

  return (
    <div className="w-full">
      {/* Tab 切换 */}
      <div className="mb-3 sm:mb-4 flex rounded-xl bg-gray-100 p-1">
        <button
          className={`flex-1 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'original'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('original')}
        >
          📄 原始简历
        </button>
        <button
          className={`flex-1 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'optimized'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('optimized')}
        >
          ✨ AI优化版
        </button>
      </div>

      {/* 内容区 */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 lg:p-6">
        <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-gray-700">
          {activeTab === 'original' ? original : optimized}
        </pre>
      </div>

      {/* 付费按钮（预览模式） */}
      {previewMode && onPay && (
        <div className="mt-6 rounded-xl border-2 border-blue-200 bg-blue-50 p-6 text-center">
          <p className="text-lg font-semibold text-gray-800">
            🔒 以上仅为30%预览
          </p>
          <p className="mt-1 text-sm text-gray-600">
            付费后解锁完整优化内容，支持下载
          </p>
          <button
            onClick={onPay}
            disabled={paying}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:opacity-50"
          >
            {paying ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                正在跳转支付…
              </>
            ) : (
              <>
                💳 立即解锁 — ¥9.9
              </>
            )}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            也支持 ¥29.9/5次 和 ¥49.9/30天无限套餐
          </p>
        </div>
      )}
    </div>
  );
}

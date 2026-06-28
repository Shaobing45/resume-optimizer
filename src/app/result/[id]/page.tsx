'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import ResumeCompare from '@/components/ResumeCompare';
import AtsScoreBadge from '@/components/AtsScoreBadge';
import FeedbackForm from '@/components/FeedbackForm';
import ShareFree from '@/components/ShareFree';
import LoadingSpinner from '@/components/LoadingSpinner';
import { downloadResumeAsPdf, downloadResumeAsDoc } from '@/lib/pdf';
import { notifyBrowser } from '@/lib/notify';
import type { ApiResponse, OptimizeResponse } from '@/types';

const QR_MAP: Record<string, { src: string; price: string }> = {
  single: { src: '/qr-pay.jpg', price: '¥9.9' },
  pack5: { src: '/qr-pay.jpg', price: '¥29.9' },
  unlimited: { src: '/qr-pay.jpg', price: '¥39.9' },
};

export default function ResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const tier = searchParams.get('tier') || 'single';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<OptimizeResponse | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const notifiedRef = useRef(false);

  // 从 API 响应获取 tier，回退到 URL 参数
  const effectiveTier = data?.tier || tier;
  const qr = QR_MAP[effectiveTier] || QR_MAP.single;

  const loadResult = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json: ApiResponse<OptimizeResponse> = await res.json();
      if (!json.success || !json.data) {
        setError(json.error || '加载失败');
        return;
      }
      setData(json.data);
    } catch {
      setError('网络错误，请刷新重试');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  // 自动轮询支付状态
  useEffect(() => {
    if (data?.status === 'pending_payment') {
      const timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/result?id=${id}`);
          const json: ApiResponse<OptimizeResponse> = await res.json();
          if (json.success && json.data) {
            setData(json.data);
            if (json.data.status === 'paid') clearInterval(timer);
          }
        } catch { /* ignore */ }
      }, 5000);
      const timeout = setTimeout(() => clearInterval(timer), 1800000); // 30分钟超时
      return () => { clearInterval(timer); clearTimeout(timeout); };
    }
  }, [data?.status, id]);

  // 支付成功时通知用户
  useEffect(() => {
    if (!data) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = data.status;
    if (prev === 'pending_payment' && data.status === 'paid' && !notifiedRef.current) {
      notifiedRef.current = true;
      notifyBrowser('🎉 支付成功', '你的简历已解锁完整优化内容');
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(523, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.frequency.setValueAtTime(659, now + 0.15);
        gain.gain.setValueAtTime(0.15, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } catch { /* ignore */ }
      try { navigator.vibrate?.([200, 100, 200]); } catch { /* ignore */ }
    }
  }, [data]);

  const checkPayment = useCallback(async () => {
    setCheckingPayment(true);
    setConfirmError('');
    try {
      const res = await fetch('/api/self-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json: ApiResponse<OptimizeResponse> = await res.json();
      if (json.success) {
        // 重新加载结果
        const resultRes = await fetch(`/api/result?id=${id}`);
        const resultJson: ApiResponse<OptimizeResponse> = await resultRes.json();
        if (resultJson.success && resultJson.data) setData(resultJson.data);
      } else {
        setConfirmError(json.error || '确认失败，请稍后重试');
      }
    } catch {
      setConfirmError('网络错误，请重试');
    } finally {
      setCheckingPayment(false);
    }
  }, [id]);

  // 加载中
  if (loading) {
    return <LoadingSpinner text="正在加载优化结果…" subtext="请稍候" />;
  }

  // 错误
  if (error && !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
          <p className="text-lg font-medium text-red-700">加载失败</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button onClick={loadResult} className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700">重试</button>
        </div>
      </div>
    );
  }

  // 无数据
  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-gray-500">简历不存在或已过期</div>
    );
  }

  // 已过期或失败
  if (data.status === 'expired' || data.status === 'failed') {
    const isExpired = data.status === 'expired';
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24 text-center">
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 sm:p-8">
          <p className="text-3xl sm:text-4xl">{isExpired ? '⏰' : '😞'}</p>
          <h2 className="mt-4 text-lg sm:text-xl font-bold text-amber-800">
            {isExpired ? '订单已过期' : '订单处理失败'}
          </h2>
          <p className="mt-2 text-sm text-amber-600">
            {isExpired
              ? '支付超时，请重新上传简历获取新订单'
              : '简历优化过程中出现错误，请重试'}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isExpired && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/self-confirm', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id }),
                    });
                    const json = await res.json();
                    if (json.success) {
                      window.location.reload();
                    } else {
                      alert('如果已付款请联系客服手动处理');
                    }
                  } catch {
                    alert('操作失败');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-green-700"
              >
                ✅ 我已付款，立即解锁
              </button>
            )}
            <a
              href="/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
            >
              📤 重新开始
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 已支付 — 显示完整内容
  if (data.status === 'paid') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6 rounded-xl border border-green-200 bg-green-50 p-3 sm:p-4 text-center">
          <p className="text-base sm:text-lg font-semibold text-green-700">✅ 支付成功！</p>
          <p className="mt-1 text-xs sm:text-sm text-green-600">以下是完整优化结果，你可以复制或下载</p>
        </div>
        {data.keywordMatch && (
          <div className="mb-4 sm:mb-6">
            <AtsScoreBadge match={data.keywordMatch} />
          </div>
        )}
        <ResumeCompare original={data.original} optimized={data.optimized} previewMode={false} />
        <div className="mt-4 sm:mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={() => {
              const blob = new Blob([data.optimized], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `优化简历_${new Date().toISOString().slice(0, 10)}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 sm:px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            📄 下载 TXT
          </button>
          <button
            onClick={async () => {
              setPdfLoading(true);
              try {
                const photo = localStorage.getItem('jxy-resume-photo') || undefined;
                await downloadResumeAsPdf(data.optimized, undefined, photo);
              } catch { /* ignore */ }
              finally { setPdfLoading(false); }
            }}
            disabled={pdfLoading}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 sm:px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
          >
            {pdfLoading ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />生成中…</>) : '📥 下载 PDF 简历'}
          </button>
          <button
            onClick={() => {
              setDocLoading(true);
              try {
                const photo = localStorage.getItem('jxy-resume-photo') || undefined;
                downloadResumeAsDoc(data.optimized, undefined, photo);
              } catch { /* ignore */ }
              finally { setDocLoading(false); }
            }}
            disabled={docLoading}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 sm:px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {docLoading ? '生成中…' : '📝 下载 Word 文档'}
          </button>
        </div>

        {/* 评价反馈 */}
        <FeedbackForm resumeId={id} />

        {/* 分享免费体验 */}
        <ShareFree resumeId={id} />
      </div>
    );
  }

  // 预览模式（pending_payment）— 30%预览 + 扫码支付
  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6 lg:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AI 优化结果</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">{`以下是30%预览，支付 ${qr.price} 后解锁完整内容`}</p>
        <p className="mt-0.5 text-[10px] text-amber-500">
          ⏳ 订单将在 2 小时后自动过期，请及时支付
        </p>
      </div>

      {/* ATS 关键词评分 */}
      {data.keywordMatch && (
        <div className="mb-4 sm:mb-6">
          <AtsScoreBadge match={data.keywordMatch} />
        </div>
      )}

      <ResumeCompare original={data.original} optimized={data.preview} previewMode={true} />
      <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-6 sm:pt-8">
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 lg:p-8">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{`📱 微信扫码支付 ${qr.price}`}</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">请务必在<b>付款备注</b>中填写简历ID</p>
          </div>
          <div className="mt-4 sm:mt-6 flex justify-center">
            <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-2 sm:p-3 shadow-md">
              <div className="w-48 sm:w-56 lg:w-64">
                <Image src={qr.src} alt={`微信收款码 ${qr.price}`} width={256} height={256} className="h-auto w-full object-contain" priority />
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-6 rounded-xl bg-white border border-gray-200 p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-gray-500">付款备注请填写此ID：</p>
            <p className="mt-2 select-all text-xl sm:text-2xl font-mono font-bold tracking-wider text-blue-600">{id.slice(0, 8)}</p>
            <button onClick={() => navigator.clipboard.writeText(id.slice(0, 8))} className="mt-2 text-xs text-blue-500 hover:text-blue-700">📋 点击复制</button>
          </div>
          <div className="mt-4 sm:mt-6 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
            <p>{`1️⃣ 截图或长按识别二维码 → 支付 ${qr.price}`}</p>
            <p>2️⃣ 在付款<b>备注</b>里填上方的8位ID</p>
            <p>3️⃣ 完成支付后系统自动检测，无需手动刷新</p>
          </div>
          <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2 sm:gap-3">
            {confirmError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-1.5 w-full text-center">{confirmError}</p>
            )}
            <button onClick={checkPayment} disabled={checkingPayment} className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-green-600 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white shadow-md transition-all hover:bg-green-700 disabled:opacity-50">
              {checkingPayment ? (<><div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />确认中…</>) : '✅ 已完成支付，查看完整内容'}
            </button>
            <p className="text-[10px] sm:text-xs text-gray-400 text-center">支付后点击按钮即可自动解锁，无需等待管理员确认</p>
          </div>
        </div>
      </div>
    </div>
  );
}

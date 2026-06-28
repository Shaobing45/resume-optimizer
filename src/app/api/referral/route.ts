import { NextRequest } from 'next/server';
import { createShareToken, claimFreeOptimization, createResume } from '@/lib/db';
import type { ApiResponse } from '@/types';

// 生成分享链接
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const resumeId = body?.resumeId || 'homepage-invite';

    const token = createShareToken(resumeId);
    return Response.json({ success: true, data: { token, url: `https://www.jianxiaoyou.xyz/free?ref=${token}` } } satisfies ApiResponse);
  } catch {
    return Response.json({ success: false, error: '生成失败' } satisfies ApiResponse, { status: 500 });
  }
}

// 领取免费优化
export async function PUT(request: NextRequest) {
  try {
    const { token, info, targetPosition } = await request.json();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!token || !info) return Response.json({ success: false, error: '缺少参数' } satisfies ApiResponse, { status: 400 });

    const record = createResume(info.slice(0, 50000), undefined, targetPosition?.slice(0, 200) || undefined, 'free');
    const ok = claimFreeOptimization(token, record.id);
    if (!ok) return Response.json({ success: false, error: '分享链接无效或已使用' } satisfies ApiResponse, { status: 400 });

    return Response.json({ success: true, data: { id: record.id, message: '🎉 免费体验成功！' } } satisfies ApiResponse);
  } catch {
    return Response.json({ success: false, error: '领取失败' } satisfies ApiResponse, { status: 500 });
  }
}

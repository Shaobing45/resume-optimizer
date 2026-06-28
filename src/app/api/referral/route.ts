import { NextRequest } from 'next/server';
import { createShareToken, claimFreeOptimization, createResume } from '@/lib/db';
import type { ApiResponse } from '@/types';

// 鐢熸垚鍒嗕韩閾炬帴
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const resumeId = body?.resumeId || 'homepage-invite';

    const token = createShareToken(resumeId);
    return Response.json({ success: true, data: { token, url: `https://www.jianxiaoyou.xyz/free?ref=${token}` } } satisfies ApiResponse);
  } catch {
    return Response.json({ success: false, error: '鐢熸垚澶辫触' } satisfies ApiResponse, { status: 500 });
  }
}

// 棰嗗彇鍏嶈垂浼樺寲
export async function PUT(request: NextRequest) {
  try {
    const { token, info, targetPosition } = await request.json();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!token || !info) return Response.json({ success: false, error: '缂哄皯鍙傛暟' } satisfies ApiResponse, { status: 400 });

    const record = createResume(info.slice(0, 50000), undefined, targetPosition?.slice(0, 200) || undefined, 'free');
    const ok = claimFreeOptimization(token, record.id);
    if (!ok) return Response.json({ success: false, error: '鍒嗕韩閾炬帴鏃犳晥鎴栧凡浣跨敤' } satisfies ApiResponse, { status: 400 });

    return Response.json({ success: true, data: { id: record.id, message: '馃帀 鍏嶈垂浣撻獙鎴愬姛锛? } } satisfies ApiResponse);
  } catch {
    return Response.json({ success: false, error: '棰嗗彇澶辫触' } satisfies ApiResponse, { status: 500 });
  }
}

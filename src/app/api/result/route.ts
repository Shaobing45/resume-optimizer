import { NextRequest } from 'next/server';
import { getResume, expireOldPendingPayments, getKeywordMatch } from '@/lib/db';
import { generatePreview } from '@/lib/ai';
import type { ApiResponse, OptimizeResponse } from '@/types';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { success: false, error: '缺少简历 ID' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 自动过期超过2小时的订单
    expireOldPendingPayments();

    const record = getResume(id);
    if (!record) {
      return Response.json(
        { success: false, error: '简历不存在或已过期' } satisfies ApiResponse,
        { status: 404 }
      );
    }

    // 只返回已有优化结果的记录
    if (!record.optimized_text) {
      return Response.json(
        { success: false, error: '简历尚未完成优化' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      data: {
        id: record.id,
        original: record.original_text,
        optimized: record.optimized_text,
        preview: generatePreview(record.optimized_text),
        status: record.status,
        tier: record.tier,
        keywordMatch: getKeywordMatch(record),
      } satisfies OptimizeResponse,
    } satisfies ApiResponse<OptimizeResponse>, {
      headers: {
        // 防止 CDN 缓存订单状态
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Result GET error:', error);
    const message = error instanceof Error ? error.message : '查询失败，请重试';
    return Response.json(
      { success: false, error: message } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

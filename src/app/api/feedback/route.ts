import { NextRequest } from 'next/server';
import { addFeedback, getApprovedFeedback } from '@/lib/db';
import type { ApiResponse } from '@/types';

export async function GET(): Promise<Response> {
  const feedback = getApprovedFeedback().map((f) => ({
    name: f.name,
    rating: f.rating,
    content: f.content,
    created_at: f.created_at,
  }));
  return Response.json({ success: true, data: feedback } satisfies ApiResponse);
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { resumeId, name, rating, content } = body;

    if (!resumeId || !content) {
      return Response.json(
        { success: false, error: '缺少必要信息' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    addFeedback(resumeId, name || '匿名用户', rating || 5, content);

    return Response.json({
      success: true,
      data: { message: '感谢你的评价！' },
    } satisfies ApiResponse);
  } catch {
    return Response.json(
      { success: false, error: '提交失败' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

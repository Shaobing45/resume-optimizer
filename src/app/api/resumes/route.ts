import { NextRequest } from 'next/server';
import { getSessionByToken, getUserById, getResumesByUserId } from '@/lib/db';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return Response.json(
        { success: false, error: '未登录' } satisfies ApiResponse,
        { status: 401 }
      );
    }

    const session = getSessionByToken(token);
    if (!session) {
      return Response.json(
        { success: false, error: '登录已过期，请重新登录' } satisfies ApiResponse,
        { status: 401 }
      );
    }

    const user = getUserById(session.user_id);
    if (!user) {
      return Response.json(
        { success: false, error: '用户不存在' } satisfies ApiResponse,
        { status: 401 }
      );
    }

    const resumes = getResumesByUserId(user.id);
    const safeResumes = resumes.map(r => ({
      id: r.id,
      shortId: r.id.slice(0, 8),
      target: r.target_position || '未指定',
      status: r.status,
      tier: r.tier,
      created_at: r.created_at,
      preview: (r.original_text || '').slice(0, 60) + '…',
    }));

    return Response.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        resumes: safeResumes,
      },
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Resumes error:', error);
    return Response.json(
      { success: false, error: '查询失败' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

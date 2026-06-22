import { NextRequest } from 'next/server';
import { listPendingPayments, confirmPayment, getResume, expireOldPendingPayments } from '@/lib/db';
import { notifyPaymentConfirmed } from '@/lib/notify';
import type { ApiResponse, ResumeRecord } from '@/types';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD 环境变量未设置');
    return false;
  }
  return token === ADMIN_PASSWORD;
}

// GET — 列出待支付订单
export async function GET(request: NextRequest): Promise<Response> {
  try {
    if (!checkAuth(request)) {
      return Response.json(
        { success: false, error: '密码错误' } satisfies ApiResponse,
        { status: 401 }
      );
    }

    // 清理过期订单再返回
    expireOldPendingPayments();

    const pending = listPendingPayments();

    // 脱敏：只返回关键信息
    const safe = pending.map((r: ResumeRecord) => ({
      id: r.id,
      shortId: r.id.slice(0, 8),
      preview: r.original_text.slice(0, 80) + '…',
      target: r.target_position || '未指定',
      created_at: r.created_at,
    }));

    return Response.json({ success: true, data: safe });
  } catch (error) {
    console.error('Admin GET error:', error);
    return Response.json(
      { success: false, error: '查询失败' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

// POST — 确认收款
export async function POST(request: NextRequest): Promise<Response> {
  if (!checkAuth(request)) {
    return Response.json(
      { success: false, error: '密码错误' } satisfies ApiResponse,
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return Response.json(
        { success: false, error: '缺少简历 ID' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    const record = getResume(id);
    if (!record) {
      return Response.json(
        { success: false, error: '简历不存在' } satisfies ApiResponse,
        { status: 404 }
      );
    }

    if (record.status === 'paid') {
      return Response.json(
        { success: false, error: '该订单已经确认过了' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    confirmPayment(id);
    // 通知管理员确认成功（不阻塞响应）
    (async () => {
      const r = getResume(id);
      if (r) {
        const shortId = id.slice(0, 8);
        await notifyPaymentConfirmed(shortId, new Date().toISOString());
      }
    })().catch(() => {});

    return Response.json({
      success: true,
      data: { id, message: '已确认收款' },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '操作失败';
    return Response.json(
      { success: false, error: message } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

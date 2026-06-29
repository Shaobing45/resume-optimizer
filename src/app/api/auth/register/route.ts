import { NextRequest } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import type { ApiResponse } from '@/types';

// 内存限流：每个IP每分钟最多3次注册
const registerRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = registerRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    registerRateLimit.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 限流
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    if (!checkRateLimit(ip)) {
      return Response.json(
        { success: false, error: '注册过于频繁，请1分钟后再试' } satisfies ApiResponse,
        { status: 429 }
      );
    }

    const { email, password, name } = await request.json();

    if (!email || !password) {
      return Response.json(
        { success: false, error: '邮箱和密码不能为空' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 限制输入长度
    if (email.length > 200 || password.length > 200 || (name && name.length > 50)) {
      return Response.json(
        { success: false, error: '输入过长' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, error: '密码至少6位' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 更严格的邮箱验证
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return Response.json(
        { success: false, error: '邮箱格式不正确' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existing = getUserByEmail(email);
    if (existing) {
      return Response.json(
        { success: false, error: '该邮箱已注册，请直接登录' } satisfies ApiResponse,
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const user = createUser(email, passwordHash, name || '');

    return Response.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name },
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Register error:', error);
    return Response.json(
      { success: false, error: '注册失败，请重试' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

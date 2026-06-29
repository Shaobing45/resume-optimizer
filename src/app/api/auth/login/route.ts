import { NextRequest } from 'next/server';
import { getUserByEmail, createSession, restoreUserFromKV } from '@/lib/db';
import { verifyPassword, createSessionToken } from '@/lib/auth';
import type { ApiResponse } from '@/types';

// 内存限流：每个IP每分钟最多5次登录尝试
const loginRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    loginRateLimit.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
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
        { success: false, error: '登录尝试过于频繁，请1分钟后再试' } satisfies ApiResponse,
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { success: false, error: '邮箱和密码不能为空' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 限制输入长度防止DoS
    if (email.length > 200 || password.length > 200) {
      return Response.json(
        { success: false, error: '输入过长' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    let user = getUserByEmail(email);

    // SQLite 找不到 + KV 可用 → 从 KV 恢复（部署后第一次登录）
    if (!user && process.env.KV_REST_API_URL) {
      user = await restoreUserFromKV(email);
    }

    // 统一错误提示：不泄露邮箱是否已注册
    if (!user || !verifyPassword(password, user.password_hash)) {
      return Response.json(
        { success: false, error: '邮箱或密码错误' } satisfies ApiResponse,
        { status: 401 }
      );
    }

    const token = createSessionToken();
    createSession(user.id, token);

    return Response.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { success: false, error: '登录失败，请重试' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

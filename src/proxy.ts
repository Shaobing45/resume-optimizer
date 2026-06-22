import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 内存速率限制（Vercel serverless 无共享状态，每个实例独立计数）
// 适合小规模使用；大规模建议换 Upstash Redis
const rateMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/upload':     { max: 20,  windowMs: 60_000 },   // 20次/分钟
  '/api/optimize':   { max: 30,  windowMs: 60_000 },   // 30次/分钟
  '/api/create':     { max: 10,  windowMs: 60_000 },   // 10次/分钟
  '/api/result':     { max: 60,  windowMs: 60_000 },   // 60次/分钟（轮询）
  '/api/admin':      { max: 5,   windowMs: 60_000 },   // 5次/分钟（防暴力破解）
  'default':         { max: 100, windowMs: 60_000 },
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // === 安全响应头 ===
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  // CSP — 仅对内联脚本放宽（Next.js 需要）
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://*.deepseek.com https://*.openai.com https://sctapi.ftqq.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // === CORS: 仅允许本站 ===
  const origin = request.headers.get('origin');
  if (origin) {
    const allowedOrigins = [
      'https://jianxiaoyou.xyz',
      'http://localhost:3000',
    ];
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      allowedOrigins.push(process.env.NEXT_PUBLIC_SITE_URL);
    }
    if (allowedOrigins.some((o) => origin.startsWith(o))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
  }

  // === 速率限制（仅 API 路由） ===
  if (pathname.startsWith('/api/')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous';

    const limitKey = Object.keys(RATE_LIMITS).find((k) => pathname.startsWith(k));
    const { max, windowMs } = RATE_LIMITS[limitKey || 'default'] || RATE_LIMITS.default;
    const routeKey = limitKey || 'default';
    const mapKey = `${ip}:${routeKey}`;

    const now = Date.now();
    const entry = rateMap.get(mapKey);

    if (!entry || now > entry.resetAt) {
      rateMap.set(mapKey, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count++;
      if (entry.count > max) {
        return NextResponse.json(
          { success: false, error: '请求过于频繁，请稍后再试' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
            },
          }
        );
      }
    }

    // 设置速率限制响应头
    const current = rateMap.get(mapKey)!;
    response.headers.set('X-RateLimit-Limit', String(max));
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, max - current.count)));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));
  }

  return response;
}

export const config = {
  matcher: [
    // 匹配所有路径，排除静态资源
    '/((?!_next/static|_next/image|favicon.ico|qr-pay.*\\.jpg|.*\\.svg|.*\\.png).*)',
  ],
};

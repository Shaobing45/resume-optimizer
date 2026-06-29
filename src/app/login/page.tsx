'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem('jxy-token', json.data.token);
        localStorage.setItem('jxy-user', JSON.stringify(json.data.user));
        router.push('/dashboard');
      } else {
        setError(json.error || '登录失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">登录</h1>
          <p className="mt-1 text-sm text-gray-500">登录后可以查看历史优化记录</p>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} required
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} required
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? '登录中…' : '登录'}
        </button>
        <p className="text-center text-sm text-gray-500">
          没有账号？<Link href="/register" className="text-blue-600 hover:underline">注册</Link>
        </p>
      </form>
    </div>
  );
}

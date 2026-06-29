'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ResumeItem {
  id: string;
  shortId: string;
  target: string;
  status: string;
  tier: string;
  created_at: string;
  preview: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jxy-token');
    const userData = localStorage.getItem('jxy-user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (userData) setUser(JSON.parse(userData));

    fetch('/api/resumes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setResumes(json.data.resumes);
          setUser(json.data.user);
          localStorage.setItem('jxy-user', JSON.stringify(json.data.user));
        } else {
          localStorage.removeItem('jxy-token');
          localStorage.removeItem('jxy-user');
          router.push('/login');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('jxy-token');
    localStorage.removeItem('jxy-user');
    router.push('/');
  };

  const statusLabel: Record<string, { text: string; color: string }> = {
    paid: { text: '已支付 ✓', color: 'text-green-600 bg-green-50' },
    pending_payment: { text: '待支付', color: 'text-amber-600 bg-amber-50' },
    expired: { text: '已过期', color: 'text-gray-500 bg-gray-50' },
    pending: { text: '处理中', color: 'text-blue-600 bg-blue-50' },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的简历</h1>
          <p className="mt-1 text-sm text-gray-500">{user?.name || user?.email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/upload" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            ✨ 新建优化
          </Link>
          <button onClick={handleLogout} className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            退出
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      ) : resumes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-lg font-medium text-gray-700">还没有优化过简历</p>
          <p className="mt-1 text-sm text-gray-500">上传一份简历，AI帮你优化</p>
          <Link href="/upload" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            🚀 开始优化
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((r) => {
            const st = statusLabel[r.status] || { text: r.status, color: 'text-gray-500 bg-gray-50' };
            return (
              <Link key={r.id} href={`/result/${r.id}`}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-blue-600">{r.shortId}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${st.color}`}>{st.text}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{r.tier}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 truncate">
                    <span className="font-medium text-gray-800">{r.target}</span> — {r.preview}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">{r.created_at}</p>
                </div>
                <svg className="h-4 w-4 flex-shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

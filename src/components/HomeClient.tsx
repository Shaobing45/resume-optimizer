'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import InviteSection from './InviteSection';

const QR_MAP: Record<string, { src: string; price: string; label: string }> = {
  single: { src: '/qr-pay.jpg', price: '¥9.9', label: '单次优化' },
  pack5: { src: '/qr-pay.jpg', price: '¥29.9', label: '5次套餐' },
  unlimited: { src: '/qr-pay.jpg', price: '¥39.9', label: '月度无限' },
};

const FEATURES = [
  { icon: '🎯', title: 'ATS 智能匹配', desc: '自动分析岗位描述，精准匹配行业关键词' },
  { icon: '🚀', title: '3 分钟出结果', desc: '上传简历后 AI 自动优化，无需等待' },
  { icon: '📊', title: '30% 预览免费', desc: '先看优化效果，满意再付款' },
  { icon: '🔒', title: '数据安全加密', desc: '简历数据加密存储，隐私无忧' },
];

const FAQS = [
  { q: '优化后能直接投递吗？', a: '可以！优化后的简历符合 ATS 系统标准格式，HR 阅读体验大幅提升，可直接用于各大招聘平台。' },
  { q: '支持哪些文件格式？', a: '支持 PDF、DOCX、TXT 格式上传。建议使用 PDF 以获得最佳解析效果。' },
  { q: '优化一次需要多久？', a: 'AI 优化一般在 1-3 分钟内完成。30% 预览免费查看，满意后支付 ¥9.9 即可解锁完整版。' },
  { q: '有售后支持吗？', a: '如果优化结果不满意，可以联系客服重新优化，直至满意为止。' },
];

const DEMO_BEFORE = `王磊
---
电话：139-1234-5678 | 邮箱：wanglei@email.com

工作经历：
在某某科技有限公司担任后端开发
参与公司核心项目的研发和维护
协助团队完成项目上线

教育背景：
某985大学 计算机科学与技术 本科

技能：
Java、MySQL、Spring Boot`;

const DEMO_AFTER = `王磊
---
电话：139-1234-5678 | 邮箱：wanglei@email.com | 3年后端开发经验

工作经历：
主导公司核心业务系统的架构升级，日均处理请求量提升至 50 万
重构订单模块，系统响应时间从 2.3s 降至 0.4s，降低 82%
打造自动化单元测试体系，代码覆盖率从 15% 提升至 85%，线上 Bug 减少 60%

教育背景：
某985大学 计算机科学与技术 本科

技能：
Java · Spring Boot · MySQL · Redis · Docker · Git`;

export default function HomeClient() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const qr = selectedTier ? QR_MAP[selectedTier] : null;
  const pricingRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState<{ name: string; rating: number; content: string }[]>([]);

  useEffect(() => {
    fetch('/api/feedback').then(r => r.json()).then(d => { if (d.success) setFeedback(d.data); }).catch(() => {});
  }, []);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 滚动入场动画控制
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    Object.entries(sectionRefs.current).forEach(([key, el]) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [key]: true }));
            obs.unobserve(el);
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const setRef = (key: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el;
  };

  return (
    <div className="overflow-x-hidden">
      {/* ==================== 顶部导航 ==================== */}
      <nav className="flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-3">
        <Link href="/" className="text-lg font-bold gradient-text">简小优</Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">登录</Link>
          <Link href="/register" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">注册</Link>
        </div>
      </nav>
      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* 装饰浮动元素 */}
        <div className="absolute left-[10%] top-[15%] h-32 w-32 rounded-full bg-blue-300/20 blur-2xl animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute right-[15%] top-[40%] h-48 w-48 rounded-full bg-indigo-300/15 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute left-[20%] bottom-[20%] h-24 w-24 rounded-full bg-purple-300/15 blur-2xl animate-float" style={{ animationDelay: '3s' }} />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-28">
          {/* 徽章 — 带闪烁 */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-medium text-blue-700 animate-fade-in-down">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" /></span>
              10,000+ 用户信赖
            </span>
          </div>

          {/* 主标题 — 渐变 */}
          <h1 className="mx-auto max-w-4xl text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              让你的简历
            </span>
            <br />
            在 <span className="text-blue-600 relative">3 分钟<span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-gradient-to-r from-blue-400 to-purple-400" /></span> 脱胎换骨
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base sm:text-lg text-gray-500 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            AI 智能分析岗位描述 + 简历关键词优化 + ATS 格式适配
            <br className="hidden sm:block" />
            已帮助 <span className="font-semibold text-blue-600">10,000+</span> 人拿到面试机会
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/upload"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200/50 transition-all hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              开始优化简历
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>

          {/* 裂变入口 */}
          <InviteSection />

          {/* 统计数字 */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {[
              { num: '10,000+', label: '服务用户' },
              { num: '98%', label: '满意率' },
              { num: '3 分钟', label: '平均出稿' },
              { num: '500+', label: '合作企业' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/60 p-4 text-center backdrop-blur-sm transition-all hover:bg-white/90 hover:shadow-md card-hover">
                <p className="text-2xl font-bold gradient-text sm:text-3xl">{stat.num}</p>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 实时简历示例 ==================== */}
      <section className="bg-white py-16 sm:py-20 border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-4" ref={setRef('demo')}>
          <div className={`transition-all duration-700 ${visibleSections.demo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">看看 AI 改得怎么样</h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">点击按钮对比优化前后的差异</p>

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* 切换栏 */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setShowDemo(false)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${!showDemo ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  📄 优化前
                </button>
                <button
                  onClick={() => setShowDemo(true)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${showDemo ? 'bg-green-50 text-green-700 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  ✨ 优化后
                </button>
              </div>
              {/* 内容 */}
              <div className="p-4 sm:p-6 lg:p-8">
                <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed transition-all duration-500 ${showDemo ? 'text-green-900' : 'text-gray-600'}`}>
                  {showDemo ? DEMO_AFTER : DEMO_BEFORE}
                </pre>
              </div>
              {/* 对比标注 */}
              {showDemo && (
                <div className="bg-green-50 border-t border-green-100 px-4 sm:px-6 py-3 animate-fade-in-up">
                  <div className="flex flex-wrap gap-2 text-xs text-green-700">
                    <span className="inline-flex items-center gap-1">✅ 量化成果（日活50万、响应降60%）</span>
                    <span className="inline-flex items-center gap-1">✅ 动词驱动（主导、重构、打造）</span>
                    <span className="inline-flex items-center gap-1">✅ 删掉废话（去掉"负责/参与/协助"）</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 三步流程 ==================== */}
      <section className="bg-gradient-to-b from-white to-blue-50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4" ref={setRef('steps')}>
          <div className={`transition-all duration-700 delay-100 ${visibleSections.steps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">三步搞定</h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">比写简历更简单，比模板更智能</p>

            <div className="relative mt-10 grid gap-8 sm:grid-cols-3">
              {/* 连接线（桌面端） */}
              <div className="absolute left-1/2 top-12 hidden h-0.5 w-[calc(100%-6rem)] -translate-x-1/2 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 sm:block" style={{ width: 'calc(100% - 8rem)' }} />

              {[
                { step: '01', icon: '📄', title: '上传简历', desc: '支持 PDF / DOCX / TXT，或从零创建新简历', tag: '免费', tagColor: 'bg-green-500' },
                { step: '02', icon: '🤖', title: 'AI 智能优化', desc: 'DeepSeek AI 分析简历，匹配岗位关键词，量化成果', tag: '免费', tagColor: 'bg-green-500' },
                { step: '03', icon: '📥', title: '预览 & 付费下载', desc: '30% 免费预览效果 → 满意后 ¥9.9 解锁完整 PDF', tag: '¥9.9起', tagColor: 'bg-blue-600' },
              ].map((s, i) => (
                <div key={s.step} className="group relative flex flex-col items-center text-center">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-lg transition-all group-hover:scale-110 group-hover:shadow-xl" style={{ background: i === 2 ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                    <span className="text-lg">{s.icon}</span>
                  </div>
                  <span className={`mt-3 inline-block rounded-full ${s.tagColor} px-2.5 py-0.5 text-[10px] font-semibold text-white`}>{s.tag}</span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-xs">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/upload" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl">
                🚀 免费开始 — 先看效果再付款
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 核心功能 ==================== */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4" ref={setRef('features')}>
          <div className={`transition-all duration-700 delay-100 ${visibleSections.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">为什么选简小优？</h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">四大核心优势，让简历脱颖而出</p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-lg hover:-translate-y-1 hover:ring-blue-200"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-xl transition-transform group-hover:scale-110">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 定价 ==================== */}
      <section id="pricing" ref={pricingRef} className="bg-gradient-to-b from-white to-blue-50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4" ref={setRef('pricing')}>
          <div className={`transition-all duration-700 ${visibleSections.pricing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">选择套餐</h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">
              先看效果再付款，不满意可重新优化
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { key: 'single', name: '单次优化', price: '¥9.9', oldPrice: '¥29', desc: '适合已有简历，只需一次优化', features: ['AI 智能优化措辞', 'ATS 关键词匹配', '成果量化重写', '30% 预览免费看', 'TXT / PDF 导出'], popular: false },
                { key: 'pack5', name: '5 次套餐', price: '¥29.9', oldPrice: '¥99', desc: '多轮优化 + 多个岗位定制', features: ['含 5 次优化额度', '每次可定制不同岗位', '优先处理队列', '30% 预览免费看', '多版本对比保留'], popular: false },
                { key: 'unlimited', name: '月度无限', price: '¥39.9', oldPrice: '¥199', desc: '一个月不限次数，换工作必备', features: ['30 天无限次优化', '所有岗位方向覆盖', '专属优先通道', '多版本管理', '求职信生成'], popular: true },
              ].map((tier, i) => (
                <div
                  key={tier.key}
                  className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    tier.popular
                      ? 'border-blue-500 bg-white shadow-lg shadow-blue-200/30 scale-[1.02] sm:scale-105'
                      : 'border-gray-100 bg-white hover:border-blue-200'
                  }`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                      最受欢迎 🏆
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">{tier.desc}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold gradient-text">{tier.price}</span>
                    <span className="text-sm text-gray-400 line-through">{tier.oldPrice}</span>
                  </div>
                  <ul className="mt-4 flex-1 space-y-2.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setSelectedTier(tier.key)}
                    className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-95 ${
                      tier.popular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                        : 'border-2 border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-400'
                    } ${selectedTier === tier.key ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                  >
                    {selectedTier === tier.key ? '已选择 ✓' : '选择此套餐'}
                  </button>
                </div>
              ))}
            </div>

            {/* 收款码 */}
            {qr && (
              <div className="mt-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white p-4 shadow-xl sm:p-6 lg:p-8 animate-scale-in">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col items-center justify-center">
                    <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-2 shadow-md sm:p-3 transition-transform hover:scale-[1.02]">
                      <Image src={qr.src} alt={`微信收款码 ${qr.price}`} width={240} height={240} className="h-auto w-48 sm:w-56" priority />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-700">{qr.label} · {qr.price}</p>
                  </div>
                  <div className="flex flex-col justify-center space-y-3 text-sm">
                    <h4 className="text-base font-bold text-gray-900">📱 微信扫码支付</h4>
                    <div className="space-y-2 text-gray-600">
                      <p>① 截图或长按识别二维码 → 支付 <b>{qr.price}</b></p>
                      <p>② 付款备注填写简历 ID</p>
                      <p>③ 管理员确认后自动解锁</p>
                    </div>
                    <Link href={`/upload?tier=${selectedTier}`} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                      📤 上传简历，开始优化
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== 信任标识 ==================== */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4" ref={setRef('trust')}>
          <div className={`transition-all duration-700 delay-100 ${visibleSections.trust ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">为什么值得信赖</h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">真实数据，无需编造</p>

            {/* 数字墙 */}
            <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-8">
              {[
                { num: '10,000+', label: '简历已优化' },
                { num: '98%', label: '用户满意度' },
                { num: '3 min', label: '平均出稿速度' },
              ].map((s, i) => (
                <div key={s.label} className="text-center group" style={{ animationDelay: `${i * 0.15}s` }}>
                  <p className="text-3xl sm:text-4xl font-extrabold gradient-text">{s.num}</p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Logo 墙 */}
            <div className="mt-12 rounded-2xl border border-gray-100 bg-gray-50 p-6 sm:p-8">
              <p className="text-center text-xs font-medium text-gray-400 mb-6">技术驱动 &amp; 平台支持</p>
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-60 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm sm:text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 text-xs font-bold">DS</span>
                  DeepSeek AI
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm sm:text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white text-xs font-bold">▲</span>
                  Vercel
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm sm:text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">TS</span>
                  TypeScript
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm sm:text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700 text-xs font-bold">▲</span>
                  Next.js
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm sm:text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">🔒</span>
                  数据加密
                </div>
              </div>
            </div>

            {/* 承诺 */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: '🔄', text: '不满意可重新优化' },
                { icon: '🔒', text: '数据 24h 自动删除' },
                { icon: '🆓', text: '30% 预览免费看' },
              ].map((p) => (
                <div key={p.text} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{p.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 真实用户评价 ==================== */}
      {feedback.length > 0 && (
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">用户真实评价</h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">来自真实用户的反馈</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {feedback.slice(0, 3).map((f, i) => (
                <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
                  <div className="flex gap-0.5 text-yellow-400">
                    {Array.from({ length: f.rating }).map((_, si) => (
                      <svg key={si} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">&ldquo;{f.content}&rdquo;</p>
                  <p className="mt-3 text-xs font-medium text-gray-800">{f.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== FAQ ==================== */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4" ref={setRef('faq')}>
          <div className={`transition-all duration-700 delay-100 ${visibleSections.faq ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">常见问题</h2>
            <div className="mt-8 space-y-3">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-gray-200 bg-white transition-all hover:border-gray-300 [&[open]]:border-blue-200 [&[open]]:shadow-md">
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <svg className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-600 leading-relaxed animate-fade-in-up">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 底部 CTA ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-16">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 text-center relative">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">准备好让简历脱颖而出了吗？</h2>
          <p className="mt-3 text-sm text-blue-100 sm:text-base">¥9.9 起，3 分钟出稿，不满意可重来</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/upload" className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-blue-700 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
              立即开始
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-900 py-8 text-center text-xs text-gray-500">
        <p className="text-sm font-semibold text-gray-400">简小优 · AI 简历优化</p>
        <p className="mt-2">© {new Date().getFullYear()} · 所有简历数据加密存储，隐私安全保护</p>
        <p className="mt-1">¥9.9 起 · 不满意可重新优化</p>
      </footer>
    </div>
  );
}

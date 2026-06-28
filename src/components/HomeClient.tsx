'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import InviteSection from './InviteSection';
import Hero3D from './Hero3D';
import TiltCard from './TiltCard';
import TypewriterText from './TypewriterText';
import { motion } from 'framer-motion';

const QR_MAP: Record<string, { src: string; price: string; label: string }> = {
  single: { src: '/qr-pay.jpg', price: '楼9.9', label: '鍗曟浼樺寲' },
  pack5: { src: '/qr-pay.jpg', price: '楼29.9', label: '5娆″椁? },
  unlimited: { src: '/qr-pay.jpg', price: '楼39.9', label: '鏈堝害鏃犻檺' },
};

const FEATURES = [
  { icon: '馃幆', title: 'ATS 鏅鸿兘鍖归厤', desc: '鑷姩鍒嗘瀽宀椾綅鎻忚堪锛岀簿鍑嗗尮閰嶈涓氬叧閿瘝' },
  { icon: '馃殌', title: '3 鍒嗛挓鍑虹粨鏋?, desc: '涓婁紶绠€鍘嗗悗 AI 鑷姩浼樺寲锛屾棤闇€绛夊緟' },
  { icon: '馃搳', title: '30% 棰勮鍏嶈垂', desc: '鍏堢湅浼樺寲鏁堟灉锛屾弧鎰忓啀浠樻' },
  { icon: '馃敀', title: '鏁版嵁瀹夊叏鍔犲瘑', desc: '绠€鍘嗘暟鎹姞瀵嗗瓨鍌紝闅愮鏃犲咖' },
];

const FAQS = [
  { q: '浼樺寲鍚庤兘鐩存帴鎶曢€掑悧锛?, a: '鍙互锛佷紭鍖栧悗鐨勭畝鍘嗙鍚?ATS 绯荤粺鏍囧噯鏍煎紡锛孒R 闃呰浣撻獙澶у箙鎻愬崌锛屽彲鐩存帴鐢ㄤ簬鍚勫ぇ鎷涜仒骞冲彴銆? },
  { q: '鏀寔鍝簺鏂囦欢鏍煎紡锛?, a: '鏀寔 PDF銆丏OCX銆乀XT 鏍煎紡涓婁紶銆傚缓璁娇鐢?PDF 浠ヨ幏寰楁渶浣宠В鏋愭晥鏋溿€? },
  { q: '浼樺寲涓€娆￠渶瑕佸涔咃紵', a: 'AI 浼樺寲涓€鑸湪 1-3 鍒嗛挓鍐呭畬鎴愩€?0% 棰勮鍏嶈垂鏌ョ湅锛屾弧鎰忓悗鏀粯 楼9.9 鍗冲彲瑙ｉ攣瀹屾暣鐗堛€? },
  { q: '鏈夊敭鍚庢敮鎸佸悧锛?, a: '濡傛灉浼樺寲缁撴灉涓嶆弧鎰忥紝鍙互鑱旂郴瀹㈡湇閲嶆柊浼樺寲锛岀洿鑷虫弧鎰忎负姝€? },
];

const DEMO_BEFORE = `鐜嬬
---
鐢佃瘽锛?39-1234-5678 | 閭锛歸anglei@email.com

宸ヤ綔缁忓巻锛?鍦ㄦ煇鏌愮鎶€鏈夐檺鍏徃鎷呬换鍚庣寮€鍙?鍙備笌鍏徃鏍稿績椤圭洰鐨勭爺鍙戝拰缁存姢
鍗忓姪鍥㈤槦瀹屾垚椤圭洰涓婄嚎

鏁欒偛鑳屾櫙锛?鏌?85澶у 璁＄畻鏈虹瀛︿笌鎶€鏈?鏈

鎶€鑳斤細
Java銆丮ySQL銆丼pring Boot`;

const DEMO_AFTER = `鐜嬬
---
鐢佃瘽锛?39-1234-5678 | 閭锛歸anglei@email.com | 3骞村悗绔紑鍙戠粡楠?
宸ヤ綔缁忓巻锛?涓诲鍏徃鏍稿績涓氬姟绯荤粺鐨勬灦鏋勫崌绾э紝鏃ュ潎澶勭悊璇锋眰閲忔彁鍗囪嚦 50 涓?閲嶆瀯璁㈠崟妯″潡锛岀郴缁熷搷搴旀椂闂翠粠 2.3s 闄嶈嚦 0.4s锛岄檷浣?82%
鎵撻€犺嚜鍔ㄥ寲鍗曞厓娴嬭瘯浣撶郴锛屼唬鐮佽鐩栫巼浠?15% 鎻愬崌鑷?85%锛岀嚎涓?Bug 鍑忓皯 60%

鏁欒偛鑳屾櫙锛?鏌?85澶у 璁＄畻鏈虹瀛︿笌鎶€鏈?鏈

鎶€鑳斤細
Java 路 Spring Boot 路 MySQL 路 Redis 路 Docker 路 Git`;

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

  // 婊氬姩鍏ュ満鍔ㄧ敾鎺у埗
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
      {/* ==================== 椤堕儴瀵艰埅 ==================== */}
      <nav className="flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-3">
        <Link href="/" className="text-lg font-bold gradient-text">绠€灏忎紭</Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">鐧诲綍</Link>
          <Link href="/register" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">娉ㄥ唽</Link>
        </div>
      </nav>
      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-[80vh] flex items-center">
        {/* 3D 鑳屾櫙 */}
        <Hero3D />

        {/* 瑁呴グ娴姩鍏冪礌 */}
        <div className="absolute left-[10%] top-[15%] h-32 w-32 rounded-full bg-blue-300/20 blur-2xl animate-float" style={{ animationDelay: '0s', zIndex: 1 }} />
        <div className="absolute right-[15%] top-[40%] h-48 w-48 rounded-full bg-indigo-300/15 blur-3xl animate-float" style={{ animationDelay: '1.5s', zIndex: 1 }} />
        <div className="absolute left-[20%] bottom-[20%] h-24 w-24 rounded-full bg-purple-300/15 blur-2xl animate-float" style={{ animationDelay: '3s', zIndex: 1 }} />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-28" style={{ zIndex: 2 }}>
          {/* 寰界珷 鈥?甯﹂棯鐑?*/}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-medium text-blue-700 animate-fade-in-down">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" /></span>
              10,000+ 鐢ㄦ埛淇¤禆
            </span>
          </div>

          {/* 涓绘爣棰?鈥?娓愬彉 */}
          <h1 className="mx-auto max-w-4xl text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              璁╀綘鐨勭畝鍘?            </span>
            <br />
            鍦?<span className="text-blue-600 relative">3 鍒嗛挓<span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-gradient-to-r from-blue-400 to-purple-400" /></span> 鑴辫儙鎹㈤
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base sm:text-lg text-gray-500 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <TypewriterText text="AI 鏅鸿兘鍒嗘瀽宀椾綅鎻忚堪 鈫?绠€鍘嗗叧閿瘝浼樺寲 鈫?ATS 鏍煎紡閫傞厤" />
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/upload"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200/50 transition-all hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              寮€濮嬩紭鍖栫畝鍘?              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>

          {/* 瑁傚彉鍏ュ彛 */}
          <InviteSection />

          {/* 缁熻鏁板瓧 */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {[
              { num: '10,000+', label: '鏈嶅姟鐢ㄦ埛' },
              { num: '98%', label: '婊℃剰鐜? },
              { num: '3 鍒嗛挓', label: '骞冲潎鍑虹' },
              { num: '500+', label: '鍚堜綔浼佷笟' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/60 p-4 text-center backdrop-blur-sm transition-all hover:bg-white/90 hover:shadow-md card-hover">
                <p className="text-2xl font-bold gradient-text sm:text-3xl">{stat.num}</p>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 瀹炴椂绠€鍘嗙ず渚?==================== */}
      <section className="bg-white py-16 sm:py-20 border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-4" ref={setRef('demo')}>
          <div className={`transition-all duration-700 ${visibleSections.demo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">鐪嬬湅 AI 鏀瑰緱鎬庝箞鏍?/h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">鐐瑰嚮鎸夐挳瀵规瘮浼樺寲鍓嶅悗鐨勫樊寮?/p>

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* 鍒囨崲鏍?*/}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setShowDemo(false)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${!showDemo ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  馃搫 浼樺寲鍓?                </button>
                <button
                  onClick={() => setShowDemo(true)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${showDemo ? 'bg-green-50 text-green-700 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  鉁?浼樺寲鍚?                </button>
              </div>
              {/* 鍐呭 */}
              <div className="p-4 sm:p-6 lg:p-8">
                <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed transition-all duration-500 ${showDemo ? 'text-green-900' : 'text-gray-600'}`}>
                  {showDemo ? DEMO_AFTER : DEMO_BEFORE}
                </pre>
              </div>
              {/* 瀵规瘮鏍囨敞 */}
              {showDemo && (
                <div className="bg-green-50 border-t border-green-100 px-4 sm:px-6 py-3 animate-fade-in-up">
                  <div className="flex flex-wrap gap-2 text-xs text-green-700">
                    <span className="inline-flex items-center gap-1">鉁?閲忓寲鎴愭灉锛堟棩娲?0涓囥€佸搷搴旈檷60%锛?/span>
                    <span className="inline-flex items-center gap-1">鉁?鍔ㄨ瘝椹卞姩锛堜富瀵笺€侀噸鏋勩€佹墦閫狅級</span>
                    <span className="inline-flex items-center gap-1">鉁?鍒犳帀搴熻瘽锛堝幓鎺?璐熻矗/鍙備笌/鍗忓姪"锛?/span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 涓夋娴佺▼ ==================== */}
      <section className="bg-gradient-to-b from-white to-blue-50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4" ref={setRef('steps')}>
          <div className={`transition-all duration-700 delay-100 ${visibleSections.steps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">涓夋鎼炲畾</h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">姣斿啓绠€鍘嗘洿绠€鍗曪紝姣旀ā鏉挎洿鏅鸿兘</p>

            <div className="relative mt-10 grid gap-8 sm:grid-cols-3">
              {/* 杩炴帴绾匡紙妗岄潰绔級 */}
              <div className="absolute left-1/2 top-12 hidden h-0.5 w-[calc(100%-6rem)] -translate-x-1/2 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 sm:block" style={{ width: 'calc(100% - 8rem)' }} />

              {[
                { step: '01', icon: '馃搫', title: '涓婁紶绠€鍘?, desc: '鏀寔 PDF / DOCX / TXT锛屾垨浠庨浂鍒涘缓鏂扮畝鍘?, tag: '鍏嶈垂', tagColor: 'bg-green-500' },
                { step: '02', icon: '馃', title: 'AI 鏅鸿兘浼樺寲', desc: 'DeepSeek AI 鍒嗘瀽绠€鍘嗭紝鍖归厤宀椾綅鍏抽敭璇嶏紝閲忓寲鎴愭灉', tag: '鍏嶈垂', tagColor: 'bg-green-500' },
                { step: '03', icon: '馃摜', title: '棰勮 & 浠樿垂涓嬭浇', desc: '30% 鍏嶈垂棰勮鏁堟灉 鈫?婊℃剰鍚?楼9.9 瑙ｉ攣瀹屾暣 PDF', tag: '楼9.9璧?, tagColor: 'bg-blue-600' },
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
                馃殌 鍏嶈垂寮€濮?鈥?鍏堢湅鏁堟灉鍐嶄粯娆?              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 鏍稿績鍔熻兘 ==================== */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4" ref={setRef('features')}>
          <div className={`transition-all duration-700 delay-100 ${visibleSections.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">涓轰粈涔堥€夌畝灏忎紭锛?/h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">鍥涘ぇ鏍稿績浼樺娍锛岃绠€鍘嗚劚棰栬€屽嚭</p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f, i) => (
                <TiltCard
                  key={f.title}
                  className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-lg hover:-translate-y-1 hover:ring-blue-200"
                  style={{ opacity: visibleSections.features ? 1 : 0, transform: visibleSections.features ? 'translateY(0)' : 'translateY(20px)', transition: `all 0.5s ease ${i * 0.15}s` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-xl transition-transform group-hover:scale-110">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 瀹氫环 ==================== */}
      <section id="pricing" ref={pricingRef} className="bg-gradient-to-b from-white to-blue-50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4" ref={setRef('pricing')}>
          <div className={`transition-all duration-700 ${visibleSections.pricing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">閫夋嫨濂楅</h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">
              鍏堢湅鏁堟灉鍐嶄粯娆撅紝涓嶆弧鎰忓彲閲嶆柊浼樺寲
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { key: 'single', name: '鍗曟浼樺寲', price: '楼9.9', oldPrice: '楼29', desc: '閫傚悎宸叉湁绠€鍘嗭紝鍙渶涓€娆′紭鍖?, features: ['AI 鏅鸿兘浼樺寲鎺緸', 'ATS 鍏抽敭璇嶅尮閰?, '鎴愭灉閲忓寲閲嶅啓', '30% 棰勮鍏嶈垂鐪?, 'TXT / PDF 瀵煎嚭'], popular: false },
                { key: 'pack5', name: '5 娆″椁?, price: '楼29.9', oldPrice: '楼99', desc: '澶氳疆浼樺寲 + 澶氫釜宀椾綅瀹氬埗', features: ['鍚?5 娆′紭鍖栭搴?, '姣忔鍙畾鍒朵笉鍚屽矖浣?, '浼樺厛澶勭悊闃熷垪', '30% 棰勮鍏嶈垂鐪?, '澶氱増鏈姣斾繚鐣?], popular: false },
                { key: 'unlimited', name: '鏈堝害鏃犻檺', price: '楼39.9', oldPrice: '楼199', desc: '涓€涓湀涓嶉檺娆℃暟锛屾崲宸ヤ綔蹇呭', features: ['30 澶╂棤闄愭浼樺寲', '鎵€鏈夊矖浣嶆柟鍚戣鐩?, '涓撳睘浼樺厛閫氶亾', '澶氱増鏈鐞?, '姹傝亴淇＄敓鎴?], popular: true },
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
                      鏈€鍙楁杩?馃弳
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
                    {selectedTier === tier.key ? '宸查€夋嫨 鉁? : '閫夋嫨姝ゅ椁?}
                  </button>
                </div>
              ))}
            </div>

            {/* 鏀舵鐮?*/}
            {qr && (
              <div className="mt-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white p-4 shadow-xl sm:p-6 lg:p-8 animate-scale-in">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col items-center justify-center">
                    <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-2 shadow-md sm:p-3 transition-transform hover:scale-[1.02]">
                      <Image src={qr.src} alt={`寰俊鏀舵鐮?${qr.price}`} width={240} height={240} className="h-auto w-48 sm:w-56" priority />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-700">{qr.label} 路 {qr.price}</p>
                  </div>
                  <div className="flex flex-col justify-center space-y-3 text-sm">
                    <h4 className="text-base font-bold text-gray-900">馃摫 寰俊鎵爜鏀粯</h4>
                    <div className="space-y-2 text-gray-600">
                      <p>鈶?鎴浘鎴栭暱鎸夎瘑鍒簩缁寸爜 鈫?鏀粯 <b>{qr.price}</b></p>
                      <p>鈶?浠樻澶囨敞濉啓绠€鍘?ID</p>
                      <p>鈶?绠＄悊鍛樼‘璁ゅ悗鑷姩瑙ｉ攣</p>
                    </div>
                    <Link href={`/upload?tier=${selectedTier}`} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                      馃摛 涓婁紶绠€鍘嗭紝寮€濮嬩紭鍖?                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== 淇′换鏍囪瘑 ==================== */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4" ref={setRef('trust')}>
          <div className={`transition-all duration-700 delay-100 ${visibleSections.trust ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">涓轰粈涔堝€煎緱淇¤禆</h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">鐪熷疄鏁版嵁锛屾棤闇€缂栭€?/p>

            {/* 鏁板瓧澧?*/}
            <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-8">
              {[
                { num: '10,000+', label: '绠€鍘嗗凡浼樺寲' },
                { num: '98%', label: '鐢ㄦ埛婊℃剰搴? },
                { num: '3 min', label: '骞冲潎鍑虹閫熷害' },
              ].map((s, i) => (
                <div key={s.label} className="text-center group" style={{ animationDelay: `${i * 0.15}s` }}>
                  <p className="text-3xl sm:text-4xl font-extrabold gradient-text">{s.num}</p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Logo 澧?*/}
            <div className="mt-12 rounded-2xl border border-gray-100 bg-gray-50 p-6 sm:p-8">
              <p className="text-center text-xs font-medium text-gray-400 mb-6">鎶€鏈┍鍔?&amp; 骞冲彴鏀寔</p>
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-60 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm sm:text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 text-xs font-bold">DS</span>
                  DeepSeek AI
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm sm:text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white text-xs font-bold">鈻?/span>
                  Vercel
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm sm:text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">TS</span>
                  TypeScript
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm sm:text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700 text-xs font-bold">鈻?/span>
                  Next.js
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm sm:text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">馃敀</span>
                  鏁版嵁鍔犲瘑
                </div>
              </div>
            </div>

            {/* 鎵胯 */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: '馃攧', text: '涓嶆弧鎰忓彲閲嶆柊浼樺寲' },
                { icon: '馃敀', text: '鏁版嵁 24h 鑷姩鍒犻櫎' },
                { icon: '馃啌', text: '30% 棰勮鍏嶈垂鐪? },
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

      {/* ==================== 鐪熷疄鐢ㄦ埛璇勪环 ==================== */}
      {feedback.length > 0 && (
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">鐢ㄦ埛鐪熷疄璇勪环</h2>
            <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">鏉ヨ嚜鐪熷疄鐢ㄦ埛鐨勫弽棣?/p>
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
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">甯歌闂</h2>
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

      {/* ==================== 搴曢儴 CTA ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-16">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 text-center relative">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">鍑嗗濂借绠€鍘嗚劚棰栬€屽嚭浜嗗悧锛?/h2>
          <p className="mt-3 text-sm text-blue-100 sm:text-base">楼9.9 璧凤紝3 鍒嗛挓鍑虹锛屼笉婊℃剰鍙噸鏉?/p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/upload" className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-blue-700 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
              绔嬪嵆寮€濮?              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 椤佃剼 */}
      <footer className="bg-gray-900 py-8 text-center text-xs text-gray-500">
        <p className="text-sm font-semibold text-gray-400">绠€灏忎紭 路 AI 绠€鍘嗕紭鍖?/p>
        <p className="mt-2">漏 {new Date().getFullYear()} 路 鎵€鏈夌畝鍘嗘暟鎹姞瀵嗗瓨鍌紝闅愮瀹夊叏淇濇姢</p>
        <p className="mt-1">楼9.9 璧?路 涓嶆弧鎰忓彲閲嶆柊浼樺寲</p>
      </footer>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ResumeData {
  name: string;
  phone: string;
  email: string;
  location: string;
  photo: string;
  summary: string;
  targetPosition: string;
  education: { school: string; degree: string; major: string; start: string; end: string }[];
  skills: string[];
  experience: { company: string; role: string; start: string; end: string; desc: string }[];
}

const TEMPLATES = [
  { id: 'classic', name: '经典单栏', desc: '简约大方，适合所有岗位' },
  { id: 'modern', name: '现代简洁', desc: '清爽留白，适合互联网/设计' },
  { id: 'tech', name: '技术简约', desc: '技能突出，适合技术岗' },
  { id: 'redline', name: '红框时间轴', desc: '稳重专业，适合管理岗' },
  { id: 'timeline', name: '蓝边时间轴', desc: '突出时间线，适合经历丰富的' },
];

const INITIAL: ResumeData = {
  name: '', phone: '', email: '', location: '', photo: '',
  summary: '', targetPosition: '',
  education: [{ school: '', degree: '', major: '', start: '', end: '' }],
  skills: [],
  experience: [{ company: '', role: '', start: '', end: '', desc: '' }],
};

export default function CreatePage() {
  const router = useRouter();
  const [data, setData] = useState<ResumeData>({ ...INITIAL });
  const [template, setTemplate] = useState('classic');
  const [skillInput, setSkillInput] = useState('');
  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfExporting, setPdfExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const update = (field: keyof ResumeData, value: unknown) => setData({ ...data, [field]: value });

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !data.skills.includes(s)) {
      setData({ ...data, skills: [...data.skills, s] });
      setSkillInput('');
    }
  };
  const removeSkill = (s: string) => setData({ ...data, skills: data.skills.filter((x) => x !== s) });

  const addEducation = () => setData({ ...data, education: [...data.education, { school: '', degree: '', major: '', start: '', end: '' }] });
  const updateEducation = (i: number, f: string, v: string) => {
    const edu = [...data.education];
    edu[i] = { ...edu[i], [f]: v };
    setData({ ...data, education: edu });
  };
  const removeEducation = (i: number) => {
    if (data.education.length > 1) setData({ ...data, education: data.education.filter((_, idx) => idx !== i) });
  };

  const addExperience = () => setData({ ...data, experience: [...data.experience, { company: '', role: '', start: '', end: '', desc: '' }] });
  const updateExperience = (i: number, f: string, v: string) => {
    const exp = [...data.experience];
    exp[i] = { ...exp[i], [f]: v };
    setData({ ...data, experience: exp });
  };
  const removeExperience = (i: number) => {
    if (data.experience.length > 1) setData({ ...data, experience: data.experience.filter((_, idx) => idx !== i) });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => { setData({ ...data, photo: reader.result as string }); };
    reader.readAsDataURL(file);
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    setPdfExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
      const el = previewRef.current;
      // 先克隆元素并去除高度限制
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.width = '800px';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', width: 800 });
      document.body.removeChild(clone);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = 210;
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pageH = 297; // A4 height in mm
      let pos = 0;
      let page = 0;

      while (pos < pdfH) {
        if (page > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -pos, pdfW, pdfH);
        pos += pageH;
        page++;
      }

      pdf.save(`${data.name || '简历'}.pdf`);
    } catch { /* ignore */ }
    setPdfExporting(false);
  };

  const handleGenerate = async () => {
    const text = rawMode
      ? rawText
      : [
          data.name && `姓名：${data.name}`,
          data.targetPosition && `目标职位：${data.targetPosition}`,
          data.phone && `电话：${data.phone}`,
          data.email && `邮箱：${data.email}`,
          data.location && `所在地：${data.location}`,
          data.summary && `个人简介：${data.summary}`,
          data.education.filter(e => e.school).map((e) => `教育经历：${e.school} ${e.degree} ${e.major} ${e.start}-${e.end}`).join('\n'),
          data.skills.length > 0 && `技能：${data.skills.join(', ')}`,
          data.experience.filter(e => e.company).map((e) => `工作经历：${e.company} ${e.role} ${e.start}-${e.end}\n${e.desc}`).join('\n'),
        ].filter(Boolean).join('\n\n');

    if (!text || text.replace(/\s/g, '').length < 10) return setError('请至少填写一些信息');

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ info: text, targetPosition: data.targetPosition || undefined }),
      });
      const json = await res.json();
      if (!json.success || !json.data?.id) return setError(json.error || '生成失败');
      router.push(`/result/${json.data.id}?tier=single&from=create`);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const previewData = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">创建简历</h1>
        <p className="mt-1 text-sm text-gray-500">填写信息 → 选择模板 → 实时预览 → 导出</p>
      </div>

      {/* 模板选择 */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTemplate(t.id)}
            className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
              template === t.id
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className="block font-semibold">{t.name}</span>
            <span className="block text-[10px] text-gray-400">{t.desc}</span>
          </button>
        ))}
        <button
          onClick={() => { setRawMode(!rawMode); setError(''); }}
          className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
            rawMode ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          {rawMode ? '📝 结构化模式' : '✏️ 自由输入模式'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ====== 左侧：编辑区 ====== */}
        <div className="space-y-4">
          {rawMode ? (
            /* 自由输入模式 */
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">随便写你的经历</label>
              {/* 自由模式照片上传 */}
              <div className="mb-3">
                <label className="relative inline-flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors">
                  {data.photo ? (
                    <img src={data.photo} alt="照片" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl text-gray-300">📷</span>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 cursor-pointer opacity-0" title="上传照片" />
                </label>
                {data.photo && <button onClick={() => update('photo', '')} className="ml-2 text-[10px] text-red-400 hover:text-red-600">移除照片</button>}
                <span className="ml-2 text-[10px] text-gray-400">（选填，证件照）</span>
              </div>
              <textarea
                rows={20}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              placeholder={`我叫张三，电话138xxxx，南京大学计算机专业...
会Java、Spring、MySQL...
在某某公司实习过...`}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
              />
              <button
                onClick={handleGenerate}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                disabled={loading}
              >
                {loading ? '🤖 AI 生成中…' : '✨ AI 生成简历'}
              </button>
            </div>
          ) : (
            /* 结构化模式 */
            <>
              {/* 基本信息 */}
              <Section title="📋 基本信息">
                <div className="flex gap-4 mb-3">
                  {/* 照片上传 */}
                  <div className="flex-shrink-0">
                    <label className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors group">
                      {data.photo ? (
                        <img src={data.photo} alt="照片" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl text-gray-300 group-hover:text-blue-400">📷</span>
                      )}
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 cursor-pointer opacity-0" title="上传照片" />
                    </label>
                    {data.photo && (
                      <button onClick={() => update('photo', '')} className="mt-1 w-full text-center text-[10px] text-red-400 hover:text-red-600">移除</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                  <Input label="姓名" value={data.name} onChange={(v) => update('name', v)} />
                  <Input label="目标职位" value={data.targetPosition} onChange={(v) => update('targetPosition', v)} />
                  <Input label="电话" value={data.phone} onChange={(v) => update('phone', v)} />
                  <Input label="邮箱" value={data.email} onChange={(v) => update('email', v)} />
                  <Input label="所在地" value={data.location} onChange={(v) => update('location', v)} />
                </div>
                </div>
              </Section>

              {/* 个人简介 */}
              <Section title="✍️ 个人简介">
                <textarea
                  value={data.summary}
                  onChange={(e) => update('summary', e.target.value)}
                  rows={3}
                  placeholder="专业背景、技能特长、职业目标…"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
                />
              </Section>

              {/* 教育背景 */}
              <Section title="🎓 教育背景">
                {data.education.map((edu, i) => (
                  <div key={i} className="relative rounded-lg border border-gray-100 bg-gray-50 p-3 mb-2">
                    <button onClick={() => removeEducation(i)} className="absolute right-2 top-2 text-xs text-red-400 hover:text-red-600">✕</button>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="学校" value={edu.school} onChange={(v) => updateEducation(i, 'school', v)} />
                      <Input label="学位" value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} />
                      <Input label="专业" value={edu.major} onChange={(v) => updateEducation(i, 'major', v)} />
                      <div className="grid grid-cols-2 gap-1">
                        <Input label="开始" value={edu.start} onChange={(v) => updateEducation(i, 'start', v)} />
                        <Input label="结束" value={edu.end} onChange={(v) => updateEducation(i, 'end', v)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addEducation} className="text-xs text-blue-600 hover:text-blue-800">+ 添加教育经历</button>
              </Section>

              {/* 专业技能 */}
              <Section title="🛠 专业技能">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {data.skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {s}
                      <button onClick={() => removeSkill(s)} className="text-blue-400 hover:text-blue-600">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="输入技能后按回车添加"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <button onClick={addSkill} className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700">添加</button>
                </div>
              </Section>

              {/* 工作/项目经历 */}
              <Section title="💼 工作/项目经历">
                {data.experience.map((exp, i) => (
                  <div key={i} className="relative rounded-lg border border-gray-100 bg-gray-50 p-3 mb-2">
                    <button onClick={() => removeExperience(i)} className="absolute right-2 top-2 text-xs text-red-400 hover:text-red-600">✕</button>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Input label="公司/项目" value={exp.company} onChange={(v) => updateExperience(i, 'company', v)} />
                      <Input label="职位" value={exp.role} onChange={(v) => updateExperience(i, 'role', v)} />
                      <Input label="开始" value={exp.start} onChange={(v) => updateExperience(i, 'start', v)} />
                      <Input label="结束" value={exp.end} onChange={(v) => updateExperience(i, 'end', v)} />
                    </div>
                    <textarea
                      value={exp.desc}
                      onChange={(e) => updateExperience(i, 'desc', e.target.value)}
                      rows={3}
                      placeholder="工作职责、成果、亮点…"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
                    />
                  </div>
                ))}
                <button onClick={addExperience} className="text-xs text-blue-600 hover:text-blue-800">+ 添加工作经历</button>
              </Section>

              {/* AI 生成按钮 */}
              {!rawMode && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? '🤖 AI 正在生成…' : '✨ AI 优化并生成简历'}
                </button>
              )}
            </>
          )}

          {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

          <p className="text-center text-xs text-gray-400">
            已有简历？
            <Link href="/upload" className="text-blue-600 hover:underline ml-1">去上传优化</Link>
          </p>
        </div>

        {/* ====== 右侧：实时预览 ====== */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">📄 实时预览</span>
            <span className="text-[10px] text-gray-400">{TEMPLATES.find((t) => t.id === template)?.name}</span>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div ref={previewRef} className="aspect-[210/297] max-h-[800px] overflow-y-auto p-4 sm:p-6 bg-white">
              <ResumePreview data={previewData} template={template} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleDownloadPdf} disabled={pdfExporting} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-all">
              {pdfExporting ? '⏳ 导出中…' : '📥 下载 PDF 简历'}
            </button>
            <button onClick={handleGenerate} disabled={loading} className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
              {loading ? '⏳ 生成中…' : '✨ AI 生成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====== 子组件 ====== */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
    </div>
  );
}

/* ====== 简历预览组件 ====== */

function ResumePreview({ data, template }: { data: ResumeData; template: string }) {
  if (!data.name && !data.summary && data.skills.length === 0 && !data.experience[0]?.company) {
    return (
      <div className="flex h-48 items-center justify-center text-center text-gray-300 text-xs">
        填写左侧信息<br />实时预览简历效果
      </div>
    );
  }

  const baseStyle = 'font-sans text-xs leading-relaxed text-gray-800';

  if (template === 'modern') {
    return (
      <div className={`${baseStyle} p-2`}>
        {data.photo && <img src={data.photo} alt="" className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />}
        <h1 className="text-lg font-bold text-center text-gray-900">{data.name || '（姓名）'}</h1>
        <p className="text-center text-[10px] text-blue-600">{data.targetPosition}</p>
        <p className="text-center text-[9px] text-gray-400">{[data.phone, data.email, data.location].filter(Boolean).join(' | ')}</p>
        {data.summary && <p className="mt-2 text-[10px] text-gray-600 leading-relaxed">{data.summary}</p>}
        <div className="mt-3 border-t border-gray-100 pt-2">
          <p className="font-semibold text-gray-700 mb-1 text-[10px]">教育经历</p>
          {data.education.map((e, i) => e.school && <p key={i} className="text-[10px] text-gray-600">{e.school} · {e.major} · {e.start}-{e.end}</p>)}
        </div>
        {data.skills.length > 0 && (
          <div className="mt-2 border-t border-gray-100 pt-2">
            <p className="font-semibold text-gray-700 mb-1 text-[10px]">专业技能</p>
            <div className="flex flex-wrap gap-1">{data.skills.map((s, i) => <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-[9px] text-gray-600">{s}</span>)}</div>
          </div>
        )}
        {data.experience[0]?.company && (
          <div className="mt-2 border-t border-gray-100 pt-2">
            <p className="font-semibold text-gray-700 mb-1 text-[10px]">工作经历</p>
            {data.experience.map((e, i) => e.company && (
              <div key={i} className="mb-2">
                <p className="text-[10px] font-semibold text-gray-800">{e.company} <span className="font-normal text-gray-400">· {e.role}</span></p>
                <p className="text-[9px] text-gray-400">{e.start}-{e.end}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{e.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (template === 'tech') {
    return (
      <div className={`${baseStyle} p-2`}>
        {/* 头部蓝色区块 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 -mx-2 -mt-2 p-4 mb-3 rounded-t-xl text-white">
          <div className="flex items-center gap-3">
            {data.photo && <img src={data.photo} alt="" className="w-14 h-14 rounded-full border-2 border-white/60 object-cover flex-shrink-0" />}
            <div>
              <h1 className="text-lg font-bold">{data.name || '（姓名）'}</h1>
              <p className="text-[10px] text-blue-100">{data.targetPosition}</p>
              <p className="text-[8px] text-blue-200 mt-0.5">{[data.phone, data.email, data.location].filter(Boolean).join(' | ')}</p>
            </div>
          </div>
        </div>
        {data.summary && <p className="mb-2 text-[10px] text-gray-600 leading-relaxed">{data.summary}</p>}
        <div className="mb-2 grid grid-cols-2 gap-2">
          <div>
            <h2 className="text-[9px] font-bold text-blue-700 uppercase tracking-wider mb-1">技能</h2>
            <div className="flex flex-wrap gap-1">{data.skills.map((s,i) => <span key={i} className="rounded bg-blue-50 px-2 py-0.5 text-[8px] font-medium text-blue-700">{s}</span>)}</div>
          </div>
          <div>
            <h2 className="text-[9px] font-bold text-blue-700 uppercase tracking-wider mb-1">教育</h2>
            {data.education.map((e,i) => e.school && <p key={i} className="text-[9px] text-gray-600">{e.school}<br/><span className="text-[8px] text-gray-400">{e.major} · {e.start}-{e.end}</span></p>)}
          </div>
        </div>
        {data.experience[0]?.company && (
          <div className="border-t border-gray-100 pt-2">
            <h2 className="text-[9px] font-bold text-blue-700 uppercase tracking-wider mb-1">工作经历</h2>
            {data.experience.map((e,i) => e.company && (
              <div key={i} className="mb-1.5 pb-1.5 border-b border-gray-50 last:border-0">
                <p className="text-[9px] font-semibold text-gray-800">{e.role} · {e.company} <span className="font-normal text-gray-400 text-[8px]">({e.start}-{e.end})</span></p>
                <p className="text-[9px] text-gray-600 mt-0.5">{e.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (template === 'redline') {
    return (
      <div className={`${baseStyle} p-2`}>
        <div className="border-l-4 border-red-500 pl-3 mb-3">
          <div className="flex items-center gap-3">
            {data.photo && <img src={data.photo} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
            <div>
              <h1 className="text-lg font-bold text-gray-900">{data.name || '（姓名）'}</h1>
              <p className="text-[10px] text-red-600 font-medium">{data.targetPosition}</p>
              <p className="text-[8px] text-gray-400">{[data.phone, data.email, data.location].filter(Boolean).join(' | ')}</p>
            </div>
          </div>
        </div>
        {data.summary && <p className="mb-2 text-[9px] text-gray-600 italic border-l-2 border-gray-200 pl-2">"{data.summary}"</p>}
        <div className="mb-2 grid grid-cols-2 gap-2">
          <div>
            <h2 className="text-[9px] font-bold text-gray-700 border-b border-red-200 pb-0.5 mb-1">教育背景</h2>
            {data.education.map((e,i) => e.school && <p key={i} className="text-[9px] text-gray-600">{e.school} · {e.major} ({e.start}-{e.end})</p>)}
          </div>
          <div>
            <h2 className="text-[9px] font-bold text-gray-700 border-b border-red-200 pb-0.5 mb-1">技能</h2>
            <div className="flex flex-wrap gap-1">{data.skills.map((s,i) => <span key={i} className="rounded-sm border border-red-200 px-1.5 py-0.5 text-[8px] text-red-700">{s}</span>)}</div>
          </div>
        </div>
        {data.experience[0]?.company && (
          <div>
            <h2 className="text-[9px] font-bold text-gray-700 border-b border-red-200 pb-0.5 mb-1">工作经历</h2>
            {data.experience.map((e,i) => e.company && (
              <div key={i} className="mb-2 relative pl-3 border-l border-red-200">
                <div className="absolute -left-[3px] top-1 h-1.5 w-1.5 rounded-full bg-red-400" />
                <p className="text-[9px] font-semibold text-gray-800">{e.role}，{e.company}</p>
                <p className="text-[8px] text-gray-400">{e.start}-{e.end}</p>
                <p className="text-[9px] text-gray-600">{e.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (template === 'timeline') {
    return (
      <div className={`${baseStyle} p-2`}>
        <h1 className="text-lg font-bold text-gray-900">{data.name || '（姓名）'}</h1>
        <p className="text-xs text-blue-600">{data.targetPosition}</p>
        <p className="text-[10px] text-gray-400">{[data.phone, data.email, data.location].filter(Boolean).join(' | ')}</p>
        {data.summary && <p className="mt-2 text-[10px] text-gray-600 italic">"{data.summary}"</p>}
        <div className="mt-3 space-y-3">
          {data.education.map((e, i) => e.school && (
            <div key={i} className="relative pl-3 border-l-2 border-blue-300">
              <div className="absolute -left-[4.5px] top-0.5 h-2 w-2 rounded-full bg-blue-400" />
              <p className="text-[10px] font-semibold text-gray-800">{e.school}</p>
              <p className="text-[9px] text-gray-500">{e.major} · {e.degree} · {e.start}-{e.end}</p>
            </div>
          ))}
        </div>
        {data.skills.length > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-2">
            <p className="font-semibold text-gray-700 mb-1 text-[10px]">技能</p>
            <div className="flex flex-wrap gap-1">{data.skills.map((s, i) => <span key={i} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] text-blue-600">{s}</span>)}</div>
          </div>
        )}
        {data.experience[0]?.company && (
          <div className="mt-3 border-t border-gray-100 pt-2 space-y-3">
            <p className="font-semibold text-gray-700 text-[10px]">工作经历</p>
            {data.experience.map((e, i) => e.company && (
              <div key={i} className="relative pl-3 border-l-2 border-blue-300">
                <div className="absolute -left-[4.5px] top-0.5 h-2 w-2 rounded-full bg-blue-400" />
                <p className="text-[10px] font-semibold text-gray-800">{e.role} @ {e.company}</p>
                <p className="text-[9px] text-gray-400">{e.start} - {e.end}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{e.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Classic template (default)
  return (
    <div className={`${baseStyle} p-2`}>
      <div className="border-b-2 border-gray-800 pb-2 mb-2">
        <h1 className="text-xl font-bold text-gray-900">{data.name || '（姓名）'}</h1>
        <p className="text-xs text-blue-600">{data.targetPosition}</p>
        <p className="text-[10px] text-gray-400">{[data.phone, data.email, data.location].filter(Boolean).join(' | ')}</p>
      </div>
      {data.summary && <p className="mb-2 text-[10px] text-gray-600 leading-relaxed">{data.summary}</p>}
      <div className="mb-2">
        <h2 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-0.5 mb-1">教育经历</h2>
        {data.education.map((e, i) => e.school && <p key={i} className="text-[10px] text-gray-600">{e.school} — {e.major}（{e.start}-{e.end}）</p>)}
      </div>
      {data.skills.length > 0 && (
        <div className="mb-2">
          <h2 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-0.5 mb-1">专业技能</h2>
          <p className="text-[10px] text-gray-600">{data.skills.join('、')}</p>
        </div>
      )}
      {data.experience[0]?.company && (
        <div>
          <h2 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-0.5 mb-1">工作经历</h2>
          {data.experience.map((e, i) => e.company && (
            <div key={i} className="mb-1.5">
              <p className="text-[10px] font-semibold text-gray-800">{e.role}，{e.company} <span className="font-normal text-gray-400">({e.start}-{e.end})</span></p>
              <p className="text-[10px] text-gray-600">{e.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

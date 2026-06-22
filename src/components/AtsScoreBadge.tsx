import type { KeywordMatch } from '@/types';

export default function AtsScoreBadge({ match }: { match: KeywordMatch }) {
  const { coverageScore, matched, missing } = match;

  const getColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 50) return 'yellow';
    return 'red';
  };

  const color = getColor(coverageScore);
  const colorClasses = {
    green: {
      bg: 'bg-green-50 border-green-200',
      bar: 'bg-green-500',
      text: 'text-green-700',
      accent: 'text-green-600',
      ring: 'ring-green-500/20',
    },
    yellow: {
      bg: 'bg-yellow-50 border-yellow-200',
      bar: 'bg-yellow-500',
      text: 'text-yellow-700',
      accent: 'text-yellow-600',
      ring: 'ring-yellow-500/20',
    },
    red: {
      bg: 'bg-red-50 border-red-200',
      bar: 'bg-red-500',
      text: 'text-red-700',
      accent: 'text-red-600',
      ring: 'ring-red-500/20',
    },
  };

  const cls = colorClasses[color];

  return (
    <div className={`rounded-xl border ${cls.bg} p-4 sm:p-5`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* 左侧：评分环 */}
        <div className="flex items-center gap-4">
          <div className={`relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full ring-2 ${cls.ring}`}>
            <span className={`text-lg font-bold ${cls.text}`}>{coverageScore}</span>
          </div>
          <div>
            <p className={`text-sm font-semibold ${cls.text}`}>ATS 关键词匹配度</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {coverageScore >= 80
                ? '简历与岗位匹配度高，竞争力强'
                : coverageScore >= 50
                  ? '部分关键词匹配，建议补充缺失内容'
                  : '关键词覆盖不足，AI 优化后可大幅提升'}
            </p>
          </div>
        </div>

        {/* 右侧：关键词列表 */}
        <div className="flex-1 space-y-2 sm:max-w-md">
          {matched.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 mb-1">✅ 已匹配关键词</p>
              <div className="flex flex-wrap gap-1">
                {matched.map((k) => (
                  <span key={k} className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-medium text-green-700">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-600 mb-1">⚠️ 缺失关键词（AI 优化后已自动补充）</p>
              <div className="flex flex-wrap gap-1">
                {missing.map((k) => (
                  <span key={k} className="inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-medium text-red-600 line-through decoration-red-300">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

# resume-optimizer

简历优化工具 — 上传简历，AI 分析并优化。

## 技术栈
- **框架**: Next.js 16.2 + React 19 + TypeScript
- **样式**: Tailwind CSS 4
- **AI**: OpenAI SDK v6
- **PDF 处理**: pdf-parse + pdfjs-dist + mammoth (DOCX)
- **导出**: jspdf + html2canvas
- **数据库**: better-sqlite3
- **部署**: Vercel (vercel CLI)

## 目录结构
```
src/              → 页面 & API Routes
data/             → 本地数据
public/           → 静态资源
.next/            → 构建输出
.vercel/          → Vercel 配置
```

## 命令
```bash
npm run dev      # 开发服务器
npm run build    # 构建
npm run lint     # ESLint
```

## 关键文件
- `.env.local` / `.env.example` — 环境变量（含 OpenAI API Key）
- `PROJECT.md` — 项目详细说明
- `CLAUDE.md` — Claude 上下文

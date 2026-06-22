# 简小优 — AI简历优化网站

## 这是什么
简小优是一个 AI 简历优化 SaaS 网站。
用户上传简历 → AI 改写优化 → 扫码支付 ¥9.9~49.9 → 下载优化版（PDF/TXT）。

- 网址：https://resume-optimizer-ecru.vercel.app
- 管理后台：/admin（密码见 .env.local 的 ADMIN_PASSWORD）
- 部署：Vercel（国外服务器，国内可能被墙，需要绑域名解决）
- AI：DeepSeek API

## 技术栈
Next.js 16 (App Router) + TypeScript + Tailwind CSS + SQLite (better-sqlite3) + DeepSeek API

## 用户流程
访问首页 → 选套餐（¥9.9/¥29.9/¥49.9）→ 弹收款码 OR 点"免费试用"先上传
→ 上传简历（PDF/DOCX/TXT）→ AI优化 → 30%预览（pending_payment）
→ 扫码支付（备注填简历ID）→ 每5秒自动轮询检测支付状态
→ 管理员在 /admin 确认 → 状态变 paid → 用户看完整版 → 下载PDF/TXT

## 支付逻辑（微信个人收款码，非Stripe）
1. 用户扫码付钱，微信备注写简历ID前8位
2. 管理员打开 /admin → 输密码 → 点"确认"
3. 数据库 status: pending → pending_payment → paid
4. 用户端每5秒轮询 /api/result，检测到paid自动刷新

## 收款码文件
public/qr-pay.jpg — ¥9.9
public/qr-pay-5.jpg — ¥29.9
public/qr-pay-month.jpg — ¥49.9

## 核心文件
src/app/page.tsx                  — 首页（Server组件 + JSON-LD + HomeClient）
src/components/HomeClient.tsx      — 首页客户端内容（定价卡片+收款码弹窗）
src/app/upload/page.tsx            — 上传页（Suspense包裹）
src/app/result/[id]/page.tsx       — 结果页（对比+扫码+自动轮询+PDF下载）
src/app/admin/page.tsx             — 管理后台
src/app/api/upload/route.ts        — POST 文件上传
src/app/api/optimize/route.ts      — POST AI优化
src/app/api/result/route.ts        — GET 查询结果（供轮询）
src/app/api/admin/route.ts         — GET/POST 管理后台
src/app/sitemap.ts                 — 站点地图
src/app/robots.ts                  — 爬虫规则
src/lib/db.ts                      — SQLite（增删改查+confirmPayment+listPending）
src/lib/ai.ts                      — DeepSeek API调用
src/lib/parser.ts                  — PDF/DOCX/TXT解析
src/lib/pdf.ts                      — 生成PDF简历
src/types/index.ts                 — 类型定义
PROJECT.md                         — 本文档

## 数据库状态流转
pending → processing → pending_payment → paid
                                  ↘ failed

## 已完成的SEO优化
- sitemap.xml（/sitemap.xml）
- robots.txt（/robots.txt，允许Baiduspider/Googlebot）
- 首页 JSON-LD 结构化数据（WebApplication schema）
- 首页拆为 Server + Client 组件（百度能读完整内容）
- 完善 metadata（openGraph、twitter:card、canonical）
- 预留 baidu-site-verification 字段

## 当前状态
✅ 全功能已实现并部署
✅ AI优化正常
✅ 三档定价 + 对应收款码
✅ 管理后台确认收款
✅ 自动轮询支付状态（5秒/次，2分钟超时）
✅ PDF下载 + TXT下载
✅ sitemap + robots + JSON-LD + metadata
⚠️ 手机端响应式适配未完善
⚠️ Vercel域名国内被墙，需绑自己的域名
⚠️ 支付是手动确认，无自动回调通知

## 环境变量（.env.local）
OPENAI_API_KEY=     # DeepSeek/OpenAI API密钥
AI_BASE_URL=        # API地址（默认 https://api.deepseek.com）
AI_MODEL=           # 模型（默认 deepseek-chat）
ADMIN_PASSWORD=     # 管理后台密码
NEXT_PUBLIC_SITE_URL= # 站点URL（可选）

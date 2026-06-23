import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIChat from "@/components/AIChat";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://jianxiaoyou.xyz"),
  title: {
    default: "简小优 — AI简历优化，3分钟让你的简历脱颖而出",
    template: "%s | 简小优",
  },
  description: "简小优，上传简历AI智能优化，提升面试邀约率。支持PDF/DOCX/TXT，¥9.9起。不满意不付费。",
  keywords: ["简小优", "简历优化", "AI简历", "求职", "简历修改", "简历润色", "简历改写", "找工作"],
  authors: [{ name: "简小优" }],
  creator: "简小优",
  publisher: "简小优",
  applicationName: "简小优",
  robots: {
    index: true,
    follow: true,
  },
  referrer: "origin-when-cross-origin",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "简小优",
    title: "简小优 — AI简历优化，3分钟让你的简历脱颖而出",
    description: "上传简历AI智能优化，提升面试邀约率。支持PDF/DOCX/TXT，¥9.9起。",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "简小优 - AI简历优化",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "简小优 — AI简历优化",
    description: "上传简历AI智能优化，提升面试邀约率。¥9.9起。",
  },
  alternates: {
    canonical: "/",
  },
  other: {
    'baidu-site-verification': process.env.BAIDU_VERIFICATION || '',
    'google-site-verification': process.env.GOOGLE_VERIFICATION || '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AIChat />
      </body>
    </html>
  );
}

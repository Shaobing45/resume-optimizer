import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIChat from "@/components/AIChat";
import ScrollProgress from "@/components/ScrollProgress";
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
    default: "绠€灏忎紭 鈥?AI绠€鍘嗕紭鍖栵紝3鍒嗛挓璁╀綘鐨勭畝鍘嗚劚棰栬€屽嚭",
    template: "%s | 绠€灏忎紭",
  },
  description: "绠€灏忎紭锛屼笂浼犵畝鍘咥I鏅鸿兘浼樺寲锛屾彁鍗囬潰璇曢個绾︾巼銆傛敮鎸丳DF/DOCX/TXT锛屄?.9璧枫€備笉婊℃剰涓嶄粯璐广€?,
  keywords: ["绠€灏忎紭", "绠€鍘嗕紭鍖?, "AI绠€鍘?, "姹傝亴", "绠€鍘嗕慨鏀?, "绠€鍘嗘鼎鑹?, "绠€鍘嗘敼鍐?, "鎵惧伐浣?],
  authors: [{ name: "绠€灏忎紭" }],
  creator: "绠€灏忎紭",
  publisher: "绠€灏忎紭",
  applicationName: "绠€灏忎紭",
  robots: {
    index: true,
    follow: true,
  },
  referrer: "origin-when-cross-origin",
  icons: { icon: "/logo.svg" },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "绠€灏忎紭",
    title: "绠€灏忎紭 鈥?AI绠€鍘嗕紭鍖栵紝3鍒嗛挓璁╀綘鐨勭畝鍘嗚劚棰栬€屽嚭",
    description: "涓婁紶绠€鍘咥I鏅鸿兘浼樺寲锛屾彁鍗囬潰璇曢個绾︾巼銆傛敮鎸丳DF/DOCX/TXT锛屄?.9璧枫€?,
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "绠€灏忎紭 - AI绠€鍘嗕紭鍖?,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "绠€灏忎紭 鈥?AI绠€鍘嗕紭鍖?,
    description: "涓婁紶绠€鍘咥I鏅鸿兘浼樺寲锛屾彁鍗囬潰璇曢個绾︾巼銆偮?.9璧枫€?,
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
        <ScrollProgress />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AIChat />
      </body>
    </html>
  );
}

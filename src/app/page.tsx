import HomeClient from '@/components/HomeClient';

export default function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jianxiaoyou.xyz';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '简小优',
    description: 'AI简历优化工具，上传简历自动优化措辞、量化成果、匹配关键词，3分钟搞定，¥9.9起。',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: baseUrl,
    offers: {
      '@type': 'Offer',
      price: '9.9',
      priceCurrency: 'CNY',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}

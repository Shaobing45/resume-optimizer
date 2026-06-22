/**
 * 通知服务：Server酱 推送 + 兜底 fallback
 * 管理员收到新订单 / 确认收款时通过微信获得推送
 */

// Server酱推送
async function sendServerChan(title: string, content: string): Promise<void> {
  const key = process.env.SERVERCHAN_KEY;
  if (!key) return;

  try {
    const res = await fetch(`https://sctapi.ftqq.com/${key}.send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, desp: content }),
    });
    if (!res.ok) {
      console.error(`ServerChan push failed: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error('ServerChan send failed:', err);
  }
}

/** 新订单待确认通知 */
export async function notifyNewOrder(
  shortId: string,
  targetPosition: string,
  timestamp: string,
): Promise<void> {
  const adminUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin`
    : 'https://jianxiaoyou.xyz/admin';

  await sendServerChan(
    `📋 新订单待确认 — ${shortId}`,
    [
      `**简历ID**：\`${shortId}\``,
      `**目标职位**：${targetPosition || '未填写'}`,
      `**时间**：${timestamp}`,
      '',
      `👉 [一键确认收款](${adminUrl})`,
      `_打开链接 → 输密码 → 点确认_`,
    ].join('\n'),
  );
}

/** 收款确认通知 */
export async function notifyPaymentConfirmed(
  shortId: string,
  timestamp: string,
): Promise<void> {
  await sendServerChan(
    `✅ 订单已确认 — ${shortId}`,
    [
      `**简历ID**：\`${shortId}\``,
      `**确认时间**：${timestamp}`,
      '',
      '管理员已确认收款，用户可以查看完整优化内容了。',
    ].join('\n'),
  );
}

/** 管理员浏览器通知（客户端用） */
export function notifyBrowser(
  title: string,
  body: string,
): void {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    });
  }
}

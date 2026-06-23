import { NextRequest } from 'next/server';
import { getClient } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json() as { message?: string };
    if (!message?.trim()) {
      return Response.json({ success: false, error: 'empty' }, { status: 400 });
    }

    const client = getClient();
    const res = await client.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '你是一个AI简历助手。用简洁、专业的中文回答简历相关问题。每次回复不超过300字。' },
        { role: 'user', content: message.slice(0, 2000) },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return Response.json({
      success: true,
      data: { reply: res.choices[0]?.message?.content || '抱歉，我暂时无法回答。' },
    });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

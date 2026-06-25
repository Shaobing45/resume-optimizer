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
        { role: 'system', content: '你是一个AI简历助手。回答要求：1. 只用纯文字，不要用任何标点符号之外的格式符号 2. 不要用**、#、-、*、>、`等符号 3. 不要用Markdown或任何标记语言 4. 用自然的口语化中文回答 5. 简洁直接，每次不超过200字 6. 可以适当用emoji增加亲和力' },
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

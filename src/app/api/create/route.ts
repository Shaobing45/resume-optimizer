import { NextRequest } from 'next/server';
import { createResume, updateOptimized } from '@/lib/db';
import { generatePreview, getClient } from '@/lib/ai';
import { notifyNewOrder } from '@/lib/notify';
import type { ApiResponse, OptimizeResponse } from '@/types';

const CREATE_PROMPT = `你是一位资深职业简历撰写师，帮用户从零生成专业简历。

用户会提供零散的个人信息（教育、经历、技能等），你需要：
1. 整理信息，删除无关内容（身高、体重、婚姻状态等隐私）
2. 量化模糊描述（"做了很多项目"→"主导5个项目"）
3. 每段经历用强力动词开头（主导、实现、突破、打造、优化）
4. 补充合理细节让简历更丰满（不要编造职位和公司名）
5. 按标准简历结构组织：个人信息→求职意向→教育→经历→技能→自我评价

排版规范：
- 纯文本，绝对不用Markdown符号（# * - 等）
- 用空行和缩进区分层次
- 姓名顶部单独一行
- 各部分标题单独一行
- 每条经历用"·"开头`;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { info, targetPosition } = body as { info?: string; targetPosition?: string };

    if (!info || info.trim().replace(/\s/g, '').length < 10) {
      return Response.json(
        { success: false, error: '请至少提供一些基本信息（10字以上）' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 截断超长输入
    const safeInfo = info.length > 50000 ? info.slice(0, 50000) : info;
    const safeTargetPos = typeof targetPosition === 'string'
      ? targetPosition.slice(0, 200) : undefined;

    // 先创建数据库记录（用于后续支付流程）
    const record = createResume(safeInfo, undefined, safeTargetPos);

    const client = getClient();
    const model = process.env.AI_MODEL || 'gpt-4o-mini';

    let userMessage = `请根据以下信息生成一份完整简历：\n\n${safeInfo}`;
    if (safeTargetPos) {
      userMessage = `目标职位：${safeTargetPos}\n\n${userMessage}`;
    }

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: CREATE_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const resume = response.choices[0]?.message?.content || '';

    if (!resume) {
      return Response.json(
        { success: false, error: 'AI 生成失败，请重试' } satisfies ApiResponse,
        { status: 500 }
      );
    }

    // 保存生成结果，状态设为 pending_payment
    updateOptimized(record.id, resume, undefined, safeTargetPos);

    // 通知管理员有新订单
    notifyNewOrder(record.id.slice(0, 8), safeTargetPos || '', record.created_at).catch(() => {});

    return Response.json({
      success: true,
      data: {
        id: record.id,
        original: safeInfo,
        optimized: resume,
        preview: generatePreview(resume),
        status: 'pending_payment' as const,
      } satisfies OptimizeResponse,
    } satisfies ApiResponse<OptimizeResponse>);
  } catch (error) {
    console.error('Create error:', error);
    const message = error instanceof Error ? error.message : '生成失败';
    return Response.json(
      { success: false, error: message } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

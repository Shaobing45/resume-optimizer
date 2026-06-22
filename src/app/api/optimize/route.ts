import { NextRequest } from 'next/server';
import { getResume, updateOptimized, updateStatus, getKeywordMatch } from '@/lib/db';
import { optimizeResume, generatePreview, analyzeKeywords } from '@/lib/ai';
import { notifyNewOrder } from '@/lib/notify';
import type { ApiResponse, OptimizeResponse, KeywordMatch } from '@/types';

export async function POST(request: NextRequest): Promise<Response> {
  let resumeId = '';

  try {
    const body = await request.json();
    const { id, jobDescription, targetPosition } = body;
    resumeId = id;

    if (!id) {
      return Response.json(
        { success: false, error: '缺少简历 ID' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 获取简历记录
    const record = getResume(id);
    if (!record) {
      return Response.json(
        { success: false, error: '简历不存在或已过期' } satisfies ApiResponse,
        { status: 404 }
      );
    }

    // 输入消毒：限制字段长度，回退到 DB 记录
    const safeJobDesc = typeof jobDescription === 'string' && jobDescription.length <= 10000
      ? jobDescription.slice(0, 10000) 
      : (record.job_description || undefined);
    const safeTargetPos = typeof targetPosition === 'string' && targetPosition.length <= 200
      ? targetPosition.slice(0, 200) 
      : (record.target_position || undefined);

    // 套餐限制：单次套餐禁止重复优化
    if (record.tier === 'single' && record.optimized_text) {
      return Response.json({
        success: true,
        data: {
          id: record.id,
          original: record.original_text,
          optimized: record.optimized_text,
          preview: generatePreview(record.optimized_text),
          status: record.status,
          tier: record.tier,
          keywordMatch: getKeywordMatch(record),
        } satisfies OptimizeResponse,
      } satisfies ApiResponse<OptimizeResponse>);
    }

    // 如果已经优化过，直接返回（pack5/unlimited 的缓存响应）
    if (record.optimized_text && (record.status === 'pending_payment' || record.status === 'paid')) {
      return Response.json({
        success: true,
        data: {
          id: record.id,
          original: record.original_text,
          optimized: record.optimized_text,
          preview: generatePreview(record.optimized_text),
          status: record.status,
          tier: record.tier,
          keywordMatch: getKeywordMatch(record),
        } satisfies OptimizeResponse,
      } satisfies ApiResponse<OptimizeResponse>);
    }

    // 标记为处理中
    updateStatus(id, 'processing');

    // 调用 AI 优化
    const optimized = await optimizeResume({
      resumeText: record.original_text,
      jobDescription: safeJobDesc,
      targetPosition: safeTargetPos,
    });

    // 关键词分析（仅当有 JD 时）
    let keywordMatch: KeywordMatch | undefined;
    if (safeJobDesc) {
      try {
        const result = await analyzeKeywords(record.original_text, safeJobDesc);
        keywordMatch = {
          matched: result.matchedKeywords,
          missing: result.missingKeywords,
          coverageScore: result.coverageScore,
        };
      } catch {
        // 关键词分析失败不影响主流程
      }
    }

    // 保存结果（含关键词匹配数据）
    updateOptimized(id, optimized, safeJobDesc, safeTargetPos, keywordMatch);
    // 通知管理员有新订单（不阻塞响应）
    (async () => {
      const r = getResume(id);
      if (r) {
        const shortId = id.slice(0, 8);
        await notifyNewOrder(shortId, targetPosition || '', r.created_at);
      }
    })().catch(() => {});

    // 获取更新后的状态
    const updated = getResume(id);

    return Response.json({
      success: true,
      data: {
        id,
        original: record.original_text,
        optimized,
        preview: generatePreview(optimized),
        status: updated?.status || 'pending_payment',
        tier: record.tier,
        keywordMatch,
      } satisfies OptimizeResponse,
    } satisfies ApiResponse<OptimizeResponse>);
  } catch (error) {
    console.error('Optimize error:', error);
    const message =
      error instanceof Error ? error.message : 'AI 优化失败，请重试';

    // 恢复状态
    if (resumeId) {
      try { updateStatus(resumeId, 'failed'); } catch { /* 忽略 */ }
    }

    return Response.json(
      { success: false, error: message } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

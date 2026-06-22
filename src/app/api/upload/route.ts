import { NextRequest } from 'next/server';
import { parseResume, extractResumePreview } from '@/lib/parser';
import { createResume } from '@/lib/db';
import type { ApiResponse, UploadResponse } from '@/types';

// 限制：最大10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 200_000;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const jobDescription = (formData.get('jobDescription') as string) || '';
    const targetPosition = (formData.get('targetPosition') as string) || '';
    const tier = (formData.get('tier') as string) || 'single';

    if (!file || !(file instanceof File)) {
      return Response.json(
        { success: false, error: '请上传简历文件' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        {
          success: false,
          error: `不支持的文件格式。请上传 PDF、DOCX 或 TXT 文件`,
        } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { success: false, error: '文件大小不能超过 10MB' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 解析文件
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parseResume(buffer, file.type);

    // 验证内容不为空
    if (!text || text.replace(/\s/g,'').length < 20) {
      return Response.json(
        {
          success: false,
          error: '简历内容过短，请上传完整的简历文件',
        } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 截断超长文本
    const safeText = text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;
    // 安全处理 JD 和职位
    const safeJD = jobDescription.length > 10000 ? jobDescription.slice(0, 10000) : jobDescription;
    const safePos = targetPosition.length > 200 ? targetPosition.slice(0, 200) : targetPosition;

    // 存入数据库（含 JD 和职位信息）
    const safeTier = ['single', 'pack5', 'unlimited'].includes(tier) ? tier : 'single';
    const record = createResume(safeText, safeJD, safePos, safeTier);

    return Response.json({
      success: true,
      data: {
        id: record.id,
        status: record.status,
        tier: safeTier,
        preview: extractResumePreview(safeText),
      } satisfies UploadResponse,
    } satisfies ApiResponse<UploadResponse>);
  } catch (error) {
    console.error('Upload error:', error);
    const message =
      error instanceof Error ? error.message : '上传处理失败，请重试';
    return Response.json(
      { success: false, error: message } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

import mammoth from 'mammoth';

async function parsePdf(buffer: Buffer): Promise<string> {
  // 动态导入，避免 Next.js SSR 问题
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // 读取 worker 内容并转为 data URL
  const fs = await import('fs');
  const { join } = await import('path');
  const workerFile = join(
    process.cwd(),
    'node_modules',
    'pdfjs-dist',
    'legacy',
    'build',
    'pdf.worker.min.mjs'
  );
  const workerCode = fs.readFileSync(workerFile, 'utf-8');
  pdfjs.GlobalWorkerOptions.workerSrc =
    'data:application/javascript;base64,' +
    Buffer.from(workerCode).toString('base64');

  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({
    data,
    verbosity: 0,
  } as Record<string, unknown>).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    // 尝试多种方式提取文字
    const items = textContent.items;
    const pageText = items
      .map((item: unknown) => {
        if (typeof item === 'object' && item !== null) {
          const it = item as Record<string, unknown>;
          if (typeof it.str === 'string' && it.str.trim()) return it.str;
          // 有些 PDF 文字在 item 的其他字段
          if (typeof it.text === 'string' && it.text.trim()) return it.text;
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
    pages.push(pageText);
  }

  console.log(`[PDF] pages: ${doc.numPages}, text items total: ${pages.map(p => p.length).join(',')}`);

  const text = pages.join('\n').trim();
  if (!text) {
    throw new Error('PDF 文件中未检测到文字内容，请确保文件不是扫描图片。如果是 WPS/Word 导出的 PDF，请尝试用 Word 另存为 PDF/A 格式。');
  }
  return text;
}

export async function parseResume(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return await parsePdf(buffer);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await parseDocx(buffer);
      case 'text/plain':
        return parseText(buffer);
      default:
        throw new Error(`不支持的文件格式: ${mimeType}。请上传 PDF、DOCX 或 TXT 文件`);
    }
  } catch (error) {
    if (error instanceof Error && !error.message.startsWith('不支持')) {
      throw new Error(`文件解析失败: ${error.message}`);
    }
    throw error;
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  if (!text) {
    throw new Error('DOCX 文件中未检测到文字内容');
  }
  return text;
}

function parseText(buffer: Buffer): string {
  const text = buffer.toString('utf-8').trim();
  if (!text) {
    throw new Error('文本文件为空');
  }
  return text;
}

export function extractResumePreview(text: string, maxLength = 200): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + '…';
}

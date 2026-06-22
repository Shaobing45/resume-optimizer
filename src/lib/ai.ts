import OpenAI from 'openai';

// 延迟初始化，避免构建时无密钥报错
let client: OpenAI | null = null;

export function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    const baseURL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    client = new OpenAI({
      apiKey: apiKey || 'sk-placeholder',
      baseURL,
    });
  }
  return client;
}

const SYSTEM_PROMPT = `你是一位资深的职业简历优化师，拥有10年以上HR和猎头经验。
你的任务是帮用户优化简历，使其更具竞争力。

优化原则：
1. 大胆重写：不要只是微调措辞，要重新组织每句话。原文如果平淡，直接改写为精彩的版本。
2. 量化成果：把模糊描述变成具体数据。原文已有数据的，换更震撼的表述方式。
3. 动词驱动：每条经历必须用强力动词开头（主导、实现、突破、打造、重构、提升、优化）
4. 关键词匹配：融入目标职位的行业术语，让简历在筛选系统中排名更高
5. 删掉废话：去掉"负责""参与""协助"等虚词，每句话都要有硬货
6. 注入细节：在真实经历基础上，合理补充细节让经历更丰满（不要无中生有编造职位和公司）
7. 突出亮点：把最有价值的经历放在最前面，让HR一眼看到核心能力

输出要求：
- 直接输出优化后的完整简历文本
- 用中文优化（保持原文中的英文专业术语）
- 在末尾附加3条优化说明，解释你做了哪些关键改动

排版规范（非常重要）：
- 绝对不要使用任何 Markdown 符号，包括：井号、星号、减号、大于号、反引号等
- 使用纯文本排版：用空格、空行、缩进、冒号来区分层次结构
- 姓名放在最顶部单独一行
- 各部分用空行分隔，标题单独一行（如"教育经历""工作经历"等）
- 每条经历单独一行，用"·"开头（不要用 - 或 *）
- 数字和时间用中文表达或保持原样，不要加粗不要斜体
- 整个简历要像一份可以直接打印的干净文档，没有任何排版符号`;

export interface OptimizeOptions {
  resumeText: string;
  jobDescription?: string;
  targetPosition?: string;
}

export interface KeywordAnalysis {
  missingKeywords: string[];
  matchedKeywords: string[];
  coverageScore: number; // 0-100
}

export async function optimizeResume(options: OptimizeOptions): Promise<string> {
  const { resumeText, jobDescription, targetPosition } = options;

  let userMessage = `请优化以下简历：\n\n${resumeText}`;

  if (targetPosition) {
    userMessage = `目标职位：${targetPosition}\n\n${userMessage}`;
  }
  if (jobDescription) {
    userMessage += `\n\n目标职位描述（参考其中的关键词和要求）：\n${jobDescription}`;
  }

  const ai = getClient();

  const response = await ai.chat.completions.create({
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const optimized = response.choices[0]?.message?.content || '';

  if (!optimized) {
    throw new Error('AI 返回了空内容，请重试');
  }

  return optimized;
}

/**
 * ATS 关键词分析：提取 JD 中的关键技能/要求，比对简历覆盖率
 */
export async function analyzeKeywords(
  resumeText: string,
  jobDescription: string
): Promise<KeywordAnalysis> {
  if (!jobDescription.trim()) {
    return { missingKeywords: [], matchedKeywords: [], coverageScore: 100 };
  }

  const ai = getClient();

  const response = await ai.chat.completions.create({
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `你是一位 ATS 简历筛选专家。分析岗位描述中的关键词，与简历内容进行比对。
返回 JSON 格式，不要包含其他文字：
{
  "matchedKeywords": ["已经在简历中体现的关键词"],
  "missingKeywords": ["简历中缺失但 JD 要求的关键词"],
  "coverageScore": 65
}
coverageScore 是 0-100 的整数，表示简历对 JD 关键词的覆盖程度。`,
      },
      {
        role: 'user',
        content: `岗位描述：\n${jobDescription}\n\n简历内容：\n${resumeText}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
    return {
      matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
      coverageScore: typeof parsed.coverageScore === 'number' ? parsed.coverageScore : 50,
    };
  } catch {
    return { matchedKeywords: [], missingKeywords: [], coverageScore: 50 };
  }
}

// 生成预览（前30%内容）
export function generatePreview(fullText: string): string {
  const previewLength = Math.floor(fullText.length * 0.3);
  const truncated = fullText.slice(0, previewLength);
  const lastPeriod = truncated.lastIndexOf('。');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastPeriod, lastNewline, truncated.lastIndexOf('.'));

  if (cutPoint > previewLength * 0.5) {
    return truncated.slice(0, cutPoint + 1) + '\n\n[ 付费后查看完整优化内容 ]';
  }
  return truncated + '\n\n[ 付费后查看完整优化内容 ]';
}

// 简历优化状态
export type OptimizeStatus = 'pending' | 'processing' | 'completed' | 'pending_payment' | 'paid' | 'expired' | 'failed';

// 数据库中的简历记录
export interface ResumeRecord {
  id: string;
  original_text: string;
  optimized_text: string | null;
  job_description: string | null;
  target_position: string | null;
  keyword_match: string | null; // JSON string of KeywordMatch
  tier: string;
  status: OptimizeStatus;
  created_at: string;
  updated_at: string;
}

// API 响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 上传响应
export interface UploadResponse {
  id: string;
  status: OptimizeStatus;
  tier?: string;
  preview: string; // 简历前200字预览
}

// ATS 关键词匹配
export interface KeywordMatch {
  matched: string[];
  missing: string[];
  coverageScore: number;
}

// 优化响应
export interface OptimizeResponse {
  id: string;
  original: string;
  optimized: string;
  preview: string;
  status: OptimizeStatus;
  tier?: string;
  keywordMatch?: KeywordMatch;
}

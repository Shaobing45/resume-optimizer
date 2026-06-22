'use client';

import { useState, useRef, useCallback, type DragEvent } from 'react';

interface UploadZoneProps {
  onUpload: (file: File) => void;
  uploading: boolean;
  error?: string;
}

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function isValidFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `不支持的文件格式「${file.type}」。请上传 PDF、DOCX 或 TXT 文件`;
  }
  if (file.size > MAX_SIZE) {
    return `文件 ${file.name} 大小超出限制（${(file.size / 1024 / 1024).toFixed(1)}MB），最大 10MB`;
  }
  return null;
}

export default function UploadZone({ onUpload, uploading, error }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      setLocalError('');

      const files = e.dataTransfer.files;
      if (files && files.length > 0 && !uploading) {
        const validationError = isValidFile(files[0]);
        if (validationError) {
          setLocalError(validationError);
          return;
        }
        onUpload(files[0]);
      }
    },
    [onUpload, uploading]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setLocalError('');
    if (files && files.length > 0) {
      const validationError = isValidFile(files[0]);
      if (validationError) {
        setLocalError(validationError);
        return;
      }
      onUpload(files[0]);
    }
  };

  return (
    <div className="w-full">
      {/* 文件类型提示 */}
      <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-400">
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-500">PDF</span>
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-500">DOCX</span>
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-500">TXT</span>
        <span className="ml-auto">最大 10MB</span>
      </div>
      <div
        className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 lg:p-12 text-center transition-all duration-300 cursor-pointer
          ${dragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg shadow-blue-200/30'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="text-lg font-medium text-gray-700">正在解析简历…</p>
            <p className="text-sm text-gray-500">请稍候，马上就好</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* 图标 */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                拖拽简历文件到此处，或<span className="text-blue-600">点击上传</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                支持 PDF、DOCX、TXT 格式，最大 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {localError && (
        <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          {localError}
        </p>
      )}
    </div>
  );
}

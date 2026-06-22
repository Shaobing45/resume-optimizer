interface LoadingSpinnerProps {
  text?: string;
  subtext?: string;
}

export default function LoadingSpinner({
  text = '加载中…',
  subtext,
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      <p className="text-lg font-medium text-gray-700">{text}</p>
      {subtext && <p className="text-sm text-gray-500">{subtext}</p>}
    </div>
  );
}

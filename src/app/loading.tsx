export default function LoadingSpinner({
  text = '加载中…',
  subtext = '请稍候',
}: {
  text?: string;
  subtext?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      <p className="text-base font-medium text-gray-700">{text}</p>
      <p className="text-sm text-gray-400">{subtext}</p>
    </div>
  );
}

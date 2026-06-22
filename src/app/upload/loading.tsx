export default function UploadLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-lg font-medium text-gray-700">准备上传页面…</p>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} 简小优 — 用AI让你的简历脱颖而出</p>
        <p className="mt-1">
          简历数据加密存储，24小时后自动删除 | ¥9.9起，满意再付
        </p>
      </div>
    </footer>
  );
}

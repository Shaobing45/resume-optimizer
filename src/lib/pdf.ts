/**
 * 将优化后的简历导出为 PDF
 * 使用 html2canvas + jsPDF 在浏览器端渲染
 */

export async function downloadResumeAsPdf(
  optimizedText: string,
  filename = "优化简历"
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const html = buildPdfHtml(optimizedText);

  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;background:#fff;z-index:-1;";
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 800,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfW = 210;
    const pdfH = (canvas.height * pdfW) / canvas.width;

    let left = pdfH;
    let pos = 0;

    pdf.addImage(imgData, "PNG", 0, pos, pdfW, pdfH);
    left -= 297;

    while (left > 0) {
      pos = left - pdfH;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, pos, pdfW, pdfH);
      left -= 297;
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function buildPdfHtml(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => ({ text: l.trim(), isEmpty: l.trim() === '' }));

  const body = lines.map((line) => {
    if (line.isEmpty) {
      return '<div style="height:8px;"></div>';
    }
    return `<p style="margin:4px 0;line-height:1.7;font-size:12px;color:#1e293b;">${esc(line.text)}</p>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:'PingFang SC','Microsoft YaHei',sans-serif;padding:40px 48px;max-width:720px;margin:0 auto;">
<div style="border-bottom:3px solid #2563eb;padding-bottom:10px;margin-bottom:20px;">
  <h1 style="font-size:20px;margin:0;color:#0f172a;">简小优 · AI 优化简历</h1>
  <p style="font-size:11px;color:#94a3b8;margin:4px 0 0;">${new Date().toLocaleDateString("zh-CN")}</p>
</div>
<div style="white-space:pre-wrap;">${body}</div>
<div style="border-top:1px solid #e2e8f0;margin-top:32px;padding-top:10px;font-size:10px;color:#94a3b8;text-align:center;">
  由 简小优 AI 生成
</div>
</body></html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

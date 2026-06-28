/**
 * 将优化后的简历导出为 PDF
 * 使用 html2canvas + jsPDF 在浏览器端渲染
 */

export async function downloadResumeAsPdf(
  optimizedText: string,
  filename = "优化简历",
  photoUrl?: string,
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const html = buildPdfHtml(optimizedText, photoUrl);

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

function buildPdfHtml(text: string, photoUrl?: string): string {
  const lines = text.split("\n").map((l) => l.trim());

  const photoHtml = photoUrl
    ? `<div style="text-align:center;margin-bottom:20px;"><img src="${esc(photoUrl)}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #d1d5db;" /></div>`
    : '';

  let isFirstName = true;
  const body = lines.map((line, i) => {
    if (!line) {
      isFirstName = false;
      return '<div style="height:12px;"></div>';
    }

    // 姓名行 — 第一行大字加粗居中
    if (isFirstName && i < 3 && line.length < 30) {
      isFirstName = false;
      return `<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#111827;text-align:center;letter-spacing:2px;">${esc(line)}</h1>`;
    }

    // 章节标题（短行 + 常见关键词）
    const isHeader = /^(教育|工作|项目|专业|自我|求职|技能|个人信息|联系方式|荣誉|证书)/.test(line)
      && line.length < 30;
    if (isHeader) {
      return `<div style="margin:16px 0 6px 0;padding-bottom:4px;border-bottom:1.5px solid #e5e7eb;">
        <h2 style="margin:0;font-size:15px;font-weight:600;color:#1e40af;letter-spacing:1px;">${esc(line)}</h2>
      </div>`;
    }

    // 职位行带颜色
    if (/^(求职意向|目标职位|应聘职位)/.test(line)) {
      return `<p style="margin:2px 0;font-size:14px;color:#2563eb;text-align:center;">${esc(line)}</p>`;
    }

    // 普通正文
    return `<p style="margin:3px 0;line-height:1.8;font-size:14px;color:#1f2937;">${esc(line)}</p>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&display=swap');
</style></head>
<body style="font-family:'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif;padding:48px 52px;max-width:720px;margin:0 auto;background:#fff;">
${photoHtml}
<div style="white-space:pre-wrap;">${body}</div>
</body></html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 下载为 Word (.doc) 格式 — 生成 Word 兼容的 HTML */
export function downloadResumeAsDoc(optimizedText: string, filename = "优化简历", photoUrl?: string): void {
  const lines = optimizedText.split("\n").map(l => l.trim());
  const photoHtml = photoUrl
    ? `<div style="text-align:center;margin-bottom:12pt;"><img src="${photoUrl}" style="width:72pt;height:72pt;object-fit:cover;border-radius:4pt;" /></div>`
    : '';

  const bodyHtml = lines.map(line => {
    if (!line) return '<p style="margin:6pt 0;">&nbsp;</p>';
    return `<p style="margin:3pt 0;line-height:1.8;font-size:12pt;font-family:'宋体','SimSun','Microsoft YaHei',sans-serif;">${esc(line)}</p>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${esc(filename)}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
</w:WordDocument>
</xml>
<![endif]-->
<style>
body { font-family: '宋体','SimSun','Microsoft YaHei',sans-serif; padding: 40pt 48pt; }
</style>
</head>
<body>
${photoHtml}
<div style="white-space:pre-wrap;">${bodyHtml}</div>
</body>
</html>`;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

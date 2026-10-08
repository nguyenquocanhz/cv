/**
 * Sinh các mẫu CV chuẩn ATS ra templates/*.docx và templates/*.md.
 *
 *   node ats-scan/make_templates.js
 *
 * Nguyên tắc của mẫu: một cột, không bảng, không hộp văn bản, không ảnh nền,
 * tiêu đề mục gọi đúng tên quen thuộc, font phổ thông — để phần mềm lọc hồ sơ
 * bóc được đủ chữ theo đúng thứ tự đọc.
 */
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, LevelFormat } from 'docx';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'templates');
mkdirSync(OUT, { recursive: true });

const FONT = 'Arial';           // có sẵn trên mọi máy, không vỡ dấu khi bóc chữ
const INK = '1A1A1A', MUTED = '595959', LINE = 'BFBFBF';

/** Mẫu = danh sách khối. Dùng chung cho cả .docx lẫn .md nên nội dung chỉ viết một lần. */
const TEMPLATES = [
  {
    file: 'CV-ATS-Fresher',
    title: 'Mẫu CV chuẩn ATS — Sinh viên & người mới ra trường',
    blocks: [
      ['name', 'NGUYỄN VĂN A'],
      ['role', 'Thực tập sinh / Nhân viên [tên vị trí đang ứng tuyển]'],
      ['contact', 'Ngày sinh: 01/01/2003 · 0900 000 000 · email.cua.ban@gmail.com'],
      ['contact', 'Quận X, TP. Hồ Chí Minh · github.com/tenban'],
      ['h', 'MỤC TIÊU NGHỀ NGHIỆP'],
      ['p', 'Sinh viên năm cuối / vừa tốt nghiệp ngành [ngành học] tại [tên trường]. Đã làm [1–2 dự án hoặc đồ án tiêu biểu] bằng [công nghệ hoặc công cụ]. Mong muốn ứng tuyển vị trí [tên vị trí] tại [tên công ty] để [điều bạn muốn đóng góp và học hỏi].'],
      ['note', 'Viết lại đoạn này cho từng tin tuyển dụng. Nhắc đúng tên vị trí và tên công ty.'],
      ['h', 'HỌC VẤN'],
      ['e', '[Tên trường]', '— [Ngành học]', '09/20XX – 06/20XX'],
      ['b', 'GPA [3.4]/4.0 · Xếp loại [Khá/Giỏi/Xuất sắc]'],
      ['b', 'Môn học liên quan: [3–4 môn sát với vị trí đang ứng tuyển]'],
      ['b', 'Giải thưởng / học bổng: [tên, năm] — bỏ dòng này nếu chưa có'],
      ['note', 'GPA dưới 3.2/4.0 thì bỏ, dùng chỗ đó viết thêm một dự án.'],
      ['h', 'DỰ ÁN'],
      ['e', '[Tên dự án]', '— [đồ án môn học / dự án cá nhân]', '[MM/YYYY]'],
      ['b', '[Dự án giải quyết việc gì, cho ai dùng]. Xây dựng bằng [công nghệ, công cụ].'],
      ['b', '[Phần bạn tự làm] — nêu rõ bạn làm gì nếu đây là bài tập nhóm.'],
      ['b', 'Kết quả: [số liệu — bao nhiêu người dùng, nhanh hơn bao nhiêu, điểm số]. Mã nguồn: [link]'],
      ['e', '[Tên dự án thứ hai]', '— [loại dự án]', '[MM/YYYY]'],
      ['b', '[Mô tả một dòng, nêu công nghệ và kết quả]'],
      ['h', 'KINH NGHIỆM'],
      ['e', '[Vị trí: thực tập sinh / cộng tác viên / làm thêm]', '— [Tên nơi làm]', '[MM/YYYY – MM/YYYY]'],
      ['b', '[Động từ hành động] + [việc bạn làm] + [kết quả có số].'],
      ['b', '[Một việc khác bạn tự làm được].'],
      ['note', 'Chưa đi làm chính thức thì việc làm thêm, gia sư, bán hàng vẫn tính. Viết theo hướng kỹ năng chuyển được.'],
      ['h', 'KỸ NĂNG'],
      ['b', 'Chuyên môn: [liệt kê bằng đúng chữ mà tin tuyển dụng dùng, cách nhau bằng dấu phẩy]'],
      ['b', 'Công cụ: [phần mềm, nền tảng bạn dùng thạo]'],
      ['b', 'Ngoại ngữ: Tiếng Anh — [TOEIC/IELTS điểm, hoặc "đọc hiểu tài liệu chuyên ngành"]'],
      ['b', 'Kỹ năng mềm: [2–3 kỹ năng, chỉ ghi thứ bạn chứng minh được ở phần trên]'],
      ['h', 'CHỨNG CHỈ'],
      ['b', '[Tên chứng chỉ] — [đơn vị cấp], [năm]'],
    ],
  },
  {
    file: 'CV-ATS-KinhNghiem',
    title: 'Mẫu CV chuẩn ATS — Người đã đi làm',
    blocks: [
      ['name', 'NGUYỄN VĂN A'],
      ['role', '[Chức danh hiện tại hoặc chức danh đang ứng tuyển]'],
      ['contact', '0900 000 000 · email.cua.ban@gmail.com · Quận X, TP. Hồ Chí Minh'],
      ['contact', 'linkedin.com/in/tenban · github.com/tenban'],
      ['h', 'TÓM TẮT'],
      ['p', '[Chức danh] với [N] năm kinh nghiệm trong [lĩnh vực]. Thế mạnh ở [2–3 việc bạn làm tốt nhất, dùng đúng chữ trong tin tuyển dụng]. Đã [thành tích nổi bật nhất, có số liệu]. Đang tìm vị trí [tên vị trí] để [mục tiêu].'],
      ['h', 'KINH NGHIỆM LÀM VIỆC'],
      ['e', '[Chức danh]', '— [Tên công ty]', '[MM/YYYY] – nay'],
      ['b', '[Động từ hành động] [việc bạn làm] bằng [công cụ], [kết quả có số liệu].'],
      ['b', '[Việc thứ hai] — nêu quy mô: bao nhiêu người dùng, bao nhiêu đơn, bao nhiêu máy.'],
      ['b', '[Một cải tiến bạn chủ động đề xuất] giúp [tiết kiệm bao nhiêu thời gian hoặc chi phí].'],
      ['b', '[Phần phối hợp với bộ phận khác hoặc hướng dẫn người mới].'],
      ['e', '[Chức danh]', '— [Tên công ty trước]', '[MM/YYYY – MM/YYYY]'],
      ['b', '[Việc chính] — [kết quả có số].'],
      ['b', '[Việc đáng kể thứ hai] — [kết quả].'],
      ['b', '[Việc đáng kể thứ ba] — [kết quả].'],
      ['note', 'Mỗi việc 3–4 gạch đầu dòng. Việc càng cũ càng viết ngắn. Quá 10 năm trước thì chỉ cần một dòng.'],
      ['h', 'DỰ ÁN TIÊU BIỂU'],
      ['e', '[Tên dự án]', '— [vai trò của bạn]', '[MM/YYYY]'],
      ['b', '[Bài toán] → [cách bạn giải] → [kết quả đo được]. [Công nghệ, công cụ].'],
      ['h', 'KỸ NĂNG'],
      ['b', '[Nhóm 1 — ví dụ: Chuyên môn chính]: [liệt kê cách nhau bằng dấu phẩy]'],
      ['b', '[Nhóm 2 — ví dụ: Công cụ và nền tảng]: [liệt kê]'],
      ['b', '[Nhóm 3 — ví dụ: Quy trình]: [liệt kê]'],
      ['b', 'Ngoại ngữ: [ngôn ngữ — trình độ]'],
      ['h', 'HỌC VẤN'],
      ['e', '[Tên trường]', '— [Ngành học]', '[20XX – 20XX]'],
      ['h', 'CHỨNG CHỈ'],
      ['b', '[Tên chứng chỉ] — [đơn vị cấp], [năm]'],
    ],
  },
  {
    file: 'CV-ATS-ChuyenNganh',
    title: 'Mẫu CV chuẩn ATS — Chuyển ngành',
    blocks: [
      ['name', 'NGUYỄN VĂN A'],
      ['role', '[Tên vị trí bạn muốn chuyển sang]'],
      ['contact', '0900 000 000 · email.cua.ban@gmail.com · Quận X, TP. Hồ Chí Minh'],
      ['contact', 'linkedin.com/in/tenban · [link portfolio hoặc GitHub]'],
      ['h', 'TÓM TẮT'],
      ['p', '[N] năm làm [ngành cũ], nay chuyển sang [ngành mới] sau khi [khoá học, chứng chỉ hoặc dự án đã hoàn thành]. Mang theo [kỹ năng từ nghề cũ dùng được ở nghề mới] và đã [bằng chứng cụ thể ở nghề mới — dự án, chứng chỉ, công việc tự do]. Mong muốn ứng tuyển [tên vị trí] tại [tên công ty].'],
      ['note', 'Nói thẳng việc chuyển ngành ngay dòng đầu. Người đọc sẽ tự nhận ra, nên chủ động giải thích tốt hơn để họ tự đoán.'],
      ['h', 'KỸ NĂNG CHUYỂN ĐƯỢC'],
      ['b', '[Kỹ năng 1 từ nghề cũ]: [đã dùng vào việc gì, kết quả ra sao] — áp dụng được vào [việc gì ở nghề mới].'],
      ['b', '[Kỹ năng 2]: [bằng chứng cụ thể].'],
      ['b', '[Kỹ năng 3]: [bằng chứng cụ thể].'],
      ['h', 'DỰ ÁN TRONG NGÀNH MỚI'],
      ['e', '[Tên dự án]', '— [dự án cá nhân / bài tập khoá học / việc tự do]', '[MM/YYYY]'],
      ['b', '[Bài toán và cách giải] bằng [công nghệ, công cụ của ngành mới].'],
      ['b', 'Kết quả: [số liệu]. [Link sản phẩm hoặc mã nguồn].'],
      ['e', '[Tên dự án thứ hai]', '— [loại dự án]', '[MM/YYYY]'],
      ['b', '[Mô tả một dòng kèm kết quả].'],
      ['h', 'ĐÀO TẠO CHO NGÀNH MỚI'],
      ['b', '[Tên khoá học hoặc chứng chỉ] — [đơn vị cấp], [năm]'],
      ['b', '[Khoá thứ hai] — [đơn vị cấp], [năm]'],
      ['h', 'KINH NGHIỆM LÀM VIỆC'],
      ['e', '[Chức danh ở nghề cũ]', '— [Tên công ty]', '[MM/YYYY – MM/YYYY]'],
      ['b', '[Chọn những việc liên quan nhất tới nghề mới, viết theo hướng đó].'],
      ['b', '[Thành tích có số liệu — con số thì ngành nào cũng hiểu].'],
      ['note', 'Giữ phần này ngắn. Chỉ kể những việc liên quan tới nghề mới, bỏ phần chuyên môn cũ không ai hỏi.'],
      ['h', 'HỌC VẤN'],
      ['e', '[Tên trường]', '— [Ngành học]', '[20XX – 20XX]'],
      ['h', 'KỸ NĂNG'],
      ['b', '[Ngành mới]: [liệt kê bằng đúng chữ trong tin tuyển dụng]'],
      ['b', 'Công cụ: [liệt kê]'],
      ['b', 'Ngoại ngữ: [ngôn ngữ — trình độ]'],
    ],
  },
];

// ── Dựng .docx ──────────────────────────────────────────────
const T = (text, o = {}) => new TextRun({ text, font: FONT, size: 20, color: INK, ...o });

function toDocx(tpl) {
  const kids = [];
  for (const [kind, a, b, c] of tpl.blocks) {
    if (kind === 'name')
      kids.push(new Paragraph({ children: [T(a, { size: 32, bold: true })], spacing: { after: 40 } }));
    else if (kind === 'role')
      kids.push(new Paragraph({ children: [T(a, { size: 22, bold: true, color: MUTED })], spacing: { after: 60 } }));
    else if (kind === 'contact')
      kids.push(new Paragraph({ children: [T(a, { size: 19, color: MUTED })], spacing: { after: 30 } }));
    else if (kind === 'h')
      kids.push(new Paragraph({
        children: [T(a, { size: 21, bold: true })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 2 } },
        spacing: { before: 220, after: 110 }, keepNext: true,
      }));
    else if (kind === 'p')
      kids.push(new Paragraph({ children: [T(a)], alignment: AlignmentType.JUSTIFIED, spacing: { after: 80, line: 280, lineRule: 'auto' } }));
    else if (kind === 'e')
      // Chức danh, nơi làm và thời gian nằm trên cùng một dòng chữ thường — không dùng bảng
      kids.push(new Paragraph({
        children: [T(a, { bold: true }), T(' ' + b, { color: MUTED }), T('    ' + c, { color: MUTED })],
        spacing: { before: 110, after: 40 }, keepNext: true,
      }));
    else if (kind === 'b')
      kids.push(new Paragraph({ numbering: { reference: 'dash', level: 0 }, children: [T(a)], spacing: { after: 40, line: 280, lineRule: 'auto' } }));
    else if (kind === 'note')
      kids.push(new Paragraph({ children: [T('Gợi ý: ' + a, { size: 18, italics: true, color: MUTED })], spacing: { after: 90 } }));
  }
  kids.push(new Paragraph({
    children: [T('Mẫu này do ATS Scan tạo — github.com/nguyenquocanhz. Xoá hết chữ trong ngoặc vuông và dòng "Gợi ý" trước khi gửi.',
      { size: 17, italics: true, color: MUTED })],
    spacing: { before: 280 },
  }));

  return new Document({
    creator: 'ATS Scan',
    title: tpl.title,
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    numbering: { config: [{ reference: 'dash', levels: [{
      level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 280, hanging: 180 } } },
    }] }] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 850, bottom: 850, left: 1000, right: 1000 } } },
      children: kids,
    }],
  });
}

// ── Dựng .md ────────────────────────────────────────────────
function toMd(tpl) {
  const L = [`<!-- ${tpl.title} -->`, ''];
  for (const [kind, a, b, c] of tpl.blocks) {
    if (kind === 'name') L.push(`# ${a}`, '');
    else if (kind === 'role') L.push(`**${a}**`, '');
    else if (kind === 'contact') L.push(a, '');
    else if (kind === 'h') L.push('', `## ${a}`, '');
    else if (kind === 'p') L.push(a, '');
    else if (kind === 'e') L.push(`**${a}** ${b} — ${c}`, '');
    else if (kind === 'b') L.push(`- ${a}`);
    else if (kind === 'note') L.push('', `> Gợi ý: ${a}`, '');
  }
  L.push('', '---', 'Mẫu do ATS Scan tạo. Xoá hết chữ trong ngoặc vuông và các dòng "Gợi ý" trước khi gửi.');
  return L.join('\n') + '\n';
}

for (const tpl of TEMPLATES) {
  writeFileSync(join(OUT, tpl.file + '.md'), toMd(tpl), 'utf8');
  const buf = await Packer.toBuffer(toDocx(tpl));
  writeFileSync(join(OUT, tpl.file + '.docx'), buf);
  console.log('ok', tpl.file);
}

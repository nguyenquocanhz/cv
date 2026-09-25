/**
 * Giáo trình ôn tập Kỹ thuật viên máy tính — chuẩn IEEE Std 1063-2001.
 * Dựng DOCX bằng docx-js; build.py chạy file này hai lượt để điền số trang mục lục rồi xuất PDF.
 *
 *   node gen_giaotrinh.js            → GiaoTrinh-OnTap-KyThuatVienMayTinh.docx + headings.json
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
  LevelFormat, Header, Footer, PageBreak, TabStopType, LeaderType, PageNumber,
  Bookmark, InternalHyperlink, ExternalHyperlink,
} = require("docx");
const fs = require("fs");
const path = require("path");

const HERE = __dirname;
const OUT_NAME = "GiaoTrinh-OnTap-KyThuatVienMayTinh";

// ─── Trang A4 ────────────────────────────────────────────────
const PW = 11906, PH = 16838;
const ML = 1800, MR = 1260, MT = 1440, MB = 1440;
const CW = PW - ML - MR; // 8846 DXA

// ─── Chữ ─────────────────────────────────────────────────────
const FONT = "Times New Roman";
const SZ = 28, SZ_H1 = 32, SZ_H2 = 28, SZ_CODE = 22, SZ_TBL = 24;

// ─── Màu ─────────────────────────────────────────────────────
const C = {
  black: "000000", navy: "1B2A4A", accent: "2563EB", gray: "595959", grayBg: "F2F2F2",
  white: "FFFFFF", codeBg: "1E293B", codeText: "E2E8F0", border: "BFBFBF", headBg: "1F4E79",
  exBg: "EBF5FB", green: "375623", orange: "843C0C", red: "922B21",
  noteBg: "FFF4E5", noteBar: "C2410C", tipBg: "EAF7EE", tipBar: "15803D",
};

// ─── Số trang mục lục (build.py ghi sau lượt dựng đầu) ────────
const PAGES = fs.existsSync(path.join(HERE, "pages.json"))
  ? JSON.parse(fs.readFileSync(path.join(HERE, "pages.json"), "utf8")) : {};
const OUTLINE = []; // { id, text, level }

// ─── Helpers ─────────────────────────────────────────────────
const T = (text, o = {}) => new TextRun({ text: String(text), font: FONT, size: SZ, ...o });
const sp = (n = 120) => new Paragraph({ children: [], spacing: { after: n } });
const PB = () => new Paragraph({ children: [new PageBreak()], spacing: { after: 0 } });

/** "**đậm**" trong chuỗi → TextRun đậm. */
function rich(text, base = {}) {
  return String(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((p) =>
    p.startsWith("**") ? T(p.slice(2, -2), { ...base, bold: true }) : T(p, base));
}

function body(text, after = 120) {
  return new Paragraph({
    children: rich(text, { color: C.black }),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after, line: 360, lineRule: "auto" },
  });
}

function box(label, text, bg, bar, labelColor) {
  return new Paragraph({
    children: [T(label, { bold: true, color: labelColor }), ...rich(text, { size: 26 })],
    shading: { fill: bg, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: bar, space: 8 } },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 100, after: 160, line: 320, lineRule: "auto" },
    indent: { left: 240, right: 120 },
  });
}
const note = (text) => box("⚠ Lưu ý: ", text, C.noteBg, C.noteBar, C.orange);
const tip = (text) => box("✔ Mẹo: ", text, C.tipBg, C.tipBar, C.green);

// ─── Headings có bookmark để mục lục bấm được ─────────────────
function bm(id, runs) { return new Bookmark({ id, children: runs }); }

function H1(roman, text, id) {
  const full = `CHƯƠNG ${roman}: ${text}`;
  OUTLINE.push({ id, text: full, level: 0 });
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [bm(id, [T(full, { size: SZ_H1, bold: true, color: C.white })])],
    shading: { fill: C.headBg, type: ShadingType.CLEAR },
    spacing: { before: 0, after: 240 },
    keepNext: true,
  });
}
function H1plain(text, id) {
  OUTLINE.push({ id, text, level: 0 });
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [bm(id, [T(text, { size: SZ_H1, bold: true, color: C.white })])],
    shading: { fill: C.headBg, type: ShadingType.CLEAR },
    spacing: { before: 0, after: 240 },
    keepNext: true,
  });
}
function H2(num, text) {
  const id = "s" + num.replace(/\./g, "_");
  const full = `${num}  ${text}`;
  OUTLINE.push({ id, text: full, level: 1 });
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [bm(id, [T(full, { size: SZ_H2, bold: true, color: C.accent })])],
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: C.accent, space: 4 } },
    spacing: { before: 280, after: 140 },
    keepNext: true,
  });
}
function H3(num, text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [T(num ? `${num}  ${text}` : text, { size: SZ_H2, bold: true, color: C.navy })],
    spacing: { before: 180, after: 80 },
    indent: { left: 360 },
    keepNext: true,
  });
}

// ─── Danh sách ───────────────────────────────────────────────
function bull(text) {
  return new Paragraph({
    numbering: { reference: "b1", level: 0 },
    children: rich(text),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: 330, lineRule: "auto" },
  });
}
const bulls = (items) => items.map(bull);
let stepInstance = 0;
function steps(items) {
  stepInstance += 1;
  return items.map((t) => new Paragraph({
    numbering: { reference: "n1", level: 0, instance: stepInstance },
    children: rich(t),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: 330, lineRule: "auto" },
  }));
}

// ─── Code block ──────────────────────────────────────────────
function codeBlock(lines) {
  return lines.map((line, i) => new Paragraph({
    children: [new TextRun({ text: line || " ", font: "Courier New", size: SZ_CODE, color: C.codeText })],
    shading: { fill: C.codeBg, type: ShadingType.CLEAR },
    spacing: { before: i === 0 ? 80 : 0, after: i === lines.length - 1 ? 160 : 0, line: 280, lineRule: "auto" },
    indent: { left: 200, right: 200 },
    keepNext: i < lines.length - 1,
  }));
}

// ─── Hình ────────────────────────────────────────────────────
let figCount = {};
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function fig(name, caption, width = 580) {
  const file = path.join(HERE, "hinh", name + ".png");
  const { w, h } = pngSize(file);
  const ch = name.split("_")[0].slice(1);
  figCount[ch] = (figCount[ch] || 0) + 1;
  return [
    new Paragraph({
      children: [new ImageRun({ type: "png", data: fs.readFileSync(file),
        transformation: { width, height: Math.round(width * h / w) } })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 60 },
      keepNext: true,
    }),
    new Paragraph({
      children: [T(`Hình ${ch}.${figCount[ch]} – ${caption}`, { size: 24, italics: true, color: C.gray })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
    }),
  ];
}

// ─── Bảng ────────────────────────────────────────────────────
const bdr = () => ({ style: BorderStyle.SINGLE, size: 4, color: C.border });
const allBrd = { top: bdr(), bottom: bdr(), left: bdr(), right: bdr() };

function cell(v, w, { fill = C.white, color = C.black, bold = false, fs = SZ_TBL } = {}) {
  const paras = (Array.isArray(v) ? v : [v]).map((t) => {
    const runs = (t instanceof ExternalHyperlink) ? [t] : rich(t, { size: fs, color, bold });
    return new Paragraph({ children: runs, spacing: { after: 30, line: 276, lineRule: "auto" } });
  });
  return new TableCell({
    borders: allBrd,
    width: { size: w, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: paras,
  });
}
/** Độ rộng cột: truyền các cột đầu, cột cuối tự lấy phần còn lại cho đủ CW. */
const wd = (...cols) => [...cols, CW - cols.reduce((a, b) => a + b, 0)];

function table(headers, rows, widths, { firstCol = true, fs = SZ_TBL } = {}) {
  const hdr = new TableRow({
    tableHeader: true, cantSplit: true,
    children: headers.map((h, i) => cell(h, widths[i], { fill: C.headBg, color: C.white, bold: true, fs })),
  });
  const data = rows.map((r) => new TableRow({
    cantSplit: true,
    children: r.map((v, i) => cell(v, widths[i], firstCol && i === 0
      ? { fill: C.grayBg, color: C.navy, bold: true, fs } : { fs })),
  }));
  return [new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: widths, rows: [hdr, ...data] }), sp(160)];
}

function exTable(items) {
  const lc = { "Dễ": C.green, "TB": C.orange, "Khó": C.red };
  const cw = [700, 2000, 800, CW - 3500];
  return [new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: cw,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true,
        children: ["#", "Tên bài", "Độ khó", "Mô tả & Yêu cầu"].map((h, i) => cell(h, cw[i], { fill: C.headBg, color: C.white, bold: true, fs: 22 })) }),
      ...items.map(({ num, title, level, desc }) => new TableRow({ cantSplit: true, children: [
        cell(num, cw[0], { fill: C.grayBg, color: C.accent, bold: true, fs: 22 }),
        cell(title, cw[1], { bold: true, fs: 22 }),
        cell(level, cw[2], { fill: C.grayBg, color: lc[level] || C.gray, bold: true, fs: 22 }),
        cell(desc, cw[3], { fs: 22 }),
      ] })),
    ],
  }), sp(160)];
}

function twoColTable(rows, w1, header = null) {
  const w2 = CW - w1;
  const out = [];
  if (header) out.push(new TableRow({ tableHeader: true, cantSplit: true,
    children: [cell(header[0], w1, { fill: C.headBg, color: C.white, bold: true }), cell(header[1], w2, { fill: C.headBg, color: C.white, bold: true })] }));
  rows.forEach(([a, b]) => out.push(new TableRow({ cantSplit: true,
    children: [cell(a, w1, { fill: C.grayBg, color: C.accent, bold: true }), cell(b, w2)] })));
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [w1, w2], rows: out });
}

// ─── Hỏi – đáp (Phụ lục B) ───────────────────────────────────
function qa(n, q, answers) {
  return [
    new Paragraph({
      children: [T(`Câu ${n}. `, { bold: true, color: C.accent }), T(q, { bold: true, color: C.navy })],
      spacing: { before: 200, after: 80, line: 330, lineRule: "auto" },
      keepNext: true,
    }),
    ...bulls(answers),
  ];
}

// ─── Tham khảo IEEE ──────────────────────────────────────────
function ref(text, url) {
  const parts = [text];
  if (url) parts.push(new ExternalHyperlink({ link: url,
    children: [new TextRun({ text: url, font: FONT, size: 22, color: C.accent, underline: {} })] }));
  return parts;
}

// ─── Header & Footer ─────────────────────────────────────────
function makeHeader(title) {
  return new Header({ children: [new Paragraph({
    children: [new TextRun({ text: title, font: FONT, size: 22, color: C.gray, italics: true })],
    alignment: AlignmentType.RIGHT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: C.border, space: 3 } },
    spacing: { after: 0 },
  })] });
}
function makeFooter(text) {
  return new Footer({ children: [new Paragraph({
    children: [
      new TextRun({ text: `${text}  —  Trang `, font: FONT, size: 22, color: C.gray, italics: true }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 22, color: C.gray, italics: true }),
    ],
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 3, color: C.border, space: 3 } },
    spacing: { before: 60 },
  })] });
}
const emptyHF = (K) => new K({ children: [new Paragraph({ children: [] })] });

// ══════════════════════════════════════════════════════════════
// NỘI DUNG
// ══════════════════════════════════════════════════════════════
const DOC_TITLE = "GIÁO TRÌNH ÔN TẬP";
const TOPIC = "KỸ THUẬT VIÊN MÁY TÍNH";
const SUBTITLE = "Cấu trúc máy tính · CPU & socket · RAM · Ổ cứng · Chuẩn kết nối · Mạng cơ bản";
const VERSION = "1.0";
const STANDARD = "IEEE Std 1063-2001";
const YEAR = "2026";
const OWNER = "Nguyễn Quốc Anh";

const content = [];
const add = (...xs) => xs.flat().forEach((x) => content.push(x));

// ── HƯỚNG DẪN SỬ DỤNG ───────────────────────────────────────
add(H1plain("HƯỚNG DẪN SỬ DỤNG TÀI LIỆU", "huongdan"),
  body("Tài liệu này dùng để ôn kiến thức nền cho vị trí **Kỹ thuật viên máy tính** tại cửa hàng bán lẻ và trung tâm bảo hành: nhận biết linh kiện, tư vấn nâng cấp, lắp ráp, cài đặt và xử lý sự cố mạng cơ bản. Nội dung đi từ khái niệm tới thao tác thực tế, mỗi phần đều có bảng tra cứu để ôn nhanh trước buổi phỏng vấn."),
  bulls([
    "Mỗi chương gồm lý thuyết, bảng tra cứu, hình minh hoạ và **5 bài tập** xếp từ Dễ đến Khó. Đáp án gợi ý nằm ở **Phụ lục C**.",
    "Hộp **⚠ Lưu ý** đánh dấu lỗi hay gặp khi làm thực tế; hộp **✔ Mẹo** là kinh nghiệm khi tư vấn cho khách.",
    "**Phụ lục B** tổng hợp các câu hỏi phỏng vấn thường gặp kèm gợi ý trả lời.",
    "Số trong ngoặc vuông như [4] trỏ tới tài liệu tham khảo ở **Phụ lục A**; tra ảnh chụp linh kiện thật theo mục [28].",
    "Số liệu cập nhật đến tháng 9/2026. Phần cứng thay đổi rất nhanh: khi tư vấn cho khách, luôn đối chiếu trang thông số của nhà sản xuất.",
  ]),
  H3("", "Lịch ôn đề xuất trong 5 ngày"),
  table(["Ngày", "Nội dung", "Tự kiểm tra"], [
    ["1", "Chương I – Cấu trúc máy tính", "Vẽ lại Hình 1.1, 1.4 không nhìn sách"],
    ["2", "Chương II – CPU & socket; Chương III – RAM", "Đọc tên 5 CPU bất kỳ; tính băng thông RAM"],
    ["3", "Chương IV – Ổ cứng & lưu trữ", "Giải thích M.2 SATA khác M.2 NVMe"],
    ["4", "Chương V – Chuẩn kết nối; Chương VI – Mạng", "Bấm thứ tự màu T568B; đi hết Hình 6.5"],
    ["5", "Làm lại bài tập, Phụ lục B", "Trả lời to từng câu hỏi phỏng vấn trong 1 phút"],
  ], wd(900, 4300)),
  PB());

// ── PHỤ LỤC A – THAM KHẢO (đặt trước các chương theo IEEE) ───
add(H1plain("PHỤ LỤC A – TÀI LIỆU THAM KHẢO", "phulucA"),
  twoColTable([
    ["[1]", ref("IEEE Std 1063-2001, “IEEE Standard for Software User Documentation,” IEEE, 2001.")],
    ["[2]", ref("D. A. Patterson and J. L. Hennessy, “Computer Organization and Design: The Hardware/Software Interface,” 5th ed., Morgan Kaufmann, 2013.")],
    ["[3]", ref("CompTIA, “CompTIA A+ Core 1 (220-1101) Exam Objectives,” CompTIA, 2022. ", "https://www.comptia.org/certifications/a")],
    ["[4]", ref("JEDEC, “JESD79-4: DDR4 SDRAM Standard,” JEDEC Solid State Technology Association, 2012. ", "https://www.jedec.org")],
    ["[5]", ref("JEDEC, “JESD79-5: DDR5 SDRAM Standard,” JEDEC Solid State Technology Association, 2020.")],
    ["[6]", ref("Intel Corporation, “Intel Product Specifications (ARK),” [Trực tuyến]. ", "https://ark.intel.com")],
    ["[7]", ref("Advanced Micro Devices, “AMD Ryzen Processors — Product Specifications,” [Trực tuyến]. ", "https://www.amd.com")],
    ["[8]", ref("UEFI Forum, “Unified Extensible Firmware Interface Specification,” Version 2.10, 2022. ", "https://uefi.org/specifications")],
    ["[9]", ref("Microsoft, “Windows 11 Specifications and System Requirements,” [Trực tuyến]. ", "https://www.microsoft.com/windows/windows-11-specifications")],
    ["[10]", ref("PCI-SIG, “PCI Express Base Specification,” Revision 6.0, 2022. ", "https://pcisig.com")],
    ["[11]", ref("PCI-SIG, “PCI Express M.2 Specification,” Revision 1.0, 2013.")],
    ["[12]", ref("NVM Express, Inc., “NVM Express Base Specification,” Revision 2.0, 2021. ", "https://nvmexpress.org")],
    ["[13]", ref("SATA-IO, “Serial ATA Revision 3.0,” Serial ATA International Organization, 2009. ", "https://sata-io.org")],
    ["[14]", ref("SD Association, “Speed Class Standards & Application Performance Class,” [Trực tuyến]. ", "https://www.sdcard.org")],
    ["[15]", ref("USB Implementers Forum, “Universal Serial Bus 3.2 Specification,” 2017; “USB4 Specification,” Version 2.0, 2022. ", "https://www.usb.org")],
    ["[16]", ref("HDMI Licensing Administrator, “HDMI Specification 2.1b,” 2023. ", "https://www.hdmi.org")],
    ["[17]", ref("VESA, “DisplayPort Standard,” Version 2.1, 2022. ", "https://vesa.org")],
    ["[18]", ref("Intel Corporation, “ATX Version 3 Multi Rail Desktop Platform Power Supply Design Guide,” 2022.")],
    ["[19]", ref("CLEAResult, “80 PLUS Certified Power Supplies and Manufacturers,” [Trực tuyến]. ", "https://www.clearesult.com/80plus")],
    ["[20]", ref("ISO/IEC 7498-1:1994, “Information Technology — Open Systems Interconnection — Basic Reference Model,” ISO, 1994.")],
    ["[21]", ref("IEEE Std 802.3-2022, “IEEE Standard for Ethernet,” IEEE, 2022.")],
    ["[22]", ref("IEEE Std 802.11-2020, “Wireless LAN Medium Access Control (MAC) and Physical Layer (PHY) Specifications,” IEEE, 2021; IEEE 802.11be (Wi-Fi 7), 2024.")],
    ["[23]", ref("TIA, “ANSI/TIA-568.2-D: Balanced Twisted-Pair Telecommunications Cabling and Components Standard,” 2018.")],
    ["[24]", ref("R. Droms, “Dynamic Host Configuration Protocol,” RFC 2131, IETF, 1997. ", "https://www.rfc-editor.org/rfc/rfc2131")],
    ["[25]", ref("Y. Rekhter et al., “Address Allocation for Private Internets,” RFC 1918, IETF, 1996. ", "https://www.rfc-editor.org/rfc/rfc1918")],
    ["[26]", ref("P. Mockapetris, “Domain Names — Concepts and Facilities,” RFC 1034, IETF, 1987. ", "https://www.rfc-editor.org/rfc/rfc1034")],
    ["[27]", ref("S. Cheshire, B. Aboba and E. Guttman, “Dynamic Configuration of IPv4 Link-Local Addresses,” RFC 3927, IETF, 2005. ", "https://www.rfc-editor.org/rfc/rfc3927")],
    ["[28]", ref("Wikipedia, ảnh chụp linh kiện thật trong các bài “DDR5 SDRAM”, “CPU socket”, “M.2”, “SD card”, “USB hardware”, “ANSI/TIA-568”. ", "https://en.wikipedia.org/wiki/CPU_socket")],
  ], 800, ["Ref.", "Nguồn tài liệu"]),
  sp(120),
  body("Toàn bộ hình trong tài liệu do người biên soạn tự vẽ để minh hoạ nguyên lý; kích thước chỉ đúng tỉ lệ ở những hình có ghi “vẽ cùng tỉ lệ”."),
  PB());

// ══ CHƯƠNG I ══════════════════════════════════════════════════
add(H1("I", "CẤU TRÚC MÁY TÍNH", "c1"),
  H2("1.1", "Máy tính gồm những gì?"),
  body("Một máy tính gồm ba lớp: **phần cứng** (các linh kiện vật lý), **firmware** (chương trình nằm sẵn trên chip, như UEFI/BIOS của mainboard) và **phần mềm** (hệ điều hành, ứng dụng). Kỹ thuật viên làm việc chủ yếu ở hai lớp đầu: chọn, lắp và thay linh kiện; cấu hình UEFI/BIOS; cài hệ điều hành và driver."),
  body("Dù là máy bàn, laptop hay điện thoại, mọi máy tính đều làm bốn việc: **nhận dữ liệu vào, xử lý, lưu trữ và xuất kết quả ra**. Khi chẩn đoán lỗi, hãy tự hỏi lỗi nằm ở khâu nào trong bốn khâu này."),

  H2("1.2", "Kiến trúc von Neumann"),
  body("Hầu hết máy tính ngày nay theo kiến trúc von Neumann (1945): lệnh chương trình và dữ liệu cùng nằm trong một bộ nhớ; CPU lần lượt lấy lệnh ra, giải mã rồi thực thi. Các khối trao đổi với nhau qua bus hệ thống [2]."),
  fig("h1_1", "Sơ đồ khối kiến trúc von Neumann"),
  table(["Khối", "Vai trò"], [
    ["CU (Control Unit)", "Lấy lệnh từ bộ nhớ, giải mã và điều phối các khối khác."],
    ["ALU", "Thực hiện phép tính số học (cộng, trừ…) và logic (so sánh, AND, OR)."],
    ["Thanh ghi", "Ô nhớ cực nhanh bên trong CPU, giữ dữ liệu đang được tính."],
    ["Bộ nhớ chính (RAM)", "Chứa chương trình và dữ liệu đang chạy; mất khi tắt nguồn."],
    ["Thiết bị vào / ra", "Giao tiếp với người dùng và các thiết bị khác."],
    ["Bus", "Đường truyền chung: bus địa chỉ (chọn ô nhớ), bus dữ liệu (chở dữ liệu), bus điều khiển (tín hiệu đọc/ghi, ngắt)."],
  ], wd(2600)),
  body("**Điểm nghẽn von Neumann:** CPU tính nhanh hơn nhiều so với tốc độ RAM cấp dữ liệu, nên CPU phải có thêm nhiều tầng cache để giảm thời gian chờ. Đây cũng là lý do RAM chậm hoặc chạy kênh đơn làm cả máy chậm theo."),

  H2("1.3", "Phân cấp bộ nhớ và đơn vị đo"),
  body("Bộ nhớ được xếp thành nhiều tầng: càng gần CPU càng nhanh nhưng càng đắt và dung lượng càng nhỏ. Thanh ghi, cache và RAM là bộ nhớ **khả biến** (mất dữ liệu khi tắt nguồn); SSD và HDD là bộ nhớ **bất biến**."),
  fig("h1_2", "Tháp phân cấp bộ nhớ"),
  H3("1.3.1", "Vì sao ổ 1 TB chỉ hiện 931 GB?"),
  body("1 byte = 8 bit. Hãng sản xuất ổ tính theo hệ thập phân (1 GB = 10⁹ byte), còn Windows tính theo hệ nhị phân (1 GiB = 2³⁰ byte) nhưng vẫn ghi là “GB”. Vì vậy dung lượng hiển thị luôn nhỏ hơn con số trên hộp — ổ không bị thiếu."),
  table(["Ghi trên hộp", "Số byte", "Windows hiển thị"], [
    ["256 GB", "256 × 10⁹", "≈ 238 GB"],
    ["512 GB", "512 × 10⁹", "≈ 476 GB"],
    ["1 TB", "10¹²", "≈ 931 GB"],
    ["2 TB", "2 × 10¹²", "≈ 1,81 TB"],
  ], wd(2600, 3000)),
  body("Tốc độ đường truyền tính bằng **bit** mỗi giây: 1 Gb/s = 125 MB/s. Gói Internet 300 Mb/s chỉ tải tối đa khoảng 37,5 MB/s."),
  note("chữ **b** thường là bit, chữ **B** hoa là byte. Nhầm hai chữ này là lỗi tư vấn rất hay gặp."),

  H2("1.4", "Các linh kiện của một bộ máy bàn"),
  table(["Linh kiện", "Chức năng", "Thông số cần hỏi khi tư vấn"], [
    ["CPU", "Xử lý lệnh", "Số nhân/luồng, xung nhịp, socket, có iGPU không, công suất"],
    ["Mainboard", "Nối mọi linh kiện với nhau", "Socket, chipset, đời RAM, số khe M.2, kích thước (ATX, mATX, ITX)"],
    ["RAM", "Bộ nhớ làm việc", "Đời DDR, dung lượng, tốc độ (MT/s), số thanh"],
    ["Ổ lưu trữ", "Chứa hệ điều hành và dữ liệu", "SSD hay HDD, chuẩn SATA/NVMe, dung lượng"],
    ["Card đồ hoạ (GPU)", "Xử lý hình ảnh, xuất ra màn hình", "Dung lượng VRAM, công suất, số đầu nguồn, chiều dài card"],
    ["Nguồn (PSU)", "Đổi điện 220 V xoay chiều thành 12 V, 5 V, 3,3 V một chiều", "Công suất thực (W), chứng nhận 80 Plus, các đầu cắm"],
    ["Tản nhiệt", "Giữ nhiệt độ CPU an toàn", "Tản khí hay tản nước, socket hỗ trợ, chiều cao"],
    ["Vỏ máy (case)", "Chứa linh kiện, dẫn luồng gió", "Kích thước mainboard hỗ trợ, chiều dài card, số quạt"],
    ["Ngoại vi", "Nhập và xuất dữ liệu", "Màn hình, bàn phím, chuột, loa, máy in"],
  ], wd(1900, 2900)),

  H2("1.5", "Bo mạch chủ (mainboard)"),
  body("Mainboard là bảng mạch trung tâm. Trên các nền tảng hiện đại, CPU tự quản lý RAM, khe card đồ hoạ và khe M.2 chính; **chipset (PCH)** lo phần còn lại như cổng SATA, USB, mạng, âm thanh và nối với CPU qua một đường liên kết riêng."),
  fig("h1_3", "Sơ đồ khối mainboard hiện đại"),
  H3("1.5.1", "Kích thước mainboard (form factor)"),
  table(["Chuẩn", "Kích thước", "Khe mở rộng", "Ghi chú"], [
    ["ATX", "305 × 244 mm", "tới 7", "Phổ biến nhất, nhiều khe RAM và M.2"],
    ["Micro-ATX", "244 × 244 mm", "tới 4", "Máy văn phòng, gaming tầm trung"],
    ["Mini-ITX", "170 × 170 mm", "1", "Máy nhỏ gọn, thường chỉ 2 khe RAM"],
    ["E-ATX", "~305 × 330 mm", "7+", "Máy trạm, cao cấp; kích thước tuỳ hãng"],
  ], wd(1700, 2000, 1500)),
  body("Case lớn lắp được mainboard nhỏ hơn (case ATX lắp được mATX, ITX) nhưng không có chiều ngược lại."),
  H3("1.5.2", "Những thành phần cần nhận biết"),
  bulls([
    "**Socket CPU** và **VRM** (cụm cuộn cảm, tụ, MOSFET quanh socket) cấp điện cho CPU — VRM yếu sẽ bóp hiệu năng của CPU cao cấp.",
    "**Khe RAM (DIMM)**, **khe PCIe x16 / x1**, **khe M.2**, **cổng SATA**.",
    "**Chip BIOS/UEFI** và **pin CMOS CR2032** (3 V) giữ đồng hồ và cấu hình.",
    "**Header**: đầu nối nút nguồn, reset, đèn mặt trước (F_PANEL), USB mặt trước, âm thanh (HD_AUDIO), quạt (CPU_FAN, SYS_FAN), đèn RGB.",
    "**Cụm cổng sau (I/O panel)**: USB, LAN, âm thanh, cổng xuất hình.",
    "**Đèn debug** (Q-LED, EZ Debug LED…): CPU, DRAM, VGA, BOOT — đèn nào sáng đứng thì khâu đó đang lỗi.",
  ]),

  H2("1.6", "UEFI/BIOS và quá trình khởi động"),
  body("BIOS là firmware đời cũ; **UEFI** là chuẩn thay thế, phổ biến từ khoảng năm 2012 (thời Windows 8), hỗ trợ ổ lớn hơn 2 TB qua bảng phân vùng GPT, khởi động nhanh, dùng được chuột và có Secure Boot [8]. Người dùng vẫn quen gọi chung là “BIOS”."),
  fig("h1_4", "Quá trình khởi động máy tính"),
  H3("1.6.1", "Những thiết lập UEFI hay dùng"),
  table(["Thiết lập", "Dùng khi"], [
    ["Boot Order / Boot Menu", "Chọn USB cài Windows, đổi ổ khởi động. Phím mở Boot Menu tuỳ hãng: F8, F11, F12, Esc…"],
    ["XMP (Intel) / EXPO (AMD)", "Cho RAM chạy đúng tốc độ quảng cáo."],
    ["Secure Boot, TPM 2.0 (Intel PTT / AMD fTPM)", "Yêu cầu bắt buộc của Windows 11 [9]."],
    ["CSM", "Bật khi cần khởi động kiểu Legacy/MBR; tắt để chạy UEFI thuần."],
    ["SATA Mode / Intel VMD", "Bộ cài Windows không thấy ổ NVMe trên một số máy Intel → nạp driver Intel RST/VMD hoặc tắt VMD."],
    ["Fan curve, cảnh báo nhiệt", "Chỉnh tiếng ồn quạt, bảo vệ CPU."],
  ], wd(3100)),
  H3("1.6.2", "Xoá CMOS"),
  body("Khi máy không lên hình sau khi chỉnh sai (ép xung, bật XMP không ổn định), xoá CMOS để đưa UEFI về mặc định: rút điện, nối tắt jumper **CLR_CMOS** (hoặc nhấn nút Clear CMOS ở mặt sau) vài giây, hoặc tháo pin CR2032 vài phút."),
  note("laptop đời mới thường hàn pin CMOS hoặc dùng chung pin chính; không tự ý tháo nếu không có hướng dẫn của hãng."),

  H2("1.7", "Nguồn máy tính (PSU)"),
  body("PSU đổi điện xoay chiều 220 V thành điện một chiều 12 V (CPU, card đồ hoạ), 5 V và 3,3 V (ổ cứng, USB, chip). Nguồn kém là nguyên nhân phổ biến khiến máy tự tắt hoặc tự khởi động lại khi chạy nặng."),
  bulls([
    "**Ước lượng công suất nhanh:** (công suất tối đa CPU + công suất card đồ hoạ + khoảng 100 W cho phần còn lại) × 1,3. Tham khảo: máy văn phòng 350–450 W, gaming tầm trung 550–750 W, cao cấp 850–1.000 W trở lên.",
    "**Chứng nhận 80 Plus** — hiệu suất ở 50% tải (điện 115 V): Bronze 85%, Silver 88%, Gold 90%, Platinum 92%, Titanium 94% [19].",
    "**ATX 3.0 / 3.1:** chuẩn nguồn mới chịu được xung tải ngắn của card đồ hoạ đời mới, có sẵn đầu 12V-2x6 (16 chân) [18].",
    "Các đầu cắm của nguồn xem chi tiết ở Mục 5.5.",
  ]),

  H2("1.8", "Laptop khác máy bàn thế nào?"),
  table(["Hạng mục", "Máy bàn", "Laptop"], [
    ["CPU", "Cắm socket, thay được", "Hàn BGA, gần như không thay được"],
    ["RAM", "DIMM, 2–4 khe", "SO-DIMM 0–2 khe; nhiều máy hàn chết LPDDR"],
    ["Ổ lưu trữ", "SATA 2,5\"/3,5\" và M.2", "M.2 (1–2 khe); máy cũ có khay 2,5\" SATA"],
    ["Card đồ hoạ", "Card rời, thay được", "Hàn trên mainboard"],
    ["Nguồn", "PSU chuẩn ATX", "Sạc (adapter) + pin"],
    ["Card Wi-Fi", "Card PCIe/M.2 hoặc tích hợp", "M.2 2230 (khoá A/E) hoặc hàn chết"],
    ["Tản nhiệt", "Quạt lớn, dễ vệ sinh", "Ống đồng + quạt nhỏ, cần vệ sinh và thay keo định kỳ"],
  ], wd(1700, 3200)),
  tip("trước khi báo giá nâng cấp laptop, tra trang thông số chính hãng của đúng mã máy để biết RAM có hàn chết không, còn bao nhiêu khe trống và khe M.2 hỗ trợ chuẩn gì."),

  H2("1.9", "Quy trình lắp ráp một bộ máy bàn"),
  steps([
    "**Kiểm tra tương thích:** socket CPU – mainboard, đời RAM, kích thước mainboard và card đồ hoạ so với case, công suất nguồn. Chuẩn bị tua vít, dây rút, vòng đeo chống tĩnh điện.",
    "Đặt mainboard lên hộp giấy của nó. **Lắp CPU:** mở khung socket, căn dấu tam giác trên CPU với dấu trên socket, đặt thẳng xuống, không ấn, đóng khung.",
    "**Lắp RAM** đúng khe kênh đôi (Hình 3.2), ấn tới khi lẫy khoá bật.",
    "**Lắp SSD M.2** và tấm tản nhiệt M.2 (nhớ bóc lớp nilon trên miếng dán tản nhiệt).",
    "**Lắp tản nhiệt CPU:** bôi keo nếu tản chưa có sẵn keo, siết ốc chéo góc, cắm dây quạt vào CPU_FAN.",
    "Bắt ốc đỡ (standoff) vào case đúng vị trí lỗ mainboard, lắp I/O shield nếu mainboard không liền sẵn, đặt mainboard và bắt ốc.",
    "Lắp nguồn, ổ SATA, card đồ hoạ vào khe PCIe x16 trên cùng.",
    "**Đi dây:** 24 chân mainboard, 8 chân CPU (EPS), nguồn card đồ hoạ, SATA, dây mặt trước (F_PANEL), USB, âm thanh, quạt.",
    "Cắm màn hình vào card đồ hoạ rời (nếu có), bật máy, vào UEFI kiểm tra nhận đủ CPU, RAM, ổ; bật XMP/EXPO.",
    "Cài Windows, driver chipset – card đồ hoạ – mạng; theo dõi nhiệt độ và chạy thử tải nặng.",
  ]),
  note("máy dùng RAM DDR5 lần đầu khởi động có thể mất từ vài chục giây tới vài phút để “huấn luyện bộ nhớ” (memory training), màn hình đen trong lúc đó. Hãy đợi đủ lâu trước khi kết luận máy lỗi."),

  H2("1.10", "Bài tập Chương I"),
  exTable([
    { num: "I-1", title: "Kiến trúc von Neumann", level: "Dễ", desc: "Kể tên các khối trong kiến trúc von Neumann và nêu vai trò của từng khối." },
    { num: "I-2", title: "Xếp hạng tốc độ", level: "Dễ", desc: "Sắp xếp theo tốc độ truy cập giảm dần: HDD, cache L3, RAM, SSD NVMe, thanh ghi. Loại nào mất dữ liệu khi tắt nguồn?" },
    { num: "I-3", title: "Dung lượng hiển thị", level: "TB", desc: "Khách mua ổ 2 TB, Windows báo 1,81 TB. Giải thích cho khách và tính dung lượng Windows hiển thị cho ổ 4 TB." },
    { num: "I-4", title: "Chọn công suất nguồn", level: "TB", desc: "CPU có công suất tối đa 150 W, card đồ hoạ 220 W. Ước lượng công suất nguồn nên chọn và chứng nhận tối thiểu." },
    { num: "I-5", title: "Lên cấu hình văn phòng", level: "Khó", desc: "Lập danh sách linh kiện cho máy văn phòng dùng Core i5 thế hệ 12, không card rời, 16 GB RAM, SSD 512 GB. Chỉ ra ít nhất 4 điểm phải kiểm tra tương thích." },
  ]),
  PB());

// ══ CHƯƠNG II ═════════════════════════════════════════════════
add(H1("II", "CPU VÀ CÁC LOẠI SOCKET", "c2"),
  H2("2.1", "Các thông số của CPU"),
  table(["Thông số", "Ý nghĩa"], [
    ["Nhân (core) / luồng (thread)", "Số tác vụ chạy song song. Hyper-Threading (Intel) / SMT (AMD) cho mỗi nhân chạy 2 luồng; dòng Core Ultra 200S không còn Hyper-Threading."],
    ["Nhân P / nhân E (Intel từ thế hệ 12)", "P-core hiệu năng cao, E-core tiết kiệm điện. Vd. Core i5-12400 có 6 nhân P; Core i5-13600K có 6 nhân P + 8 nhân E."],
    ["Xung nhịp (GHz)", "Base clock (mặc định) và Boost/Turbo (tối đa khi tải ngắn)."],
    ["Cache L2 / L3", "Bộ nhớ đệm trong CPU; L3 lớn giúp chơi game (AMD X3D có thêm 3D V-Cache)."],
    ["Công suất (TDP / PBP, W)", "Để chọn tản nhiệt và nguồn. Intel ghi thêm công suất Turbo tối đa (MTP)."],
    ["iGPU", "Nhân đồ hoạ tích hợp. CPU không có iGPU thì bắt buộc lắp card rời mới có hình."],
    ["Tiến trình (nm)", "Công nghệ chế tạo; tiến trình mới thường mát và tiết kiệm điện hơn."],
  ], wd(3000)),

  H2("2.2", "Đọc tên CPU"),
  body("**Intel Core i5-12400F:** Core i5 là phân khúc (i3 phổ thông, i5 tầm trung, i7 cao, i9 cao nhất); **12** là thế hệ 12; **400** là mã sản phẩm (số lớn hơn thì mạnh hơn trong cùng thế hệ); **F** là không có iGPU."),
  body("**Intel Core Ultra 7 265K:** Ultra 7 là phân khúc; **2** là Core Ultra series 2; **65** là mã sản phẩm; **K** là mở khoá ép xung."),
  body("**AMD Ryzen 5 5600G:** Ryzen 5 là phân khúc (3/5/7/9); **5** là dòng 5000; **600** là mã sản phẩm; **G** là có iGPU mạnh."),
  table(["Hậu tố", "Ý nghĩa"], [
    ["K (Intel)", "Mở khoá ép xung — cần mainboard chipset Z mới ép xung được."],
    ["F (Intel; AMD từ Ryzen 7000)", "Không có iGPU — bắt buộc có card đồ hoạ rời."],
    ["X (AMD)", "Xung cao hơn bản không có X."],
    ["X3D (AMD)", "Có thêm 3D V-Cache, mạnh khi chơi game."],
    ["G (AMD)", "Có iGPU mạnh (APU) — hợp máy văn phòng không card rời."],
    ["T (Intel)", "Bản tiết kiệm điện cho máy mini."],
    ["U / H / HX (laptop; AMD thêm HS)", "U tiết kiệm điện, H/HX hiệu năng cao."],
  ], wd(3000)),
  note("từ Ryzen 7000, hầu hết CPU AMD có iGPU cơ bản đủ để xuất hình (trừ bản F). Ryzen 5000 trở về trước thì chỉ bản G mới có iGPU."),

  H2("2.3", "Kiểu chân: PGA, LGA, BGA"),
  body("Socket là đế cắm CPU trên mainboard. Mỗi socket khác nhau về số chân, kích thước, cơ chế khoá và vị trí lỗ bắt tản nhiệt, nên CPU chỉ lắp được lên mainboard đúng socket."),
  fig("h2_1", "Ba kiểu chân CPU"),
  note("chân của socket LGA rất mảnh; cong một chân có thể làm mất một kênh RAM hoặc máy không lên. Luôn giữ nắp bảo vệ socket khi chưa lắp CPU và khi gửi bảo hành."),

  H2("2.4", "Socket Intel cho máy bàn"),
  fig("h2_2", "Dòng thời gian socket Intel và AMD"),
  table(["Socket", "Ra mắt", "Thế hệ CPU", "Chipset tiêu biểu", "RAM"], [
    ["LGA 775", "2004", "Pentium 4/D, Core 2", "G31, G41, P45", "DDR2 / DDR3"],
    ["LGA 1156", "2009", "Core i thế hệ 1", "H55, P55", "DDR3"],
    ["LGA 1155", "2011", "Thế hệ 2 – 3", "H61, B75, Z77", "DDR3"],
    ["LGA 1150", "2013", "Thế hệ 4 – 5", "H81, B85, Z97", "DDR3"],
    ["LGA 1151", "2015", "Thế hệ 6 – 7", "H110, B250, Z270", "DDR4 (vài main DDR3L)"],
    ["LGA 1151 bản 2", "2017", "Thế hệ 8 – 9", "H310, B360, Z390", "DDR4"],
    ["LGA 1200", "2020", "Thế hệ 10 – 11", "H410, B460, B560, Z590", "DDR4"],
    ["LGA 1700", "2021", "Thế hệ 12 – 14", "H610, B660, B760, Z790", "DDR4 hoặc DDR5 (tuỳ main)"],
    ["LGA 1851", "2024", "Core Ultra 200S", "H810, B860, Z890", "DDR5"],
  ], wd(1600, 900, 1800, 2200), { fs: 22 }),
  note("LGA 1151 và LGA 1151 bản 2 cùng số chân nhưng **không tương thích**: CPU thế hệ 8–9 cần mainboard chipset 300 series. Tương tự, CPU thế hệ 11 không chạy trên mainboard H410/B460."),

  H2("2.5", "Socket AMD cho máy bàn"),
  table(["Socket", "Ra mắt", "Dòng CPU", "Chipset tiêu biểu", "RAM"], [
    ["AM3 / AM3+", "2009 / 2011", "Phenom II, Athlon II, FX", "760G, 970, 990FX", "DDR3"],
    ["FM2 / FM2+", "2012 / 2014", "APU A-series, Athlon X4", "A68H, A88X", "DDR3"],
    ["AM4 (PGA 1331)", "2017", "Ryzen 1000 → 5000", "A320, B450, B550, X570", "DDR4"],
    ["AM5 (LGA 1718)", "2022", "Ryzen 7000, 8000, 9000", "A620, B650, X670, B850, X870", "DDR5"],
  ], wd(1700, 1300, 2100, 2300), { fs: 22 }),
  body("AM4 là socket “sống lâu” nhất: một mainboard B450 có thể chạy từ Ryzen 2000 tới Ryzen 5000, nhưng phải cập nhật BIOS và kiểm tra danh sách CPU hỗ trợ (CPU Support List) của đúng mã mainboard [7]."),
  tip("tản nhiệt AM4 phần lớn lắp được lên AM5 vì giữ nguyên lỗ bắt; tản LGA 1200 muốn lắp lên LGA 1700 / 1851 thì cần bộ ngàm mới."),

  H2("2.6", "Socket máy trạm, máy chủ và laptop"),
  bulls([
    "**Intel Xeon:** LGA 2011-3, LGA 2066, LGA 3647, LGA 4189, LGA 4677… — đi với mainboard server và RAM ECC Registered.",
    "**AMD Threadripper:** TR4, sTRX4, sWRX8, sTR5; **AMD EPYC:** SP3, SP5, SP6.",
    "Ở Việt Nam hay gặp máy **Xeon đời cũ trên mainboard X79/X99** hàng Trung Quốc: rẻ, nhiều nhân nhưng tốn điện và không có iGPU.",
    "**Laptop:** gần như toàn bộ CPU hàn BGA nên không nâng cấp được CPU — hãy tư vấn khách nâng RAM, SSD thay vì CPU.",
  ]),

  H2("2.7", "Kiểm tra tương thích CPU – mainboard"),
  steps([
    "**Cùng socket.**",
    "**Chipset hỗ trợ đời CPU** — vd. CPU thế hệ 14 chạy được trên mainboard B660 nhưng cần BIOS mới.",
    "**Phiên bản BIOS:** xem CPU Support List trên trang hãng mainboard. Cần cập nhật mà không có CPU cũ thì dùng tính năng **BIOS Flashback** (nếu mainboard có).",
    "**VRM đủ khoẻ** cho CPU cao cấp — tránh ghép Core i9 với mainboard H610 giá rẻ.",
    "**Đời RAM:** LGA 1700 có mainboard bản DDR4 và bản DDR5 riêng, không dùng lẫn.",
    "**iGPU:** CPU không có iGPU thì cổng hình trên mainboard không dùng được.",
    "**Tản nhiệt** hỗ trợ socket và đủ sức giải nhiệt cho CPU.",
  ]),
  tip("tra danh sách CPU hỗ trợ của hãng mainboard hoặc dùng PCPartPicker để kiểm tra chéo trước khi báo giá cho khách."),

  H2("2.8", "Lắp CPU và keo tản nhiệt"),
  bulls([
    "Cầm CPU ở hai cạnh, không chạm vào mặt tiếp xúc hoặc chân.",
    "Căn dấu tam giác ở góc CPU với dấu trên socket; socket LGA còn có hai khấc định vị ở cạnh.",
    "Đặt thẳng xuống, không ấn, không trượt; đóng khung socket (nắp nhựa bảo vệ của LGA sẽ tự bật ra).",
    "Keo tản nhiệt: một lượng bằng hạt đậu ở giữa là đủ, lực ép của tản sẽ dàn đều keo. Mỗi lần tháo tản ra thì thay keo mới.",
    "Tháo tản trên AM4: cho máy chạy vài phút để keo ấm, xoay nhẹ tản trước khi kéo — tránh nhổ cả CPU khỏi socket làm cong chân.",
  ]),

  H2("2.9", "Lỗi thường gặp"),
  table(["Triệu chứng", "Nguyên nhân hay gặp"], [
    ["Lên nguồn, quạt quay, không lên hình, đèn CPU sáng", "BIOS chưa hỗ trợ CPU, cong chân socket, thiếu dây nguồn CPU 8 chân"],
    ["Máy chạy nhưng màn hình không có tín hiệu", "CPU không có iGPU mà màn hình lại cắm vào cổng của mainboard"],
    ["Máy tự tắt khi chạy nặng", "Quá nhiệt (tản lỏng, quên bóc nilon dưới đế tản, keo khô), nguồn yếu"],
    ["Hiệu năng thấp bất thường", "Quá nhiệt nên CPU tự hạ xung (thermal throttling), chế độ điện tiết kiệm"],
  ], wd(3600)),

  H2("2.10", "Bài tập Chương II"),
  exTable([
    { num: "II-1", title: "PGA – LGA – BGA", level: "Dễ", desc: "Phân biệt ba kiểu chân CPU, mỗi kiểu cho một ví dụ socket hoặc thiết bị." },
    { num: "II-2", title: "Đọc tên CPU", level: "Dễ", desc: "Giải nghĩa tên Intel Core i7-13700KF và AMD Ryzen 7 5700X3D. Mỗi CPU cần đi với mainboard socket gì, có cần card rời không?" },
    { num: "II-3", title: "Thế hệ 14 trên B660", level: "TB", desc: "Khách có mainboard B660 (DDR4), muốn lắp Core i5-14400. Được không? Cần làm gì trước khi lắp?" },
    { num: "II-4", title: "Nâng cấp trên AM4", level: "TB", desc: "Máy dùng Ryzen 5 2600 trên mainboard B450, khách muốn lên Ryzen 7 5700X. Tư vấn các bước và các điểm cần kiểm tra." },
    { num: "II-5", title: "Từ LGA 1200 lên LGA 1700", level: "Khó", desc: "Khách dùng Core i5-10400 + mainboard H410 + 16 GB DDR4, muốn lên Core i5-12400 và giữ lại nhiều linh kiện nhất. Đề xuất phương án và giải thích." },
  ]),
  PB());

// ══ CHƯƠNG III ════════════════════════════════════════════════
add(H1("III", "BỘ NHỚ RAM QUA CÁC ĐỜI", "c3"),
  H2("3.1", "RAM là gì?"),
  body("RAM (Random Access Memory) là bộ nhớ làm việc: hệ điều hành và ứng dụng đang mở được nạp từ ổ lưu trữ lên RAM để CPU truy cập nhanh. RAM máy tính là **DRAM** — mỗi bit lưu bằng một tụ điện rất nhỏ phải làm tươi liên tục, nên mất dữ liệu khi tắt nguồn. Cache trong CPU dùng **SRAM**: nhanh hơn nhưng đắt và tốn diện tích hơn nhiều."),
  body("Thiếu RAM, Windows phải dùng ổ lưu trữ làm bộ nhớ ảo (pagefile) nên máy chậm hẳn. Dung lượng tham khảo: văn phòng 8–16 GB; chơi game, đồ hoạ 16–32 GB; dựng video, chạy máy ảo 32–64 GB trở lên."),

  H2("3.2", "Các đời RAM"),
  table(["Đời", "Năm", "Chân DIMM", "Chân SO-DIMM", "Điện áp", "Tốc độ chuẩn"], [
    ["SDR SDRAM", "thập niên 1990", "168", "144", "3,3 V", "66–133 MHz"],
    ["DDR", "2000", "184", "200", "2,5 V", "200–400 MT/s"],
    ["DDR2", "2003", "240", "200", "1,8 V", "400–1066 MT/s"],
    ["DDR3", "2007", "240", "204", "1,5 V (DDR3L 1,35 V)", "800–2133 MT/s"],
    ["DDR4", "2014", "288", "260", "1,2 V", "1600–3200 MT/s"],
    ["DDR5", "2021", "288", "262", "1,1 V", "4800–8800 MT/s"],
  ], wd(1400, 1400, 1100, 1300, 1800), { fs: 22 }),
  body("Mỗi đời mới tăng tốc độ, tăng dung lượng tối đa và giảm điện áp [4], [5]. **Các đời RAM không tương thích với nhau**: khác số chân, khác vị trí khấc, khác điện áp."),
  fig("h3_1", "Các phần của thanh RAM DIMM và SO-DIMM"),
  H3("3.2.1", "DDR5 có gì mới?"),
  bulls([
    "Chip quản lý điện **PMIC** nằm ngay trên thanh RAM (DDR4 để mainboard lo phần này).",
    "Mỗi thanh chia thành **hai kênh con 32 bit** độc lập nên truy cập hiệu quả hơn.",
    "**ECC trên chip** (on-die ECC) tự sửa lỗi bên trong chip nhớ — khác với RAM ECC của máy chủ.",
    "Có dung lượng “lẻ” như 24 GB, 48 GB mỗi thanh.",
    "Tốc độ khởi điểm 4800 MT/s; phổ biến hiện nay là 5600–6400 MT/s.",
  ]),

  H2("3.3", "Đọc thông số RAM"),
  H3("3.3.1", "MHz hay MT/s?"),
  body("DDR (Double Data Rate) truyền dữ liệu hai lần trong mỗi chu kỳ xung. DDR4-3200 có xung thật 1600 MHz nhưng truyền 3200 triệu lần mỗi giây (**3200 MT/s**). Phần mềm CPU-Z hiển thị 1600 MHz là đúng, không phải RAM chạy thiếu tốc độ. Cửa hàng thường ghi “3200 MHz” — cách gọi quen miệng nhưng không chính xác."),
  H3("3.3.2", "Băng thông và tên PC"),
  body("Băng thông một thanh = tốc độ (MT/s) × 8 byte. DDR4-3200 → 3200 × 8 = 25.600 MB/s, nên còn gọi là **PC4-25600**. Chạy kênh đôi thì băng thông lý thuyết gấp đôi: 51.200 MB/s."),
  table(["Tên theo tốc độ", "Tên theo băng thông", "Băng thông 1 thanh"], [
    ["DDR3-1600", "PC3-12800", "12,8 GB/s"],
    ["DDR4-2666", "PC4-21300", "21,3 GB/s"],
    ["DDR4-3200", "PC4-25600", "25,6 GB/s"],
    ["DDR5-4800", "PC5-38400", "38,4 GB/s"],
    ["DDR5-5600", "PC5-44800", "44,8 GB/s"],
    ["DDR5-6000", "PC5-48000", "48,0 GB/s"],
  ], wd(2800, 3000)),
  H3("3.3.3", "Độ trễ CL"),
  body("CL (CAS Latency) là số chu kỳ phải chờ. Muốn so sánh hai thanh khác tốc độ phải đổi ra nano giây: **độ trễ thực (ns) = CL × 2000 ÷ tốc độ (MT/s)**. DDR4-3200 CL16 = 10 ns; DDR5-6000 CL30 = 10 ns → cùng độ trễ nhưng DDR5 có băng thông gần gấp đôi."),
  H3("3.3.4", "Đọc nhãn trên thanh RAM"),
  body("Nhãn chuẩn JEDEC trên RAM của các hãng chip (Samsung, SK hynix, Micron) có dạng **8GB 1Rx8 PC4-3200AA-SA2-11**:"),
  bulls([
    "**8GB** — dung lượng.",
    "**1Rx8** — 1 rank, chip nhớ độ rộng 8 bit (2R là 2 rank).",
    "**PC4-3200AA** — DDR4, 3200 MT/s; AA là cấp thời gian theo JEDEC (tương ứng CL22).",
    "Chữ cái đầu của cụm sau: **S** là SO-DIMM (như SA2), **U** là DIMM máy bàn, **R** là Registered của máy chủ.",
  ]),

  H2("3.4", "DIMM, SO-DIMM, LPDDR và CAMM2"),
  bulls([
    "**DIMM** — máy bàn, dài 133,35 mm.",
    "**SO-DIMM** — laptop, mini PC, dài khoảng 67,6–69,6 mm.",
    "**LPDDR** (LPDDR4X, LPDDR5, LPDDR5X) — RAM điện áp thấp hàn thẳng lên mainboard laptop mỏng, không nâng cấp được.",
    "**CAMM2 / LPCAMM2** — chuẩn module mới của JEDEC (2023), mỏng, bắt vít áp lên mainboard; đã có trên một số laptop.",
    "**RDIMM / ECC** — RAM có thanh ghi đệm và sửa lỗi cho máy chủ, không cắm lẫn vào mainboard phổ thông.",
  ]),

  H2("3.5", "Kênh đôi và cách cắm RAM"),
  body("Mỗi kênh RAM là một đường truyền 64 bit riêng giữa CPU và RAM. Cắm hai thanh vào hai kênh khác nhau thì CPU đọc cả hai cùng lúc — băng thông gấp đôi, đặc biệt quan trọng với máy dùng iGPU vì iGPU lấy RAM làm bộ nhớ đồ hoạ."),
  fig("h3_2", "Khe RAM và cách cắm để chạy kênh đôi"),
  body("Cắm hai thanh khác dung lượng (8 GB + 16 GB) thì nhiều nền tảng vẫn chạy kênh đôi một phần (Intel gọi là Flex Mode): phần dung lượng bằng nhau chạy kênh đôi, phần dư chạy kênh đơn."),
  tip("laptop có 8 GB RAM hàn sẵn và một khe trống: gắn thêm thanh 8 GB cùng chuẩn để được 16 GB chạy kênh đôi."),

  H2("3.6", "XMP, EXPO và ECC"),
  body("Thanh RAM gaming quảng cáo 3600, 6000 MT/s… nhưng mặc định chỉ chạy mức chuẩn JEDEC (vd. DDR4 2133–2666, DDR5 4800). Muốn đạt tốc độ quảng cáo phải bật hồ sơ **XMP** (Intel) hoặc **EXPO** (AMD) trong UEFI. Đây là mức ép xung được hãng RAM bảo đảm, nhưng vẫn có thể không ổn định nếu bộ điều khiển RAM của CPU hoặc mainboard không theo kịp."),

  H2("3.7", "Tư vấn nâng cấp RAM"),
  steps([
    "Xác định mã máy; tra thông số hãng: đời RAM, dung lượng tối đa, số khe, RAM hàn hay rời.",
    "Kiểm tra trong Windows: **Task Manager → Performance → Memory** (tốc độ, số khe đã dùng “Slots used”); **CPU-Z** tab SPD để xem từng thanh.",
    "Chọn thanh cùng đời, tốt nhất cùng tốc độ và dung lượng với thanh đang có; laptop dùng SO-DIMM.",
    "Tắt máy, rút sạc, ngắt pin (laptop), đeo vòng chống tĩnh điện.",
    "Laptop: cắm thanh nghiêng khoảng 30–45° rồi ấn xuống tới khi lẫy khoá bật. Máy bàn: ấn thẳng tới khi lẫy khoá bật.",
    "Khởi động, kiểm tra nhận đủ dung lượng; chạy **Windows Memory Diagnostic** hoặc **MemTest86** nếu nghi RAM lỗi.",
  ]),

  H2("3.8", "Lỗi thường gặp"),
  table(["Triệu chứng", "Nguyên nhân hay gặp"], [
    ["Không lên hình, kêu bíp hoặc đèn DRAM sáng", "Thanh chưa cắm chặt, chân bẩn/ôxi hoá (lau bằng gôm), sai khe, thanh hỏng"],
    ["Nhận thiếu dung lượng", "Cắm chưa chặt, khe hỏng, cong chân socket CPU, Windows 32-bit (tối đa khoảng 4 GB)"],
    ["Màn hình xanh, treo ngẫu nhiên", "RAM lỗi, XMP/EXPO không ổn định, trộn thanh khác loại"],
    ["RAM chạy thấp hơn quảng cáo", "Chưa bật XMP/EXPO; cắm 4 thanh làm giảm tốc độ tối đa; trộn với thanh chậm hơn"],
  ], wd(3300)),

  H2("3.9", "Bài tập Chương III"),
  exTable([
    { num: "III-1", title: "Số chân các đời", level: "Dễ", desc: "Điền số chân DIMM và SO-DIMM của DDR3, DDR4, DDR5. Vì sao DDR4 và DDR5 cùng 288 chân mà không cắm lẫn được?" },
    { num: "III-2", title: "Tên PC và băng thông", level: "Dễ", desc: "DDR4-2666 và DDR5-5600 tương ứng tên PC nào? Tính băng thông lý thuyết khi DDR5-5600 chạy kênh đôi." },
    { num: "III-3", title: "Độ trễ thực", level: "TB", desc: "So sánh độ trễ thực của DDR4-3200 CL22 và DDR5-6000 CL36. Thanh nào phản hồi nhanh hơn?" },
    { num: "III-4", title: "Laptop 8 GB hàn + 1 khe", level: "TB", desc: "Laptop có 8 GB DDR4-3200 hàn trên mainboard và một khe SO-DIMM trống. Khách muốn lên 16 GB. Tư vấn loại thanh và giải thích chế độ kênh." },
    { num: "III-5", title: "Trộn RAM", level: "Khó", desc: "Máy bàn có 2×8 GB DDR4-2666 CL19 ở khe A2/B2. Khách mua thêm 2×16 GB DDR4-3200 CL16 cắm vào A1/B1. Dự đoán dung lượng, tốc độ chạy, rủi ro; đề xuất phương án tốt hơn." },
  ]),
  PB());

// ══ CHƯƠNG IV ═════════════════════════════════════════════════
add(H1("IV", "Ổ CỨNG VÀ THIẾT BỊ LƯU TRỮ", "c4"),
  H2("4.1", "Ổ cứng cơ (HDD)"),
  body("HDD lưu dữ liệu bằng từ tính trên các đĩa quay. Muốn đọc một tệp, đầu đọc phải di chuyển tới đúng rãnh và chờ đĩa quay tới đúng vị trí, nên truy cập ngẫu nhiên chậm hơn SSD hàng trăm lần. Bù lại HDD rẻ trên mỗi TB, hợp cho lưu trữ dung lượng lớn, sao lưu, camera an ninh và NAS."),
  fig("h4_1", "Cấu tạo bên trong ổ cứng HDD"),
  table(["Thông số", "Giá trị thường gặp", "Ghi chú"], [
    ["Kích thước", "3,5\" (máy bàn, NAS); 2,5\" (laptop, ổ di động)", "Ổ 2,5\" dày 7 mm hoặc 9,5 mm"],
    ["Tốc độ quay", "5.400 / 7.200 vòng/phút", "7.200 nhanh hơn nhưng nóng và ồn hơn"],
    ["Bộ đệm (cache)", "64 – 512 MB", ""],
    ["Giao tiếp", "SATA III 6 Gb/s", ""],
    ["Công nghệ ghi", "CMR hoặc SMR", "SMR ghi chồng rãnh, ghi liên tục chậm — không nên dùng cho NAS/RAID"],
    ["Dòng chuyên dụng", "NAS: WD Red Plus, Seagate IronWolf; camera: WD Purple, Seagate SkyHawk", "Chạy 24/7, chịu rung tốt hơn"],
  ], wd(1900, 3600)),

  H2("4.2", "Ổ thể rắn (SSD)"),
  body("SSD lưu dữ liệu trên chip nhớ flash **NAND**, không có bộ phận chuyển động nên nhanh, êm, chịu va đập tốt. Một SSD gồm bộ điều khiển (controller), các chip NAND và, tuỳ loại, một chip DRAM làm bộ đệm. SSD không có DRAM (DRAM-less) rẻ hơn; bản NVMe có thể mượn một phần RAM máy qua tính năng **HMB** (Host Memory Buffer)."),
  table(["Loại NAND", "Bit / ô nhớ", "Độ bền", "Thường dùng cho"], [
    ["SLC", "1", "Cao nhất", "Công nghiệp; vùng đệm SLC cache trong SSD"],
    ["MLC", "2", "Cao", "SSD cao cấp đời cũ"],
    ["TLC", "3", "Trung bình", "Phổ biến nhất hiện nay"],
    ["QLC", "4", "Thấp hơn", "Dung lượng lớn giá rẻ, ghi liên tục chậm"],
  ], wd(1500, 1400, 1600)),
  bulls([
    "**TBW** (terabytes written) — tổng lượng dữ liệu được ghi trong thời hạn bảo hành; SSD 1 TB phổ thông thường khoảng 600 TBW.",
    "**SLC cache** — SSD TLC/QLC dùng một phần dung lượng làm vùng ghi nhanh. Chép tệp lớn vượt quá vùng này thì tốc độ ghi tụt mạnh — không phải ổ lỗi.",
    "**TRIM** — lệnh giúp SSD giữ tốc độ lâu dài; Windows tự bật.",
    "SSD để lâu không cấp điện có thể mất dữ liệu, nhất là khi đã hao mòn — không nên dùng SSD làm nơi lưu trữ lạnh duy nhất.",
  ]),

  H2("4.3", "Kiểu dáng: 2,5 inch, mSATA, M.2"),
  bulls([
    "**2,5\" SATA** — cùng kích thước HDD laptop, thay HDD cũ rất dễ; tối đa khoảng 550 MB/s.",
    "**mSATA** — dạng card nhỏ trên laptop khoảng 2010–2014, nay hiếm gặp.",
    "**M.2** — thanh nhỏ rộng 22 mm cắm thẳng lên mainboard; có thể chạy chuẩn SATA hoặc NVMe (PCIe) [11].",
    "**U.2, E1.S** — dùng trong máy chủ.",
  ]),
  fig("h4_2", "Kích thước và khấc của SSD M.2"),
  note("M.2 chỉ là hình dạng. Ổ M.2 SATA và M.2 NVMe trông gần giống nhau nhưng khe M.2 trên máy có thể chỉ hỗ trợ một loại. Luôn tra sách hướng dẫn: khe ghi “PCIe” hay “SATA”, “Gen3”, “Gen4” hay “Gen5”."),

  H2("4.4", "Giao thức và tốc độ: SATA, NVMe, PCIe"),
  body("SATA/AHCI được thiết kế cho HDD, trần khoảng 550 MB/s [13]. **NVMe** là giao thức sinh ra cho bộ nhớ flash, chạy trên các lane PCIe nối gần như thẳng vào CPU, có rất nhiều hàng đợi lệnh song song nên nhanh hơn nhiều [12]."),
  fig("h4_3", "So sánh tốc độ đọc tuần tự của các loại ổ"),
  table(["Chuẩn", "Băng thông lý thuyết", "Tốc độ đọc thực tế cao nhất"], [
    ["SATA III", "6 Gb/s", "~550 MB/s"],
    ["NVMe PCIe 3.0 x4", "~3,9 GB/s", "~3.500 MB/s"],
    ["NVMe PCIe 4.0 x4", "~7,9 GB/s", "~7.000 – 7.450 MB/s"],
    ["NVMe PCIe 5.0 x4", "~15,8 GB/s", "~14.000 – 14.900 MB/s"],
  ], wd(2600, 2600)),
  tip("ổ NVMe Gen4 cắm vào khe Gen3 vẫn chạy, chỉ bị giới hạn ở tốc độ Gen3 — PCIe tương thích cả hai chiều."),
  tip("với người dùng văn phòng, khác biệt cảm nhận giữa SSD SATA và NVMe nhỏ hơn nhiều so với từ HDD lên SSD. Thay HDD bằng bất kỳ SSD nào là nâng cấp đáng tiền nhất cho máy cũ."),

  H2("4.5", "Phân vùng và định dạng"),
  table(["Tiêu chí", "MBR", "GPT"], [
    ["Dung lượng ổ tối đa", "2 TB (chính xác là 2 TiB)", "Rất lớn, vượt xa nhu cầu hiện nay"],
    ["Số phân vùng chính", "4 (hoặc 3 + phân vùng mở rộng)", "128 trên Windows"],
    ["Chế độ khởi động", "Legacy BIOS", "UEFI"],
    ["Windows 11", "Không khởi động được", "Bắt buộc"],
  ], wd(2600, 3000)),
  table(["Hệ thống tệp", "Dùng cho", "Giới hạn"], [
    ["NTFS", "Ổ cài Windows, ổ dữ liệu", "macOS chỉ đọc được"],
    ["FAT32", "USB, thẻ nhớ nhỏ, USB cài Windows chế độ UEFI", "Mỗi tệp tối đa 4 GB"],
    ["exFAT", "USB, thẻ nhớ từ 64 GB, ổ dùng chung Windows – macOS", "Không có nhật ký, rút nóng dễ lỗi"],
    ["APFS / ext4", "macOS / Linux", "Windows không đọc sẵn"],
  ], wd(1800, 4000)),

  H2("4.6", "Thay ổ, chuyển dữ liệu và cài Windows"),
  H3("4.6.1", "Nhân bản (clone) sang SSD"),
  steps([
    "Kiểm tra dung lượng đã dùng trên ổ cũ nhỏ hơn dung lượng ổ mới; dọn bớt nếu cần.",
    "**Sao lưu dữ liệu quan trọng trước** — clone lỗi có thể làm mất dữ liệu.",
    "Gắn SSD mới (khe thứ hai hoặc box/đầu đọc USB), dùng phần mềm clone của hãng SSD hoặc Clonezilla để nhân bản toàn bộ ổ.",
    "Tháo ổ cũ hoặc đổi Boot Order sang SSD mới; khởi động và kiểm tra.",
    "Ổ cũ dạng MBR mà muốn chuyển sang UEFI: chạy mbr2gpt (quyền Administrator) rồi đổi UEFI sang chế độ UEFI, tắt CSM.",
  ]),
  ...codeBlock([
    "mbr2gpt /validate /disk:0 /allowFullOS",
    "    → kiểm tra ổ có chuyển được không",
    "mbr2gpt /convert /disk:0 /allowFullOS",
    "    → chuyển MBR sang GPT, giữ nguyên dữ liệu",
  ]),
  H3("4.6.2", "Cài mới Windows"),
  steps([
    "Tạo USB cài đặt (tối thiểu 8 GB) bằng Media Creation Tool của Microsoft hoặc Rufus.",
    "Vào Boot Menu, chọn USB ở chế độ **UEFI**.",
    "Bộ cài không thấy ổ: nạp driver lưu trữ (Intel RST/VMD) hoặc tắt VMD trong UEFI.",
    "Cài sạch: xoá hết phân vùng cũ trên ổ muốn cài, chọn vùng trống; Windows tự tạo các phân vùng EFI, MSR, Recovery.",
    "Cài xong: cài driver chipset, card đồ hoạ, mạng; cập nhật Windows; kích hoạt bản quyền.",
  ]),
  note("Windows 11 yêu cầu khởi động UEFI có Secure Boot, TPM 2.0, CPU từ Intel thế hệ 8 hoặc AMD Ryzen 2000 trở lên, RAM 4 GB và ổ 64 GB [9]."),

  H2("4.7", "Thẻ nhớ và USB"),
  body("Thẻ nhớ và USB flash cũng là bộ nhớ NAND nhưng chậm và kém bền hơn SSD. Chọn thẻ theo thiết bị: máy quay cần tốc độ ghi tối thiểu (lớp V), điện thoại và máy chơi game cần tốc độ đọc ghi ngẫu nhiên (lớp A), camera hành trình và camera an ninh ghi liên tục cần dòng độ bền cao [14]."),
  fig("h4_4", "Giải mã ký hiệu trên thẻ nhớ SD / microSD"),
  table(["Nhu cầu", "Nên chọn"], [
    ["Điện thoại Android, Nintendo Switch", "microSDXC A2 (hoặc A1), U3. Riêng Nintendo Switch 2 bắt buộc dùng thẻ microSD Express."],
    ["Máy ảnh chụp ảnh, quay Full HD", "SDXC U1/U3, V10 – V30"],
    ["Quay 4K", "U3 / V30 trở lên; quay 8K, RAW: V60 – V90, bus UHS-II"],
    ["Camera hành trình, camera an ninh", "Dòng High Endurance / Max Endurance, U3 / V30"],
    ["USB chép dữ liệu", "USB 5 Gbps trở lên; tệp lớn hơn 4 GB cần định dạng exFAT hoặc NTFS"],
  ], wd(3000)),
  note("thẻ giả, “thẻ ảo dung lượng” rất phổ biến: báo 128 GB nhưng chỉ ghi được 8 GB. Kiểm tra bằng H2testw (Windows) hoặc F3 trước khi giao cho khách."),

  H2("4.8", "Kiểm tra sức khoẻ ổ"),
  bulls([
    "**S.M.A.R.T.** — ổ tự ghi nhận tình trạng; xem bằng CrystalDiskInfo (Good / Caution / Bad) hoặc Hard Disk Sentinel.",
    "HDD: để ý các chỉ số Reallocated Sectors, Pending Sectors, Uncorrectable — tăng dần là ổ sắp hỏng.",
    "SSD: xem phần trăm tuổi thọ đã dùng (Percentage Used) và tổng dữ liệu đã ghi so với TBW.",
    "Dấu hiệu HDD sắp hỏng: tiếng lạch cạch, máy treo khi mở tệp, chép rất chậm → sao lưu ngay.",
    "Đo tốc độ đọc ghi bằng CrystalDiskMark.",
  ]),

  H2("4.9", "Bài tập Chương IV"),
  exTable([
    { num: "IV-1", title: "HDD và SSD", level: "Dễ", desc: "So sánh HDD và SSD về nguyên lý lưu trữ, tốc độ, độ bền, giá. Mỗi loại hợp với nhu cầu nào?" },
    { num: "IV-2", title: "Giải mã thẻ nhớ", level: "Dễ", desc: "Giải nghĩa các ký hiệu trên thẻ “microSDXC 128GB UHS-I U3 V30 A2”. Thẻ này quay video 4K được không?" },
    { num: "IV-3", title: "Khe M.2 nào lắp ổ nào", level: "TB", desc: "Khe M.2 laptop ghi “M.2 2280, PCIe 4.0 x4 NVMe”. Ổ nào dùng được: (a) SSD 2,5\" SATA; (b) M.2 2280 SATA (B+M key); (c) M.2 2280 NVMe PCIe 3.0; (d) M.2 2230 NVMe PCIe 4.0?" },
    { num: "IV-4", title: "Ổ dữ liệu 4 TB", level: "TB", desc: "Ổ HDD 4 TB làm ổ dữ liệu trên Windows: chọn MBR hay GPT, hệ thống tệp gì? Nếu cần dùng chung với macOS thì sao?" },
    { num: "IV-5", title: "Chuyển HDD sang NVMe", level: "Khó", desc: "Laptop Windows 10 chạy HDD 1 TB (đã dùng 380 GB), khởi động Legacy/MBR. Khách muốn thay SSD NVMe 512 GB, giữ nguyên dữ liệu và chuẩn bị lên Windows 11. Lập quy trình đầy đủ." },
  ]),
  PB());

// ══ CHƯƠNG V ══════════════════════════════════════════════════
add(H1("V", "CÁC CHUẨN KẾT NỐI", "c5"),
  H2("5.1", "Khe mở rộng PCI Express (PCIe)"),
  body("PCIe truyền dữ liệu nối tiếp qua các làn (lane). Khe x1, x4, x8, x16 có từ 1 đến 16 làn; mỗi thế hệ gấp đôi tốc độ mỗi làn [10]. PCIe tương thích hai chiều: card đời mới chạy trên khe đời cũ (theo tốc độ đời cũ) và ngược lại."),
  table(["Thế hệ", "Năm", "Mỗi làn", "x4", "x16"], [
    ["PCIe 1.0", "2003", "250 MB/s", "1 GB/s", "4 GB/s"],
    ["PCIe 2.0", "2007", "500 MB/s", "2 GB/s", "8 GB/s"],
    ["PCIe 3.0", "2010", "~985 MB/s", "~3,9 GB/s", "~15,8 GB/s"],
    ["PCIe 4.0", "2017", "~1,97 GB/s", "~7,9 GB/s", "~31,5 GB/s"],
    ["PCIe 5.0", "2019", "~3,94 GB/s", "~15,8 GB/s", "~63 GB/s"],
    ["PCIe 6.0", "2022", "~7,6 GB/s", "~30 GB/s", "~121 GB/s"],
  ], wd(1600, 1100, 1900, 1900)),
  body("PCIe 6.0 và 7.0 (đặc tả công bố năm 2025) hiện chủ yếu dùng cho máy chủ và trung tâm dữ liệu; máy tính cá nhân phổ biến nhất là Gen4 và Gen5."),
  note("khe x16 dài nhưng có thể chỉ nối điện 4 làn (in trên mainboard: “PCIe x16 (x4 mode)”). Card đồ hoạ luôn cắm khe x16 trên cùng, gần CPU nhất. Trên nhiều mainboard, dùng khe M.2 thứ hai sẽ tắt bớt cổng SATA hoặc hạ khe PCIe — đọc mục chia sẻ lane trong sách hướng dẫn."),

  H2("5.2", "SATA"),
  bulls([
    "Cáp dữ liệu 7 chân (hình chữ L) nối ổ với mainboard; cáp nguồn SATA 15 chân lấy từ PSU.",
    "SATA I 1,5 Gb/s, SATA II 3 Gb/s, SATA III 6 Gb/s (khoảng 550–600 MB/s thực tế); tương thích ngược.",
    "Ổ 2,5\" và 3,5\" dùng chung đầu cắm SATA.",
  ]),

  H2("5.3", "USB và Thunderbolt"),
  body("USB đổi tên nhiều lần nên khách và cả người bán rất dễ nhầm. Hãy nhớ theo **tốc độ (Gb/s)** thay vì tên phiên bản. Từ năm 2022, USB-IF khuyến nghị ghi thẳng tốc độ trên bao bì: USB 5Gbps, USB 10Gbps, USB 20Gbps, USB 40Gbps, USB 80Gbps [15]."),
  table(["Tên kỹ thuật", "Tên cũ / tên khác", "Tốc độ", "Nhận biết"], [
    ["USB 2.0", "Hi-Speed", "480 Mb/s", "Lõi đen hoặc trắng"],
    ["USB 3.2 Gen 1", "USB 3.0, USB 3.1 Gen 1", "5 Gb/s", "Lõi xanh dương, ký hiệu SS"],
    ["USB 3.2 Gen 2", "USB 3.1 Gen 2", "10 Gb/s", "Ký hiệu SS 10; lõi xanh ngọc hoặc đỏ tuỳ hãng"],
    ["USB 3.2 Gen 2x2", "—", "20 Gb/s", "Chỉ có trên cổng USB-C"],
    ["USB4", "USB 20Gbps / 40Gbps", "20 – 40 Gb/s", "USB-C"],
    ["USB4 Version 2.0", "USB 80Gbps", "80 Gb/s", "USB-C"],
  ], wd(1900, 2300, 1400)),
  fig("h5_1", "Các kiểu đầu cắm USB (nhìn thẳng vào cổng)"),
  H3("5.3.1", "Sạc qua USB"),
  bulls([
    "Cổng USB 2.0 cấp 0,5 A (2,5 W); USB 3.x cấp 0,9 A (4,5 W).",
    "**USB Power Delivery (PD):** tới 100 W (20 V × 5 A); **PD 3.1 EPR** tới 240 W (48 V × 5 A). Dòng 5 A cần cáp có chip e-marker.",
    "Sạc nhanh điện thoại: PD, PPS (Samsung), Quick Charge (Qualcomm) — cả củ sạc và cáp cùng hỗ trợ mới đạt tốc độ tối đa.",
  ]),
  H3("5.3.2", "Thunderbolt"),
  table(["Chuẩn", "Năm", "Tốc độ", "Ghi chú"], [
    ["Thunderbolt 3", "2015", "40 Gb/s", "Cổng USB-C, biểu tượng tia sét"],
    ["Thunderbolt 4", "2020", "40 Gb/s", "Yêu cầu tối thiểu cao hơn: 2 màn hình 4K, PCIe 32 Gb/s, sạc laptop"],
    ["Thunderbolt 5", "2023", "80 Gb/s (tới 120 Gb/s cho màn hình)", "Dựa trên USB4 Version 2.0"],
  ], wd(1700, 900, 2500)),

  H2("5.4", "Chuẩn xuất hình"),
  fig("h5_2", "Các cổng xuất hình"),
  table(["Chuẩn", "Tín hiệu", "Băng thông", "Độ phân giải tiêu biểu", "Âm thanh"], [
    ["VGA", "Analog", "—", "Tới 1920×1080, hình kém nét dần", "Không"],
    ["DVI-D (single / dual link)", "Số", "3,96 / 7,92 Gb/s", "1920×1200 / 2560×1600 @60 Hz", "Không"],
    ["HDMI 1.4", "Số", "10,2 Gb/s", "4K@30 Hz", "Có"],
    ["HDMI 2.0", "Số", "18 Gb/s", "4K@60 Hz", "Có"],
    ["HDMI 2.1", "Số", "48 Gb/s", "4K@120 Hz, 8K@60 Hz (nén DSC)", "Có"],
    ["DisplayPort 1.2", "Số", "21,6 Gb/s", "4K@60 Hz", "Có"],
    ["DisplayPort 1.4", "Số", "32,4 Gb/s", "4K@120 Hz, 8K@60 Hz (nén DSC)", "Có"],
    ["DisplayPort 2.1", "Số", "Tới 80 Gb/s", "4K@240 Hz, 8K", "Có"],
  ], wd(2000, 1000, 1600, 3000), { fs: 22 }),
  body("HDMI 2.2 (công bố năm 2025) nâng băng thông lên 96 Gb/s, cần cáp chuẩn mới [16], [17]."),
  bulls([
    "Máy có card đồ hoạ rời: cắm màn hình vào card, không cắm vào cổng của mainboard.",
    "Màn hình 144 Hz trở lên nên dùng DisplayPort hoặc HDMI 2.0/2.1 với cáp đúng chuẩn; cáp HDMI đời cũ có thể chỉ cho 60 Hz.",
    "Cáp chuyển USB-C sang HDMI chỉ hoạt động khi cổng USB-C có hỗ trợ xuất hình (DP Alt Mode — thường có biểu tượng DisplayPort hoặc tia sét cạnh cổng).",
  ]),

  H2("5.5", "Đầu cấp nguồn từ PSU"),
  table(["Đầu cắm", "Số chân", "Cấp cho", "Ghi chú"], [
    ["ATX (20+4)", "24", "Mainboard", ""],
    ["EPS 12V (4+4)", "8", "CPU", "Mainboard cao cấp có thêm đầu 4 hoặc 8 chân phụ"],
    ["PCIe 6 / 8 chân (6+2)", "6 / 8", "Card đồ hoạ", "75 W / 150 W mỗi đầu; khe PCIe cấp thêm 75 W"],
    ["12VHPWR / 12V-2x6", "16 (12+4)", "Card đồ hoạ đời mới", "Tới 600 W; cắm thật sát, không bẻ gập cáp sát đầu cắm"],
    ["SATA", "15", "SSD / HDD", ""],
    ["Molex", "4", "Quạt, thiết bị đời cũ", ""],
  ], wd(2200, 1200, 1800)),
  note("đầu EPS 8 chân (CPU) và PCIe 8 chân (card đồ hoạ) nhìn giống nhau nhưng đi dây khác nhau; cắm nhầm có thể làm hỏng linh kiện. Dây nguồn thường có in chữ CPU hoặc PCI-E ở đầu cắm."),

  H2("5.6", "Đầu cắm trên mainboard"),
  table(["Header", "Nối với", "Lưu ý"], [
    ["F_PANEL (JFP1)", "Nút nguồn, reset, đèn nguồn, đèn ổ cứng", "Nút bấm không phân cực; đèn LED có cực + / −"],
    ["USB 2.0 (9 chân)", "Cổng USB 2.0 mặt trước", ""],
    ["USB 3.x (19/20 chân)", "Cổng USB 3.x mặt trước", "Chân rất mảnh, cắm đúng chiều khấc"],
    ["USB-C mặt trước (Key-A)", "Cổng USB-C trên case", ""],
    ["HD_AUDIO", "Jack tai nghe, micro mặt trước", ""],
    ["CPU_FAN, SYS_FAN", "Quạt (4 chân PWM / 3 chân DC)", "CPU_FAN phải có quạt, nhiều máy báo lỗi khi khởi động nếu để trống"],
    ["RGB 12V (4 chân), ARGB 5V (3 chân)", "Dải đèn LED", "Cắm đèn ARGB 5V vào header 12V sẽ cháy đèn"],
  ], wd(2600, 2800)),

  H2("5.7", "Cổng âm thanh 3,5 mm"),
  table(["Màu", "Chức năng"], [
    ["Xanh lá", "Line out — loa, tai nghe"],
    ["Hồng", "Micro"],
    ["Xanh dương", "Line in"],
    ["Cam", "Loa giữa / loa trầm (hệ 5.1)"],
    ["Đen", "Loa sau (hệ 5.1 / 7.1)"],
    ["Xám", "Loa bên (hệ 7.1)"],
  ], wd(2200)),
  body("Laptop thường chỉ có một jack combo 4 cực (TRRS) dùng chung cho tai nghe có micro."),

  H2("5.8", "Bài tập Chương V"),
  exTable([
    { num: "V-1", title: "Tên gọi USB", level: "Dễ", desc: "USB 3.1 Gen 1, USB 3.2 Gen 2 và USB 3.2 Gen 2x2 có tốc độ bao nhiêu? Chuẩn nào bắt buộc dùng cổng USB-C?" },
    { num: "V-2", title: "Đầu nguồn PSU", level: "Dễ", desc: "Kể các đầu cấp nguồn của PSU và linh kiện nhận điện từ mỗi đầu. Đầu nào dễ cắm nhầm?" },
    { num: "V-3", title: "No Signal", level: "TB", desc: "Máy có card đồ hoạ rời, khách cắm HDMI vào cổng trên mainboard, màn hình báo No Signal. Giải thích và cách xử lý." },
    { num: "V-4", title: "Băng thông PCIe", level: "TB", desc: "Tính băng thông lý thuyết khe PCIe 4.0 x4 và PCIe 3.0 x4. SSD quảng cáo 7.000 MB/s cắm vào khe Gen3 thì đạt khoảng bao nhiêu?" },
    { num: "V-5", title: "Cổng USB-C laptop", level: "Khó", desc: "Làm sao biết một cổng USB-C trên laptop có xuất hình, nhận sạc và có Thunderbolt hay không? Nêu cách kiểm tra trước khi bán cáp chuyển USB-C sang HDMI." },
  ]),
  PB());

// ══ CHƯƠNG VI ═════════════════════════════════════════════════
add(H1("VI", "MẠNG MÁY TÍNH CƠ BẢN", "c6"),
  H2("6.1", "Khái niệm và thiết bị mạng"),
  body("Mạng máy tính là tập hợp thiết bị nối với nhau để chia sẻ dữ liệu, máy in và đường Internet. Theo phạm vi có **PAN** (mạng cá nhân, vd. Bluetooth), **LAN** (trong nhà, văn phòng) và **WAN** (diện rộng — Internet là WAN lớn nhất)."),
  fig("h6_1", "Mô hình mạng gia đình và văn phòng nhỏ"),
  table(["Thiết bị", "Tầng OSI", "Chức năng"], [
    ["Modem / ONT", "1 – 2", "Đổi tín hiệu đường truyền của nhà mạng (cáp quang) thành Ethernet"],
    ["Router", "3", "Nối LAN với Internet; NAT, DHCP, tường lửa; thường tích hợp Wi-Fi"],
    ["Switch", "2", "Chia nhiều cổng mạng có dây trong LAN, chuyển dữ liệu theo địa chỉ MAC"],
    ["Hub", "1", "Đời cũ, phát dữ liệu ra mọi cổng — nay gần như không dùng"],
    ["Access Point (AP)", "2", "Phát Wi-Fi cho mạng có dây sẵn; hệ mesh là nhiều AP phối hợp phủ sóng"],
    ["Repeater (kích sóng)", "1 – 2", "Thu rồi phát lại Wi-Fi; tốc độ giảm"],
  ], wd(2200, 1200)),

  H2("6.2", "Mô hình OSI và TCP/IP"),
  body("Mô hình **OSI** chia việc truyền dữ liệu thành 7 tầng [20]; **TCP/IP** — mô hình thực tế của Internet — gộp lại còn 4 tầng. Kỹ thuật viên dùng các tầng để khoanh vùng lỗi: đèn mạng không sáng là tầng 1; không có IP là tầng 3; vào được địa chỉ IP nhưng không vào được tên miền là lỗi DNS ở tầng ứng dụng."),
  fig("h6_2", "Mô hình OSI 7 tầng và TCP/IP 4 tầng"),
  table(["Cổng", "Giao thức", "Dùng cho"], [
    ["20 / 21", "FTP", "Truyền tệp"],
    ["22", "SSH", "Điều khiển máy chủ từ xa"],
    ["25, 587", "SMTP", "Gửi email"],
    ["53", "DNS", "Phân giải tên miền"],
    ["67 / 68", "DHCP", "Cấp IP tự động"],
    ["80 / 443", "HTTP / HTTPS", "Web"],
    ["445", "SMB", "Chia sẻ tệp, máy in trong Windows"],
    ["3389", "RDP", "Remote Desktop"],
  ], wd(1600, 2200)),

  H2("6.3", "Địa chỉ IP, subnet mask, gateway, DNS, MAC"),
  body("Mỗi thiết bị trong mạng cần bốn thông số: **địa chỉ IP** (định danh), **subnet mask** (xác định lớp mạng), **default gateway** (cửa ra Internet, thường là router) và **DNS server** (đổi tên miền thành địa chỉ IP)."),
  H3("6.3.1", "IPv4"),
  body("IPv4 dài 32 bit, viết thành 4 số từ 0 đến 255, vd. 192.168.1.23. Subnet mask 255.255.255.0 (viết gọn /24) nghĩa là 24 bit đầu là phần mạng: mọi máy có địa chỉ 192.168.1.x nói chuyện trực tiếp được với nhau."),
  table(["Loại", "Dải địa chỉ", "Ghi chú"], [
    ["IP riêng (private)", ["10.0.0.0/8", "172.16.0.0 – 172.31.255.255 (/12)", "192.168.0.0/16"], "Dùng trong LAN, không đi thẳng ra Internet [25]"],
    ["Loopback", "127.0.0.1", "Chính máy mình"],
    ["APIPA", "169.254.0.0/16", "Windows tự đặt khi không xin được IP từ DHCP → báo hiệu lỗi [27]"],
    ["IP công cộng", "Các dải còn lại", "Nhà mạng cấp cho router"],
  ], wd(2000, 3400)),
  table(["CIDR", "Subnet mask", "Số máy dùng được"], [
    ["/24", "255.255.255.0", "254"],
    ["/25", "255.255.255.128", "126"],
    ["/16", "255.255.0.0", "65.534"],
    ["/30", "255.255.255.252", "2"],
  ], wd(1600, 3400)),
  body("Trong mạng 192.168.1.0/24: 192.168.1.0 là **địa chỉ mạng**, 192.168.1.255 là **địa chỉ quảng bá** (broadcast), các máy dùng được từ .1 đến .254; router thường lấy địa chỉ .1."),
  H3("6.3.2", "IPv6 và địa chỉ MAC"),
  bulls([
    "**IPv6** dài 128 bit, viết ở hệ 16, vd. 2001:db8::1. Các nhà mạng đã cấp IPv6 cho nhiều thuê bao; máy chạy song song IPv4 và IPv6.",
    "**Địa chỉ MAC** dài 48 bit, gắn với card mạng, vd. 00-1A-2B-3C-4D-5E; 24 bit đầu cho biết hãng sản xuất. Xem bằng lệnh getmac hoặc ipconfig /all.",
    "Điện thoại và Windows đời mới có thể dùng MAC ngẫu nhiên cho từng mạng Wi-Fi — lưu ý khi lọc MAC trên router.",
  ]),

  H2("6.4", "DHCP và DNS"),
  body("**DHCP** tự cấp IP, subnet mask, gateway và DNS cho máy mới vào mạng qua bốn bước DORA [24]:"),
  fig("h6_3", "Quá trình xin địa chỉ IP qua DHCP (DORA)"),
  body("DHCP chỉ cho “thuê” IP trong một thời gian (lease). **Máy in, camera, máy chủ nên có IP cố định**: hoặc đặt IP tĩnh nằm ngoài dải DHCP, hoặc tạo **DHCP Reservation** (gán cố định IP theo địa chỉ MAC) trên router."),
  body("**DNS** đổi tên miền (google.com) thành địa chỉ IP [26]. Router thường chuyển tiếp DNS của nhà mạng; khi DNS nhà mạng lỗi, đổi sang DNS công cộng 8.8.8.8 (Google) hoặc 1.1.1.1 (Cloudflare)."),

  H2("6.5", "Cáp mạng và bấm đầu RJ45"),
  table(["Loại cáp", "Tốc độ tối đa", "Khoảng cách", "Tần số"], [
    ["Cat5e", "1 Gb/s (2,5 Gb/s)", "100 m", "100 MHz"],
    ["Cat6", "1 Gb/s; 10 Gb/s tới ~55 m", "100 m", "250 MHz"],
    ["Cat6A", "10 Gb/s", "100 m", "500 MHz"],
    ["Cat8", "25 – 40 Gb/s", "30 m", "2.000 MHz"],
  ], wd(1600, 3000, 1800)),
  bulls([
    "Mỗi đoạn cáp đồng Ethernet dài tối đa **100 m**; xa hơn cần switch ở giữa hoặc chuyển sang cáp quang [21], [23].",
    "Gigabit Ethernet dùng cả **4 cặp dây** — bấm thiếu cặp thì chỉ chạy được 100 Mb/s.",
    "Cáp quang: **singlemode** (vỏ vàng, đi xa hàng chục km) và **multimode** (vỏ cam hoặc xanh ngọc, dùng trong toà nhà).",
  ]),
  fig("h6_4", "Thứ tự màu dây chuẩn T568A và T568B"),
  steps([
    "Tuốt vỏ khoảng 2–3 cm, không làm đứt vỏ các dây con.",
    "Gỡ xoắn, xếp dây theo T568B, vuốt thẳng.",
    "Cắt bằng đầu, chừa khoảng 1,2–1,5 cm.",
    "Luồn vào đầu RJ45 tới khi các dây chạm đỉnh, vỏ cáp nằm lọt trong đầu.",
    "Bấm chặt bằng kìm; kiểm tra bằng máy test cáp — 8 đèn sáng lần lượt từ 1 đến 8 là đúng.",
  ]),

  H2("6.6", "Wi-Fi"),
  table(["Tên", "Chuẩn IEEE", "Năm", "Băng tần", "Tốc độ lý thuyết"], [
    ["—", "802.11b / g", "1999 / 2003", "2,4 GHz", "11 / 54 Mb/s"],
    ["Wi-Fi 4", "802.11n", "2009", "2,4 / 5 GHz", "600 Mb/s"],
    ["Wi-Fi 5", "802.11ac", "2013", "5 GHz", "tới ~3,5 Gb/s"],
    ["Wi-Fi 6", "802.11ax", "2019", "2,4 / 5 GHz", "9,6 Gb/s"],
    ["Wi-Fi 6E", "802.11ax", "2020", "2,4 / 5 / 6 GHz", "9,6 Gb/s"],
    ["Wi-Fi 7", "802.11be", "2024", "2,4 / 5 / 6 GHz", "~46 Gb/s"],
  ], wd(1300, 1600, 1500, 2100), { fs: 22 }),
  bulls([
    "**2,4 GHz** — đi xa, xuyên tường tốt nhưng chậm và dễ nhiễu (lò vi sóng, Bluetooth, mạng hàng xóm).",
    "**5 GHz** — nhanh, ít nhiễu nhưng tầm phủ ngắn hơn.",
    "**6 GHz** (Wi-Fi 6E / 7) — rất nhanh, ít nhiễu, tầm phủ ngắn nhất; thiết bị phải hỗ trợ [22].",
    "Tốc độ in trên hộp router là tổng lý thuyết của mọi băng tần; một thiết bị thực tế chỉ đạt một phần.",
    "Bảo mật: dùng WPA2-AES hoặc WPA3, tắt WPS, đổi mật khẩu quản trị mặc định của router.",
  ]),

  H2("6.7", "Lệnh kiểm tra mạng trên Windows"),
  body("Mở Command Prompt (các lệnh netsh cần chạy bằng quyền Administrator):"),
  ...codeBlock([
    "ipconfig /all        → IP, mask, gateway, DNS, MAC",
    "ipconfig /release    → trả lại IP đang dùng",
    "ipconfig /renew      → xin IP mới từ DHCP",
    "ipconfig /flushdns   → xoá bộ nhớ đệm DNS",
    "ping 192.168.1.1     → kiểm tra tới gateway (router)",
    "ping 8.8.8.8 -t      → ping liên tục, Ctrl+C để dừng",
    "tracert google.com   → gói tin đi qua những router nào",
    "nslookup google.com  → DNS trả về địa chỉ IP nào",
    "arp -a               → bảng IP ↔ MAC trong LAN",
    "netsh winsock reset  → đặt lại Winsock, rồi khởi động lại",
    "netsh int ip reset   → đặt lại cấu hình TCP/IP",
    "netsh wlan show profile name=\"TenWiFi\" key=clear",
    "                     → xem mật khẩu Wi-Fi đã lưu",
  ]),

  H2("6.8", "Quy trình xử lý máy không vào được mạng"),
  body("Đi từ tầng thấp lên tầng cao, mỗi bước loại trừ một nhóm nguyên nhân:"),
  fig("h6_5", "Lưu đồ khoanh vùng lỗi mạng", 470),
  bulls([
    "Chỉ một máy lỗi → lỗi nằm ở máy đó; cả văn phòng cùng lỗi → router hoặc nhà mạng.",
    "Hỏi khách: lỗi từ khi nào, vừa thay đổi gì (cài phần mềm, đổi router, cắm lại dây).",
    "Máy in mạng báo “offline” sau khi khởi động lại router: IP của máy in đã đổi → đặt IP tĩnh hoặc DHCP Reservation.",
  ]),

  H2("6.9", "Bài tập Chương VI"),
  exTable([
    { num: "VI-1", title: "Thứ tự màu T568B", level: "Dễ", desc: "Ghi thứ tự 8 màu dây chuẩn T568B từ chân 1 đến chân 8. Cáp thẳng và cáp chéo khác nhau thế nào?" },
    { num: "VI-2", title: "Thiết bị mạng", level: "Dễ", desc: "Phân biệt modem quang (ONT), router, switch và access point. Mỗi thiết bị làm việc ở tầng OSI nào?" },
    { num: "VI-3", title: "IP 169.254.x.x", level: "TB", desc: "Máy nhận IP 169.254.37.12. Nêu các nguyên nhân có thể và các bước xử lý." },
    { num: "VI-4", title: "Tính lớp mạng", level: "TB", desc: "Mạng 192.168.10.0/24: địa chỉ mạng, broadcast, dải IP dùng được, số máy tối đa? Máy đặt IP tĩnh 192.168.1.50 /24 có liên lạc được với mạng này không?" },
    { num: "VI-5", title: "Máy in mất kết nối", level: "Khó", desc: "Văn phòng 10 máy dùng chung một máy in mạng. Mỗi lần khởi động lại router, vài máy báo máy in offline. Phân tích nguyên nhân và đề xuất cách khắc phục triệt để." },
  ]),
  PB());

// ── PHỤ LỤC B – CÂU HỎI PHỎNG VẤN ───────────────────────────
add(H1plain("PHỤ LỤC B – CÂU HỎI PHỎNG VẤN THƯỜNG GẶP", "phulucB"),
  body("Trả lời theo khung: **triệu chứng → kiểm tra từ đơn giản đến phức tạp → khoanh vùng → xử lý → kiểm tra lại**. Người phỏng vấn đánh giá cách bạn suy luận nhiều hơn việc thuộc lòng."),
  qa(1, "Máy bấm nút nguồn không có phản ứng gì — bạn kiểm tra theo thứ tự nào?", [
    "Ổ điện, dây nguồn, công tắc ở mặt sau PSU.",
    "Dây 24 chân mainboard và 8 chân CPU đã cắm chặt chưa; dây nút nguồn F_PANEL có đúng chân không (có thể chập nhẹ hai chân PWR_SW bằng tua vít để thử).",
    "Thử bằng một PSU khác đang tốt.",
    "Tháo về cấu hình tối thiểu (CPU, tản, 1 thanh RAM) để khoanh vùng linh kiện gây chập.",
    "Laptop: thử sạc khác, xả tĩnh điện (rút sạc, giữ nút nguồn khoảng 30 giây), xem đèn báo sạc.",
  ]),
  qa(2, "Máy lên nguồn, quạt quay nhưng không lên hình?", [
    "Màn hình đã cắm đúng cổng (card rời hay mainboard) và chọn đúng nguồn vào chưa.",
    "Xem đèn debug hoặc nghe tiếng bíp để biết khâu lỗi (CPU, DRAM, VGA, BOOT).",
    "RAM: cắm lại, lau chân bằng gôm, thử từng thanh, đúng khe.",
    "Xoá CMOS; CPU mới lắp thì kiểm tra BIOS đã hỗ trợ chưa.",
    "Thử card đồ hoạ hoặc màn hình khác. Máy DDR5 mới lắp thì chờ memory training.",
  ]),
  qa(3, "Khách muốn nâng RAM laptop — bạn hỏi và kiểm tra những gì?", [
    "Mã máy; tra thông số hãng: đời RAM, SO-DIMM hay hàn LPDDR, số khe, dung lượng tối đa.",
    "Kiểm tra thực tế bằng Task Manager (Slots used) và CPU-Z tab SPD.",
    "Đề xuất thanh cùng đời, cùng tốc độ để chạy kênh đôi; báo trước với khách nếu RAM hàn chết không nâng được.",
  ]),
  qa(4, "SSD SATA và NVMe khác gì? Khách nên chọn loại nào?", [
    "Cùng là SSD, khác giao thức: SATA tối đa khoảng 550 MB/s; NVMe chạy trên PCIe, nhanh gấp khoảng 6 đến 25 lần khi chép tệp lớn.",
    "Dùng văn phòng thì cảm nhận khác biệt không nhiều. Máy chỉ có khay 2,5\" → SSD SATA; máy có khe M.2 NVMe → NVMe Gen3/Gen4 vừa túi tiền.",
    "Luôn kiểm tra khe M.2 của máy hỗ trợ SATA hay NVMe trước khi bán.",
  ]),
  qa(5, "Khách hỏi vì sao ổ 1 TB mới mua chỉ còn 931 GB?", [
    "Hãng ổ tính 1 TB = 10¹² byte; Windows tính theo 2³⁰ byte cho mỗi “GB” nên hiển thị khoảng 931 GB (Mục 1.3.1).",
    "Máy mua sẵn còn có phân vùng Recovery của hãng chiếm thêm dung lượng.",
  ]),
  qa(6, "Cài Windows 11 báo “This PC can't run Windows 11”?", [
    "Kiểm tra TPM 2.0 (lệnh tpm.msc), Secure Boot, chế độ khởi động UEFI, ổ dạng GPT, CPU có trong danh sách hỗ trợ.",
    "Bật Intel PTT / AMD fTPM và Secure Boot trong UEFI; chuyển MBR sang GPT bằng mbr2gpt nếu cần.",
  ]),
  qa(7, "Máy chạy chậm — bạn xử lý thế nào?", [
    "Mở Task Manager xem CPU, RAM, Disk: Disk 100% trên HDD → đề xuất SSD; RAM luôn đầy → nâng RAM.",
    "Nhiệt độ cao → vệ sinh, thay keo tản nhiệt.",
    "Tắt bớt ứng dụng khởi động cùng Windows, quét mã độc, kiểm tra sức khoẻ ổ bằng CrystalDiskInfo.",
  ]),
  qa(8, "Máy nhận IP 169.254.x.x nghĩa là gì?", [
    "Máy không xin được IP từ DHCP nên Windows tự đặt địa chỉ APIPA — chưa vào được mạng.",
    "Kiểm tra cáp, Wi-Fi, router còn cấp DHCP không; chạy ipconfig /release rồi /renew.",
  ]),
  qa(9, "RAM DDR4 cắm vào khe DDR5 được không?", [
    "Không. Hai đời khác vị trí khấc, khác điện áp và khác thiết kế; mainboard chỉ hỗ trợ một đời RAM.",
  ]),
  qa(10, "Khách mua Core i5-12400F để lắp máy văn phòng không card rời — có vấn đề gì?", [
    "Bản F không có iGPU nên máy sẽ không có hình. Đổi sang i5-12400 (có iGPU UHD 730) hoặc mua thêm card rời.",
    "Mainboard phải là LGA 1700 (H610, B660, B760…) và chọn đúng bản DDR4 hay DDR5 theo RAM của khách.",
  ]),
  qa(11, "Thứ tự màu dây chuẩn T568B?", [
    "Trắng-cam, cam, trắng-lá, dương, trắng-dương, lá, trắng-nâu, nâu.",
  ]),
  qa(12, "Switch và router khác nhau thế nào?", [
    "Switch làm việc ở tầng 2, chia cổng trong cùng mạng LAN và chuyển dữ liệu theo địa chỉ MAC.",
    "Router làm việc ở tầng 3, nối các mạng khác nhau (LAN với Internet), làm NAT, DHCP, tường lửa.",
  ]),
  qa(13, "Chọn thẻ nhớ cho camera quay 4K và camera hành trình thế nào?", [
    "Quay 4K: tối thiểu U3 / V30.",
    "Camera hành trình, camera an ninh: dòng High Endurance chịu ghi liên tục; kiểm tra dung lượng tối đa thiết bị hỗ trợ.",
  ]),
  qa(14, "Máy tự tắt khi chơi game — nguyên nhân có thể là gì?", [
    "Quá nhiệt CPU/GPU (theo dõi bằng HWiNFO), nguồn không đủ công suất hoặc kém chất lượng, dây nguồn card đồ hoạ lỏng, driver lỗi.",
    "Xem Event Viewer: lỗi Kernel-Power (Event ID 41) cho biết máy mất điện đột ngột.",
  ]),
  qa(15, "Khi tiếp nhận máy bảo hành hoặc sửa chữa của khách, bạn làm gì?", [
    "Ghi phiếu: thông tin khách, mã máy, số serial, lỗi khách mô tả, tình trạng ngoại hình (chụp ảnh vết trầy, móp), phụ kiện kèm theo, tem bảo hành.",
    "Hỏi khách đã sao lưu dữ liệu chưa và thống nhất trách nhiệm về dữ liệu; hẹn thời gian trả máy.",
    "Đây là gợi ý chung — mỗi cửa hàng có quy trình riêng, hãy hỏi lại quy trình khi được nhận.",
  ]),
  qa(16, "Bạn chống tĩnh điện khi thao tác thế nào?", [
    "Đeo vòng chống tĩnh điện nối đất hoặc chạm vào vỏ kim loại trước khi cầm linh kiện; làm việc trên thảm chống tĩnh điện.",
    "Cầm linh kiện ở cạnh, cất trong túi chống tĩnh điện; rút điện, ngắt pin trước khi tháo lắp.",
  ]),
  PB());

// ── PHỤ LỤC C – ĐÁP ÁN GỢI Ý ────────────────────────────────
const ans = (rows) => [twoColTable(rows, 900, ["Bài", "Đáp án gợi ý"]), sp(200)];
add(H1plain("PHỤ LỤC C – ĐÁP ÁN GỢI Ý BÀI TẬP", "phulucC"),
  H3("", "Chương I"),
  ans([
    ["I-1", "CPU gồm CU (giải mã, điều phối), ALU (tính toán) và thanh ghi; bộ nhớ chính chứa lệnh và dữ liệu; thiết bị vào/ra; bus hệ thống gồm bus địa chỉ, dữ liệu, điều khiển."],
    ["I-2", "Thanh ghi > cache L3 > RAM > SSD NVMe > HDD. Mất dữ liệu khi tắt nguồn: thanh ghi, cache, RAM."],
    ["I-3", "Hãng tính theo 10¹², Windows tính theo 2⁴⁰ cho mỗi “TB”. Ổ 4 TB: 4 × 10¹² ÷ 2⁴⁰ ≈ 3,63 TB (Windows ghi khoảng 3.725 GB)."],
    ["I-4", "(150 + 220 + 100) × 1,3 ≈ 611 W → chọn nguồn 650 W, tối thiểu 80 Plus Bronze, của hãng uy tín."],
    ["I-5", "Core i5-12400 (không lấy bản F vì cần iGPU); mainboard LGA 1700 H610/B760 bản DDR4 hoặc DDR5; RAM 2 × 8 GB đúng đời; SSD M.2 NVMe 512 GB; nguồn 400–450 W 80 Plus; case vừa mATX. Kiểm tra: socket, iGPU, đời RAM của mainboard, BIOS hỗ trợ CPU, khe M.2, kích thước mainboard – case."],
  ]),
  H3("", "Chương II"),
  ans([
    ["II-1", "PGA: chân trên CPU (AMD AM4). LGA: chân trên socket (Intel LGA 1700, AMD AM5). BGA: CPU hàn thẳng lên bo mạch (laptop)."],
    ["II-2", "i7-13700KF: phân khúc i7, thế hệ 13, mã 700, K mở khoá ép xung, F không iGPU → socket LGA 1700, cần card rời, cần chipset Z nếu muốn ép xung. Ryzen 7 5700X3D: dòng 5000, có 3D V-Cache, socket AM4, RAM DDR4, không có iGPU → cần card rời."],
    ["II-3", "Được: cùng LGA 1700, chipset 600 series hỗ trợ thế hệ 12–14 nhưng phải cập nhật BIOS lên bản hỗ trợ thế hệ 14 trước (dùng CPU cũ hoặc BIOS Flashback). Giữ nguyên RAM DDR4."],
    ["II-4", "Cùng AM4; B450 hỗ trợ Ryzen 5000 sau khi cập nhật BIOS — kiểm tra CPU Support List của đúng mã mainboard, cập nhật BIOS khi còn CPU cũ. 5700X không có iGPU (máy đang dùng 2600 nên đã có card rời) và không kèm tản — cần tản phù hợp."],
    ["II-5", "LGA 1200 khác LGA 1700 → bắt buộc đổi mainboard; chọn H610/B660/B760 bản DDR4 để giữ 16 GB DDR4. Giữ SSD, nguồn, case (nếu vừa); tản cần ngàm LGA 1700 (tản kèm theo i5-12400 dùng được). Windows có thể phải kích hoạt lại vì đổi mainboard."],
  ]),
  H3("", "Chương III"),
  ans([
    ["III-1", "DDR3: 240 / 204; DDR4: 288 / 260; DDR5: 288 / 262. DDR4 và DDR5 khác vị trí khấc, khác điện áp và kiến trúc nên không cắm lẫn được."],
    ["III-2", "DDR4-2666 = PC4-21300; DDR5-5600 = PC5-44800. Kênh đôi: 44,8 × 2 = 89,6 GB/s."],
    ["III-3", "DDR4-3200 CL22: 22 × 2000 ÷ 3200 = 13,75 ns. DDR5-6000 CL36: 36 × 2000 ÷ 6000 = 12 ns → DDR5 phản hồi nhanh hơn và băng thông gần gấp đôi."],
    ["III-4", "Gắn thanh SO-DIMM DDR4-3200 8 GB → 16 GB chạy kênh đôi đầy đủ. Nếu gắn 16 GB → 24 GB, chỉ 16 GB đầu (8 + 8) chạy kênh đôi. Không dùng DDR5 hay DIMM; kiểm tra dung lượng tối đa theo hãng."],
    ["III-5", "Tổng 48 GB, mỗi kênh 8 + 16 = 24 GB nên kênh đôi vẫn cân. Hệ thống chạy theo thanh chậm nhất (≤ 2666) và timing lỏng nhất; 4 thanh có thể phải hạ tốc, bật XMP dễ lỗi. Tốt hơn: chỉ dùng 2 × 16 GB 3200 (32 GB, chạy đúng 3200 với XMP) hoặc mua nguyên kit 4 thanh giống nhau."],
  ]),
  H3("", "Chương IV"),
  ans([
    ["IV-1", "HDD: từ tính, cơ học, chậm, sợ va đập, rẻ trên mỗi TB → lưu trữ, sao lưu, camera. SSD: flash, không cơ học, nhanh, êm, đắt hơn trên mỗi TB → ổ hệ điều hành, ứng dụng."],
    ["IV-2", "microSDXC: dung lượng 32 GB–2 TB, exFAT; UHS-I: bus tối đa 104 MB/s; U3 và V30: ghi tối thiểu 30 MB/s; A2: hiệu năng ứng dụng cao. Quay 4K được (đạt V30)."],
    ["IV-3", "(c) dùng được, chạy ở tốc độ Gen3. (b) không — khe chỉ hỗ trợ NVMe. (a) không, trừ khi máy có khay 2,5\" riêng. (d) chạy được về điện nhưng cần vị trí bắt vít 30 mm hoặc miếng nối dài mới cố định được."],
    ["IV-4", "GPT (MBR tối đa 2 TB); định dạng NTFS. Dùng chung với macOS → exFAT."],
    ["IV-5", "Kiểm tra khe M.2 NVMe → sao lưu dữ liệu → dọn ổ (380 GB < 512 GB) → clone qua box USB-NVMe hoặc khe thứ hai → lắp SSD làm ổ khởi động, kiểm tra → mbr2gpt /validate rồi /convert → UEFI: tắt CSM, bật Secure Boot và TPM → khởi động lại, kiểm tra điều kiện Windows 11 → HDD cũ làm ổ di động qua box."],
  ]),
  H3("", "Chương V"),
  ans([
    ["V-1", "USB 3.1 Gen 1 = 5 Gb/s; USB 3.2 Gen 2 = 10 Gb/s; USB 3.2 Gen 2x2 = 20 Gb/s và chỉ có trên USB-C."],
    ["V-2", "24 chân → mainboard; EPS 8 chân → CPU; PCIe 6/8 chân hoặc 12V-2x6 → card đồ hoạ; SATA → ổ; Molex → quạt, thiết bị cũ. Dễ nhầm: EPS 8 chân và PCIe 8 chân."],
    ["V-3", "Card RTX là card rời; CPU có thể không có iGPU hoặc mainboard tự tắt iGPU khi có card rời, nên cổng HDMI mainboard không có tín hiệu. Cắm cáp vào cổng trên card."],
    ["V-4", "PCIe 4.0 x4 ≈ 7,9 GB/s; PCIe 3.0 x4 ≈ 3,9 GB/s. SSD 7.000 MB/s trên khe Gen3 đạt khoảng 3.500 MB/s."],
    ["V-5", "Xem ký hiệu cạnh cổng (logo DisplayPort, tia sét Thunderbolt, biểu tượng pin/PD), tra trang thông số hãng, thử thực tế bằng cáp hoặc dock mẫu. Cổng chỉ hỗ trợ dữ liệu thì cáp chuyển HDMI sẽ không chạy."],
  ]),
  H3("", "Chương VI"),
  ans([
    ["VI-1", "Trắng-cam, cam, trắng-lá, dương, trắng-dương, lá, trắng-nâu, nâu. Cáp thẳng: hai đầu cùng chuẩn; cáp chéo: một đầu A, một đầu B."],
    ["VI-2", "ONT (tầng 1–2) đổi tín hiệu quang; router (tầng 3) nối LAN với Internet, NAT, DHCP; switch (tầng 2) chia cổng trong LAN; AP (tầng 2) phát Wi-Fi."],
    ["VI-3", "Không nhận được DHCP: cáp hỏng hoặc lỏng, Wi-Fi sai mật khẩu, router treo hoặc hết IP để cấp, card mạng lỗi. Xử lý: kiểm tra cáp/Wi-Fi, ipconfig /release rồi /renew, khởi động lại router, thử máy khác."],
    ["VI-4", "Mạng 192.168.10.0; broadcast 192.168.10.255; dùng được .1–.254, tối đa 254 máy. Máy 192.168.1.50/24 thuộc lớp mạng khác nên không liên lạc trực tiếp được."],
    ["VI-5", "Máy in nhận IP qua DHCP, khởi động lại router thì được cấp IP khác, trong khi máy tính vẫn in theo IP cũ → offline. Khắc phục: DHCP Reservation hoặc IP tĩnh ngoài dải DHCP cho máy in, cài lại cổng máy in theo IP cố định (Standard TCP/IP Port), kiểm tra chế độ ngủ của máy in."],
  ]),
  sp(200),
  new Paragraph({
    children: [T("HẾT GIÁO TRÌNH", { size: SZ_H1, bold: true, color: C.white })],
    alignment: AlignmentType.CENTER,
    shading: { fill: C.headBg, type: ShadingType.CLEAR },
    spacing: { before: 200, after: 200 },
  }));

// ══════════════════════════════════════════════════════════════
// TRANG BÌA + MỤC LỤC
// ══════════════════════════════════════════════════════════════
function tocEntry({ id, text, level }) {
  const indent = [0, 480, 960][level];
  const bold = level === 0, italics = level === 2;
  const sz = [28, 26, 24][level];
  const page = PAGES[id] !== undefined ? String(PAGES[id]) : "00";
  return new Paragraph({
    children: [new InternalHyperlink({ anchor: id, children: [
      new TextRun({ text, font: FONT, size: sz, bold, italics, color: C.black }),
      new TextRun({ text: "\t" + page, font: FONT, size: sz, bold, italics, color: C.black }),
    ] })],
    tabStops: [{ type: TabStopType.RIGHT, leader: LeaderType.DOT, position: CW - 200 }],
    spacing: { before: level === 0 ? 60 : 0, after: level === 0 ? 40 : 20, line: 280, lineRule: "auto" },
    indent: { left: indent },
  });
}

const cover = [
  sp(500),
  new Paragraph({ children: [T("TÀI LIỆU ÔN TẬP CÁ NHÂN", { size: 24, bold: true, color: C.gray })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
  new Paragraph({ children: [T(DOC_TITLE, { size: 40, bold: true, color: C.navy })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
  new Paragraph({ children: [T(TOPIC, { size: 56, bold: true, color: C.accent })], alignment: AlignmentType.CENTER, shading: { fill: C.exBg, type: ShadingType.CLEAR }, spacing: { before: 120, after: 120 } }),
  new Paragraph({ children: [T(SUBTITLE, { size: 26, color: C.gray, italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 360 } }),
  twoColTable([
    ["Phiên bản", VERSION],
    ["Chuẩn tài liệu", STANDARD],
    ["Người dùng", OWNER],
    ["Mục đích", "Ôn phỏng vấn vị trí Kỹ thuật viên máy tính (cửa hàng bán lẻ, bảo hành)"],
    ["Cập nhật", `Tháng 9/${YEAR}`],
    ["Phân loại", "Tài liệu ôn tập cá nhân"],
  ], 2800),
  sp(300),
  body("**Tóm tắt:** Giáo trình hệ thống kiến thức nền của kỹ thuật viên phần cứng máy tính trong sáu chương — cấu trúc máy tính, CPU và socket, các đời RAM, ổ cứng và thiết bị lưu trữ, các chuẩn kết nối, mạng máy tính cơ bản. Mỗi chương có bảng tra cứu, hình minh hoạ và bài tập phân cấp độ khó; phụ lục có tài liệu tham khảo theo chuẩn IEEE, bộ câu hỏi phỏng vấn thường gặp và đáp án gợi ý."),
  PB(),
  new Paragraph({
    children: [new TextRun({ text: "TABLE OF CONTENTS", font: FONT, size: 36, bold: true, color: C.black })],
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.border, space: 8 } },
    spacing: { before: 0, after: 300 },
  }),
  ...OUTLINE.map(tocEntry),
  PB(),
];

// ══════════════════════════════════════════════════════════════
const doc = new Document({
  creator: OWNER,
  title: "Giáo trình ôn tập Kỹ thuật viên máy tính",
  subject: "Cấu trúc máy tính, CPU & socket, RAM, ổ cứng, chuẩn kết nối, mạng cơ bản",
  keywords: "kỹ thuật viên máy tính, phần cứng, RAM, SSD, socket, mạng",
  description: "Tài liệu ôn tập cá nhân theo IEEE Std 1063-2001",
  numbering: {
    config: [
      { reference: "b1", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  styles: {
    default: { document: { run: { font: FONT, size: SZ } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: SZ_H1, bold: true, font: FONT, color: C.white }, paragraph: { spacing: { before: 0, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: SZ_H2, bold: true, font: FONT, color: C.accent }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: SZ_H2, bold: true, font: FONT, color: C.navy }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      titlePage: true,
      page: { size: { width: PW, height: PH }, margin: { top: MT, right: MR, bottom: MB, left: ML } },
    },
    headers: { default: makeHeader(`GIÁO TRÌNH ÔN TẬP KỸ THUẬT VIÊN MÁY TÍNH  |  ${STANDARD}`), first: emptyHF(Header) },
    footers: { default: makeFooter(`Tài liệu ôn tập cá nhân — ${OWNER}`), first: emptyHF(Footer) },
    children: [...cover, ...content],
  }],
});

/** docx-js gán cùng w:id cho mọi bookmark — đánh số lại cho đúng chuẩn OOXML (bookmark không lồng nhau). */
async function fixBookmarkIds(buf) {
  const JSZip = require("jszip");
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file("word/document.xml").async("string");
  let n = 0;
  xml = xml.replace(/<w:bookmark(Start|End)([^>]*?) w:id="\d+"/g, (_, kind, attrs) => {
    if (kind === "Start") n += 1;
    return `<w:bookmark${kind}${attrs} w:id="${n}"`;
  });
  zip.file("word/document.xml", xml);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

Packer.toBuffer(doc).then(fixBookmarkIds).then((buf) => {
  fs.writeFileSync(path.join(HERE, OUT_NAME + ".docx"), buf);
  fs.writeFileSync(path.join(HERE, "headings.json"), JSON.stringify(OUTLINE, null, 1));
  console.log("Done →", OUT_NAME + ".docx", "·", OUTLINE.length, "mục lục");
});

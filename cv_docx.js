/**
 * Dựng bản CV .docx sửa được trong Word từ JSON do build_cv.py xuất ra (doc_model).
 * Bố cục bám theo bản PDF: một cột, tiêu đề mục viền dưới, ngày căn phải, kỹ năng dạng bảng không viền.
 *
 *   node cv_docx.js model.json CV-NguyenQuocAnh-TongQuat.docx
 */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType,
  BorderStyle, WidthType, LevelFormat, TabStopType, VerticalAlign,
} = require("docx");

const [, , modelPath, outPath] = process.argv;
const M = JSON.parse(fs.readFileSync(modelPath, "utf8"));

// A4, lề gần bằng bản PDF (@page 9mm 12mm 7mm) nhưng nới nhẹ cho máy in văn phòng.
const PW = 11906, PH = 16838, MX = 680, MT = 567, MB = 454;
const CW = PW - 2 * MX;

const FONT = "Arial"; // có sẵn trên Word máy tính, Word/WPS điện thoại
const C = { teal: "0F4A4F", ink: "15181A", strong: "0B1112", org: "33403F", muted: "4E5B5C",
            role: "3A4A4C", contact: "2B3436", rule: "C3D0D1" };
const LINE = { line: 252, lineRule: "auto" };

/** runs từ build_cv.runs() → TextRun; {"br":true} thành xuống dòng trong cùng đoạn. */
function toRuns(runs, base = {}) {
  const out = [];
  let brk = false;
  for (const r of runs) {
    if (r.br) { brk = true; continue; }
    out.push(new TextRun({
      text: r.t, font: r.code ? "Consolas" : FONT, size: 19, color: C.ink, ...base,
      ...(r.b ? { bold: true, color: base.boldColor || C.strong } : {}),
      ...(brk ? { break: 1 } : {}),
    }));
    brk = false;
  }
  return out;
}

const heading = (title) => new Paragraph({
  children: [new TextRun({ text: title, font: FONT, size: 18, bold: true, allCaps: true,
                           characterSpacing: 24, color: C.teal })],
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.rule, space: 2 } },
  spacing: { before: 130, after: 60 },
  keepNext: true,
});

const bullet = (runs) => new Paragraph({
  numbering: { reference: "dot", level: 0 },
  children: toRuns(runs),
  spacing: { after: 20, ...LINE },
});

function entry(e, first) {
  const out = [new Paragraph({
    children: [
      ...toRuns(e.title, { size: 20, bold: true, color: C.ink }),
      ...toRuns([{ t: " " }, ...e.org], { size: 20, color: C.org }),
      new TextRun({ text: "\t", font: FONT, size: 20 }),
      ...toRuns(e.date, { size: 17, bold: true, color: C.muted, boldColor: C.muted }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: CW }],
    spacing: { before: first ? 30 : 90, after: 20, ...LINE },
    keepNext: e.bullets.length > 0 || !!e.sub,
  })];
  e.bullets.forEach((b) => out.push(bullet(b)));
  if (e.sub) out.push(new Paragraph({
    children: toRuns(e.sub, { size: 17, color: C.muted }),
    spacing: { after: 20, ...LINE },
  }));
  return out;
}

const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: none, bottom: none, left: none, right: none };

function skills(rows) {
  const w = [2000, CW - 2000];
  const cell = (runs, width, base) => new TableCell({
    borders: noBorders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 15, bottom: 15, left: 0, right: 80 },
    verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ children: toRuns(runs, base), spacing: { after: 0, ...LINE } })],
  });
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: w,
    borders: { ...noBorders, insideHorizontal: none, insideVertical: none },
    rows: rows.map(([k, v]) => new TableRow({ cantSplit: true, children: [
      cell(k, w[0], { bold: true, color: C.teal, boldColor: C.teal }),
      cell(v, w[1], {}),
    ] })),
  });
}

// ─── Lắp ráp ────────────────────────────────────────────────
const children = [
  new Paragraph({ children: [new TextRun({ text: M.name, font: FONT, size: 40, bold: true, color: C.teal })],
                  spacing: { after: 40 } }),
  new Paragraph({ children: toRuns(M.role, { size: 18, bold: true, allCaps: true, characterSpacing: 20, color: C.role }),
                  spacing: { after: 60 } }),
  new Paragraph({ children: toRuns(M.contact, { size: 17, color: C.contact }),
                  border: { bottom: { style: BorderStyle.SINGLE, size: 11, color: C.teal, space: 4 } },
                  spacing: { after: 40, line: 264, lineRule: "auto" } }),
];

for (const s of M.sections) {
  children.push(heading(s.title));
  if (s.kind === "text") {
    children.push(new Paragraph({ children: toRuns(s.runs), alignment: AlignmentType.JUSTIFIED,
                                  spacing: { after: 20, ...LINE } }));
  } else if (s.kind === "entries") {
    s.items.forEach((e, i) => children.push(...entry(e, i === 0)));
  } else if (s.kind === "skills") {
    children.push(skills(s.rows));
  } else if (s.kind === "list") {
    s.items.forEach((r) => children.push(bullet(r)));
  }
}

const doc = new Document({
  creator: M.name,
  title: `CV — ${M.name}`,
  styles: { default: { document: { run: { font: FONT, size: 19 } } } },
  numbering: { config: [{ reference: "dot", levels: [{
    level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 300, hanging: 200 } }, run: { color: "7C8B8C" } },
  }] }] },
  sections: [{
    properties: { page: { size: { width: PW, height: PH }, margin: { top: MT, bottom: MB, left: MX, right: MX } } },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => fs.writeFileSync(outPath, buf));

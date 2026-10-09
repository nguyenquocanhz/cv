/**
 * Bộ máy chấm điểm ATS — hàm thuần, không đụng DOM, không gọi mạng.
 * Dùng chung cho giao diện web (app.js) và bộ test (test/engine.test.mjs).
 *
 * Luồng:  parseJD(jd) ─┐
 *                      ├─→ matchScore()  → điểm khớp CV ↔ JD
 *         analyzeCV() ─┘
 *         scoreJD(jd)                    → điểm chất lượng của chính tin tuyển dụng (cho HR)
 */
import { SKILLS, ALIAS_INDEX, STOPWORDS } from './skills.js';

// ── Chuẩn hoá chữ ────────────────────────────────────────────
/** Bỏ dấu tiếng Việt, về chữ thường, gộp khoảng trắng. Giữ + # . để không mất "c++", "c#", ".net". */
export function strip(s) {
  return String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Khớp nguyên từ, chịu được ký hiệu như c++ / c# / .net (ranh giới = không phải chữ-số). */
const wordRe = (alias) => new RegExp('(?<![a-z0-9])' + esc(alias) + '(?![a-z0-9])', 'g');

const RE_CACHE = new Map();
function aliasRe(alias) {
  let r = RE_CACHE.get(alias);
  if (!r) { r = wordRe(alias); RE_CACHE.set(alias, r); }
  r.lastIndex = 0;
  return r;
}

/**
 * Alias viết CÓ DẤU sẽ được so khớp trên chữ còn dấu thay vì chữ đã bỏ dấu.
 * Cần thiết vì bỏ dấu làm nhiều từ khác nghĩa trùng nhau: "nhận sự (cố)" → "nhan su"
 * trùng "nhân sự", "lần" → "lan" trùng "LAN", "thuê" → "thue" trùng "thuế".
 */
const DIACRITIC = /[\u00c0-\u1ef9]/;
export const aliasNeedsAccents = (alias) => DIACRITIC.test(alias);

// ── Nhận diện mục trong tin tuyển dụng ───────────────────────
// Trọng số: yêu cầu bắt buộc nặng nhất, quyền lợi không tính (tránh đếm nhầm
// "được cấp laptop" thành kỹ năng cần có).
const SECTION_RULES = [
  { w: 0, re: /(quyen loi|phuc loi|che do|dai ngo|we offer|benefit|perk|luong thuong|muc luong|thu nhap|thoi gian lam viec|dia diem lam viec|cach thuc ung tuyen|how to apply|lien he|ho so gom|about us|ve chung toi|gioi thieu cong ty)/ },
  { w: 3, re: /(yeu cau|requirement|qualification|dieu kien|ky nang can|skills required|what you need|must have|bat buoc|ho so yeu cau)/ },
  { w: 1, re: /(uu tien|nice to have|plus|advantage|bonus|la mot loi the|preferred)/ },
  { w: 2, re: /(mo ta cong viec|job description|trach nhiem|responsibilit|nhiem vu|cong viec chinh|what you will do|key duties|chi tiet cong viec)/ },
];

/** Cụm báo "chỉ là ưu tiên" nằm giữa câu, rất hay gặp trong tin tiếng Việt. */
const NICE_INLINE = /(la mot loi the|la loi the|la mot diem cong|la diem cong|uu tien|is a plus|is an advantage|nice to have|preferred)/;

const row = (line, w) => ({ line, low: strip(line), acc: line.toLowerCase(), w });

/**
 * Phần còn lại của dòng sau cụm tiêu đề, hoặc null nếu dòng chỉ có mỗi tiêu đề.
 *
 * Tin viết gọn hay gộp vào một dòng: "Yêu cầu: Java, SQL, Docker" hay
 * "Ưu tiên có kinh nghiệm Java". Bỏ cả dòng thì mất sạch kỹ năng, nên phải giữ phần đuôi.
 *
 * Cắt theo SỐ TỪ chứ không theo chỉ số ký tự: strip() bỏ dấu và gộp khoảng trắng nên
 * chỉ số ký tự lệch so với chuỗi gốc, còn số từ thì giữ nguyên.
 */
function headingTail(line, low, re) {
  const m = re.exec(low);
  if (!m) return undefined;
  // Trước cụm tiêu đề chỉ được có ký hiệu (biểu tượng cảm xúc, dấu gạch), không được có chữ
  if (/[\p{L}\p{N}]/u.test(low.slice(0, m.index))) return undefined;
  const tail = low.slice(m.index + m[0].length).replace(/^[\s:：.,–—|-]+/, '');
  const n = tail.split(/\s+/).filter(Boolean).length;
  if (!n) return null;
  const words = line.trim().split(/\s+/);
  return words.slice(words.length - n).join(' ');
}

/** Gắn trọng số cho từng dòng JD theo tiêu đề mục gần nhất phía trên. */
export function splitSections(text) {
  const out = [];
  let w = 2; // chưa gặp tiêu đề nào: coi như phần mô tả
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const low = strip(line);
    // Tiêu đề mục: dòng ngắn, không phải câu kể
    if (low.length <= 70) {
      let found = false;
      for (const r of SECTION_RULES) {
        const tail = headingTail(line, low, r.re);
        if (tail === undefined) continue;
        w = r.w;
        found = true;
        if (tail && r.w > 0) out.push(row(tail, r.w));
        break;
      }
      if (found) continue;
    }
    // "Biết SQL là một lợi thế" nằm trong mục Yêu cầu nhưng vẫn chỉ là ưu tiên:
    // cụm đánh dấu nằm giữa câu thì hạ trọng số của riêng dòng đó.
    out.push(row(line, NICE_INLINE.test(low) ? Math.min(w, 1) : w));
  }
  return out;
}

// ── Tìm kỹ năng trong một đoạn chữ ───────────────────────────
/**
 * @returns {Map<string,{skill:object,count:number,weight:number,lines:string[]}>}
 */
export function findSkills(sections) {
  const found = new Map();
  const claimed = []; // vùng đã khớp, để "react native" chặn "react" trùng chỗ

  for (const sec of sections) {
    if (sec.w === 0) continue;
    claimed.length = 0;
    for (const { alias, skill, acc } of ALIAS_INDEX) {
      const hay = acc ? (sec.acc ?? sec.low) : sec.low;
      const re = aliasRe(alias);
      let m;
      while ((m = re.exec(hay)) !== null) {
        const a = m.index, b = a + m[0].length;
        if (claimed.some(([x, y]) => a < y && b > x)) continue;
        claimed.push([a, b]);
        const cur = found.get(skill.k) || { skill, count: 0, weight: 0, lines: [] };
        cur.count += 1;
        cur.weight = Math.max(cur.weight, sec.w);
        if (cur.lines.length < 3 && !cur.lines.includes(sec.line)) cur.lines.push(sec.line);
        found.set(skill.k, cur);
      }
    }
  }
  return found;
}

/** Tìm kỹ năng trong chữ thường (CV) — không chia mục, mọi dòng tính như nhau. */
export function findSkillsInText(text) {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim());
  return findSkills(lines.map((line) => ({ line: line.trim(), low: strip(line), acc: line.toLowerCase(), w: 2 })));
}

// ── Từ khoá tự do: bắt cả những ngành chưa có trong từ điển ──
const TOKEN_RE = /[a-zA-Z0-9àáâãèéêìíòóôõùúăđĩũơưăạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹý+#./]+/g;

/**
 * Rút từ khoá cho những ngành chưa có trong từ điển (AutoCAD, ISO 9001, Thông tư 21/2019…).
 * Siết chặt có chủ đích: thà bỏ sót còn hơn nhồi cụm vô nghĩa vào mẫu số điểm.
 * Một cụm chỉ được giữ khi mang thông tin riêng — có số, là từ viết tắt, hoặc là
 * từ nước ngoài (không dấu, không nằm trong danh sách từ thường gặp).
 */
export function freeKeywords(sections, coveredTokens, limit = 6) {
  const isGeneric = (t) => STOPWORDS.has(t) || t.length < 3;
  /** Token mang thông tin: có số, viết tắt in hoa, hoặc từ nước ngoài đủ dài. */
  const isSpecific = (surface) => {
    const t = strip(surface);
    if (/\d/.test(t)) return true;
    if (/^[A-Z][A-Z0-9+#.]{1,5}$/.test(surface)) return true;          // SAP, ISO, CAD, AWS
    if (t.length >= 5 && surface === strip(surface) && !isGeneric(t)) return true; // không dấu ⇒ từ mượn
    return false;
  };

  const score = new Map();
  for (const sec of sections) {
    if (sec.w === 0) continue;
    const words = sec.line.match(TOKEN_RE) || [];
    for (let n = 1; n <= 3; n++) {
      for (let i = 0; i + n <= words.length; i++) {
        const gram = words.slice(i, i + n);
        const toks = gram.map(strip);
        const key = toks.join(' ');
        if (key.length < 3 || key.length > 40) continue;
        if (/^[\d.,/+#-]+$/.test(key)) continue;
        if (toks.some(isGeneric)) continue;
        if (toks.some((t) => coveredTokens.has(t))) continue;   // đã có trong từ điển kỹ năng
        if (!gram.some(isSpecific)) continue;
        const cur = score.get(key) || { n: 0, w: 0, toks, surface: gram.join(' ') };
        cur.n += 1;
        cur.w = Math.max(cur.w, sec.w);
        score.set(key, cur);
      }
    }
  }

  const rows = [...score.values()]
    .filter((v) => v.n >= 2 || v.toks.some((t) => /\d/.test(t)))   // nhắc một lần thì phải có số
    .sort((a, b) => b.w - a.w || b.n - a.n || b.toks.length - a.toks.length);

  // Gộp các cụm chồng nhau: "tot nghiep trung" và "nghiep trung cap" là một ý
  const picked = [];
  for (const v of rows) {
    if (picked.length >= limit) break;
    const dup = picked.some((p) => {
      const shared = v.toks.filter((t) => p.toks.includes(t)).length;
      return shared / Math.min(v.toks.length, p.toks.length) > 0.5;
    });
    if (!dup) picked.push({ key: v.toks.join(' '), toks: v.toks, label: v.surface, weight: 1 });
  }
  return picked;
}

// ── Yêu cầu cứng ─────────────────────────────────────────────
const DEGREE_RANK = { trungcap: 1, caodang: 2, daihoc: 3, thacsi: 4, tiensi: 5 };
const DEGREE_PAT = [
  { k: 'tiensi', re: /(tien si|phd|doctorate)/ },
  { k: 'thacsi', re: /(thac si|master|mba)/ },
  { k: 'daihoc', re: /(dai hoc|bachelor|cu nhan|ky su(?! thuc hanh)|university degree)/ },
  { k: 'caodang', re: /(cao dang|college|associate degree|ky su thuc hanh)/ },
  { k: 'trungcap', re: /(trung cap|vocational|trung hoc chuyen nghiep)/ },
];

export const FRESHER_RE = /(khong yeu cau kinh nghiem|no experience|khong can kinh nghiem|chua co kinh nghiem cung duoc|fresher|thuc tap sinh|\bintern\b|sinh vien moi ra truong|moi tot nghiep|entry[- ]level)/;

/** Số năm ghi thẳng trong tin, bỏ qua chữ "fresher". null nếu tin không nêu con số. */
export function explicitYears(low) {
  const m = low.match(/(?:tu|toi thieu|it nhat|at least|minimum|min)?\s*(\d{1,2})\s*(?:\+|tro len)?\s*(?:-|–|den|to)?\s*(?:\d{1,2})?\s*(?:nam|year)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 0 && n <= 20 ? n : null;
}

/** Số năm kinh nghiệm JD đòi. 0 = fresher/không yêu cầu; null = JD không nói. */
export function requiredYears(low) {
  if (FRESHER_RE.test(low)) return 0;
  return explicitYears(low);
}

export function requiredDegree(low) {
  for (const d of DEGREE_PAT) if (d.re.test(low)) return d.k;
  return null;
}

/** Tổng số tháng đi làm suy ra từ các khoảng thời gian trong CV (đã gộp phần chồng nhau). */
export function experienceMonths(text, now = new Date()) {
  const low = strip(text);
  const cur = now.getFullYear() * 12 + now.getMonth();
  const spans = [];
  const re = /(?:(\d{1,2})\s*[/.-]\s*)?((?:19|20)\d{2})\s*(?:-|–|—|to|den|toi)\s*(?:(nay|now|present|hien tai|current)|(?:(\d{1,2})\s*[/.-]\s*)?((?:19|20)\d{2}))/g;
  let m;
  while ((m = re.exec(low)) !== null) {
    const sM = m[1] ? parseInt(m[1], 10) : 1, sY = parseInt(m[2], 10);
    if (sM < 1 || sM > 12) continue;
    const start = sY * 12 + (sM - 1);
    let end;
    if (m[3]) end = cur;
    else {
      const eM = m[4] ? parseInt(m[4], 10) : 12, eY = parseInt(m[5], 10);
      if (eM < 1 || eM > 12) continue;
      end = eY * 12 + (eM - 1);
    }
    if (end < start || end > cur + 1) continue;
    spans.push([start, end]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  let total = 0, lastEnd = -1;
  for (const [a, b] of spans) {
    const from = Math.max(a, lastEnd);
    if (b > from) { total += b - from; lastEnd = b; }
  }
  return total;
}

// ── Phân tích JD ─────────────────────────────────────────────
export function parseJD(text) {
  const sections = splitSections(text);
  const low = strip(text);
  const skillMap = findSkills(sections);
  // Mọi token thuộc kỹ năng đã nhận ra: không để bộ rút từ khoá tự do lấy lại
  const covered = new Set();
  for (const { skill } of skillMap.values()) {
    for (const s of [skill.k, skill.en, skill.vi, ...skill.a])
      for (const t of strip(s).split(/[^a-z0-9+#.]+/)) if (t) covered.add(t);
  }
  const skills = [...skillMap.values()]
    .map((v) => ({ key: v.skill.k, skill: v.skill, weight: v.weight, count: v.count, lines: v.lines }))
    .sort((a, b) => b.weight - a.weight || b.count - a.count);

  return {
    text: String(text || ''),
    sections,
    skills,
    keywords: freeKeywords(sections, covered),
    years: requiredYears(low),
    degree: requiredDegree(low),
    wordCount: (String(text || '').match(/\S+/g) || []).length,
  };
}

// ── Phân tích CV ─────────────────────────────────────────────
const SECTION_HINTS = {
  contact:    /(thong tin ca nhan|lien he|contact)/,
  summary:    /(muc tieu|tom tat|gioi thieu|summary|objective|profile|about me)/,
  experience: /(kinh nghiem|experience|qua trinh lam viec|work history|employment)/,
  education:  /(hoc van|education|qua trinh hoc tap|bang cap|trinh do hoc van)/,
  skills:     /(ky nang|skill|chuyen mon|competenc|technical skill)/,
  projects:   /(du an|project|san pham|portfolio)/,
  awards:     /(giai thuong|chung chi|certificat|award|honor|khen thuong)/,
};

const ACTION_VERBS = /^(xay dung|phat trien|thiet ke|trien khai|quan ly|quan tri|toi uu|cai tien|xu ly|phan tich|thuc hien|tham gia|ho tro|dam nhan|chiu trach nhiem|lap trinh|viet|tao|dan dat|dao tao|tu van|van hanh|kiem tra|khac phuc|cai dat|ung dung|tich hop|chuyen doi|giam sat|bao tri|sua chua|nang cap|chuan hoa|dong goi|kiem thu|tiep nhan|phoi hop|lap ke hoach|de xuat|nghien cuu|tong hop|bao cao|dam phan|cham soc|giai quyet|tang|giam|rut ngan|hoan thanh|dat|chan doan|khoi phuc|trien khai|bao cao|huong dan|built|build|developed|develop|designed|design|implemented|implement|managed|manage|led|lead|optimised|optimized|optimise|improved|improve|created|create|analysed|analyzed|delivered|deliver|maintained|maintain|automated|automate|reduced|increased|launched|owned|resolved|resolve|deployed|deploy|administered|administer|wrote|write|diagnosed|diagnose|helped|help|supported|support|configured|configure|installed|install|migrated|migrate|integrated|integrate|tested|test|shipped|ship|cut|saved|scaled|trained|train|coordinated|coordinate|presented|present|researched|monitored|monitor|refactored|documented)\b/;

/**
 * @param {string} text  chữ bóc ra từ CV
 * @param {object} meta  { kind:'pdf'|'docx'|'text', pages, columns, tables, images, fileName, extractable }
 */
export function analyzeCV(text, meta = {}) {
  const raw = String(text || '');
  const low = strip(raw);
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const words = raw.match(/\S+/g) || [];
  const issues = [];
  const add = (id, sev, extra) => issues.push({ id, sev, ...(extra || {}) });

  // Tìm mục. Tiêu đề in giãn chữ (letter-spacing) được bóc ra thành "T Ó M T Ắ T",
  // nên so khớp thêm một lần nữa sau khi bỏ sạch khoảng trắng ở cả hai phía.
  const squash = (s) => strip(s).replace(/\s+/g, '');
  const lowSquashed = squash(raw);
  const sections = {};
  for (const [name, re] of Object.entries(SECTION_HINTS)) {
    const reSquashed = new RegExp(re.source.replace(/ /g, ''), re.flags);
    sections[name] = lines.some((l) => l.length <= 60 && (re.test(strip(l)) || reSquashed.test(squash(l))))
      || re.test(low) || reSquashed.test(lowSquashed);
  }

  // Liên hệ
  const email = raw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const phone = raw.match(/(?:\+?84|0)\s?(?:\d[\s.-]?){8,10}\d/);
  const link = raw.match(/(github\.com|linkedin\.com|gitlab\.com|behance\.net|[\w-]+\.(?:io|dev|vn|com)\/[\w-]+)/i);

  if (!email) add('no_email', 'fatal');
  if (!phone) add('no_phone', 'fatal');
  if (!link) add('no_link', 'info');

  // Đọc được chữ không — lỗi nặng nhất với ATS
  if (meta.extractable === false || words.length < 60) add('not_parseable', 'fatal', { words: words.length });

  // Cấu trúc
  if (!sections.experience && !sections.projects) add('no_experience_section', 'fatal');
  if (!sections.education) add('no_education_section', 'warn');
  if (!sections.skills) add('no_skills_section', 'warn');
  if (!sections.summary) add('no_summary', 'info');

  // Bố cục gây vỡ khi máy đọc
  if (meta.columns > 1) add('multi_column', 'fatal', { columns: meta.columns });
  if (meta.tables > 0) add('tables', 'warn', { n: meta.tables });
  if (meta.images > 0) add('images', 'info', { n: meta.images });
  if (meta.kind && !['pdf', 'docx', 'text'].includes(meta.kind)) add('bad_format', 'fatal', { kind: meta.kind });

  // Độ dài
  if (words.length >= 60 && words.length < 180) add('too_short', 'warn', { words: words.length });
  if (words.length > 1200) add('too_long', 'warn', { words: words.length });
  if (meta.pages > 2) add('too_many_pages', 'warn', { pages: meta.pages });

  // Chất lượng nội dung
  const bullets = lines.filter((l) => /^[-•●○▪*‣–—]/.test(l) || (l.length > 40 && l.length < 300));
  const quantified = bullets.filter((l) => /\d/.test(l) && /(%|\d{2,}|trieu|ty|nguoi|khach|don|gio|ngay|thang|lan|x\b)/.test(strip(l)));
  const verbStart = bullets.filter((l) => ACTION_VERBS.test(strip(l.replace(/^[-•●○▪*‣–—]\s*/, ''))));
  if (bullets.length && quantified.length === 0) add('no_numbers', 'warn');
  if (bullets.length >= 5 && verbStart.length / bullets.length < 0.3) add('weak_verbs', 'warn', { pct: Math.round(100 * verbStart.length / bullets.length) });

  // Mốc thời gian
  const months = experienceMonths(raw);
  if (sections.experience && months === 0) add('no_dates', 'warn');

  // Thói quen hay gặp ở CV Việt Nam
  if (/(tinh trang hon nhan|hon nhan|doc than|da ket hon|marital)/.test(low)) add('marital_status', 'info');
  if (/(so cmnd|can cuoc cong dan|cccd|cmnd|so chung minh)/.test(low)) add('id_number', 'warn');
  if (/(tham khao|references available|nguoi tham chieu)/.test(low) && /available|khi can/.test(low)) add('references_line', 'info');

  // Ký tự vỡ khi bóc chữ
  if (/[�]|Ã¢|áº/.test(raw)) add('broken_glyphs', 'warn');

  return {
    text: raw,
    words: words.length,
    lines: lines.length,
    sections,
    contact: { email: !!email, phone: !!phone, link: !!link },
    bullets: bullets.length,
    quantified: quantified.length,
    verbStart: verbStart.length,
    months,
    degree: requiredDegree(low),
    skills: findSkillsInText(raw),
    issues,
    meta,
  };
}

// ── Chấm điểm khớp CV ↔ JD ───────────────────────────────────
const SEV_COST = { fatal: 9, warn: 4, info: 1 };

export function matchScore(jd, cv) {
  // 1. Kỹ năng (45đ)
  const want = [
    ...jd.skills.map((s) => ({ key: s.key, label: s.skill.vi, labelEn: s.skill.en, group: s.skill.g, weight: s.weight, kind: 'skill' })),
    ...jd.keywords.map((k) => ({ key: k.key, label: k.label, labelEn: k.label, group: 'other', weight: k.weight, kind: 'keyword' })),
  ];
  const cvLow = strip(cv.text);
  const cvAcc = cv.text.toLowerCase();
  const matched = [], missing = [];
  let gotW = 0, allW = 0;
  for (const w of want) {
    allW += w.weight;
    const hit = w.kind === 'skill'
      ? cv.skills.has(w.key)
      : aliasRe(w.key).test(aliasNeedsAccents(w.key) ? cvAcc : cvLow);
    if (hit) { gotW += w.weight; matched.push(w); } else missing.push(w);
  }
  missing.sort((a, b) => b.weight - a.weight);
  const skillPct = allW ? gotW / allW : 0;
  const skillPts = Math.round(45 * skillPct);

  // 2. Yêu cầu cứng (20đ)
  const reqNotes = [];
  let reqPts = 20;
  if (jd.years !== null) {
    const have = cv.months / 12;
    if (have + 0.25 >= jd.years) reqNotes.push({ id: 'years_ok', ok: true, need: jd.years, have: Math.round(have * 10) / 10 });
    else {
      const gap = jd.years - have;
      const lose = Math.min(12, Math.round(gap * 4));
      reqPts -= lose;
      reqNotes.push({ id: 'years_short', ok: false, need: jd.years, have: Math.round(have * 10) / 10 });
    }
  } else reqNotes.push({ id: 'years_unknown', ok: null });

  if (jd.degree) {
    const need = DEGREE_RANK[jd.degree] || 0, have = DEGREE_RANK[cv.degree] || 0;
    if (have >= need) reqNotes.push({ id: 'degree_ok', ok: true, need: jd.degree, have: cv.degree });
    else { reqPts -= have ? 4 : 8; reqNotes.push({ id: 'degree_short', ok: false, need: jd.degree, have: cv.degree }); }
  }
  reqPts = Math.max(0, reqPts);

  // 3. Cấu trúc ATS (25đ)
  const atsCost = cv.issues.reduce((n, i) => n + (SEV_COST[i.sev] || 0), 0);
  const atsPts = Math.max(0, 25 - atsCost);

  // 4. Chất lượng nội dung (10đ)
  let qPts = 10;
  if (cv.bullets === 0) qPts -= 4;
  else {
    if (cv.quantified === 0) qPts -= 3;
    else if (cv.quantified < 3) qPts -= 1;
    const vr = cv.verbStart / cv.bullets;
    if (vr < 0.3) qPts -= 3; else if (vr < 0.5) qPts -= 1;
  }
  if (cv.words < 180 || cv.words > 1200) qPts -= 2;
  qPts = Math.max(0, qPts);

  const total = Math.max(0, Math.min(100, skillPts + reqPts + atsPts + qPts));
  return {
    total,
    bands: [
      { id: 'skills', pts: skillPts, max: 45, pct: Math.round(100 * skillPct) },
      { id: 'requirements', pts: reqPts, max: 20, notes: reqNotes },
      { id: 'ats', pts: atsPts, max: 25, issues: cv.issues },
      { id: 'quality', pts: qPts, max: 10 },
    ],
    matched, missing,
    verdict: total >= 80 ? 'strong' : total >= 65 ? 'good' : total >= 45 ? 'fair' : 'weak',
  };
}

// ── Chấm điểm chất lượng tin tuyển dụng (cho HR) ─────────────
/**
 * Dò điều kiện phân biệt đối xử — Bộ luật Lao động 2019 Điều 8 cấm phân biệt khi tuyển dụng.
 *
 * CHẠY TRÊN CHỮ CÒN DẤU, không dùng strip(): bỏ dấu thì "năm" (đơn vị thời gian)
 * biến thành "nam" (giới tính), khiến mọi tin ghi "2 năm kinh nghiệm" đều bị gắn cờ oan.
 * Vì vậy "nam"/"nữ" chỉ tính khi có ngữ cảnh rõ ràng, không bắt từ đứng một mình
 * (tránh "Việt Nam", "miền Nam").
 */
const JD_BIAS = [
  // Dùng (?!\p{L}) chứ không dùng \b: trong JavaScript, \b chỉ tính [A-Za-z0-9_],
  // nên "nữ" đứng cuối câu không tạo ranh giới từ và mẫu sẽ trượt.
  { id: 'gender', re: /(giới tính\s*:?\s*(nam|nữ)|(?:ưu tiên|chỉ tuyển|chỉ nhận|yêu cầu|tuyển)\s+(?:ứng viên\s+)?(nam|nữ)(?!\p{L})|(?<!\p{L})(nam|nữ)\s*[,.:]?\s*(?:từ\s*)?\d{2}\s*[-–]\s*\d{2}|(male|female)\s+only|^\s*(nam|nữ)(?!\p{L}))/mu },
  { id: 'age', re: /(tuổi\s*(?:từ|:)|độ tuổi|\d{2}\s*[-–]\s*\d{2}\s*tuổi|dưới\s*\d{2}\s*tuổi|trên\s*\d{2}\s*tuổi|không quá\s*\d{2}\s*tuổi|age\s*:?\s*\d{2})/ },
  { id: 'marital', re: /(đã kết hôn|chưa kết hôn|độc thân|tình trạng hôn nhân|marital status)/ },
  { id: 'appearance', re: /(ngoại hình|ưa nhìn|không nói ngọng|chiều cao|cân nặng|hình thức khá)/ },
  { id: 'region', re: /(hộ khẩu|thường trú tại|ưu tiên người địa phương|không tuyển người tỉnh)/ },
];

export function scoreJD(text) {
  const jd = parseJD(text);
  const low = strip(text);
  // Bản còn dấu, chỉ hạ chữ thường — dùng cho các mẫu mà dấu quyết định nghĩa
  const acc = String(text || '').toLowerCase();
  const issues = [];
  const add = (id, sev, extra) => issues.push({ id, sev, ...(extra || {}) });
  let pts = 100;
  const cut = (n, id, sev, extra) => { pts -= n; add(id, sev, extra); };

  // Đủ thông tin chưa
  if (jd.wordCount < 55) cut(12, 'jd_too_short', 'warn', { words: jd.wordCount });
  const reqLines = jd.sections.filter((s) => s.w === 3).length;
  const descLines = jd.sections.filter((s) => s.w === 2).length;
  if (reqLines === 0) cut(12, 'jd_no_requirements', 'warn');
  if (descLines < 3) cut(12, 'jd_vague_duties', 'warn', { n: descLines });
  if (jd.skills.length + jd.keywords.length < 4) cut(10, 'jd_few_skills', 'warn');

  // Lương
  const hasSalary = /(\d[\d.,]{5,}|\d+\s*-\s*\d+\s*(trieu|tr\b)|\d+\s*trieu|usd|\$\s*\d|gross|net\b)/.test(low);
  const hidden = /(luong thoa thuan|thoa thuan|negotiable|canh tranh|competitive salary|hap dan)/.test(low);
  if (!hasSalary) cut(hidden ? 10 : 12, 'jd_no_salary', 'warn', { hidden });

  // Thực tế hay không
  const yrs = explicitYears(low);
  if (yrs !== null && yrs >= 3 && FRESHER_RE.test(low)) cut(10, 'jd_contradiction', 'warn', { years: yrs });
  if (yrs !== null && yrs >= 5) cut(5, 'jd_high_experience', 'info', { years: yrs });
  if (jd.skills.length > 18) cut(8, 'jd_too_many_skills', 'warn', { n: jd.skills.length });

  // Thông tin vận hành
  if (!/(dia chi|dia diem|lam viec tai|address|location|quan \d|tp\.|thanh pho|ha noi|ho chi minh|da nang|remote|tu xa)/.test(low))
    cut(6, 'jd_no_location', 'warn');
  if (!/(thoi gian lam viec|gio lam|ca lam|gio hanh chinh|xoay ca|working hour|\bhours?\b|monday|mon\s*[-–]\s*fri|thu 2|thu hai|t2|full-?time|part-?time|toan thoi gian|ban thoi gian|\d{1,2}\s*[:h]\s*\d{2}\s*[-–])/.test(low))
    cut(4, 'jd_no_hours', 'info');
  if (!/[\w.+-]+@[\w-]+\.[\w.-]+|(?:\+?84|0)\s?(?:\d[\s.-]?){8,10}\d|ung tuyen tai|apply/.test(low))
    cut(6, 'jd_no_contact', 'warn');

  // Phân biệt đối xử — Bộ luật Lao động 2019 Điều 8 cấm phân biệt khi tuyển dụng
  const bias = JD_BIAS.filter((b) => b.re.test(acc)).map((b) => b.id);
  if (bias.length) cut(Math.min(22, 8 * bias.length), 'jd_bias', 'fatal', { kinds: bias });

  return {
    total: Math.max(0, Math.min(100, pts)),
    issues,
    jd,
    verdict: pts >= 80 ? 'strong' : pts >= 65 ? 'good' : pts >= 45 ? 'fair' : 'weak',
  };
}

export const SKILL_BY_KEY = Object.fromEntries(SKILLS.map((s) => [s.k, s]));

/**
 * ATS Scan — lớp giao diện.
 * Mọi xử lý chạy trong trình duyệt; không có lệnh gọi mạng nào trong file này.
 */
import { parseJD, analyzeCV, matchScore, scoreJD, strip } from './engine.js';
import { UI, ISSUES, JD_ISSUES, makeT, issueText } from './i18n.js';
import { TIPS, TIP_GROUPS, TEMPLATES } from './content.js';
import { GROUPS } from './skills.js';
import { SAMPLE_JD, SAMPLE_CV } from './samples.js';

// ── Trạng thái ──────────────────────────────────────────────
const store = {
  get(k, d) { try { return localStorage.getItem('ats.' + k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ats.' + k, v); } catch { /* chế độ riêng tư */ } },
};
const state = {
  lang: store.get('lang', (navigator.language || '').startsWith('en') ? 'en' : 'vi'),
  aud: store.get('aud', 'candidate'),
  tab: 'scan',
  docs: { 1: [], 2: [] },   // file đã đọc theo từng ô thả
  redraw: {},               // vẽ lại kết quả đã hiện khi đổi ngôn ngữ
};
const t = makeT(() => state.lang);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── Nạp thư viện đọc file (nhúng sẵn trong repo, không gọi CDN) ──
let _pdfjs = null, _mammoth = null;
async function pdfjs() {
  if (!_pdfjs) {
    _pdfjs = await import('./vendor/pdf.min.mjs');
    _pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
  }
  return _pdfjs;
}
function mammoth() {
  if (_mammoth) return _mammoth;
  _mammoth = new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = new URL('./vendor/mammoth.browser.min.js', import.meta.url).href;
    s.onload = () => ok(window.mammoth); s.onerror = no;
    document.head.appendChild(s);
  });
  return _mammoth;
}

// ── Đọc file ────────────────────────────────────────────────
/** Hai cột hay một? Dựng biểu đồ vị trí bắt đầu của chữ; hai cụm hai bên, giữa trống ⇒ hai cột. */
function detectColumns(xs) {
  if (xs.length < 40) return 1;
  const bins = new Array(20).fill(0);
  for (const x of xs) bins[Math.min(19, Math.max(0, Math.floor(x * 20)))]++;
  const sum = (a, b) => bins.slice(a, b).reduce((m, n) => m + n, 0);
  const total = xs.length;
  return (sum(0, 8) / total > 0.25 && sum(11, 20) / total > 0.25 && sum(8, 11) / total < 0.06) ? 2 : 1;
}

/**
 * Ghép các mẩu chữ của một dòng lại.
 * Không nối bằng dấu cách vô điều kiện: tiêu đề có giãn chữ (letter-spacing) được
 * pdf.js trả về thành nhiều mẩu rời, nối bừa sẽ biến "KINH NGHIỆM" thành
 * "KINH NGHIỆ M" và mọi phép so khớp từ khoá sau đó đều trượt.
 * Chỉ chèn dấu cách khi giữa hai mẩu thực sự có khoảng trống trên trang.
 */
function joinRow(parts) {
  parts.sort((a, b) => a.x - b.x);
  let s = '';
  let prevEnd = null, prevSize = 10;
  for (const p of parts) {
    if (prevEnd !== null) {
      const gap = p.x - prevEnd;
      const needSpace = gap > Math.max(0.9, 0.22 * Math.max(prevSize, p.size));
      if (needSpace && !/\s$/.test(s) && !/^\s/.test(p.str)) s += ' ';
    }
    s += p.str;
    prevEnd = p.x + p.w;
    prevSize = p.size || prevSize;
  }
  return s.replace(/\s+/g, ' ').trim();
}

async function readPDF(file) {
  const lib = await pdfjs();
  const doc = await lib.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
  const xs = [], out = [];
  let images = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const w = page.getViewport({ scale: 1 }).width || 1;
    const items = (await page.getTextContent()).items.filter((i) => i.str);
    // Gom theo dòng: baseline chênh vài phần mười điểm vẫn là một dòng
    const rows = new Map();
    for (const it of items) {
      const size = Math.abs(it.transform[0]) || it.height || 10;
      const x = it.transform[4];
      const y = Math.round(it.transform[5] / 2) * 2;
      xs.push(Math.min(1, Math.max(0, x / w)));
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x, w: it.width || 0, size, str: it.str });
    }
    for (const y of [...rows.keys()].sort((a, b) => b - a))
      out.push(joinRow(rows.get(y)));
    try {
      const ops = await page.getOperatorList();
      images += ops.fnArray.filter((f) => f === lib.OPS.paintImageXObject || f === lib.OPS.paintJpegXObject).length;
    } catch { /* đếm ảnh là phần phụ, hỏng thì bỏ qua */ }
  }
  const text = out.filter(Boolean).join('\n');
  return { text, meta: { kind: 'pdf', pages: doc.numPages, columns: detectColumns(xs), images,
                         tables: 0, extractable: text.replace(/\s/g, '').length > 80 } };
}

async function readDOCX(file) {
  const m = await mammoth();
  const buf = await file.arrayBuffer();
  const [html, raw] = await Promise.all([
    m.convertToHtml({ arrayBuffer: buf }).then((r) => r.value).catch(() => ''),
    m.extractRawText({ arrayBuffer: buf }).then((r) => r.value),
  ]);
  return { text: raw, meta: { kind: 'docx', pages: Math.max(1, Math.round(raw.length / 3200)),
                              columns: 1, tables: (html.match(/<table/g) || []).length,
                              images: (html.match(/<img/g) || []).length, extractable: raw.trim().length > 80 } };
}

async function readFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return readPDF(file);
  if (ext === 'docx') return readDOCX(file);
  if (ext === 'txt' || ext === 'md') {
    const text = await file.text();
    return { text, meta: { kind: 'text', pages: 1, columns: 1, tables: 0, images: 0, extractable: text.trim().length > 80 } };
  }
  throw new Error('unsupported');
}

// ── Hiển thị ────────────────────────────────────────────────
const scoreColor = (n) => n >= 80 ? 'var(--ok)' : n >= 65 ? 'var(--brand)' : n >= 45 ? 'var(--warn)' : 'var(--bad)';

function ring(n) {
  const R = 54, C = 2 * Math.PI * R;
  return `<div class="ring"><svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true">
    <circle cx="64" cy="64" r="${R}" fill="none" stroke="var(--line-2)" stroke-width="11"/>
    <circle cx="64" cy="64" r="${R}" fill="none" stroke="${scoreColor(n)}" stroke-width="11" stroke-linecap="round"
      stroke-dasharray="${(C * n / 100).toFixed(1)} ${C.toFixed(1)}"/>
  </svg><div class="num"><b style="color:${scoreColor(n)}">${n}</b><span>/ 100</span></div></div>`;
}

const bandRow = (b) => `<div class="band-row">
  <span class="bn">${esc(t('band_' + b.id))}</span><span class="bv">${b.pts}/${b.max}</span>
  <span class="bar"><i style="width:${Math.round(100 * b.pts / b.max)}%;background:${scoreColor(100 * b.pts / b.max)}"></i></span>
</div>`;

function issueList(list, table = ISSUES) {
  if (!list.length) return `<p class="hint">${esc(t('noIssues'))}</p>`;
  const order = { fatal: 0, warn: 1, info: 2 };
  return `<ul class="issues">` + [...list].sort((a, b) => order[a.sev] - order[b.sev]).map((i) => {
    const x = issueText(i.id, state.lang, table);
    const extra = i.kinds ? ` <span class="hint">(${i.kinds.map(esc).join(', ')})</span>` : '';
    return `<li class="issue ${i.sev}">
      <div class="issue-h"><span class="tag ${i.sev}">${esc(t('sev_' + i.sev))}</span><b>${esc(x.t)}</b>${extra}</div>
      <p><b>${esc(t('whyLabel'))}:</b> ${esc(x.w)}</p>
      <p><b>${esc(t('fixLabel'))}:</b> ${esc(x.f)}</p></li>`;
  }).join('') + `</ul>`;
}

const chip = (label, cls, w) =>
  `<span class="chip ${cls}">${esc(label)}${w > 1 ? `<span class="w">×${w}</span>` : ''}</span>`;

function yearsText(y) { return y === 1 ? t('year_1') : t('years_n', { n: y }); }

function monthsText(m) {
  if (m >= 12) { const y = Math.round(m / 12 * 10) / 10; return yearsText(y); }
  return t('months_n', { n: m });
}

/** Khoá bằng cấp ('caodang') → nhãn người đọc được. */
const degreeText = (d) => (d ? t('deg_' + d) : t('notStated'));

/** Thẻ điểm dùng chung cho cả quét CV lẫn chấm tin. */
const scoreCard = (total, verdictKey, bands) => `<div class="card score-card">
  ${ring(total)}
  <div class="score-side">
    <div class="verdict" style="color:${scoreColor(total)}">${esc(t(verdictKey))}</div>
    ${bands ? `<div class="bands">${bands.map(bandRow).join('')}</div>` : ''}
  </div></div>`;

function renderMatch(box, jd, cv, r) {
  box.innerHTML = `
  ${scoreCard(r.total, 'verdict_' + r.verdict, r.bands)}
  <div class="card">
    <h3 class="sec">${esc(t('missingT'))} <em>${r.missing.length}</em></h3>
    ${r.missing.length
      ? `<div class="chips">${r.missing.map((m) => chip(state.lang === 'en' ? m.labelEn : m.label, 'no', m.weight)).join('')}</div>`
      : `<p class="hint">${esc(t('noMissing'))}</p>`}
    <h3 class="sec" style="margin-top:15px">${esc(t('matched'))} <em>${r.matched.length}</em></h3>
    <div class="chips">${r.matched.map((m) => chip(state.lang === 'en' ? m.labelEn : m.label, 'yes', m.weight)).join('') || `<span class="hint">—</span>`}</div>
  </div>
  <div class="card"><h3 class="sec">${esc(t('issues'))} <em>${cv.issues.length}</em></h3>${issueList(cv.issues)}</div>
  <div class="actions"><button class="btn btn-2" id="copyRep">${esc(t('copyReport'))}</button>
    <button class="btn btn-2" onclick="window.print()">${esc(t('printBtn'))}</button></div>`;
  $('#copyRep', box).onclick = (e) => copyReport(e.target, reportText(jd, cv, r));
}

function renderCVOnly(box, cv) {
  const secs = Object.entries(cv.sections).filter(([, v]) => v).map(([k]) => k);
  const skills = [...cv.skills.values()].map((s) => s.skill);
  const byGroup = {};
  for (const s of skills) (byGroup[s.g] ||= []).push(s);
  box.innerHTML = `
  <div class="card"><h3 class="sec">${esc(t('cvStats'))}</h3>
    <div class="stats">
      <div class="stat"><b>${cv.words}</b><span>${esc(t('stat_words'))}</span></div>
      <div class="stat"><b>${cv.meta.pages || 1}</b><span>${esc(t('stat_pages'))}</span></div>
      <div class="stat"><b>${esc(monthsText(cv.months))}</b><span>${esc(t('stat_months'))}</span></div>
      <div class="stat"><b>${cv.bullets}</b><span>${esc(t('stat_bullets'))}</span></div>
      <div class="stat"><b>${cv.quantified}</b><span>${esc(t('stat_numbers'))}</span></div>
    </div>
    <h3 class="sec" style="margin-top:15px">${esc(t('sectionsFound'))}</h3>
    <div class="chips">${secs.map((s) => chip(s, 'yes')).join('') || `<span class="hint">—</span>`}</div>
  </div>
  ${skills.length ? `<div class="card"><h3 class="sec">${esc(t('skillsFound'))} <em>${skills.length}</em></h3>
    ${Object.entries(byGroup).map(([g, list]) => `<p class="hint" style="margin:9px 0 5px">${esc((GROUPS[g] || GROUPS.other)[state.lang])}</p>
      <div class="chips">${list.map((s) => chip(state.lang === 'en' ? s.en : s.vi, 'n')).join('')}</div>`).join('')}</div>` : ''}
  <div class="card"><h3 class="sec">${esc(t('issues'))} <em>${cv.issues.length}</em></h3>${issueList(cv.issues)}</div>`;
}

function renderJD(box, s) {
  const yrs = s.jd.years === null ? t('notStated') : s.jd.years === 0 ? t('fresherOk') : yearsText(s.jd.years);
  const skills = s.jd.skills.map((x) => chip(state.lang === 'en' ? x.skill.en : x.skill.vi, 'n', x.weight));
  const kws = s.jd.keywords.map((k) => chip(k.label, 'n'));
  box.innerHTML = `
  ${scoreCard(s.total, 'jdv_' + s.verdict, null)}
  <div class="card">
    <h3 class="sec">${esc(t('jdFound'))}</h3>
    <div class="stats" style="margin-bottom:12px">
      <div class="stat"><b style="font-size:15px">${esc(yrs)}</b><span>${esc(t('jdYears'))}</span></div>
      <div class="stat"><b style="font-size:15px">${esc(degreeText(s.jd.degree))}</b><span>${esc(t('jdDegree'))}</span></div>
    </div>
    <div class="chips">${[...skills, ...kws].join('') || `<span class="hint">—</span>`}</div>
  </div>
  <div class="card"><h3 class="sec">${esc(t('issues'))} <em>${s.issues.length}</em></h3>${issueList(s.issues, JD_ISSUES)}</div>`;
}

function renderRank(box, jd, rows) {
  rows.sort((a, b) => b.r.total - a.r.total);
  box.innerHTML = `<div class="card">
    <h3 class="sec">${esc(t('rank'))} <em>${rows.length}</em></h3>
    <table class="rank"><thead><tr>
      <th>${esc(t('col_rank'))}</th><th>${esc(t('col_file'))}</th><th>${esc(t('col_score'))}</th>
      <th>${esc(t('col_skills'))}</th><th>${esc(t('col_exp'))}</th><th>${esc(t('col_flags'))}</th>
    </tr></thead><tbody>
    ${rows.map((row, i) => {
      const fatal = row.cv.issues.filter((x) => x.sev === 'fatal').length;
      return `<tr>
        <td class="n">${i + 1}</td><td>${esc(row.name)}</td>
        <td><span class="pill" style="background:${scoreColor(row.r.total)};color:var(--card)">${row.r.total}</span></td>
        <td class="n">${row.r.matched.length}/${row.r.matched.length + row.r.missing.length}</td>
        <td class="n">${esc(monthsText(row.cv.months))}</td>
        <td class="n" style="color:${fatal ? 'var(--bad)' : 'var(--ink-3)'}">${fatal || '—'}</td></tr>`;
    }).join('')}
    </tbody></table>
    <p class="hint" style="margin-top:10px">${esc(t('rankHint'))}</p></div>`;
}

// ── Báo cáo chữ ─────────────────────────────────────────────
function reportText(jd, cv, r) {
  const L = [];
  L.push(`ATS SCAN — ${t('score')}: ${r.total}/100 (${t('verdict_' + r.verdict)})`, '');
  for (const b of r.bands) L.push(`  ${t('band_' + b.id)}: ${b.pts}/${b.max}`);
  L.push('', `${t('missingT')} (${r.missing.length}):`);
  L.push(r.missing.length ? '  ' + r.missing.map((m) => (state.lang === 'en' ? m.labelEn : m.label)).join(', ') : '  —');
  L.push('', `${t('matched')} (${r.matched.length}):`);
  L.push(r.matched.length ? '  ' + r.matched.map((m) => (state.lang === 'en' ? m.labelEn : m.label)).join(', ') : '  —');
  L.push('', `${t('issues')} (${cv.issues.length}):`);
  for (const i of cv.issues) {
    const x = issueText(i.id, state.lang);
    L.push(`  [${t('sev_' + i.sev)}] ${x.t}`, `     → ${x.f}`);
  }
  L.push('', t('disclaimer'));
  return L.join('\n');
}

async function copyReport(btn, text) {
  try { await navigator.clipboard.writeText(text); } catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } finally { ta.remove(); }
  }
  const old = btn.textContent; btn.textContent = t('copied');
  setTimeout(() => { btn.textContent = old; }, 1600);
}

// ── Ô thả file ──────────────────────────────────────────────
function wireDrop(slot, dropSel, inputSel, listSel) {
  const drop = $(dropSel), input = $(inputSel), list = $(listSel);
  const multi = () => state.aud === 'hr' && slot === 1;

  const paint = () => {
    input.multiple = multi();
    list.innerHTML = state.docs[slot].map((d, i) => `<li>
      <span class="nm">${esc(d.name)}</span>
      <span class="mt">${d.doc.meta.pages || 1}p · ${d.doc.text.split(/\s+/).filter(Boolean).length} ${state.lang === 'en' ? 'words' : 'từ'}</span>
      <button data-i="${i}" title="${esc(t('removeFile'))}" aria-label="${esc(t('removeFile'))}">×</button></li>`).join('');
    $$('button', list).forEach((b) => { b.onclick = () => { state.docs[slot].splice(+b.dataset.i, 1); paint(); }; });
  };

  async function take(files) {
    const arr = [...files];
    if (!arr.length) return;
    if (!multi()) state.docs[slot] = [];
    for (const f of arr.slice(0, multi() ? 30 : 1)) {
      try {
        const doc = await readFile(f);
        state.docs[slot].push({ name: f.name, doc });
      } catch { alert(t('readFail')); }
    }
    paint();
  }

  drop.onclick = () => input.click();
  drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } };
  input.onchange = () => { take(input.files); input.value = ''; };
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => take(e.dataTransfer.files));
  return paint;
}

/** Gom nội dung CV từ ô thả file và ô dán chữ. */
function cvDocs(slot, textSel) {
  const typed = $(textSel).value.trim();
  const docs = state.docs[slot].map((d) => ({ name: d.name, ...d.doc }));
  if (typed) docs.push({ name: state.lang === 'en' ? 'Pasted text' : 'Chữ đã dán', text: typed,
                         meta: { kind: 'text', pages: 1, columns: 1, tables: 0, images: 0, extractable: true } });
  return docs;
}

// ── Gắn sự kiện ─────────────────────────────────────────────
const paint1 = wireDrop(1, '#drop1', '#file1', '#list1');
const paint2 = wireDrop(2, '#drop2', '#file2', '#list2');

$('#runScan').onclick = () => {
  const msg = $('#msgScan'); msg.textContent = '';
  const jdText = $('#jd1').value.trim();
  if (!jdText) return void (msg.textContent = t('needJD'));
  const docs = cvDocs(1, '#cvText1');
  if (!docs.length) return void (msg.textContent = t('needCV'));

  const jd = parseJD(jdText);
  const box = $('#resScan');
  if (state.aud === 'hr' && docs.length > 1) {
    const rows = docs.map((d) => {
      const cv = analyzeCV(d.text, d.meta);
      return { name: d.name, cv, r: matchScore(jd, cv) };
    });
    state.redraw.scan = () => renderRank(box, jd, rows);
  } else {
    const cv = analyzeCV(docs[0].text, docs[0].meta);
    const r = matchScore(jd, cv);
    state.redraw.scan = () => renderMatch(box, jd, cv, r);
  }
  state.redraw.scan();
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

$('#runCV').onclick = () => {
  const msg = $('#msgCV'); msg.textContent = '';
  const docs = cvDocs(2, '#cvText2');
  if (!docs.length) return void (msg.textContent = t('needCV'));
  const cv = analyzeCV(docs[0].text, docs[0].meta);
  state.redraw.cv = () => renderCVOnly($('#resCV'), cv);
  state.redraw.cv();
  $('#resCV').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

$('#runJD').onclick = () => {
  const msg = $('#msgJD'); msg.textContent = '';
  const text = $('#jd2').value.trim();
  if (!text) return void (msg.textContent = t('needJD'));
  const sc = scoreJD(text);
  state.redraw.jd = () => renderJD($('#resJD'), sc);
  state.redraw.jd();
  $('#resJD').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

$('#sampleScan').onclick = () => { $('#jd1').value = SAMPLE_JD[state.lang]; $('#cvText1').value = SAMPLE_CV[state.lang]; $('#cvText1').closest('details').open = true; };
$('#sampleJD').onclick = () => { $('#jd2').value = SAMPLE_JD[state.lang]; };
$('#clearScan').onclick = () => { $('#jd1').value = ''; $('#cvText1').value = ''; state.docs[1] = []; paint1(); $('#resScan').innerHTML = ''; $('#msgScan').textContent = ''; delete state.redraw.scan; };
$('#clearCV').onclick = () => { $('#cvText2').value = ''; state.docs[2] = []; paint2(); $('#resCV').innerHTML = ''; $('#msgCV').textContent = ''; delete state.redraw.cv; };
$('#clearJD').onclick = () => { $('#jd2').value = ''; $('#resJD').innerHTML = ''; $('#msgJD').textContent = ''; delete state.redraw.jd; };

// ── Thẻ, đối tượng, ngôn ngữ, nền ───────────────────────────
function setTab(name) {
  state.tab = name;
  $$('#tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  $$('.panel').forEach((p) => { p.hidden = p.id !== 'p-' + name; });
  // Ghi chú về điểm số chỉ liên quan tới ba thẻ có chấm điểm
  $('#disclaimer').hidden = name === 'tpl' || name === 'tips';
}
$$('#tabs button').forEach((b) => { b.onclick = () => setTab(b.dataset.tab); });

function setAud(a) {
  state.aud = a; store.set('aud', a);
  $$('#audSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.aud === a)));
  $('#cvLbl1').textContent = t(a === 'hr' ? 'cvLabelHR' : 'cvLabel');
  $('#dropTxt1').textContent = t(a === 'hr' ? 'dropMany' : 'drop');
  state.docs[1] = []; paint1();
  renderTips();
}
$$('#audSeg button').forEach((b) => { b.onclick = () => setAud(b.dataset.aud); });

function renderTips() {
  $('#tipsBox').innerHTML = Object.entries(TIP_GROUPS).map(([g, gl]) => {
    const list = TIPS.filter((x) => x.g === g && x.aud.includes(state.aud));
    if (!list.length) return '';
    return `<section class="tip-group"><h2>${esc(gl[state.lang])}</h2>
      ${list.map((x) => `<div class="tip"><h3>${esc(x[state.lang].t)}</h3><p>${esc(x[state.lang].b)}</p></div>`).join('')}</section>`;
  }).join('');
}

function renderTemplates() {
  $('#tplGrid').innerHTML = TEMPLATES.map((x) => {
    const c = x[state.lang];
    return `<div class="card tpl"><h3>${esc(c.t)}</h3>
      <p class="for">${esc(t('tplFor'))}: ${esc(c.for)}</p>
      <p>${esc(c.b)}</p>
      <div class="actions">
        <a class="btn" href="templates/${x.file}.docx" download>${esc(t('tplDocx'))}</a>
        <a class="btn btn-2" href="templates/${x.file}.md" target="_blank" rel="noopener">${esc(t('tplMd'))}</a>
      </div></div>`;
  }).join('');
}

function applyLang() {
  document.documentElement.lang = state.lang;
  $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  $('#themeBtn').title = $('#themeBtn').ariaLabel = t('theme');
  $('#cvLbl1').textContent = t(state.aud === 'hr' ? 'cvLabelHR' : 'cvLabel');
  $('#dropTxt1').textContent = t(state.aud === 'hr' ? 'dropMany' : 'drop');
  $('#jd1').placeholder = $('#jd2').placeholder = t('jdPlaceholder');
  $('#cvText1').placeholder = $('#cvText2').placeholder = t('pasteCV');
  renderTips(); renderTemplates(); paint1(); paint2();
  Object.values(state.redraw).forEach((fn) => fn());
}
$('#langBtn').onclick = () => { state.lang = state.lang === 'vi' ? 'en' : 'vi'; store.set('lang', state.lang); applyLang(); };

function applyTheme(v) {
  document.documentElement.dataset.theme = v || '';
  store.set('theme', v || '');
}
$('#themeBtn').onclick = () => {
  const now = document.documentElement.dataset.theme;
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(now === 'dark' ? 'light' : now === 'light' ? 'dark' : (dark ? 'light' : 'dark'));
};

// ── Khởi động ───────────────────────────────────────────────
applyTheme(store.get('theme', ''));
setAud(state.aud);
applyLang();
setTab('scan');

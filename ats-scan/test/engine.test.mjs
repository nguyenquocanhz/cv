/**
 * Test bộ máy chấm điểm.  Chạy:  node --test ats-scan/test/
 * Không cần thư viện ngoài, không gọi mạng.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  strip, splitSections, findSkills, findSkillsInText, requiredYears, requiredDegree,
  experienceMonths, parseJD, analyzeCV, matchScore, scoreJD,
} from '../assets/engine.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const fixture = (n) => readFileSync(join(HERE, 'fixtures', n), 'utf8');

// ── Chuẩn hoá chữ ────────────────────────────────────────────
test('strip bỏ dấu tiếng Việt và chữ đ', () => {
  assert.equal(strip('Kỹ thuật viên Máy tính'), 'ky thuat vien may tinh');
  assert.equal(strip('Đào tạo ĐẦY ĐỦ'), 'dao tao day du');
  assert.equal(strip('  nhiều   khoảng\ntrắng '), 'nhieu khoang trang');
});

test('strip giữ ký hiệu của tên công nghệ', () => {
  assert.equal(strip('C++, C#, .NET, Node.js'), 'c++, c#, .net, node.js');
});

// ── Chia mục tin tuyển dụng ──────────────────────────────────
test('mục Quyền lợi không được tính thành yêu cầu', () => {
  const secs = splitSections(`YÊU CẦU
Thành thạo Java
QUYỀN LỢI
Được cấp laptop và đào tạo Python miễn phí`);
  const skills = findSkills(secs);
  assert.ok(skills.has('java'), 'Java ở mục Yêu cầu phải được tính');
  assert.ok(!skills.has('python'), 'Python ở mục Quyền lợi không được tính');
});

test('yêu cầu bắt buộc nặng hơn mục ưu tiên', () => {
  const secs = splitSections(`Yêu cầu\nThành thạo SQL\nƯu tiên\nBiết Docker`);
  const s = findSkills(secs);
  assert.equal(s.get('sql').weight, 3);
  assert.equal(s.get('docker').weight, 1);
});

// ── Khớp kỹ năng ─────────────────────────────────────────────
test('cụm dài khớp trước cụm ngắn', () => {
  const s = findSkillsInText('Lập trình React Native cho iOS');
  assert.ok(s.has('reactnative'));
  assert.ok(!s.has('react'), '"react" không được ăn theo "React Native"');
});

test('không khớp nhầm khi từ nằm trong từ khác', () => {
  const s = findSkillsInText('Công ty Javaco tuyển nhân viên');
  assert.ok(!s.has('java'));
});

test('nhận ra kỹ năng ngoài ngành phần mềm', () => {
  const s = findSkillsInText('Kế toán tổng hợp, thành thạo MISA, quyết toán thuế TNCN');
  assert.ok(s.has('accounting'));
  assert.ok(s.has('misa'));
  assert.ok(s.has('tax'));
});

test('bỏ dấu không được làm từ khác nghĩa trùng nhau', () => {
  // "ghi nhận sự cố" → "ghi nhan su co" từng khớp nhầm alias "nhan su" (nhân sự),
  // "nhiều lần" → "lan" từng khớp mạng LAN, "cho thuê" → "thue" từng khớp thuế.
  const s = findSkillsInText('Giám sát dịch vụ, ghi nhận sự cố nhiều lần trong tháng; hợp đồng cho thuê máy chủ.');
  assert.ok(!s.has('hrm'), '"ghi nhận sự cố" không phải nhân sự');
  assert.ok(!s.has('network'), '"nhiều lần" không phải mạng LAN');
  assert.ok(!s.has('tax'), '"cho thuê" không phải thuế');
});

test('vẫn nhận ra kỹ năng khi viết đúng nghĩa', () => {
  const s = findSkillsInText('Phụ trách nhân sự và tính thuế TNCN; quản trị mạng LAN cho văn phòng.');
  assert.ok(s.has('hrm')); assert.ok(s.has('tax')); assert.ok(s.has('network'));
});

test('từ tiếng Anh thông dụng không bị nhận thành kỹ năng', () => {
  const s = findSkillsInText('Solid Windows knowledge and PowerShell automation scripts. Great content of work.');
  assert.ok(!s.has('oop'), '"Solid Windows" không phải SOLID');
  assert.ok(!s.has('automation'), '"automation scripts" không phải kiểm thử tự động');
  assert.ok(!s.has('content'), '"content of work" không phải content marketing');
  assert.ok(s.has('powershell') && s.has('windows'), 'vẫn phải nhận ra PowerShell và Windows');
  assert.ok(!s.has('windowsserver'), '"Windows" trần không phải Windows Server');
});

test('tiêu đề mục in giãn chữ vẫn nhận ra được', () => {
  // pdf.js trả tiêu đề có letter-spacing thành "T Ó M T Ắ T"
  const cv = analyzeCV(`Nguyễn Văn A
a@b.com · 0900000000
T Ó M T Ắ T
Kỹ thuật viên máy tính với ba năm kinh nghiệm vận hành hệ thống cho văn phòng.
K I N H  N G H I Ệ M
Kỹ thuật viên — Công ty X, 01/2023 – nay
- Xử lý 25 yêu cầu hỗ trợ mỗi tuần cho 80 người dùng, thời gian phản hồi dưới 2 giờ.
H Ọ C  V Ấ N
Cao đẳng Công nghệ thông tin, 2020 – 2023
K Ỹ  N Ă N G
Windows, mạng LAN, phần cứng máy tính.`, { kind: 'pdf', pages: 1, columns: 1 });
  for (const k of ['summary', 'experience', 'education', 'skills'])
    assert.ok(cv.sections[k], `không nhận ra mục ${k} khi tiêu đề bị giãn chữ`);
});

// ── Yêu cầu cứng ─────────────────────────────────────────────
test('đọc số năm kinh nghiệm', () => {
  assert.equal(requiredYears(strip('Yêu cầu tối thiểu 3 năm kinh nghiệm')), 3);
  assert.equal(requiredYears(strip('At least 5 years of experience')), 5);
  assert.equal(requiredYears(strip('Không yêu cầu kinh nghiệm')), 0);
  assert.equal(requiredYears(strip('Tuyển fresher')), 0);
  assert.equal(requiredYears(strip('Làm việc tại Hà Nội')), null);
});

test('đọc bằng cấp yêu cầu', () => {
  assert.equal(requiredDegree(strip('Tốt nghiệp Đại học')), 'daihoc');
  assert.equal(requiredDegree(strip('Tốt nghiệp trung cấp trở lên')), 'trungcap');
  assert.equal(requiredDegree(strip('Không yêu cầu bằng cấp')), null);
});

test('cộng số tháng đi làm, gộp phần chồng nhau', () => {
  const now = new Date(2026, 9, 1); // 10/2026
  assert.equal(experienceMonths('01/2024 – 01/2025', now), 12);
  // Hai việc chồng nhau hoàn toàn chỉ tính một lần
  assert.equal(experienceMonths('01/2024 – 01/2025\n06/2024 – 12/2024', now), 12);
  // "nay" tính tới hiện tại
  assert.equal(experienceMonths('10/2025 – nay', now), 12);
});

// ── Phân tích CV ─────────────────────────────────────────────
test('bắt lỗi CV thiếu liên hệ và thiếu mục', () => {
  const r = analyzeCV('Tôi là một người chăm chỉ và có trách nhiệm trong công việc.');
  const ids = r.issues.map((i) => i.id);
  assert.ok(ids.includes('no_email'));
  assert.ok(ids.includes('no_phone'));
  assert.ok(ids.includes('not_parseable'), 'CV quá ngắn phải bị coi là máy không đọc được');
});

test('CV nhiều cột và CV ảnh scan bị báo lỗi nặng', () => {
  const r1 = analyzeCV('x '.repeat(300), { kind: 'pdf', columns: 2, pages: 1 });
  assert.ok(r1.issues.some((i) => i.id === 'multi_column' && i.sev === 'fatal'));
  const r2 = analyzeCV('', { kind: 'pdf', extractable: false, pages: 1 });
  assert.ok(r2.issues.some((i) => i.id === 'not_parseable' && i.sev === 'fatal'));
});

test('CV thật đọc được đủ mục và thông tin liên hệ', () => {
  const cv = analyzeCV(fixture('cv-kythuat.txt'), { kind: 'pdf', pages: 1, columns: 1 });
  assert.ok(cv.contact.email && cv.contact.phone && cv.contact.link);
  assert.ok(cv.sections.experience && cv.sections.education && cv.sections.skills);
  assert.ok(cv.months > 0, 'phải suy ra được thời gian đi làm từ các mốc ngày tháng');
  assert.ok(!cv.issues.some((i) => i.sev === 'fatal'), 'CV thật không được có lỗi nặng');
});

// ── Chấm điểm khớp ───────────────────────────────────────────
test('CV kỹ thuật khớp cao với tin tuyển kỹ thuật máy tính', () => {
  const jd = parseJD(fixture('jd-memoryzone.txt'));
  const cv = analyzeCV(fixture('cv-kythuat.txt'), { kind: 'pdf', pages: 1, columns: 1 });
  const r = matchScore(jd, cv);
  assert.ok(r.total >= 70, `điểm ${r.total} quá thấp cho CV viết riêng cho tin này`);
  assert.equal(r.bands.reduce((n, b) => n + b.max, 0), 100);
  assert.ok(r.bands.every((b) => b.pts >= 0 && b.pts <= b.max));
});

test('CV không liên quan phải bị điểm thấp', () => {
  const jd = parseJD(fixture('jd-memoryzone.txt'));
  const cv = analyzeCV(`Nguyễn Văn A
a@example.com · 0900000000
KINH NGHIỆM
Đầu bếp — Nhà hàng B, 01/2020 – 01/2024
- Chế biến món Âu, quản lý kho thực phẩm, lên thực đơn hằng ngày cho nhà hàng 80 chỗ.
HỌC VẤN
Trung cấp nấu ăn
KỸ NĂNG
Nấu ăn, trang trí món, vệ sinh an toàn thực phẩm.`, { kind: 'pdf', pages: 1, columns: 1 });
  const r = matchScore(jd, cv);
  assert.ok(r.total < 60, `điểm ${r.total} quá cao cho CV trái ngành`);
});

test('thiếu số năm kinh nghiệm thì bị trừ điểm yêu cầu cứng', () => {
  const jd = parseJD('YÊU CẦU\nTối thiểu 5 năm kinh nghiệm Java\nTốt nghiệp Đại học');
  const base = `a@b.com 0900000000
KINH NGHIỆM
Lập trình Java — 01/2025 – 01/2026
- Xây dựng REST API bằng Java cho hệ thống nội bộ, phục vụ 200 người dùng mỗi ngày.
HỌC VẤN
Cao đẳng Công nghệ thông tin
KỸ NĂNG
Java, SQL`;
  const r = matchScore(jd, analyzeCV(base, { kind: 'pdf', pages: 1, columns: 1 }));
  const band = r.bands.find((b) => b.id === 'requirements');
  assert.ok(band.pts < band.max);
  assert.ok(band.notes.some((n) => n.id === 'years_short'));
  assert.ok(band.notes.some((n) => n.id === 'degree_short'));
});

// ── Chấm điểm tin tuyển dụng ─────────────────────────────────
test('tin MemoryZone bị trừ vì giới hạn giới tính và tuổi', () => {
  const r = scoreJD(fixture('jd-memoryzone.txt'));
  const bias = r.issues.find((i) => i.id === 'jd_bias');
  assert.ok(bias, 'phải phát hiện điều kiện phân biệt');
  assert.ok(bias.kinds.includes('gender'));
  assert.ok(bias.kinds.includes('age'));
  assert.ok(r.total < 85);
});

test('"2 năm kinh nghiệm" không bị nhầm thành yêu cầu giới tính Nam', () => {
  // Bỏ dấu thì "năm" → "nam": nếu dò phân biệt đối xử trên chữ đã bỏ dấu,
  // mọi tin ghi số năm kinh nghiệm đều bị gắn cờ oan.
  const r = scoreJD('Tuyển Lập trình viên. Yêu cầu 2 năm kinh nghiệm Java. Làm việc tại Việt Nam, miền Nam.');
  assert.ok(!r.issues.some((i) => i.id === 'jd_bias'), 'không được gắn cờ phân biệt giới');
});

test('vẫn bắt được yêu cầu giới tính viết rõ', () => {
  for (const t of ['Giới tính: Nam', 'Chỉ tuyển nữ', 'Ưu tiên ứng viên nam', 'Nam, 22-30 tuổi']) {
    const r = scoreJD(t);
    assert.ok(r.issues.some((i) => i.id === 'jd_bias' && i.kinds.includes('gender')), `bỏ sót: ${t}`);
  }
});

test('từ khoá tự do không sinh cụm rác từ tin thật', () => {
  const jd = parseJD(fixture('jd-memoryzone.txt'));
  for (const k of jd.keywords) {
    assert.ok(k.toks.length <= 3 && k.label.trim().length >= 3, `cụm lạ: ${k.label}`);
    assert.ok(!/^(vấn|thức|về|các|ngành|nghề)\b/i.test(k.label.trim()), `cụm cắt giữa câu: ${k.label}`);
  }
  assert.ok(jd.keywords.length <= 6);
});

test('tin có lương rõ ràng không bị trừ mục lương', () => {
  const r = scoreJD(`Tuyển Lập trình viên Java
MÔ TẢ CÔNG VIỆC
- Phát triển API cho hệ thống nội bộ
- Phối hợp với nhóm frontend
- Viết tài liệu kỹ thuật
YÊU CẦU
- Thành thạo Java, Spring Boot, SQL
- 2 năm kinh nghiệm
QUYỀN LỢI
- Lương 20.000.000 - 30.000.000 VNĐ
- Làm việc tại Quận 1, TP. Hồ Chí Minh, thứ 2 đến thứ 6
Liên hệ: hr@congty.com`);
  assert.ok(!r.issues.some((i) => i.id === 'jd_no_salary'), 'đã ghi lương thì không trừ');
  assert.ok(!r.issues.some((i) => i.id === 'jd_bias'));
  assert.ok(r.total >= 80, `điểm ${r.total} quá thấp cho một tin đầy đủ`);
});

test('tin mâu thuẫn fresher nhưng đòi 3 năm bị bắt lỗi', () => {
  const r = scoreJD('Tuyển fresher. Yêu cầu 3 năm kinh nghiệm làm việc với Java.');
  assert.ok(r.issues.some((i) => i.id === 'jd_contradiction'));
});

// ── Bất biến chung ───────────────────────────────────────────
test('không văng với đầu vào rỗng hoặc rác', () => {
  for (const bad of ['', '   ', '\n\n', '!!!???', '😀😀😀']) {
    const jd = parseJD(bad);
    const cv = analyzeCV(bad);
    const r = matchScore(jd, cv);
    assert.ok(r.total >= 0 && r.total <= 100);
    assert.ok(scoreJD(bad).total >= 0);
  }
});

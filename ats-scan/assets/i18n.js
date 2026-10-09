/**
 * Chuỗi hiển thị song ngữ.  t('key') trả về chuỗi theo ngôn ngữ đang chọn.
 * ISSUES giải thích từng lỗi: vì sao máy lọc hồ sơ quan tâm, và sửa thế nào.
 */

export const UI = {
  // ── Khung chung ───────────────────────────────────────────
  appName:      { vi: 'ATS Scan', en: 'ATS Scan' },
  tagline:      { vi: 'Quét CV, chấm tin tuyển dụng — chạy ngay trên máy bạn',
                  en: 'Scan your CV, score a job post — runs entirely on your device' },
  privacy:      { vi: 'CV của bạn không rời khỏi máy. Không tài khoản, không máy chủ, không lưu gì.',
                  en: 'Your CV never leaves this device. No account, no server, nothing stored.' },
  privacyShort: { vi: 'Xử lý ngay trên máy bạn', en: 'Runs on your device' },

  // ── Đối tượng ─────────────────────────────────────────────
  audience:     { vi: 'Bạn là', en: 'I am a' },
  aud_candidate:{ vi: 'Người đi làm', en: 'Job seeker' },
  aud_student:  { vi: 'Sinh viên', en: 'Student' },
  aud_hr:       { vi: 'Nhà tuyển dụng', en: 'Recruiter' },

  // ── Thẻ ───────────────────────────────────────────────────
  tab_scan:     { vi: 'Quét CV theo tin', en: 'Scan CV vs job' },
  tab_cv:       { vi: 'Phân tích CV', en: 'Analyse CV' },
  tab_jd:       { vi: 'Chấm tin tuyển dụng', en: 'Score a job post' },
  tab_tpl:      { vi: 'Mẫu CV chuẩn ATS', en: 'ATS templates' },
  tab_tips:     { vi: 'Mẹo viết CV', en: 'CV writing tips' },

  // ── Nhập liệu ─────────────────────────────────────────────
  jdLabel:      { vi: 'Tin tuyển dụng', en: 'Job description' },
  jdHint:       { vi: 'Dán toàn bộ tin tuyển dụng vào đây — cả phần mô tả lẫn phần yêu cầu.',
                  en: 'Paste the whole job post here — duties and requirements.' },
  jdPlaceholder:{ vi: 'Dán tin tuyển dụng…', en: 'Paste the job post…' },
  cvLabel:      { vi: 'CV của bạn', en: 'Your CV' },
  cvLabelHR:    { vi: 'Hồ sơ ứng viên', en: 'Candidate CVs' },
  drop:         { vi: 'Kéo thả PDF hoặc DOCX vào đây', en: 'Drop a PDF or DOCX here' },
  dropMany:     { vi: 'Kéo thả nhiều file PDF hoặc DOCX vào đây', en: 'Drop several PDF or DOCX files here' },
  orPick:       { vi: 'hoặc chọn file', en: 'or choose a file' },
  orPaste:      { vi: 'hoặc dán chữ', en: 'or paste text' },
  pasteCV:      { vi: 'Dán nội dung CV…', en: 'Paste your CV text…' },
  run:          { vi: 'Chấm điểm', en: 'Score it' },
  runCV:        { vi: 'Phân tích', en: 'Analyse' },
  clear:        { vi: 'Xoá hết', en: 'Clear' },
  sample:       { vi: 'Dùng ví dụ mẫu', en: 'Load a sample' },
  reading:      { vi: 'Đang đọc file…', en: 'Reading file…' },
  removeFile:   { vi: 'Bỏ file này', en: 'Remove' },

  // ── Kết quả ───────────────────────────────────────────────
  score:        { vi: 'Điểm tổng', en: 'Total score' },
  band_skills:  { vi: 'Khớp kỹ năng', en: 'Skills match' },
  band_requirements: { vi: 'Yêu cầu cứng', en: 'Hard requirements' },
  band_ats:     { vi: 'Cấu trúc máy đọc được', en: 'Machine readability' },
  band_quality: { vi: 'Chất lượng nội dung', en: 'Content quality' },
  matched:      { vi: 'Đã có trong CV', en: 'Found in your CV' },
  missingT:     { vi: 'Tin đòi nhưng CV chưa có', en: 'Asked for, not in your CV' },
  noMissing:    { vi: 'CV đã phủ hết các từ khoá tìm thấy trong tin.', en: 'Your CV covers every keyword found in the post.' },
  issues:       { vi: 'Lỗi cần sửa', en: 'Issues to fix' },
  noIssues:     { vi: 'Không tìm thấy lỗi nào về cấu trúc. CV này máy đọc tốt.',
                  en: 'No structural problems found. This CV parses cleanly.' },
  whyLabel:     { vi: 'Vì sao', en: 'Why it matters' },
  fixLabel:     { vi: 'Cách sửa', en: 'How to fix' },
  sev_fatal:    { vi: 'Nghiêm trọng', en: 'Critical' },
  sev_warn:     { vi: 'Nên sửa', en: 'Should fix' },
  sev_info:     { vi: 'Ghi chú', en: 'Note' },
  verdict_strong:{ vi: 'Rất khớp — nên nộp', en: 'Strong match — apply' },
  verdict_good: { vi: 'Khớp khá — nộp được', en: 'Good match — worth applying' },
  verdict_fair: { vi: 'Khớp vừa — nên sửa CV trước khi nộp', en: 'Fair — revise before applying' },
  verdict_weak: { vi: 'Chưa khớp — cân nhắc tin khác', en: 'Weak — consider another role' },
  jdv_strong:   { vi: 'Tin viết tốt', en: 'Well-written post' },
  jdv_good:     { vi: 'Tin khá, còn vài chỗ nên bổ sung', en: 'Good, a few gaps to fill' },
  jdv_fair:     { vi: 'Tin còn thiếu nhiều thông tin', en: 'Missing a lot of detail' },
  jdv_weak:     { vi: 'Tin cần viết lại', en: 'Needs rewriting' },
  year_1:       { vi: '1 năm', en: '1 year' },
  deg_trungcap: { vi: 'Trung cấp', en: 'Vocational' },
  deg_caodang:  { vi: 'Cao đẳng', en: 'College' },
  deg_daihoc:   { vi: 'Đại học', en: "Bachelor's" },
  deg_thacsi:   { vi: 'Thạc sĩ', en: "Master's" },
  deg_tiensi:   { vi: 'Tiến sĩ', en: 'Doctorate' },
  copyReport:   { vi: 'Sao chép báo cáo', en: 'Copy report' },
  copied:       { vi: 'Đã sao chép', en: 'Copied' },
  download:     { vi: 'Tải báo cáo', en: 'Download report' },
  printBtn:     { vi: 'In / lưu PDF', en: 'Print / save PDF' },

  // ── Phân tích CV ──────────────────────────────────────────
  cvStats:      { vi: 'Số liệu', en: 'At a glance' },
  stat_words:   { vi: 'Số từ', en: 'Words' },
  stat_pages:   { vi: 'Số trang', en: 'Pages' },
  stat_months:  { vi: 'Thời gian đi làm', en: 'Work experience' },
  stat_bullets: { vi: 'Số gạch đầu dòng', en: 'Bullet points' },
  stat_numbers: { vi: 'Dòng có số liệu', en: 'Bullets with numbers' },
  sectionsFound:{ vi: 'Mục tìm thấy trong CV', en: 'Sections detected' },
  skillsFound:  { vi: 'Kỹ năng nhận ra trong CV', en: 'Skills detected in your CV' },
  months_n:     { vi: '{n} tháng', en: '{n} months' },
  years_n:      { vi: '{n} năm', en: '{n} years' },

  // ── Chấm tin tuyển dụng ───────────────────────────────────
  jdScoreTitle: { vi: 'Chất lượng tin tuyển dụng', en: 'Job post quality' },
  jdScoreHint:  { vi: 'Tin viết rõ ràng thu được nhiều hồ sơ phù hợp hơn. Công cụ chấm độ đầy đủ, tính thực tế và các điều kiện có thể vi phạm quy định về phân biệt đối xử.',
                  en: 'A clear post attracts better applicants. This scores completeness, realism, and conditions that may count as discrimination.' },
  jdFound:      { vi: 'Yêu cầu máy đọc ra từ tin', en: 'Requirements parsed from the post' },
  jdYears:      { vi: 'Kinh nghiệm yêu cầu', en: 'Experience required' },
  jdDegree:     { vi: 'Bằng cấp yêu cầu', en: 'Degree required' },
  notStated:    { vi: 'không nêu', en: 'not stated' },
  fresherOk:    { vi: 'không yêu cầu', en: 'none required' },

  // ── Xếp hạng nhiều hồ sơ (HR) ─────────────────────────────
  rank:         { vi: 'Xếp hạng hồ sơ', en: 'Candidate ranking' },
  col_rank:     { vi: '#', en: '#' },
  col_file:     { vi: 'Hồ sơ', en: 'File' },
  col_score:    { vi: 'Điểm', en: 'Score' },
  col_skills:   { vi: 'Kỹ năng khớp', en: 'Skills matched' },
  col_exp:      { vi: 'Kinh nghiệm', en: 'Experience' },
  col_flags:    { vi: 'Lỗi nặng', en: 'Critical issues' },
  rankHint:     { vi: 'Điểm chỉ để sắp thứ tự đọc trước — đọc sau. Luôn đọc hồ sơ trước khi loại ai.',
                  en: 'Scores only order your reading queue. Always read a CV before rejecting anyone.' },

  // ── Mẫu CV ────────────────────────────────────────────────
  tplTitle:     { vi: 'Mẫu CV chuẩn ATS', en: 'ATS-safe CV templates' },
  tplHint:      { vi: 'Ba mẫu một cột, không bảng, không ảnh nền — máy lọc hồ sơ đọc được đầy đủ. Tải về rồi điền nội dung của bạn.',
                  en: 'Three single-column templates with no tables or background images, so parsers read every line. Download and fill in.' },
  tplDocx:      { vi: 'Tải bản Word', en: 'Download Word' },
  tplMd:        { vi: 'Xem bản chữ', en: 'View plain text' },
  tplFor:       { vi: 'Hợp với', en: 'Best for' },

  // ── Mẹo ───────────────────────────────────────────────────
  tipsTitle:    { vi: 'Mẹo viết CV cho máy đọc được', en: 'Writing a CV machines can read' },
  tipsFor:      { vi: 'Đang xem mẹo cho', en: 'Showing tips for' },

  // ── Khác ──────────────────────────────────────────────────
  needJD:       { vi: 'Hãy dán tin tuyển dụng trước.', en: 'Paste a job post first.' },
  needCV:       { vi: 'Hãy tải lên hoặc dán nội dung CV.', en: 'Upload or paste a CV first.' },
  readFail:     { vi: 'Không đọc được file này. Thử lưu lại dạng PDF hoặc DOCX, hoặc dán chữ vào ô.',
                  en: 'Could not read this file. Try saving as PDF or DOCX, or paste the text instead.' },
  pdfNoText:    { vi: 'File này không có lớp chữ — nhiều khả năng là ảnh chụp hoặc bản scan. Máy lọc hồ sơ sẽ đọc ra trang trắng.',
                  en: 'This file has no text layer — likely a scan or image. A parser will read it as a blank page.' },
  vendorFail:   { vi: 'Không nạp được bộ đọc file. Bạn vẫn dán chữ vào ô được.',
                  en: 'File readers failed to load. You can still paste text.' },
  lang:         { vi: 'English', en: 'Tiếng Việt' },
  theme:        { vi: 'Đổi nền sáng/tối', en: 'Toggle light/dark' },
  footerFoss:   { vi: 'Phần mềm tự do, giấy phép MIT', en: 'Free software, MIT licence' },
  disclaimer:   { vi: 'Mỗi công ty dùng một phần mềm lọc hồ sơ khác nhau. Điểm ở đây là ước lượng để bạn biết nên sửa chỗ nào, không phải điểm thật của nhà tuyển dụng.',
                  en: 'Every company runs a different applicant tracking system. This score estimates where to improve; it is not the recruiter’s actual score.' },
};

// ── Giải thích lỗi CV ───────────────────────────────────────
export const ISSUES = {
  not_parseable: {
    vi: { t: 'Máy không đọc được chữ trong CV', w: 'Phần mềm lọc hồ sơ bóc chữ ra khỏi file. CV là ảnh chụp, ảnh scan hay chữ nằm trong hình thì nó đọc ra trang trắng và loại hồ sơ ngay.', f: 'Xuất lại CV từ Word hoặc Google Docs sang PDF (Lưu thành PDF), đừng chụp màn hình hay scan. Mở file PDF rồi thử bôi đen một dòng chữ — không bôi đen được là máy cũng không đọc được.' },
    en: { t: 'No readable text found', w: 'Parsers extract raw text. A scan, photo or text-inside-image reads as a blank page and gets dropped.', f: 'Export to PDF from Word or Google Docs instead of scanning. Try selecting a line of text in your PDF — if you cannot, neither can the parser.' } },
  no_email: {
    vi: { t: 'Thiếu địa chỉ email', w: 'Email là cách nhà tuyển dụng liên hệ. Thiếu thì hồ sơ có hay đến mấy cũng không gọi được.', f: 'Ghi email ngay dưới tên, dạng chữ thường. Dùng email nghiêm túc kiểu ten.ho@gmail.com.' },
    en: { t: 'No email address', w: 'Email is how recruiters reach you. Without it a strong CV is unusable.', f: 'Put it right under your name as plain text. Use a professional address.' } },
  no_phone: {
    vi: { t: 'Thiếu số điện thoại', w: 'Nhiều nơi ở Việt Nam gọi điện trước khi gửi email. Nhiều phần mềm cũng coi số điện thoại là trường bắt buộc.', f: 'Ghi số điện thoại cạnh email. Viết liền hoặc cách bằng dấu cách, tránh dấu ngoặc.' },
    en: { t: 'No phone number', w: 'Many recruiters call before emailing, and some systems treat phone as a required field.', f: 'Add it next to your email in plain digits.' } },
  no_link: {
    vi: { t: 'Chưa có link hồ sơ trực tuyến', w: 'Với nghề kỹ thuật và thiết kế, một link GitHub, LinkedIn hay portfolio là bằng chứng mạnh hơn mọi tính từ.', f: 'Thêm một link gọn, viết đầy đủ dạng chữ (github.com/tenban) để máy đọc được, đừng giấu sau chữ "xem tại đây".' },
    en: { t: 'No portfolio or profile link', w: 'For technical and design roles a GitHub, LinkedIn or portfolio link proves more than any adjective.', f: 'Add one short link in plain text, not hidden behind "click here".' } },
  no_experience_section: {
    vi: { t: 'Không thấy mục Kinh nghiệm hay Dự án', w: 'Phần mềm lọc hồ sơ tìm tiêu đề mục để biết đoạn nào là gì. Không có tiêu đề chuẩn thì nó không xếp được nội dung của bạn vào đâu.', f: 'Đặt tiêu đề rõ ràng: KINH NGHIỆM LÀM VIỆC. Chưa đi làm thì dùng DỰ ÁN, kể bài tập lớn, đồ án hay sản phẩm tự làm.' },
    en: { t: 'No Experience or Projects section', w: 'Parsers use headings to classify your content. Without a standard heading your text has nowhere to go.', f: 'Add a clear heading: EXPERIENCE. No job history yet? Use PROJECTS and list coursework or personal builds.' } },
  no_education_section: {
    vi: { t: 'Không thấy mục Học vấn', w: 'Phần lớn tin tuyển dụng lọc theo bằng cấp. Thiếu mục này thì bộ lọc bằng cấp bỏ qua hồ sơ của bạn.', f: 'Thêm mục HỌC VẤN với tên trường, ngành và thời gian học.' },
    en: { t: 'No Education section', w: 'Most postings filter on qualifications. Without this section the degree filter skips you.', f: 'Add EDUCATION with school, field of study and dates.' } },
  no_skills_section: {
    vi: { t: 'Không thấy mục Kỹ năng', w: 'Đây là mục máy quét từ khoá kỹ nhất. Kỹ năng chỉ nằm rải trong câu văn thì dễ bị bỏ sót.', f: 'Thêm mục KỸ NĂNG, liệt kê bằng chữ thường, cách nhau bởi dấu phẩy. Dùng đúng chữ mà tin tuyển dụng dùng.' },
    en: { t: 'No Skills section', w: 'This is where keyword matching looks hardest. Skills buried in prose get missed.', f: 'Add a SKILLS section as a comma-separated list, using the same words the posting uses.' } },
  no_summary: {
    vi: { t: 'Chưa có đoạn tóm tắt mở đầu', w: 'Người đọc lướt CV trong khoảng 10 giây. Ba dòng đầu quyết định họ có đọc tiếp hay không.', f: 'Viết 2–3 dòng: bạn là ai, làm được gì, muốn ứng tuyển vị trí nào. Sửa lại đoạn này cho từng tin.' },
    en: { t: 'No summary at the top', w: 'A human skims for about ten seconds. The first three lines decide whether they keep reading.', f: 'Write two or three lines: who you are, what you can do, which role you want. Rewrite it per application.' } },
  multi_column: {
    vi: { t: 'CV chia nhiều cột', w: 'Đây là lỗi làm hỏng CV nhiều nhất. Máy đọc hết dòng ngang qua cả hai cột, nên chữ ở cột trái và cột phải bị trộn vào nhau thành câu vô nghĩa.', f: 'Chuyển về một cột duy nhất. Mẫu CV đẹp có thanh bên màu là thứ hay bị loại nhất ở bước này.' },
    en: { t: 'Multi-column layout', w: 'The single biggest cause of broken CVs. Parsers read straight across the page, interleaving both columns into nonsense.', f: 'Switch to one column. Those designer templates with a coloured sidebar fail here most often.' } },
  tables: {
    vi: { t: 'Có bảng trong CV', w: 'Nhiều phần mềm đọc bảng sai thứ tự, hoặc bỏ qua hẳn nội dung trong ô.', f: 'Thay bảng bằng dòng chữ thường. Cần căn cột thì dùng tab, đừng dùng bảng.' },
    en: { t: 'Tables detected', w: 'Many parsers read table cells out of order or skip them entirely.', f: 'Replace tables with plain lines. Use tab stops if you need alignment.' } },
  images: {
    vi: { t: 'Có ảnh trong CV', w: 'Chữ nằm trong ảnh thì máy không đọc được. Ảnh thẻ thì vô hại, nhưng biểu đồ kỹ năng dạng hình là mất trắng thông tin.', f: 'Giữ ảnh thẻ nếu muốn, nhưng mọi thông tin quan trọng phải có ở dạng chữ. Bỏ biểu đồ thanh đánh giá kỹ năng.' },
    en: { t: 'Images detected', w: 'Text inside an image is invisible to a parser. A headshot is harmless; a skills chart loses the data.', f: 'Keep a photo if you want, but every real fact must exist as text. Drop graphical skill bars.' } },
  bad_format: {
    vi: { t: 'Định dạng file không phù hợp', w: 'Ảnh JPG/PNG hay file lạ thường bị hệ thống từ chối ngay khi nộp.', f: 'Nộp PDF, hoặc DOCX khi tin yêu cầu. Đặt tên file dạng CV-HoTen-ViTri.pdf.' },
    en: { t: 'Unsupported file type', w: 'Images and unusual formats are often rejected at upload.', f: 'Submit PDF, or DOCX when asked. Name it CV-YourName-Role.pdf.' } },
  too_short: {
    vi: { t: 'CV quá ngắn', w: 'Dưới khoảng 180 từ thì không đủ từ khoá để khớp, và người đọc cũng không thấy bằng chứng gì.', f: 'Mỗi việc hoặc dự án viết 2–4 gạch đầu dòng: bạn làm gì, bằng công cụ nào, kết quả ra sao.' },
    en: { t: 'CV is very short', w: 'Under about 180 words there are too few keywords to match and too little evidence to convince.', f: 'Give each role or project two to four bullets: what you did, with what, and the result.' } },
  too_long: {
    vi: { t: 'CV quá dài', w: 'Người đọc không đọc hết. Những ý quan trọng bị chìm giữa phần kể lể.', f: 'Cắt còn 1 trang nếu dưới 5 năm kinh nghiệm, 2 trang nếu nhiều hơn. Bỏ việc làm thêm không liên quan và kỹ năng không ai hỏi.' },
    en: { t: 'CV is long', w: 'Readers will not finish it, and your best points sink.', f: 'One page under five years of experience, two above. Cut unrelated jobs and skills nobody asked about.' } },
  too_many_pages: {
    vi: { t: 'CV nhiều hơn 2 trang', w: 'Với người mới đi làm, CV dài thường bị coi là không biết chọn lọc.', f: 'Gộp hoặc bỏ bớt, giữ lại phần liên quan nhất tới tin đang nộp.' },
    en: { t: 'More than two pages', w: 'For early-career applicants a long CV reads as poor judgement about what matters.', f: 'Merge or cut, keeping what relates to this specific posting.' } },
  no_numbers: {
    vi: { t: 'Không có số liệu nào', w: '"Có kinh nghiệm quản trị hệ thống" và "quản trị 12 máy chủ, uptime 99%" là hai mức độ thuyết phục khác hẳn nhau.', f: 'Thêm số vào ít nhất một nửa số gạch đầu dòng: bao nhiêu người dùng, bao nhiêu máy, giảm bao nhiêu phần trăm, trong bao lâu.' },
    en: { t: 'No numbers anywhere', w: '"Experienced in system administration" and "ran 12 servers at 99% uptime" are not equally convincing.', f: 'Put a number in at least half your bullets: how many users, how many machines, what percent, over what period.' } },
  weak_verbs: {
    vi: { t: 'Gạch đầu dòng mở đầu yếu', w: 'Câu bắt đầu bằng "Chịu trách nhiệm về…" hay "Tham gia vào…" nghe như mô tả công việc chung, không cho biết bạn đã tự làm được gì.', f: 'Mở đầu bằng động từ hành động: Xây dựng, Triển khai, Tối ưu, Khắc phục, Rút ngắn. Rồi nói kết quả.' },
    en: { t: 'Weak bullet openings', w: '"Responsible for…" and "Involved in…" describe a job, not your contribution.', f: 'Start with an action verb — Built, Shipped, Cut, Automated, Fixed — then give the outcome.' } },
  no_dates: {
    vi: { t: 'Thiếu mốc thời gian', w: 'Không có ngày tháng thì máy không tính được số năm kinh nghiệm, và bộ lọc "từ 2 năm trở lên" sẽ bỏ qua bạn.', f: 'Mỗi việc ghi dạng 07/2023 – 10/2025, hoặc 07/2023 – nay. Viết thống nhất một kiểu suốt CV.' },
    en: { t: 'No dates on roles', w: 'Without dates nothing can compute your years of experience, so a "2+ years" filter skips you.', f: 'Use 07/2023 – 10/2025 or 07/2023 – present, in the same format throughout.' } },
  marital_status: {
    vi: { t: 'Có ghi tình trạng hôn nhân', w: 'Thông tin này không giúp bạn được chọn, và chiếm chỗ của nội dung có ích.', f: 'Bỏ đi, lấy chỗ viết thêm một dòng kinh nghiệm.' },
    en: { t: 'Marital status included', w: 'It will not help you get hired and takes space from something that would.', f: 'Remove it and use the line for another achievement.' } },
  id_number: {
    vi: { t: 'Có ghi số CMND/CCCD', w: 'Đây là thông tin định danh cá nhân. CV được gửi qua nhiều người và lưu trên nhiều hệ thống, không nên để lộ.', f: 'Bỏ khỏi CV. Chỉ cung cấp khi ký hợp đồng.' },
    en: { t: 'National ID number included', w: 'CVs get forwarded and stored widely; this is sensitive identity data.', f: 'Remove it. Provide it only when signing a contract.' } },
  references_line: {
    vi: { t: 'Có dòng "người tham chiếu khi cần"', w: 'Ai cũng viết câu này nên nó không nói lên điều gì, lại tốn một dòng.', f: 'Bỏ đi. Nhà tuyển dụng sẽ hỏi khi cần.' },
    en: { t: '"References available on request"', w: 'Everyone writes it, so it says nothing and costs a line.', f: 'Delete it. They will ask if they want them.' } },
  broken_glyphs: {
    vi: { t: 'Chữ bị vỡ khi bóc ra', w: 'Dấu tiếng Việt bị hỏng khi máy đọc file, nên từ khoá của bạn không khớp được với tin tuyển dụng.', f: 'Xuất lại PDF bằng "Lưu thành PDF" trong Word thay vì máy in ảo, và dùng font phổ thông như Arial, Times New Roman, Calibri.' },
    en: { t: 'Broken characters on extraction', w: 'Accents break during parsing, so your keywords no longer match the posting.', f: 'Re-export with Save as PDF rather than a virtual printer, and use a common font.' } },
};

// ── Giải thích lỗi tin tuyển dụng ───────────────────────────
export const JD_ISSUES = {
  jd_bias: {
    vi: { t: 'Có điều kiện mang tính phân biệt đối xử', w: 'Bộ luật Lao động 2019 Điều 8 cấm phân biệt đối xử trong tuyển dụng. Giới hạn giới tính, tuổi, ngoại hình hay hộ khẩu cũng cắt mất một phần lớn ứng viên giỏi và làm xấu hình ảnh công ty.', f: 'Thay điều kiện về con người bằng điều kiện về công việc. Thay vì "Nam 18–27", hãy viết đúng thứ công việc đòi hỏi, ví dụ "bê được thiết bị khoảng 20 kg" hoặc "làm được ca tối".' },
    en: { t: 'Discriminatory requirements', w: 'Vietnam’s Labour Code 2019 article 8 prohibits discrimination in hiring. Gender, age, appearance or residency limits also cut out strong applicants and damage your employer brand.', f: 'Replace requirements about the person with requirements about the work — "able to lift ~20 kg" or "available for evening shifts" rather than an age or gender range.' } },
  jd_no_salary: {
    vi: { t: 'Không ghi mức lương', w: 'Tin có ghi lương nhận được nhiều hồ sơ hơn hẳn. "Lương thoả thuận" khiến ứng viên giỏi bỏ qua vì họ không muốn mất thời gian hỏi.', f: 'Ghi một khoảng cụ thể, ví dụ 12–18 triệu, và nói rõ gross hay net.' },
    en: { t: 'No salary stated', w: 'Posts with a salary range get far more applicants. "Negotiable" makes strong candidates scroll past.', f: 'Give a real range and say whether it is gross or net.' } },
  jd_too_short: {
    vi: { t: 'Tin quá ngắn', w: 'Ứng viên không hình dung được công việc hằng ngày nên không biết mình có hợp không, và người hợp nhất thường là người không nộp.', f: 'Viết thêm phần mô tả một ngày làm việc điển hình và 3–5 đầu việc chính.' },
    en: { t: 'Post is very short', w: 'Applicants cannot picture the job, so the best-fitting people often do not apply.', f: 'Describe a typical day and list three to five core duties.' } },
  jd_no_requirements: {
    vi: { t: 'Không có mục yêu cầu rõ ràng', w: 'Không nêu yêu cầu thì bạn nhận rất nhiều hồ sơ không phù hợp, mất thời gian sàng lọc.', f: 'Thêm mục YÊU CẦU, tách riêng phần bắt buộc và phần ưu tiên.' },
    en: { t: 'No clear requirements section', w: 'Without them you get a flood of unsuitable applications to sift.', f: 'Add a REQUIREMENTS section, separating must-have from nice-to-have.' } },
  jd_vague_duties: {
    vi: { t: 'Mô tả công việc còn chung chung', w: 'Ứng viên giỏi chọn việc theo nội dung công việc. Mô tả mơ hồ khiến họ nghi ngờ công ty cũng chưa rõ cần tuyển ai.', f: 'Liệt kê ít nhất 3 đầu việc cụ thể, kèm công cụ hoặc hệ thống sẽ dùng.' },
    en: { t: 'Duties are vague', w: 'Strong candidates choose by the work itself; vagueness suggests you have not defined the role.', f: 'List at least three concrete duties and the tools involved.' } },
  jd_few_skills: {
    vi: { t: 'Nêu quá ít kỹ năng cụ thể', w: 'Không có từ khoá cụ thể thì chính bạn cũng khó so sánh các hồ sơ với nhau.', f: 'Nêu rõ công cụ, phần mềm hoặc nghiệp vụ cần dùng.' },
    en: { t: 'Too few concrete skills', w: 'Without specifics you will struggle to compare applicants fairly.', f: 'Name the tools, software or domain knowledge required.' } },
  jd_too_many_skills: {
    vi: { t: 'Đòi quá nhiều kỹ năng', w: 'Danh sách dài khiến ứng viên khá nhưng chưa đủ hết tự loại mình, dù họ vẫn làm tốt việc.', f: 'Tách thành bắt buộc (tối đa 5) và ưu tiên. Hỏi thật: thiếu cái này thì có làm được việc không?' },
    en: { t: 'Too many required skills', w: 'Long lists make good-enough candidates self-reject even when they could do the job.', f: 'Split into must-have (five at most) and nice-to-have.' } },
  jd_contradiction: {
    vi: { t: 'Tin tự mâu thuẫn', w: 'Vừa ghi fresher hoặc thực tập, vừa đòi nhiều năm kinh nghiệm. Ứng viên sẽ không biết tin nào đúng và thường bỏ qua.', f: 'Chốt một mức: hoặc nhận người mới và đào tạo, hoặc tuyển người có kinh nghiệm và trả lương tương xứng.' },
    en: { t: 'The post contradicts itself', w: 'It says fresher or intern but demands several years. Applicants cannot tell which is real and move on.', f: 'Pick one: hire and train, or hire experience and pay for it.' } },
  jd_high_experience: {
    vi: { t: 'Yêu cầu nhiều năm kinh nghiệm', w: 'Không sai, nhưng mỗi năm kinh nghiệm thêm vào sẽ thu hẹp đáng kể số người nộp.', f: 'Cân nhắc hạ một bậc và nêu rõ sẽ đào tạo phần còn thiếu.' },
    en: { t: 'High experience bar', w: 'Not wrong, but each extra year shrinks your applicant pool sharply.', f: 'Consider lowering it a notch and saying you will train the gap.' } },
  jd_no_location: {
    vi: { t: 'Không ghi nơi làm việc', w: 'Địa điểm là thứ ứng viên xem gần như đầu tiên. Thiếu nó, nhiều người bỏ qua tin.', f: 'Ghi địa chỉ hoặc quận/huyện, và nói rõ có làm từ xa được không.' },
    en: { t: 'No work location', w: 'Location is among the first things applicants check; without it many skip the post.', f: 'Give the address or district, and say whether remote is possible.' } },
  jd_no_hours: {
    vi: { t: 'Không ghi thời gian làm việc', w: 'Làm ca, làm cuối tuần hay làm giờ hành chính là yếu tố quyết định với nhiều người.', f: 'Ghi số ngày mỗi tuần, số giờ mỗi ngày, có xoay ca hay không.' },
    en: { t: 'No working hours', w: 'Shifts, weekends or office hours are decisive for many applicants.', f: 'State days per week, hours per day, and whether shifts rotate.' } },
  jd_no_contact: {
    vi: { t: 'Không có cách nộp hồ sơ', w: 'Ứng viên muốn nộp mà không biết gửi đi đâu.', f: 'Ghi email nhận hồ sơ hoặc link ứng tuyển, kèm hạn nộp nếu có.' },
    en: { t: 'No way to apply', w: 'Interested people have nowhere to send anything.', f: 'Give an application email or link, and a deadline if there is one.' } },
};

// ── Hàm tra chuỗi ───────────────────────────────────────────
export function makeT(getLang) {
  return (key, vars) => {
    const row = UI[key];
    let s = row ? (row[getLang()] ?? row.vi) : key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
  };
}

export const issueText = (id, lang, table = ISSUES) =>
  (table[id] || {})[lang] || (table[id] || {}).vi || { t: id, w: '', f: '' };

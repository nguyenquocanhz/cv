/**
 * Từ điển kỹ năng và từ khoá dùng chung cho bộ máy chấm điểm.
 * Mọi alias viết thường, KHÔNG dấu — engine.js so khớp sau khi bỏ dấu tiếng Việt.
 *
 * group: dùng để nhóm kết quả và để biết JD thuộc ngành nào.
 * Thêm kỹ năng mới: chỉ cần thêm một dòng vào SKILLS, không phải sửa chỗ nào khác.
 */

/** @typedef {{k:string, vi:string, en:string, g:string, a:string[]}} Skill */

const S = (k, vi, en, g, a) => ({ k, vi, en, g, a: a || [] });

export const GROUPS = {
  lang:     { vi: 'Ngôn ngữ lập trình', en: 'Programming languages' },
  frontend: { vi: 'Frontend',           en: 'Frontend' },
  backend:  { vi: 'Backend',            en: 'Backend' },
  mobile:   { vi: 'Di động',            en: 'Mobile' },
  data:     { vi: 'Dữ liệu & CSDL',     en: 'Data & databases' },
  devops:   { vi: 'DevOps & hạ tầng',   en: 'DevOps & infrastructure' },
  itsupport:{ vi: 'Hạ tầng & hỗ trợ IT',en: 'IT support & hardware' },
  qa:       { vi: 'Kiểm thử',           en: 'QA & testing' },
  security: { vi: 'An toàn thông tin',  en: 'Security' },
  design:   { vi: 'Thiết kế',           en: 'Design' },
  pm:       { vi: 'Quản lý & phân tích',en: 'PM & analysis' },
  office:   { vi: 'Tin học văn phòng',  en: 'Office software' },
  finance:  { vi: 'Kế toán & tài chính',en: 'Accounting & finance' },
  marketing:{ vi: 'Marketing',          en: 'Marketing' },
  sales:    { vi: 'Kinh doanh',         en: 'Sales' },
  hr:       { vi: 'Nhân sự',            en: 'Human resources' },
  logistics:{ vi: 'Logistics & XNK',    en: 'Logistics & trade' },
  human:    { vi: 'Ngoại ngữ',          en: 'Languages' },
  soft:     { vi: 'Kỹ năng mềm',        en: 'Soft skills' },
  other:    { vi: 'Khác',               en: 'Other' },
};

export const SKILLS = [
  // ── Ngôn ngữ lập trình ────────────────────────────────────
  S('javascript', 'JavaScript', 'JavaScript', 'lang', ['javascript', 'js', 'es6', 'ecmascript']),
  S('typescript', 'TypeScript', 'TypeScript', 'lang', ['typescript', 'ts']),
  S('python', 'Python', 'Python', 'lang', ['python', 'py']),
  S('java', 'Java', 'Java', 'lang', ['java', 'jdk', 'j2ee', 'jakarta ee']),
  S('csharp', 'C#', 'C#', 'lang', ['c#', 'csharp', 'c sharp']),
  S('php', 'PHP', 'PHP', 'lang', ['php']),
  S('cpp', 'C++', 'C++', 'lang', ['c++', 'cpp']),
  S('clang', 'C', 'C', 'lang', ['ngon ngu c']),
  S('golang', 'Go', 'Go', 'lang', ['golang', 'ngon ngu go']),
  S('rust', 'Rust', 'Rust', 'lang', ['rust']),
  S('ruby', 'Ruby', 'Ruby', 'lang', ['ruby', 'ruby on rails']),
  S('kotlin', 'Kotlin', 'Kotlin', 'lang', ['kotlin']),
  S('swift', 'Swift', 'Swift', 'lang', ['swift', 'swiftui']),
  S('dart', 'Dart', 'Dart', 'lang', ['dart']),
  S('scala', 'Scala', 'Scala', 'lang', ['scala']),
  S('rlang', 'R', 'R', 'lang', ['ngon ngu r']),
  S('matlab', 'MATLAB', 'MATLAB', 'lang', ['matlab']),
  S('bash', 'Bash / Shell', 'Bash / Shell', 'lang', ['bash', 'shell script', 'shell scripting']),
  S('powershell', 'PowerShell', 'PowerShell', 'lang', ['powershell']),
  S('vba', 'VBA', 'VBA', 'lang', ['vba', 'macro excel']),

  // ── Frontend ──────────────────────────────────────────────
  S('react', 'React', 'React', 'frontend', ['react', 'reactjs', 'react.js']),
  S('nextjs', 'Next.js', 'Next.js', 'frontend', ['next.js', 'nextjs']),
  S('vue', 'Vue.js', 'Vue.js', 'frontend', ['vue', 'vuejs', 'vue.js', 'nuxt']),
  S('angular', 'Angular', 'Angular', 'frontend', ['angular', 'angularjs']),
  S('svelte', 'Svelte', 'Svelte', 'frontend', ['svelte', 'sveltekit']),
  S('html', 'HTML', 'HTML', 'frontend', ['html', 'html5']),
  S('css', 'CSS', 'CSS', 'frontend', ['css', 'css3', 'sass', 'scss', 'less']),
  S('tailwind', 'Tailwind CSS', 'Tailwind CSS', 'frontend', ['tailwind', 'tailwindcss']),
  S('bootstrap', 'Bootstrap', 'Bootstrap', 'frontend', ['bootstrap']),
  S('jquery', 'jQuery', 'jQuery', 'frontend', ['jquery']),
  S('responsive', 'Responsive UI', 'Responsive UI', 'frontend', ['responsive', 'mobile first']),

  // ── Backend ───────────────────────────────────────────────
  S('nodejs', 'Node.js', 'Node.js', 'backend', ['node', 'node.js', 'nodejs', 'express', 'expressjs', 'nestjs']),
  S('spring', 'Spring Boot', 'Spring Boot', 'backend', ['spring', 'spring boot', 'springboot', 'spring mvc']),
  S('django', 'Django', 'Django', 'backend', ['django']),
  S('flask', 'Flask / FastAPI', 'Flask / FastAPI', 'backend', ['flask', 'fastapi']),
  S('laravel', 'Laravel', 'Laravel', 'backend', ['laravel']),
  S('dotnet', '.NET', '.NET', 'backend', ['.net', 'dotnet', 'asp.net', 'aspnet', '.net core', 'entity framework']),
  S('rest', 'REST API', 'REST API', 'backend', ['rest', 'restful', 'rest api', 'api', 'openapi', 'swagger']),
  S('graphql', 'GraphQL', 'GraphQL', 'backend', ['graphql']),
  S('microservice', 'Microservices', 'Microservices', 'backend', ['microservice', 'micro service', 'microservices']),
  S('mq', 'Message queue', 'Message queue', 'backend', ['kafka', 'rabbitmq', 'message queue', 'activemq']),
  S('oop', 'OOP / SOLID', 'OOP / SOLID', 'backend', ['oop', 'solid principles', 'nguyen ly solid', 'huong doi tuong', 'design pattern', 'design patterns']),

  // ── Di động ───────────────────────────────────────────────
  S('android', 'Android', 'Android', 'mobile', ['android', 'android studio']),
  S('ios', 'iOS', 'iOS', 'mobile', ['ios', 'xcode', 'objective-c']),
  S('flutter', 'Flutter', 'Flutter', 'mobile', ['flutter']),
  S('reactnative', 'React Native', 'React Native', 'mobile', ['react native', 'react-native', 'expo']),

  // ── Dữ liệu & CSDL ────────────────────────────────────────
  S('sql', 'SQL', 'SQL', 'data', ['sql', 'co so du lieu', 'database', 'truy van']),
  S('mysql', 'MySQL', 'MySQL', 'data', ['mysql', 'mariadb']),
  S('postgres', 'PostgreSQL', 'PostgreSQL', 'data', ['postgres', 'postgresql']),
  S('sqlserver', 'SQL Server', 'SQL Server', 'data', ['sql server', 'mssql', 't-sql']),
  S('oracle', 'Oracle', 'Oracle', 'data', ['oracle', 'pl/sql']),
  S('mongodb', 'MongoDB', 'MongoDB', 'data', ['mongodb', 'mongo', 'nosql']),
  S('redis', 'Redis', 'Redis', 'data', ['redis', 'memcached', 'caching']),
  S('elastic', 'Elasticsearch', 'Elasticsearch', 'data', ['elasticsearch', 'elastic', 'opensearch']),
  S('etl', 'ETL / Data pipeline', 'ETL / Data pipeline', 'data', ['etl', 'data pipeline', 'airflow', 'dbt', 'data warehouse']),
  S('bigdata', 'Big data', 'Big data', 'data', ['spark', 'hadoop', 'big data']),
  S('bi', 'Power BI / Tableau', 'Power BI / Tableau', 'data', ['power bi', 'powerbi', 'tableau', 'looker', 'data studio']),
  S('ml', 'Machine learning', 'Machine learning', 'data', ['machine learning', 'hoc may', 'tensorflow', 'pytorch', 'scikit-learn', 'deep learning']),
  S('ai', 'AI / LLM', 'AI / LLM', 'data', ['tri tue nhan tao', 'llm', 'chatgpt', 'generative ai', 'nlp']),
  S('datanalysis', 'Phân tích dữ liệu', 'Data analysis', 'data', ['phan tich du lieu', 'data analysis', 'data analyst', 'pandas', 'numpy']),

  // ── DevOps & hạ tầng ──────────────────────────────────────
  S('docker', 'Docker', 'Docker', 'devops', ['docker', 'container', 'docker-compose']),
  S('k8s', 'Kubernetes', 'Kubernetes', 'devops', ['kubernetes', 'k8s', 'helm']),
  S('aws', 'AWS', 'AWS', 'devops', ['aws', 'amazon web services', 'ec2', 's3']),
  S('azure', 'Azure', 'Azure', 'devops', ['azure']),
  S('gcp', 'Google Cloud', 'Google Cloud', 'devops', ['gcp', 'google cloud']),
  S('cloud', 'Điện toán đám mây', 'Cloud', 'devops', ['cloud', 'dam may']),
  S('cicd', 'CI/CD', 'CI/CD', 'devops', ['ci/cd', 'cicd', 'github actions', 'gitlab ci', 'jenkins', 'continuous integration']),
  S('terraform', 'Terraform / IaC', 'Terraform / IaC', 'devops', ['terraform', 'ansible', 'infrastructure as code']),
  S('git', 'Git', 'Git', 'devops', ['git', 'github', 'gitlab', 'bitbucket', 'version control']),
  S('monitoring', 'Giám sát hệ thống', 'Monitoring', 'devops', ['prometheus', 'grafana', 'monitoring', 'giam sat he thong', 'zabbix']),
  S('nginx', 'Nginx / Apache', 'Nginx / Apache', 'devops', ['nginx', 'apache', 'web server', 'iis']),

  // ── Hạ tầng & hỗ trợ IT ───────────────────────────────────
  S('linux', 'Linux', 'Linux', 'itsupport', ['linux', 'ubuntu', 'debian', 'centos', 'redhat']),
  S('windows', 'Windows', 'Windows', 'itsupport', ['windows', 'windows 10', 'windows 11', 'cai win', 'ghost may']),
  S('windowsserver', 'Windows Server', 'Windows Server', 'itsupport', ['windows server', 'active directory', 'group policy']),
  S('hardware', 'Phần cứng máy tính', 'Computer hardware', 'itsupport', ['phan cung', 'hardware', 'laptop', 'desktop', 'lap rap', 'linh kien', 'may in', 'printer']),
  S('network', 'Mạng máy tính', 'Networking', 'itsupport', ['network', 'mạng lan', 'mang may tinh', 'tcp/ip', 'wan', 'dns', 'dhcp', 'vlan', 'router', 'switch', 'firewall', 'vpn']),
  S('helpdesk', 'Helpdesk / hỗ trợ người dùng', 'Helpdesk', 'itsupport', ['helpdesk', 'help desk', 'ho tro ky thuat', 'ho tro nguoi dung', 'technical support', 'it support', 'ticket']),
  S('o365', 'Microsoft 365', 'Microsoft 365', 'itsupport', ['office 365', 'microsoft 365', 'o365', 'exchange']),
  S('troubleshoot', 'Xử lý sự cố', 'Troubleshooting', 'itsupport', ['xu ly su co', 'khac phuc su co', 'troubleshoot', 'troubleshooting', 'chan doan']),
  S('backup', 'Sao lưu & phục hồi', 'Backup & recovery', 'itsupport', ['sao luu', 'phuc hoi du lieu', 'backup', 'restore', 'disaster recovery']),

  // ── Kiểm thử ──────────────────────────────────────────────
  S('testing', 'Kiểm thử phần mềm', 'Software testing', 'qa', ['kiem thu', 'testing', 'tester', 'qa', 'qc', 'test case', 'testcase', 'unit test', 'junit']),
  S('automation', 'Kiểm thử tự động', 'Test automation', 'qa', ['selenium', 'cypress', 'playwright', 'automation test', 'kiem thu tu dong', 'appium']),
  S('apitest', 'Kiểm thử API', 'API testing', 'qa', ['postman', 'jmeter', 'api testing', 'load test', 'performance test']),

  // ── An toàn thông tin ─────────────────────────────────────
  S('security', 'An toàn thông tin', 'Information security', 'security', ['bao mat', 'an toan thong tin', 'security', 'cybersecurity', 'ma doc', 'malware', 'antivirus']),
  S('pentest', 'Kiểm thử xâm nhập', 'Penetration testing', 'security', ['pentest', 'penetration test', 'owasp', 'vulnerability']),
  S('iso27001', 'ISO 27001', 'ISO 27001', 'security', ['iso 27001', 'iso27001', 'siem', 'soc']),

  // ── Thiết kế ──────────────────────────────────────────────
  S('figma', 'Figma', 'Figma', 'design', ['figma', 'sketch', 'adobe xd']),
  S('photoshop', 'Photoshop', 'Photoshop', 'design', ['photoshop', 'adobe photoshop', 'ps']),
  S('illustrator', 'Illustrator', 'Illustrator', 'design', ['illustrator', 'adobe illustrator', 'ai design', 'corel', 'coreldraw']),
  S('video', 'Dựng video', 'Video editing', 'design', ['premiere', 'after effects', 'capcut', 'dung video', 'video editing']),
  S('canva', 'Canva', 'Canva', 'design', ['canva']),
  S('uiux', 'UI/UX', 'UI/UX', 'design', ['ui/ux', 'ui ux', 'user experience', 'wireframe', 'prototype', 'thiet ke giao dien']),

  // ── Quản lý & phân tích ───────────────────────────────────
  S('agile', 'Agile / Scrum', 'Agile / Scrum', 'pm', ['agile', 'scrum', 'kanban', 'sprint']),
  S('jira', 'Jira / Confluence', 'Jira / Confluence', 'pm', ['jira', 'confluence', 'trello', 'asana', 'redmine']),
  S('ba', 'Phân tích nghiệp vụ', 'Business analysis', 'pm', ['business analyst', 'phan tich nghiep vu', 'use case', 'user story', 'srs', 'dac ta']),
  S('uml', 'UML / BPMN / ERD', 'UML / BPMN / ERD', 'pm', ['uml', 'bpmn', 'erd', 'so do thuc the', 'flowchart', 'so do luong']),
  S('pm', 'Quản lý dự án', 'Project management', 'pm', ['quan ly du an', 'project management', 'pmp', 'quan ly tien do']),
  S('leadership', 'Quản lý nhóm', 'Team leadership', 'pm', ['quan ly nhom', 'team lead', 'truong nhom', 'leader', 'quan ly doi nhom']),

  // ── Tin học văn phòng ─────────────────────────────────────
  S('excel', 'Excel', 'Excel', 'office', ['excel', 'bang tinh', 'pivot', 'vlookup', 'google sheet', 'google sheets']),
  S('word', 'Word', 'Word', 'office', ['microsoft word', 'ms word', 'soan thao van ban']),
  S('powerpoint', 'PowerPoint', 'PowerPoint', 'office', ['powerpoint', 'ms powerpoint', 'thuyet trinh slide']),
  S('office', 'Tin học văn phòng', 'Office software', 'office', ['tin hoc van phong', 'microsoft office', 'ms office', 'google workspace']),
  S('erp', 'ERP', 'ERP', 'office', ['erp', 'sap', 'odoo', 'oracle ebs', 'bravo', 'fast accounting']),
  S('crm', 'CRM', 'CRM', 'office', ['crm', 'salesforce', 'hubspot']),
  S('pos', 'Phần mềm bán hàng (POS)', 'POS software', 'office', ['pos', 'kiotviet', 'sapo', 'phan mem ban hang', 'may pos']),

  // ── Kế toán & tài chính ───────────────────────────────────
  S('accounting', 'Kế toán', 'Accounting', 'finance', ['ke toan', 'accounting', 'accountant', 'so sach', 'hach toan']),
  S('tax', 'Thuế', 'Tax', 'finance', ['thuế', 'tax', 'thuế gtgt', 'gtgt', 'tncn', 'tndn', 'quyet toan thue']),
  S('audit', 'Kiểm toán', 'Audit', 'finance', ['kiem toan', 'audit', 'internal audit']),
  S('finance', 'Tài chính', 'Finance', 'finance', ['tai chinh', 'finance', 'financial', 'dong tien', 'ngan sach', 'budget']),
  S('misa', 'MISA', 'MISA', 'finance', ['misa', 'amis']),
  S('acca', 'ACCA / CPA / CFA', 'ACCA / CPA / CFA', 'finance', ['acca', 'cpa', 'cfa', 'cma', 'chung chi hanh nghe ke toan']),
  S('ifrs', 'IFRS / VAS', 'IFRS / VAS', 'finance', ['ifrs', 'vas', 'chuan muc ke toan']),

  // ── Marketing ─────────────────────────────────────────────
  S('seo', 'SEO', 'SEO', 'marketing', ['seo', 'sem', 'toi uu cong cu tim kiem']),
  S('ads', 'Quảng cáo số', 'Digital ads', 'marketing', ['google ads', 'facebook ads', 'tiktok ads', 'quang cao', 'adwords', 'performance marketing']),
  S('content', 'Content marketing', 'Content marketing', 'marketing', ['content marketing', 'copywriting', 'viet bai', 'sang tao noi dung']),
  S('socialmedia', 'Mạng xã hội', 'Social media', 'marketing', ['social media', 'mang xa hoi', 'fanpage', 'tiktok', 'instagram', 'kol', 'kocs']),
  S('analytics', 'Google Analytics', 'Google Analytics', 'marketing', ['google analytics', 'ga4', 'google tag manager', 'gtm']),
  S('brand', 'Thương hiệu', 'Branding', 'marketing', ['thuong hieu', 'branding', 'brand']),
  S('email', 'Email marketing', 'Email marketing', 'marketing', ['email marketing', 'mailchimp', 'crm marketing']),

  // ── Kinh doanh ────────────────────────────────────────────
  S('sales', 'Bán hàng', 'Sales', 'sales', ['ban hang', 'sales', 'kinh doanh', 'doanh so', 'chi tieu doanh so']),
  S('b2b', 'B2B / B2C', 'B2B / B2C', 'sales', ['b2b', 'b2c', 'khach hang doanh nghiep']),
  S('negotiation', 'Đàm phán', 'Negotiation', 'sales', ['dam phan', 'negotiation', 'thuong luong', 'chot don']),
  S('customerservice', 'Chăm sóc khách hàng', 'Customer service', 'sales', ['cham soc khach hang', 'customer service', 'tu van khach hang', 'ho tro khach hang', 'telesales']),
  S('retail', 'Bán lẻ', 'Retail', 'sales', ['ban le', 'retail', 'cua hang', 'showroom', 'sieu thi']),

  // ── Nhân sự ───────────────────────────────────────────────
  S('recruitment', 'Tuyển dụng', 'Recruitment', 'hr', ['tuyen dung', 'recruitment', 'recruiter', 'talent acquisition', 'head hunt', 'headhunt']),
  S('cb', 'C&B / Tiền lương', 'C&B / Payroll', 'hr', ['c&b', 'tien luong', 'payroll', 'bhxh', 'bao hiem xa hoi', 'cham cong']),
  S('laborlaw', 'Luật lao động', 'Labour law', 'hr', ['luat lao dong', 'labour law', 'labor law', 'hop dong lao dong', 'noi quy lao dong']),
  S('training', 'Đào tạo', 'Training', 'hr', ['dao tao', 'training', 'onboarding', 'l&d']),
  S('hrm', 'Quản trị nhân sự', 'HR management', 'hr', ['quản trị nhân sự', 'nhân sự', 'human resources', 'hrm', 'kpi nhan su']),

  // ── Logistics & XNK ───────────────────────────────────────
  S('logistics', 'Logistics', 'Logistics', 'logistics', ['logistics', 'van tai', 'giao nhan', 'forwarder', 'chuoi cung ung', 'supply chain']),
  S('warehouse', 'Quản lý kho', 'Warehouse', 'logistics', ['quan ly kho', 'warehouse', 'thu kho', 'ton kho', 'inventory', 'wms']),
  S('importexport', 'Xuất nhập khẩu', 'Import & export', 'logistics', ['xuat nhap khau', 'xnk', 'import', 'export', 'hai quan', 'customs', 'incoterms', 'c/o']),
  S('purchasing', 'Mua hàng', 'Purchasing', 'logistics', ['mua hang', 'purchasing', 'procurement', 'danh muc nha cung cap']),

  // ── Ngoại ngữ ─────────────────────────────────────────────
  S('english', 'Tiếng Anh', 'English', 'human', ['tieng anh', 'english', 'toeic', 'ielts', 'toefl', 'giao tiep tieng anh']),
  S('japanese', 'Tiếng Nhật', 'Japanese', 'human', ['tieng nhat', 'japanese', 'jlpt']),
  S('korean', 'Tiếng Hàn', 'Korean', 'human', ['tieng han', 'korean', 'topik']),
  S('chinese', 'Tiếng Trung', 'Chinese', 'human', ['tieng trung', 'tieng hoa', 'chinese', 'hsk']),

  // ── Kỹ năng mềm ───────────────────────────────────────────
  S('teamwork', 'Làm việc nhóm', 'Teamwork', 'soft', ['lam viec nhom', 'teamwork', 'phoi hop', 'lam viec doc lap']),
  S('communication', 'Giao tiếp', 'Communication', 'soft', ['giao tiep', 'communication', 'ky nang giao tiep', 'thuyet trinh', 'presentation']),
  S('problemsolving', 'Giải quyết vấn đề', 'Problem solving', 'soft', ['giai quyet van de', 'problem solving', 'tu duy logic', 'phan tich van de']),
  S('timemanagement', 'Quản lý thời gian', 'Time management', 'soft', ['quan ly thoi gian', 'time management', 'sap xep cong viec', 'dung han']),
  S('pressure', 'Chịu áp lực', 'Work under pressure', 'soft', ['chiu ap luc', 'chiu duoc ap luc', 'under pressure', 'ap luc cong viec']),
  S('learning', 'Tinh thần học hỏi', 'Willingness to learn', 'soft', ['hoc hoi', 'cau tien', 'ham hoc hoi', 'tu hoc', 'willing to learn']),
  S('careful', 'Cẩn thận, tỉ mỉ', 'Attention to detail', 'soft', ['can than', 'ti mi', 'attention to detail', 'ty mi']),
  S('proactive', 'Chủ động', 'Proactive', 'soft', ['chu dong', 'proactive', 'tu giac', 'trach nhiem']),
];

/** Tra ngược alias → skill, alias dài khớp trước để "react native" không bị "react" nuốt mất. */
export const ALIAS_INDEX = (() => {
  const rows = [];
  for (const s of SKILLS) {
    // KHÔNG lấy s.k làm alias: nhiều khoá là từ thông dụng ('automation', 'content',
    // 'brand') và sẽ khớp nhầm. Mỗi kỹ năng phải tự khai báo alias của mình.
    for (const a of s.a) rows.push({ alias: a, skill: s, acc: /[\u00c0-\u1ef9]/.test(a) });
    // Tên hiển thị chỉ dùng làm alias khi đủ dài: 'C', 'R', 'Go' sẽ khớp vào mọi chỗ.
    const en = s.en.toLowerCase();
    if (en.length >= 3) rows.push({ alias: en, skill: s, acc: /[\u00c0-\u1ef9]/.test(en) });
  }
  const seen = new Set();
  return rows
    .filter((r) => r.alias && !seen.has(r.alias + '|' + r.skill.k) && seen.add(r.alias + '|' + r.skill.k))
    .sort((a, b) => b.alias.length - a.alias.length);
})();

/** Từ dừng: bỏ khi rút từ khoá tự do khỏi JD (đã bỏ dấu). */
export const STOPWORDS = new Set(`
va hoac cua cho den tu trong ngoai tren duoi voi theo khi la co khong duoc se da dang cac nhung mot nhieu
nguoi viec lam cong ty chung toi ban ung vien yeu cau uu tien quyen loi mo ta cong viec nhiem vu trach nhiem
thoi gian dia diem luong thuong che do phuc loi lien he email dien thoai ho so nop gui ngay thang nam
toi thieu tro len tuong duong lien quan khac vi du bao gom nhu sau day tren day cung nhu
the nao nao do rat hon nua them vao ngoai ra dong thoi tuy nhiên neu thi ma nen can phai
and or the for with from this that have has was are were will would can could should must
you your our their they them his her its about into over under more most some any all each
job work role team company position candidate requirement requirements responsibility responsibilities
benefit benefits salary experience skill skills ability abilities knowledge plus preferred required
please send apply contact email phone address full time part time
`.trim().split(/\s+/));

/** Nhãn nhóm theo ngôn ngữ. */
export const groupLabel = (g, lang) => (GROUPS[g] || GROUPS.other)[lang] || g;

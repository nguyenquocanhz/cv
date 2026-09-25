# -*- coding: utf-8 -*-
"""
Sinh nhiều phiên bản CV từ một nguồn nội dung chung.

Chạy:  python build_cv.py
Kết quả: <slug>.html + <slug>.pdf cho mỗi biến thể trong VARIANTS.

Sửa nội dung ở phần DỮ LIỆU bên dưới, chạy lại là ra bộ CV mới.
"""
import io, os, subprocess, sys

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# ----------------------------------------------------------------------------
# CSS dùng chung
# ----------------------------------------------------------------------------
CSS = """
@page { size: A4; margin: 9mm 12mm 7mm 12mm; }
*{ box-sizing:border-box; margin:0; padding:0 }
html{ -webkit-print-color-adjust:exact; print-color-adjust:exact }
body{ font-family:"Segoe UI","Calibri",Arial,sans-serif; font-size:9.1pt;
      line-height:1.36; color:#15181A; background:#fff; }
.name{ font-size:20pt; font-weight:600; letter-spacing:-.01em; color:#0F4A4F; line-height:1.05 }
.role{ font-size:8.9pt; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
       color:#3A4A4C; margin-top:4pt }
.contact{ font-size:8.4pt; color:#2B3436; margin-top:4pt; line-height:1.45 }
.rule-top{ border-bottom:1.4pt solid #0F4A4F; margin-top:5pt }
h2{ font-size:8.8pt; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
    color:#0F4A4F; margin:6pt 0 3pt; padding-bottom:2pt; border-bottom:.8pt solid #C3D0D1;
    break-after:avoid }
.summary{ text-align:justify }
.entry{ margin-top:4.5pt; break-inside:avoid }
.entry:first-of-type{ margin-top:2pt }
.entry-head{ display:flex; justify-content:space-between; align-items:baseline; gap:10pt }
.entry-title{ font-size:9.7pt; font-weight:600; color:#15181A }
.entry-org{ font-weight:400; color:#33403F }
.entry-date{ font-size:8.3pt; color:#4E5B5C; white-space:nowrap;
             font-variant-numeric:tabular-nums; font-weight:600 }
.entry-sub{ font-size:8.5pt; color:#4E5B5C; margin-top:1pt }
ul{ margin:2pt 0 0 11pt }
li{ margin-bottom:1.4pt; padding-left:1pt }
li::marker{ color:#7C8B8C }
b,strong{ font-weight:600; color:#0B1112 }
code{ font-family:Consolas,"Courier New",monospace }
.skills{ margin-top:3pt }
.skill-row{ display:flex; gap:8pt; margin-bottom:1.8pt; break-inside:avoid }
.skill-key{ flex:0 0 86pt; font-weight:600; color:#0F4A4F }
.skill-val{ flex:1 }
.fill{ color:#9A5B00; font-weight:600; background:#FFF3DC; padding:0 2pt; border-radius:1.5pt }
"""

# Số liệu thật — sửa ở đây là cả 5 bản CV cùng cập nhật.
USERS  = "200"   # số khách hàng
ORDERS = "50"    # đơn hàng mỗi tháng
UPTIME = "99%"   # uptime hạ tầng

# Giữ lại cho các số liệu bổ sung về sau: FILL.format("N") in ra ô bôi vàng.
FILL = '<span class="fill">[{}]</span>' 

CONTACT = ('0397 215 747 &nbsp;&middot;&nbsp; nguyenquocanh.dev@gmail.com '
           '&nbsp;&middot;&nbsp; {loc}<br>'
           'github.com/nguyenquocanhz &nbsp;&middot;&nbsp; linkedin.com/in/nguyenquocanhz '
           '&nbsp;&middot;&nbsp; nguyenquocanh.io.vn')

# ----------------------------------------------------------------------------
# DỮ LIỆU — sửa ở đây
# ----------------------------------------------------------------------------

EXP_VI = [
    dict(title="Freelance Developer", org="— hệ thống bán hàng &amp; cấp phát dịch vụ tự động",
         date="07/2023 – nay", bullets=[
        f"Xây dựng nền tảng bán hàng full-stack bằng <b>PHP 8, MySQL, Bootstrap, jQuery, REST API</b> cho khách hàng, phục vụ <b>{USERS} khách hàng</b> với <b>{ORDERS} đơn hàng</b> mỗi tháng.",
        "Xây dựng <b>hệ thống cấp phát tự động</b>: tự khởi tạo và bàn giao dịch vụ ngay sau khi thanh toán thành công, loại bỏ hoàn toàn thao tác thủ công.",
        "Tích hợp cổng thanh toán với <b>đối soát giao dịch realtime</b>; xây dựng hệ thống báo cáo doanh thu cho khách hàng.",
        f"Quản lý danh mục gói dịch vụ đa cấu hình trên hạ tầng máy chủ nhiều vùng, uptime <b>{UPTIME}</b>; tự quản trị Linux server.",
    ]),
    dict(title="Technical Support Associate", org="— Công ty Cổ phần Máy tính Z1",
         date="09/2025 – 10/2025", bullets=[
        "Quản trị và tối ưu hiệu năng website công ty; xử lý sự cố phần cứng, phần mềm, giảm thời gian gián đoạn hệ thống; ứng dụng công cụ AI tự động hoá quy trình nội bộ.",
    ]),
]

EXP_EN = [
    dict(title="Freelance Developer", org="— automated commerce &amp; service provisioning platform",
         date="07/2023 – present", bullets=[
        f"Built a full-stack commerce platform for a client using <b>PHP 8, MySQL, Bootstrap, jQuery and REST APIs</b>, serving <b>{USERS} customers</b> and <b>{ORDERS} orders</b> per month.",
        "Designed an <b>automated provisioning pipeline</b> that creates and delivers the purchased service immediately after successful payment, removing manual handling entirely.",
        "Integrated a payment gateway with <b>real-time transaction reconciliation</b>; built revenue reporting for the client.",
        f"Managed a multi-configuration service catalogue across multi-region server infrastructure at <b>{UPTIME}</b> uptime; administered the Linux servers directly.",
    ]),
    dict(title="Technical Support Associate", org="— Z1 Computer JSC",
         date="09/2025 – 10/2025", bullets=[
        "Maintained and optimised the company website; diagnosed hardware and software faults to reduce downtime; applied AI tooling to automate internal workflows.",
    ]),
]

# Bản IT Support: đảo trọng tâm sang vận hành, Z1 được khai triển đầy đủ trở lại.
EXP_ITSUP_VI = [
    dict(title="Freelance Developer &amp; System Administrator",
         org="— hạ tầng máy chủ và hệ thống bán hàng tự động",
         date="07/2023 – nay", bullets=[
        f"Quản trị hạ tầng máy chủ nhiều vùng cho khách hàng, uptime <b>{UPTIME}</b>; trực tiếp xử lý sự cố vận hành và khôi phục dịch vụ.",
        "Quản trị <b>Linux server</b>: cài đặt, cấu hình, bảo mật, triển khai dịch vụ bằng <b>Docker</b> và giám sát liên tục.",
        "Xây dựng <b>hệ thống cấp phát dịch vụ tự động</b>, loại bỏ hoàn toàn thao tác thủ công; tích hợp cổng thanh toán với đối soát giao dịch realtime.",
        f"Phát triển nền tảng bán hàng bằng <b>PHP 8, MySQL</b>, phục vụ <b>{USERS} khách hàng</b> với <b>{ORDERS} đơn hàng</b> mỗi tháng.",
    ]),
    dict(title="Technical Support Associate", org="— Công ty Cổ phần Máy tính Z1",
         date="09/2025 – 10/2025", bullets=[
        "Chẩn đoán và xử lý sự cố <b>phần cứng, phần mềm</b> trên hệ thống máy tính của công ty, giảm thời gian gián đoạn vận hành.",
        "Quản trị và tối ưu hiệu năng website công ty; vận hành hệ thống <b>POS KiotViet</b>.",
        "Ứng dụng công cụ AI tự động hoá quy trình nội bộ; sản xuất nội dung truyền thông và quản lý sản phẩm trên sàn thương mại điện tử.",
    ]),
]

# Bản fresher remote: thêm tín hiệu làm việc từ xa vào chức danh.
EXP_REMOTE_VI = [
    dict(EXP_VI[0], title="Freelance Developer", org="— hệ thống bán hàng &amp; cấp phát dịch vụ tự động (làm việc từ xa)"),
    EXP_VI[1],
]

# Bản chuyển đổi số: kể kinh nghiệm theo góc tiếp nhận yêu cầu và duy trì sau bàn giao.
EXP_CDS_VI = [
    dict(title="Freelance Developer", org="— phát triển phần mềm theo yêu cầu khách hàng",
         date="07/2023 – nay", bullets=[
        f"Tiếp nhận yêu cầu từ khách hàng, chuyển thành đặc tả chức năng rồi trực tiếp phát triển và bàn giao; hệ thống phục vụ <b>{USERS} khách hàng</b> với <b>{ORDERS} đơn hàng</b> mỗi tháng.",
        "<b>Duy trì hệ thống sau bàn giao</b>: tiếp nhận lỗi người dùng báo, phân loại mức độ ưu tiên và xử lý dứt điểm.",
        "Xây dựng <b>hệ thống cấp phát dịch vụ tự động</b>, loại bỏ hoàn toàn thao tác thủ công; tích hợp cổng thanh toán với đối soát giao dịch realtime.",
        f"Quản trị hạ tầng máy chủ nhiều vùng, uptime <b>{UPTIME}</b>; tự xử lý sự cố vận hành và khôi phục dịch vụ.",
    ]),
    dict(title="Technical Support Associate", org="— Công ty Cổ phần Máy tính Z1",
         date="09/2025 – 10/2025", bullets=[
        "Hỗ trợ người dùng nội bộ: chẩn đoán và xử lý sự cố <b>phần cứng, phần mềm, máy in và mạng</b>, giảm thời gian gián đoạn vận hành.",
        "Vận hành hệ thống <b>POS KiotViet</b>; quản trị và tối ưu hiệu năng website công ty.",
        "<b>Ứng dụng công cụ AI tự động hoá quy trình nội bộ</b>; sản xuất nội dung truyền thông và quản lý sản phẩm trên sàn thương mại điện tử.",
    ]),
]

# Bản kỹ thuật máy tính: Z1 là kinh nghiệm sát nhất nên đứng đầu (xếp theo ngày bắt đầu);
# freelance kể theo góc vận hành và hỗ trợ khách hàng, bỏ bớt phần lập trình.
EXP_KT_VI = [
    dict(title="Technical Support Associate", org="— Công ty Cổ phần Máy tính Z1",
         date="09/2025 – 10/2025", bullets=[
        "Hỗ trợ người dùng nội bộ: chẩn đoán và xử lý sự cố <b>phần cứng, phần mềm, máy in và mạng</b> trên hệ thống máy tính của công ty, giảm thời gian gián đoạn vận hành.",
        "Vận hành hệ thống <b>POS KiotViet</b>; quản lý sản phẩm trên sàn thương mại điện tử; quản trị và tối ưu hiệu năng website công ty.",
        "Ứng dụng công cụ AI tự động hoá quy trình nội bộ.",
    ]),
    dict(title="Freelance System Administrator &amp; Developer",
         org="— hạ tầng máy chủ và hệ thống bán hàng tự động",
         date="07/2023 – nay", bullets=[
        f"Quản trị hạ tầng máy chủ nhiều vùng cho khách hàng, uptime <b>{UPTIME}</b>; trực tiếp xử lý sự cố vận hành và khôi phục dịch vụ.",
        "Cài đặt, cấu hình và bảo mật <b>Linux server</b>; quản lý <b>DNS</b>, tên miền, chứng chỉ SSL; <b>sao lưu và phục hồi</b> dữ liệu.",
        f"<b>Hỗ trợ khách hàng sau bàn giao</b>: tiếp nhận lỗi người dùng báo, phân loại mức độ ưu tiên và xử lý dứt điểm; hệ thống phục vụ <b>{USERS} khách hàng</b> với <b>{ORDERS} đơn hàng</b> mỗi tháng.",
    ]),
]

RAPPHIM_FULL_VI = [
    "Backend <b>Spring Boot 4.1 / Java 17 / Maven</b>: REST API phiên bản hoá (<code>/api/v1</code>) làm lớp trung gian, gộp dữ liệu từ hai nguồn bên thứ ba có schema JSON khác nhau về <b>một contract thống nhất</b>.",
    "Tối ưu hiệu năng bằng <b>Caffeine cache</b> giảm số lần gọi API ngoài; <b>Spring Actuator</b> cho health check; <b>Bean Validation</b> kiểm soát đầu vào; có unit test cho tầng web.",
    "Tài liệu <b>OpenAPI 3.1</b> tự sinh bằng springdoc, kèm <b>Swagger UI</b> gọi thử trực tiếp; toàn bộ response chuẩn hoá theo envelope <code>ApiResponse</code> nhất quán.",
    "Frontend <b>Next.js 16, React 19, TypeScript 5, Tailwind CSS 4</b>, phát video <b>HLS</b>. Đóng gói <b>Docker</b> cả hai service, compose tách dev/production, <b>CI GitHub Actions</b>. &nbsp;github.com/nguyenquocanhz/RapPhimWareHouse",
]

RAPPHIM_SHORT_VI = [
    "Thiết kế <b>REST API phiên bản hoá</b> (<code>/api/v1</code>) làm lớp trung gian, gộp dữ liệu từ hai nguồn bên thứ ba có schema khác nhau về <b>một contract thống nhất</b>; response chuẩn hoá theo envelope nhất quán.",
    "Tối ưu bằng <b>cache in-memory</b> giảm số lần gọi API ngoài; validation tại biên; health check; tài liệu <b>OpenAPI 3.1</b> tự sinh kèm Swagger UI.",
    "Đóng gói <b>Docker</b>, docker-compose tách dev/production, <b>CI GitHub Actions</b>. Backend Spring Boot 4.1 / Java 17, frontend Next.js 16 + React 19 + TypeScript. &nbsp;github.com/nguyenquocanhz/RapPhimWareHouse",
]

RAPPHIM_FULL_EN = [
    "Backend on <b>Spring Boot 4.1 / Java 17 / Maven</b>: a versioned REST API (<code>/api/v1</code>) acting as an anti-corruption layer that folds two third-party sources with incompatible JSON schemas into <b>a single stable contract</b>.",
    "Performance via <b>Caffeine cache</b> to cut outbound calls; <b>Spring Actuator</b> health checks; <b>Bean Validation</b> at the boundary; unit tests on the web layer.",
    "<b>OpenAPI 3.1</b> documentation generated from code by springdoc with a live <b>Swagger UI</b>; every response wrapped in a consistent <code>ApiResponse</code> envelope.",
    "Frontend on <b>Next.js 16, React 19, TypeScript 5, Tailwind CSS 4</b> with <b>HLS</b> playback. <b>Docker</b> images for both services, separate dev/production compose files, <b>GitHub Actions CI</b>. &nbsp;github.com/nguyenquocanhz/RapPhimWareHouse",
]

PROJ = {
 'rapphim_full_vi': dict(title="RapPhim WareHouse", org="— API gateway tổng hợp &amp; chuẩn hoá dữ liệu phim",
                         date="09/2026", bullets=RAPPHIM_FULL_VI),
 'rapphim_short_vi': dict(title="RapPhim WareHouse", org="— API gateway tổng hợp &amp; chuẩn hoá dữ liệu",
                          date="09/2026", bullets=RAPPHIM_SHORT_VI),
 'rapphim_en': dict(title="RapPhim WareHouse", org="— multi-source API gateway",
                    date="09/2026", bullets=RAPPHIM_FULL_EN),

 'qrwallet_vi': dict(title="QR Wallet", org="— ứng dụng Android quản lý mã QR ngân hàng",
                     date="07/2025 – 08/2025", bullets=[
    "Viết bằng <b>Java</b>, kiến trúc <b>MVVM</b>; <b>Room Database</b> truy cập offline; <b>CameraX + ZXing</b> quét QR realtime; <b>xác thực sinh trắc học</b> và AndroidX Security mã hoá dữ liệu. Team Leader, nhóm 5 người — github.com/nguyenquocanhz/AppQRWallet",
 ]),
 'qrwallet_en': dict(title="QR Wallet", org="— Android banking QR manager",
                     date="07/2025 – 08/2025", bullets=[
    "Written in <b>Java</b> on an <b>MVVM</b> architecture; <b>Room Database</b> for offline access, <b>CameraX + ZXing</b> for real-time QR scanning, <b>biometric authentication</b> and AndroidX Security encryption. Team lead of 5 — github.com/nguyenquocanhz/AppQRWallet",
 ]),

 'shop_vi': dict(title="ShopMaNguon.com", org="— sàn mua bán source code PHP",
                 date="shopmanguon.com", bullets=[
    "Tự vận hành marketplace source code có kiểm duyệt kỹ thuật: quản lý sản phẩm, xử lý thanh toán và phân phối file tự động.",
 ]),
 'shop_en': dict(title="ShopMaNguon.com", org="— PHP source code marketplace",
                 date="shopmanguon.com", bullets=[
    "Operate a technically curated source-code marketplace: catalogue management, payment handling and automated file delivery.",
 ]),

 'vietcodes_vi': dict(title="VietCodesUI", org="— thư viện UI C# mã nguồn mở",
                      date="6 \u2605 GitHub", bullets=[
    "Thư viện component giao diện viết bằng C# cho cộng đồng developer Việt Nam, đang được sử dụng và đóng góp công khai.",
 ]),
 'vietcodes_en': dict(title="VietCodesUI", org="— open-source C# UI component library",
                      date="6 \u2605 GitHub", bullets=[
    "A C# UI component library for the Vietnamese developer community, publicly used and contributed to.",
 ]),

 'ittools_vi': dict(title="Bộ công cụ vận hành tự viết", org="— mã nguồn mở trên GitHub",
                    date="2025 – 2026", bullets=[
    "<b>pulse</b> — hệ thống giám sát uptime kèm trang trạng thái, viết bằng Node.js không phụ thuộc thư viện ngoài.",
    "<b>DomainGateway</b> — theo dõi ngày hết hạn của toàn bộ tên miền trải trên nhiều nhà cung cấp (Python).",
    "<b>sshvault</b> — kho lưu khoá SSH và thông tin máy chủ, mã hoá <b>AES-256-GCM</b> khi lưu trữ.",
    "<b>TJprojMain_Remove</b> — script PowerShell dọn mã độc đào coin trên máy trạm Windows.",
 ]),

 'rapphim_mini_vi': dict(title="RapPhim WareHouse", org="— API gateway tổng hợp dữ liệu",
                         date="09/2026", bullets=[
    "Dịch vụ <b>Spring Boot / Java 17</b> kèm giao diện <b>Next.js</b>, đóng gói <b>Docker</b>, CI GitHub Actions, có health check và tài liệu OpenAPI. &nbsp;github.com/nguyenquocanhz/RapPhimWareHouse",
 ]),

 'rapphim_fe_vi': dict(title="RapPhim WareHouse", org="— ứng dụng web tổng hợp dữ liệu, frontend + backend",
                       date="09/2026", bullets=[
    "Frontend <b>Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4</b>: giao diện responsive, phát video <b>HLS</b> bằng hls.js.",
    "Backend <b>REST API phiên bản hoá</b> làm lớp trung gian, gộp dữ liệu từ hai nguồn bên thứ ba có schema khác nhau về <b>một contract thống nhất</b>; cache in-memory, validation tại biên, tài liệu <b>OpenAPI</b> tự sinh kèm Swagger UI.",
    "Đóng gói <b>Docker</b> cho cả hai service, <b>CI GitHub Actions</b>. &nbsp;github.com/nguyenquocanhz/RapPhimWareHouse",
 ]),

 'pulse_vi': dict(title="pulse", org="— hệ thống giám sát uptime kèm trang trạng thái",
                  date="Node.js", bullets=[
    "Viết bằng <b>Node.js thuần</b>, không phụ thuộc thư viện ngoài: kiểm tra định kỳ, ghi nhận sự cố và render trang trạng thái công khai.",
 ]),

 'rapphim_mobile_vi': dict(title="RapPhim Mobile", org="— hai client di động trên cùng một REST API",
                           date="09/2026", bullets=[
    "<b>Flutter / Dart</b>: tầng <code>ApiClient</code> bóc envelope tại đúng một chỗ và chuẩn hoá mọi lỗi; <b>provider</b> lo phân trang, cuộn vô hạn, debounce 350ms và <code>requestId</code> chống phản hồi về trễ; phát <b>HLS</b> bằng video_player. Unit test tầng HTTP bằng MockClient. &nbsp;github.com/nguyenquocanhz/rapphim_mobile",
    "<b>React Native 0.86 / Expo SDK 57 / TypeScript</b>: điều hướng <b>expo-router</b> theo cấu trúc file với 5 tab cùng các màn chi tiết, tìm kiếm và xem phim; màn Cài đặt cho đổi địa chỉ backend ngay trong app, lưu bằng AsyncStorage.",
    "Bản release Android bổ sung quyền INTERNET và network-security-config chỉ mở HTTP thô cho LAN nội bộ; CI <b>GitHub Actions</b> dựng .ipa cho iOS trên macOS runner.",
 ]),

 'rapphim_mobile_en': dict(title="RapPhim Mobile", org="— two mobile clients on one REST API",
                           date="09/2026", bullets=[
    "<b>Flutter / Dart</b>: an <code>ApiClient</code> layer unwrapping the response envelope in exactly one place and normalising every failure; <b>provider</b> drives pagination, infinite scroll, a 350ms debounce and a monotonic <code>requestId</code> that discards late responses; <b>HLS</b> playback, HTTP layer unit-tested with MockClient. &nbsp;github.com/nguyenquocanhz/rapphim_mobile",
    "<b>React Native 0.86 / Expo SDK 57 / TypeScript</b>: <b>expo-router</b> file-based navigation across five tabs plus detail, search and watch screens; an in-app settings screen changes the backend address at runtime, persisted with AsyncStorage. <b>GitHub Actions</b> CI builds the iOS .ipa on a macOS runner.",
 ]),

 'heluong_vi': dict(title="Hệ thống thương mại điện tử tự xây", org="— từ đặc tả tới vận hành",
                    date="2023 – nay", bullets=[
    "Tự làm trọn vòng đời một hệ thống bán hàng: khảo sát yêu cầu, thiết kế cơ sở dữ liệu, lập trình, triển khai lên máy chủ và duy trì — nên nắm được cách một nhóm phần mềm ước lượng công việc và điều gì thực sự tốn thời gian.",
    "Thiết kế <b>REST API có tài liệu OpenAPI tự sinh</b> cho một hệ thống khác, đủ để đọc và đánh giá tài liệu kỹ thuật do đơn vị phát triển bàn giao.",
 ]),

 'ittools_py_vi': dict(title="Bộ công cụ vận hành tự viết", org="— Python và PowerShell, mã nguồn mở",
                       date="2025 – 2026", bullets=[
    "<b>DomainGateway</b> (Python) — theo dõi ngày hết hạn của toàn bộ tên miền trải trên nhiều nhà cung cấp.",
    "<b>sshvault</b> (Python) — kho lưu khoá SSH và thông tin máy chủ, mã hoá <b>AES-256-GCM</b> khi lưu trữ.",
    "<b>TJprojMain_Remove</b> (PowerShell) — dọn mã độc đào coin trên máy trạm Windows.",
 ]),

 'rapphim_contract_vi': dict(title="RapPhim WareHouse", org="— thiết kế API contract cho hệ thống nhiều client",
                             date="09/2026", bullets=[
    "Phân tích yêu cầu rồi <b>thiết kế API contract</b> trước khi code: đặt tên và phiên bản hoá endpoint (<code>/api/v1</code>), thống nhất envelope phản hồi, chuẩn hoá mã lỗi — sau đó ba client (web, Android, iOS) đều tiêu thụ đúng contract đó mà không phải sửa backend.",
    "Thiết kế <b>sơ đồ thực thể</b> cho domain phim, gộp dữ liệu từ hai nguồn bên thứ ba có schema JSON khác nhau về một mô hình duy nhất; <b>validation tại biên</b> bằng Bean Validation, lỗi trả về theo cấu trúc cố định.",
    "Tài liệu <b>OpenAPI 3.1 tự sinh từ code</b> nên không bao giờ lệch với hiện thực; Swagger UI gọi thử trực tiếp. Backend Spring Boot 4.1 / Java 17, đóng gói <b>Docker</b>, CI <b>GitHub Actions</b>.",
    "github.com/nguyenquocanhz/RapPhimWareHouse &nbsp;·&nbsp; client TypeScript: github.com/nguyenquocanhz/rapphim_mobile",
 ]),

 'store_vi': dict(title="Store Management System", org="— phần mềm quản lý cửa hàng C# / SQL Server",
                  date="07/2024 – 08/2024", bullets=[
    "Ứng dụng desktop <b>C# / SQL Server</b> theo kiến trúc <b>3 lớp</b>; tự thiết kế database schema, phân chia công việc và review code cho nhóm 5 người.",
 ]),

 'ittools_kt_vi': dict(title="Bộ công cụ kỹ thuật tự viết", org="— PowerShell, Python, Node.js, mã nguồn mở",
                       date="2025 – 2026", bullets=[
    "<b>TJprojMain_Remove</b> (PowerShell) — script dọn mã độc đào coin trên máy trạm Windows.",
    "<b>pulse</b> (Node.js) — giám sát uptime dịch vụ: kiểm tra định kỳ, ghi nhận sự cố và hiển thị trang trạng thái.",
    "<b>sshvault</b> (Python) — kho lưu khoá SSH và thông tin máy chủ, mã hoá <b>AES-256-GCM</b> khi lưu trữ.",
    "<b>DomainGateway</b> (Python) — theo dõi ngày hết hạn của toàn bộ tên miền trải trên nhiều nhà cung cấp.",
 ]),
}

EDU_VI = dict(title="Cao đẳng Kinh tế – Kỹ thuật TP.HCM (HOTEC)", org="— Công nghệ thông tin (Ứng dụng phần mềm)",
              date="08/2023 – 03/2026",
              sub="Hệ <b>chính quy</b> &nbsp;&middot;&nbsp; GPA <b>3.65 / 4.0</b> &nbsp;&middot;&nbsp; Xếp loại tốt nghiệp <b>Xuất sắc</b> &nbsp;&middot;&nbsp; TOEIC 575 (07/2024) — đọc hiểu tài liệu kỹ thuật tiếng Anh")
EDU_EN = dict(title="HCMC College of Economics and Technology (HOTEC)",
              org="— IT (Software Applications)", date="08/2023 – 03/2026",
              sub="<b>Full-time</b> &nbsp;&middot;&nbsp; GPA <b>3.65 / 4.0</b> &nbsp;&middot;&nbsp; graduated with <b>Excellent</b> classification &nbsp;&middot;&nbsp; TOEIC 575 (07/2024)")

L_VI = dict(summary="Tóm tắt", exp="Kinh nghiệm", proj="Dự án tiêu biểu",
            skills="Kỹ năng", edu="Học vấn &amp; chứng chỉ", loc="Bình Tân, TP. Hồ Chí Minh")
L_EN = dict(summary="Summary", exp="Experience", proj="Selected projects",
            skills="Skills", edu="Education &amp; certification", loc="Binh Tan, Ho Chi Minh City")

VARIANTS = {
 # ---------------------------------------------------------------- Java (VI)
 "CV-NguyenQuocAnh-Java-Backend": dict(
   lang=L_VI, exp=EXP_VI, edu=EDU_VI,
   role="Junior Backend Developer &middot; Java / Spring Boot / REST API",
   summary=("Tôi tốt nghiệp ngành Công nghệ thông tin và đã có 3 năm xây dựng, vận hành sản phẩm web chạy thật. Gần đây tôi "
            "thiết kế một REST API 32 endpoint bằng <b>Java 17</b> và <b>Spring Boot</b> — caching, validation, tài liệu "
            "OpenAPI tự sinh — rồi tự viết client web và di động trên cùng contract đó, nên nắm được hệ thống từ schema tới "
            "giao diện. Tôi mong được làm backend trong một đội có code review và mentoring, nơi tôi đóng góp được phần API "
            "và cơ sở dữ liệu."),
   projects=['rapphim_full_vi','rapphim_mobile_vi','qrwallet_vi'],
   skills=[
     ("Ngôn ngữ", "Java 17, C#, Dart, PHP 7/8, TypeScript / JavaScript, Python"),
     ("Backend", "Spring Boot, Spring MVC, Bean Validation, Spring Actuator, RESTful API, OpenAPI / Swagger, .NET &amp; ASP.NET Core, Node.js"),
     ("Cơ sở dữ liệu", "MySQL 8, SQL Server — thiết kế schema chuẩn hoá (ERD), stored procedure, indexing, tối ưu truy vấn"),
     ("Frontend", "Next.js, React, Vue.js, TypeScript, Tailwind CSS, Bootstrap 5, HTML5 / CSS3"),
     ("Mobile", "Flutter (Dart), React Native / Expo, Android (Java, Kotlin) — provider, MVVM, Room"),
     ("DevOps", "Docker &amp; docker-compose, Linux server, Maven, Git / GitHub, GitHub Actions CI/CD"),
     ("Nguyên lý", "OOP, SOLID, design patterns, kiến trúc phân tầng, MVVM, caching, Agile / Scrum"),
   ]),

 # ---------------------------------------------------------------- .NET (VI)
 "CV-NguyenQuocAnh-NET-Backend": dict(
   lang=L_VI, exp=EXP_VI, edu=EDU_VI,
   role="Junior Backend Developer &middot; C# / .NET / SQL Server",
   summary=("Tôi tốt nghiệp ngành Công nghệ thông tin và đã có 3 năm xây dựng, vận hành sản phẩm web chạy thật. Tôi làm "
            "<b>C#</b> qua thư viện UI mã nguồn mở và hệ thống quản lý 3 lớp trên <b>SQL Server</b>, thiết kế REST API có "
            "caching và tài liệu OpenAPI, đồng thời đã tích hợp cổng thanh toán kèm đối soát giao dịch realtime cho hệ thống "
            "bán hàng của khách. Tôi mong được làm backend .NET ở nơi tôi đóng góp được phần thiết kế cơ sở dữ liệu và tối ưu "
            "truy vấn."),
   projects=['rapphim_short_vi','vietcodes_vi','store_vi','qrwallet_vi'],
   skills=[
     ("Ngôn ngữ", "C#, Java 17, Dart, PHP 7/8, TypeScript / JavaScript, Python"),
     ("Backend", ".NET, ASP.NET Core Web API, Entity Framework Core, RESTful API, OpenAPI / Swagger, Spring Boot, Node.js"),
     ("Cơ sở dữ liệu", "SQL Server, MySQL 8 — thiết kế schema chuẩn hoá (ERD), stored procedure, indexing, tối ưu truy vấn"),
     ("Frontend", "Next.js, React, Vue.js, TypeScript, Bootstrap 5, Tailwind CSS, HTML5 / CSS3"),
     ("Mobile", "Flutter (Dart), React Native / Expo, Android (Java, Kotlin) — MVVM, Room, CameraX"),
     ("DevOps", "Docker &amp; docker-compose, Linux server, Git / GitHub / GitLab, GitHub Actions CI/CD, VPS deployment"),
     ("Nguyên lý", "OOP, SOLID, design patterns, kiến trúc 3 lớp, MVVM, caching, Agile / Scrum"),
   ]),

 # ----------------------------------------------------------- Fullstack (VI)
 "CV-NguyenQuocAnh-Fullstack": dict(
   lang=L_VI, exp=EXP_VI, edu=EDU_VI,
   role="Junior Fullstack Developer &middot; Next.js / React &middot; Java / PHP",
   summary=("Tôi tốt nghiệp ngành Công nghệ thông tin và đã có 3 năm làm sản phẩm web chạy thật. Tôi làm được cả hai đầu trên "
            "cùng một hệ thống: REST API bằng <b>Java 17 + Spring Boot</b>, giao diện <b>Next.js 16 + React 19 + "
            "TypeScript</b>, và hai client di động bằng <b>React Native</b> và <b>Flutter</b>. Tôi mong được tham gia một đội "
            "fullstack để đóng góp cả phần API lẫn giao diện, và học thêm cách tổ chức hệ thống ở quy mô lớn hơn."),
   projects=['rapphim_fe_vi','rapphim_mobile_vi','qrwallet_vi','shop_vi'],
   skills=[
     ("Ngôn ngữ", "TypeScript / JavaScript, Dart, Java 17, C#, PHP 7/8, Python"),
     ("Frontend", "Next.js 16 (App Router), React 19, Vue.js, TypeScript, Tailwind CSS 4, Bootstrap 5, responsive UI, HLS video"),
     ("Backend", "Spring Boot, RESTful API, OpenAPI / Swagger, Node.js, PHP MVC, .NET &amp; ASP.NET Core"),
     ("Cơ sở dữ liệu", "MySQL 8, SQL Server — thiết kế schema chuẩn hoá (ERD), stored procedure, indexing, tối ưu truy vấn"),
     ("Mobile", "React Native / Expo (TypeScript), Flutter (Dart), Android (Java, Kotlin) — MVVM, Room"),
     ("DevOps", "Docker &amp; docker-compose, Linux server, Git / GitHub, GitHub Actions CI/CD"),
     ("Nguyên lý", "OOP, SOLID, design patterns, component-based UI, caching, Agile / Scrum"),
   ]),

 # --------------------------------------------------------- IT Support (VI)
 "CV-NguyenQuocAnh-IT-Support": dict(
   lang=L_VI, exp=EXP_ITSUP_VI, edu=EDU_VI,
   role="IT Support &middot; Kỹ thuật hệ thống &amp; quản trị máy chủ",
   summary=("Tôi tốt nghiệp ngành Công nghệ thông tin và đã có 3 năm vận hành hệ thống chạy thật với uptime 99%. Tôi xử lý sự "
            "cố phần cứng lẫn phần mềm, quản trị <b>Linux</b> và <b>Windows Server</b>, đồng thời tự viết công cụ tự động hoá "
            "bằng <b>Python</b> và <b>PowerShell</b> để giám sát uptime, theo dõi hạn tên miền và dọn mã độc. Tôi mong được "
            "làm hỗ trợ kỹ thuật ở nơi vừa xử lý vận hành hằng ngày, vừa đóng góp công cụ giúp giảm việc thủ công cho cả đội."),
   projects=['ittools_vi','rapphim_mini_vi'],
   skills=[
     ("Hệ thống &amp; máy chủ", "Windows Server, Linux (Ubuntu / Debian), Docker, quản trị VPS, triển khai và giám sát dịch vụ, NAS"),
     ("Xử lý sự cố", "Chẩn đoán phần cứng &amp; phần mềm, cài đặt và khắc phục hệ điều hành, xử lý mã độc, hỗ trợ người dùng cuối, máy in mạng LAN"),
     ("Tự động hoá", "Python, PowerShell, Bash — script giám sát, dọn dẹp, cài đặt tự động; Telegram bot cảnh báo"),
     ("Mạng &amp; dịch vụ", "DNS, quản lý tên miền &amp; SSL, web server (Nginx / Apache / XAMPP), SSH, sao lưu &amp; phục hồi"),
     ("Cơ sở dữ liệu", "MySQL, SQL Server — truy vấn, sao lưu, phục hồi, tối ưu hiệu năng"),
     ("Nghiệp vụ &amp; lập trình", "POS KiotViet, Microsoft Office, Canva &middot; Java, C#, PHP, JavaScript / TypeScript"),
   ]),

  # ------------------------------------------------- Fresher fullstack remote (VI)
 "CV-NguyenQuocAnh-Fresher-Remote": dict(
   lang=L_VI, exp=EXP_REMOTE_VI, edu=EDU_VI,
   role="Fullstack Developer &middot; React / Node.js / .NET",
   summary=("Tôi vừa tốt nghiệp ngành Công nghệ thông tin, và trong thời gian học đã có 3 năm làm sản phẩm chạy thật cho "
            "khách hàng theo hình thức làm việc từ xa. Tôi có nền <b>HTML, CSS, JavaScript</b>, dựng giao diện bằng "
            "<b>React</b> và <b>Next.js</b>, viết ứng dụng di động bằng <b>React Native</b> và <b>Flutter</b>, làm backend "
            "bằng <b>Node.js</b> và <b>C# / .NET</b>. Tôi mong được vào một đội có người hướng dẫn để đóng góp phần giao diện "
            "và mobile, đồng thời quen dần với quy trình làm việc của công ty."),
   projects=['rapphim_mobile_vi','rapphim_fe_vi','store_vi','qrwallet_vi'],
   skills=[
     ("Frontend", "HTML5, CSS3, JavaScript, TypeScript, <b>React 19</b>, Next.js 16, Tailwind CSS, Bootstrap 5, Vue.js, responsive UI"),
     ("Backend", "<b>Node.js</b>, <b>C# / .NET</b>, ASP.NET Core Web API, Java / Spring Boot, PHP 8, RESTful API, OpenAPI / Swagger"),
     ("Cơ sở dữ liệu", "MySQL 8, SQL Server — thiết kế schema chuẩn hoá (ERD), stored procedure, indexing, tối ưu truy vấn"),
     ("Mobile", "<b>React Native / Expo</b> và <b>Flutter (Dart)</b> — expo-router, provider, video_player; Android (Java, Kotlin) — MVVM, Room"),
     ("Công cụ", "Git / GitHub / GitLab, GitHub Actions CI/CD, Docker, Linux server, Canva"),
     ("Làm việc từ xa", "3 năm làm online với khách hàng — tự quản lý tiến độ, chủ động báo cáo, bàn giao đúng hạn; máy tính cá nhân đầy đủ"),
   ]),

 # ------------------------------------------------- TMA Solutions — Fullstack (VI)
 "CV-NguyenQuocAnh-TMA-Fullstack": dict(
   lang=L_VI, exp=EXP_VI, edu=EDU_VI,
   role="IT Fullstack Developer &middot; Java / Spring Boot &middot; React / Next.js",
   summary=("Tôi đã tốt nghiệp ngành Công nghệ thông tin hệ chính quy, xếp loại <b>Xuất sắc</b> với "
            "<b>GPA 3.65/4.0 (8.73/10)</b>, và đã có 3 năm làm sản phẩm web chạy thật cho khách hàng. Tôi làm được "
            "cả hai đầu trên cùng một hệ thống: REST API 32 endpoint bằng <b>Java 17 + Spring Boot</b>, giao diện "
            "<b>Next.js 16 + React 19 + TypeScript</b>, cùng hai client di động bằng <b>React Native</b> và "
            "<b>Flutter</b>. Tôi mong được tham gia đội fullstack tại TMA Solutions để đóng góp cả phần API lẫn giao "
            "diện, và học cách làm dự án phần mềm ở quy mô doanh nghiệp."),
   projects=['rapphim_fe_vi','rapphim_mobile_vi','qrwallet_vi','shop_vi'],
   skills=[
     ("Ngôn ngữ", "Java 17, C#, TypeScript / JavaScript, Dart, PHP 7/8, Python"),
     ("Backend", "Spring Boot, Spring MVC, Bean Validation, RESTful API, OpenAPI / Swagger, Node.js, .NET &amp; ASP.NET Core"),
     ("Frontend", "Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Bootstrap 5, Vue.js, responsive UI"),
     ("Cơ sở dữ liệu", "MySQL 8, SQL Server — thiết kế schema chuẩn hoá (ERD), stored procedure, indexing, tối ưu truy vấn"),
     ("Mobile", "React Native / Expo (TypeScript), Flutter (Dart), Android (Java, Kotlin) — MVVM, Room"),
     ("DevOps", "Docker &amp; docker-compose, Linux server, Git / GitHub / GitLab, GitHub Actions CI/CD"),
     ("Nguyên lý", "OOP, SOLID, design patterns, kiến trúc phân tầng, MVVM, caching, Agile / Scrum"),
   ]),

 # --------------------------------------- Fullstack (EN) — cong ty outsourcing
 "CV-NguyenQuocAnh-EN-Fullstack": dict(
   lang=L_EN, exp=EXP_EN, edu=EDU_EN,
   role="IT Fullstack Developer &middot; Java / Spring Boot &middot; React / Next.js",
   summary=("Software engineering graduate with <b>Excellent</b> standing (GPA 3.65/4.0) and three years building "
            "and operating production web products for clients. Works across the full stack of a single system: a "
            "<b>32-endpoint REST API</b> on <b>Java 17 + Spring Boot</b>, a <b>Next.js 16 / React 19 / TypeScript</b> "
            "front end, and two mobile clients in <b>React Native</b> and <b>Flutter</b> — designing the API contract, "
            "then consuming it from every client. Used to Git Flow, code review, CI/CD and generated API documentation. "
            "Looking to join a delivery team working with international clients."),
   projects=['rapphim_en','rapphim_mobile_en','qrwallet_en'],
   skills=[
     ("Languages", "Java 17, C#, TypeScript / JavaScript, Dart, PHP 7/8, Python"),
     ("Frontend", "Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Bootstrap 5, Vue.js, responsive UI"),
     ("Backend", "Spring Boot, Spring MVC, Bean Validation, RESTful API, OpenAPI / Swagger, Node.js, .NET &amp; ASP.NET Core"),
     ("Databases", "MySQL 8, SQL Server — normalised schema design (ERD), stored procedures, indexing, query optimisation"),
     ("Mobile", "React Native / Expo (TypeScript), Flutter (Dart), Android (Java, Kotlin) — MVVM, Room"),
     ("Delivery", "Docker &amp; docker-compose, Linux servers, Git Flow, code review, GitHub Actions CI/CD, unit testing"),
     ("Principles", "OOP, SOLID, design patterns, layered architecture, MVVM, caching, Agile / Scrum"),
   ]),

 # ------------------------------------------- IT – Chuyển đổi số (VI)
 "CV-NguyenQuocAnh-ChuyenDoiSo": dict(
   lang=L_VI, exp=EXP_CDS_VI, edu=EDU_VI,
   role="Nhân viên IT – Chuyển đổi số &middot; Hỗ trợ hệ thống &amp; phối hợp đơn vị phần mềm",
   summary=("Tôi tốt nghiệp ngành Công nghệ thông tin và có 3 năm vừa làm phần mềm cho khách hàng, vừa vận hành "
            "hệ thống chạy thật. Từng đứng ở <b>phía đơn vị phát triển</b> nên tôi hiểu cách một nhóm phần mềm tiếp "
            "nhận yêu cầu, ước lượng công việc và xử lý lỗi — khi làm đầu mối giữa các phòng ban và nhà cung cấp, tôi "
            "đánh giá được yêu cầu nào khả thi và theo dõi được tiến độ. Tôi cũng tự viết công cụ tự động hoá bằng "
            "<b>Python</b> và <b>PowerShell</b> để cắt việc thủ công, và quen xử lý sự cố máy tính, máy in, mạng cho "
            "người dùng cuối."),
   projects=['ittools_vi','heluong_vi'],
   skills=[
     ("Hỗ trợ &amp; vận hành", "Chẩn đoán phần cứng &amp; phần mềm, cài đặt và khắc phục hệ điều hành, máy in mạng LAN, hỗ trợ người dùng cuối, xử lý mã độc"),
     ("Hệ thống &amp; mạng", "Windows Server, Linux (Ubuntu / Debian), Docker, quản trị VPS, DNS, tên miền &amp; SSL, sao lưu và phục hồi"),
     ("Chuyển đổi số", "Python, PowerShell, Bash — script giám sát, dọn dẹp, cài đặt tự động; ứng dụng công cụ AI vào quy trình nội bộ"),
     ("Phân tích &amp; phối hợp", "Tiếp nhận yêu cầu nghiệp vụ, viết đặc tả chức năng, thiết kế schema (ERD), đọc tài liệu API (OpenAPI), theo dõi tiến độ qua Git / issue"),
     ("Cơ sở dữ liệu", "MySQL, SQL Server — truy vấn, sao lưu, phục hồi, tối ưu hiệu năng"),
     ("Lập trình &amp; nghiệp vụ", "Java, C#, PHP, JavaScript / TypeScript — đủ để đọc hiểu và đánh giá sản phẩm của đơn vị phát triển &middot; POS KiotViet, Microsoft Office"),
   ]),

 # ------------------------------ Kỹ thuật máy tính — cửa hàng bán lẻ máy tính (VI)
 # JD gate bằng bằng cấp và kiến thức laptop / desktop / mạng, không hỏi lập trình:
 # đưa bằng cấp và Z1 lên đầu, phần code chỉ còn là công cụ hỗ trợ vận hành.
 "CV-NguyenQuocAnh-KyThuatMayTinh": dict(
   lang=L_VI, exp=EXP_KT_VI, edu=EDU_VI,
   role="Kỹ thuật viên máy tính &middot; Laptop / Desktop &middot; Hệ điều hành &middot; Mạng cơ bản",
   summary=("Tôi tốt nghiệp Cao đẳng Công nghệ thông tin hệ chính quy, xếp loại <b>Xuất sắc</b> (GPA 3.65/4.0), "
            "từng làm hỗ trợ kỹ thuật tại <b>Công ty Cổ phần Máy tính Z1</b> — chẩn đoán và xử lý sự cố phần cứng, "
            "phần mềm, máy in, mạng — và có 3 năm tự quản trị hạ tầng máy chủ chạy thật với uptime 99%. Tôi cài đặt, "
            "khắc phục <b>Windows</b> và <b>Linux</b>, xử lý mã độc, và tự viết script <b>PowerShell / Python</b> để "
            "bớt việc lặp lại. Tôi mong được làm kỹ thuật viên tại một hệ thống bán lẻ máy tính, làm việc trực tiếp "
            "với khách hàng và tiếp xúc nhiều sản phẩm công nghệ mới."),
   projects=['ittools_kt_vi'],
   skills=[
     ("Phần cứng", "Chẩn đoán và xử lý sự cố laptop &amp; desktop; nắm cấu tạo và chuẩn tương thích linh kiện — CPU, mainboard, RAM DDR4 / DDR5, SSD SATA / NVMe, nguồn; máy in, NAS"),
     ("Hệ điều hành", "Cài đặt, khắc phục Windows / Windows Server và Linux (Ubuntu / Debian); cài driver và phần mềm; xử lý mã độc; sao lưu &amp; phục hồi dữ liệu"),
     ("Mạng cơ bản", "Mạng LAN, TCP/IP, máy in mạng, DNS, tên miền &amp; SSL, SSH, web server (Nginx / Apache)"),
     ("Tự động hoá", "PowerShell, Python, Bash — script cài đặt, dọn dẹp, giám sát tự động; Telegram bot cảnh báo"),
     ("Nghiệp vụ", "POS KiotViet, quản lý sản phẩm trên sàn TMĐT, Microsoft Office, Canva &middot; lập trình Java, C#, PHP, JavaScript"),
     ("Tác phong", "Quen xử lý sự cố gấp khi hệ thống của khách đang chạy; chủ động báo cáo, bàn giao đúng hạn; sẵn sàng xoay ca"),
   ]),

 # ----------------------------------------- Fresher Backend (VI) — Node/TS/Python
 "CV-NguyenQuocAnh-Fresher-Backend": dict(
   lang=L_VI, exp=EXP_VI, edu=EDU_VI,
   role="Fresher Backend Developer &middot; Node.js / TypeScript / Python &middot; SQL &amp; REST API",
   summary=("Tôi tốt nghiệp ngành Công nghệ thông tin và đã có 3 năm làm sản phẩm chạy thật. Tôi quen việc "
            "<b>phân tích và thiết kế trước khi code</b> — viết use case, dựng sơ đồ thực thể (ERD), chốt API "
            "contract, xử lý validation tại biên — rồi tự hiện thực bằng <b>TypeScript, Node.js, Python</b> hoặc Java. "
            "Gần đây tôi thiết kế một REST API 32 endpoint có tài liệu OpenAPI tự sinh, rồi viết ba client tiêu thụ "
            "chính contract đó. Toàn bộ mã nguồn công khai trên GitHub, đẩy code hằng ngày."),
   projects=['rapphim_contract_vi','pulse_vi','ittools_py_vi'],
   skills=[
     ("Ngôn ngữ", "<b>TypeScript / JavaScript</b>, <b>Python</b>, Java 17, C#, PHP 7/8, Dart"),
     ("Backend", "<b>Node.js</b>, RESTful API, OpenAPI / Swagger, Spring Boot, ASP.NET Core — thiết kế API contract, validation tại biên, caching"),
     ("Cơ sở dữ liệu", "<b>MySQL 8, SQL Server</b> — thiết kế schema chuẩn hoá (ERD), stored procedure, indexing, tối ưu truy vấn"),
     ("Frontend", "React 19, Next.js 16 (App Router), Tailwind CSS, Bootstrap 5, HTML5 / CSS3 — biết gọi API và chia nhỏ component"),
     ("Công cụ", "<b>Git / GitHub</b> (223 repo công khai), GitHub Actions CI/CD, Docker &amp; docker-compose, Linux server"),
     ("Phân tích", "Use case, đặc tả chức năng, ERD, API contract, data validation, tài liệu kỹ thuật"),
   ]),

 # ------------------------------------------------------------- Backend (EN)
 "CV-NguyenQuocAnh-EN-Backend": dict(
   lang=L_EN, exp=EXP_EN, edu=EDU_EN,
   role="Junior Backend Developer &middot; Java / Spring Boot / REST API",
   summary=("Software engineer with three years building and operating production web products. Designed a "
            "32-endpoint REST API on <b>Java 17</b> and <b>Spring Boot</b> — caching, boundary validation, generated "
            "OpenAPI docs — then built the web and mobile clients against that same contract. Comfortable owning "
            "delivery with <b>Docker</b> and GitHub Actions CI; looking for a team with code review and mentoring."),
   projects=['rapphim_en','rapphim_mobile_en','qrwallet_en'],
   skills=[
     ("Languages", "Java 17, C#, Dart, PHP 7/8, TypeScript / JavaScript, Python"),
     ("Backend", "Spring Boot, Spring MVC, Bean Validation, Spring Actuator, RESTful API, OpenAPI / Swagger, .NET &amp; ASP.NET Core, Node.js"),
     ("Databases", "MySQL 8, SQL Server — normalised schema design (ERD), stored procedures, indexing, query optimisation"),
     ("Frontend", "Next.js, React, Vue.js, TypeScript, Tailwind CSS, Bootstrap 5, HTML5 / CSS3"),
     ("Mobile", "React Native / Expo (TypeScript), Flutter (Dart), Android (Java, Kotlin) — MVVM, Room"),
     ("DevOps", "Docker &amp; docker-compose, Linux servers, Maven, Git / GitHub, GitHub Actions CI/CD"),
     ("Principles", "OOP, SOLID, design patterns, layered architecture, MVVM, caching, Agile / Scrum"),
   ]),
}

# ----------------------------------------------------------------------------
# Dựng HTML
# ----------------------------------------------------------------------------
def entry_html(e):
    out = ['<div class="entry">', '  <div class="entry-head">',
           f'    <div class="entry-title">{e["title"]} <span class="entry-org">{e["org"]}</span></div>',
           f'    <div class="entry-date">{e["date"]}</div>', '  </div>']
    if e.get("bullets"):
        out.append('  <ul>')
        out += [f'    <li>{b}</li>' for b in e["bullets"]]
        out.append('  </ul>')
    if e.get("sub"):
        out.append(f'  <div class="entry-sub">{e["sub"]}</div>')
    out.append('</div>')
    return "\n".join(out)


def build(slug, v):
    L = v["lang"]
    parts = [
      '<meta charset="utf-8">',
      f'<title>CV — Nguyễn Quốc Anh — {slug}</title>',
      f'<style>{CSS}</style>',
      '<header>',
      '  <div class="name">Nguyễn Quốc Anh</div>',
      f'  <div class="role">{v["role"]}</div>',
      f'  <div class="contact">{CONTACT.format(loc=L["loc"])}</div>',
      '  <div class="rule-top"></div>',
      '</header>',
      f'<h2>{L["summary"]}</h2>',
      f'<p class="summary">{v["summary"]}</p>',
      f'<h2>{L["exp"]}</h2>',
    ]
    parts += [entry_html(e) for e in v["exp"]]
    parts.append(f'<h2>{L["proj"]}</h2>')
    parts += [entry_html(PROJ[k]) for k in v["projects"]]
    parts.append(f'<h2>{L["skills"]}</h2>')
    parts.append('<div class="skills">')
    for k, val in v["skills"]:
        parts.append(f'  <div class="skill-row"><div class="skill-key">{k}</div>'
                     f'<div class="skill-val">{val}</div></div>')
    parts.append('</div>')
    parts.append(f'<h2>{L["edu"]}</h2>')
    parts.append(entry_html(v["edu"]))
    return "\n".join(parts)


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ok = True
    for slug, v in VARIANTS.items():
        html_path = os.path.join(OUT_DIR, slug + ".html")
        pdf_path = os.path.join(OUT_DIR, slug + ".pdf")
        io.open(html_path, "w", encoding="utf-8").write(build(slug, v))
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                        "--run-all-compositor-stages-before-draw", "--virtual-time-budget=4000",
                        "--print-to-pdf=" + pdf_path,
                        "file:///" + html_path.replace("\\", "/")],
                       capture_output=True)
        try:
            import fitz
            d = fitz.open(pdf_path)
            pages = d.page_count
            end = max(b[3] for b in d[0].get_text("blocks"))
            flag = "OK " if pages == 1 else "TRÀN"
            if pages != 1:
                ok = False
            print(f"{flag} {slug:34s} {pages} trang, hết nội dung ở {end:.0f}/842pt")
        except ImportError:
            print(f"    {slug}: đã tạo PDF (cài pymupdf để kiểm tra số trang)")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()

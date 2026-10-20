# CV — Nguyễn Quốc Anh

Bộ CV sinh từ một nguồn nội dung duy nhất. Sửa `build_cv.py`, chạy lại, sáu bản
PDF cùng cập nhật — không phải mở Word sửa tay từng file rồi quên mất bản nào đã sửa.

## Các bản

| File | Định vị | Nhắm vào |
|---|---|---|
| `CV-NguyenQuocAnh-Java-Backend` | Java / Spring Boot / REST API | Backend Java, chương trình trainee |
| `CV-NguyenQuocAnh-NET-Backend` | C# / .NET / SQL Server | Backend .NET |
| `CV-NguyenQuocAnh-Fullstack` | Next.js / React · Java / PHP | Fullstack |
| `CV-NguyenQuocAnh-Fresher-Remote` | React / Node.js / .NET | Fresher làm việc từ xa |
| `CV-NguyenQuocAnh-IT-Support` | Kỹ thuật hệ thống & quản trị máy chủ | IT Support, Helpdesk |
| `CV-NguyenQuocAnh-KyThuatMayTinh` | Laptop / desktop / hệ điều hành / mạng cơ bản | Kỹ thuật viên cửa hàng máy tính |
| `CV-NguyenQuocAnh-MemoryZone` | CV kiểu Việt Nam: năm sinh, giới tính, mục tiêu nghề nghiệp | MemoryZone — Kỹ thuật máy tính |
| `CV-NguyenQuocAnh-TongQuat` | CV kiểu Việt Nam, không gắn công ty; có thêm bản `.docx` sửa được | Kỹ thuật máy tính, hỗ trợ IT, lập trình — gửi nhiều nơi |
| `CV-NguyenQuocAnh-EN-Backend` | Java / Spring Boot (tiếng Anh) | Công ty FDI, Nhật, Hàn |
| `CV-NguyenQuocAnh-AI-Automation` | Python · AI workflow & automation · pipeline, xử lý tài liệu, giám sát | Thực tập sinh AI Engineer — chatbot, RAG, automation |
| `CV-NguyenQuocAnh-EN-AI-Intern` | Bản tiếng Anh của bản trên, viết bằng tiếng Anh dễ | Thực tập sinh AI Engineer, công ty yêu cầu CV tiếng Anh |
| `CV-NguyenQuocAnh-AI-CongKhai` &middot; `-EN-AI-CongKhai` | Hai bản trên, bỏ số điện thoại ở dòng liên hệ | Đăng nơi công khai: nhóm Facebook, diễn đàn |
| `CV-NguyenQuocAnh-GiaoVienLapTrinh` | Truyền đạt, hướng dẫn, ngôn ngữ dạy được — bỏ hết DevOps và hạ tầng | Giáo viên lập trình cho trẻ em, trung tâm dạy code |

Mỗi bản gọn đúng **một trang A4**. `build_cv.py` tự kiểm số trang sau khi dựng và
báo bản nào tràn, nên không có chuyện gửi nhầm file hai trang.

## Chạy

Cần Python 3 và Google Chrome (dùng chế độ headless để in PDF).
Trên Linux/macOS, trỏ biến môi trường `CV_CHROME` tới binary Chrome/Chromium.

```bash
python build_cv.py
```

```
OK  CV-NguyenQuocAnh-Java-Backend      1 trang, hết nội dung ở 816/842pt
OK  CV-NguyenQuocAnh-NET-Backend       1 trang, hết nội dung ở 742/842pt
...
```

Kiểm tra số trang cần `pymupdf`; thiếu thì vẫn dựng được PDF, chỉ bỏ qua bước đếm.

Bản nào có `docx=True` thì dựng thêm `.docx` để người không dùng code sửa trong Word — cần Node.js và
chạy `npm install` một lần; thiếu Node thì bước này được bỏ qua.

## Cách tổ chức

Nội dung tách khỏi trình bày. Các khối dùng chung — kinh nghiệm, dự án, học vấn —
khai báo một lần rồi từng biến thể chọn lại và sắp xếp theo thứ tự phù hợp với vị
trí ứng tuyển:

```python
"CV-NguyenQuocAnh-Java-Backend": dict(
  role="Junior Backend Developer · Java / Spring Boot / REST API",
  summary="...",
  projects=['rapphim_full_vi', 'rapphim_mobile_vi', 'qrwallet_vi'],
  skills=[...],
)
```

Đổi một số liệu ở đầu file là cả sáu bản cùng đổi theo:

```python
USERS  = "200"   # số khách hàng
ORDERS = "50"    # đơn hàng mỗi tháng
UPTIME = "99%"   # uptime hạ tầng
```

## Vì sao HTML rồi in ra PDF

CSS kiểm soát bố cục chính xác hơn hẳn thư viện sinh PDF, mà chữ vẫn là text thật
nên hệ thống lọc hồ sơ tự động (ATS) đọc được đầy đủ — bóc ngược từ PDF ra vẫn đúng
thứ tự đọc và nguyên dấu tiếng Việt. Bố cục một cột, không dùng bảng để dàn trang,
không nhét chữ vào ảnh.

## jobagent — đối chiếu tin tuyển dụng với hồ sơ

`jobagent.py` nhận nội dung một tin tuyển dụng rồi trả lời ba câu: khớp bao nhiêu
phần trăm, nên gửi bản CV nào, và **chỗ nào JD đòi mà hồ sơ chưa có bằng chứng** —
đó chính là những câu sẽ bị hỏi khi phỏng vấn.

```bash
python jobagent.py add "LG CNS — Back-End (C#/.NET/SQL)" jd.txt
python jobagent.py list
python jobagent.py status 2 da-nop
python jobagent.py report
```

```
#    TIN                                          KHỚP  CV NÊN GỬI       TRẠNG THÁI
1    JD fresher fullstack remote                   83%  Fresher-Remote   đã nộp
2    LG CNS — Back-End (C#/.NET/SQL)               82%  NET-Backend      mới
3    Viettel Solutions — Java Developer 2 năm+     73%  Java-Backend     mới
```

Điểm khác biệt so với việc đếm từ khoá: mỗi kỹ năng trong hồ sơ phải kèm **bằng
chứng cụ thể** mới được tính. Kỹ năng không có dự án chứng minh sẽ nằm ở mục *hụt*
chứ không được cộng điểm.

```
Khớp — có bằng chứng:
   spring       REST API 32 endpoint, Caffeine cache, Actuator, springdoc
   docker       Docker + compose tách dev/prod; image đa kiến trúc trên GHCR
HỤT — JD đòi nhưng hồ sơ chưa có bằng chứng:
   microservice chuẩn bị câu trả lời, hoặc bỏ qua tin này
```

Chỉ dùng thư viện chuẩn, chạy hoàn toàn cục bộ: không truy cập mạng, không đăng
nhập vào trang tuyển dụng nào, không tự nộp hồ sơ. Việc nộp vẫn do người làm, từng
tin một.

## topcv — thu thập tin tuyển dụng rồi chấm điểm

`topcv.py` lấy tin thực tập trên TopCV theo từ khoá rồi đẩy sang `jobagent.py` chấm điểm,
biến một đống tin thành danh sách đã xếp hạng.

```bash
python topcv.py fetch --tu-khoa php,python,go,java --chi-tiet
python topcv.py list
python topcv.py nap     # đẩy sang jobs.json để theo dõi bằng jobagent
```

Công cụ **đọc `robots.txt` trước khi tải bất cứ gì** và bỏ qua mọi đường dẫn bị cấm —
không có cờ nào tắt được. Nghỉ tối thiểu 3 giây giữa các lần tải, theo `Crawl-delay`
nếu trang có nêu, User-Agent ghi rõ đây là công cụ gì, và dừng hẳn khi gặp 403 hoặc 429.

Dữ liệu lấy từ khối `schema.org/JobPosting` dạng JSON-LD mà trang công bố cho máy đọc,
ổn định hơn nhiều so với bám vào tên class CSS.

Đây là công cụ cá nhân để tìm việc cho chính mình. Điều khoản sử dụng của TopCV mới là
thứ quyết định bạn được làm gì; `robots.txt` chỉ là phần máy đọc được.

## ats-scan — công cụ quét CV theo tin tuyển dụng

Thư mục `ats-scan/` là một web app mã nguồn mở chạy hoàn toàn trong trình duyệt: dán tin
tuyển dụng rồi tải CV lên để chấm mức khớp, soi các lỗi khiến phần mềm lọc hồ sơ đọc sai,
chấm chất lượng tin tuyển dụng, kèm mẫu CV chuẩn ATS và mẹo viết CV. CV không rời khỏi máy
người dùng. Chi tiết xem `ats-scan/README.md`.

## lab-mang — lab DHCP + VLAN chạy được

Thư mục `lab-mang/` là một lab mạng dựng bằng Linux network namespace: một router,
ba VLAN, DHCP server thật, client thật. Script tái hiện ba sự cố hay gặp nhất ở mạng
công ty nhỏ — hết IP, trùng IP, DHCP lậu — rồi sửa từng cái, và kiểm chứng VLAN cô lập
broadcast đến đâu. Chạy bằng `sudo ./lab.sh all`, không cần GNS3 hay thiết bị thật.
Cấu hình Cisco IOS tương đương nằm ở `lab-mang/cisco-ios.md`. Chi tiết xem
`lab-mang/README.md`.

## on-tap — giáo trình ôn tập Kỹ thuật viên máy tính

Thư mục `on-tap/` chứa giáo trình PDF 56 trang để ôn phỏng vấn vị trí kỹ thuật viên phần cứng: cấu trúc máy tính, CPU & socket, RAM, ổ cứng, chuẩn kết nối, mạng cơ bản. Cách dựng lại xem `on-tap/README.md`.

---

Liên hệ: [github.com/nguyenquocanhz](https://github.com/nguyenquocanhz) ·
[nguyenquocanh.io.vn](https://nguyenquocanh.io.vn)

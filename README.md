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
| `CV-NguyenQuocAnh-EN-Backend` | Java / Spring Boot (tiếng Anh) | Công ty FDI, Nhật, Hàn |

Mỗi bản gọn đúng **một trang A4**. `build_cv.py` tự kiểm số trang sau khi dựng và
báo bản nào tràn, nên không có chuyện gửi nhầm file hai trang.

## Chạy

Cần Python 3 và Google Chrome (dùng chế độ headless để in PDF).

```bash
python build_cv.py
```

```
OK  CV-NguyenQuocAnh-Java-Backend      1 trang, hết nội dung ở 816/842pt
OK  CV-NguyenQuocAnh-NET-Backend       1 trang, hết nội dung ở 742/842pt
...
```

Kiểm tra số trang cần `pymupdf`; thiếu thì vẫn dựng được PDF, chỉ bỏ qua bước đếm.

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

---

Liên hệ: [github.com/nguyenquocanhz](https://github.com/nguyenquocanhz) ·
[nguyenquocanh.io.vn](https://nguyenquocanh.io.vn)

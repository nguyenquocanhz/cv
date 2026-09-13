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

---

Liên hệ: [github.com/nguyenquocanhz](https://github.com/nguyenquocanhz) ·
[nguyenquocanh.io.vn](https://nguyenquocanh.io.vn)

# ATS Scan

Công cụ mã nguồn mở quét CV theo tin tuyển dụng, chỉ ra chỗ khiến phần mềm lọc hồ sơ
(ATS) đọc sai, và chấm chất lượng của chính tin tuyển dụng.

**CV không rời khỏi máy bạn.** Toàn bộ xử lý chạy trong trình duyệt: không tài khoản,
không máy chủ, không lưu gì. Hai thư viện đọc PDF và DOCX được nhúng sẵn trong repo
nên trang chạy được cả khi không có mạng.

## Dùng thử

Mở `index.html` bằng trình duyệt, hoặc chạy một máy chủ tĩnh bất kỳ:

```bash
npx http-server ats-scan -p 8099     # rồi mở http://127.0.0.1:8099
```

Đăng lên GitHub Pages: trỏ Pages vào thư mục này là xong, không cần bước build.

## Năm việc nó làm

| Thẻ | Việc |
|---|---|
| **Quét CV theo tin** | Dán tin tuyển dụng + tải CV lên → điểm tổng 0–100 chia làm bốn phần, kèm danh sách từ khoá tin đòi mà CV chưa có |
| **Phân tích CV** | Chỉ cần CV, không cần tin: số liệu, các mục nhận ra được, và lỗi khiến máy đọc sai |
| **Chấm tin tuyển dụng** | Dành cho nhà tuyển dụng: tin đã đủ thông tin chưa, yêu cầu có thực tế không, có điều kiện phân biệt đối xử không |
| **Mẫu CV chuẩn ATS** | Ba mẫu Word một cột, tải về điền luôn |
| **Mẹo viết CV** | Hướng dẫn thay đổi theo đối tượng: người đi làm, sinh viên, nhà tuyển dụng |

Chọn **Nhà tuyển dụng** rồi thả nhiều CV cùng lúc sẽ ra bảng xếp hạng ứng viên.

## Cách chấm điểm

Điểm tổng 100 chia làm bốn phần:

| Phần | Điểm | Căn cứ |
|---|---|---|
| Khớp kỹ năng | 45 | Kỹ năng tin đòi mà CV có. Yêu cầu bắt buộc tính nặng gấp ba mục ưu tiên; mục Quyền lợi **không** tính |
| Yêu cầu cứng | 20 | Số năm kinh nghiệm (suy ra từ các mốc ngày tháng trong CV) và bằng cấp |
| Cấu trúc máy đọc được | 25 | Trừ dần theo từng lỗi: nhiều cột, CV là ảnh scan, thiếu liên hệ, thiếu tiêu đề mục… |
| Chất lượng nội dung | 10 | Có số liệu không, gạch đầu dòng có mở đầu bằng động từ không, độ dài |

Mỗi công ty dùng một phần mềm lọc hồ sơ khác nhau, nên đây là ước lượng để biết nên
sửa chỗ nào, không phải điểm thật của nhà tuyển dụng.

## Mấy chỗ đáng lưu ý khi đọc mã nguồn

Tiếng Việt bỏ dấu sinh ra rất nhiều từ trùng nhau, và đó là nguồn lỗi chính:

- `năm` → `nam` trùng `nam` (giới tính), nên phần dò điều kiện phân biệt đối xử
  chạy trên chữ **còn dấu**.
- `ghi nhận sự cố` → `nhan su` trùng `nhân sự`; `nhiều lần` → `lan` trùng `LAN`;
  `cho thuê` → `thue` trùng `thuế`. Vì vậy alias nào viết **có dấu** thì được so khớp
  trên chữ còn dấu.
- `\b` của JavaScript không coi `ữ` là ký tự từ, nên `/nữ\b/` không khớp "chỉ tuyển nữ".
  Dùng `(?!\p{L})` thay cho `\b`.
- pdf.js trả tiêu đề in giãn chữ thành `"T Ó M T Ắ T"`, nên khâu nhận diện mục so khớp
  thêm một lần sau khi bỏ hết khoảng trắng.

Bộ test khoá lại toàn bộ các trường hợp trên.

## Phát triển

```bash
npm install                      # thư viện docx, dùng để sinh mẫu CV
node --test ats-scan/test/       # 27 test cho bộ máy chấm điểm
node ats-scan/make_templates.js  # sinh lại templates/*.docx và *.md
```

| File | Việc |
|---|---|
| `assets/engine.js` | Bộ máy chấm điểm — hàm thuần, không đụng DOM, chạy được cả trên Node |
| `assets/skills.js` | Từ điển kỹ năng và alias. Thêm kỹ năng chỉ cần thêm một dòng |
| `assets/i18n.js` | Chuỗi giao diện và lời giải thích từng lỗi, song ngữ |
| `assets/content.js` | Mẹo viết CV và mô tả các mẫu |
| `assets/app.js` | Giao diện, đọc file PDF/DOCX |
| `make_templates.js` | Sinh mẫu CV ra .docx và .md |

Thêm kỹ năng mới vào `SKILLS` trong `skills.js`:

```js
S('khoa', 'Tên tiếng Việt', 'English name', 'nhom', ['alias 1', 'alias 2']),
```

Alias viết thường, không dấu — trừ khi cần dấu để phân biệt nghĩa (xem phần trên).

## Giấy phép

MIT. Thư viện nhúng trong `assets/vendor/`: [pdf.js](https://mozilla.github.io/pdf.js/)
(Apache-2.0) và [mammoth.js](https://github.com/mwilliamson/mammoth.js) (BSD-2-Clause),
giấy phép gốc để kèm cùng thư mục.

# Giáo trình ôn tập Kỹ thuật viên máy tính

`GiaoTrinh-OnTap-KyThuatVienMayTinh.pdf` — 56 trang, định dạng theo IEEE Std 1063-2001:
cấu trúc máy tính, CPU & socket, các đời RAM, ổ cứng và thẻ nhớ, chuẩn kết nối, mạng cơ bản.
Mỗi chương có bảng tra cứu, hình minh hoạ và 5 bài tập; phụ lục gồm tài liệu tham khảo,
16 câu hỏi phỏng vấn thường gặp và đáp án gợi ý. Mục lục bấm được, PDF có sẵn bookmark.

## Dựng lại

Cần Node.js, Python 3 (`pymupdf`, `pillow`), LibreOffice và Chrome/Chromium.

```bash
npm install                 # thư viện docx
python hinh/ve_hinh.py      # chỉ khi sửa hình: SVG → PNG
python build.py             # DOCX → PDF, chạy hai lượt để điền số trang mục lục
```

Nội dung nằm trong `gen_giaotrinh.js`; hình vẽ bằng code trong `hinh/ve_hinh.py`.
Trên Windows, trỏ biến môi trường `SOFFICE` và `CHROME` tới đúng file thực thi nếu không có sẵn trong PATH.

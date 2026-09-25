# NetWork-CV6 — phân tích mạng IPv6

Trang web tĩnh để hiểu một địa chỉ IPv6 hay cả cấu hình IPv6 của một máy: địa
chỉ thuộc loại gì, có ra được Internet không, có làm lộ MAC không, nên chặn gì.
Mọi thứ chạy trong trình duyệt — không gọi server nào, không lưu nội dung dán vào.

Trang chạy trên GitHub Pages: **https://nguyenquocanhz.github.io/cv/**
(xem cách bật ở mục [Triển khai](#triển-khai)).

## Có gì

| Tab | Làm gì |
|---|---|
| **Địa chỉ** | Rút gọn / mở rộng theo RFC 5952, phân loại theo sổ đăng ký IANA, tô phần mạng theo `/prefix`, xem nhị phân, dải đầu–cuối, số mạng /64, reverse DNS, solicited-node. Nhận ra EUI-64 và **suy ngược MAC**, giải mã Teredo / 6to4 / NAT64, đọc cờ và phạm vi multicast. |
| **Mạng của tôi** | Dán output `ip addr; ip -6 route`, `ipconfig /all`, `ifconfig` hoặc trang *Info* của trình cài Ubuntu. Trang liệt kê từng địa chỉ, chỉ ra rủi ro (IPv6 công khai không qua NAT, địa chỉ lộ MAC, đường hầm Teredo…) và sinh sẵn lệnh UFW / cấu hình netplan theo đúng tên interface và dải LAN tìm thấy. |
| **Chia subnet** | Chia khối /56, /48 nhà mạng cấp thành các mạng con, có phân trang và nhảy tới mạng thứ *n* (số thập phân hoặc Subnet ID hex). |
| **MAC → IPv6** | Từng bước MAC → Interface ID EUI-64 → địa chỉ link-local và SLAAC. |
| **Tra cứu** | Bảng các dải đặc biệt, phạm vi multicast, ghi nhớ khi vận hành. |

Mỗi trạng thái nằm trên URL (`#analyze?q=2001:db8::1/64`, `#subnet?q=…&len=64`),
nên gửi link là người nhận thấy đúng kết quả. Nội dung tab *Mạng của tôi* thì cố ý
không đưa lên URL.

## Chạy thử trên máy

Không cần build. Mở thẳng `index.html`, hoặc:

```bash
cd NetWork-CV6
python3 -m http.server 8000     # rồi mở http://localhost:8000
```

Test phần lõi (Node 18 trở lên, không cần cài gói nào):

```bash
node --test NetWork-CV6/tests/ipv6.test.js
```

## Cách tổ chức

```
NetWork-CV6/
├── index.html      khung trang, 5 tab
├── style.css       giao diện sáng / tối, co giãn theo màn hình điện thoại
├── ipv6.js         lõi: parse, phân loại, EUI-64, subnet, đọc output lệnh — không đụng DOM
├── app.js          vẽ kết quả từ ipv6.js lên trang
├── samples.js      dữ liệu mẫu (dải tài liệu 2001:db8::/32, MAC bịa)
└── tests/          test cho ipv6.js, chạy bằng node --test
```

Phần tính toán tách hẳn khỏi giao diện nên test được bằng Node mà không cần trình
duyệt. Địa chỉ được giữ dưới dạng `BigInt` 128 bit, nên phép AND với mask, đếm số
mạng con hay nhảy tới mạng thứ 2⁶⁴ − 1 đều chính xác.

## Triển khai

Workflow `.github/workflows/network-cv6-pages.yml` chạy test rồi đưa **riêng thư mục
này** lên GitHub Pages mỗi khi `main` có thay đổi trong `NetWork-CV6/`. Các file CV ở
thư mục gốc không bị đưa lên.

Chỉ cần bật một lần: **Settings → Pages → Build and deployment → Source: GitHub
Actions**. Sau đó chạy lại workflow (tab Actions → *NetWork-CV6 → GitHub Pages* →
*Run workflow*) hoặc đẩy một thay đổi vào `main`.

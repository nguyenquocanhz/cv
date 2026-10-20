# Lab DHCP + VLAN

Lab mạng chạy được bằng một script bash, dựng trên Linux network namespace.
Không cần GNS3, không cần máy ảo, không cần thiết bị thật.

Lab tái hiện đúng 3 sự cố hay gặp nhất ở mạng công ty nhỏ — hết IP, trùng IP,
DHCP lậu — rồi sửa từng cái, và kiểm chứng VLAN cô lập broadcast đến đâu.

---

## Chạy thử

```bash
sudo apt install -y iproute2 dnsmasq busybox-static tcpdump iptables

sudo ./lab.sh up      # dựng topology + DHCP
sudo ./lab.sh ca1     # tái hiện HẾT IP
sudo ./lab.sh ca2     # tái hiện TRÙNG IP
sudo ./lab.sh ca3     # tái hiện DHCP LẬU
sudo ./lab.sh ca4     # kiểm chứng VLAN cô lập broadcast
sudo ./lab.sh status  # xem ai đang giữ IP nào
sudo ./lab.sh down    # dọn sạch

sudo ./lab.sh all     # chạy lần lượt cả 4 ca
```

Trên Windows thì chạy trong **WSL2** (`wsl --install`, chọn Ubuntu).
Nếu máy đã có dnsmasq chạy sẵn ngoài hệ thống thì không sao — lab chạy dnsmasq
riêng bên trong từng namespace với `--port=0` nên không đụng cổng DNS của máy.

File tạm nằm ở `/tmp/lab-mang`, đổi được bằng biến `LAB_RUN_DIR`.

---

## Sơ đồ

```
                  r1  (router + DHCP server)
                  │   10.0.10.1   10.0.20.1   10.0.30.1
        ┌─────────┼──────────────┬─────────────┐
        │         │              │             │
     br-v10              br-v20            br-v30      ← mỗi bridge = 1 VLAN
    (VLAN 10)           (VLAN 20)         (VLAN 30)      = 1 broadcast domain
    nhân viên             khách             camera
        │                   │                 │
 pc1 pc2 pc3 pc4           kh1              cam1
```

| VLAN | Tên | Dải | Pool DHCP |
|---|---|---|---|
| 10 | nhân viên | 10.0.10.0/24 | .100 – .150 |
| 20 | khách | 10.0.20.0/24 | .100 – .120 |
| 30 | camera | 10.0.30.0/24 | .100 – .120 |

---

## Lab này mô phỏng được gì, không mô phỏng được gì

**Có:** DHCP thật (dnsmasq), client thật (busybox udhcpc), gói tin thật
(bắt được bằng tcpdump), broadcast domain tách rời thật, định tuyến giữa các
VLAN thật, ACL thật.

**Không:** đóng tag 802.1Q trên dây. Ở đây mỗi VLAN là một bridge riêng, nên
hiệu ứng cô lập broadcast giống hệt switch thật, nhưng không có trường VLAN ID
trong frame. Muốn học phần tag thì xem **[cisco-ios.md](cisco-ios.md)** — cùng
topology này viết bằng Cisco IOS, chạy được trong Packet Tracer.

(Lý do kỹ thuật: tag 802.1Q cần `CONFIG_VLAN_8021Q` trong kernel. Kernel Ubuntu
và WSL2 bình thường đều có; một số kernel container thì không.)

---

## Ca 1 — Hết IP

Thu pool VLAN 10 còn đúng 3 địa chỉ rồi cho 4 máy cùng xin.

```
pc1 → 10.0.10.101     pc2 → 10.0.10.102
pc3 → 10.0.10.100     pc4 → KHÔNG xin được IP
```

**Sửa, theo thứ tự rủi ro tăng dần:**

| | Cách | Đánh đổi |
|---|---|---|
| A | Nới pool trong chính /24 đang có | Không đụng thiết kế. Làm trước tiên. |
| B | Giảm lease time (86400 → 7200) | Thu hồi IP của máy đã tắt. Rẻ, hiệu quả nhất với mạng khách đông. |
| C | Đổi mask /24 → /23 | 254 → 510 host, nhưng broadcast domain to gấp đôi. Chỉ làm khi A và B không đủ. |

**Không** nên nhảy thẳng lên /16 như nhiều người khuyên: 65 000 host trong một
broadcast domain thì ARP và broadcast sẽ làm mạng chậm hơn chứ không nhanh hơn.

---

## Ca 2 — Trùng IP

`cam1` được đặt IP tĩnh `10.0.30.101`, mà địa chỉ đó **nằm trong pool DHCP**.
Camera bị cúp điện. Lúc đó một máy khác xin IP, router ping thử `.101` thấy
không ai trả lời nên coi là trống và cấp đi. Camera có điện lại — hai thiết bị
cùng một IP.

Lab bắt được bằng ARP, một IP trả về hai MAC khác nhau:

```
ARPING 10.0.30.101 from 10.0.30.1 r1-v30
Unicast reply from 10.0.30.101 [62:e8:2d:ba:e3:ec]   ← máy lấy DHCP
Unicast reply from 10.0.30.101 [6a:df:a7:c1:ab:2b]   ← camera đặt tĩnh
```

**Sửa:**

1. Đẩy toàn bộ dải tĩnh **ra ngoài** pool — pool `.100–.200`, tĩnh `.201–.254`.
2. Tốt hơn: DHCP reservation, ghim IP theo MAC trên router. IP vẫn do router
   quản lý, sau này đổi dải chỉ sửa một chỗ.

Trên máy Windows xem bằng `arp -a 10.0.30.101`.
Trên router Cisco: `show ip dhcp conflict`.

---

## Ca 3 — DHCP lậu

Có người cắm thêm một con router giá rẻ vào switch, cắm nhầm vào cổng LAN.
Nó phát DHCP dải `192.168.1.0/24` song song với router thật.

**Bằng chứng chắc chắn** — một câu hỏi, hai nơi trả lời:

```
0.0.0.0.68    > 255.255.255.255.67  BOOTP/DHCP, Request from ca:7f:94:29:ce:6e
192.168.1.1.67 > 192.168.1.108.68   BOOTP/DHCP, Reply      ← router lậu
10.0.10.1.67   > 10.0.10.108.68     BOOTP/DHCP, Reply      ← router thật

Số DHCP server đã trả lời: 2
```

Máy nào lấy nhầm là chuyện may rủi — ai trả lời trước thì thắng. Đó đúng là
lý do sự cố này khó bắt: hôm nay máy chạy bình thường, mai cắm lại dây là hỏng.

**Phát hiện trên máy thật:**

```
Windows:  ipconfig /all        → đọc dòng "DHCP Server"
Linux:    tcpdump -ni <card> 'udp port 67 or udp port 68'
```

Chạy `ipconfig /all` ở 3–4 chỗ khác nhau trong công ty. Ra **hai địa chỉ DHCP
Server khác nhau** là chắc chắn có máy phát lậu.

**Sửa:**

1. Biến con router lậu thành AP thuần: tắt DHCP, đặt IP tĩnh ngoài pool,
   cắm dây uplink vào **cổng LAN**, không phải cổng WAN.
2. Chặn từ gốc trên switch quản lý được — DHCP snooping, chỉ tin cổng lên
   router thật. Xem [cisco-ios.md](cisco-ios.md) mục 2.

---

## Ca 4 — VLAN cô lập được đến đâu

Hai điều cần phân biệt rõ:

**Broadcast thì không vượt VLAN.** pc1 ở VLAN 10 bắn ARP, kh1 ở VLAN 20 bật
tcpdump — không nghe được gói nào. Đây mới là tác dụng chính của VLAN.

**Nhưng unicast thì vẫn đi qua được**, vì router đang định tuyến giữa các VLAN.
Máy khách vẫn ping thẳng vào máy nhân viên bình thường.

> Chia VLAN thôi **chưa** đủ để cách ly. Phải có thêm ACL.

```bash
iptables -I FORWARD -i r1-v20 -o r1-v10 -j DROP    # khách ✗→ nhân viên
iptables -I FORWARD -i r1-v20 -o r1-v30 -j DROP    # khách ✗→ camera
```

Câu lệnh Cisco tương đương ở [cisco-ios.md](cisco-ios.md) mục 5.

---

## Quy trình xử lý khi mạng công ty hết IP

Rút ra từ 4 ca ở trên, dùng được ngay ngoài đời:

1. **Đếm thiết bị.** Bao nhiêu máy thật sự cần IP: PC, điện thoại, camera,
   máy in, AP, khách.
2. **Tìm ai đang cấp DHCP.** `ipconfig /all` ở 3–4 vị trí khác nhau, đọc dòng
   `DHCP Server`. Ra hai địa chỉ khác nhau → có DHCP lậu → đó là nguyên nhân
   trùng IP, xử lý trước mọi thứ khác.
3. **Đọc cấu hình pool** trên con cấp chính: dải + netmask + lease time.
   /24 = tối đa 254 host. 300 thiết bị thì tự nó đã hết IP rồi.
4. **Vá nhanh**, theo thứ tự ca 1: giảm lease → nới pool → cuối cùng mới /23.
5. **Dọn IP tĩnh.** Liệt kê mọi thiết bị đặt tĩnh (camera, máy in, server, AP),
   đẩy ra ngoài pool hoặc chuyển thành reservation. Đây là cách sửa dứt điểm
   trùng IP.
6. **Làm chuẩn.** VLAN theo khu vực, mỗi VLAN một /24 và một pool riêng, cộng
   ACL chặn khách sang mạng nội bộ. Nếu thiết bị không hỗ trợ VLAN thì tối
   thiểu biến mọi router phụ thành AP.

---

## Bảng lệnh tra nhanh

| Việc | Linux | Windows |
|---|---|---|
| Xem IP và DHCP server đã cấp | `ip -4 addr` / `nmcli` | `ipconfig /all` |
| Xin lại IP | `dhclient -r && dhclient` | `ipconfig /release && ipconfig /renew` |
| Xem bảng ARP | `ip neigh` | `arp -a` |
| Dò trùng IP | `arping -D -I <card> <ip>` | `arp -a <ip>` |
| Bắt gói DHCP | `tcpdump -ni <card> 'udp port 67 or 68'` | Wireshark, lọc `bootp` |
| Xem route mặc định | `ip route show default` | `route print` |

Lệnh trên thiết bị Cisco: xem [cisco-ios.md](cisco-ios.md) mục 6.

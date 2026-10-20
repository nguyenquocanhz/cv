# Cấu hình tương đương trên switch và router thật

Lab `lab.sh` dựng VLAN bằng bridge Linux nên **không có phần đóng tag 802.1Q**
trên dây. Phần đó nằm ở đây — cùng một topology, viết bằng Cisco IOS, chạy được
trên switch thật hoặc trong Packet Tracer / GNS3.

```
        R1  (router-on-a-stick + DHCP server)
        │   Gi0/0.10  10.0.10.1/24
        │   Gi0/0.20  10.0.20.1/24
        │   Gi0/0.30  10.0.30.1/24
        │
        │ Gi0/1  ── trunk 802.1Q, tag 10/20/30 ──┐
        │                                        │
       SW1 ─ Gi0/2-12  access VLAN 10  nhân viên
           ─ Gi0/13-18 access VLAN 20  khách
           ─ Gi0/19-24 access VLAN 30  camera
```

---

## 1. Switch — tạo VLAN, chia cổng access, dựng trunk

```
enable
configure terminal
 hostname SW1
!
vlan 10
 name NHAN-VIEN
vlan 20
 name KHACH
vlan 30
 name CAMERA
vlan 999
 name UNUSED
!
! --- cổng xuống máy trạm: access port, chỉ mang 1 VLAN, không tag ---
interface range GigabitEthernet0/2 - 12
 description May nhan vien
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast
!
interface range GigabitEthernet0/13 - 18
 description Wifi khach
 switchport mode access
 switchport access vlan 20
 spanning-tree portfast
!
interface range GigabitEthernet0/19 - 24
 description Camera
 switchport mode access
 switchport access vlan 30
 spanning-tree portfast
!
! --- cổng lên router: trunk, mang cả 3 VLAN, có tag ---
interface GigabitEthernet0/1
 description Uplink len R1
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30
 switchport trunk native vlan 999
!
end
write memory
```

> `switchport trunk encapsulation dot1q` chỉ cần trên switch còn hỗ trợ ISL
> (3560, 3750). Trên 2960 chỉ có dot1q nên switch sẽ báo lỗi câu lệnh này —
> bỏ nó đi, vào thẳng `switchport mode trunk`.

> `native vlan 999` là VLAN rác không dùng. Để native VLAN trùng VLAN đang chạy
> là lỗ hổng VLAN hopping.

---

## 2. Switch — chặn DHCP lậu từ gốc (ca 3 trong lab)

```
configure terminal
 ip dhcp snooping
 ip dhcp snooping vlan 10,20,30
 no ip dhcp snooping information option
!
! CHỈ cổng đi lên router thật mới được phép trả lời DHCP
interface GigabitEthernet0/1
 ip dhcp snooping trust
!
! Cổng máy trạm giới hạn số bản tin DHCP, chống máy bị nhiễm bắn phá pool
interface range GigabitEthernet0/2 - 24
 ip dhcp snooping limit rate 10
!
end
write memory
```

Sau khi bật, cắm router lậu vào cổng bất kỳ từ Gi0/2 trở đi thì switch
**drop thẳng gói DHCP Offer của nó** — máy trạm không bao giờ thấy.

Kiểm tra:

```
show ip dhcp snooping
show ip dhcp snooping binding
```

---

## 3. Router — inter-VLAN routing + DHCP server

```
enable
configure terminal
 hostname R1
!
interface GigabitEthernet0/0
 no ip address
 no shutdown
!
interface GigabitEthernet0/0.10
 encapsulation dot1Q 10
 ip address 10.0.10.1 255.255.255.0
!
interface GigabitEthernet0/0.20
 encapsulation dot1Q 20
 ip address 10.0.20.1 255.255.255.0
!
interface GigabitEthernet0/0.30
 encapsulation dot1Q 30
 ip address 10.0.30.1 255.255.255.0
!
! --- CHỪA DẢI TĨNH RA NGOÀI POOL (đây là cách sửa ca 2) ---
ip dhcp excluded-address 10.0.10.1   10.0.10.99
ip dhcp excluded-address 10.0.10.201 10.0.10.254
ip dhcp excluded-address 10.0.20.1   10.0.20.99
ip dhcp excluded-address 10.0.30.1   10.0.30.99
ip dhcp excluded-address 10.0.30.201 10.0.30.254
!
ip dhcp pool VLAN10-NHANVIEN
 network 10.0.10.0 255.255.255.0
 default-router 10.0.10.1
 dns-server 8.8.8.8 1.1.1.1
 lease 0 2 0
!
ip dhcp pool VLAN20-KHACH
 network 10.0.20.0 255.255.255.0
 default-router 10.0.20.1
 dns-server 8.8.8.8
 lease 0 1 0
!
ip dhcp pool VLAN30-CAMERA
 network 10.0.30.0 255.255.255.0
 default-router 10.0.30.1
 lease 7 0 0
!
end
write memory
```

`lease <ngày> <giờ> <phút>` — `lease 0 2 0` là 2 giờ.
Wifi khách đông người ra vào thì để 1 giờ; camera đứng yên thì để 7 ngày.
**Đây là cách sửa rẻ nhất cho ca 1** khi pool hẹp mà chưa muốn đổi mask.

---

## 4. Router — ghim IP theo MAC (DHCP reservation)

```
configure terminal
ip dhcp pool CAM-TANG-1
 host 10.0.30.101 255.255.255.0
 client-identifier 01de.75e0.2b6f.d7
 default-router 10.0.30.1
!
end
```

`client-identifier` = `01` (mã loại Ethernet) + MAC viết kiểu dotted.
MAC `de:75:e0:2b:6f:d7` → `01de.75e0.2b6f.d7`.

Cách này tốt hơn đặt IP tĩnh trên chính camera: IP vẫn do router quản lý,
đổi dải sau này chỉ phải sửa một chỗ.

---

## 5. Router — khách không được vào mạng nội bộ (ca 4)

```
configure terminal
ip access-list extended KHACH
 deny   ip 10.0.20.0 0.0.0.255 10.0.10.0 0.0.0.255
 deny   ip 10.0.20.0 0.0.0.255 10.0.30.0 0.0.0.255
 permit ip any any
!
interface GigabitEthernet0/0.20
 ip access-group KHACH in
!
end
write memory
```

---

## 6. Lệnh kiểm tra — học thuộc mấy câu này

| Việc cần xem | Lệnh |
|---|---|
| VLAN nào đang có, cổng nào thuộc VLAN nào | `show vlan brief` |
| Trunk có lên không, cho qua VLAN nào | `show interfaces trunk` |
| Máy nào đang giữ IP nào | `show ip dhcp binding` |
| Pool còn bao nhiêu IP trống | `show ip dhcp pool` |
| **Router phát hiện trùng IP** | `show ip dhcp conflict` |
| Xoá bản ghi trùng sau khi sửa xong | `clear ip dhcp conflict *` |
| Trả lại 1 IP đang bị giữ | `clear ip dhcp binding 10.0.10.137` |
| DHCP snooping có chạy không | `show ip dhcp snooping` |
| Router học được MAC nào ở đâu | `show ip arp` |

`show ip dhcp conflict` chính là ca 2 trong lab: router tự ping trước khi cấp,
thấy có người trả lời thì ghi IP đó vào bảng conflict và bỏ qua. Bảng này dài ra
là dấu hiệu rõ ràng rằng có thiết bị đặt IP tĩnh nằm trong pool.

---

## 7. Dựng lại lab này trong Packet Tracer

1. Kéo 1 router **2911**, 1 switch **2960**, 4 PC, 1 laptop, 1 IP camera (hoặc PC thay thế).
2. Nối switch Gi0/1 ↔ router Gi0/0.
3. Dán nguyên mục 1 vào CLI của switch, mục 3 vào CLI của router.
   Nhớ bỏ dòng `switchport trunk encapsulation dot1q` vì 2960 không nhận.
4. Đặt tất cả PC về **DHCP** trong tab Desktop → IP Configuration.
5. Tái hiện ca 1: sửa `ip dhcp excluded-address 10.0.10.1 10.0.10.252`
   cho pool chỉ còn 2 IP rồi bật PC thứ 3 lên.
6. Tái hiện ca 3: kéo thêm 1 **Home Router**, cắm dây vào cổng LAN của nó,
   đầu kia vào switch. Home Router mặc định bật DHCP 192.168.0.0/24.
7. Dùng **Simulation Mode**, lọc chỉ giao thức DHCP, bấm Capture để xem
   từng gói Discover / Offer / Request / Ack đi đâu — thấy rõ hai Offer
   từ hai nguồn khác nhau, đúng như phần bắt gói ở ca 3.

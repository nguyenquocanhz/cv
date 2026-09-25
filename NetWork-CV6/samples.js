/*
 * Dữ liệu mẫu cho tab "Mạng của tôi". Dùng dải tài liệu 2001:db8::/32 và MAC
 * bịa, nên không trùng với mạng thật của ai.
 */
(function (root, data) {
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.NCV6_SAMPLES = data;
})(typeof self !== 'undefined' ? self : this, {
  linux: {
    label: 'Ubuntu — ip addr; ip -6 route',
    text: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host noprefixroute
       valid_lft forever preferred_lft forever
2: enp2s0f2: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:1a:2b:3c:4d:5e brd ff:ff:ff:ff:ff:ff
    inet 192.168.100.169/24 brd 192.168.100.255 scope global enp2s0f2
       valid_lft forever preferred_lft forever
    inet6 2001:db8:c872:19b0::3/128 scope global dynamic noprefixroute
       valid_lft 86316sec preferred_lft 86316sec
    inet6 fd12:3456:789a::3/128 scope global dynamic noprefixroute
       valid_lft 86316sec preferred_lft 86316sec
    inet6 2001:db8:c872:19b0:21a:2bff:fe3c:4d5e/64 scope global dynamic mngtmpaddr noprefixroute
       valid_lft 86398sec preferred_lft 14398sec
    inet6 fe80::21a:2bff:fe3c:4d5e/64 scope link
       valid_lft forever preferred_lft forever
3: wlp3s0: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 02:5a:11:8c:20:7f brd ff:ff:ff:ff:ff:ff
2001:db8:c872:19b0::3 dev enp2s0f2 proto kernel metric 100 pref medium
2001:db8:c872:19b0::/64 dev enp2s0f2 proto ra metric 100 expires 86395sec pref medium
fd12:3456:789a::3 dev enp2s0f2 proto kernel metric 100 pref medium
fe80::/64 dev enp2s0f2 proto kernel metric 256 pref medium
default via fe80::1 dev enp2s0f2 proto ra metric 100 expires 1795sec pref medium`,
  },
  windows: {
    label: 'Windows — ipconfig /all',
    text: `Windows IP Configuration

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   Physical Address. . . . . . . . . : 00-1A-2B-3C-4D-5F
   IPv6 Address. . . . . . . . . . . : 2001:db8:c872:19b0::5(Preferred)
   Temporary IPv6 Address. . . . . . : 2001:db8:c872:19b0:9d4f:1c2a:7e61:b0c3(Preferred)
   Link-local IPv6 Address . . . . . : fe80::9d4f:1c2a:7e61:b0c3%12(Preferred)
   IPv4 Address. . . . . . . . . . . : 192.168.100.25(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : fe80::1%12
                                       192.168.100.1

Tunnel adapter Teredo Tunneling Pseudo-Interface:

   IPv6 Address. . . . . . . . . . . : 2001:0:4136:e378:8000:63bf:3fff:fdd2(Preferred)
   Link-local IPv6 Address . . . . . : fe80::8000:63bf:3fff:fdd2%7(Preferred)`,
  },
  installer: {
    label: 'Trình cài Ubuntu — Info for …',
    text: `Info for enp2s0f2

addresses:
- address: 192.168.100.169/24
  family: 2
  scope: global
  source: static
- address: fe80::21a:2bff:fe3c:4d5e/64
  family: 10
  scope: link
  source: static
- address: 2001:db8:c872:19b0:21a:2bff:fe3c:4d5e/64
  family: 10
  scope: global
  source: dhcp
- address: fd12:3456:789a::3/128
  family: 10
  scope: global
  source: dhcp
- address: 2001:db8:c872:19b0::3/128
  family: 10
  scope: global
  source: dhcp
bond:
  is_master: false
  is_slave: false
netlink_data:
  name: enp2s0f2
type: eth
udev_data:
  ID_MODEL_FROM_DATABASE: RTL810xE PCI Express Fast Ethernet controller
  ID_NET_DRIVER: r8169`,
  },
});

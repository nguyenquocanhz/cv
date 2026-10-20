#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Lab DHCP + VLAN - dung bang Linux network namespace
#
#   So do (router-on-a-stick):
#
#       r1 (router + DHCP server)
#        |  10.0.10.1      10.0.20.1      10.0.30.1
#        +------+-------------+--------------+
#               |             |              |
#            br-v10        br-v20         br-v30     <- moi bridge = 1 VLAN
#          (VLAN 10)     (VLAN 20)      (VLAN 30)       = 1 broadcast domain
#          nhan vien       khach          camera
#               |             |              |
#        pc1 pc2 pc3 pc4     kh1           cam1
#
#   Cach dung:  sudo ./lab.sh up      dung topology + DHCP
#               sudo ./lab.sh ca1     tai hien su co HET IP
#               sudo ./lab.sh ca2     tai hien su co TRUNG IP
#               sudo ./lab.sh ca3     tai hien su co DHCP LAU (rogue)
#               sudo ./lab.sh ca4     kiem chung VLAN co lap broadcast
#               sudo ./lab.sh status  xem trang thai
#               sudo ./lab.sh down    don sach
#               sudo ./lab.sh all     chay lan luot ca 4 ca
# ---------------------------------------------------------------------------
set -uo pipefail
export PATH="$PATH:/usr/sbin:/sbin"

RUN="${LAB_RUN_DIR:-/tmp/lab-mang}"
VLAN_IDS=(10 20 30)
declare -A VLAN_NAME=([10]=nhanvien [20]=khach   [30]=camera)
declare -A VLAN_NET=( [10]=10.0.10  [20]=10.0.20 [30]=10.0.30)
declare -A HOST_VLAN=([pc1]=10 [pc2]=10 [pc3]=10 [pc4]=10 [kh1]=20 [cam1]=30)
HOST_ORDER=(pc1 pc2 pc3 pc4 kh1 cam1)

# Pool mac dinh - cac ca su co se ghi de roi goi dhcp_restart
declare -A P_LO=([10]=100 [20]=100 [30]=100)
declare -A P_HI=([10]=150 [20]=120 [30]=120)
declare -A P_LEASE=([10]=2m [20]=2m [30]=2m)

# mot so container khong co iputils-ping; busybox luon co
if command -v ping >/dev/null 2>&1; then PING=(ping); else PING=(busybox ping); fi

if [ -t 1 ]; then B=$'\e[1m'; R=$'\e[31m'; G=$'\e[32m'; Y=$'\e[33m'; C=$'\e[36m'; Z=$'\e[0m'
else B=; R=; G=; Y=; C=; Z=; fi

step() { printf '\n%s== %s ==%s\n' "$B$C" "$*" "$Z"; }
ok()   { printf '  %s[ok]%s   %s\n'   "$G" "$Z" "$*"; }
bad()  { printf '  %s[loi]%s  %s\n'   "$R" "$Z" "$*"; }
warn() { printf '  %s[chu y]%s %s\n'  "$Y" "$Z" "$*"; }
info() { printf '  %s\n' "$*"; }

need_root() {
  [ "$(id -u)" -eq 0 ] || { echo "Can chay bang root: sudo $0 $*"; exit 1; }
  command -v ip       >/dev/null || { echo "Thieu iproute2:  apt install iproute2"; exit 1; }
  command -v dnsmasq  >/dev/null || { echo "Thieu dnsmasq:   apt install dnsmasq"; exit 1; }
  command -v busybox  >/dev/null || { echo "Thieu busybox:   apt install busybox-static"; exit 1; }
  command -v tcpdump  >/dev/null || { echo "Thieu tcpdump:   apt install tcpdump"; exit 1; }
  command -v iptables >/dev/null || { echo "Thieu iptables:  apt install iptables"; exit 1; }
}

# --- ha tang -----------------------------------------------------------------

write_udhcpc_script() {
  mkdir -p "$RUN"
  cat > "$RUN/udhcpc.sh" <<'EOS'
#!/bin/sh
case "$1" in
  bound|renew)
    ip addr flush dev "$interface" 2>/dev/null
    ip addr add "$ip/${mask:-24}" dev "$interface"
    ip link set "$interface" up
    [ -n "${router:-}" ] && ip route add default via "${router%% *}" dev "$interface" 2>/dev/null
    echo "    -> nhan IP $ip/$mask  gw=${router%% *}  tu server ${serverid:-?}"
    ;;
  deconfig)  ip addr flush dev "$interface" 2>/dev/null ;;
  nak)       echo "    -> bi NAK" ;;
  leasefail) echo "    -> KHONG xin duoc IP" ;;
esac
EOS
  chmod +x "$RUN/udhcpc.sh"
}

dhcp_stop() {
  for f in "$RUN"/dnsmasq-*.pid; do
    [ -e "$f" ] || continue
    kill "$(cat "$f")" 2>/dev/null
    rm -f "$f"
  done
  # dnsmasq lau (ca3) chay trong netns rieng
  ip netns pids rogue 2>/dev/null | xargs -r kill 2>/dev/null
}

topo_down() {
  dhcp_stop
  for h in "${HOST_ORDER[@]}"; do
    ip netns pids "$h" 2>/dev/null | xargs -r kill 2>/dev/null
    ip netns del "$h" 2>/dev/null
  done
  ip netns pids r1 2>/dev/null | xargs -r kill 2>/dev/null
  ip netns del r1 2>/dev/null
  # cam2 va rogue duoc tao them trong ca2 / ca3
  for extra in cam2 rogue; do
    ip netns pids "$extra" 2>/dev/null | xargs -r kill 2>/dev/null
    ip netns del "$extra" 2>/dev/null
    ip link del "sw-$extra" 2>/dev/null
  done
  for v in "${VLAN_IDS[@]}"; do ip link del "br-v$v" 2>/dev/null; done
  rm -rf "$RUN"
}

topo_up() {
  write_udhcpc_script
  ip netns add r1
  ip netns exec r1 ip link set lo up
  ip netns exec r1 sysctl -qw net.ipv4.ip_forward=1

  for v in "${VLAN_IDS[@]}"; do
    ip link add "br-v$v" type bridge
    ip link set "br-v$v" up
    # chan r1 cam vao VLAN nay
    ip link add "r1-v$v" type veth peer name "sw-r$v"
    ip link set "r1-v$v" netns r1
    ip link set "sw-r$v" master "br-v$v" up
    ip netns exec r1 ip addr add "${VLAN_NET[$v]}.1/24" dev "r1-v$v"
    ip netns exec r1 ip link set "r1-v$v" up
  done

  for h in "${HOST_ORDER[@]}"; do
    v="${HOST_VLAN[$h]}"
    ip netns add "$h"
    ip netns exec "$h" ip link set lo up
    ip link add "$h-e0" type veth peer name "sw-$h"
    ip link set "$h-e0" netns "$h"
    ip link set "sw-$h" master "br-v$v" up
    ip netns exec "$h" ip link set "$h-e0" up
  done
}

dhcp_restart() {
  dhcp_stop
  for v in "${VLAN_IDS[@]}"; do
    local net="${VLAN_NET[$v]}"
    ip netns exec r1 dnsmasq \
      --port=0 --interface="r1-v$v" --bind-interfaces \
      --dhcp-range="$net.${P_LO[$v]},$net.${P_HI[$v]},255.255.255.0,${P_LEASE[$v]}" \
      --dhcp-option="3,$net.1" \
      --dhcp-authoritative --log-dhcp \
      --dhcp-leasefile="$RUN/leases-v$v" \
      --log-facility="$RUN/dnsmasq-v$v.log" \
      --pid-file="$RUN/dnsmasq-v$v.pid"
  done
  sleep 0.5
}

# Xin IP cho 1 may. Tra ve 0 neu thanh cong.
ask_ip() {
  local h="$1"
  printf '  %-5s xin IP ...\n' "$h"
  ip netns exec "$h" busybox udhcpc -i "$h-e0" -s "$RUN/udhcpc.sh" \
      -q -n -t 3 -T 2 -f 2>&1 | sed -n 's/^    ->/    ->/p'
  ip netns exec "$h" ip -4 -br addr show "$h-e0" | grep -q '[0-9]' 
}

# Co netem thi lam cham server that de DHCP lau thang chac chan,
# giong doi thuc: con router lau nam ngay canh may, server that o xa hon.
has_netem() { ip netns exec r1 tc qdisc add dev r1-v10 root netem delay 1ms 2>/dev/null \
              && ip netns exec r1 tc qdisc del dev r1-v10 root 2>/dev/null; }

addr_of() { ip netns exec "$1" ip -4 -br addr show "$1-e0" 2>/dev/null | awk '{print $3}'; }
mac_of()  { ip netns exec "$1" cat "/sys/class/net/$1-e0/address" 2>/dev/null; }

# --- cac ca su co ------------------------------------------------------------

cmd_ca1() {
  step "CA 1 - HET IP  (pool qua hep)"
  info "Dat pool VLAN 10 chi con 3 dia chi: 10.0.10.100 - 10.0.10.102"
  info "roi cho 4 may cung xin IP."
  P_LO[10]=100; P_HI[10]=102; dhcp_restart

  local fail=0
  for h in pc1 pc2 pc3 pc4; do
    ip netns exec "$h" ip addr flush dev "$h-e0"
    ask_ip "$h" || { bad "$h KHONG co IP - pool da can"; fail=1; }
  done
  [ "$fail" -eq 1 ] && ok "Tai hien thanh cong: may thu 4 khong xin duoc IP." \
                    || warn "Khong tai hien duoc (kiem tra lai pool)."

  step "CA 1 - CACH SUA"
  info "Cach A: noi pool trong chinh subnet /24 dang co (re nhat, khong doi thiet ke)"
  P_LO[10]=100; P_HI[10]=200; dhcp_restart
  ip netns exec pc4 ip addr flush dev pc4-e0
  ask_ip pc4 && ok "pc4 da co IP sau khi noi pool len 101 dia chi."
  info ""
  info "Cach B: giam lease time (24h -> 2h) de thu hoi IP cua may da tat."
  info "         Trong lab nay lease dang la ${P_LEASE[10]}; tren router that:"
  info "         DHCP lease time 86400 -> 7200."
  info "Cach C: doi mask /24 -> /23 (254 -> 510 host). Chi lam khi A va B khong du,"
  info "         vi broadcast domain to gap doi."
}

cmd_ca2() {
  step "CA 2 - TRUNG IP  (thiet bi tinh nam TRONG pool DHCP)"
  info "cam1 duoc set IP tinh 10.0.30.101 - nam TRONG pool DHCP."
  info "De tai hien chac chan, thu hep pool con dung 1 dia chi: 10.0.30.101."
  P_LO[30]=101; P_HI[30]=101; dhcp_restart

  ip netns exec cam1 ip addr flush dev cam1-e0
  ip netns exec cam1 ip addr add 10.0.30.101/24 dev cam1-e0
  ok "cam1 dang giu 10.0.30.101 (tinh), MAC $(mac_of cam1)"

  info ""
  info "Bay gio camera bi TAT (rut dien / cup dien)."
  ip netns exec cam1 ip link set cam1-e0 down
  ok "cam1 da tat."

  info ""
  info "Mot may khac cam vao cung VLAN 30 va xin IP."
  # muon pc4 sang VLAN 30 cho giong doi thuc: dung ngay cam1 thu 2
  ip netns add cam2 2>/dev/null
  ip netns exec cam2 ip link set lo up
  ip link add cam2-e0 type veth peer name sw-cam2 2>/dev/null
  ip link set cam2-e0 netns cam2 2>/dev/null
  ip link set sw-cam2 master br-v30 up
  ip netns exec cam2 ip link set cam2-e0 up
  printf '  %-5s xin IP ...\n' cam2
  ip netns exec cam2 busybox udhcpc -i cam2-e0 -s "$RUN/udhcpc.sh" -q -n -t 3 -T 2 -f 2>&1 \
    | sed -n 's/^    ->/    ->/p'
  local a2; a2=$(ip netns exec cam2 ip -4 -br addr show cam2-e0 | awk '{print $3}')

  info ""
  info "Camera duoc cap dien lai."
  ip netns exec cam1 ip link set cam1-e0 up
  sleep 0.5

  step "CA 2 - KET QUA"
  info "cam1 (tinh)  : 10.0.30.101/24   MAC $(mac_of cam1)"
  info "cam2 (DHCP)  : ${a2:-khong co}  MAC $(mac_of cam2)"
  if [ "${a2%%/*}" = "10.0.30.101" ]; then
    bad "TRUNG IP: hai thiet bi cung giu 10.0.30.101"
  else
    warn "Khong tai hien duoc - cam2 nhan $a2, kiem tra lai pool."
    return 1
  fi

  info ""
  info "Vi sao router cap di dia chi dang co chu? Vi luc do camera DANG TAT."
  info "dnsmasq ping thu dia chi truoc khi cap; khong ai tra loi nen no coi la trong."
  info "Camera bat len lai thi da muon - hai thiet bi cung mot IP."

  info ""
  info "Phat hien bang ARP - mot IP tra ve hai MAC khac nhau:"
  ip netns exec r1 ip neigh flush all
  ip netns exec r1 timeout 3 busybox arping -c 3 -I r1-v30 10.0.30.101 2>&1 | sed 's/^/    /'
  info ""
  info "Tren may Windows lenh tuong duong la:  arp -a 10.0.30.101"

  step "CA 2 - CACH SUA"
  info "Cach dung: day dai tinh RA NGOAI pool DHCP."
  info "  pool  10.0.30.100 - 10.0.30.200   <- DHCP tu cap"
  info "  tinh  10.0.30.201 - 10.0.30.254   <- camera, may in, server, AP"
  P_LO[30]=100; P_HI[30]=200; dhcp_restart
  ip netns exec cam1 ip addr flush dev cam1-e0
  ip netns exec cam1 ip addr add 10.0.30.201/24 dev cam1-e0
  ip netns exec cam2 ip addr flush dev cam2-e0
  printf '  %-5s xin IP ...\n' cam2
  ip netns exec cam2 busybox udhcpc -i cam2-e0 -s "$RUN/udhcpc.sh" -q -n -t 3 -T 2 -f 2>&1 \
    | sed -n 's/^    ->/    ->/p'
  ok "cam1 tinh 10.0.30.201 (ngoai pool), cam2 lay DHCP - khong con dung nhau."
  info ""
  info "Cach 2 (tot hon): DHCP reservation - gan cung IP theo MAC tren router."
  info "  dnsmasq : --dhcp-host=$(mac_of cam1),10.0.30.101"
  info "  Cisco   : ip dhcp pool CAM / host 10.0.30.101 255.255.255.0 / client-identifier ..."
}

cmd_ca3() {
  step "CA 3 - DHCP LAU  (co nguoi cam them router vao cong LAN)"
  P_LO[10]=100; P_HI[10]=150; dhcp_restart
  info "Router that cap dai 10.0.10.0/24 tu 10.0.10.1"

  info ""
  info "Gio cam them 1 con router gia re vao switch VLAN 10 (cam nham cong LAN),"
  info "no cung phat DHCP, dai 192.168.1.0/24."
  ip netns add rogue 2>/dev/null
  ip netns exec rogue ip link set lo up
  ip link add rogue-e0 type veth peer name sw-rogue 2>/dev/null
  ip link set rogue-e0 netns rogue 2>/dev/null
  ip link set sw-rogue master br-v10 up
  ip netns exec rogue ip addr add 192.168.1.1/24 dev rogue-e0
  ip netns exec rogue ip link set rogue-e0 up
  ip netns exec rogue dnsmasq --port=0 --interface=rogue-e0 --bind-interfaces \
      --dhcp-range=192.168.1.100,192.168.1.150,255.255.255.0,2m \
      --dhcp-option=3,192.168.1.1 --dhcp-authoritative \
      --dhcp-leasefile="$RUN/leases-rogue" \
      --log-facility="$RUN/dnsmasq-rogue.log" \
      --pid-file="$RUN/dnsmasq-rogue.pid"
  sleep 0.5
  bad "DHCP lau dang chay tai 192.168.1.1 tren VLAN 10"

  # --- bang chung chac chan: mot cau hoi, hai noi tra loi --------------------
  step "CA 3 - BAT GOI DE CO BANG CHUNG"
  info "Cho pc1 xin IP va bat goi DHCP cung luc."
  ip netns exec pc1 ip addr flush dev pc1-e0
  ip netns exec pc1 timeout 8 tcpdump -ni pc1-e0 -l 'udp port 67 or udp port 68' \
      > "$RUN/dhcp-capture.txt" 2>/dev/null &
  local tp=$!
  sleep 1
  ip netns exec pc1 busybox udhcpc -i pc1-e0 -s "$RUN/udhcpc.sh" -q -n -t 3 -T 2 -f >/dev/null 2>&1
  wait $tp 2>/dev/null
  sed 's/^/    /' "$RUN/dhcp-capture.txt"
  local servers
  servers=$(grep -oE '^[0-9:.]+ IP [0-9.]+\.67' "$RUN/dhcp-capture.txt" \
            | awk '{print $3}' | sed 's/\.67$//' | sort -u)
  local nsrv; nsrv=$(printf '%s\n' "$servers" | grep -c .)
  info ""
  info "So DHCP server da tra loi: $nsrv"
  printf '%s\n' "$servers" | sed 's/^/      /'
  if [ "$nsrv" -ge 2 ]; then
    ok "Mot cau hoi, HAI noi tra loi -> chac chan co DHCP lau. Day la bang chung."
  else
    warn "Chi thay $nsrv server - bat lai hoac tang thoi gian bat goi."
  fi

  # --- hau qua ---------------------------------------------------------------
  step "CA 3 - HAU QUA: may an nham IP cua ai?"
  info "May lay IP cua thang tra loi TRUOC - day la mot cuoc dua, khong chac chan."
  local slowed=0
  if has_netem; then
    ip netns exec r1 tc qdisc add dev r1-v10 root netem delay 60ms 2>/dev/null
    slowed=1
    info "Kernel nay co netem -> lam cham server that 60ms de con lau thang chac chan"
    info "(giong doi thuc: router lau cam ngay trong phong, server that o xa hon)."
  fi

  local rogue_hit=0 round=0
  while [ "$rogue_hit" -eq 0 ] && [ "$round" -lt 5 ]; do
    round=$((round+1))
    [ "$slowed" -eq 0 ] && [ "$round" -gt 1 ] && info "  -- vong $round --"
    for h in pc1 pc2 pc3 pc4; do
      ip netns exec "$h" ip addr flush dev "$h-e0"
      ask_ip "$h" >/dev/null 2>&1
      local a; a=$(addr_of "$h")
      if [[ "$a" == 192.168.1.* ]]; then
        bad "$h  $a  <- dinh DHCP lau, gateway sai, khong ra duoc mang cong ty"
        rogue_hit=1
      else
        ok "$h  ${a:-khong co IP}"
      fi
    done
    [ "$slowed" -eq 1 ] && break
  done

  if [ "$rogue_hit" -eq 0 ]; then
    warn "Lan nay server that tra loi nhanh hon nen khong may nao dinh."
    info "    Day KHONG phai la lab hong - do la ban chat cua su co nay:"
    info "    hom nay may chay binh thuong, mai cam lai day la hong."
    info "    Bang chung that nam o phan bat goi ben tren: hai server cung tra loi."
  fi

  step "CA 3 - CACH PHAT HIEN TREN MAY THAT"
  info "Tren Windows:  ipconfig /all   -> doc dong \"DHCP Server\""
  info "Chay o 3-4 cho khac nhau trong cong ty. Ra HAI dia chi khac nhau = co DHCP lau."
  info ""
  info "Tren Linux:    journalctl -u NetworkManager | grep -i dhcp"
  info "Bat goi:       tcpdump -ni <card> 'udp port 67 or udp port 68'"
  info "               Thay hai dia chi nguon khac nhau o cac goi Reply = co lau."
  info ""
  info "Trang thai hien tai cua 4 may:"
  for h in pc1 pc2 pc3 pc4; do
    printf '    %-5s %-18s gateway: %s\n' "$h" "$(addr_of "$h")" \
      "$(ip netns exec "$h" ip route show default 2>/dev/null | awk '{print $3}')"
  done

  step "CA 3 - CACH SUA"
  info "1. Rut con router lau ra, hoac bien no thanh AP thuan:"
  info "   - tat DHCP server tren no"
  info "   - dat IP tinh cung dai cong ty, ngoai pool DHCP"
  info "   - cam day uplink vao cong LAN, KHONG cam vao cong WAN"
  info "2. Tren switch quan ly duoc, bat DHCP snooping de chan tu goc:"
  info "   ip dhcp snooping"
  info "   ip dhcp snooping vlan 10,20,30"
  info "   interface Gi0/1          <- cong di len router that"
  info "    ip dhcp snooping trust  <- chi cong nay duoc phep tra loi DHCP"
  info ""
  ip netns pids rogue 2>/dev/null | xargs -r kill 2>/dev/null
  ip netns del rogue 2>/dev/null
  ip link del sw-rogue 2>/dev/null
  ip netns exec r1 tc qdisc del dev r1-v10 root 2>/dev/null
  ok "Da go DHCP lau."
  for h in pc1 pc2 pc3 pc4; do
    ip netns exec "$h" ip addr flush dev "$h-e0"
    ask_ip "$h" >/dev/null 2>&1
    info "    $h -> $(addr_of "$h")"
  done
  ok "Tat ca ve dung dai 10.0.10.0/24."
}

cmd_ca4() {
  step "CA 4 - VLAN co lap broadcast den dau?"
  ip netns exec r1 iptables -F FORWARD          # xoa rule cua lan chay truoc
  P_LO[10]=100; P_HI[10]=150; P_LO[20]=100; P_HI[20]=120; dhcp_restart
  for h in pc1 kh1; do
    ip netns exec "$h" ip addr flush dev "$h-e0"
    ask_ip "$h" >/dev/null 2>&1
  done
  info "pc1 (VLAN 10 nhan vien): $(addr_of pc1)"
  info "kh1 (VLAN 20 khach)    : $(addr_of kh1)"

  info ""
  info "1) ARP broadcast co vuot VLAN khong?"
  ip netns exec kh1 timeout 4 tcpdump -ni kh1-e0 arp -c 5 > "$RUN/arp-v20.txt" 2>/dev/null &
  local tp=$!
  sleep 0.5
  ip netns exec pc1 timeout 3 busybox arping -c 3 -I pc1-e0 "${VLAN_NET[10]}.1" >/dev/null 2>&1
  wait $tp 2>/dev/null
  local n; n=$(grep -c 'ARP' "$RUN/arp-v20.txt" 2>/dev/null); n=${n:-0}
  if [ "$n" -eq 0 ]; then
    ok "KHONG. kh1 o VLAN 20 khong nghe duoc 1 goi ARP nao cua VLAN 10."
    info "    Day chinh la tac dung chinh cua VLAN: cat broadcast domain."
  else
    bad "Co $n goi lot sang - topology dang sai."
  fi

  info ""
  info "2) Hai VLAN co ping duoc nhau khong? (router dang bat ip_forward)"
  if ip netns exec kh1 timeout 3 "${PING[@]}" -c 2 -W 1 "$(addr_of pc1 | cut -d/ -f1)" >/dev/null 2>&1; then
    warn "CO. Khach ping thang vao may nhan vien duoc."
    info "    Chia VLAN thoi CHUA du - router van dinh tuyen giua cac VLAN."
  else
    info "    Khong ping duoc."
  fi

  step "CA 4 - CHAN KHACH SANG MANG NHAN VIEN"
  ip netns exec r1 iptables -I FORWARD -i r1-v20 -o r1-v10 -j DROP
  ip netns exec r1 iptables -I FORWARD -i r1-v20 -o r1-v30 -j DROP
  ok "Da them rule chan VLAN 20 -> VLAN 10 va VLAN 30."
  if ip netns exec kh1 timeout 3 "${PING[@]}" -c 2 -W 1 "$(addr_of pc1 | cut -d/ -f1)" >/dev/null 2>&1; then
    bad "Van ping duoc - rule chua an."
  else
    ok "Khach khong con ping sang mang nhan vien."
  fi
  info ""
  info "Tren router Cisco rule tuong duong:"
  info "  ip access-list extended KHACH-RA-INTERNET"
  info "   deny   ip 10.0.20.0 0.0.0.255 10.0.10.0 0.0.0.255"
  info "   deny   ip 10.0.20.0 0.0.0.255 10.0.30.0 0.0.0.255"
  info "   permit ip any any"
  info "  interface GigabitEthernet0/0.20"
  info "   ip access-group KHACH-RA-INTERNET in"
}

cmd_status() {
  step "TRANG THAI LAB"
  ip netns list >/dev/null 2>&1 || { echo "chua dung lab"; return; }
  printf '  %-6s %-10s %-20s %s\n' MAY VLAN "DIA CHI" MAC
  printf '  %-6s %-10s %-20s %s\n' r1 "-" \
    "$(ip netns exec r1 ip -4 -br addr 2>/dev/null | awk '$1!="lo"{printf "%s ", $3}')" ""
  for h in "${HOST_ORDER[@]}"; do
    ip netns list | grep -q "^$h" || continue
    local v="${HOST_VLAN[$h]}"
    printf '  %-6s %-10s %-20s %s\n' "$h" "$v ${VLAN_NAME[$v]}" "$(addr_of "$h")" "$(mac_of "$h")"
  done
  echo
  for v in "${VLAN_IDS[@]}"; do
    [ -s "$RUN/leases-v$v" ] || continue
    echo "  Lease VLAN $v (${VLAN_NET[$v]}.${P_LO[$v]}-${P_HI[$v]}):"
    sed 's/^/    /' "$RUN/leases-v$v"
  done
}

# --- dieu phoi ---------------------------------------------------------------

case "${1:-}" in
  up)     need_root; topo_down; topo_up; dhcp_restart
          ok "Lab da san sang."; cmd_status ;;
  ca1)    need_root; cmd_ca1 ;;
  ca2)    need_root; cmd_ca2 ;;
  ca3)    need_root; cmd_ca3 ;;
  ca4)    need_root; cmd_ca4 ;;
  all)    need_root; topo_down; topo_up; dhcp_restart
          cmd_ca1; cmd_ca2; cmd_ca3; cmd_ca4
          step "XONG - don dep bang: sudo $0 down" ;;
  status) need_root; cmd_status ;;
  down)   need_root; topo_down; ok "Da don sach." ;;
  *)      sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//' ;;
esac

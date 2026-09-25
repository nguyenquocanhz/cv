// Chạy: node --test NetWork-CV6/tests/ipv6.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const V6 = require('../ipv6.js');
const SAMPLES = require('../samples.js');

const val = s => {
  const p = V6.parse(s);
  assert.ok(p.ok, `${s}: ${p.error}`);
  return p.value;
};

test('rút gọn theo RFC 5952', () => {
  const cases = [
    ['2001:0db8:0000:0000:0000:0000:0000:0001', '2001:db8::1'],
    ['2001:db8:0:0:1:0:0:1', '2001:db8::1:0:0:1'],       // hai chuỗi 0 dài bằng nhau: rút chuỗi đầu
    ['2001:db8::1:0:0:0:1', '2001:db8:0:1::1'],         // rút chuỗi dài nhất
    ['2001:db8:0:1:1:1:1:1', '2001:db8:0:1:1:1:1:1'],   // một nhóm 0 thì không rút
    ['1:2:3:4:5:6:7::', '1:2:3:4:5:6:7:0'],
    ['0:0:0:0:0:0:0:0', '::'],
    ['::1', '::1'],
    ['FE80::0001', 'fe80::1'],
    ['::ffff:192.0.2.1', '::ffff:c000:201'],
    ['[2001:db8::1]:443', '2001:db8::1'],
  ];
  for (const [input, want] of cases) assert.equal(V6.compress(val(input)), want, input);
});

test('dạng đầy đủ và dạng kèm IPv4', () => {
  assert.equal(V6.expand(val('2001:db8::1')), '2001:0db8:0000:0000:0000:0000:0000:0001');
  assert.equal(V6.mixed(val('::ffff:c000:201')), '::ffff:192.0.2.1');
  assert.equal(V6.mixed(val('64:ff9b::c000:221')), '64:ff9b::192.0.2.33');
});

test('prefix và zone', () => {
  const p = V6.parse('fe80::1%enp2s0f2/64');
  assert.ok(p.ok);
  assert.equal(p.prefix, 64);
  assert.equal(p.zone, 'enp2s0f2');
});

test('từ chối địa chỉ sai', () => {
  const bad = ['', '1::2::3', '12345::', '1:2:3:4:5:6:7', '1:2:3:4:5:6:7:8:9', 'g::1', '::1/129',
    '1:2:3:4:5:6:7:8::', '::1.2.3.256', ':1::', '1::2:', ':::', '1.2.3.4::', '192.168.1.1', '::01.2.3.4'];
  for (const s of bad) assert.equal(V6.parse(s).ok, false, s);
  assert.match(V6.parse('192.168.1.1').error, /::ffff:192\.168\.1\.1/);
});

test('phân loại theo sổ đăng ký IANA', () => {
  const cases = [
    ['::', 'special'], ['::1', 'loopback'], ['::ffff:1.2.3.4', 'mapped'],
    ['64:ff9b::1.2.3.4', 'nat64'], ['2001::1', 'tunnel'], ['2002::1', 'tunnel'],
    ['2001:db8::1', 'doc'], ['3fff::1', 'doc'], ['fc00::1', 'ula'], ['fd12:3456:789a::3', 'ula'],
    ['fe80::1', 'link'], ['ff02::1', 'multicast'], ['2405:4803::1', 'global'], ['4000::1', 'reserved'],
  ];
  for (const [s, cat] of cases) assert.equal(V6.analyze(s).type.cat, cat, s);
  assert.equal(V6.analyze('fd00::1').type.cidr, 'fd00::/8');   // lấy dải cụ thể nhất
  assert.equal(V6.analyze('2001::1').type.cidr, '2001::/32');
});

test('EUI-64: suy ngược MAC và cảnh báo lộ MAC', () => {
  const r = V6.analyze('2001:db8:c872:19b0:3697:f6ff:fe17:46ee/64');
  assert.equal(r.iid.kind, 'eui64');
  assert.equal(r.iid.mac, '34:97:f6:17:46:ee');
  assert.equal(r.iid.macLocal, false);
  assert.ok(r.notes.some(n => n.level === 'bad'));
  assert.equal(V6.compress(r.network), '2001:db8:c872:19b0::');

  const ll = V6.analyze('fe80::21a:2bff:fe3c:4d5e');
  assert.equal(ll.iid.mac, '00:1a:2b:3c:4d:5e');
  assert.ok(!ll.notes.some(n => n.level === 'bad'));

  const mac = V6.parseMac('00-1A-2B-3C-4D-5E');
  assert.deepEqual(mac, [0x00, 0x1a, 0x2b, 0x3c, 0x4d, 0x5e]);
  assert.equal(V6.compress(V6.eui64(mac)), '::21a:2bff:fe3c:4d5e');
  assert.equal(V6.parseMac('3497.f617.46ee').length, 6);
  assert.equal(V6.parseMac('0:1:2:3:4:5'), null);
});

test('các kiểu Interface ID khác', () => {
  assert.equal(V6.analyze('2001:db8::3').iid.kind, 'low');
  assert.equal(V6.analyze('2001:db8::c0a8:101').iid.kind, 'low32');
  assert.equal(V6.analyze('2001:db8::5efe:c000:201').iid.kind, 'isatap');
  assert.equal(V6.analyze('2001:db8::9d4f:1c2a:7e61:b0c3').iid.kind, 'random');
  assert.equal(V6.analyze('2001:db8:abcd::/48').iid, null);  // cả khối mạng, không phải một máy
});

test('giải mã Teredo, 6to4, NAT64', () => {
  const t = V6.analyze('2001:0:4136:e378:8000:63bf:3fff:fdd2').embedded;
  assert.equal(t.server, '65.54.227.120');
  assert.equal(t.client, '192.0.2.45');
  assert.equal(t.port, 40000);
  assert.equal(V6.analyze('2002:c000:204::1').embedded.ipv4, '192.0.2.4');
  assert.equal(V6.analyze('64:ff9b::192.0.2.33').embedded.ipv4, '192.0.2.33');
});

test('multicast', () => {
  const a = V6.analyze('ff02::1').multicast;
  assert.equal(a.scope, 2);
  assert.match(a.group, /all-nodes/);
  assert.equal(a.mac, '33:33:00:00:00:01');
  const sn = V6.analyze('ff02::1:ff3c:4d5e').multicast;
  assert.ok(sn.solicited);
  assert.equal(V6.analyze('ff05::1:3').multicast.group, 'DHCPv6 — mọi server trong site');
  assert.match(V6.analyze('ff02::1:3').multicast.group, /LLMNR/);
});

test('solicited-node, reverse DNS', () => {
  assert.equal(V6.compress(V6.solicitedNode(val('2001:db8::21a:2bff:fe3c:4d5e'))), 'ff02::1:ff3c:4d5e');
  assert.equal(V6.reverseName(val('2001:db8::1')),
    '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa');
  assert.deepEqual(V6.reverseZone(val('2001:db8::'), 32), { name: '8.b.d.0.1.0.0.2.ip6.arpa', aligned: true, count: 1 });
  assert.equal(V6.reverseZone(val('2001:db8::'), 30).count, 4);
});

test('khối mạng và chia subnet', () => {
  const r = V6.analyze('2001:db8:abcd:12::1/56');
  assert.equal(V6.compress(r.network), '2001:db8:abcd::');
  assert.equal(V6.compress(r.last), '2001:db8:abcd:ff:ffff:ffff:ffff:ffff');
  assert.equal(r.count64, 256n);
  const net = val('2001:db8:abcd::');
  assert.equal(V6.subnetCount(48, 64), 65536n);
  assert.equal(V6.compress(V6.nthSubnet(net, 48, 64, 255n)), '2001:db8:abcd:ff::');
  assert.equal(V6.compress(V6.nthSubnet(net, 48, 52, 1n)), '2001:db8:abcd:1000::');
  assert.equal(V6.fmtBig(65536n), '65.536');
  assert.equal(V6.approx(1n << 64n), '≈ 1,8 × 10¹⁹');
});

test('đọc output ip addr + ip -6 route', () => {
  const scan = V6.scanText(SAMPLES.linux.text);
  assert.equal(scan.lan4, '192.168.100.0/24');
  const addrs = scan.entries.filter(e => e.role === 'addr');
  assert.equal(addrs.length, 5);
  assert.ok(addrs.every(e => e.iface === (V6.compress(e.value) === '::1' ? 'lo' : 'enp2s0f2')));
  const gw = scan.entries.find(e => e.role === 'gateway');
  assert.equal(V6.compress(gw.value), 'fe80::1');
  assert.equal(gw.iface, 'enp2s0f2');
  assert.deepEqual(addrs.find(e => e.prefix === 64 && V6.compress(e.value).startsWith('2001')).flags,
    ['dynamic', 'mngtmpaddr', 'noprefixroute']);

  const res = V6.analyzeNetwork(scan);
  const ids = res.findings.map(f => f.id);
  for (const id of ['gua-exposed', 'eui64-public', 'dhcpv6', 'ula', 'gateway']) assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes('privacy-on'));
  assert.equal(res.findings[0].level, 'bad');
  assert.deepEqual(res.summary, { total: 5, gua: 2, ula: 1, link: 1, eui: 1, ifaces: ['lo', 'enp2s0f2'] });
  assert.deepEqual(res.fixes.map(f => f.key), ['ufw', 'ss', 'disable', 'privacy']);
  const fix = Object.fromEntries(res.fixes.map(f => [f.key, f]));
  assert.match(fix.ufw.code, /192\.168\.100\.0\/24/);
  assert.match(fix.disable.code, /ethernets:\n {4}enp2s0f2:/);
});

test('đọc output ipconfig của Windows', () => {
  const scan = V6.scanText(SAMPLES.windows.text);
  assert.equal(scan.lan4, '192.168.100.0/24');
  const gw = scan.entries.filter(e => e.role === 'gateway');
  assert.equal(gw.length, 1);
  assert.equal(gw[0].zone, '12');
  const temp = scan.entries.find(e => e.flags.includes('temporary'));
  assert.equal(V6.compress(temp.value), '2001:db8:c872:19b0:9d4f:1c2a:7e61:b0c3');
  assert.equal(temp.iface, 'Ethernet');
  const ids = V6.analyzeNetwork(scan).findings.map(f => f.id);
  for (const id of ['privacy-on', 'tunnel', 'gua-exposed']) assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes('eui64-public'));
});

test('đọc trang Info của trình cài Ubuntu', () => {
  const scan = V6.scanText(SAMPLES.installer.text);
  assert.equal(scan.lan4, '192.168.100.0/24');
  assert.equal(scan.entries.length, 4);
  assert.ok(scan.entries.every(e => e.iface === 'enp2s0f2'));
  assert.equal(scan.entries.find(e => e.prefix === 128 && V6.compress(e.value).startsWith('fd')).source, 'dhcp');
});

test('không bắt nhầm MAC, giờ, chữ thường', () => {
  const scan = V6.scanText('link/ether 34:97:f6:17:46:ee brd ff:ff:ff:ff:ff:ff\n9:15:32 AM\nstd::string dead:beef');
  assert.equal(scan.entries.length, 0);
  assert.equal(V6.analyzeNetwork(scan).findings[0].id, 'none');
});

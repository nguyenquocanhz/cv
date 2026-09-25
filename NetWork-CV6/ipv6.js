/*
 * NetWork-CV6 — lõi phân tích IPv6.
 *
 * Không đụng tới DOM nên dùng chung được cho trang web (window.IPv6) và cho
 * test chạy bằng Node (require). Mọi địa chỉ được giữ ở dạng BigInt 128 bit.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IPv6 = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAX = (1n << 128n) - 1n;
  const LOW64 = (1n << 64n) - 1n;
  const LOW32 = 0xffffffffn;

  // ---------------------------------------------------------------- đọc, viết

  function fail(error) {
    return { ok: false, error };
  }

  function parseIPv4(s) {
    const parts = s.split('.');
    if (parts.length !== 4) return null;
    let n = 0;
    for (const p of parts) {
      if (!/^(0|[1-9]\d{0,2})$/.test(p) || Number(p) > 255) return null;
      n = n * 256 + Number(p);
    }
    return n;
  }

  function formatIPv4(n) {
    n = Number(n);
    return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }

  function parse(input) {
    let s = String(input == null ? '' : input).trim();
    if (!s) return fail('Chưa nhập địa chỉ.');

    const bracket = s.match(/^\[([^\]]*)\](?::\d{1,5})?$/);
    if (bracket) s = bracket[1];

    let prefix = null;
    const slash = s.indexOf('/');
    if (slash !== -1) {
      const p = s.slice(slash + 1);
      s = s.slice(0, slash);
      if (!/^\d{1,3}$/.test(p) || Number(p) > 128) {
        return fail(`Prefix "/${p}" không hợp lệ: phải là số từ 0 đến 128.`);
      }
      prefix = Number(p);
    }

    let zone = null;
    const pct = s.indexOf('%');
    if (pct !== -1) {
      zone = s.slice(pct + 1);
      s = s.slice(0, pct);
      if (!/^[\w.\-]+$/.test(zone)) return fail('Zone ID sau dấu "%" không hợp lệ.');
    }

    if (!s) return fail('Thiếu phần địa chỉ.');
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) {
      return fail(`Đây là địa chỉ IPv4. Muốn xem dạng IPv6 tương ứng thì nhập ::ffff:${s}`);
    }
    const bad = s.match(/[^0-9a-fA-F:.]/);
    if (bad) {
      return fail(`Ký tự "${bad[0]}" không hợp lệ. IPv6 chỉ gồm chữ số hex 0-9, a-f và dấu ":" (thêm dấu "." nếu cuối địa chỉ là IPv4).`);
    }
    if (!s.includes(':')) return fail('Địa chỉ IPv6 phải có dấu ":".');

    let v4 = null;
    const lastColon = s.lastIndexOf(':');
    const tailText = s.slice(lastColon + 1);
    if (tailText.includes('.')) {
      v4 = parseIPv4(tailText);
      if (v4 === null) return fail(`Phần IPv4 "${tailText}" không hợp lệ.`);
      s = s.slice(0, lastColon + 1) + '0:0';
    } else if (s.includes('.')) {
      return fail('IPv4 nhúng chỉ được đặt ở cuối địa chỉ.');
    }

    const halves = s.split('::');
    if (halves.length > 2) return fail('Dấu "::" chỉ được dùng một lần.');
    const head = halves[0] ? halves[0].split(':') : [];
    const tail = halves.length === 2 ? (halves[1] ? halves[1].split(':') : []) : null;
    for (const g of tail ? head.concat(tail) : head) {
      if (g === '') return fail('Có nhóm bị trống: kiểm tra dấu ":" thừa ở đầu hoặc cuối.');
      if (g.length > 4) return fail(`Nhóm "${g}" dài quá 4 chữ số hex.`);
    }

    let groups;
    if (tail === null) {
      if (head.length !== 8) {
        return fail(`Có ${head.length} nhóm, cần đủ 8 nhóm (hoặc dùng "::" để rút gọn các nhóm 0).`);
      }
      groups = head;
    } else {
      const missing = 8 - head.length - tail.length;
      if (missing < 1) return fail('Đã đủ 8 nhóm nên không được dùng thêm "::".');
      groups = head.concat(new Array(missing).fill('0'), tail);
    }

    let value = 0n;
    for (const g of groups) value = (value << 16n) | BigInt(parseInt(g, 16));
    if (v4 !== null) value |= BigInt(v4);
    return { ok: true, value, prefix, zone };
  }

  function toGroups(v) {
    const g = new Array(8);
    for (let i = 7; i >= 0; i--) {
      g[i] = Number(v & 0xffffn);
      v >>= 16n;
    }
    return g;
  }

  // RFC 5952: bỏ số 0 đầu nhóm, thay chuỗi nhóm 0 dài nhất (từ 2 nhóm trở lên,
  // chuỗi đầu tiên nếu bằng nhau) bằng "::", viết thường.
  function compressGroups(g) {
    let bestStart = -1;
    let bestLen = 0;
    for (let i = 0; i < g.length;) {
      if (g[i] !== 0) { i++; continue; }
      let j = i;
      while (j < g.length && g[j] === 0) j++;
      if (j - i > bestLen) { bestStart = i; bestLen = j - i; }
      i = j;
    }
    const hex = g.map(x => x.toString(16));
    if (bestLen < 2) return hex.join(':');
    return hex.slice(0, bestStart).join(':') + '::' + hex.slice(bestStart + bestLen).join(':');
  }

  function compress(v) {
    return compressGroups(toGroups(v));
  }

  function expand(v) {
    return toGroups(v).map(x => x.toString(16).padStart(4, '0')).join(':');
  }

  // Dạng "::ffff:192.0.2.1" — 96 bit đầu viết hex, 32 bit cuối viết IPv4.
  function mixed(v) {
    const head = compressGroups(toGroups(v).slice(0, 6));
    return (head.endsWith('::') ? head : head + ':') + formatIPv4(v & LOW32);
  }

  function mask(prefix) {
    if (prefix <= 0) return 0n;
    return ((1n << BigInt(prefix)) - 1n) << BigInt(128 - prefix);
  }

  // ---------------------------------------------------------------- phân loại

  const SCOPES = {
    host: 'Trong máy',
    link: 'Liên kết — một đoạn mạng',
    site: 'Nội bộ — site, tổ chức',
    global: 'Toàn cầu',
    none: '—',
  };

  // cidr, tên, nhóm, phạm vi, ra Internet được không, RFC, ghi chú, có Interface ID 64 bit không
  const R = (cidr, name, cat, scope, internet, rfc, note, iid = false) =>
    ({ cidr, name, cat, scope, internet, rfc, note, iid });

  const REGISTRY = [
    R('::/128', 'Địa chỉ không xác định (unspecified)', 'special', 'none', false, 'RFC 4291',
      'Dùng làm địa chỉ nguồn khi máy chưa có IP, ví dụ lúc kiểm tra trùng địa chỉ. Không gán cho interface nào.'),
    R('::1/128', 'Loopback', 'loopback', 'host', false, 'RFC 4291',
      'Tương đương 127.0.0.1 — gói tin không rời khỏi máy.'),
    R('::ffff:0:0/96', 'IPv4-mapped', 'mapped', 'host', false, 'RFC 4291',
      'Cách socket IPv6 biểu diễn một kết nối IPv4 trên máy dual-stack. Không xuất hiện trên đường truyền.'),
    R('::/96', 'IPv4-compatible (đã bỏ)', 'deprecated', 'none', false, 'RFC 4291',
      'Cơ chế chuyển tiếp đời đầu, đã bị bãi bỏ.'),
    R('64:ff9b::/96', 'NAT64 — prefix chuẩn', 'nat64', 'global', true, 'RFC 6052',
      'Máy chỉ có IPv6 dùng prefix này để truy cập website IPv4 qua NAT64/DNS64 — hay gặp trên mạng di động.'),
    R('64:ff9b:1::/48', 'NAT64 — dùng nội bộ', 'nat64', 'site', false, 'RFC 8215',
      'Prefix NAT64 cho mạng nội bộ của nhà vận hành.'),
    R('100::/64', 'Discard-only', 'special', 'none', false, 'RFC 6666',
      'Traffic gửi tới đây bị bỏ đi (blackhole) — dùng khi chống DDoS.'),
    R('2001::/23', 'Dải giao thức IETF', 'special', 'global', null, 'RFC 2928',
      'Dành cho các giao thức đặc biệt do IETF định nghĩa.'),
    R('2001::/32', 'Teredo', 'tunnel', 'global', true, 'RFC 4380',
      'Đường hầm IPv6 bọc trong UDP/IPv4 để xuyên NAT. Đã lỗi thời.'),
    R('2001:1::1/128', 'Anycast Port Control Protocol', 'special', 'global', true, 'RFC 7723',
      'Địa chỉ anycast của PCP.'),
    R('2001:1::2/128', 'Anycast TURN', 'special', 'global', true, 'RFC 8155',
      'Địa chỉ anycast để tìm server TURN.'),
    R('2001:2::/48', 'Benchmarking', 'special', 'none', false, 'RFC 5180',
      'Dành cho đo kiểm thiết bị trong phòng lab.', true),
    R('2001:3::/32', 'AMT', 'special', 'global', true, 'RFC 7450',
      'Automatic Multicast Tunneling.'),
    R('2001:4:112::/48', 'AS112-v6', 'special', 'global', true, 'RFC 7535',
      'Hút các truy vấn reverse DNS rác của dải private.'),
    R('2001:10::/28', 'ORCHID (đã bỏ)', 'deprecated', 'none', false, 'RFC 4843',
      'Định danh mật mã đời cũ, đã thay bằng ORCHIDv2.'),
    R('2001:20::/28', 'ORCHIDv2', 'special', 'global', true, 'RFC 7343',
      'Định danh mật mã của Host Identity Protocol — không phải địa chỉ để định tuyến.'),
    R('2001:30::/28', 'Drone Remote ID (DRIP)', 'special', 'global', true, 'RFC 9374',
      'Định danh cho thiết bị bay không người lái.'),
    R('2001:db8::/32', 'Tài liệu, ví dụ', 'doc', 'none', false, 'RFC 3849',
      'Chỉ dùng trong sách và tài liệu, không bao giờ xuất hiện trên Internet.', true),
    R('2002::/16', '6to4', 'tunnel', 'global', null, 'RFC 3056',
      'Đường hầm tự động qua IPv4 công khai. Đã lỗi thời (RFC 7526).', true),
    R('2620:4f:8000::/48', 'AS112 Direct Delegation', 'special', 'global', true, 'RFC 7534',
      'Máy chủ DNS của dự án AS112.'),
    R('3fff::/20', 'Tài liệu, ví dụ (dải mới)', 'doc', 'none', false, 'RFC 9637',
      'Dải tài liệu thứ hai, đủ lớn để minh hoạ các mạng cỡ lớn.', true),
    R('5f00::/16', 'SRv6 SID', 'special', 'none', false, 'RFC 9602',
      'Định danh Segment Routing over IPv6 trong mạng nhà vận hành.'),
    R('fc00::/7', 'Unique Local (ULA)', 'ula', 'site', false, 'RFC 4193',
      'Dải nội bộ của IPv6 — tương đương 10.x, 172.16.x, 192.168.x của IPv4.', true),
    R('fd00::/8', 'Unique Local (ULA) tự sinh', 'ula', 'site', false, 'RFC 4193',
      'Dải ULA dùng trong thực tế: 40 bit Global ID sau "fd" nên sinh ngẫu nhiên để không trùng khi ghép mạng.', true),
    R('fe80::/10', 'Link-local', 'link', 'link', false, 'RFC 4291',
      'Mọi interface IPv6 đều tự có. Chỉ dùng trong cùng một đoạn mạng, không đi qua router.', true),
    R('fec0::/10', 'Site-local (đã bỏ)', 'deprecated', 'site', false, 'RFC 3879',
      'Đã được thay bằng ULA.', true),
    R('ff00::/8', 'Multicast', 'multicast', 'global', null, 'RFC 4291',
      'Gửi một lần tới cả nhóm máy. IPv6 không có broadcast — mọi việc của broadcast IPv4 đều chuyển sang multicast.'),
    R('2000::/3', 'Global Unicast (GUA)', 'global', 'global', true, 'RFC 4291',
      'Địa chỉ công khai trên Internet, do nhà mạng cấp.', true),
  ].map(e => {
    const p = parse(e.cidr);
    return Object.assign(e, { net: p.value, len: p.prefix, mask: mask(p.prefix) });
  });

  const RESERVED = {
    cidr: null, name: 'Chưa phân bổ (IETF dự trữ)', cat: 'reserved', scope: 'none', internet: false,
    rfc: 'RFC 4291', note: 'IANA chưa phân bổ dải này cho mục đích nào.', iid: false,
  };

  function classify(v) {
    return REGISTRY.filter(e => (v & e.mask) === e.net).sort((a, b) => b.len - a.len);
  }

  // ---------------------------------------------------------------- multicast

  const MC_SCOPE = {
    0x1: 'Interface-local — chỉ trong một interface',
    0x2: 'Link-local — trong một đoạn mạng',
    0x3: 'Realm-local',
    0x4: 'Admin-local — do quản trị viên cấu hình',
    0x5: 'Site-local — trong một site',
    0x8: 'Organization-local — trong một tổ chức',
    0xe: 'Global — toàn Internet',
  };

  const MC_GROUPS = [
    ['1', [1, 2], 'Tất cả node (all-nodes)'],
    ['2', [1, 2, 5], 'Tất cả router (all-routers)'],
    ['5', [2], 'OSPFv3 — mọi router OSPF'],
    ['6', [2], 'OSPFv3 — router DR/BDR'],
    ['9', [2], 'RIPng'],
    ['a', [2], 'EIGRP'],
    ['c', null, 'SSDP / UPnP'],
    ['d', [2], 'PIM'],
    ['12', [2], 'VRRP'],
    ['16', [2], 'MLDv2 — báo cáo thành viên multicast'],
    ['fb', null, 'mDNS (Bonjour, Avahi)'],
    ['101', null, 'NTP'],
    ['1:2', [2], 'DHCPv6 — mọi server và relay agent'],
    ['1:3', [2], 'LLMNR — phân giải tên cục bộ của Windows'],
    ['1:3', [5], 'DHCPv6 — mọi server trong site'],
  ].map(([gid, scopes, name]) => ({ gid: parse('::' + gid).value, scopes, name }));

  const SN_NET = parse('ff02::1:ff00:0').value;
  const GID_MASK = (1n << 112n) - 1n;

  function multicastInfo(v) {
    const top = Number(v >> 112n);
    const flags = (top >> 4) & 0xf;
    const scope = top & 0xf;
    const gid = v & GID_MASK;
    const solicited = (v & mask(104)) === SN_NET;
    let group = null;
    if (solicited) {
      group = 'Solicited-node — dùng cho Neighbor Discovery (thay cho ARP)';
    } else if (!(flags & 1)) {
      const hit = MC_GROUPS.find(g => g.gid === gid && (!g.scopes || g.scopes.includes(scope)));
      if (hit) group = hit.name;
    }
    const low = Number(v & LOW32);
    return {
      flags,
      scope,
      scopeName: MC_SCOPE[scope] || (scope === 0 || scope === 0xf ? 'Dự trữ' : 'Chưa được gán'),
      transient: !!(flags & 1),
      prefixBased: !!(flags & 2),
      embeddedRP: !!(flags & 4),
      solicited,
      group,
      mac: formatMac([0x33, 0x33, low >>> 24, (low >>> 16) & 255, (low >>> 8) & 255, low & 255]),
    };
  }

  function solicitedNode(v) {
    return SN_NET | (v & 0xffffffn);
  }

  // ---------------------------------------------------------------- Interface ID

  function formatMac(bytes) {
    return bytes.map(x => x.toString(16).padStart(2, '0')).join(':');
  }

  function parseMac(s) {
    const hex = String(s == null ? '' : s).trim().replace(/[\s:.\-]/g, '');
    if (!/^[0-9a-fA-F]{12}$/.test(hex)) return null;
    const b = [];
    for (let i = 0; i < 12; i += 2) b.push(parseInt(hex.slice(i, i + 2), 16));
    return b;
  }

  // MAC 48 bit -> Interface ID 64 bit: chèn ff:fe vào giữa, đảo bit U/L của byte đầu.
  function eui64(mac) {
    const b = [mac[0] ^ 0x02, mac[1], mac[2], 0xff, 0xfe, mac[3], mac[4], mac[5]];
    let v = 0n;
    for (const x of b) v = (v << 8n) | BigInt(x);
    return v;
  }

  function interfaceId(v) {
    const iid = v & LOW64;
    const b = [];
    for (let i = 7; i >= 0; i--) b.push(Number((iid >> BigInt(i * 8)) & 0xffn));
    const hex = iid.toString(16).padStart(16, '0').replace(/(.{4})(?!$)/g, '$1:');
    const base = { value: iid, hex };

    if (iid === 0n) {
      return Object.assign(base, {
        kind: 'zero', label: 'Toàn số 0',
        detail: 'Trong một mạng /64 đây là địa chỉ Subnet-Router anycast (RFC 4291) — router nhận, không gán cho máy.',
      });
    }
    if (b[3] === 0xff && b[4] === 0xfe) {
      const mac = [b[0] ^ 0x02, b[1], b[2], b[5], b[6], b[7]];
      return Object.assign(base, {
        kind: 'eui64', label: 'EUI-64, sinh từ MAC',
        detail: 'Lấy MAC chèn ff:fe vào giữa rồi đảo bit U/L. Suy ngược lại được đúng MAC của card mạng.',
        mac: formatMac(mac), oui: formatMac(mac.slice(0, 3)), macLocal: (mac[0] & 0x02) !== 0,
      });
    }
    if ((b[0] === 0x00 || b[0] === 0x02) && b[1] === 0x00 && b[2] === 0x5e && b[3] === 0xfe) {
      return Object.assign(base, {
        kind: 'isatap', label: 'ISATAP',
        detail: 'Đường hầm ISATAP — 32 bit cuối là IPv4 của máy. Cơ chế cũ, nên tắt.',
        ipv4: formatIPv4(iid & LOW32),
      });
    }
    if (iid >= 0xfdffffffffffff80n && iid <= 0xfdffffffffffffffn) {
      return Object.assign(base, {
        kind: 'anycast', label: 'Anycast dự trữ',
        detail: 'Nằm trong dải Interface ID anycast dự trữ của mạng con (RFC 2526).',
      });
    }
    if (iid < 0x10000n) {
      return Object.assign(base, {
        kind: 'low', label: 'Số nhỏ, dễ đoán',
        detail: 'Thường do đặt tay (::1, ::53) hoặc DHCPv6 cấp tuần tự. Công cụ quét mạng hay thử các số này đầu tiên.',
      });
    }
    if (iid < 0x100000000n) {
      return Object.assign(base, {
        kind: 'low32', label: 'Chỉ dùng 32 bit cuối',
        detail: `Có thể là IPv4 nhúng (${formatIPv4(iid)}) hoặc một số tự đặt — vẫn dễ đoán hơn địa chỉ ngẫu nhiên.`,
        ipv4: formatIPv4(iid),
      });
    }
    return Object.assign(base, {
      kind: 'random', label: 'Ngẫu nhiên',
      detail: 'Không lộ MAC. Có thể là địa chỉ tạm thời (privacy extensions, RFC 8981), stable-privacy (RFC 7217) hoặc địa chỉ DHCPv6.',
    });
  }

  function embeddedIPv4(v, type) {
    switch (type.cidr) {
      case '::ffff:0:0/96':
        return { kind: 'mapped', label: 'IPv4 tương ứng', ipv4: formatIPv4(v & LOW32) };
      case '::/96':
        return { kind: 'compat', label: 'IPv4 nhúng', ipv4: formatIPv4(v & LOW32) };
      case '64:ff9b::/96':
        return { kind: 'nat64', label: 'IPv4 đích qua NAT64', ipv4: formatIPv4(v & LOW32) };
      case '2002::/16':
        return { kind: '6to4', label: 'IPv4 công khai của router 6to4', ipv4: formatIPv4((v >> 80n) & LOW32) };
      case '2001::/32':
        return {
          kind: 'teredo',
          server: formatIPv4((v >> 64n) & LOW32),
          flags: Number((v >> 48n) & 0xffffn),
          port: Number((v >> 32n) & 0xffffn) ^ 0xffff,
          client: formatIPv4((Number(v & LOW32) ^ 0xffffffff) >>> 0),
        };
      default:
        return null;
    }
  }

  // ---------------------------------------------------------------- reverse DNS

  function reverseName(v) {
    return v.toString(16).padStart(32, '0').split('').reverse().join('.') + '.ip6.arpa';
  }

  // Zone reverse DNS cho một prefix. Prefix không chia hết cho 4 thì phải tách
  // thành nhiều zone ở ranh giới nibble kế tiếp.
  function reverseZone(net, prefix) {
    const nibbles = Math.ceil(prefix / 4);
    const hex = net.toString(16).padStart(32, '0').slice(0, nibbles);
    return {
      name: (hex ? hex.split('').reverse().join('.') + '.' : '') + 'ip6.arpa',
      aligned: prefix % 4 === 0,
      count: 2 ** (nibbles * 4 - prefix),
    };
  }

  // ---------------------------------------------------------------- số lớn

  function fmtBig(n) {
    return BigInt(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = n => String(n).replace(/\d/g, d => SUP[d]);

  function pow2(k) {
    return '2' + sup(k);
  }

  function approx(n) {
    if (n < 1000000n) return fmtBig(n);
    const [m, e] = Number(n).toExponential(1).split('e');
    return `≈ ${m.replace('.', ',')} × 10${sup(Number(e))}`;
  }

  // ---------------------------------------------------------------- chia subnet

  function subnetCount(prefix, newLen) {
    return 1n << BigInt(newLen - prefix);
  }

  function nthSubnet(net, prefix, newLen, index) {
    return (net & mask(prefix)) + BigInt(index) * (1n << BigInt(128 - newLen));
  }

  // ---------------------------------------------------------------- phân tích một địa chỉ

  const LEVEL_ORDER = { bad: 0, warn: 1, info: 2, ok: 3 };

  function analyze(input) {
    const p = typeof input === 'string' ? parse(input) : input;
    if (!p || !p.ok) return p || fail('Chưa nhập địa chỉ.');
    const v = p.value;
    const prefix = p.prefix == null ? null : p.prefix;
    const matches = classify(v);
    const type = matches[0] || RESERVED;

    const r = {
      ok: true, value: v, prefix, zone: p.zone || null,
      compressed: compress(v), expanded: expand(v), groups: toGroups(v),
      type, matches,
      ptr: reverseName(v),
      mixed: ['mapped', 'deprecated', 'nat64'].includes(type.cat) && type.len === 96 ? mixed(v) : null,
      network: null, last: null, count: null, count64: null, reverseZone: null,
      block: false, iid: null, solicited: null, multicast: null,
    };

    if (prefix !== null) {
      const m = mask(prefix);
      r.network = v & m;
      r.last = r.network | (MAX ^ m);
      r.count = 1n << BigInt(128 - prefix);
      r.count64 = prefix <= 64 ? 1n << BigInt(64 - prefix) : null;
      r.reverseZone = reverseZone(r.network, prefix);
      // Nhập "2001:db8::/48" là nói về cả khối mạng, không phải một máy.
      r.block = prefix < 128 && v === r.network;
    }

    if (type.cat === 'multicast') r.multicast = multicastInfo(v);
    else if (type.iid && !r.block) {
      r.iid = interfaceId(v);
      r.solicited = solicitedNode(v);
    }
    r.embedded = embeddedIPv4(v, type);
    r.notes = buildNotes(r);
    return r;
  }

  function buildNotes(r) {
    const n = [];
    const add = (level, text) => n.push({ level, text });
    const t = r.type;
    const cat = t.cat;

    if (cat === 'global') {
      add('warn', 'Địa chỉ công khai: IPv6 không đi qua NAT, nên nếu router và máy không chặn chiều vào thì ai trên Internet cũng kết nối thẳng được tới dịch vụ đang mở. Bật firewall cho cả IPv6.');
    }
    if (cat === 'ula') {
      add('info', 'ULA chỉ dùng trong mạng nội bộ, không ra Internet. Hợp để đặt địa chỉ cố định cho LAN vì không đổi khi nhà mạng đổi prefix.');
    }
    if (cat === 'link') {
      add('info', 'Router quảng bá gateway IPv6 bằng địa chỉ loại này. Khi ping phải kèm zone để chọn interface, ví dụ `ping fe80::1%enp2s0f2`.');
    }
    if (cat === 'doc') add('info', 'Dải dành cho tài liệu và ví dụ — không bao giờ gặp trên Internet thật.');
    if (cat === 'deprecated') add('warn', `${t.name}: đã bị bãi bỏ, không nên dùng.`);
    if (cat === 'tunnel') {
      add('warn', 'Cơ chế đường hầm cũ, có thể xuyên NAT và vượt firewall. Nếu máy tự bật (Teredo trên Windows) thì nên tắt: `netsh interface teredo set state disabled`.');
    }
    if (cat === 'reserved') add('info', 'Địa chỉ này nằm ngoài mọi dải đang dùng — có thể gõ nhầm.');
    if (r.multicast && r.multicast.solicited) {
      add('info', 'Mỗi địa chỉ unicast có 24 bit cuối trùng với nhóm này sẽ tham gia nhóm để trả lời Neighbor Discovery.');
    }
    if (r.zone) add('info', `Zone "%${r.zone}" chỉ định interface trên máy hiện tại — không có ý nghĩa với máy khác.`);

    const iid = r.iid;
    if (iid && iid.kind === 'eui64') {
      if (cat === 'link') {
        add('info', `Interface ID sinh từ MAC \`${iid.mac}\` (EUI-64). Với link-local thì không sao vì địa chỉ không ra khỏi LAN.`);
      } else {
        add('bad', `Interface ID sinh từ MAC \`${iid.mac}\` (EUI-64). Địa chỉ này làm lộ MAC card mạng, và phần đuôi giữ nguyên khi máy đổi mạng nên thiết bị bị theo dõi được. Nên bật \`ipv6-privacy\`, dùng stable-privacy hoặc tắt IPv6 nếu không cần.`);
      }
      if (iid.macLocal) {
        add('info', 'MAC này thuộc loại "locally administered" (bit U/L = 1), thường là MAC ngẫu nhiên do hệ điều hành, máy ảo hoặc Docker đặt, không phải MAC gốc của nhà sản xuất.');
      }
    }
    if (iid && iid.kind === 'low' && cat === 'global') {
      add('info', 'Interface ID rất nhỏ nên dễ đoán: kẻ quét mạng thường thử ::1, ::2, ::3… trước tiên.');
    }
    if (iid && iid.kind === 'isatap') add('warn', 'Đường hầm ISATAP — cơ chế cũ, nên tắt.');

    if (r.prefix !== null) {
      if (!r.block && r.prefix < 128 && r.value !== r.network) {
        add('info', `Bạn nhập địa chỉ của một máy kèm /${r.prefix}. Địa chỉ mạng tương ứng là \`${compress(r.network)}/${r.prefix}\`.`);
      }
      if (['global', 'ula', 'doc'].includes(cat)) {
        if (r.prefix < 64) {
          add('info', `Khối /${r.prefix} chứa ${fmtBig(r.count64)} mạng /64. Nhà mạng thường cấp /56 (256 mạng) hoặc /48 (65.536 mạng) cho mỗi thuê bao — xem tab Chia subnet.`);
        } else if (r.prefix > 64 && r.prefix < 127) {
          add('warn', `Mạng LAN nên dùng đúng /64: SLAAC và nhiều tính năng IPv6 cần Interface ID 64 bit (RFC 7421). /${r.prefix} chỉ nên dùng cho mục đích đặc biệt.`);
        } else if (r.prefix === 127) {
          add('info', '/127 dùng cho đường nối point-to-point giữa hai router (RFC 6164).');
        } else if (r.prefix === 128 && cat !== 'doc') {
          add('info', '/128 là một địa chỉ đơn lẻ. Router thường cấp dạng này qua DHCPv6.');
        }
      }
    }
    return n.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  }

  // ---------------------------------------------------------------- đọc output lệnh

  // Ứng viên IPv6 trong văn bản tự do; parse() quyết định cái nào hợp lệ.
  const CAND = /(?<![\w.:%\/])(?:[0-9A-Fa-f]{0,4}:){2,7}(?:\d{1,3}(?:\.\d{1,3}){3}|[0-9A-Fa-f]{1,4})?(?:%[\w.\-]+)?(?:\/\d{1,3})?(?![\w:])/g;
  const ADDR_FLAGS = /\b(temporary|dynamic|deprecated|mngtmpaddr|noprefixroute|tentative|dadfailed|optimistic|secondary)\b/g;

  function maskToLen(m) {
    let n;
    if (/^0x[0-9a-f]{8}$/i.test(m)) n = parseInt(m, 16);
    else {
      n = parseIPv4(m);
      if (n === null) return null;
    }
    const bits = n.toString(2).padStart(32, '0');
    return /^1*0*$/.test(bits) ? bits.indexOf('0') === -1 ? 32 : bits.indexOf('0') : null;
  }

  function isPrivate4(n) {
    return (n >>> 24) === 10 || (n >>> 20) === 0xac1 || (n >>> 16) === 0xc0a8;
  }

  function lanFrom(ip, len) {
    const n = parseIPv4(ip);
    if (n === null || len === null || len > 32 || !isPrivate4(n)) return null;
    const net = len === 0 ? 0 : (n & (0xffffffff << (32 - len))) >>> 0;
    return `${formatIPv4(net)}/${len}`;
  }

  function scanText(text) {
    const lines = String(text == null ? '' : text).split(/\r?\n/);
    const entries = [];
    const seen = new Set();
    let iface = null;
    let lan4 = null;
    let pendingV4 = null;
    let gatewayBlock = false;

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      let m;
      if ((m = line.match(/^\s*\d+:\s+([\w.\-]+)(?:@[\w.\-]+)?:\s/))) iface = m[1];          // ip addr
      else if ((m = line.match(/^([\w.\-]+):\s+flags=/))) iface = m[1];                       // ifconfig
      else if ((m = line.match(/^\S.*\badapter\s+(.+?):\s*$/i))) iface = m[1];                // ipconfig

      // LAN IPv4 — để gợi ý luật firewall cho đúng dải
      if (!lan4) {
        if ((m = line.match(/(?<![\d.:])(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})\b/))) lan4 = lanFrom(m[1], Number(m[2]));
        else if ((m = line.match(/\binet\s+(\d{1,3}(?:\.\d{1,3}){3})\s+netmask\s+(\S+)/))) lan4 = lanFrom(m[1], maskToLen(m[2]));
        else if ((m = line.match(/IPv4[^:]*:\s*(\d{1,3}(?:\.\d{1,3}){3})/i))) pendingV4 = m[1];
        else if (pendingV4 && (m = line.match(/(?:Subnet Mask|Mặt nạ mạng con)[^:]*:\s*(\d{1,3}(?:\.\d{1,3}){3})/i))) {
          lan4 = lanFrom(pendingV4, maskToLen(m[1]));
        }
      }

      if (/default gateway|cổng mặc định/i.test(line)) gatewayBlock = true;
      else if (!/^\s{8,}\S+\s*$/.test(line)) gatewayBlock = false;

      const dev = (line.match(/\bdev\s+([\w.\-@]+)/) || [])[1];
      CAND.lastIndex = 0;
      while ((m = CAND.exec(line))) {
        const raw = m[0];
        const p = parse(raw);
        if (!p.ok) continue;
        const before = line.slice(0, m.index);
        const after = line.slice(m.index + raw.length);

        let prefix = p.prefix;
        if (prefix === null) {
          const pl = after.match(/^\s+prefixlen\s+(\d{1,3})/);
          if (pl && Number(pl[1]) <= 128) prefix = Number(pl[1]);
        }

        let role = 'addr';
        if (/\bvia\s*$/.test(before)) role = /\bdefault\b/.test(before) ? 'gateway' : 'nexthop';
        else if (gatewayBlock) role = 'gateway';
        else if (/^\s*(?:unicast|multicast|local|anycast|unreachable|blackhole|prohibit|throw)?\s*$/.test(before) &&
                 /\s(?:dev|proto|metric|via)\s/.test(after + ' ')) role = 'route';

        const flags = (after.match(ADDR_FLAGS) || []).slice();
        if (/temporary|tạm thời/i.test(before) && !flags.includes('temporary')) flags.push('temporary');

        let source = null;
        if (/^\s*-?\s*address:\s*$/.test(before)) {
          for (let k = li + 1; k < Math.min(lines.length, li + 6); k++) {
            if (/address:/.test(lines[k])) break;
            const s = lines[k].match(/^\s*source:\s*(\w+)/);
            if (s) source = s[1].toLowerCase();
          }
        }

        const e = {
          raw, value: p.value, prefix, zone: p.zone,
          iface: role === 'addr' ? iface : dev || iface,
          role, flags, source, line: li + 1,
        };
        const key = [role, e.value, prefix, e.iface].join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        entries.push(e);
      }
    }

    // Trang "Info for enp2s0f2" của trình cài Ubuntu ghi tên interface sau danh sách địa chỉ.
    const fallback = (String(text).match(/\bInfo for ([\w.\-]+)/) || String(text).match(/^\s*name:\s*([\w.\-]+)\s*$/m) || [])[1];
    if (fallback) for (const e of entries) if (!e.iface) e.iface = fallback;

    return { entries, lan4 };
  }

  // ---------------------------------------------------------------- phân tích cả mạng

  function listAddrs(items, max = 3) {
    const shown = items.slice(0, max).map(i => '`' + compress(i.value) + '`');
    const more = items.length - shown.length;
    return shown.join(', ') + (more > 0 ? ` và ${more} địa chỉ khác` : '');
  }

  function buildSnippets(ctx) {
    const ifc = ctx.iface || 'eth0';
    const sect = /^wl/.test(ifc) ? 'wifis' : 'ethernets';
    const lan = ctx.lan4 || '192.168.1.0/24';
    return {
      ufw: {
        title: 'Bật firewall UFW — chặn chiều vào cho cả IPv4 và IPv6',
        lang: 'bash',
        code: [
          'grep IPV6 /etc/default/ufw          # phải là IPV6=yes (mặc định)',
          'sudo ufw default deny incoming',
          'sudo ufw default allow outgoing',
          `sudo ufw allow from ${lan} to any port 22 proto tcp   # SSH chỉ trong LAN${ctx.lan4 ? '' : ' — đổi thành dải LAN của bạn'}`,
          'sudo ufw enable',
          'sudo ufw status verbose',
        ].join('\n'),
        note: 'Cổng publish bằng Docker (`-p 80:80`) đi qua luật iptables riêng và bỏ qua UFW. Web đã đi qua Cloudflare Tunnel thì bỏ hẳn `ports:`, hoặc bind `127.0.0.1:8080:80`.',
      },
      ss: {
        title: 'Xem dịch vụ nào đang nghe trên mọi địa chỉ, kể cả IPv6',
        lang: 'bash',
        code: "sudo ss -tulpn | grep -E '\\[::\\]|\\*:'",
        note: 'Dòng có `[::]:22` hay `*:80` nghĩa là dịch vụ nhận kết nối trên mọi địa chỉ IPv6 của máy.',
      },
      disable: {
        title: `Tắt IPv6 trên ${ifc} (Ubuntu, netplan)`,
        lang: 'yaml',
        code: [
          '# /etc/netplan/50-cloud-init.yaml — thêm 2 dòng vào interface',
          'network:',
          '  version: 2',
          `  ${sect}:`,
          `    ${ifc}:`,
          '      accept-ra: false   # không nhận IPv6 tự động từ router',
          '      link-local: []     # tắt luôn địa chỉ fe80::',
          '      # ... giữ nguyên addresses, routes, nameservers',
        ].join('\n'),
        note: `Áp dụng bằng \`sudo netplan apply\`, rồi kiểm tra \`ip -6 addr show ${ifc}\` — không còn địa chỉ 2xxx: là được.`,
      },
      privacy: {
        title: 'Hoặc giữ IPv6 nhưng bật privacy extensions',
        lang: 'yaml',
        code: [
          'network:',
          '  version: 2',
          `  ${sect}:`,
          `    ${ifc}:`,
          '      ipv6-privacy: true   # kết nối ra ngoài dùng địa chỉ tạm, đổi định kỳ',
        ].join('\n'),
        note: 'Địa chỉ EUI-64 cũ vẫn còn trên máy và vẫn nhận kết nối vào, nên vẫn cần firewall.',
      },
    };
  }

  function analyzeNetwork(scan) {
    const entries = (scan && scan.entries) || [];
    const items = entries.map(e => Object.assign({}, e, {
      a: analyze({ ok: true, value: e.value, prefix: e.prefix, zone: e.zone }),
    }));
    const addrs = items.filter(i => i.role === 'addr');
    const byCat = (...cats) => addrs.filter(i => cats.includes(i.a.type.cat));
    // Output thật không bao giờ chứa 2001:db8::/32; coi nó như công khai để dữ liệu mẫu phân tích giống thật.
    const gua = byCat('global', 'doc');
    const ula = byCat('ula');
    const link = byCat('link');
    const findings = [];
    const add = (id, level, title, text, fix) => findings.push({ id, level, title, text, fix: fix || [] });

    if (!items.length) {
      add('none', 'info', 'Không thấy địa chỉ IPv6 nào',
        'Kiểm tra lại nội dung đã dán — cần output của `ip addr`, `ipconfig /all` hoặc `ifconfig`.');
    }

    if (gua.length) {
      add('gua-exposed', 'warn', `Máy có ${gua.length} địa chỉ IPv6 công khai`,
        'IPv6 không đi qua NAT như IPv4. Nếu router không chặn chiều vào thì SSH, web, cổng Docker… đang nghe trên `[::]` đều có thể bị truy cập thẳng từ Internet — kể cả khi web đã đi qua Cloudflare Tunnel. Bật firewall trên máy cho cả IPv6, hoặc tắt IPv6 nếu không cần.',
        ['ufw', 'ss', 'disable']);
    } else if (addrs.length && addrs.every(i => ['link', 'loopback'].includes(i.a.type.cat))) {
      add('link-only', 'ok', 'Chỉ có link-local, không có IPv6 ra Internet',
        'Máy không nhận IPv6 công khai nên không bị truy cập qua IPv6 từ bên ngoài.');
    }

    const euiPub = addrs.filter(i => ['global', 'doc', 'ula'].includes(i.a.type.cat) && i.a.iid && i.a.iid.kind === 'eui64');
    if (euiPub.length) {
      const macs = [...new Set(euiPub.map(i => i.a.iid.mac))].map(x => '`' + x + '`').join(', ');
      add('eui64-public', 'bad', 'Địa chỉ công khai làm lộ MAC card mạng',
        `${listAddrs(euiPub)} được sinh từ MAC ${macs} (EUI-64). MAC lộ ra trên mọi kết nối ra Internet, và phần đuôi địa chỉ không đổi khi máy đổi mạng nên thiết bị bị nhận diện, theo dõi được. Ubuntu Server (systemd-networkd) mặc định sinh địa chỉ kiểu này.`,
        ['privacy', 'disable']);
    }

    const dad = addrs.filter(i => i.flags.includes('dadfailed'));
    if (dad.length) {
      add('dad', 'bad', 'Trùng địa chỉ IPv6 (DAD failed)',
        `${listAddrs(dad)} bị máy khác trong mạng dùng trùng nên không hoạt động.`);
    }

    const tun = addrs.filter(i => i.a.type.cat === 'tunnel' || (i.a.iid && i.a.iid.kind === 'isatap'));
    if (tun.length) {
      add('tunnel', 'warn', 'Đang có đường hầm Teredo / 6to4 / ISATAP',
        `${listAddrs(tun)} thuộc cơ chế đường hầm cũ, có thể xuyên NAT và vượt firewall. Trên Windows tắt Teredo bằng \`netsh interface teredo set state disabled\`.`);
    }

    const docker = gua.filter(i => /^(docker|br-|veth)/.test(i.iface || ''));
    if (docker.length) {
      add('docker', 'warn', 'Mạng Docker có IPv6 công khai',
        'Container có địa chỉ công khai thì bị truy cập thẳng được mà không cần publish cổng. Chỉ bật IPv6 cho Docker khi thật sự cần và đã có firewall.');
    }

    const temp = addrs.filter(i => i.flags.includes('temporary'));
    if (temp.length) {
      add('privacy-on', 'ok', 'Đã bật privacy extensions',
        `Có ${temp.length} địa chỉ tạm thời (temporary). Kết nối ra ngoài dùng các địa chỉ này và chúng đổi định kỳ.`);
    }

    const dhcp = addrs.filter(i => i.prefix === 128 && ['global', 'doc', 'ula'].includes(i.a.type.cat));
    if (dhcp.length) {
      const low = dhcp.some(i => i.a.iid && i.a.iid.kind === 'low');
      add('dhcpv6', 'info', 'Router đang cấp IPv6 qua DHCPv6',
        `${listAddrs(dhcp)} là địa chỉ /128 router cấp bằng DHCPv6, song song với SLAAC. Không có gì sai.${low ? ' Đuôi số nhỏ (::3) do cấp tuần tự nên dễ đoán.' : ''}`);
    }

    if (ula.length) {
      add('ula', 'info', 'Có địa chỉ ULA (fc00::/7)',
        'Dải nội bộ do router cấp, không ra Internet. Có thể dùng để truy cập máy trong LAN bằng IPv6 mà không lo nhà mạng đổi prefix.');
    }

    const dep = addrs.filter(i => i.flags.includes('deprecated'));
    if (dep.length) {
      add('deprecated', 'info', 'Có địa chỉ đang hết hạn (deprecated)',
        `${listAddrs(dep)} thuộc prefix cũ đang được thay — thường do nhà mạng đổi prefix. Đừng ghi cứng IPv6 công khai làm địa chỉ server; dùng tên miền, tunnel hoặc ULA.`);
    }

    const p64 = [...new Set(gua.map(i => i.value & mask(64)))];
    if (p64.length > 1) {
      add('multi-prefix', 'info', `Có ${p64.length} prefix /64 công khai khác nhau`,
        p64.map(v => '`' + compress(v) + '/64`').join(', ') + ' — nhiều mạng con, hoặc nhà mạng vừa đổi prefix.');
    }

    const gw = items.filter(i => i.role === 'gateway');
    if (gw.length) {
      const allLink = gw.every(i => i.a.type.cat === 'link');
      add('gateway', 'info', 'Gateway IPv6',
        `${listAddrs(gw)}${allLink ? ' — router quảng bá gateway bằng địa chỉ link-local, đây là cách làm chuẩn.' : '.'}`);
    } else if (gua.length) {
      add('no-gateway', 'info', 'Không thấy default route IPv6',
        'Dán thêm output của `ip -6 route` để kiểm tra gateway.');
    }

    findings.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

    const main = gua[0] || addrs.find(i => i.iface && i.iface !== 'lo') || {};
    const snippets = buildSnippets({ iface: main.iface || null, lan4: (scan && scan.lan4) || null });
    const wanted = new Set(findings.flatMap(f => f.fix));
    const fixes = ['ufw', 'ss', 'disable', 'privacy'].filter(k => wanted.has(k));

    return {
      items,
      findings,
      fixes: fixes.map(k => Object.assign({ key: k }, snippets[k])),
      summary: {
        total: addrs.length,
        gua: gua.length,
        ula: ula.length,
        link: link.length,
        eui: euiPub.length,
        ifaces: [...new Set(items.map(i => i.iface).filter(Boolean))],
      },
    };
  }

  return {
    parse, compress, expand, mixed, toGroups, mask, classify, analyze,
    interfaceId, multicastInfo, solicitedNode, reverseName, reverseZone,
    parseMac, formatMac, eui64, formatIPv4,
    subnetCount, nthSubnet, fmtBig, pow2, approx,
    scanText, analyzeNetwork, buildSnippets,
    REGISTRY, SCOPES, MC_SCOPE,
  };
});

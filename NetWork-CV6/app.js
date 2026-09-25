/*
 * NetWork-CV6 — phần giao diện. Mọi phép tính nằm ở ipv6.js; file này chỉ đọc
 * ô nhập, gọi IPv6.* rồi vẽ kết quả. Không gửi dữ liệu đi đâu.
 */
(function () {
  'use strict';

  const V6 = window.IPv6;
  const SAMPLES = window.NCV6_SAMPLES || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  // Cho phép xuống dòng sau ":" và "." để địa chỉ dài không bị cắt giữa một nhóm (không tách "::").
  const brk = s => esc(s).replace(/:(?!:)|\./g, '$&<wbr>');
  const debounce = (fn, ms) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  // localStorage có thể bị chặn (chế độ riêng tư) — trang vẫn chạy bình thường.
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } },
  };

  const ICON_COPY = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_DONE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const LEVEL = {
    bad: { ico: '!', sr: 'Nguy cơ' },
    warn: { ico: '!', sr: 'Cảnh báo' },
    info: { ico: 'i', sr: 'Ghi chú' },
    ok: { ico: '✓', sr: 'Ổn' },
  };
  const CAT_LABEL = {
    global: 'Công khai', ula: 'Nội bộ (ULA)', link: 'Link-local', multicast: 'Multicast',
    loopback: 'Loopback', doc: 'Tài liệu', tunnel: 'Đường hầm', nat64: 'NAT64', mapped: 'IPv4-mapped',
    deprecated: 'Đã bỏ', special: 'Đặc biệt', reserved: 'Dự trữ',
  };
  const ROLE_LABEL = { addr: 'Địa chỉ', gateway: 'Gateway', nexthop: 'Next-hop', route: 'Route' };
  const ROLE_ORDER = { addr: 0, gateway: 1, nexthop: 2, route: 3 };

  const EXAMPLES = [
    ['EUI-64, lộ MAC', '2001:db8:c872:19b0:21a:2bff:fe3c:4d5e/64'],
    ['Gateway link-local', 'fe80::1%enp2s0f2'],
    ['ULA qua DHCPv6', 'fd12:3456:789a::3/128'],
    ['Khối /56 nhà mạng cấp', '2001:db8:c872:1900::/56'],
    ['Solicited-node', 'ff02::1:ff3c:4d5e'],
    ['IPv4-mapped', '::ffff:192.168.100.169'],
    ['Teredo', '2001:0:4136:e378:8000:63bf:3fff:fdd2'],
    ['NAT64', '64:ff9b::192.0.2.33'],
  ];

  // ---------------------------------------------------------------- hash: #tab?k=v

  const TABS = ['analyze', 'network', 'subnet', 'mac', 'ref'];
  let current = 'analyze';
  const state = { showBin: store.get('ncv6-bin') === '1', snLen: null, snFrom: 0n, snMark: null };

  function hashLink(tab, params) {
    const qs = Object.entries(params || {})
      .filter(([, v]) => v !== '' && v != null)
      .map(([k, v]) => k + '=' + encodeURIComponent(v).replace(/%3A/gi, ':').replace(/%2F/gi, '/'))
      .join('&');
    return '#' + tab + (qs ? '?' + qs : '');
  }

  function readHash() {
    const raw = location.hash.slice(1);
    const i = raw.indexOf('?');
    const tab = i < 0 ? raw : raw.slice(0, i);
    return { tab: TABS.includes(tab) ? tab : null, params: new URLSearchParams(i < 0 ? '' : raw.slice(i + 1)) };
  }

  function paramsFor(tab) {
    if (tab === 'analyze') return { q: $('#addr-in').value.trim() };
    if (tab === 'subnet') {
      return { q: $('#sn-in').value.trim(), len: state.snLen, from: state.snFrom > 0n ? state.snFrom.toString() : '' };
    }
    if (tab === 'mac') return { mac: $('#mac-in').value.trim(), prefix: $('#mac-prefix').value.trim() };
    return null;
  }

  function writeHash() {
    const h = hashLink(current, paramsFor(current));
    if (location.hash !== h) history.replaceState(null, '', h);
  }

  function applyParams(tab, params) {
    if (tab === 'analyze' && params.has('q')) $('#addr-in').value = params.get('q');
    if (tab === 'subnet') {
      if (params.has('q')) $('#sn-in').value = params.get('q');
      if (params.has('len')) state.snLen = Number(params.get('len'));
      const from = params.get('from') || '';
      state.snFrom = /^\d{1,40}$/.test(from) ? BigInt(from) : 0n;
      state.snMark = null;
    }
    if (tab === 'mac') {
      if (params.has('mac')) $('#mac-in').value = params.get('mac');
      if (params.has('prefix')) $('#mac-prefix').value = params.get('prefix');
    }
  }

  // ---------------------------------------------------------------- tab

  function showTab(tab) {
    current = tab;
    for (const b of $$('[role="tab"]')) {
      const on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    for (const p of $$('[role="tabpanel"]')) p.hidden = p.id !== 'panel-' + tab;
    // Trên điện thoại thanh tab cuộn ngang — kéo tab đang chọn vào tầm nhìn.
    const btn = $('#tab-' + tab);
    const bar = btn.parentElement;
    if (btn.offsetLeft < bar.scrollLeft || btn.offsetLeft + btn.offsetWidth > bar.scrollLeft + bar.clientWidth) {
      bar.scrollLeft = btn.offsetLeft - 16;
    }
    writeHash();
  }

  // ---------------------------------------------------------------- mảnh HTML dùng chung

  const copyBtn = (text, label) =>
    `<button type="button" class="copy" data-copy="${esc(text)}" aria-label="Chép ${esc(label)}" title="Chép">${ICON_COPY}</button>`;
  const badge = cat => `<span class="badge cat-${esc(cat)}">${esc(CAT_LABEL[cat] || cat)}</span>`;
  // Chrome vẫn ngắt dòng ở <wbr> kể cả khi nowrap, nên bảng nhiều cột dùng wrap = false.
  const addrLink = (text, q, wrap = true) =>
    `<a class="mono" href="${esc(hashLink('analyze', { q: q || text }))}">${wrap ? brk(text) : esc(text)}</a>`;
  const levelIco = lv => `<span class="ico" aria-hidden="true">${LEVEL[lv].ico}</span>`;
  const noteHTML = n =>
    `<li class="note lv-${n.level}">${levelIco(n.level)}<span><span class="sr">${LEVEL[n.level].sr}: </span>${fmt(n.text)}</span></li>`;

  function fact(label, text, opts = {}) {
    const html = opts.html != null ? opts.html : opts.plain ? esc(text) : brk(text);
    const sub = opts.subHtml != null ? opts.subHtml : opts.sub ? fmt(opts.sub) : '';
    return `<div class="fact"><dt>${esc(label)}</dt><dd><span class="val${opts.plain ? '' : ' mono'}">${html}</span>${sub ? `<small>${sub}</small>` : ''}</dd>${opts.copy === false ? '<span></span>' : copyBtn(text, label)}</div>`;
  }

  const snipHTML = s => `<div class="snip">
      <div class="snip-head"><span>${esc(s.title)}</span>${copyBtn(s.code, s.title)}</div>
      <pre><code>${esc(s.code)}</code></pre>
      ${s.note ? `<p>${fmt(s.note)}</p>` : ''}
    </div>`;

  function announce(msg) {
    const live = $('#live');
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 30);
  }

  function setError(input, errEl, msg) {
    if (msg) {
      errEl.textContent = msg;
      errEl.hidden = false;
      input.setAttribute('aria-invalid', 'true');
    } else {
      errEl.hidden = true;
      input.removeAttribute('aria-invalid');
    }
  }

  // ---------------------------------------------------------------- tab Địa chỉ

  function renderAnalyze() {
    const input = $('#addr-in');
    const out = $('#addr-out');
    const q = input.value.trim();
    if (current === 'analyze') writeHash();
    for (const c of $$('#addr-examples [data-q]')) c.setAttribute('aria-pressed', String(c.dataset.q === q));

    if (!q) {
      setError(input, $('#addr-err'), null);
      out.classList.remove('stale');
      out.innerHTML = '<div class="card empty">Nhập một địa chỉ IPv6 hoặc chọn một ví dụ ở trên.</div>';
      return;
    }
    const r = V6.analyze(q);
    if (!r.ok) {
      setError(input, $('#addr-err'), r.error);
      out.classList.add('stale');
      return;
    }
    setError(input, $('#addr-err'), null);
    out.classList.remove('stale');
    out.innerHTML = analyzeHTML(r);
  }

  function analyzeHTML(r) {
    const t = r.type;
    const zone = r.zone ? `<span class="zone">%${esc(r.zone)}</span>` : '';
    const pfx = r.prefix !== null ? `<span class="pfx">/${r.prefix}</span>` : '';
    const full = r.compressed + (r.zone ? '%' + r.zone : '') + (r.prefix !== null ? '/' + r.prefix : '');
    const notes = r.notes.length
      ? `<ul class="notes">${r.notes.map(noteHTML).join('')}</ul>`
      : '<p class="muted">Không có gì đáng chú ý.</p>';

    return `<div class="card">
        <div class="result-head">
          <div class="result-main">
            <div class="kicker">${r.block ? 'Khối mạng' : 'Dạng rút gọn chuẩn'} · RFC 5952</div>
            <div class="addr mono">${brk(r.compressed)}${zone}${pfx}</div>
          </div>
          <div class="head-actions">${badge(t.cat)}${copyBtn(full, 'địa chỉ')}</div>
        </div>
        <p class="type-line"><strong>${esc(t.name)}</strong>${t.cidr ? ` · <span class="mono muted">${esc(t.cidr)}</span>` : ''} · <span class="muted">${esc(t.rfc)}</span></p>
        <p class="type-note">${fmt(t.note)}</p>
        ${groupsHTML(r)}
      </div>
      <div class="grid2">
        <div class="card"><h2 class="h">Thông tin chi tiết</h2><dl class="facts">${factsHTML(r)}</dl></div>
        <div class="card"><h2 class="h">Nhận xét</h2>${notes}</div>
      </div>`;
  }

  function groupsHTML(r) {
    const p = r.prefix;
    let cells = '';
    r.groups.forEach((g, i) => {
      const hex = g.toString(16).padStart(4, '0');
      let nibs = '';
      for (let k = 0; k < 4; k++) {
        const start = i * 16 + k * 4;
        let cls = '';
        let style = '';
        if (p !== null) {
          if (start + 4 <= p) cls = ' in';
          else if (start >= p) cls = ' out';
          else { cls = ' split'; style = ` style="--f:${(p - start) * 25}%"`; }
        }
        nibs += `<span class="nib${cls}"${style}>${hex[k]}</span>`;
      }
      let bin = '';
      if (state.showBin) {
        const bits = [];
        for (let k = 0; k < 16; k++) {
          bits.push(`<span${p !== null && i * 16 + k < p ? ' class="on"' : ''}>${(g >> (15 - k)) & 1}</span>`);
          if (k % 4 === 3 && k < 15) bits.push(' ');
        }
        bin = `<div class="bin mono" aria-hidden="true">${bits.join('')}</div>`;
      }
      cells += `<div class="grp ${i < 4 ? 'g-hi' : 'g-lo'}"><div class="hex mono">${nibs}</div>${bin}<div class="rng">bit ${i * 16}–${i * 16 + 15}</div></div>`;
    });

    const labels = r.type.iid;
    const labs = labels
      ? '<div class="lab lab-hi">64 bit đầu · prefix mạng + subnet ID</div><div class="lab lab-lo">64 bit cuối · Interface ID</div>'
      : '';
    let legend;
    if (p === null) legend = '<span>Thêm <code>/64</code> (hoặc /56, /48…) sau địa chỉ để tô phần mạng.</span>';
    else if (p === 128) legend = '<span><span class="sw in"></span>/128 — một địa chỉ đơn, không có phần host</span>';
    else legend = `<span><span class="sw in"></span>Phần mạng /${p}</span><span><span class="sw out"></span>Phần host · ${128 - p} bit</span>`;
    return `<div class="groups${labels ? '' : ' no-lab'}" role="img" aria-label="${esc(r.expanded)}, chia thành 8 nhóm 16 bit">${cells}${labs}</div>
      <div class="legend">${legend}<label class="toggle"><input type="checkbox" id="bin-toggle"${state.showBin ? ' checked' : ''}> Hiện nhị phân</label></div>`;
  }

  function factsHTML(r) {
    const t = r.type;
    const f = [];
    f.push(fact('Dạng đầy đủ', r.expanded));
    if (!r.block) f.push(fact('Dạng rút gọn', r.compressed));
    if (r.mixed) f.push(fact('Dạng kèm IPv4', r.mixed));
    f.push(fact('Phạm vi', r.multicast ? r.multicast.scopeName : V6.SCOPES[t.scope], { plain: true, copy: false }));

    let inet;
    if (r.multicast) inet = r.multicast.scope === 0xe ? 'Có thể — multicast toàn cầu' : 'Không — chỉ trong phạm vi trên';
    else inet = t.internet === true ? 'Có — định tuyến được trên Internet' : t.internet === false ? 'Không' : 'Tuỳ trường hợp';
    f.push(fact('Ra Internet', inet, { plain: true, copy: false }));

    // /128 là một địa chỉ đơn: mạng, đầu, cuối, số địa chỉ, zone đều trùng với chính nó.
    if (r.prefix !== null && r.prefix < 128) {
      const net = `${V6.compress(r.network)}/${r.prefix}`;
      f.push(fact('Địa chỉ mạng', net, r.block ? {} : { html: addrLink(net) }));
      f.push(fact('Địa chỉ đầu', V6.compress(r.network)));
      f.push(fact('Địa chỉ cuối', V6.compress(r.last)));
      f.push(fact('Số địa chỉ', V6.fmtBig(r.count), {
        sub: V6.pow2(128 - r.prefix) + (r.count >= 1000000n ? ' · ' + V6.approx(r.count) : ''),
      }));
      if (r.prefix < 64) {
        const link = esc(hashLink('subnet', { q: net, len: 64 }));
        f.push(fact('Số mạng /64', V6.fmtBig(r.count64), {
          subHtml: `${V6.pow2(64 - r.prefix)} · <a href="${link}">Chia thành các mạng /64</a>`,
        }));
      }
    }

    if (r.iid) {
      f.push(fact('Interface ID', r.iid.hex, { sub: `${r.iid.label}. ${r.iid.detail}` }));
      if (r.iid.mac) {
        f.push(fact('MAC suy ra', r.iid.mac, {
          sub: `OUI (mã nhà sản xuất): ${r.iid.oui}${r.iid.macLocal ? ' · MAC do phần mềm đặt (locally administered)' : ''}`,
        }));
      }
      if (r.iid.ipv4) f.push(fact('IPv4 trong Interface ID', r.iid.ipv4));
    }

    const e = r.embedded;
    if (e && e.kind === 'teredo') {
      f.push(fact('Teredo server', e.server));
      f.push(fact('IPv4 công khai của máy', e.client, { sub: 'Giải mã bằng cách đảo toàn bộ bit của 32 bit cuối.' }));
      f.push(fact('Cổng UDP', String(e.port)));
    } else if (e) {
      f.push(fact(e.label, e.ipv4));
    }

    if (r.multicast) {
      const m = r.multicast;
      const flags = [m.transient ? 'Tạm thời (transient)' : 'Cố định — well-known, do IANA cấp'];
      if (m.prefixBased) flags.push('dựa trên unicast prefix (RFC 3306)');
      if (m.embeddedRP) flags.push('nhúng địa chỉ RP (RFC 3956)');
      f.push(fact('Cờ multicast', flags.join(', '), { plain: true, copy: false }));
      f.push(fact('Nhóm', m.group || 'Không có trong danh sách nhóm phổ biến', { plain: true, copy: false }));
      f.push(fact('MAC Ethernet', m.mac, { sub: 'Multicast IPv6 trên Ethernet dùng MAC 33:33 + 32 bit cuối của địa chỉ.' }));
    }

    if (r.solicited !== null) {
      const sn = V6.compress(r.solicited);
      f.push(fact('Solicited-node', sn, {
        html: addrLink(sn),
        sub: 'Nhóm multicast máy tham gia để trả lời Neighbor Discovery — thay cho ARP của IPv4.',
      }));
    }
    f.push(fact('Reverse DNS (PTR)', r.ptr));
    if (r.reverseZone && r.prefix < 128) {
      const z = r.reverseZone;
      f.push(fact('Zone reverse DNS', z.name, {
        sub: z.aligned
          ? `Zone để uỷ quyền reverse DNS cho khối /${r.prefix}.`
          : `/${r.prefix} không chia hết cho 4 nên cần ${z.count} zone ở mức /${Math.ceil(r.prefix / 4) * 4}; đây là zone đầu tiên.`,
      }));
    }
    return f.join('');
  }

  // ---------------------------------------------------------------- tab Mạng của tôi

  function renderNetwork() {
    const text = $('#net-in').value;
    const out = $('#net-out');
    let sample = null;
    for (const c of $$('#net-samples [data-sample]')) {
      const on = SAMPLES[c.dataset.sample].text === text;
      if (on) sample = c.dataset.sample;
      c.setAttribute('aria-pressed', String(on));
    }
    if (!text.trim()) { out.innerHTML = ''; return; }
    out.innerHTML = networkHTML(V6.analyzeNetwork(V6.scanText(text)), sample);
  }

  function networkHTML(res, sample) {
    const s = res.summary;
    const tiles = [
      ['Địa chỉ IPv6', s.total, ''],
      ['Công khai (GUA)', s.gua, s.gua ? 'warn' : 'ok'],
      ['Nội bộ (ULA)', s.ula, ''],
      ['Link-local', s.link, ''],
      ['Lộ MAC (EUI-64)', s.eui, s.eui ? 'bad' : 'ok'],
    ].map(([t, n, c]) => `<div class="tile ${c}"><div class="n">${n}</div><div class="t">${esc(t)}</div></div>`).join('');

    const findings = res.findings.map(f => `<li class="finding lv-${f.level}">
        <h3>${levelIco(f.level)}<span><span class="sr">${LEVEL[f.level].sr}: </span>${esc(f.title)}</span></h3>
        <p>${fmt(f.text)}</p>
      </li>`).join('');

    const ifaces = s.ifaces.length ? ` <span class="muted small">· ${esc(s.ifaces.join(', '))}</span>` : '';
    const sampleNote = sample
      ? '<p class="muted small">Đây là dữ liệu mẫu: dải tài liệu <code>2001:db8::/32</code> được dùng thay cho prefix thật và được phân tích như địa chỉ công khai.</p>'
      : '';
    let html = `<div class="card">
        <h2 class="h">Tổng quan${ifaces}</h2>
        ${sampleNote}
        <div class="tiles">${tiles}</div>
        <h3 class="h3">Nhận xét</h3>
        <ul class="findings">${findings}</ul>
      </div>`;

    if (res.items.length) {
      const items = res.items.slice().sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
      const rows = items.map(i => {
        const a = i.a;
        const shown = a.compressed + (i.prefix !== null ? '/' + i.prefix : '');
        const q = a.compressed + (i.zone ? '%' + i.zone : '') + (i.prefix !== null ? '/' + i.prefix : '');
        let iid = '<span class="muted">—</span>';
        if (a.iid && a.iid.kind === 'eui64') {
          iid = `<span class="${a.type.cat === 'link' ? '' : 't-bad'}">EUI-64</span><span class="cell-sub mono">MAC ${esc(a.iid.mac)}</span>`;
        } else if (a.iid) {
          iid = esc(a.iid.label);
        }
        const flags = i.flags.concat(i.source ? ['nguồn: ' + i.source] : []).join(', ');
        return `<tr>
            <td>${esc(i.iface || '—')}</td>
            <td>${addrLink(shown, q, false)}${i.zone ? `<span class="cell-sub mono">%${esc(i.zone)}</span>` : ''}</td>
            <td>${ROLE_LABEL[i.role]}</td>
            <td>${badge(a.type.cat)}</td>
            <td>${iid}</td>
            <td class="small">${flags ? esc(flags) : '<span class="muted">—</span>'}</td>
          </tr>`;
      }).join('');
      html += `<div class="card">
          <h2 class="h">Các địa chỉ tìm thấy</h2>
          <div class="table-wrap"><table>
            <thead><tr><th>Interface</th><th>Địa chỉ</th><th>Vai trò</th><th>Loại</th><th>Interface ID</th><th>Cờ</th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>
          <p class="muted small">Bấm vào một địa chỉ để xem phân tích chi tiết.</p>
        </div>`;
    }

    if (res.fixes.length) {
      html += `<div class="card"><h2 class="h">Việc nên làm</h2><div class="snips">${res.fixes.map(snipHTML).join('')}</div></div>`;
    }
    return html;
  }

  // ---------------------------------------------------------------- tab Chia subnet

  const PAGE = 16;

  function renderSubnet() {
    const input = $('#sn-in');
    const out = $('#sn-out');
    const p = V6.parse(input.value);
    let msg = null;
    if (!p.ok) msg = p.error;
    else if (p.prefix === null) msg = 'Cần nhập kèm độ dài prefix, ví dụ 2001:db8:abcd::/48.';
    else if (p.prefix >= 128) msg = 'Khối /128 chỉ có một địa chỉ, không chia được nữa.';
    setError(input, $('#sn-err'), msg);
    if (msg) {
      out.classList.add('stale');
      if (current === 'subnet') writeHash();
      return;
    }
    out.classList.remove('stale');

    const prefix = p.prefix;
    const net = p.value & V6.mask(prefix);
    let len = state.snLen;
    if (!(len > prefix && len <= 128)) len = prefix < 64 ? 64 : Math.min(128, prefix + 4);
    state.snLen = len;

    const range = $('#sn-len');
    range.min = String(prefix + 1);
    range.max = '128';
    range.value = String(len);
    $('#sn-len-out').textContent = '/' + len;
    $('#sn-quick').innerHTML = [48, 52, 56, 60, 64].filter(x => x > prefix)
      .map(x => `<button type="button" class="chip" data-len="${x}" aria-pressed="${x === len}">/${x}${x === 64 ? ' · mạng LAN' : ''}</button>`)
      .join('');

    const count = V6.subnetCount(prefix, len);
    if (state.snFrom >= count) state.snFrom = 0n;
    const from = state.snFrom;
    const to = from + BigInt(PAGE) < count ? from + BigInt(PAGE) : count;
    const subBits = len - prefix;
    const hostBits = 128 - len;
    const digits = Math.max(1, Math.ceil(subBits / 4));

    let rows = '';
    for (let i = from; i < to; i++) {
      const cidr = `${V6.compress(V6.nthSubnet(net, prefix, len, i))}/${len}`;
      rows += `<tr${state.snMark === i ? ' class="mark"' : ''}>
          <td class="row-num">#${V6.fmtBig(i)}<span class="cell-sub mono">ID ${i.toString(16).padStart(digits, '0')}</span></td>
          <td>${addrLink(cidr)}</td>
          <td class="cell-copy">${copyBtn(cidr, 'mạng #' + i)}</td>
        </tr>`;
    }

    const aligned = subBits % 4 === 0 && prefix % 4 === 0;
    const tip = (aligned
      ? 'Chia theo bội số của 4 bit nên Subnet ID là các chữ số hex trọn vẹn — dễ đọc, dễ đặt reverse DNS.'
      : 'Nên chia theo bội số của 4 bit (/52, /56, /60, /64) để Subnet ID là các chữ số hex trọn vẹn.')
      + (len > 64 ? ' Mạng nhỏ hơn /64 không dùng được SLAAC — chỉ hợp cho link point-to-point hoặc cấu hình tay.' : '');

    out.innerHTML = `<div class="card">
        <div class="tiles">
          <div class="tile"><div class="n">${V6.fmtBig(count)}</div><div class="t">mạng /${len} · ${V6.pow2(subBits)}</div></div>
          <div class="tile"><div class="n">${V6.pow2(hostBits)}</div><div class="t">địa chỉ mỗi mạng${hostBits <= 20 ? ' = ' + V6.fmtBig(1n << BigInt(hostBits)) : ''}</div></div>
          <div class="tile"><div class="n">${subBits}</div><div class="t">bit Subnet ID (bit ${prefix}–${len - 1})</div></div>
        </div>
        <div class="bitbar" role="img" aria-label="${prefix} bit prefix, ${subBits} bit subnet ID, ${hostBits} bit host">
          <span class="seg seg-net" style="flex:${prefix} 0 0"></span><span class="seg seg-sub" style="flex:${subBits} 0 0"></span><span class="seg seg-host" style="flex:${hostBits} 0 0"></span>
        </div>
        <div class="bit-scale" aria-hidden="true"><span>bit 0</span><span>64</span><span>128</span></div>
        <div class="legend">
          <span><span class="sw net"></span>Prefix /${prefix} · cố định</span>
          <span><span class="sw sub"></span>Subnet ID · ${subBits} bit</span>
          <span><span class="sw host"></span>Host · ${hostBits} bit</span>
        </div>
        <p class="muted small">${esc(tip)}</p>
      </div>
      <div class="card">
        <h2 class="h">Danh sách mạng con</h2>
        <div class="table-wrap"><table class="sn-table">
          <thead><tr><th># · Subnet ID</th><th>Mạng</th><th><span class="sr">Chép</span></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <div class="pager">
          <span class="info">#${V6.fmtBig(from)} – #${V6.fmtBig(to - 1n)} trên tổng ${V6.fmtBig(count)}</span>
          <span class="pager-btns">
            <button type="button" class="btn ghost" data-page="prev"${from === 0n ? ' disabled' : ''}>‹ Trước</button>
            <button type="button" class="btn ghost" data-page="next"${to >= count ? ' disabled' : ''}>Sau ›</button>
          </span>
          <form class="jump" id="sn-jump-form">
            <label for="sn-jump">Tới #</label>
            <input id="sn-jump" class="input mono" inputmode="numeric" autocomplete="off" placeholder="255 hoặc 0xff" aria-describedby="sn-jump-err">
            <button class="btn ghost" type="submit">Đi</button>
          </form>
        </div>
        <p class="err" id="sn-jump-err" role="alert" hidden></p>
      </div>`;
    if (current === 'subnet') writeHash();
  }

  function jumpSubnet(raw) {
    const s = raw.trim();
    const input = $('#sn-jump');
    const err = $('#sn-jump-err');
    let n = null;
    if (/^\d{1,40}$/.test(s)) n = BigInt(s);
    else if (/^0x[0-9a-f]{1,32}$/i.test(s)) n = BigInt(s);
    const p = V6.parse($('#sn-in').value);
    const count = V6.subnetCount(p.prefix, state.snLen);
    if (n === null || n >= count) {
      setError(input, err, n === null
        ? 'Nhập số thứ tự (vd. 255) hoặc Subnet ID dạng hex (vd. 0xff).'
        : `Chỉ có ${V6.fmtBig(count)} mạng, số thứ tự lớn nhất là #${V6.fmtBig(count - 1n)}.`);
      return;
    }
    state.snFrom = n - (n % BigInt(PAGE));
    state.snMark = n;
    renderSubnet();
    const row = $('#sn-out tr.mark');
    if (row) row.scrollIntoView({ block: 'nearest' });
  }

  // ---------------------------------------------------------------- tab MAC → IPv6

  function renderMac() {
    const macIn = $('#mac-in');
    const pIn = $('#mac-prefix');
    const err = $('#mac-err');
    const out = $('#mac-out');
    if (current === 'mac') writeHash();

    const mac = V6.parseMac(macIn.value);
    let pr = null;
    let msg = null;
    let bad = macIn;
    if (!mac) {
      msg = 'MAC không hợp lệ — cần 12 chữ số hex, ví dụ 00:1a:2b:3c:4d:5e, 00-1A-2B-3C-4D-5E hoặc 001a.2b3c.4d5e.';
    } else if (pIn.value.trim()) {
      bad = pIn;
      pr = V6.parse(pIn.value);
      if (!pr.ok) msg = 'Prefix: ' + pr.error;
      else if (pr.prefix !== null && pr.prefix !== 64) msg = `SLAAC chỉ dùng với prefix /64 (đang là /${pr.prefix}).`;
    }
    macIn.removeAttribute('aria-invalid');
    pIn.removeAttribute('aria-invalid');
    setError(bad, err, msg);
    if (msg) { out.classList.add('stale'); return; }
    out.classList.remove('stale');

    const iid = V6.eui64(mac);
    const iidHex = V6.expand(iid).split(':').slice(4).join(':');
    const hex2 = b => b.toString(16).padStart(2, '0');
    const bin8 = b => b.toString(2).padStart(8, '0');
    const m = mac.map(hex2);
    const left = m.slice(0, 3).join(':');
    const right = m.slice(3).join(':');

    const ll = V6.compress(V6.parse('fe80::').value | iid);
    const facts = [fact('Interface ID', iidHex), fact('Link-local', ll, { html: addrLink(ll + '/64') })];
    if (pr && pr.ok) {
      const slaac = V6.compress((pr.value & V6.mask(64)) | iid) + '/64';
      facts.push(fact('Địa chỉ SLAAC', slaac, { html: addrLink(slaac), sub: 'Địa chỉ máy tự đặt khi router quảng bá prefix này.' }));
    }
    const sn = V6.compress(V6.solicitedNode(iid));
    facts.push(fact('Solicited-node', sn, { html: addrLink(sn) }));

    const notes = [];
    if (mac[0] & 1) notes.push({ level: 'warn', text: 'Bit I/G của byte đầu bằng 1 nghĩa là MAC multicast — card mạng thật không dùng MAC dạng này.' });
    if (mac[0] & 2) notes.push({ level: 'info', text: 'MAC này là loại "locally administered" (bit U/L = 1) — thường do hệ điều hành, máy ảo hoặc Docker đặt ngẫu nhiên. Sau khi đảo bit, byte đầu của Interface ID sẽ có bit U/L = 0.' });
    notes.push({ level: 'bad', text: 'Nếu máy dùng địa chỉ này để ra Internet thì bất kỳ server nào cũng đọc được MAC của máy, và phần đuôi giữ nguyên dù máy đổi sang mạng khác.' });
    notes.push({ level: 'info', text: 'Windows, macOS, iOS, Android và Ubuntu Desktop (NetworkManager) mặc định dùng Interface ID ngẫu nhiên. Ubuntu Server dùng systemd-networkd thì mặc định vẫn sinh theo EUI-64 — nên kiểm tra bằng `ip -6 addr`.' });

    out.innerHTML = `<div class="grid2">
        <div class="card">
          <h2 class="h">Các bước tạo Interface ID</h2>
          <ol class="steps">
            <li><div><div class="what">MAC 48 bit, tách làm hai nửa</div><div class="how"><span class="hl2">${left}</span> | <span class="hl2">${right}</span></div></div></li>
            <li><div><div class="what">Chèn <code>ff:fe</code> vào giữa cho đủ 64 bit</div><div class="how">${left}:<span class="hl">ff:fe</span>:${right}</div></div></li>
            <li><div><div class="what">Đảo bit U/L (bit thứ 7) của byte đầu: <code>${bin8(mac[0])}</code> → <code>${bin8(mac[0] ^ 2)}</code></div><div class="how"><span class="hl">${hex2(mac[0] ^ 2)}</span>:${m.slice(1, 3).join(':')}:ff:fe:${right}</div></div></li>
            <li><div><div class="what">Gom thành 4 nhóm 16 bit — đây là Interface ID</div><div class="how">${iidHex}</div></div></li>
          </ol>
        </div>
        <div class="card">
          <h2 class="h">Kết quả</h2>
          <dl class="facts">${facts.join('')}</dl>
          <ul class="notes spaced">${notes.map(noteHTML).join('')}</ul>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------- tab Tra cứu

  function renderRef() {
    const regs = V6.REGISTRY.slice().sort((a, b) => (a.net < b.net ? -1 : a.net > b.net ? 1 : a.len - b.len));
    const yes = v => (v === true ? 'Có' : v === false ? 'Không' : 'Tuỳ');
    const rows = regs.map(e => `<tr>
        <td>${addrLink(e.cidr)}</td>
        <td class="name">${esc(e.name)} ${badge(e.cat)}<span class="cell-note">${esc(e.note)}</span></td>
        <td>${yes(e.internet)}</td>
        <td class="small mono">${esc(e.rfc)}</td>
      </tr>`).join('');
    const scopes = Object.entries(V6.MC_SCOPE).map(([k, v]) => {
      const ex = `ff0${Number(k).toString(16)}::1`;
      return `<tr><td class="mono">${Number(k).toString(16)}</td><td>${esc(v)}</td><td>${addrLink(ex)}</td></tr>`;
    }).join('');
    const memo = [
      'Mạng LAN luôn dùng /64 — SLAAC cần đúng 64 bit Interface ID.',
      'IPv6 không có NAT: firewall trên máy và trên router là lớp bảo vệ chính.',
      'Đừng chặn toàn bộ ICMPv6: Neighbor Discovery (thay cho ARP), Router Advertisement và Path MTU Discovery đều cần nó. UFW mặc định đã cho qua các loại cần thiết.',
      'Gateway IPv6 thường là địa chỉ link-local của router (`fe80::…`), không phải địa chỉ công khai.',
      'Một interface có nhiều địa chỉ IPv6 cùng lúc (link-local, SLAAC, tạm thời, DHCPv6, ULA) là bình thường.',
      'Prefix nhà mạng cấp có thể đổi. Đừng ghi cứng IPv6 công khai vào cấu hình — dùng tên miền, Cloudflare Tunnel hoặc ULA.',
    ];
    $('#ref-out').innerHTML = `<div class="card">
        <h2 class="h">Các dải địa chỉ đặc biệt</h2>
        <p class="muted lead">Theo sổ đăng ký IANA IPv6 Special-Purpose Address Registry. Bấm vào một dải để phân tích.</p>
        <div class="table-wrap"><table>
          <thead><tr><th>Dải</th><th>Tên và công dụng</th><th>Ra Internet</th><th>RFC</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>
      <div class="grid2">
        <div class="card">
          <h2 class="h">Phạm vi multicast</h2>
          <p class="muted lead">Chữ số hex thứ tư của địa chỉ <code>ffXY::</code> (Y) cho biết gói multicast đi được bao xa.</p>
          <div class="table-wrap"><table>
            <thead><tr><th>Y</th><th>Phạm vi</th><th>Ví dụ</th></tr></thead>
            <tbody>${scopes}</tbody>
          </table></div>
        </div>
        <div class="card">
          <h2 class="h">Ghi nhớ khi vận hành</h2>
          <ul class="memo">${memo.map(x => `<li>${fmt(x)}</li>`).join('')}</ul>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------- khởi động

  function init() {
    for (const b of $$('.copy:empty')) b.innerHTML = ICON_COPY;

    $('#theme').addEventListener('click', () => {
      const root = document.documentElement;
      const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      store.set('ncv6-theme', root.dataset.theme);
    });

    const tabs = $('.tabs');
    tabs.addEventListener('click', e => {
      const b = e.target.closest('[role="tab"]');
      if (b) showTab(b.dataset.tab);
    });
    tabs.addEventListener('keydown', e => {
      const i = TABS.indexOf(current);
      const j = { ArrowRight: (i + 1) % TABS.length, ArrowLeft: (i - 1 + TABS.length) % TABS.length, Home: 0, End: TABS.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      showTab(TABS[j]);
      $('#tab-' + TABS[j]).focus();
    });

    document.addEventListener('click', async e => {
      const b = e.target.closest('.copy[data-copy]');
      if (!b) return;
      const text = b.dataset.copy;
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
        ta.remove();
      }
      if (!ok) return;
      b.classList.add('done');
      b.innerHTML = ICON_DONE;
      announce('Đã chép');
      setTimeout(() => { b.classList.remove('done'); b.innerHTML = ICON_COPY; }, 1200);
    });

    // Địa chỉ
    const addrIn = $('#addr-in');
    $('#addr-examples').innerHTML = EXAMPLES
      .map(([label, q]) => `<button type="button" class="chip" data-q="${esc(q)}"><b>${esc(label)}</b><span class="mono">${esc(q)}</span></button>`)
      .join('');
    $('#addr-examples').addEventListener('click', e => {
      const c = e.target.closest('[data-q]');
      if (!c) return;
      addrIn.value = c.dataset.q;
      renderAnalyze();
    });
    addrIn.addEventListener('input', debounce(renderAnalyze, 120));
    $('#addr-clear').addEventListener('click', () => { addrIn.value = ''; renderAnalyze(); addrIn.focus(); });
    document.addEventListener('change', e => {
      if (e.target.id !== 'bin-toggle') return;
      state.showBin = e.target.checked;
      store.set('ncv6-bin', state.showBin ? '1' : '0');
      renderAnalyze();
      $('#bin-toggle').focus();
    });

    // Mạng của tôi
    const netIn = $('#net-in');
    $('#net-samples').innerHTML = Object.entries(SAMPLES)
      .map(([k, s]) => `<button type="button" class="chip" data-sample="${esc(k)}">${esc(s.label)}</button>`)
      .join('');
    $('#net-samples').addEventListener('click', e => {
      const c = e.target.closest('[data-sample]');
      if (!c) return;
      netIn.value = SAMPLES[c.dataset.sample].text;
      renderNetwork();
    });
    netIn.addEventListener('input', debounce(renderNetwork, 200));
    $('#net-clear').addEventListener('click', () => { netIn.value = ''; renderNetwork(); netIn.focus(); });

    // Chia subnet
    $('#sn-in').addEventListener('input', debounce(() => { state.snFrom = 0n; state.snMark = null; renderSubnet(); }, 150));
    $('#sn-len').addEventListener('input', e => {
      state.snLen = Number(e.target.value);
      state.snFrom = 0n;
      state.snMark = null;
      renderSubnet();
    });
    $('#sn-quick').addEventListener('click', e => {
      const c = e.target.closest('[data-len]');
      if (!c) return;
      state.snLen = Number(c.dataset.len);
      state.snFrom = 0n;
      state.snMark = null;
      renderSubnet();
    });
    $('#sn-out').addEventListener('click', e => {
      const b = e.target.closest('[data-page]');
      if (!b) return;
      const step = BigInt(PAGE);
      state.snFrom = b.dataset.page === 'next' ? state.snFrom + step : state.snFrom >= step ? state.snFrom - step : 0n;
      state.snMark = null;
      renderSubnet();
      $(`#sn-out [data-page="${b.dataset.page}"]`).focus();
    });
    $('#sn-out').addEventListener('submit', e => {
      if (e.target.id !== 'sn-jump-form') return;
      e.preventDefault();
      jumpSubnet($('#sn-jump').value);
    });

    // MAC
    const macRender = debounce(renderMac, 120);
    $('#mac-in').addEventListener('input', macRender);
    $('#mac-prefix').addEventListener('input', macRender);

    renderRef();

    const { tab, params } = readHash();
    applyParams(tab, params);
    if (!addrIn.value) addrIn.value = EXAMPLES[0][1];
    current = tab || 'analyze';
    renderAnalyze();
    renderSubnet();
    renderMac();
    showTab(current);

    window.addEventListener('hashchange', () => {
      const h = readHash();
      const next = h.tab || 'analyze';
      applyParams(next, h.params);
      current = next;
      if (next === 'analyze') renderAnalyze();
      if (next === 'subnet') renderSubnet();
      if (next === 'mac') renderMac();
      showTab(next);
      window.scrollTo(0, 0);
    });
  }

  init();
})();

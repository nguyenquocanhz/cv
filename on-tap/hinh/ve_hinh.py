# -*- coding: utf-8 -*-
"""
Vẽ toàn bộ hình minh hoạ cho giáo trình ôn tập bằng SVG rồi xuất PNG qua Chromium.

    python ve_hinh.py            # vẽ lại tất cả
    python ve_hinh.py h4_2       # chỉ vẽ một hình

Biến môi trường CHROME trỏ tới Chrome/Chromium nếu không nằm ở đường dẫn mặc định.
"""
import html, os, subprocess, sys

OUT = os.path.dirname(os.path.abspath(__file__))
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium")
FONT = "'Liberation Sans', Arial, 'DejaVu Sans', sans-serif"

NAVY, ACC, INK, TXT, MUTED = "#1F4E79", "#2563EB", "#1B2A4A", "#1F2937", "#52514E"
LIGHT, PALE, GRAY, BORDER = "#EBF5FB", "#DBEAFE", "#F2F2F2", "#BFBFBF"
ORANGE, ORANGE_L = "#C2410C", "#FFEDD5"
GREEN, GREEN_L = "#15803D", "#DCFCE7"
PCB, GOLD, CHIP = "#2F6B4F", "#D4A017", "#1F2937"
GRID, AXIS = "#E1E0D9", "#C3C2B7"

MARKER_COLORS = {"n": NAVY, "a": ACC, "m": MUTED, "o": ORANGE, "g": GREEN}


def esc(s):
    return html.escape(str(s), quote=False)


def T(x, y, s, fs=15, fill=TXT, anchor="middle", weight="normal", style="normal", lh=1.25, rot=None):
    """Chữ căn giữa theo chiều dọc quanh y; s là chuỗi hoặc danh sách dòng."""
    lines = list(s) if isinstance(s, (list, tuple)) else [s]
    step = fs * lh
    y0 = y - (len(lines) - 1) * step / 2
    tr = f' transform="rotate({rot} {x} {y})"' if rot is not None else ""
    return "".join(
        f'<text x="{x}" y="{y0 + i * step:.1f}" font-size="{fs}" fill="{fill}" text-anchor="{anchor}" '
        f'font-weight="{weight}" font-style="{style}" dominant-baseline="central"{tr}>{esc(ln)}</text>'
        for i, ln in enumerate(lines))


def R(x, y, w, h, fill="#fff", stroke=NAVY, sw=1.5, rx=8, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"{d}/>')


def BOX(x, y, w, h, title, sub=None, fill=LIGHT, stroke=NAVY, tc=INK, sc=MUTED, fs=16, sfs=13, rx=8, sw=1.5):
    tl = list(title) if isinstance(title, (list, tuple)) else [title]
    sl = [] if sub is None else (list(sub) if isinstance(sub, (list, tuple)) else [sub])
    total = len(tl) * fs * 1.25 + len(sl) * sfs * 1.3
    cy = y + h / 2 - total / 2
    out = [R(x, y, w, h, fill, stroke, sw, rx)]
    for t in tl:
        out.append(T(x + w / 2, cy + fs * 0.62, t, fs, tc, weight="bold"))
        cy += fs * 1.25
    for s in sl:
        out.append(T(x + w / 2, cy + sfs * 0.65, s, sfs, sc))
        cy += sfs * 1.3
    return "".join(out)


def A(x1, y1, x2, y2, c="n", sw=2, both=False, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    s = f' marker-start="url(#ah{c})"' if both else ""
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{MARKER_COLORS[c]}" stroke-width="{sw}"'
            f' marker-end="url(#ah{c})"{s}{d}/>')


def PL(pts, c="n", sw=2, arrow=True, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    m = f' marker-end="url(#ah{c})"' if arrow else ""
    p = " ".join(f"{x},{y}" for x, y in pts)
    return f'<polyline points="{p}" fill="none" stroke="{MARKER_COLORS[c]}" stroke-width="{sw}"{m}{d}/>'


def L(x1, y1, x2, y2, stroke=NAVY, sw=1.5, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"{d}/>'


def NUM(x, y, n, fill=ACC):
    """Nhãn số tròn dùng để chú thích hình."""
    return (f'<circle cx="{x}" cy="{y}" r="12" fill="{fill}" stroke="#fff" stroke-width="2"/>'
            + T(x, y + 0.5, n, 13, "#fff", weight="bold"))


def svg(w, h, body, extra_defs=""):
    marks = "".join(
        f'<marker id="ah{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
        f'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>'
        for k, c in MARKER_COLORS.items())
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
            f'font-family="{FONT}"><defs>{marks}{extra_defs}</defs>'
            f'<rect width="{w}" height="{h}" fill="#ffffff"/>{body}</svg>')


FIGS = {}


def fig(name, w, h):
    def deco(fn):
        FIGS[name] = (w, h, fn)
        return fn
    return deco


# ---------------------------------------------------------------------------
# Chương I
# ---------------------------------------------------------------------------
@fig("h1_1", 1040, 400)
def von_neumann():
    b = [R(20, 30, 320, 230, "#fff", NAVY, 2, 10),
         T(180, 56, "CPU — Bộ xử lý trung tâm", 17, NAVY, weight="bold"),
         BOX(40, 78, 280, 50, "CU — Khối điều khiển", "giải mã lệnh, điều phối", fs=15, sfs=12),
         BOX(40, 138, 280, 50, "ALU — Khối số học & logic", "cộng, trừ, so sánh", fs=15, sfs=12),
         BOX(40, 198, 280, 50, "Thanh ghi & cache", "vùng nhớ nhanh nhất", fs=15, sfs=12),
         BOX(360, 30, 170, 230, ["Bộ nhớ chính", "(RAM)"], ["chứa cả lệnh", "và dữ liệu", "đang xử lý"]),
         BOX(550, 30, 150, 230, "Thiết bị vào", ["bàn phím, chuột,", "máy quét"], fill=GRAY),
         BOX(720, 30, 150, 230, "Thiết bị ra", ["màn hình, loa,", "máy in"], fill=GRAY),
         BOX(890, 30, 130, 230, "Lưu trữ", ["SSD, HDD —", "giữ dữ liệu", "khi tắt máy"], fill=GRAY),
         R(20, 310, 1000, 56, NAVY, NAVY, 1, 8),
         T(520, 338, "BUS HỆ THỐNG  ·  bus địa chỉ  ·  bus dữ liệu  ·  bus điều khiển", 16, "#fff", weight="bold"),
         A(180, 262, 180, 306, both=True), A(445, 262, 445, 306, both=True),
         A(625, 262, 625, 306), A(795, 306, 795, 264), A(955, 262, 955, 306, both=True)]
    return "".join(b)


@fig("h1_2", 990, 480)
def memory_pyramid():
    cx, top, lh, w0, step = 360, 50, 72, 100, 92
    fills = ["#1F4E79", "#2B6CB0", "#3B82F6", "#93C5FD", "#DBEAFE"]
    tcol = ["#fff", "#fff", "#fff", INK, INK]
    names = ["Thanh ghi", "Cache L1 · L2 · L3", "RAM", "SSD", "HDD"]
    info = [("~0,3 ns", "vài trăm byte, nằm trong nhân CPU"),
            ("~1 – 20 ns", "vài MB đến ~100 MB, nằm trong CPU"),
            ("~60 – 100 ns", "8 – 128 GB trên máy phổ thông"),
            ("~50 – 100 µs", "256 GB – 4 TB"),
            ("~5 – 10 ms", "1 – 20+ TB")]
    b = []
    for i in range(5):
        y = top + i * lh
        wt, wb = w0 + i * step, w0 + (i + 1) * step
        pts = f"{cx - wt / 2},{y} {cx + wt / 2},{y} {cx + wb / 2},{y + lh - 3} {cx - wb / 2},{y + lh - 3}"
        b.append(f'<polygon points="{pts}" fill="{fills[i]}"/>')
        b.append(T(cx, y + lh / 2, names[i], 16, tcol[i], weight="bold"))
        b.append(T(660, y + lh / 2 - 11, info[i][0], 16, INK, anchor="start", weight="bold"))
        b.append(T(660, y + lh / 2 + 11, info[i][1], 13, MUTED, anchor="start"))
        b.append(L(cx + wb / 2 + 8, y + lh / 2, 648, y + lh / 2, BORDER, 1, "3 3"))
    b += [A(40, 395, 40, 55, "a", 2.5),
          T(40, 30, "Nhanh · đắt · nhỏ", 13, ACC, anchor="start", weight="bold"),
          T(40, 420, "Chậm · rẻ · dung lượng lớn", 13, MUTED, anchor="start", weight="bold"),
          T(660, 30, "Độ trễ tham khảo · dung lượng thường gặp", 13, MUTED, anchor="start", style="italic"),
          L(935, top + 4, 935, top + 3 * lh - 6, ORANGE, 2), L(927, top + 4, 935, top + 4, ORANGE, 2),
          L(927, top + 3 * lh - 6, 935, top + 3 * lh - 6, ORANGE, 2),
          T(958, top + 1.5 * lh, "Mất khi tắt nguồn", 13, ORANGE, weight="bold", rot=90),
          L(935, top + 3 * lh + 4, 935, top + 5 * lh - 6, GREEN, 2), L(927, top + 3 * lh + 4, 935, top + 3 * lh + 4, GREEN, 2),
          L(927, top + 5 * lh - 6, 935, top + 5 * lh - 6, GREEN, 2),
          T(958, top + 4 * lh, "Giữ khi tắt", 13, GREEN, weight="bold", rot=90),
          T(495, 455, "Tầng càng cao càng nhanh nhưng càng đắt trên mỗi GB — máy tính kết hợp nhiều tầng để vừa nhanh vừa rẻ.",
            13, MUTED, style="italic")]
    return "".join(b)


@fig("h1_3", 1040, 570)
def board_blocks():
    b = [BOX(370, 20, 300, 72, "Cổng xuất hình trên mainboard", "HDMI / DP — chỉ chạy khi CPU có iGPU", fill=GRAY),
         BOX(400, 150, 240, 110, "CPU", ["nhân xử lý + điều khiển RAM", "+ lane PCIe (+ iGPU)"],
             fill=NAVY, stroke=NAVY, tc="#fff", sc="#DBEAFE", fs=22, sfs=13),
         BOX(40, 150, 240, 110, "Khe RAM (DIMM)", ["2 kênh DDR4 hoặc DDR5", "nối thẳng vào CPU"]),
         BOX(770, 115, 240, 80, "Khe PCIe x16", "card đồ hoạ rời"),
         BOX(770, 215, 240, 80, "Khe M.2 NVMe chính", "dùng lane PCIe của CPU"),
         BOX(400, 345, 240, 80, "Chipset (PCH)", "vd. B760, Z790, B650, X870", fill=PALE),
         BOX(40, 350, 240, 70, "Chip BIOS / UEFI", "flash SPI + pin CMOS CR2032", fill=GRAY),
         A(520, 150, 520, 96), A(282, 205, 398, 205, both=True),
         A(640, 160, 768, 160, both=True), A(640, 245, 768, 245, both=True),
         A(520, 262, 520, 343, both=True),
         T(532, 300, "DMI (Intel) / PCIe x4 (AMD)", 13, MUTED, anchor="start", style="italic"),
         A(282, 385, 398, 385, both=True),
         L(520, 427, 520, 450), L(120, 450, 920, 450)]
    names = [("Cổng SATA", "ổ 2,5\" / 3,5\""), ("Cổng USB", "sau + header trước"), ("LAN / Wi-Fi", "card mạng onboard"),
             ("Âm thanh", "chip audio"), ("M.2 / PCIe phụ", "lane của chipset")]
    for i, (t, s) in enumerate(names):
        x = 30 + i * 200
        b.append(BOX(x, 480, 180, 70, t, s, fill="#fff", fs=15))
        b.append(A(x + 90, 450, x + 90, 478))
    return "".join(b)


@fig("h1_4", 1040, 440)
def boot_flow():
    steps = [("Nhấn nút nguồn", ["mainboard bật PSU", "qua tín hiệu PS_ON"]),
             ("PSU cấp điện", ["báo nguồn ổn định", "(Power Good)"]),
             ("CPU chạy UEFI/BIOS", ["mã nạp từ chip flash", "trên mainboard"]),
             ("POST", ["tự kiểm tra CPU,", "RAM, card hình"]),
             ("Khởi tạo thiết bị", ["đọc cấu hình đã lưu", "(CMOS / NVRAM)"]),
             ("Chọn ổ khởi động", ["theo thứ tự", "Boot Order"]),
             ("Nạp bootloader", ["UEFI: phân vùng EFI", "Legacy: sector MBR"]),
             ("Nạp hệ điều hành", ["Windows Boot Manager", "→ nhân Windows"])]
    xs = [20, 280, 540, 800]
    pos = [(xs[i], 30) for i in range(4)] + [(xs[3 - i], 215) for i in range(4)]
    b = []
    for i, ((x, y), (t, s)) in enumerate(zip(pos, steps)):
        b.append(BOX(x, y, 220, 110, t, s, fill=LIGHT if i < 4 else PALE, fs=16, sfs=13))
        b.append(NUM(x + 18, y + 18, str(i + 1), NAVY))
    for i in range(3):
        b.append(A(xs[i] + 222, 85, xs[i + 1] - 2, 85))
        b.append(A(xs[3 - i] - 2, 270, xs[2 - i] + 222, 270))
    b.append(A(910, 142, 910, 213))
    b.append(BOX(20, 355, 490, 70, "Hỏng ở bước 4", ["tiếng bíp hoặc đèn debug CPU / DRAM / VGA / BOOT", "sáng đứng — tra mã trong sách hướng dẫn"],
                 fill=ORANGE_L, stroke=ORANGE, tc=ORANGE, fs=15, sfs=13))
    b.append(BOX(530, 355, 490, 70, "Hỏng ở bước 6 – 7", ["\"No bootable device\", \"Reboot and select proper", "boot device\" — sai Boot Order, ổ hỏng, sai UEFI/Legacy"],
                 fill=ORANGE_L, stroke=ORANGE, tc=ORANGE, fs=15, sfs=13))
    return "".join(b)


# ---------------------------------------------------------------------------
# Chương II
# ---------------------------------------------------------------------------
@fig("h2_1", 1040, 370)
def packages():
    b = []
    titles = [("PGA — chân nằm trên CPU", ["vd. AMD AM4 · chân dễ cong", "khi tháo, cắm lệch"]),
              ("LGA — chân nằm trên socket", ["vd. Intel LGA 1700 / 1851, AMD AM5", "tránh chạm tay vào chân socket"]),
              ("BGA — hàn thẳng lên bo mạch", ["CPU laptop · không tháo,", "không nâng cấp được"])]
    for k, x0 in enumerate([20, 360, 700]):
        b.append(R(x0, 20, 320, 250, "#FAFAFA", BORDER, 1, 10))
        b.append(R(x0 + 20, 228, 280, 26, PCB, PCB, 1, 3))
        b.append(T(x0 + 160, 241, "bo mạch chủ", 12, "#fff"))
        b.append(T(x0 + 160, 300, titles[k][0], 16, INK, weight="bold"))
        b.append(T(x0 + 160, 335, titles[k][1], 13, MUTED))
    # PGA
    x0 = 20
    b.append(R(x0 + 50, 180, 220, 48, "#D1D5DB", "#6B7280", 1.2, 3))
    b.append(T(x0 + 160, 212, "socket có lỗ", 12, MUTED))
    b.append(R(x0 + 60, 110, 200, 34, "#9CA3AF", "#4B5563", 1.2, 3))
    b.append(R(x0 + 85, 92, 150, 18, "#E5E7EB", "#6B7280", 1, 3))
    b.append(T(x0 + 160, 127, "CPU", 13, "#fff", weight="bold"))
    for i in range(11):
        px = x0 + 75 + i * 17
        b.append(L(px, 144, px, 196, GOLD, 3))
    # LGA
    x0 = 360
    b.append(R(x0 + 50, 180, 220, 48, "#D1D5DB", "#6B7280", 1.2, 3))
    for i in range(11):
        px = x0 + 72 + i * 17
        b.append(f'<path d="M{px},180 L{px + 7},166" stroke="{GOLD}" stroke-width="3" fill="none"/>')
    b.append(T(x0 + 160, 212, "socket có chân lò xo", 12, MUTED))
    b.append(R(x0 + 60, 120, 200, 34, "#9CA3AF", "#4B5563", 1.2, 3))
    b.append(R(x0 + 85, 102, 150, 18, "#E5E7EB", "#6B7280", 1, 3))
    b.append(T(x0 + 160, 137, "CPU", 13, "#fff", weight="bold"))
    for i in range(11):
        px = x0 + 72 + i * 17
        b.append(R(px, 154, 10, 5, GOLD, GOLD, 0.5, 1))
    b.append(T(x0 + 160, 75, "mặt dưới CPU chỉ có tiếp điểm phẳng", 12, MUTED, style="italic"))
    # BGA
    x0 = 700
    b.append(R(x0 + 70, 180, 180, 32, "#9CA3AF", "#4B5563", 1.2, 3))
    b.append(T(x0 + 160, 196, "CPU (die)", 13, "#fff", weight="bold"))
    for i in range(10):
        b.append(f'<circle cx="{x0 + 82 + i * 17.5}" cy="220" r="6" fill="#9CA3AF" stroke="#4B5563" stroke-width="1"/>')
    b.append(T(x0 + 160, 150, "bi thiếc hàn nối chip với bo mạch", 12, MUTED, style="italic"))
    return "".join(b)


@fig("h2_2", 1040, 310)
def socket_timeline():
    x0, x1, y0y, y1y = 150, 1010, 2009, 2027
    sx = lambda yr: x0 + (yr - y0y) * (x1 - x0) / (y1y - y0y)
    b = []
    for yr in range(2009, 2028, 2):
        b.append(L(sx(yr), 55, sx(yr), 235, GRID, 1))
        b.append(T(sx(yr), 252, str(yr), 13, MUTED))
    b.append(L(x0, 235, x1, 235, AXIS, 1))
    intel = [("LGA 1156", 2009.7, 2011.0), ("LGA 1155", 2011.0, 2013.4), ("LGA 1150", 2013.4, 2015.6),
             ("LGA 1151", 2015.6, 2020.3), ("LGA 1200", 2020.3, 2021.85), ("LGA 1700", 2021.85, 2024.8),
             ("LGA 1851", 2024.8, 2026.7)]
    amd = [("AM3 / AM3+", 2009.1, 2017.2), ("AM4 (PGA)", 2017.2, 2022.75), ("AM5 (LGA)", 2022.75, 2026.7)]
    for lane, items, y, cols in [("Intel", intel, 70, ["#1F4E79", "#3B82F6"]), ("AMD", amd, 160, ["#9A3412", "#EA580C"])]:
        b.append(T(20, y + 25, lane, 18, INK, anchor="start", weight="bold"))
        for i, (name, a, z) in enumerate(items):
            w = sx(z) - sx(a) - 2
            b.append(R(sx(a) + 1, y, w, 50, cols[i % 2], "#fff", 0, 4))
            b.append(T(sx(a) + 1 + w / 2, y + 25, name, 13 if w > 80 else 11, "#fff", weight="bold"))
        b.append(f'<path d="M{sx(2026.7) + 2},{y} L{sx(2026.7) + 18},{y + 25} L{sx(2026.7) + 2},{y + 50} z" fill="{cols[len(items) % 2 - 1]}"/>')
    b.append(T(520, 285, "Mỗi thanh: giai đoạn socket là nền tảng chính — từ khi ra mắt tới khi socket kế tiếp ra mắt (mốc tham khảo).",
               13, MUTED, style="italic"))
    return "".join(b)


# ---------------------------------------------------------------------------
# Chương III
# ---------------------------------------------------------------------------
def ram_module(x, y, w, h, n_chips, notch_frac, pmic=False, sticker=None, side_notch=True):
    nx = x + w * notch_frac
    ch = 22  # chiều sâu vùng chân tiếp xúc
    path = (f"M{x},{y} H{x + w} V{y + h} H{nx + 5} V{y + h - 14} H{nx - 5} V{y + h} H{x} Z")
    out = [f'<path d="{path}" fill="{PCB}" stroke="#1E4D38" stroke-width="1.2"/>']
    # chân tiếp xúc
    out.append(f'<rect x="{x + 6}" y="{y + h - ch + 4}" width="{w - 12}" height="{ch - 5}" fill="{GOLD}"/>')
    px = x + 8
    while px < x + w - 8:
        out.append(L(px, y + h - ch + 4, px, y + h - 1, "#A67C00", 0.8))
        px += 4.2
    out.append(f'<rect x="{nx - 5}" y="{y + h - 16}" width="10" height="17" fill="#ffffff"/>')
    if side_notch:
        for sxp in (x, x + w):
            out.append(f'<circle cx="{sxp}" cy="{y + h * 0.5}" r="7" fill="#ffffff"/>')
    # chip nhớ
    cw = min(58, (w - 40) / n_chips - 10)
    gap = (w - 30 - n_chips * cw) / (n_chips - 1) if n_chips > 1 else 0
    for i in range(n_chips):
        cx = x + 15 + i * (cw + gap)
        out.append(R(cx, y + 14, cw, 38, CHIP, CHIP, 0, 2))
    if pmic:
        out.append(R(x + w / 2 - 16, y + h - 50, 32, 20, "#6B7280", "#374151", 1, 2))
        out.append(T(x + w / 2, y + h - 40, "PMIC", 9, "#fff", weight="bold"))
    if sticker:
        out.append(R(x + 22, y + 10, 230, 46, "#ffffff", "#9CA3AF", 1, 2))
        out.append(T(x + 32, y + 24, sticker[0], 12, TXT, anchor="start", weight="bold"))
        out.append(T(x + 32, y + 42, sticker[1], 11, MUTED, anchor="start"))
    return "".join(out)


@fig("h3_1", 1040, 430)
def ram_modules():
    b = [T(30, 22, "DIMM — máy bàn · dài 133,35 mm (minh hoạ DDR5)", 15, INK, anchor="start", weight="bold"),
         ram_module(30, 40, 693, 115, 8, 0.44, pmic=True, sticker=("16GB 1Rx8 PC5-4800B", "UA0-1010-XT · DDR5-4800")),
         T(30, 222, "SO-DIMM — laptop · dài 69,6 mm (minh hoạ DDR4)", 15, INK, anchor="start", weight="bold"),
         ram_module(30, 240, 362, 115, 4, 0.41, sticker=("8GB 1Rx8 PC4-3200AA", "SA2-11 · DDR4-3200"), side_notch=True),
         NUM(262, 64, "1"), NUM(370, 92, "2"), NUM(415, 110, "3"), NUM(335, 172, "4"), NUM(600, 147, "5"),
         NUM(723, 70, "6"), NUM(178, 372, "4"),
         BOX(420, 250, 300, 104, "Lưu ý", ["Mỗi đời RAM đặt khấc ở vị trí khác nhau", "nên không cắm nhầm đời được. Hình chỉ", "minh hoạ nguyên lý, không dùng để đo."],
             fill=ORANGE_L, stroke=ORANGE, tc=ORANGE, fs=14, sfs=12)]
    legend = [("1", "Nhãn", "dung lượng, số rank, chuẩn tốc độ"), ("2", "Chip nhớ DRAM", "một hoặc hai mặt"),
              ("3", "PMIC", "chip quản lý điện — chỉ có từ DDR5"), ("4", "Khấc (notch)", "chống cắm nhầm đời, cắm ngược"),
              ("5", "Chân tiếp xúc", "mạ vàng — lau bằng gôm khi tiếp xúc kém"), ("6", "Rãnh khoá", "để lẫy khe RAM giữ chặt thanh")]
    for i, (n, t, s) in enumerate(legend):
        yy = 60 + i * 60
        b.append(NUM(770, yy, n))
        b.append(T(792, yy - 9, t, 14, INK, anchor="start", weight="bold"))
        b.append(T(792, yy + 11, s, 12, MUTED, anchor="start"))
    return "".join(b)


@fig("h3_2", 1040, 400)
def dual_channel():
    b = [R(20, 20, 620, 360, "#F1F5F9", BORDER, 1, 10),
         R(60, 120, 170, 170, GRAY, NAVY, 1.5, 6), T(145, 205, ["Socket", "CPU"], 16, INK, weight="bold")]
    names = ["A1", "A2", "B1", "B2"]
    for i, nm in enumerate(names):
        x = 290 + i * 70
        filled = nm in ("A2", "B2")
        b.append(R(x, 62, 30, 270, ACC if filled else "#fff", NAVY, 1.5, 4))
        if filled:
            b.append(T(x + 15, 197, "RAM", 12, "#fff", weight="bold", rot=-90))
        b.append(T(x + 15, 45, nm, 16, INK, weight="bold"))
    b += [L(290, 348, 390, 348, NAVY, 2), T(340, 364, "Kênh A", 13, NAVY, weight="bold"),
          L(430, 348, 530, 348, NAVY, 2), T(480, 364, "Kênh B", 13, NAVY, weight="bold"),
          T(145, 318, "gần CPU nhất → xa dần", 12, MUTED, style="italic"),
          A(235, 205, 285, 205, "m", 1.5)]
    rules = [("1 thanh", "cắm khe A2"), ("2 thanh", "cắm A2 + B2 → chạy kênh đôi"), ("4 thanh", "cắm đủ bốn khe")]
    b.append(T(670, 45, "Cách cắm phổ biến", 17, INK, anchor="start", weight="bold"))
    for i, (k, v) in enumerate(rules):
        yy = 90 + i * 44
        b.append(R(670, yy - 16, 90, 32, PALE, NAVY, 1, 6))
        b.append(T(715, yy, k, 14, INK, weight="bold"))
        b.append(T(772, yy, v, 14, TXT, anchor="start"))
    b.append(T(670, 250, ["Kênh đôi nhân đôi băng thông lý thuyết.", "Nên dùng 2 thanh giống nhau, tốt nhất", "mua nguyên kit."],
               13, TXT, anchor="start", lh=1.45))
    b.append(T(670, 335, ["Thứ tự khe tuỳ hãng — luôn đối chiếu", "sách hướng dẫn mainboard."], 13, ORANGE, anchor="start",
               weight="bold", lh=1.45))
    return "".join(b)


# ---------------------------------------------------------------------------
# Chương IV
# ---------------------------------------------------------------------------
@fig("h4_1", 1040, 470)
def hdd():
    b = [R(40, 30, 520, 400, "#E5E7EB", "#6B7280", 2, 22),
         f'<circle cx="270" cy="200" r="165" fill="#CBD5E1" stroke="#64748B" stroke-width="1.5"/>']
    for r in (140, 115, 90, 65):
        b.append(f'<circle cx="270" cy="200" r="{r}" fill="none" stroke="#94A3B8" stroke-width="0.8"/>')
    b += [f'<circle cx="270" cy="200" r="30" fill="#94A3B8" stroke="#475569" stroke-width="1.5"/>',
          f'<circle cx="270" cy="200" r="6" fill="#475569"/>',
          f'<path d="M488,392 L540,372 L548,420 L500,428 z" fill="#78716C" stroke="#44403C" stroke-width="1.2"/>',
          f'<line x1="480" y1="385" x2="318" y2="140" stroke="#6B7280" stroke-width="16" stroke-linecap="round"/>',
          f'<line x1="480" y1="385" x2="318" y2="140" stroke="#9CA3AF" stroke-width="8" stroke-linecap="round"/>',
          R(306, 124, 22, 16, "#374151", "#111827", 1, 2),
          f'<circle cx="480" cy="385" r="22" fill="#9CA3AF" stroke="#4B5563" stroke-width="1.5"/>',
          R(90, 430, 210, 14, GOLD, "#A67C00", 1, 2),
          NUM(170, 110, "1"), NUM(270, 244, "2"), NUM(344, 112, "3"), NUM(420, 280, "4"), NUM(548, 395, "5"),
          NUM(320, 444, "6")]
    legend = [("1", "Đĩa từ (platter)", "phủ lớp từ tính; dữ liệu nằm trên các rãnh (track)"),
              ("2", "Trục quay (spindle)", "5.400 hoặc 7.200 vòng/phút"),
              ("3", "Đầu đọc/ghi", "bay cách mặt đĩa chỉ vài nanomet"),
              ("4", "Cần gạt (actuator arm)", "đưa đầu đọc tới đúng rãnh"),
              ("5", "Cuộn cảm động", "(voice coil) điều khiển cần gạt"),
              ("6", "Cổng SATA", "mặt dưới có bo mạch điều khiển + cache")]
    for i, (n, t, s) in enumerate(legend):
        yy = 50 + i * 58
        b.append(NUM(610, yy, n))
        b.append(T(632, yy - 9, t, 15, INK, anchor="start", weight="bold"))
        b.append(T(632, yy + 12, s, 13, MUTED, anchor="start"))
    b.append(BOX(600, 395, 420, 60, "Vì sao HDD sợ va đập?", "đầu đọc chạm mặt đĩa → bad sector, hỏng cơ",
                 fill=ORANGE_L, stroke=ORANGE, tc=ORANGE, fs=14, sfs=13))
    return "".join(b)


def m2_strip(x, y, key, label, sub):
    """Mép chân M.2 nhìn thẳng: 75 vị trí, mỗi vị trí 4px; mặt trên có chân lẻ."""
    w = 300
    cuts = []
    if key in ("B", "BM"):
        cuts.append((12, 19))
    if key in ("M", "BM"):
        cuts.append((59, 66))
    path = f"M{x},{y} H{x + w} V{y + 70}"
    for a, z in sorted(cuts, reverse=True):
        path += f" H{x + z * 4} V{y + 50} H{x + (a - 1) * 4} V{y + 70}"
    path += f" H{x} Z"
    out = [T(x, y - 22, label, 15, INK, anchor="start", weight="bold"), T(x + 150, y - 22, sub, 12, MUTED, anchor="start"),
           f'<path d="{path}" fill="{PCB}" stroke="#1E4D38" stroke-width="1.2"/>',
           R(x + 90, y + 8, 60, 26, CHIP, CHIP, 0, 2), R(x + 170, y + 8, 60, 26, CHIP, CHIP, 0, 2)]
    for p in range(1, 76, 2):
        if any(a <= p <= z for a, z in cuts):
            continue
        out.append(R(x + (p - 1) * 4 - 1, y + 53, 5, 16, GOLD, GOLD, 0, 0.5))
    return "".join(out)


@fig("h4_2", 1040, 470)
def m2_forms():
    b = [T(40, 22, "Kích thước (rộng 22 mm × dài) — vẽ cùng tỉ lệ", 15, INK, anchor="start", weight="bold")]
    sizes = [("2230", 30, "Steam Deck, Surface, laptop mỏng"), ("2242", 42, "laptop cũ, mini PC"),
             ("2260", 60, "ít gặp"), ("2280", 80, "phổ biến nhất: PC và laptop")]
    for i, (nm, ln, use) in enumerate(sizes):
        y = 45 + i * 105
        w = ln * 4.2
        # đầu xa có khấc bán nguyệt để bắt vít giữ ổ
        b.append(f'<path d="M40,{y} H{40 + w} V{y + 37} A9,9 0 0,0 {40 + w},{y + 55} V{y + 92} H40 Z" '
                 f'fill="{PCB}" stroke="#1E4D38" stroke-width="1.2"/>')
        b.append(R(40, y + 8, 12, 76, GOLD, GOLD, 0, 1))
        nch = max(1, int((w - 40) // 70))
        for k in range(nch):
            b.append(R(62 + k * 70, y + 22, 54, 48, CHIP, CHIP, 0, 2))
        b.append(T(40 + w + 18, y + 34, nm, 18, INK, anchor="start", weight="bold"))
        b.append(T(40 + w + 18, y + 58, use, 13, MUTED, anchor="start"))
    b.append(L(600, 30, 600, 450, GRID, 1))
    b.append(T(640, 22, "Khấc ở mép chân (key)", 15, INK, anchor="start", weight="bold"))
    b.append(m2_strip(640, 90, "B", "B key", "6 chân ở phần ngắn"))
    b.append(m2_strip(640, 225, "M", "M key", "5 chân ở phần ngắn"))
    b.append(m2_strip(640, 360, "BM", "B + M key", "hai khấc"))
    b.append(T(640, 175, "SATA hoặc PCIe x2", 13, TXT, anchor="start"))
    b.append(T(640, 310, "PCIe x4 NVMe — hầu hết SSD NVMe", 13, TXT, anchor="start"))
    b.append(T(640, 445, "thường là SSD M.2 SATA", 13, TXT, anchor="start"))
    return "".join(b)


@fig("h4_3", 1000, 390)
def speed_chart():
    data = [("HDD 7.200 vòng/phút", 200), ("SSD SATA III", 550), ("NVMe PCIe 3.0 x4", 3500),
            ("NVMe PCIe 4.0 x4", 7000), ("NVMe PCIe 5.0 x4", 14000)]
    x0, x1, vmax = 250, 930, 16000
    sx = lambda v: x0 + v * (x1 - x0) / vmax
    top, row = 30, 58
    b = []
    for v in range(0, vmax + 1, 4000):
        b.append(L(sx(v), top - 6, sx(v), top + row * len(data), GRID, 1))
        b.append(T(sx(v), top + row * len(data) + 18, f"{v:,}".replace(",", "."), 13, MUTED))
    for i, (name, v) in enumerate(data):
        yc = top + i * row + row / 2
        b.append(T(x0 - 14, yc, name, 15, TXT, anchor="end"))
        xe = sx(v)
        r = min(4, xe - x0)
        b.append(f'<path d="M{x0},{yc - 12} H{xe - r} Q{xe},{yc - 12} {xe},{yc - 12 + r} V{yc + 12 - r} '
                 f'Q{xe},{yc + 12} {xe - r},{yc + 12} H{x0} Z" fill="{ACC}"/>')
        b.append(T(xe + 8, yc, f"~{v:,}".replace(",", ".") + " MB/s", 14, INK, anchor="start", weight="bold"))
    b.append(L(x0, top - 6, x0, top + row * len(data), AXIS, 1))
    b.append(T((x0 + x1) / 2, top + row * len(data) + 44, "Tốc độ đọc tuần tự tối đa điển hình (MB/s) — đọc/ghi ngẫu nhiên thực tế thấp hơn nhiều",
               13, MUTED, style="italic"))
    return "".join(b)


@fig("h4_4", 1040, 450)
def sd_card():
    x, y, w, h = 60, 40, 300, 390
    b = [f'<path d="M{x},{y} H{x + w - 50} L{x + w},{y + 50} V{y + h} H{x} Z" fill="#1F2937" stroke="#111827" stroke-width="2"/>',
         R(x, y + 250, w, 56, "#B91C1C", "#B91C1C", 0, 0),
         T(x + 24, y + 60, "64GB", 44, "#fff", anchor="start", weight="bold"),
         T(x + 24, y + 110, "SDXC", 30, "#fff", anchor="start", weight="bold"),
         R(x + 150, y + 90, 38, 40, "none", "#fff", 2.5, 3), T(x + 169, y + 110, "I", 26, "#fff", weight="bold"),
         f'<circle cx="{x + 50}" cy="{y + 185}" r="26" fill="none" stroke="#fff" stroke-width="3"/>',
         f'<rect x="{x + 62}" y="{y + 170}" width="16" height="30" fill="#1F2937"/>',
         T(x + 52, y + 186, "10", 18, "#fff", weight="bold"),
         f'<path d="M{x + 104},{y + 160} V{y + 198} Q{x + 104},{y + 212} {x + 120},{y + 212} H{x + 136} '
         f'Q{x + 152},{y + 212} {x + 152},{y + 198} V{y + 160}" fill="none" stroke="#fff" stroke-width="4"/>',
         T(x + 128, y + 188, "3", 22, "#fff", weight="bold"),
         T(x + 172, y + 186, "V30", 26, "#fff", anchor="start", weight="bold"),
         R(x + 238, y + 166, 44, 40, "none", "#fff", 2.5, 4), T(x + 260, y + 186, "A2", 20, "#fff", weight="bold"),
         T(x + 150, y + 278, "170MB/s", 26, "#fff", weight="bold"),
         NUM(x + 130, y + 110, "1"), NUM(x + 200, y + 92, "2"), NUM(x + 22, y + 160, "3"), NUM(x + 128, y + 150, "4"),
         NUM(x + 190, y + 216, "5"), NUM(x + 290, y + 216, "6"), NUM(x + 262, y + 260, "7")]
    legend = [("1", "SDXC — nhóm dung lượng", "SD ≤ 2 GB · SDHC 2–32 GB · SDXC 32 GB–2 TB · SDUC 2–128 TB"),
              ("2", "I — bus UHS-I", "băng thông bus tối đa 104 MB/s; II = UHS-II (312 MB/s)"),
              ("3", "C10 — Speed Class 10", "tốc độ ghi tối thiểu 10 MB/s"),
              ("4", "U3 — UHS Speed Class 3", "tốc độ ghi tối thiểu 30 MB/s (U1 = 10 MB/s)"),
              ("5", "V30 — Video Speed Class", "ghi tối thiểu 30 MB/s, đủ cho quay video 4K"),
              ("6", "A2 — App Performance", "≥ 4.000 IOPS đọc / 2.000 IOPS ghi: điện thoại, máy chơi game"),
              ("7", "170MB/s — tốc độ đọc tối đa", "theo hãng, thường cần đầu đọc của chính hãng đó")]
    for i, (n, t, s) in enumerate(legend):
        yy = 55 + i * 56
        b.append(NUM(420, yy, n))
        b.append(T(442, yy - 10, t, 15, INK, anchor="start", weight="bold"))
        b.append(T(442, yy + 11, s, 13, MUTED, anchor="start"))
    return "".join(b)


# ---------------------------------------------------------------------------
# Chương V
# ---------------------------------------------------------------------------
@fig("h5_1", 1040, 470)
def usb_ports():
    s = 11  # px trên mm
    b = []
    cells = [
        ("USB-A (2.0)", "lõi đen/trắng · 480 Mb/s", "A2"), ("USB-A (3.x)", "thường có lõi xanh · 5 – 10 Gb/s", "A3"),
        ("USB-B", "máy in, máy quét", "B"), ("Mini-B", "máy ảnh, thiết bị cũ", "mini"),
        ("Micro-B", "điện thoại Android cũ", "micro"), ("Micro-B 3.0", "ổ cứng di động đời cũ", "micro3"),
        ("USB-C", "cắm 2 chiều · tốc độ tuỳ thiết bị", "C")]
    for i, (name, sub, kind) in enumerate(cells):
        row, col = (0, i) if i < 4 else (1, i - 4)
        cx = 130 + col * 260 if row == 0 else 260 + col * 260
        cy = 95 if row == 0 else 275
        if kind in ("A2", "A3"):
            w, h = 12 * s, 4.5 * s
            b.append(R(cx - w / 2, cy - h / 2, w, h, "#E5E7EB", "#4B5563", 2, 2))
            b.append(R(cx - w / 2 + 8, cy - h / 2 + 6, w - 16, h / 2 - 4, ACC if kind == "A3" else "#111827", "none", 0, 1))
        elif kind == "B":
            w, h = 8.45 * s, 7.78 * s
            x, y = cx - w / 2, cy - h / 2
            b.append(f'<path d="M{x + 14},{y} H{x + w - 14} L{x + w},{y + 14} V{y + h} H{x} V{y + 14} Z" fill="#E5E7EB" stroke="#4B5563" stroke-width="2"/>')
            b.append(R(cx - 22, cy - 14, 44, 34, "#111827", "none", 0, 2))
        elif kind == "mini":
            w, h = 6.8 * s, 3.0 * s
            x, y = cx - w / 2, cy - h / 2
            b.append(f'<path d="M{x},{y} H{x + w} V{y + h * 0.55} L{x + w - 10},{y + h} H{x + 10} L{x},{y + h * 0.55} Z" fill="#E5E7EB" stroke="#4B5563" stroke-width="2"/>')
        elif kind == "micro":
            w, h = 6.85 * s, 1.8 * s
            x, y = cx - w / 2, cy - h / 2
            b.append(f'<path d="M{x},{y} H{x + w} L{x + w - 8},{y + h} H{x + 8} Z" fill="#E5E7EB" stroke="#4B5563" stroke-width="2"/>')
        elif kind == "micro3":
            w, h = 12.25 * s, 1.8 * s
            x, y = cx - w / 2, cy - h / 2
            w1 = 6.85 * s
            b.append(f'<path d="M{x},{y} H{x + w1} L{x + w1 - 8},{y + h} H{x + 8} Z" fill="#E5E7EB" stroke="#4B5563" stroke-width="2"/>')
            b.append(R(x + w1 + 4, y, w - w1 - 4, h, "#E5E7EB", "#4B5563", 2, 2))
        else:
            w, h = 8.34 * s, 2.56 * s
            b.append(R(cx - w / 2, cy - h / 2, w, h, "#E5E7EB", "#4B5563", 2, h / 2))
            b.append(R(cx - w / 2 + 12, cy - 3, w - 24, 6, "#111827", "none", 0, 3))
        b.append(T(cx, cy + 75, name, 16, INK, weight="bold"))
        b.append(T(cx, cy + 98, sub, 13, MUTED))
    b.append(BOX(160, 412, 720, 44, "Hình dạng đầu cắm không quyết định tốc độ — một cổng USB-C vẫn có thể chỉ là USB 2.0",
                 fill=ORANGE_L, stroke=ORANGE, tc=ORANGE, fs=14))
    b.append(T(1030, 20, "vẽ cùng tỉ lệ, nhìn thẳng vào cổng", 12, MUTED, anchor="end", style="italic"))
    return "".join(b)


@fig("h5_2", 1040, 300)
def display_ports():
    b = []
    cells = [("VGA", ["analog · 15 chân", "không có âm thanh"]), ("DVI", ["số (DVI-I có thêm analog)", "không có âm thanh"]),
             ("HDMI", ["số · có âm thanh", "TV, màn hình, máy chiếu"]), ("DisplayPort", ["số · có âm thanh", "màn hình tần số quét cao"]),
             ("USB-C (DP Alt Mode)", ["xuất hình qua USB-C", "laptop, dock"])]
    for i, (name, sub) in enumerate(cells):
        cx, cy = 110 + i * 205, 100
        if name == "VGA":
            b.append(f'<path d="M{cx - 80},{cy - 30} H{cx + 80} L{cx + 68},{cy + 30} H{cx - 68} Z" fill="#DBEAFE" stroke="#1E3A8A" stroke-width="2"/>')
            for r, (n, off) in enumerate([(5, 0), (5, 7), (5, 0)]):
                for k in range(n):
                    b.append(f'<circle cx="{cx - 44 + off + k * 22}" cy="{cy - 16 + r * 16}" r="4" fill="#1E3A8A"/>')
        elif name == "DVI":
            b.append(f'<path d="M{cx - 90},{cy - 28} H{cx + 90} V{cy + 20} L{cx + 80},{cy + 28} H{cx - 80} L{cx - 90},{cy + 20} Z" fill="#F3F4F6" stroke="#374151" stroke-width="2"/>')
            for r in range(3):
                for k in range(8):
                    b.append(R(cx - 78 + k * 13, cy - 18 + r * 14, 7, 7, "#374151", "none", 0, 1))
            b.append(R(cx + 40, cy - 3, 40, 6, "#374151", "none", 0, 1))
        elif name == "HDMI":
            b.append(f'<path d="M{cx - 70},{cy - 20} H{cx + 70} V{cy + 6} L{cx + 56},{cy + 20} H{cx - 56} L{cx - 70},{cy + 6} Z" fill="#E5E7EB" stroke="#374151" stroke-width="2"/>')
            b.append(R(cx - 54, cy - 8, 108, 8, "#111827", "none", 0, 1))
        elif name == "DisplayPort":
            b.append(f'<path d="M{cx - 80},{cy - 22} H{cx + 80} V{cy + 22} H{cx - 66} L{cx - 80},{cy + 8} Z" fill="#E5E7EB" stroke="#374151" stroke-width="2"/>')
            b.append(R(cx - 58, cy - 8, 120, 8, "#111827", "none", 0, 1))
        else:
            b.append(R(cx - 46, cy - 14, 92, 28, "#E5E7EB", "#374151", 2, 14))
            b.append(R(cx - 32, cy - 3, 64, 6, "#111827", "none", 0, 3))
        b.append(T(cx, cy + 75, name, 16, INK, weight="bold"))
        b.append(T(cx, cy + 108, sub, 13, MUTED, lh=1.35))
    b.append(T(520, 280, "Máy có card đồ hoạ rời: luôn cắm màn hình vào cổng trên card, không cắm vào cổng của mainboard.",
               14, ORANGE, weight="bold"))
    return "".join(b)


# ---------------------------------------------------------------------------
# Chương VI
# ---------------------------------------------------------------------------
@fig("h6_1", 1040, 500)
def network_topology():
    cloud = "".join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#E0F2FE" stroke="none"/>'
                    for x, y, rx, ry in [(95, 240, 62, 40), (145, 215, 55, 42), (160, 262, 55, 34), (70, 262, 40, 28)])
    b = [cloud, T(118, 240, "Internet", 19, NAVY, weight="bold"),
         BOX(250, 205, 160, 72, "Modem quang", "(ONT) của nhà mạng", fill=GRAY),
         BOX(470, 190, 180, 100, "Router Wi-Fi", ["NAT · DHCP", "tường lửa"], fill=PALE),
         BOX(730, 60, 140, 64, "Switch", "chia cổng có dây"),
         BOX(910, 20, 115, 50, "Máy bàn 1", fill="#fff", fs=14), BOX(910, 85, 115, 50, "Máy bàn 2", fill="#fff", fs=14),
         BOX(910, 150, 115, 50, "Máy in mạng", fill="#fff", fs=14),
         BOX(760, 330, 130, 56, "Laptop", fill="#fff", fs=15), BOX(910, 330, 115, 56, "Điện thoại", fill="#fff", fs=15),
         A(200, 241, 248, 241, both=True), A(412, 241, 468, 241, both=True),
         PL([(560, 190), (560, 92), (728, 92)]),
         PL([(870, 92), (890, 92), (890, 45), (908, 45)]), A(870, 110, 908, 110), PL([(870, 110), (890, 110), (890, 175), (908, 175)]),
         PL([(630, 290), (630, 358), (758, 358)], "a", 2, True, "7 5"),
         PL([(630, 290), (630, 410), (967, 410), (967, 388)], "a", 2, True, "7 5"),
         T(330, 180, "IP công cộng (WAN)", 13, MUTED, style="italic"),
         T(545, 325, ["Mạng LAN", "192.168.1.0/24"], 13, NAVY, weight="bold"),
         L(60, 448, 110, 448, NAVY, 2), T(120, 448, "cáp mạng (Ethernet)", 13, TXT, anchor="start"),
         L(300, 448, 350, 448, ACC, 2, "7 5"), T(360, 448, "Wi-Fi", 13, TXT, anchor="start"),
         T(520, 482, "Nhiều nhà mạng gộp modem quang, router và Wi-Fi vào một thiết bị.", 13, MUTED, style="italic")]
    for r in (12, 22, 32):
        b.append(f'<path d="M{662 - r * 0.2},{205 - r} A{r},{r} 0 0,1 {662 + r},{205 + r * 0.2}" fill="none" stroke="{ACC}" stroke-width="2.5"/>')
    return "".join(b)


@fig("h6_2", 1040, 520)
def osi_tcpip():
    top, rh = 60, 62
    osi = [("7", "Ứng dụng", "Application"), ("6", "Trình diễn", "Presentation"), ("5", "Phiên", "Session"),
           ("4", "Giao vận", "Transport"), ("3", "Mạng", "Network"), ("2", "Liên kết dữ liệu", "Data Link"),
           ("1", "Vật lý", "Physical")]
    fills = ["#1F4E79", "#245A8C", "#2B6CB0", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"]
    b = [T(165, 32, "Mô hình OSI (7 tầng)", 15, INK, weight="bold"), T(430, 32, "TCP/IP (4 tầng)", 15, INK, weight="bold"),
         T(700, 32, "Giao thức · thiết bị tiêu biểu", 15, INK, weight="bold"), T(955, 32, "Đơn vị dữ liệu", 15, INK, weight="bold")]
    for i, (n, vi, en) in enumerate(osi):
        y = top + i * rh
        tc = "#fff" if i < 5 else INK
        b.append(R(20, y, 290, rh - 6, fills[i], "none", 0, 6))
        b.append(T(44, y + (rh - 6) / 2, n, 20, tc, weight="bold"))
        b.append(T(70, y + (rh - 6) / 2 - 9, vi, 15, tc, anchor="start", weight="bold"))
        b.append(T(70, y + (rh - 6) / 2 + 11, en, 12, tc, anchor="start"))
    groups = [(0, 3, "Ứng dụng", "HTTP/HTTPS, DNS, DHCP, FTP,|SMTP, SSH, RDP", "Dữ liệu"),
              (3, 1, "Giao vận", "TCP (tin cậy), UDP (nhanh)|— số cổng (port)", "Segment"),
              (4, 1, "Internet", "IP, ICMP (lệnh ping)|— router", "Packet (gói)"),
              (5, 2, "Truy cập mạng", "Ethernet, Wi-Fi, địa chỉ MAC — switch|cáp đồng, cáp quang, RJ45 — hub", "Frame · Bit")]
    for start, n, name, ex, unit in groups:
        y = top + start * rh
        h = n * rh - 6
        b.append(BOX(330, y, 200, h, name, fill=PALE, fs=16))
        b.append(R(550, y, 300, h, "#fff", BORDER, 1, 6))
        b.append(T(700, y + h / 2, ex.split("|"), 13, TXT, lh=1.4))
        b.append(BOX(870, y, 150, h, unit, fill=GRAY, stroke=BORDER, fs=14))
    b.append(T(520, 508, "Mẹo nhớ OSI từ tầng 1 lên 7: \"Please Do Not Throw Sausage Pizza Away\".", 13, MUTED, style="italic"))
    return "".join(b)


@fig("h6_3", 1000, 430)
def dhcp_dora():
    b = [BOX(110, 20, 180, 66, "Máy tính", "chưa có địa chỉ IP", fill=GRAY),
         BOX(710, 20, 180, 66, "DHCP server", "thường là router", fill=PALE),
         L(200, 88, 200, 360, MUTED, 1.5, "6 5"), L(800, 88, 800, 360, MUTED, 1.5, "6 5")]
    msgs = [(130, True, "1. DISCOVER", "\"Có DHCP server nào không?\" (gửi quảng bá)"),
            (195, False, "2. OFFER", "\"Dùng địa chỉ 192.168.1.23 nhé\""),
            (260, True, "3. REQUEST", "\"Tôi xin nhận 192.168.1.23\""),
            (325, False, "4. ACK", "\"Đồng ý: IP, subnet mask, gateway, DNS, thời hạn thuê\"")]
    for y, right, t, s in msgs:
        b.append(A(205, y, 795, y, "n") if right else A(795, y, 205, y, "a"))
        b.append(T(500, y - 30, t, 14, NAVY if right else ACC, weight="bold"))
        b.append(T(500, y - 13, s, 13, TXT))
    b.append(T(500, 400, "Không nhận được OFFER → Windows tự đặt 169.254.x.x (APIPA) → không vào được mạng.",
               14, ORANGE, weight="bold"))
    return "".join(b)


@fig("h6_4", 1040, 380)
def t568():
    col = {"cam": "#F97316", "lá": "#16A34A", "dương": "#2563EB", "nâu": "#7C4A1E"}
    pats = "".join(
        f'<pattern id="st{k}" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(40)">'
        f'<rect width="12" height="12" fill="#ffffff"/><rect width="5" height="12" fill="{c}"/></pattern>'
        for k, c in col.items())
    A_ = [("w", "lá"), ("s", "lá"), ("w", "cam"), ("s", "dương"), ("w", "dương"), ("s", "cam"), ("w", "nâu"), ("s", "nâu")]
    B_ = [("w", "cam"), ("s", "cam"), ("w", "lá"), ("s", "dương"), ("w", "dương"), ("s", "lá"), ("w", "nâu"), ("s", "nâu")]
    b = []
    for (name, sub, wires, y) in [("T568A", "ít dùng", A_, 40), ("T568B", "phổ biến nhất", B_, 210)]:
        b.append(T(40, y + 40, name, 22, INK, anchor="start", weight="bold"))
        b.append(T(40, y + 68, sub, 13, MUTED, anchor="start"))
        for i, (kind, c) in enumerate(wires):
            x = 190 + i * 62
            fill = f"url(#st{c})" if kind == "w" else col[c]
            b.append(R(x, y, 46, 92, fill, "#6B7280", 1, 6))
            b.append(T(x + 23, y + 108, str(i + 1), 15, INK, weight="bold"))
            b.append(T(x + 23, y + 130, ("Trắng-" if kind == "w" else "") + c, 11, MUTED))
    notes = [("Cáp thẳng", ["hai đầu cùng chuẩn (B – B)", "— dùng hằng ngày"]),
             ("Cáp chéo", ["một đầu A, một đầu B — nối", "trực tiếp hai máy (thiết bị mới", "tự nhận, hiếm khi cần)"]),
             ("Cách cầm đầu RJ45", ["lẫy gài quay xuống, chân đồng", "quay lên, đầu cắm hướng ra xa", "→ chân số 1 ở bên trái"])]
    yy = 30
    for t, lines in notes:
        b.append(T(720, yy + 10, t, 15, INK, anchor="start", weight="bold"))
        b.append(T(720, yy + 30 + (len(lines) - 1) * 9, lines, 13, TXT, anchor="start", lh=1.4))
        yy += 40 + len(lines) * 19 + 16
    return "".join(b), pats


@fig("h6_5", 1000, 960)
def no_internet():
    cx = 250
    qs = [(150, ["Đèn mạng sáng / có", "biểu tượng kết nối?"], "Có", "Không",
           ["Kiểm tra cáp, cổng switch, đã bật Wi-Fi chưa,", "driver card mạng (Device Manager)"]),
          (300, ["ipconfig: IP có dạng", "169.254.x.x?"], "Không", "Có",
           ["Lỗi DHCP: ipconfig /release rồi /renew,", "khởi động lại router, kiểm tra cáp"]),
          (450, ["ping gateway", "(vd. 192.168.1.1) được?"], "Có", "Không",
           ["Lỗi mạng nội bộ: cáp, switch, IP tĩnh sai", "lớp mạng, tường lửa chặn"]),
          (600, ["ping 8.8.8.8", "được?"], "Có", "Không",
           ["Router không ra được Internet: kiểm tra", "modem quang (đèn LOS đỏ), gọi nhà mạng"]),
          (750, ["ping google.com", "được?"], "Có", "Không",
           ["Lỗi DNS: ipconfig /flushdns, đặt DNS", "8.8.8.8 hoặc 1.1.1.1"])]
    b = [BOX(100, 20, 300, 56, "Máy không vào được mạng", fill=NAVY, stroke=NAVY, tc="#fff", fs=17),
         A(cx, 78, cx, 93)]
    for cy, q, down, right, fix in qs:
        b.append(f'<polygon points="{cx},{cy - 55} {cx + 160},{cy} {cx},{cy + 55} {cx - 160},{cy}" fill="{LIGHT}" stroke="{NAVY}" stroke-width="1.5"/>')
        b.append(T(cx, cy, q, 14, INK, weight="bold", lh=1.35))
        b.append(A(cx + 162, cy, 518, cy, "o"))
        b.append(T(440, cy - 14, right, 13, ORANGE, weight="bold"))
        b.append(R(520, cy - 38, 460, 76, ORANGE_L, ORANGE, 1.5, 8))
        b.append(T(750, cy, fix, 14, TXT, lh=1.4))
        b.append(A(cx, cy + 57, cx, cy + 93))
        b.append(T(cx + 12, cy + 75, down, 13, GREEN, anchor="start", weight="bold"))
    b.append(BOX(60, 845, 380, 90, "Đường truyền thông suốt", ["kiểm tra trình duyệt, proxy, VPN,", "phần mềm diệt virus"],
                 fill=GREEN_L, stroke=GREEN, tc=GREEN, fs=16, sfs=14))
    return "".join(b)


# ---------------------------------------------------------------------------
def render(name):
    w, h, fn = FIGS[name]
    res = fn()
    body, defs = res if isinstance(res, tuple) else (res, "")
    svg_path = os.path.join(OUT, name + ".svg")
    png_path = os.path.join(OUT, name + ".png")
    open(svg_path, "w", encoding="utf-8").write(svg(w, h, body, defs))
    # Chromium headless trừ phần khung cửa sổ khỏi vùng chụp, nên mở cửa sổ cao hơn rồi cắt lại.
    subprocess.run([CHROME, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=2", f"--window-size={w},{h + 200}", "--default-background-color=ffffffff",
                    "--screenshot=" + png_path, "file:///" + os.path.abspath(svg_path).replace("\\", "/").lstrip("/")],
                   check=True, capture_output=True)
    from PIL import Image
    Image.open(png_path).crop((0, 0, w * 2, h * 2)).save(png_path, optimize=True)
    print("ok", name, w, "x", h)


if __name__ == "__main__":
    for n in (sys.argv[1:] or FIGS):
        render(n)

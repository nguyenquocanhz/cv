# -*- coding: utf-8 -*-
"""
Dựng giáo trình: node → DOCX → LibreOffice → PDF, chạy hai lượt để điền số trang mục lục.

    python build.py

Cần Node.js (npm install một lần), LibreOffice và pymupdf. Biến môi trường SOFFICE trỏ tới
soffice nếu không có sẵn trong PATH (Windows: C:\\Program Files\\LibreOffice\\program\\soffice.exe).
"""
import json, os, re, subprocess, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
NAME = "GiaoTrinh-OnTap-KyThuatVienMayTinh"
SOFFICE = os.environ.get("SOFFICE", "soffice")


def norm(s):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", s)).strip()


def build_once():
    subprocess.run(["node", "gen_giaotrinh.js"], cwd=HERE, check=True)
    subprocess.run([SOFFICE, "--headless", "--convert-to", "pdf", "--outdir", HERE,
                    os.path.join(HERE, NAME + ".docx")], cwd=HERE, check=True, capture_output=True)


def read_pages():
    import pymupdf
    heads = json.load(open(os.path.join(HERE, "headings.json"), encoding="utf-8"))
    toc = pymupdf.open(os.path.join(HERE, NAME + ".pdf")).get_toc()
    first = {}
    for _, title, page in toc:
        first.setdefault(norm(title), page)
    pages, missing = {}, []
    for h in heads:
        p = first.get(norm(h["text"]))
        if p is None:
            missing.append(h["text"])
        else:
            pages[h["id"]] = p
    return pages, missing


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    pages_path = os.path.join(HERE, "pages.json")
    prev = None
    for rnd in range(1, 4):
        build_once()
        pages, missing = read_pages()
        if missing:
            print("Không tìm thấy trong outline PDF:", missing)
            sys.exit(1)
        json.dump(pages, open(pages_path, "w", encoding="utf-8"), indent=1)
        if pages == prev:
            break
        prev = pages
    import pymupdf
    d = pymupdf.open(os.path.join(HERE, NAME + ".pdf"))
    print(f"OK  {NAME}.pdf — {d.page_count} trang, mục lục ổn định sau {rnd} lượt")


if __name__ == "__main__":
    main()

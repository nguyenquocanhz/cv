# -*- coding: utf-8 -*-
"""
topcv — thu thập tin tuyển dụng thực tập trên TopCV rồi chấm điểm bằng jobagent.

    python topcv.py fetch --tu-khoa php,python,go,java
    python topcv.py fetch --tu-khoa java --so-trang 5 --chi-tiet
    python topcv.py list
    python topcv.py nap            # đẩy các tin đã lưu sang jobs.json của jobagent

Công cụ chạy chậm có chủ ý và tôn trọng quy định của trang:

  * Đọc robots.txt TRƯỚC khi tải bất cứ gì, và bỏ qua mọi đường dẫn bị cấm.
    Không có cờ nào tắt được việc này.
  * Nghỉ giữa các lần tải (mặc định 3 giây), theo Crawl-delay nếu robots.txt có nêu.
  * User-Agent ghi rõ đây là công cụ gì và do ai chạy — không giả làm trình duyệt.
  * Gặp 403 hoặc 429 là dừng hẳn, không thử lại dồn dập.

Lưu ý trước khi dùng: đây là công cụ cá nhân để tìm việc cho chính mình, không phải
để gom dữ liệu quy mô lớn. Điều khoản sử dụng của TopCV mới là thứ quyết định bạn
được làm gì; robots.txt chỉ là phần máy đọc được. Trang cũng có thể có lớp chống bot,
khi đó công cụ sẽ dừng và báo — đừng tìm cách lách.

Chỉ dùng thư viện chuẩn.
"""
import argparse, gzip, io, json, os, re, sys, time, unicodedata
import urllib.error, urllib.parse, urllib.request, urllib.robotparser
from datetime import date
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, "topcv-jobs.json")
BASE = "https://www.topcv.vn"
UA = ("ca-nhan-tim-viec/1.0 (cong cu tim viec ca nhan, ton trong robots.txt; "
      "lien he: nguyenquocanh.dev@gmail.com)")


# ── Tải trang có kiểm soát ───────────────────────────────────────────────
class Stop(Exception):
    """Trang bảo dừng (403/429, hoặc robots.txt cấm). Không thử lại."""


class Fetcher:
    def __init__(self, delay=3.0, verbose=True):
        self.delay = delay
        self.verbose = verbose
        self.last = 0.0
        self.rp = None
        self._load_robots()

    def _load_robots(self):
        url = urllib.parse.urljoin(BASE, "/robots.txt")
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(url)
        try:
            raw = self._raw(url, polite=False)
            rp.parse(raw.decode("utf-8", "replace").splitlines())
        except Stop:
            raise
        except Exception as e:
            # Không đọc được robots.txt thì KHÔNG cào. Im lặng cào tiếp là sai.
            raise Stop("Không tải được robots.txt (%s). Dừng — không rõ trang cho phép gì." % e)
        self.rp = rp
        cd = rp.crawl_delay(UA) or rp.crawl_delay("*")
        if cd:
            self.delay = max(self.delay, float(cd))
            self._say("robots.txt yêu cầu nghỉ %.1fs giữa các lần tải" % self.delay)

    def _say(self, msg):
        if self.verbose:
            print("  " + msg, file=sys.stderr)

    def _raw(self, url, polite=True):
        if polite:
            wait = self.delay - (time.time() - self.last)
            if wait > 0:
                time.sleep(wait)
            self.last = time.time()
        req = urllib.request.Request(url, headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "vi,en;q=0.8",
            "Accept-Encoding": "gzip",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
                if r.headers.get("Content-Encoding") == "gzip":
                    data = gzip.decompress(data)
                return data
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):
                raise Stop("Trang trả về %d — có thể đã chặn hoặc giới hạn tần suất. Dừng lại." % e.code)
            raise

    def get(self, url):
        """Tải một trang, chỉ khi robots.txt cho phép."""
        if not self.rp.can_fetch(UA, url):
            self._say("robots.txt cấm, bỏ qua: " + url)
            return None
        return self._raw(url).decode("utf-8", "replace")


# ── Bóc dữ liệu ──────────────────────────────────────────────────────────
class _Strip(HTMLParser):
    """HTML → chữ thuần, bỏ hẳn script/style."""
    SKIP = {"script", "style", "noscript", "svg"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skip += 1
        elif tag in ("p", "br", "li", "div", "tr", "h1", "h2", "h3", "h4"):
            self.out.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.out.append(data.strip())

    def text(self):
        s = " ".join(self.out)
        s = re.sub(r"[ \t]+", " ", s)
        s = re.sub(r"\s*\n\s*", "\n", s)
        return re.sub(r"\n{3,}", "\n\n", s).strip()


def html_to_text(html):
    p = _Strip()
    try:
        p.feed(html)
        p.close()
    except Exception:
        pass
    return p.text()


OPEN_LD = re.compile(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>', re.I)
CLOSE_LD = re.compile(r'</script\s*>', re.I)


def json_ld(html):
    """
    Các khối <script type="application/ld+json"> — nơi trang công bố dữ liệu có cấu trúc.

    Không cắt ở </script> đầu tiên tìm được: mô tả công việc đôi khi chứa nguyên
    chuỗi đó chưa escape, cắt sớm sẽ làm JSON hỏng. Thử lần lượt từng vị trí đóng
    thẻ, lấy lần parse thành công đầu tiên.
    """
    out = []
    for m in OPEN_LD.finditer(html):
        start = m.end()
        for c in CLOSE_LD.finditer(html, start):
            try:
                obj = json.loads(html[start:c.start()].strip())
            except Exception:
                continue
            out.extend(obj if isinstance(obj, list) else [obj])
            break
    return out


def walk(obj):
    """Duyệt mọi dict lồng nhau, kể cả trong @graph."""
    if isinstance(obj, dict):
        yield obj
        for v in obj.values():
            yield from walk(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk(v)


def from_jsonld(html, url):
    """
    Ưu tiên schema.org/JobPosting: đây là dữ liệu trang chủ động công bố cho máy đọc,
    ổn định hơn nhiều so với bám vào tên class CSS.
    """
    for node in walk(json_ld(html)):
        if not isinstance(node, dict):
            continue
        if node.get("@type") != "JobPosting" and "JobPosting" not in str(node.get("@type", "")):
            continue
        org = node.get("hiringOrganization") or {}
        loc = node.get("jobLocation") or {}
        addr = (loc[0] if isinstance(loc, list) and loc else loc)
        addr = (addr or {}).get("address", {}) if isinstance(addr, dict) else {}
        sal = node.get("baseSalary") or {}
        val = sal.get("value") if isinstance(sal, dict) else None
        if isinstance(val, dict):
            lo, hi = val.get("minValue"), val.get("maxValue")
            salary = ("%s - %s" % (lo, hi)) if lo and hi else str(val.get("value") or "")
        else:
            salary = ""
        return {
            "title": (node.get("title") or "").strip(),
            "company": (org.get("name") if isinstance(org, dict) else "") or "",
            "location": (addr.get("addressLocality") or addr.get("addressRegion") or "") if isinstance(addr, dict) else "",
            "salary": salary,
            "posted": node.get("datePosted") or "",
            "url": url,
            "jd": html_to_text(node.get("description") or ""),
            "source": "json-ld",
        }
    return None


JOB_HREF = re.compile(r'href="(/viec-lam/[^"#?]+?\d+\.html)(?:[?#][^"]*)?"')


def listing_links(html):
    """
    Các đường dẫn tin tuyển dụng trên một trang danh sách.
    Bỏ tham số theo dõi trước khi khử trùng: cùng một tin hay xuất hiện nhiều lần
    với ?utm_... khác nhau.
    """
    seen, out = set(), []
    for m in JOB_HREF.finditer(html):
        u = urllib.parse.urljoin(BASE, m.group(1))
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


# ── Lưu trữ ──────────────────────────────────────────────────────────────
def load():
    if os.path.exists(DB):
        return json.load(io.open(DB, encoding="utf-8"))
    return {"jobs": []}


def save(db):
    io.open(DB, "w", encoding="utf-8").write(json.dumps(db, ensure_ascii=False, indent=2))


def no_accent(s):
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn").lower()


INTERN = re.compile(r"(thuc tap|intern|fresher|moi tot nghiep|khong yeu cau kinh nghiem)")


def is_intern(job):
    blob = no_accent(job.get("title", "") + " " + job.get("jd", "")[:600])
    return bool(INTERN.search(blob))


# ── Lệnh ─────────────────────────────────────────────────────────────────
def cmd_fetch(a):
    f = Fetcher(delay=a.nghi)
    db = load()
    have = {j["url"] for j in db["jobs"]}
    added = 0

    for kw in [k.strip() for k in a.tu_khoa.split(",") if k.strip()]:
        print("\n== %s ==" % kw, file=sys.stderr)
        links = []
        for page in range(1, a.so_trang + 1):
            q = urllib.parse.urlencode({"q": kw, "page": page})
            url = "%s/tim-viec-lam-%s?%s" % (BASE, urllib.parse.quote(kw), q)
            try:
                html = f.get(url)
            except Stop as e:
                print("DỪNG: %s" % e, file=sys.stderr)
                save(db)
                return 1
            if html is None:
                break
            found = listing_links(html)
            print("  trang %d: %d tin" % (page, len(found)), file=sys.stderr)
            if not found:
                break
            links += found

        for url in links:
            if url in have:
                continue
            job = {"title": "", "company": "", "location": "", "salary": "",
                   "posted": "", "url": url, "jd": "", "source": "", "keyword": kw}
            if a.chi_tiet:
                try:
                    page_html = f.get(url)
                except Stop as e:
                    print("DỪNG: %s" % e, file=sys.stderr)
                    save(db)
                    return 1
                if page_html is None:
                    continue
                parsed = from_jsonld(page_html, url)
                if parsed:
                    job.update(parsed)
                else:
                    # Không có JSON-LD: giữ lại chữ thuần để còn chấm điểm được
                    job["jd"] = html_to_text(page_html)[:20000]
                    job["source"] = "html"
                if not a.tat_ca and not is_intern(job):
                    continue
            have.add(url)
            job["added"] = date.today().isoformat()
            db["jobs"].append(job)
            added += 1

    save(db)
    print("\nThêm %d tin mới, tổng %d. Lưu ở %s" % (added, len(db["jobs"]), DB))
    if not a.chi_tiet:
        print("Chưa tải nội dung chi tiết — chạy lại kèm --chi-tiet để chấm điểm được.")
    return 0


def cmd_list(a):
    db = load()
    if not db["jobs"]:
        print("Chưa có tin nào.")
        return 0
    try:
        sys.path.insert(0, HERE)
        import jobagent
    except Exception:
        jobagent = None

    rows = []
    for j in db["jobs"]:
        fit, variant = None, ""
        if jobagent and j.get("jd"):
            r = jobagent.score_job({"jd": j["jd"]})
            fit, variant = r["fit"], r["variant"]
        rows.append((fit if fit is not None else -1, fit, variant, j))
    rows.sort(key=lambda r: -r[0])

    print("%-5s %-44s %-24s %-14s %s" % ("KHỚP", "VỊ TRÍ", "CÔNG TY", "CV NÊN GỬI", "LƯƠNG"))
    print("-" * 110)
    for _, fit, variant, j in rows[:a.so_dong]:
        print("%-5s %-44s %-24s %-14s %s" % (
            ("%d%%" % fit) if fit is not None else "—",
            (j.get("title") or j["url"].rsplit("/", 1)[-1])[:44],
            (j.get("company") or "")[:24], variant[:14], (j.get("salary") or "")[:18]))
    if not jobagent:
        print("\n(không nạp được jobagent.py nên chưa chấm điểm)")
    return 0


def cmd_nap(a):
    """Đẩy các tin đã có nội dung sang jobs.json để theo dõi bằng jobagent."""
    sys.path.insert(0, HERE)
    import jobagent
    src = load()["jobs"]
    dst = jobagent.load()
    have = {j.get("url") for j in dst["jobs"]}
    n = 0
    for j in src:
        if not j.get("jd") or j["url"] in have:
            continue
        dst["jobs"].append({
            "id": (max([x["id"] for x in dst["jobs"]]) + 1) if dst["jobs"] else 1,
            "title": ("%s — %s" % (j.get("title", ""), j.get("company", ""))).strip(" —"),
            "jd": j["jd"], "url": j["url"],
            "added": j.get("added", date.today().isoformat()), "status": "moi",
        })
        n += 1
    jobagent.save(dst)
    print("Đã nạp %d tin sang jobs.json. Xem bằng: python jobagent.py list" % n)
    return 0


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd")

    f = sub.add_parser("fetch", help="thu thập tin từ TopCV")
    f.add_argument("--tu-khoa", default="php,python,go,java", help="các từ khoá, cách nhau bằng dấu phẩy")
    f.add_argument("--so-trang", type=int, default=3, help="số trang danh sách mỗi từ khoá (mặc định 3)")
    f.add_argument("--chi-tiet", action="store_true", help="tải cả nội dung từng tin (chậm hơn nhiều)")
    f.add_argument("--tat-ca", action="store_true", help="giữ cả tin không phải thực tập")
    f.add_argument("--nghi", type=float, default=3.0, help="số giây nghỉ giữa các lần tải (tối thiểu 3)")
    f.set_defaults(fn=cmd_fetch)

    l = sub.add_parser("list", help="xem danh sách đã thu thập, kèm điểm khớp")
    l.add_argument("--so-dong", type=int, default=40)
    l.set_defaults(fn=cmd_list)

    n = sub.add_parser("nap", help="đẩy sang jobs.json của jobagent")
    n.set_defaults(fn=cmd_nap)

    a = ap.parse_args()
    if not getattr(a, "fn", None):
        ap.print_help()
        return 1
    if getattr(a, "nghi", 3.0) < 3.0:
        a.nghi = 3.0  # không cho hạ xuống dưới mức lịch sự
    try:
        return a.fn(a)
    except Stop as e:
        print("DỪNG: %s" % e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

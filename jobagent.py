# -*- coding: utf-8 -*-
"""
jobagent — đối chiếu tin tuyển dụng với hồ sơ, chọn bản CV nên gửi, chỉ ra chỗ hụt.

Dán nội dung JD vào, công cụ sẽ:
  1. dò công nghệ JD yêu cầu và mức kinh nghiệm,
  2. chấm điểm khớp với hồ sơ, kèm bằng chứng cụ thể cho từng kỹ năng,
  3. chỉ ra chỗ chưa có bằng chứng — thứ sẽ bị hỏi khi phỏng vấn,
  4. gợi ý bản CV phù hợp nhất,
  5. theo dõi trạng thái từng hồ sơ đã nộp.

Chỉ dùng thư viện chuẩn. Không truy cập mạng, không đăng nhập, không tự nộp hồ sơ.

    python jobagent.py add "MISA — Junior .NET" jd.txt
    python jobagent.py add "LG CNS — Backend"          # rồi dán JD, kết thúc bằng Ctrl+Z (Windows)
    python jobagent.py list
    python jobagent.py show 3
    python jobagent.py status 3 da-nop
    python jobagent.py report
"""
import io, json, os, re, sys, unicodedata
from datetime import date

DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "jobs.json")

# ---------------------------------------------------------------------------
# Hồ sơ: mỗi kỹ năng đi kèm BẰNG CHỨNG. Không có bằng chứng thì không tính là có.
# ---------------------------------------------------------------------------
SKILLS = {
    "java":        (["java", "jdk"], "Spring Boot 4.1/Java 17 ở RapPhim WareHouse; QR Wallet viết bằng Java", 3),
    "spring":      (["spring", "spring boot", "springboot"], "REST API 32 endpoint, Caffeine cache, Actuator, springdoc", 3),
    "csharp":      (["c#", "csharp", ".net", "dotnet", "asp.net"], "VietCodesUI (thư viện UI C#, 6★); Store Management 3 lớp/SQL Server", 2),
    "php":         (["php", "laravel"], "Nền tảng bán hàng PHP 8 cho khách, 200 khách hàng, 50 đơn/tháng", 3),
    "python":      (["python"], "pulse, DomainGateway, sshvault, script tự động hoá", 2),
    "javascript":  (["javascript", "js", "es6"], "Frontend RapPhim, nhiều extension và tool JS", 3),
    "typescript":  (["typescript", "ts"], "Next.js 16 + React 19 ở RapPhim; React Native app", 3),
    "react":       (["react", "reactjs", "react.js"], "React 19 + Next.js 16 (App Router) ở RapPhim WareHouse", 3),
    "nextjs":      (["next.js", "nextjs"], "Next.js 16 App Router, Tailwind CSS 4", 3),
    "vue":         (["vue", "vuejs", "nuxt"], "vibe.j2team.org viết bằng Vue", 1),
    "nodejs":      (["node", "node.js", "nodejs", "nestjs", "express"], "pulse — uptime monitor Node.js thuần, không phụ thuộc thư viện ngoài", 2),
    "flutter":     (["flutter", "dart"], "rapphim_mobile — client Flutter, provider, HLS, unit test MockClient", 2),
    "reactnative": (["react native", "react-native", "expo"], "mobile/ trong RapPhimWareHouse — Expo SDK 57, expo-router, 5 tab", 2),
    "android":     (["android", "kotlin"], "QR Wallet (Java/MVVM/Room/CameraX) + 4 app Kotlin", 3),
    "sql":         (["sql", "mysql", "sql server", "postgres", "database", "cơ sở dữ liệu"], "Thiết kế schema chuẩn hoá (ERD), stored procedure, indexing, tối ưu truy vấn", 3),
    "docker":      (["docker", "container", "kubernetes", "k8s"], "Docker + compose tách dev/prod cho RapPhim; image đa kiến trúc trên GHCR", 3),
    "linux":       (["linux", "ubuntu", "debian", "centos"], "Tự quản trị Linux server nhiều vùng, uptime 99%", 3),
    "cicd":        (["ci/cd", "cicd", "github actions", "jenkins", "gitlab ci"], "GitHub Actions dựng backend, web và .ipa iOS", 3),
    "rest":        (["rest", "restful", "api", "openapi", "swagger"], "REST API phiên bản hoá /api/v1, tài liệu OpenAPI 3.1 tự sinh", 3),
    "git":         (["git", "github", "gitlab"], "223 repo công khai, đẩy code hằng ngày", 3),
    "html":        (["html", "html5", "css", "css3", "tailwind", "bootstrap"], "Giao diện responsive bằng Tailwind 4 và Bootstrap 5", 3),
    "figma":       (["figma"], "", 0),          # chưa có bằng chứng
    "aws":         (["aws", "azure", "gcp", "cloud"], "", 0),
    "microservice":(["microservice", "micro service", "kafka", "rabbitmq"], "", 0),
    "testing":     (["unit test", "junit", "kiểm thử", "testing"], "Unit test tầng web (Spring) và tầng HTTP (MockClient) ", 2),
}

VARIANTS = {
    "Java-Backend":    ["java", "spring", "rest", "sql", "docker", "linux", "cicd", "testing"],
    "NET-Backend":     ["csharp", "sql", "rest", "docker", "linux", "cicd"],
    "Fullstack":       ["react", "nextjs", "typescript", "javascript", "nodejs", "java", "sql", "html"],
    "Fresher-Remote":  ["react", "nextjs", "javascript", "typescript", "html", "nodejs", "csharp", "flutter", "reactnative"],
    "IT-Support":      ["linux", "python", "sql", "docker"],
    "EN-Backend":      ["java", "spring", "rest", "sql", "docker", "cicd"],
}

EXP_PATTERNS = [
    (r"không\s*yêu\s*cầu\s*kinh\s*nghiệm|no\s+experience|fresher|intern|thực\s*tập", 0),
    (r"dưới\s*1\s*năm|under\s+1\s+year", 0),
    (r"(\d+)[\s\-–+]*(?:năm|year)", None),
]

STATUSES = ["moi", "da-nop", "phong-van", "offer", "truot"]
STATUS_LABEL = {"moi": "mới", "da-nop": "đã nộp", "phong-van": "phỏng vấn",
                "offer": "có offer", "truot": "trượt"}


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn").lower()


def load():
    if os.path.exists(DB):
        return json.load(io.open(DB, encoding="utf-8"))
    return {"jobs": []}


def save(db):
    io.open(DB, "w", encoding="utf-8").write(
        json.dumps(db, ensure_ascii=False, indent=2))


def detect_experience(text):
    """Số năm kinh nghiệm JD đòi. None nếu không nói."""
    low = strip_accents(text)
    if re.search(strip_accents("không yêu cầu kinh nghiệm") + r"|fresher|intern|no experience", low):
        return 0
    m = re.search(r"(\d+)\s*\+?\s*(?:nam|year)", low)
    if m:
        n = int(m.group(1))
        return n if n <= 15 else None
    return None


def analyse(text):
    low = strip_accents(text)
    hits, missing = [], []
    for key, (aliases, evidence, strength) in SKILLS.items():
        found = any(re.search(r"(?<![a-z0-9])" + re.escape(strip_accents(a)) + r"(?![a-z0-9])", low)
                    for a in aliases)
        if not found:
            continue
        if strength == 0 or not evidence:
            missing.append(key)
        else:
            hits.append((key, evidence, strength))
    return hits, missing, detect_experience(text)


def pick_variant(hit_keys):
    best, score = None, -1
    for name, keys in VARIANTS.items():
        s = len(set(keys) & set(hit_keys))
        if s > score:
            best, score = name, s
    return best


def score_job(job):
    hits, missing, exp = analyse(job["jd"])
    hit_keys = [h[0] for h in hits]
    covered = sum(h[2] for h in hits)
    demanded = covered + len(missing) * 3
    fit = round(100 * covered / demanded) if demanded else 0

    if exp is None:
        exp_note, exp_pen = "JD không nói rõ", 0
    elif exp <= 1:
        exp_note, exp_pen = "hợp — cửa junior", 0
    elif exp == 2:
        exp_note, exp_pen = "hơi cao, vẫn nên thử", 10
    else:
        exp_note, exp_pen = "đòi %d năm, khả năng bị lọc" % exp, 25

    return {
        "fit": max(0, fit - exp_pen), "hits": hits, "missing": missing,
        "exp": exp, "exp_note": exp_note, "variant": pick_variant(hit_keys),
    }


# ---------------------------------------------------------------------------
def cmd_add(args):
    if not args:
        print("cần tên: jobagent.py add \"MISA — Junior .NET\" [jd.txt]")
        return 1
    title = args[0]
    if len(args) > 1:
        jd = io.open(args[1], encoding="utf-8").read()
    else:
        print("Dán nội dung JD, kết thúc bằng Ctrl+Z rồi Enter (Windows):")
        jd = sys.stdin.read()
    if not jd.strip():
        print("JD rỗng, bỏ qua.")
        return 1
    db = load()
    db["jobs"].append({
        "id": (max([j["id"] for j in db["jobs"]]) + 1) if db["jobs"] else 1,
        "title": title, "jd": jd.strip(),
        "added": date.today().isoformat(), "status": "moi",
    })
    save(db)
    j = db["jobs"][-1]
    print("Đã thêm #%d — %s" % (j["id"], title))
    show_one(j)
    return 0


def show_one(job):
    r = score_job(job)
    print()
    print("  Mức khớp        %d%%" % r["fit"])
    print("  CV nên gửi      %s" % r["variant"])
    print("  Kinh nghiệm     %s" % r["exp_note"])
    if r["hits"]:
        print("  Khớp — có bằng chứng:")
        for key, ev, _ in sorted(r["hits"], key=lambda h: -h[2]):
            print("     %-12s %s" % (key, ev))
    if r["missing"]:
        print("  HỤT — JD đòi nhưng hồ sơ chưa có bằng chứng:")
        for k in r["missing"]:
            print("     %-12s chuẩn bị câu trả lời, hoặc bỏ qua tin này" % k)


def cmd_list(_):
    db = load()
    if not db["jobs"]:
        print("Chưa có tin nào. Thêm bằng: jobagent.py add \"Tên\" jd.txt")
        return 0
    rows = sorted(db["jobs"], key=lambda j: -score_job(j)["fit"])
    print("%-4s %-42s %6s  %-16s %s" % ("#", "TIN", "KHỚP", "CV NÊN GỬI", "TRẠNG THÁI"))
    print("-" * 92)
    for j in rows:
        r = score_job(j)
        print("%-4d %-42s %5d%%  %-16s %s" % (
            j["id"], j["title"][:42], r["fit"], r["variant"],
            STATUS_LABEL.get(j["status"], j["status"])))
    return 0


def cmd_show(args):
    db = load()
    for j in db["jobs"]:
        if str(j["id"]) == str(args[0] if args else ""):
            print("#%d — %s   (thêm %s, %s)" % (
                j["id"], j["title"], j["added"], STATUS_LABEL.get(j["status"])))
            show_one(j)
            return 0
    print("không thấy tin đó")
    return 1


def cmd_status(args):
    if len(args) < 2 or args[1] not in STATUSES:
        print("dùng: jobagent.py status <id> <%s>" % "|".join(STATUSES))
        return 1
    db = load()
    for j in db["jobs"]:
        if str(j["id"]) == args[0]:
            j["status"] = args[1]
            save(db)
            print("#%s -> %s" % (args[0], STATUS_LABEL[args[1]]))
            return 0
    print("không thấy tin đó")
    return 1


def cmd_report(_):
    db = load()
    if not db["jobs"]:
        print("chưa có tin nào")
        return 0
    rows = sorted(db["jobs"], key=lambda j: -score_job(j)["fit"])
    out = ["# Bảng theo dõi ứng tuyển", "",
           "Cập nhật %s · %d tin" % (date.today().isoformat(), len(rows)), "",
           "| # | Tin | Khớp | CV | Kinh nghiệm | Trạng thái | Chỗ hụt |",
           "|---|-----|------|----|-------------|------------|---------|"]
    for j in rows:
        r = score_job(j)
        out.append("| %d | %s | %d%% | %s | %s | %s | %s |" % (
            j["id"], j["title"], r["fit"], r["variant"], r["exp_note"],
            STATUS_LABEL.get(j["status"]), ", ".join(r["missing"]) or "—"))
    path = os.path.join(os.path.dirname(DB), "ung-tuyen.md")
    io.open(path, "w", encoding="utf-8").write("\n".join(out) + "\n")
    print("\n".join(out))
    print()
    print("đã ghi %s" % path)
    return 0


CMDS = {"add": cmd_add, "list": cmd_list, "show": cmd_show,
        "status": cmd_status, "report": cmd_report}

if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    cmd = sys.argv[1] if len(sys.argv) > 1 else "list"
    if cmd not in CMDS:
        print(__doc__)
        sys.exit(1)
    sys.exit(CMDS[cmd](sys.argv[2:]))

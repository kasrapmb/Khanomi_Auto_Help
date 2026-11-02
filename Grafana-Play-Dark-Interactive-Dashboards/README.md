# Grafana Play — Dark Interactive Dashboards

این پوشه شامل سورس کامل و بدون تغییر Grafana OSS نسخهٔ **13.3.0**، به همراه یک داشبورد محلی تیره و تعاملی است. هدف، مطالعه و استفاده از پیاده‌سازی واقعی Grafana است.

**مرز کار:** درخواست به سایت آنلاین `play.grafana.org` با HTTP 403 روبه‌رو شد. بنابراین این پروژه کپی تأییدشدهٔ ظاهر، داشبوردها یا داده‌های همان استقرار آنلاین نیست. داشبورد محلی را برای مطالعه ساخته‌ایم و تمام داده‌های آن مصنوعی است.

## اجرا

پیش‌نیاز: Docker Engine و Docker Compose v2. از همین پوشه:

```sh
docker compose up -d --wait --wait-timeout 120
python3 scripts/smoke.py
```

در مرورگر سیستم خود پورت 3000 را باز کنید و داشبورد `Grafana Play · Dark Interactive Study` را انتخاب کنید. صفحهٔ اصلی نیز همین داشبورد است. برای توقف:

```sh
docker compose down
```

نقش بازدیدکننده Viewer است. برای ویرایش نمونهٔ پایدار، فایل `dashboards/overview.json` را تغییر دهید؛ provisioning آن را دوباره بارگذاری می‌کند. دسترسی مدیریتی با سازوکار ورود خود Grafana انجام می‌شود. پورت فقط به loopback متصل است؛ این تنظیمات برای مطالعهٔ محلی است.

## بخش‌های قابل بررسی

- ۴ کارت KPI و نمودار کوچک روند
- نمودار زمانی چندسری با tooltip مشترک، legend و بزرگ‌نمایی با کشیدن
- gauge با آستانه‌های رنگی
- انتخاب سرویس، تغییر بازهٔ زمانی و تازه‌سازی خودکار
- جدول داده با مرتب‌سازی ستون‌ها

انتخاب سرویس نام سری‌های دادهٔ آزمایشی را عوض می‌کند؛ به سرویس واقعی متصل نیست. اعداد random walk و جدول نمونه، معیار واقعی کسب‌وکار نیستند.

## ساختار

| مسیر | محتوا |
| --- | --- |
| `source/` | کل سورس رسمی نسخهٔ ثابت، شامل frontend، backend، تست‌ها و مثال‌ها؛ بدون `.git` تو در تو |
| `dashboards/overview.json` | تنظیمات داشبورد محلی ساخته‌شده برای این مطالعه |
| `provisioning/` | ثبت خودکار داشبورد و منبع TestData داخلی |
| `compose.yaml` | اجرای image رسمی متناظر با نسخه، pin شده با SHA-256 |
| `docs/ARCHITECTURE.md` | راهنمای خواندن سورس و مرز شواهد |
| `SOURCE.json` | آدرس منبع، commit، نسخه، مجوز و منشأ اسکیل |
| `scripts/smoke.py` | تست عملکرد HTTP، provisioning و query واقعی |

## سورس و مجوز

منبع: <https://github.com/grafana/grafana/tree/v13.3.0>

Commit: `752e3462ff71a43a5c1fb62d00a482fa2dc0ee6a`

مجوز اصلی Grafana **AGPL-3.0-only** است؛ `source/LICENSE` و `source/LICENSING.md` و مجوزهای محلی بخش‌های مختلف را حفظ کنید. کد upstream بدون تغییر منتقل شده است. برای توسعهٔ خود Grafana، دستورهای نسخهٔ pin شده در `source/AGENTS.md` و `source/contribute/` را دنبال کنید. runtime فعلی از image رسمی استفاده می‌کند و ادعای build کامل سورس در این محیط ندارد.

اسکیل بررسی‌شده: [reverse-engineer-anything](https://github.com/kasrapmb/REA_skills_Codex/tree/main/REA-Skills/reverse-engineer-anything). مطابق راهنمای آن، برای سورس کامل از بررسی مستقیم مخزن استفاده شد. REA MCP در این جلسه موجود نیست؛ diagnostic نسخهٔ CLI نیز ناسازگاری Node و نبود registration را گزارش کرد. هیچ خروجی مهندسی معکوس REA یا مشاهدهٔ مرورگری ادعا نمی‌شود.

## بررسی رابط در مرورگر

در محیط دارای Python Playwright و Chromium، `python3 scripts/browser_smoke.py` را اجرا کنید. مسیر مرورگر با `CHROMIUM_PATH` قابل انتخاب است. تصویر واقعی اجرای محلی: [local-dashboard.png](docs/local-dashboard.png).

فایل‌های جدید بیرون از `source/` نیز با مجوز AGPL-3.0-only ارائه می‌شوند؛ متن کامل در `source/LICENSE` است.

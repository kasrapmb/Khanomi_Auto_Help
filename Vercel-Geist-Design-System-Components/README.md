# Vercel Geist — Design System & Components Study

بازسازی مستقل و قابل اجرای یک **سیستم طراحی و نمایش کامپوننت‌های تعاملی**، الهام‌گرفته از Geist. نویسندهٔ کد و commitها: `kasrapmb`.

**این پروژه سورس اصلی رابط Geist نیست.** سایت مرجع در این محیط HTTP 403 برگرداند؛ ظاهر آنلاین یا کد اصلی آن ضبط و بازیابی نشده است. کامپوننت‌ها و طراحی این نسخه مستقل‌اند. فقط دو فایل فونت رسمی و آزاد Geist، بدون تغییر و با مجوز اصلی، استفاده شده‌اند.

## اجرا

Node.js 20.19+ یا 22.12+ و npm لازم است. از همین پوشه:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run dev -- --host 127.0.0.1 --port 5200
```

برای خروجی production:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4200
```

برنامه frontend است و backend یا حساب Vercel لازم ندارد. برای clipboard واقعی، برنامه را روی localhost یا HTTPS باز کنید.

## چه چیزی پیاده شده؟

**۱۱ گروه نمونهٔ تعاملی:**

1. **Button:** حالت اصلی، ثانویه، ghost، حذف، غیرفعال، اندازه‌ها و حالت loading آزمایشی.
2. **Input:** اعتبارسنجی native ایمیل و نتیجهٔ ثبت محلی؛ هیچ ایمیلی ارسال نمی‌شود.
3. **Select:** انتخاب محیط و منطقه و نمایش پیکربندی نمونهٔ انتخاب‌شده.
4. **Switch & Checkbox:** تغییر اعلان نمونه، checkbox و radio برای تراکم نمایش داخل نمونه.
5. **Tabs:** پنل‌های واقعی با حرکت Arrow/Home/End و focus صفحه‌کلید.
6. **Badge & Avatar:** وضعیت‌های معنایی و نمایش اعضای نمونه.
7. **Table:** جست‌وجو، فیلتر محیط، مرتب‌سازی و بازکردن جزئیات پروژه.
8. **Dialog:** ساخت پروژهٔ نمونه، کنترل نام تکراری و تأیید پیش از حذف.
9. **Toast:** اعلان موفقیت، اطلاع و خطا؛ بستن دستی و حذف خودکار.
10. **Tooltip:** نمایش توضیح با hover یا focus و مثال کپی فرمان.
11. **Progress:** پیشرفت کنترل‌شده، تکمیل، reset و skeleton؛ به سرویس build متصل نیست.

همچنین:

- تم **روشن/تیره** با ذخیره و بازیابی در مرورگر.
- جست‌وجوی کامپوننت‌ها با `Ctrl/Cmd + K`، بازکردن نتیجه با Enter و بستن با Escape.
- حالت **Preview/Code** در کارت‌ها و کپی واقعی نمونه‌کد در clipboard.
- صفحهٔ توکن‌های رنگ، فاصله و radius با کپی مقادیر.
- آزمایشگاه تایپوگرافی با متن، اندازه و وزن قابل تغییر.
- layout واکنش‌گرا، منوی موبایل و اسکرول داخلی جدول/کد.

نمونه‌کدهای کارت‌ها **illustrative** هستند، نه خروجی استخراج‌شده از سایت و نه تمام کد لازم برای هر نمونه. پیاده‌سازی کامل در `src/components.jsx`، `src/demos.jsx` و `src/App.jsx` است.

## فونت رسمی و مجوز

Geist Sans و Geist Mono از بستهٔ رسمی `geist@1.9.0` دریافت و دو فایل variable WOFF2 بدون تغییر در `public/fonts/` قرار داده شدند. فایل‌ها از همین برنامه سرو می‌شوند؛ فونت از CDN فراخوانی نمی‌شود.

- مخزن رسمی: <https://github.com/vercel/geist-font>
- مجوز و copyright اصلی: `licenses/Geist-OFL.txt`
- نسخه، integrity بسته، مسیرها و SHA-256 هر فایل: `licenses/FONT-SOURCE.json`

این پروژه فقط دارایی‌های بسته‌بندی‌شدهٔ فونت را شامل می‌شود، نه کل مخزن ساخت فونت یا کد UI اصلی Geist. وابستگی Next.js/font-loader استفاده نشده است؛ فونت‌ها با `@font-face` بارگذاری می‌شوند.

## داده و ذخیره‌سازی

چهار پروژهٔ اولیه، وضعیت‌ها، دامنه‌های `.example`، فعالیت‌ها و آمار تب Overview همگی نمونه‌اند. ساخت و حذف پروژه فقط در state همان نشست است و با refresh به دادهٔ اولیه برمی‌گردد. هیچ deployment، درخواست خارجی، telemetry یا ایمیل واقعی ایجاد نمی‌شود.

فقط **تم و صفحهٔ کامپوننت فعال** در `localStorage` همان origin ذخیره می‌شوند. کنترل‌های داخل نمونه‌ها ترجیحات واقعی یک سرویس نیستند و لزوماً پس از refresh باقی نمی‌مانند. خرابی storage به پیش‌فرض‌ها برمی‌گردد و شکست ذخیره‌سازی هشدار آشکار دارد.

## تست مرورگر

بعد از build، با Python 3.10+، Playwright و Chromium:

```sh
python3 -m venv .runtime/test-venv
.runtime/test-venv/bin/pip install -r requirements-test.txt
CHROMIUM_PATH=/usr/bin/chromium .runtime/test-venv/bin/python tests/browser_smoke.py
```

در محیط آمادهٔ فعلی `python3 tests/browser_smoke.py` هم اجرا می‌شود. تست‌ها preview موقت خود را اجرا/متوقف می‌کنند و contextهای مستقل دارند. clipboard واقعی و فایل‌های فونت نیز بررسی می‌شوند؛ جزئیات در `docs/VALIDATION.md` است.

## ساختار و تصاویر

| مسیر | کاربرد |
| --- | --- |
| `src/App.jsx` | پوسته، ناوبری، جست‌وجو، تم، توکن‌ها و dialogهای پروژه |
| `src/components.jsx` | Button، Modal، ExampleCard، Toast و Tooltip قابل استفادهٔ مجدد |
| `src/demos.jsx` | پیاده‌سازی تعامل هر کامپوننت |
| `src/catalog.js` | فهرست، دادهٔ اولیه، snippets و اعتبارسنجی ترجیحات |
| `src/tokens.css` | منبع مقادیر مشترک روشن و تیره |
| `src/style.css` | فونت محلی، ترکیب اجزا و breakpointها |
| `public/fonts/` و `licenses/` | فونت‌های رسمی، مجوز و شواهد منشأ |

[روشن](docs/overview-light.png) · [تیره](docs/overview-dark.png) · [توکن‌ها](docs/tokens.png) · [تایپوگرافی](docs/typography.png) · [موبایل](docs/mobile-dark.png)

اسکیل [reverse-engineer-anything](https://github.com/kasrapmb/REA_skills_Codex/tree/main/REA-Skills/reverse-engineer-anything) برای تعیین مسیر و مرز شواهد استفاده شد؛ REA MCP متصل نیست و بازیابی سورس اصلی ادعا نمی‌شود.

کد مستقل پروژه MIT است؛ فونت‌ها تحت SIL OFL 1.1 باقی می‌مانند. نام‌ها و علائم Vercel/Geist متعلق به صاحبان خود هستند و این پروژه وابسته یا مورد تأیید آن‌ها نیست.

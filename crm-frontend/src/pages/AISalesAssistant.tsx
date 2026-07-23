import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowRotateRight,
  FaArrowUp,
  FaBolt,
  FaChartLine,
  FaCircleCheck,
  FaCircleExclamation,
  FaClockRotateLeft,
  FaFileInvoiceDollar,
  FaLightbulb,
  FaMessage,
  FaPaperPlane,
  FaRobot,
  FaUserGroup,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { Link } from "react-router-dom";

import { getCustomers, getDashboard, getInvoices, getSalesChart } from "../services/api";
import "./AISalesAssistant.css";

type Customer = {
  id?: number | string;
  name?: string;
  phone?: string;
  totalSale?: number | string;
  invoiceCount?: number | string;
};

type Invoice = {
  id?: number | string;
  factor?: number | string;
  sale?: number | string;
  discount?: number | string;
  createdAt?: string;
  status?: string;
  user?: Customer;
};

type SalesPoint = {
  month?: string;
  sale?: number | string;
  profit?: number | string;
};

type DashboardSummary = {
  customers?: number | string;
  sales?: number | string;
  profit?: number | string;
  sms?: number | string;
};

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
  chips?: { label: string; to: string }[];
  createdAt: Date;
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = value.replace(/[٬,\s]/g, "").replace(/[۰-۹]/g, (char) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(char)),
    );
    const result = Number(normalized);
    return Number.isFinite(result) ? result : 0;
  }
  return 0;
};

const formatNumber = (value: unknown) => toNumber(value).toLocaleString("fa-IR");
const formatMoney = (value: unknown) => `${formatNumber(value)} تومان`;

const parseDate = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const normalizeText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function AISalesAssistant() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [chart, setChart] = useState<SalesPoint[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [thinking, setThinking] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "سلام، من دستیار فروش TAK هستم. اطلاعات فعلی CRM را تحلیل می‌کنم و درباره فروش، مشتریان، فاکتورها و فرصت‌های پیگیری پاسخ می‌دهم.",
      chips: [
        { label: "مشاهده مشتریان", to: "/customers" },
        { label: "هوش فروش", to: "/insights" },
      ],
      createdAt: new Date(),
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [customerResult, invoiceResult, chartResult, summaryResult] = await Promise.all([
        getCustomers(),
        getInvoices(),
        getSalesChart(),
        getDashboard(),
      ]);
      setCustomers(Array.isArray(customerResult) ? customerResult : []);
      setInvoices(Array.isArray(invoiceResult) ? invoiceResult : []);
      setChart(Array.isArray(chartResult) ? chartResult : []);
      setSummary(summaryResult || {});
      setLastUpdated(new Date());
    } catch (loadError) {
      console.error(loadError);
      setError("دریافت اطلاعات CRM با مشکل روبه‌رو شد. اتصال API را بررسی کن.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const analytics = useMemo(() => {
    const now = new Date();
    const totalSales = toNumber(summary.sales) || invoices.reduce((sum, item) => sum + toNumber(item.sale), 0);
    const totalProfit = toNumber(summary.profit);
    const todayInvoices = invoices.filter((item) => {
      const date = parseDate(item.createdAt);
      return date ? sameDay(date, now) : false;
    });
    const monthInvoices = invoices.filter((item) => {
      const date = parseDate(item.createdAt);
      return date ? sameMonth(date, now) : false;
    });
    const todaySales = todayInvoices.reduce((sum, item) => sum + toNumber(item.sale), 0);
    const monthSales = monthInvoices.reduce((sum, item) => sum + toNumber(item.sale), 0);
    const activeCustomers = customers.filter(
      (item) => toNumber(item.totalSale) > 0 || toNumber(item.invoiceCount) > 0,
    );
    const vipCustomers = [...customers]
      .filter((item) => toNumber(item.totalSale) >= 100_000_000)
      .sort((a, b) => toNumber(b.totalSale) - toNumber(a.totalSale));
    const noPurchaseCustomers = customers.filter(
      (item) => toNumber(item.totalSale) <= 0 && toNumber(item.invoiceCount) <= 0,
    );
    const incompletePhones = customers.filter((item) => {
      const phone = String(item.phone || "").replace(/\D/g, "");
      return phone.length < 10;
    });
    const topCustomers = [...customers]
      .sort((a, b) => toNumber(b.totalSale) - toNumber(a.totalSale))
      .slice(0, 5);
    const recentInvoices = [...invoices]
      .sort(
        (a, b) =>
          (parseDate(b.createdAt)?.getTime() || 0) -
          (parseDate(a.createdAt)?.getTime() || 0),
      )
      .slice(0, 5);
    const averageInvoice = invoices.length ? totalSales / invoices.length : 0;
    const topChartPoint = [...chart]
      .map((item) => ({ ...item, saleValue: toNumber(item.sale) }))
      .sort((a, b) => b.saleValue - a.saleValue)[0];

    return {
      totalSales,
      totalProfit,
      todayInvoices,
      todaySales,
      monthInvoices,
      monthSales,
      activeCustomers,
      vipCustomers,
      noPurchaseCustomers,
      incompletePhones,
      topCustomers,
      recentInvoices,
      averageInvoice,
      topChartPoint,
    };
  }, [chart, customers, invoices, summary]);

  const insights = useMemo(() => {
    const result: { tone: "success" | "warning" | "info"; title: string; text: string }[] = [];

    if (analytics.noPurchaseCustomers.length > 0) {
      result.push({
        tone: "warning",
        title: "فرصت فعال‌سازی مشتری",
        text: `${formatNumber(analytics.noPurchaseCustomers.length)} مشتری هنوز خرید ثبت‌شده ندارند و برای کمپین معرفی محصول مناسب‌اند.`,
      });
    }

    if (analytics.incompletePhones.length > 0) {
      result.push({
        tone: "warning",
        title: "اطلاعات تماس ناقص",
        text: `شماره تماس ${formatNumber(analytics.incompletePhones.length)} مشتری ناقص است؛ قبل از کمپین پیامکی اصلاح شود.`,
      });
    }

    if (analytics.vipCustomers.length > 0) {
      result.push({
        tone: "success",
        title: "مشتریان باارزش",
        text: `${formatNumber(analytics.vipCustomers.length)} مشتری از مرز ۱۰۰ میلیون تومان خرید عبور کرده‌اند و مناسب باشگاه مشتریان VIP هستند.`,
      });
    }

    if (analytics.topChartPoint) {
      result.push({
        tone: "info",
        title: "بهترین دوره فروش",
        text: `${analytics.topChartPoint.month || "دوره برتر"} با ${formatMoney(analytics.topChartPoint.saleValue)} بیشترین فروش نمودار را دارد.`,
      });
    }

    return result.slice(0, 3);
  }, [analytics]);

  const buildAnswer = (rawQuestion: string): Message => {
    const question = normalizeText(rawQuestion);
    const includesAny = (...terms: string[]) => terms.some((term) => question.includes(term));

    if (includesAny("امروز", "فروش روز")) {
      return {
        id: makeId(),
        role: "assistant",
        text: `فروش امروز ${formatMoney(analytics.todaySales)} از ${formatNumber(analytics.todayInvoices.length)} فاکتور بوده است.${analytics.todayInvoices.length === 0 ? " امروز هنوز فاکتور ثبت‌شده‌ای در داده‌های فعلی دیده نمی‌شود." : ""}`,
        chips: [{ label: "مشاهده فاکتورها", to: "/invoices" }],
        createdAt: new Date(),
      };
    }

    if (includesAny("این ماه", "ماه جاری", "فروش ماه")) {
      return {
        id: makeId(),
        role: "assistant",
        text: `فروش ماه جاری ${formatMoney(analytics.monthSales)} در ${formatNumber(analytics.monthInvoices.length)} فاکتور است. میانگین هر فاکتور این ماه ${formatMoney(analytics.monthInvoices.length ? analytics.monthSales / analytics.monthInvoices.length : 0)} است.`,
        chips: [{ label: "داشبورد مدیریتی", to: "/" }],
        createdAt: new Date(),
      };
    }

    if (includesAny("سود", "profit")) {
      return {
        id: makeId(),
        role: "assistant",
        text: analytics.totalProfit > 0
          ? `سود ثبت‌شده فعلی ${formatMoney(analytics.totalProfit)} است. نسبت سود به فروش حدود ${((analytics.totalProfit / Math.max(analytics.totalSales, 1)) * 100).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪ است.`
          : "در پاسخ API فعلی، عدد قابل اتکایی برای سود ثبت نشده است. برای تحلیل سود دقیق باید مقدار سود فاکتورها یا خلاصه داشبورد از بک‌اند دریافت شود.",
        chips: [{ label: "مشاهده داشبورد", to: "/" }],
        createdAt: new Date(),
      };
    }

    if (includesAny("بهترین مشتری", "مشتری برتر", "بیشترین خرید", "vip")) {
      const top = analytics.topCustomers.filter((item) => toNumber(item.totalSale) > 0).slice(0, 3);
      const text = top.length
        ? `سه مشتری با بیشترین ارزش خرید:\n${top
            .map(
              (item, index) =>
                `${index + 1}. ${item.name || "بدون نام"} — ${formatMoney(item.totalSale)}`,
            )
            .join("\n")}`
        : "هنوز خریدی برای رتبه‌بندی مشتریان ثبت نشده است.";
      return {
        id: makeId(),
        role: "assistant",
        text,
        chips: [{ label: "تحلیل مشتریان", to: "/insights" }],
        createdAt: new Date(),
      };
    }

    if (includesAny("بدون خرید", "خرید نکرد", "غیرفعال", "ریزش")) {
      return {
        id: makeId(),
        role: "assistant",
        text: `${formatNumber(analytics.noPurchaseCustomers.length)} مشتری در اطلاعات فعلی خرید ثبت‌شده ندارند. این گروه برای پیام معرفی محصولات، کد تخفیف اولین خرید یا تماس پیگیری مناسب است. تحلیل ۳۰/۶۰/۹۰ روزه فقط زمانی دقیق می‌شود که تاریخ آخرین خرید هر مشتری از بک‌اند در دسترس باشد.`,
        chips: [
          { label: "مشاهده هوش فروش", to: "/insights" },
          { label: "ساخت کمپین پیامکی", to: "/sms" },
        ],
        createdAt: new Date(),
      };
    }

    if (includesAny("شماره", "تماس ناقص", "موبایل")) {
      return {
        id: makeId(),
        role: "assistant",
        text: `${formatNumber(analytics.incompletePhones.length)} مشتری شماره تماس کامل ندارند. پیشنهاد می‌کنم قبل از ارسال پیامک گروهی، این رکوردها اصلاح یا از کمپین حذف شوند.`,
        chips: [{ label: "مدیریت مشتریان", to: "/customers" }],
        createdAt: new Date(),
      };
    }

    if (includesAny("فاکتور", "سفارش")) {
      const latest = analytics.recentInvoices[0];
      const latestText = latest
        ? ` آخرین فاکتور ثبت‌شده متعلق به ${latest.user?.name || "مشتری نامشخص"} با مبلغ ${formatMoney(latest.sale)} است.`
        : " هنوز فاکتوری ثبت نشده است.";
      return {
        id: makeId(),
        role: "assistant",
        text: `در مجموع ${formatNumber(invoices.length)} فاکتور با میانگین مبلغ ${formatMoney(analytics.averageInvoice)} ثبت شده است.${latestText}`,
        chips: [{ label: "باز کردن فاکتورها", to: "/invoices" }],
        createdAt: new Date(),
      };
    }

    if (includesAny("پیامک", "کمپین", "متن تبلیغ")) {
      return {
        id: makeId(),
        role: "assistant",
        text: `پیشنهاد کمپین برای مشتریان بدون خرید:\n«سلام، محصولات جدید TAK موجود شد. برای ثبت اولین سفارش و دریافت شرایط ویژه با ما در ارتباط باشید.»\n\nقبل از ارسال، نام فروشگاه، مهلت پیشنهاد و روش لغو پیامک را متناسب با قوانین سرویس پیامکی اضافه کن.`,
        chips: [{ label: "رفتن به پیامک", to: "/sms" }],
        createdAt: new Date(),
      };
    }

    if (includesAny("خلاصه", "وضعیت", "گزارش", "تحلیل")) {
      return {
        id: makeId(),
        role: "assistant",
        text: `خلاصه فعلی CRM:\n• فروش کل: ${formatMoney(analytics.totalSales)}\n• تعداد فاکتورها: ${formatNumber(invoices.length)}\n• مشتریان فعال: ${formatNumber(analytics.activeCustomers.length)}\n• مشتریان VIP: ${formatNumber(analytics.vipCustomers.length)}\n• مشتریان بدون خرید: ${formatNumber(analytics.noPurchaseCustomers.length)}\n• میانگین فاکتور: ${formatMoney(analytics.averageInvoice)}`,
        chips: [
          { label: "داشبورد", to: "/" },
          { label: "هوش فروش", to: "/insights" },
        ],
        createdAt: new Date(),
      };
    }

    return {
      id: makeId(),
      role: "assistant",
      text: "می‌توانم درباره فروش امروز یا ماه، سود، بهترین مشتریان، مشتریان بدون خرید، فاکتورها، اطلاعات تماس ناقص و کمپین پیامکی پاسخ بدهم. سؤال را با یکی از همین موضوع‌ها دقیق‌تر بنویس.",
      chips: [{ label: "مشاهده تحلیل کامل", to: "/insights" }],
      createdAt: new Date(),
    };
  };

  const ask = (question: string) => {
    const value = question.trim();
    if (!value || thinking || loading) return;

    setMessages((current) => [
      ...current,
      { id: makeId(), role: "user", text: value, createdAt: new Date() },
    ]);
    setQuery("");
    setThinking(true);

    window.setTimeout(() => {
      setMessages((current) => [...current, buildAnswer(value)]);
      setThinking(false);
    }, 550);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(query);
  };

  const suggestions = [
    "فروش امروز چقدر بوده؟",
    "سه مشتری برتر من چه کسانی هستند؟",
    "چند مشتری بدون خرید داریم؟",
    "یک متن کمپین پیامکی پیشنهاد بده",
  ];

  return (
    <section className="aiPage" dir="rtl">
      <header className="aiHero">
        <div className="aiHeroCopy">
          <span className="aiEyebrow"><FaWandMagicSparkles /> TAK AI COPILOT</span>
          <h1>دستیار هوشمند فروش</h1>
          <p>تحلیل سریع اطلاعات واقعی CRM، پاسخ مدیریتی و پیشنهاد اقدام بعدی در یک محیط یکپارچه.</p>
          <div className="aiHeroMeta">
            <span><FaCircleCheck /> متصل به داده‌های CRM</span>
            <span><FaClockRotateLeft /> آخرین بروزرسانی: {lastUpdated ? lastUpdated.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
          </div>
        </div>
        <button className="aiRefresh" type="button" onClick={() => void loadData()} disabled={loading}>
          <FaArrowRotateRight className={loading ? "spin" : ""} /> بروزرسانی داده‌ها
        </button>
      </header>

      {error && (
        <div className="aiError"><FaCircleExclamation /><span>{error}</span><button type="button" onClick={() => void loadData()}>تلاش دوباره</button></div>
      )}

      <div className="aiKpis">
        <article><span className="aiKpiIcon"><FaChartLine /></span><div><small>فروش کل</small><strong>{loading ? "—" : formatMoney(analytics.totalSales)}</strong></div></article>
        <article><span className="aiKpiIcon"><FaFileInvoiceDollar /></span><div><small>فاکتورهای ثبت‌شده</small><strong>{loading ? "—" : formatNumber(invoices.length)}</strong></div></article>
        <article><span className="aiKpiIcon"><FaUserGroup /></span><div><small>مشتریان فعال</small><strong>{loading ? "—" : formatNumber(analytics.activeCustomers.length)}</strong></div></article>
        <article><span className="aiKpiIcon"><FaBolt /></span><div><small>فرصت پیگیری</small><strong>{loading ? "—" : formatNumber(analytics.noPurchaseCustomers.length)}</strong></div></article>
      </div>

      <div className="aiWorkspace">
        <main className="aiChatCard">
          <div className="aiChatHead">
            <div className="aiBotAvatar"><FaRobot /></div>
            <div><strong>TAK Sales Copilot</strong><small><span /> آماده تحلیل داده‌ها</small></div>
            <span className="aiDataBadge">{formatNumber(customers.length + invoices.length)} رکورد متصل</span>
          </div>

          <div className="aiMessages">
            {messages.map((message) => (
              <div key={message.id} className={`aiMessageRow ${message.role}`}>
                {message.role === "assistant" && <span className="aiMessageAvatar"><FaRobot /></span>}
                <div className="aiBubble">
                  <p>{message.text}</p>
                  {message.chips && (
                    <div className="aiMessageActions">
                      {message.chips.map((chip) => <Link key={`${message.id}-${chip.to}`} to={chip.to}>{chip.label}<FaArrowUp /></Link>)}
                    </div>
                  )}
                  <time>{message.createdAt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="aiMessageRow assistant">
                <span className="aiMessageAvatar"><FaRobot /></span>
                <div className="aiBubble aiThinking"><i /><i /><i /><span>در حال تحلیل داده‌ها</span></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="aiSuggestions">
            {suggestions.map((item) => <button key={item} type="button" onClick={() => ask(item)} disabled={loading || thinking}>{item}</button>)}
          </div>

          <form className="aiComposer" onSubmit={submit}>
            <div className="aiComposerInput"><FaWandMagicSparkles /><textarea value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(query); } }} placeholder="مثلاً: بهترین مشتریان این ماه چه کسانی هستند؟" rows={1} disabled={loading} /></div>
            <button type="submit" disabled={!query.trim() || loading || thinking}><FaPaperPlane /><span>ارسال</span></button>
          </form>
          <p className="aiDisclaimer">پاسخ‌ها بر اساس داده‌های فعلی CRM تولید می‌شوند و در این نسخه از تحلیل داخلی و بدون سرویس هوش مصنوعی خارجی استفاده شده است.</p>
        </main>

        <aside className="aiSide">
          <section className="aiPanel">
            <div className="aiPanelTitle"><span><FaLightbulb /></span><div><strong>بینش‌های پیشنهادی</strong><small>اقدام‌های مهم امروز</small></div></div>
            <div className="aiInsightList">
              {loading ? [1,2,3].map((item) => <div key={item} className="aiInsightSkeleton" />) : insights.length ? insights.map((item) => (
                <article key={item.title} className={`aiInsight ${item.tone}`}><span>{item.tone === "success" ? <FaCircleCheck /> : item.tone === "warning" ? <FaCircleExclamation /> : <FaWandMagicSparkles />}</span><div><strong>{item.title}</strong><p>{item.text}</p></div></article>
              )) : <div className="aiEmptyMini"><FaCircleCheck /><strong>وضعیت مناسب است</strong><p>هشدار مهمی در داده‌های فعلی دیده نشد.</p></div>}
            </div>
          </section>

          <section className="aiPanel aiQuickPanel">
            <div className="aiPanelTitle"><span><FaBolt /></span><div><strong>اقدام سریع</strong><small>ادامه کار بدون خروج از جریان</small></div></div>
            <Link to="/sms"><span><FaMessage /></span><div><strong>ساخت کمپین پیامکی</strong><small>ارسال پیشنهاد به گروه مشتریان</small></div><FaArrowUp /></Link>
            <Link to="/insights"><span><FaChartLine /></span><div><strong>تحلیل کامل فروش</strong><small>امتیاز و دسته‌بندی مشتریان</small></div><FaArrowUp /></Link>
            <Link to="/invoices"><span><FaFileInvoiceDollar /></span><div><strong>بررسی فاکتورها</strong><small>جزئیات فروش و تراکنش‌ها</small></div><FaArrowUp /></Link>
          </section>
        </aside>
      </div>
    </section>
  );
}

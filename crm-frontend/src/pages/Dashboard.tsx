import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaArrowRotateRight,
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaBolt,
  FaBoxArchive,
  FaChartColumn,
  FaChartLine,
  FaCircleCheck,
  FaCircleExclamation,
  FaClockRotateLeft,
  FaFileArrowUp,
  FaFileInvoiceDollar,
  FaGaugeHigh,
  FaMessage,
  FaPlus,
  FaReceipt,
  FaServer,
  FaSitemap,
  FaUserPlus,
  FaUsers,
  FaWallet,
} from "react-icons/fa6";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getCustomers,
  getDashboard,
  getInvoices,
  getSalesChart,
} from "../services/api";
import "./Dashboard.css";

type DashboardSummary = {
  customers?: number;
  sales?: number;
  profit?: number;
  sms?: number;
};

type SalesPoint = {
  month?: string;
  sale?: number | string;
  profit?: number | string;
};

type Customer = {
  id?: number | string;
  name?: string;
  phone?: string;
  totalSale?: number | string;
  invoiceCount?: number;
};

type Invoice = {
  id?: number | string;
  factor?: number | string;
  sale?: number | string;
  discount?: number | string;
  createdAt?: string;
  status?: string;
  user?: {
    id?: number | string;
    name?: string;
    phone?: string;
  };
};

const number = (value: unknown) => Number(value || 0);
const formatNumber = (value: unknown) => number(value).toLocaleString("fa-IR");
const formatMoney = (value: unknown) => `${formatNumber(value)} ریال`;
const formatChartDate = (value: unknown, index: number) => {
  if (!value) {
    return `دوره ${index + 1}`;
  }

  const text = String(value);

  const persianMonths = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];

  if (persianMonths.some((month) => text.includes(month))) {
    return text;
  }

  const date = new Date(text);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
    });
  }

  return text;
};

const toDate = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const previousMonth = (date: Date) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() - 1);
  return result;
};

const relativeTime = (value?: string) => {
  const date = toDate(value);
  if (!date) return "تاریخ نامشخص";
  const difference = Date.now() - date.getTime();
  const minutes = Math.floor(difference / 60000);
  if (minutes < 1) return "همین حالا";
  if (minutes < 60) return `${minutes.toLocaleString("fa-IR")} دقیقه قبل`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours.toLocaleString("fa-IR")} ساعت قبل`;
  const days = Math.floor(hours / 24);
  return `${days.toLocaleString("fa-IR")} روز قبل`;
};

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary>({});
  const [chart, setChart] = useState<SalesPoint[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [summaryResult, chartResult, customerResult, invoiceResult] =
        await Promise.all([
          getDashboard(),
          getSalesChart(),
          getCustomers(),
          getInvoices(),
        ]);

      setSummary(summaryResult || {});
      setChart(Array.isArray(chartResult) ? chartResult : []);
      setCustomers(Array.isArray(customerResult) ? customerResult : []);
      setInvoices(Array.isArray(invoiceResult) ? invoiceResult : []);
      setLastUpdated(new Date());
    } catch (loadError) {
      console.error(loadError);
      setError("دریافت اطلاعات داشبورد با مشکل روبه‌رو شد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const analytics = useMemo(() => {
    const now = new Date();
    const prevMonth = previousMonth(now);

    const todayInvoices = invoices.filter((item) => {
      const date = toDate(item.createdAt);
      return date ? sameDay(date, now) : false;
    });

    const thisMonthInvoices = invoices.filter((item) => {
      const date = toDate(item.createdAt);
      return date ? sameMonth(date, now) : false;
    });

    const previousMonthInvoices = invoices.filter((item) => {
      const date = toDate(item.createdAt);
      return date ? sameMonth(date, prevMonth) : false;
    });

    const todaySales = todayInvoices.reduce((sum, item) => sum + number(item.sale), 0);
    const monthSales = thisMonthInvoices.reduce((sum, item) => sum + number(item.sale), 0);
    const previousMonthSales = previousMonthInvoices.reduce(
      (sum, item) => sum + number(item.sale),
      0,
    );
    const monthGrowth = previousMonthSales
      ? ((monthSales - previousMonthSales) / previousMonthSales) * 100
      : null;

    const totalSales = number(summary.sales) || invoices.reduce(
      (sum, item) => sum + number(item.sale),
      0,
    );
    const totalProfit = number(summary.profit);
    const averageInvoice = invoices.length ? totalSales / invoices.length : 0;
    const buyingCustomers = customers.filter(
      (customer) => number(customer.totalSale) > 0 || number(customer.invoiceCount) > 0,
    ).length;
    const vipCustomers = customers.filter(
      (customer) => number(customer.totalSale) >= 100_000_000,
    ).length;
    const customersWithoutPhone = customers.filter(
      (customer) => !String(customer.phone || "").trim(),
    ).length;

    return {
      todayInvoices,
      todaySales,
      monthSales,
      monthGrowth,
      totalSales,
      totalProfit,
      averageInvoice,
      buyingCustomers,
      vipCustomers,
      customersWithoutPhone,
    };
  }, [customers, invoices, summary]);

  const salesChart = useMemo(
  () =>
    chart.map((item, index) => ({
      name: formatChartDate(item.month, index),
      sale: number(item.sale),
      profit: number(item.profit),
    })),
  [chart],
);

  const topCustomers = useMemo(
    () =>
      [...customers]
        .sort((a, b) => number(b.totalSale) - number(a.totalSale))
        .slice(0, 5),
    [customers],
  );

  const customerSegments = useMemo(() => {
    const vip = customers.filter((item) => number(item.totalSale) >= 100_000_000).length;
    const active = customers.filter(
      (item) => number(item.totalSale) > 0 && number(item.totalSale) < 100_000_000,
    ).length;
    const inactive = Math.max(customers.length - vip - active, 0);
    return [
      { name: "VIP", value: vip },
      { name: "فعال", value: active },
      { name: "بدون خرید", value: inactive },
    ].filter((item) => item.value > 0);
  }, [customers]);

  const recentInvoices = useMemo(
    () =>
      [...invoices]
        .sort(
          (a, b) =>
            (toDate(b.createdAt)?.getTime() || 0) -
            (toDate(a.createdAt)?.getTime() || 0),
        )
        .slice(0, 5),
    [invoices],
  );

  const metrics = [
    {
      title: "فروش امروز",
      value: formatMoney(analytics.todaySales),
      note: `${formatNumber(analytics.todayInvoices.length)} فاکتور ثبت‌شده`,
      icon: <FaWallet />,
      tone: "green",
    },
    {
      title: "فروش ماه جاری",
      value: formatMoney(analytics.monthSales),
      note:
        analytics.monthGrowth === null
          ? "داده کافی برای مقایسه وجود ندارد"
          : `${Math.abs(analytics.monthGrowth).toLocaleString("fa-IR", {
              maximumFractionDigits: 1,
            })}٪ ${analytics.monthGrowth >= 0 ? "رشد" : "کاهش"}`,
      icon:
        analytics.monthGrowth !== null && analytics.monthGrowth < 0 ? (
          <FaArrowTrendDown />
        ) : (
          <FaArrowTrendUp />
        ),
      tone: analytics.monthGrowth !== null && analytics.monthGrowth < 0 ? "red" : "blue",
    },
    {
      title: "سود کل",
      value: formatMoney(analytics.totalProfit),
      note: analytics.totalProfit ? "براساس اطلاعات ثبت‌شده" : "سود هنوز ثبت نشده است",
      icon: <FaChartLine />,
      tone: "purple",
    },
    {
      title: "میانگین هر فاکتور",
      value: formatMoney(analytics.averageInvoice),
      note: `${formatNumber(invoices.length)} فاکتور در سیستم`,
      icon: <FaReceipt />,
      tone: "orange",
    },
    {
      title: "مشتریان فعال",
      value: formatNumber(analytics.buyingCustomers),
      note: `از ${formatNumber(customers.length)} مشتری`,
      icon: <FaUsers />,
      tone: "cyan",
    },
    {
      title: "مشتریان VIP",
      value: formatNumber(analytics.vipCustomers),
      note: "خرید بالای ۱۰۰ میلیون ریال",
      icon: <FaGaugeHigh />,
      tone: "gold",
    },
  ];

  const alerts = [
    analytics.customersWithoutPhone > 0
      ? {
          title: "اطلاعات تماس ناقص",
          text: `${formatNumber(analytics.customersWithoutPhone)} مشتری شماره تماس ندارند.`,
          tone: "warning",
          link: "/customers",
        }
      : null,
    customers.length > 0 && analytics.buyingCustomers === 0
      ? {
          title: "مشتری فعال ثبت نشده",
          text: "هیچ مشتری دارای سابقه خرید شناسایی نشد.",
          tone: "danger",
          link: "/upload",
        }
      : null,
    invoices.length === 0
      ? {
          title: "فاکتوری وجود ندارد",
          text: "برای فعال‌شدن گزارش‌ها، فایل فروش را وارد کنید.",
          tone: "info",
          link: "/upload",
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string;
    text: string;
    tone: string;
    link: string;
  }>;

  return (
    <main className="executiveDashboard" dir="rtl">
      <section className="executiveHero">
        <div>
          <span className="executiveEyebrow">
            <FaSitemap /> مرکز فرماندهی TAK CRM
          </span>
          <h1>داشبورد مدیریتی</h1>
          <p>تصویر واقعی فروش، مشتریان و فعالیت‌های سیستم در یک نگاه.</p>
        </div>

        <div className="executiveHeroActions">
          <div className="dashboardFreshness">
            <FaClockRotateLeft />
            <span>
              {lastUpdated
                ? `بروزرسانی ${lastUpdated.toLocaleTimeString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "در حال دریافت اطلاعات"}
            </span>
          </div>
          <button
            type="button"
            className="dashboardRefresh"
            onClick={() => void loadDashboard()}
            disabled={loading}
          >
            <FaArrowRotateRight className={loading ? "spin" : ""} />
            بروزرسانی
          </button>
        </div>
      </section>

      {error ? (
        <section className="dashboardErrorState">
          <FaCircleExclamation />
          <div>
            <strong>داشبورد در دسترس نیست</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={() => void loadDashboard()}>
            تلاش دوباره
          </button>
        </section>
      ) : null}

      <section className="executiveMetrics">
        {metrics.map((item) => (
          <article className={`executiveMetric ${item.tone}`} key={item.title}>
            <div className="executiveMetricHead">
              <span className="executiveMetricIcon">{item.icon}</span>
              <span className="metricLiveDot">Live</span>
            </div>
            <span>{item.title}</span>
            <strong className={loading ? "dashboardSkeletonText" : ""}>
              {loading ? "—" : item.value}
            </strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <section className="dashboardAnalyticsGrid">
        <article className="executivePanel salesOverviewPanel">
          <div className="executivePanelHeader">
            <div>
              <span>تحلیل عملکرد</span>
              <h2>روند فروش</h2>
            </div>
            <span className="panelBadge">{formatNumber(salesChart.length)} دوره</span>
          </div>

          <div className="largeChart">
            {salesChart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChart} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="executiveSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#138a5b" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#138a5b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#e8eeeb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={52} />
                  <Tooltip
                    formatter={(value) => [formatMoney(value), "فروش"]}
                    contentStyle={{ borderRadius: 14, border: "1px solid #e3ebe7" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sale"
                    stroke="#138a5b"
                    strokeWidth={3}
                    fill="url(#executiveSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="emptyChart">
                <FaChartLine />
                <strong>داده‌ای برای نمودار وجود ندارد</strong>
                <span>بعد از ورود فایل فروش، روند عملکرد اینجا نمایش داده می‌شود.</span>
              </div>
            )}
          </div>
        </article>

        <article className="executivePanel segmentPanel">
          <div className="executivePanelHeader">
            <div>
              <span>ترکیب مشتریان</span>
              <h2>تقسیم‌بندی ارزش</h2>
            </div>
          </div>

          <div className="segmentChartWrap">
            {customerSegments.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={customerSegments}
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={5}
                  >
                    {customerSegments.map((_, index) => (
                      <Cell
                        key={index}
                        fill={["#0f8d60", "#3f7bd9", "#d7a32c"][index % 3]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="emptyChart compact">
                <FaUsers />
                <strong>مشتری ثبت نشده است</strong>
              </div>
            )}

            <div className="segmentLegend">
              {customerSegments.map((item, index) => (
                <div key={item.name}>
                  <span className={`legendColor color${index + 1}`} />
                  <span>{item.name}</span>
                  <strong>{formatNumber(item.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="dashboardLowerGrid">
        <article className="executivePanel topCustomerPanel">
          <div className="executivePanelHeader">
            <div>
              <span>مشتریان کلیدی</span>
              <h2>بیشترین ارزش خرید</h2>
            </div>
            <Link to="/customers">مشاهده همه</Link>
          </div>

          <div className="topCustomerList">
            {topCustomers.length ? (
              topCustomers.map((customer, index) => (
                <Link
                  to={customer.id ? `/customer/${customer.id}` : "/customers"}
                  key={customer.id || `${customer.name}-${index}`}
                  className="topCustomerRow"
                >
                  <span className="customerRank">{(index + 1).toLocaleString("fa-IR")}</span>
                  <span className="customerMiniAvatar">
                    {String(customer.name || "م").trim().charAt(0)}
                  </span>
                  <div>
                    <strong>{customer.name || "مشتری بدون نام"}</strong>
                    <small>{formatNumber(customer.invoiceCount)} فاکتور</small>
                  </div>
                  <b>{formatMoney(customer.totalSale)}</b>
                </Link>
              ))
            ) : (
              <div className="panelEmpty">هنوز مشتری دارای خرید ثبت نشده است.</div>
            )}
          </div>
        </article>

        <article className="executivePanel recentActivityPanel">
          <div className="executivePanelHeader">
            <div>
              <span>فعالیت‌های اخیر</span>
              <h2>آخرین فاکتورها</h2>
            </div>
            <Link to="/invoices">مرکز فاکتورها</Link>
          </div>

          <div className="activityTimeline">
            {recentInvoices.length ? (
              recentInvoices.map((invoice, index) => (
                <div className="activityTimelineRow" key={invoice.id || index}>
                  <span className="activityTimelineIcon"><FaFileInvoiceDollar /></span>
                  <div>
                    <strong>{invoice.user?.name || "مشتری بدون نام"}</strong>
                    <small>
                      فاکتور #{invoice.factor || "—"} · {formatMoney(invoice.sale)}
                    </small>
                  </div>
                  <time>{relativeTime(invoice.createdAt)}</time>
                </div>
              ))
            ) : (
              <div className="panelEmpty">فعالیتی برای نمایش وجود ندارد.</div>
            )}
          </div>
        </article>

        <article className="executivePanel alertsPanel">
          <div className="executivePanelHeader">
            <div>
              <span>کنترل کیفیت داده</span>
              <h2>هشدارهای مدیریتی</h2>
            </div>
            <span className="alertCount">{formatNumber(alerts.length)}</span>
          </div>

          <div className="alertsList">
            {alerts.length ? (
              alerts.map((alert) => (
                <Link to={alert.link} className={`alertItem ${alert.tone}`} key={alert.title}>
                  <FaCircleExclamation />
                  <div>
                    <strong>{alert.title}</strong>
                    <small>{alert.text}</small>
                  </div>
                </Link>
              ))
            ) : (
              <div className="allClearState">
                <FaCircleCheck />
                <strong>همه‌چیز مرتب است</strong>
                <span>هشدار مهمی در داده‌های فعلی شناسایی نشد.</span>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="dashboardUtilityGrid">
        <article className="executivePanel quickActionsPanel">
          <div className="executivePanelHeader">
            <div>
              <span>دسترسی سریع</span>
              <h2>عملیات پرکاربرد</h2>
            </div>
          </div>

          <div className="quickActionGrid">
            <Link to="/upload"><FaFileArrowUp /><span>ورود فایل فروش</span></Link>
            <Link to="/customers"><FaUserPlus /><span>مدیریت مشتریان</span></Link>
            <Link to="/invoices"><FaReceipt /><span>مشاهده فاکتورها</span></Link>
            <Link to="/sms"><FaMessage /><span>ارسال پیامک</span></Link>
            <Link to="/settings"><FaBolt /><span>تنظیمات سیستم</span></Link>
            <Link to="/upload"><FaPlus /><span>افزودن اطلاعات</span></Link>
          </div>
        </article>

        <article className="executivePanel systemPanel">
          <div className="executivePanelHeader">
            <div>
              <span>زیرساخت</span>
              <h2>وضعیت سیستم</h2>
            </div>
            <span className={`systemPulse ${error ? "offline" : ""}`} />
          </div>

          <div className="systemStatusList">
            <div><span><FaServer /> API</span><strong className={error ? "offlineText" : "onlineText"}>{error ? "قطع" : "متصل"}</strong></div>
            <div><span><FaBoxArchive /> پایگاه داده</span><strong className={error ? "offlineText" : "onlineText"}>{error ? "نامشخص" : "فعال"}</strong></div>
            <div><span><FaChartColumn /> رکورد فاکتور</span><strong>{formatNumber(invoices.length)}</strong></div>
            <div><span><FaUsers /> رکورد مشتری</span><strong>{formatNumber(customers.length)}</strong></div>
          </div>
        </article>
      </section>
    </main>
  );
}

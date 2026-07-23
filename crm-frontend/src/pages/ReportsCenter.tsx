import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaArrowRotateRight,
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaCalendarDays,
  FaChartColumn,
  FaCircleExclamation,
  FaDownload,
  FaFileInvoiceDollar,
  FaFilter,
  FaMedal,
  FaReceipt,
  FaUsers,
  FaWallet,
} from "react-icons/fa6";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getCustomers, getInvoices } from "../services/api";
import "./ReportsCenter.css";

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

type Customer = {
  id?: number | string;
  name?: string;
  phone?: string;
  totalSale?: number | string;
  invoiceCount?: number;
};

type RangeKey = "7" | "30" | "90" | "365" | "all";

const number = (value: unknown) => Number(value || 0);
const formatNumber = (value: unknown) => number(value).toLocaleString("fa-IR");
const formatMoney = (value: unknown) => `${formatNumber(value)} تومان`;

const validDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const rangeLabels: Record<RangeKey, string> = {
  "7": "۷ روز اخیر",
  "30": "۳۰ روز اخیر",
  "90": "۹۰ روز اخیر",
  "365": "یک سال اخیر",
  all: "کل دوره",
};

export default function ReportsCenter() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [range, setRange] = useState<RangeKey>("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [invoiceResult, customerResult] = await Promise.all([
        getInvoices(),
        getCustomers(),
      ]);
      setInvoices(Array.isArray(invoiceResult) ? invoiceResult : []);
      setCustomers(Array.isArray(customerResult) ? customerResult : []);
      setUpdatedAt(new Date());
    } catch (loadError) {
      console.error("Reports loading failed:", loadError);
      setError("دریافت اطلاعات گزارش‌ها با مشکل مواجه شد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredInvoices = useMemo(() => {
    if (range === "all") return invoices;
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - Number(range) + 1);
    return invoices.filter((invoice) => {
      const date = validDate(invoice.createdAt);
      return date ? date >= from : false;
    });
  }, [invoices, range]);

  const previousInvoices = useMemo(() => {
    if (range === "all") return [];
    const days = Number(range);
    const currentStart = new Date();
    currentStart.setHours(0, 0, 0, 0);
    currentStart.setDate(currentStart.getDate() - days + 1);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - days);
    return invoices.filter((invoice) => {
      const date = validDate(invoice.createdAt);
      return date ? date >= previousStart && date < currentStart : false;
    });
  }, [invoices, range]);

  const analytics = useMemo(() => {
    const totalSale = filteredInvoices.reduce((sum, item) => sum + number(item.sale), 0);
    const totalDiscount = filteredInvoices.reduce(
      (sum, item) => sum + number(item.discount),
      0,
    );
    const averageInvoice = filteredInvoices.length
      ? totalSale / filteredInvoices.length
      : 0;
    const uniqueCustomers = new Set(
      filteredInvoices.map(
        (item) => item.user?.id || item.user?.phone || item.user?.name,
      ),
    ).size;
    const previousSale = previousInvoices.reduce(
      (sum, item) => sum + number(item.sale),
      0,
    );
    const growth = previousSale
      ? ((totalSale - previousSale) / previousSale) * 100
      : null;

    return {
      totalSale,
      totalDiscount,
      averageInvoice,
      uniqueCustomers,
      growth,
    };
  }, [filteredInvoices, previousInvoices]);

  const dailyChart = useMemo(() => {
    const map = new Map<string, { label: string; sale: number; invoices: number }>();
    filteredInvoices.forEach((invoice) => {
      const date = validDate(invoice.createdAt);
      if (!date) return;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const current = map.get(key) || {
        label: date.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
        sale: 0,
        invoices: 0,
      };
      current.sale += number(invoice.sale);
      current.invoices += 1;
      map.set(key, current);
    });
    return [...map.entries()]
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([, value]) => value);
  }, [filteredInvoices]);

  const topCustomers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; sale: number; invoices: number }
    >();
    filteredInvoices.forEach((invoice) => {
      const key = String(
        invoice.user?.id || invoice.user?.phone || invoice.user?.name || "unknown",
      );
      const current = map.get(key) || {
        name: invoice.user?.name || "مشتری بدون نام",
        phone: invoice.user?.phone || "بدون شماره",
        sale: 0,
        invoices: 0,
      };
      current.sale += number(invoice.sale);
      current.invoices += 1;
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => b.sale - a.sale).slice(0, 8);
  }, [filteredInvoices]);

  const customerStats = useMemo(() => {
    const active = customers.filter(
      (customer) => number(customer.totalSale) > 0 || number(customer.invoiceCount) > 0,
    ).length;
    const withoutPhone = customers.filter(
      (customer) => String(customer.phone || "").replace(/\D/g, "").length < 10,
    ).length;
    return { active, withoutPhone };
  }, [customers]);

  const exportCsv = () => {
    const rows = [
      ["شماره فاکتور", "نام مشتری", "شماره تماس", "فروش", "تخفیف", "تاریخ"],
      ...filteredInvoices.map((invoice) => [
        invoice.factor || invoice.id || "",
        invoice.user?.name || "",
        invoice.user?.phone || "",
        number(invoice.sale),
        number(invoice.discount),
        invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString("fa-IR") : "",
      ]),
    ];
    const csv = `\uFEFF${rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tak-crm-report-${range}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="reportsPage" dir="rtl">
      <header className="reportsHero">
        <div>
          <span className="reportsEyebrow"><FaChartColumn /> مرکز گزارش‌گیری TAK</span>
          <h1>گزارش مدیریتی فروش</h1>
          <p>عملکرد فروش، مشتریان و فاکتورها را در بازه‌های مختلف بررسی و خروجی دریافت کنید.</p>
        </div>
        <div className="reportsHeroActions">
          <button type="button" className="reportsSecondaryButton" onClick={() => void load()}>
            <FaArrowRotateRight /> بروزرسانی
          </button>
          <button type="button" className="reportsPrimaryButton" onClick={exportCsv} disabled={!filteredInvoices.length}>
            <FaDownload /> خروجی CSV
          </button>
        </div>
      </header>

      <section className="reportsToolbar">
        <div className="reportsRangeTitle">
          <FaCalendarDays />
          <span><strong>بازه گزارش</strong><small>{rangeLabels[range]}</small></span>
        </div>
        <div className="reportsRangeButtons">
          {(Object.keys(rangeLabels) as RangeKey[]).map((key) => (
            <button key={key} type="button" className={range === key ? "active" : ""} onClick={() => setRange(key)}>
              {rangeLabels[key]}
            </button>
          ))}
        </div>
        <div className="reportsUpdated">
          <FaFilter /> {updatedAt ? `آخرین بروزرسانی ${updatedAt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}` : "در انتظار دریافت اطلاعات"}
        </div>
      </section>

      {error ? (
        <section className="reportsState reportsError">
          <FaCircleExclamation />
          <strong>گزارش بارگذاری نشد</strong>
          <p>{error}</p>
          <button type="button" onClick={() => void load()}>تلاش دوباره</button>
        </section>
      ) : loading ? (
        <section className="reportsSkeleton">
          {Array.from({ length: 8 }).map((_, index) => <span key={index} />)}
        </section>
      ) : (
        <>
          <section className="reportsKpiGrid">
            <article className="reportsKpiCard">
              <span className="reportsKpiIcon green"><FaWallet /></span>
              <div><small>فروش دوره</small><strong>{formatMoney(analytics.totalSale)}</strong><em>{filteredInvoices.length.toLocaleString("fa-IR")} فاکتور</em></div>
            </article>
            <article className="reportsKpiCard">
              <span className="reportsKpiIcon blue"><FaReceipt /></span>
              <div><small>میانگین هر فاکتور</small><strong>{formatMoney(analytics.averageInvoice)}</strong><em>ارزش متوسط سفارش</em></div>
            </article>
            <article className="reportsKpiCard">
              <span className="reportsKpiIcon purple"><FaUsers /></span>
              <div><small>مشتریان خریدار</small><strong>{analytics.uniqueCustomers.toLocaleString("fa-IR")}</strong><em>{customerStats.active.toLocaleString("fa-IR")} مشتری فعال کل</em></div>
            </article>
            <article className="reportsKpiCard">
              <span className="reportsKpiIcon orange"><FaFileInvoiceDollar /></span>
              <div><small>تخفیف ثبت‌شده</small><strong>{formatMoney(analytics.totalDiscount)}</strong><em>{customerStats.withoutPhone.toLocaleString("fa-IR")} شماره ناقص</em></div>
            </article>
          </section>

          <section className="reportsGrowthCard">
            <div className={analytics.growth !== null && analytics.growth < 0 ? "down" : "up"}>
              {analytics.growth !== null && analytics.growth < 0 ? <FaArrowTrendDown /> : <FaArrowTrendUp />}
            </div>
            <span>
              <small>مقایسه با دوره قبل</small>
              <strong>{analytics.growth === null ? "داده کافی نیست" : `${Math.abs(analytics.growth).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪ ${analytics.growth >= 0 ? "رشد" : "کاهش"}`}</strong>
            </span>
            <p>{range === "all" ? "برای کل دوره، مقایسه دوره قبل محاسبه نمی‌شود." : "این شاخص فروش بازه انتخابی را با بازه زمانی هم‌اندازه قبل از آن مقایسه می‌کند."}</p>
          </section>

          <section className="reportsContentGrid">
            <article className="reportsPanel reportsChartPanel">
              <div className="reportsPanelHeader">
                <div><FaChartColumn /><span><strong>روند فروش</strong><small>فروش روزانه در بازه انتخابی</small></span></div>
              </div>
              {dailyChart.length ? (
                <div className="reportsChart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyChart} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="reportSale" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="currentColor" stopOpacity={0.34} />
                          <stop offset="95%" stopColor="currentColor" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => Number(value).toLocaleString("fa-IR", { notation: "compact" })} />
                      <Tooltip formatter={(value) => [formatMoney(value), "فروش"]} />
                      <Area type="monotone" dataKey="sale" stroke="currentColor" strokeWidth={3} fill="url(#reportSale)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="reportsEmpty">برای این بازه اطلاعات فروش ثبت نشده است.</div>}
            </article>

            <article className="reportsPanel reportsTopPanel">
              <div className="reportsPanelHeader">
                <div><FaMedal /><span><strong>مشتریان برتر</strong><small>بر اساس فروش بازه انتخابی</small></span></div>
              </div>
              <div className="reportsTopList">
                {topCustomers.length ? topCustomers.map((customer, index) => (
                  <div className="reportsTopRow" key={`${customer.phone}-${index}`}>
                    <span className="reportsRank">{(index + 1).toLocaleString("fa-IR")}</span>
                    <span className="reportsAvatar">{customer.name.trim().charAt(0) || "؟"}</span>
                    <div><strong>{customer.name}</strong><small>{customer.phone} · {customer.invoices.toLocaleString("fa-IR")} فاکتور</small></div>
                    <b>{formatMoney(customer.sale)}</b>
                  </div>
                )) : <div className="reportsEmpty">مشتری خریداری در این بازه وجود ندارد.</div>}
              </div>
            </article>
          </section>
        </>
      )}
    </main>
  );
}

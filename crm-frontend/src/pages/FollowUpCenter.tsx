import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaBell,
  FaCheck,
  FaClock,
  FaFileInvoiceDollar,
  FaFilter,
  FaMagnifyingGlass,
  FaRotate,
  FaTriangleExclamation,
  FaUsers,
} from "react-icons/fa6";

import { getCustomers, getInvoices } from "../services/api";
import "./FollowUpCenter.css";

type Customer = Record<string, any>;
type Invoice = Record<string, any>;
type TabKey = "all" | "customers" | "invoices" | "data";
type Priority = "high" | "medium" | "low";

type AlertItem = {
  id: string;
  type: Exclude<TabKey, "all">;
  title: string;
  description: string;
  meta: string;
  priority: Priority;
  link: string;
  action: string;
  timestamp: number;
};

const numberValue = (value: unknown) => {
  const numeric = Number(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const pick = (obj: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== "") {
      return obj[key];
    }
  }
  return undefined;
};

const parseDate = (value: unknown) => {
  if (!value) return 0;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const money = (value: number) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(value);

const normalizePhone = (value: unknown) => String(value ?? "").replace(/\D/g, "");

export default function FollowUpCenter() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [resolvedIds, setResolvedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("tak-crm-resolved-alerts") || "[]");
    } catch {
      return [];
    }
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [customerResult, invoiceResult] = await Promise.all([
        getCustomers(),
        getInvoices(),
      ]);

      setCustomers(Array.isArray(customerResult) ? customerResult : []);
      setInvoices(Array.isArray(invoiceResult) ? invoiceResult : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("دریافت اطلاعات مرکز پیگیری ناموفق بود. اتصال API را بررسی کنید.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = window.setInterval(() => loadData(true), 60000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const alerts = useMemo<AlertItem[]>(() => {
    const now = Date.now();
    const result: AlertItem[] = [];

    customers.forEach((customer, index) => {
      const id = String(pick(customer, ["id", "customerId", "userId"]) ?? index);
      const name = String(
        pick(customer, ["name", "fullName", "customerName", "title"]) ?? "مشتری بدون نام"
      );
      const phone = normalizePhone(pick(customer, ["phone", "mobile", "phoneNumber"]));
      const invoiceCount = numberValue(
        pick(customer, ["invoiceCount", "invoicesCount", "totalInvoices", "ordersCount"])
      );
      const totalPurchase = numberValue(
        pick(customer, ["totalPurchase", "totalSales", "totalAmount", "purchaseAmount"])
      );
      const lastPurchase = parseDate(
        pick(customer, ["lastPurchaseDate", "lastInvoiceDate", "updatedAt", "createdAt"])
      );
      const daysSince = lastPurchase
        ? Math.floor((now - lastPurchase) / 86400000)
        : null;

      if (phone.length < 10) {
        result.push({
          id: `customer-phone-${id}`,
          type: "data",
          title: `شماره تماس ${name} ناقص است`,
          description: "اطلاعات تماس این مشتری برای پیامک و پیگیری قابل استفاده نیست.",
          meta: phone ? `شماره ثبت‌شده: ${phone}` : "شماره‌ای ثبت نشده است",
          priority: "high",
          link: `/customer/${id}`,
          action: "تکمیل اطلاعات",
          timestamp: now - index * 1000,
        });
      }

      if (invoiceCount === 0 && totalPurchase === 0) {
        result.push({
          id: `customer-no-sale-${id}`,
          type: "customers",
          title: `${name} هنوز خریدی ثبت نکرده است`,
          description: "این مشتری یک فرصت مناسب برای اولین تماس فروش است.",
          meta: "بدون فاکتور ثبت‌شده",
          priority: "medium",
          link: `/customer/${id}`,
          action: "مشاهده مشتری",
          timestamp: lastPurchase || now - (index + 1) * 60000,
        });
      } else if (daysSince !== null && daysSince >= 60) {
        result.push({
          id: `customer-inactive-${id}`,
          type: "customers",
          title: `${name} نیاز به پیگیری دارد`,
          description: `از آخرین فعالیت این مشتری ${daysSince.toLocaleString("fa-IR")} روز گذشته است.`,
          meta: totalPurchase
            ? `ارزش خرید: ${money(totalPurchase)} تومان`
            : "سابقه خرید موجود است",
          priority: daysSince >= 90 ? "high" : "medium",
          link: `/customer/${id}`,
          action: "شروع پیگیری",
          timestamp: lastPurchase,
        });
      }
    });

    invoices.forEach((invoice, index) => {
      const id = String(pick(invoice, ["id", "invoiceId"]) ?? index);
      const amount = numberValue(pick(invoice, ["total", "amount", "totalAmount", "price"]));
      const status = String(pick(invoice, ["status", "paymentStatus"]) ?? "").toLowerCase();
      const customerName = String(
        pick(invoice, ["customerName", "name", "buyerName"]) ??
          pick(invoice?.customer || {}, ["name", "fullName"]) ??
          "مشتری"
      );
      const date = parseDate(pick(invoice, ["createdAt", "date", "invoiceDate", "updatedAt"]));
      const daysOld = date ? Math.floor((now - date) / 86400000) : 0;
      const unpaid = ["unpaid", "pending", "overdue", "not_paid", "پرداخت نشده", "در انتظار"].some(
        (value) => status.includes(value)
      );

      if (unpaid || (daysOld >= 7 && status && !status.includes("paid") && !status.includes("پرداخت"))) {
        result.push({
          id: `invoice-pending-${id}`,
          type: "invoices",
          title: `فاکتور ${customerName} نیاز به بررسی دارد`,
          description: unpaid
            ? "وضعیت پرداخت این فاکتور هنوز نهایی نشده است."
            : "این فاکتور قدیمی است و وضعیت نهایی مشخصی ندارد.",
          meta: amount ? `${money(amount)} تومان` : `شماره فاکتور: ${id}`,
          priority: daysOld >= 14 ? "high" : "medium",
          link: "/invoices",
          action: "بررسی فاکتور",
          timestamp: date || now - index * 60000,
        });
      }
    });

    return result.sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 };
      return rank[b.priority] - rank[a.priority] || b.timestamp - a.timestamp;
    });
  }, [customers, invoices]);

  const visibleAlerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return alerts.filter((item) => {
      if (resolvedIds.includes(item.id)) return false;
      if (tab !== "all" && item.type !== tab) return false;
      if (priority !== "all" && item.priority !== priority) return false;
      if (!normalizedQuery) return true;
      return `${item.title} ${item.description} ${item.meta}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [alerts, priority, query, resolvedIds, tab]);

  const stats = useMemo(() => ({
    total: alerts.filter((item) => !resolvedIds.includes(item.id)).length,
    high: alerts.filter((item) => item.priority === "high" && !resolvedIds.includes(item.id)).length,
    customers: alerts.filter((item) => item.type === "customers" && !resolvedIds.includes(item.id)).length,
    invoices: alerts.filter((item) => item.type === "invoices" && !resolvedIds.includes(item.id)).length,
  }), [alerts, resolvedIds]);

  const resolveAlert = (id: string) => {
    const next = [...new Set([...resolvedIds, id])];
    setResolvedIds(next);
    localStorage.setItem("tak-crm-resolved-alerts", JSON.stringify(next));
  };

  const resetResolved = () => {
    setResolvedIds([]);
    localStorage.removeItem("tak-crm-resolved-alerts");
  };

  return (
    <section className="followPage" dir="rtl">
      <header className="followHero">
        <div>
          <span className="followEyebrow"><FaBell /> مرکز عملیات فروش</span>
          <h1>پیگیری‌ها و اعلان‌های هوشمند</h1>
          <p>کارهای مهم امروز، مشتریان نیازمند تماس و فاکتورهای قابل بررسی را در یک نمای زنده مدیریت کن.</p>
        </div>
        <div className="followHeroActions">
          <span className="followLive"><i /> بروزرسانی خودکار هر ۶۰ ثانیه</span>
          <button type="button" onClick={() => loadData(true)} disabled={refreshing}>
            <FaRotate className={refreshing ? "spin" : ""} />
            {refreshing ? "در حال بروزرسانی" : "بروزرسانی"}
          </button>
        </div>
      </header>

      <div className="followStats">
        <article><span className="statIcon"><FaBell /></span><div><small>پیگیری باز</small><strong>{stats.total.toLocaleString("fa-IR")}</strong></div></article>
        <article><span className="statIcon danger"><FaTriangleExclamation /></span><div><small>اولویت بالا</small><strong>{stats.high.toLocaleString("fa-IR")}</strong></div></article>
        <article><span className="statIcon users"><FaUsers /></span><div><small>پیگیری مشتری</small><strong>{stats.customers.toLocaleString("fa-IR")}</strong></div></article>
        <article><span className="statIcon invoice"><FaFileInvoiceDollar /></span><div><small>بررسی فاکتور</small><strong>{stats.invoices.toLocaleString("fa-IR")}</strong></div></article>
      </div>

      <div className="followToolbar">
        <div className="followSearch"><FaMagnifyingGlass /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در پیگیری‌ها..." /></div>
        <div className="followFilter"><FaFilter /><select value={priority} onChange={(event) => setPriority(event.target.value as any)}><option value="all">همه اولویت‌ها</option><option value="high">اولویت بالا</option><option value="medium">اولویت متوسط</option><option value="low">اولویت کم</option></select></div>
        {resolvedIds.length > 0 && <button className="followReset" type="button" onClick={resetResolved}>بازگرداندن انجام‌شده‌ها</button>}
      </div>

      <div className="followTabs">
        {([
          ["all", "همه"],
          ["customers", "مشتریان"],
          ["invoices", "فاکتورها"],
          ["data", "کیفیت اطلاعات"],
        ] as [TabKey, string][]).map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div className="followContent">
        {loading ? (
          <div className="followSkeleton">{Array.from({ length: 5 }).map((_, index) => <span key={index} />)}</div>
        ) : error ? (
          <div className="followState error"><FaTriangleExclamation /><h3>دریافت اطلاعات انجام نشد</h3><p>{error}</p><button type="button" onClick={() => loadData()}>تلاش دوباره</button></div>
        ) : visibleAlerts.length === 0 ? (
          <div className="followState success"><FaCheck /><h3>کار فوری باقی نمانده است</h3><p>با فیلتر فعلی هیچ پیگیری بازی وجود ندارد.</p></div>
        ) : (
          <div className="followList">
            {visibleAlerts.map((item) => (
              <article className={`followCard ${item.priority}`} key={item.id}>
                <span className="followPriority" />
                <div className="followCardIcon">
                  {item.type === "customers" ? <FaUsers /> : item.type === "invoices" ? <FaFileInvoiceDollar /> : <FaTriangleExclamation />}
                </div>
                <div className="followCardBody">
                  <div className="followCardTop"><h3>{item.title}</h3><span className={`priorityBadge ${item.priority}`}>{item.priority === "high" ? "فوری" : item.priority === "medium" ? "متوسط" : "عادی"}</span></div>
                  <p>{item.description}</p>
                  <small><FaClock /> {item.meta}</small>
                </div>
                <div className="followCardActions">
                  <Link to={item.link}>{item.action}<FaArrowLeft /></Link>
                  <button type="button" onClick={() => resolveAlert(item.id)}><FaCheck /> انجام شد</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <footer className="followFooter">
        <span>آخرین بروزرسانی: {lastUpdated ? lastUpdated.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
        <span>{customers.length.toLocaleString("fa-IR")} مشتری و {invoices.length.toLocaleString("fa-IR")} فاکتور بررسی شد</span>
      </footer>
    </section>
  );
}

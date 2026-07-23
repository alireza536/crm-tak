import { useEffect, useMemo, useState } from "react";
import {
  FaArrowTrendUp,
  FaBolt,
  FaChartSimple,
  FaCircleExclamation,
  FaCrown,
  FaDownload,
  FaFilter,
  FaMagnifyingGlass,
  FaPhoneSlash,
  FaRotate,
  FaSackDollar,
  FaUserCheck,
  FaUserClock,
  FaUsers,
} from "react-icons/fa6";
import { Link } from "react-router-dom";

import { getCustomers } from "../services/api";
import "./SalesIntelligence.css";

type Customer = {
  id: number | string;
  name?: string;
  phone?: string;
  personCode?: string | number;
  address?: string;
  totalSale?: number | string;
  invoiceCount?: number;
};

type SegmentKey = "all" | "vip" | "loyal" | "opportunity" | "inactive" | "noPhone";
type SortKey = "score" | "sale" | "invoice" | "name";

type ScoredCustomer = Customer & {
  sale: number;
  invoices: number;
  average: number;
  score: number;
  segment: Exclude<SegmentKey, "all" | "noPhone">;
};

const formatNumber = (value: number | string | undefined) =>
  Number(value || 0).toLocaleString("fa-IR");

const formatMoney = (value: number | string | undefined) =>
  `${formatNumber(value)} تومان`;

const safeCsv = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function SalesIntelligence() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<SegmentKey>("all");
  const [sort, setSort] = useState<SortKey>("score");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getCustomers();
      setCustomers(Array.isArray(result) ? result : []);
    } catch (loadError) {
      console.error("Sales intelligence loading failed:", loadError);
      setCustomers([]);
      setError("دریافت اطلاعات مشتریان با مشکل مواجه شد.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const analysis = useMemo(() => {
    const normalized = customers.map((customer) => ({
      ...customer,
      sale: Number(customer.totalSale || 0),
      invoices: Number(customer.invoiceCount || 0),
    }));

    const maxSale = Math.max(...normalized.map((item) => item.sale), 1);
    const maxInvoices = Math.max(...normalized.map((item) => item.invoices), 1);

    const scored: ScoredCustomer[] = normalized.map((customer) => {
      const saleScore = (customer.sale / maxSale) * 65;
      const frequencyScore = (customer.invoices / maxInvoices) * 35;
      const score = Math.round(Math.min(100, saleScore + frequencyScore));
      const average = customer.invoices ? customer.sale / customer.invoices : 0;

      let customerSegment: ScoredCustomer["segment"] = "opportunity";
      if (customer.invoices === 0 || customer.sale === 0) customerSegment = "inactive";
      else if (score >= 75) customerSegment = "vip";
      else if (customer.invoices >= 3) customerSegment = "loyal";

      return {
        ...customer,
        sale: customer.sale,
        invoices: customer.invoices,
        average,
        score,
        segment: customerSegment,
      };
    });

    const totalSale = scored.reduce((sum, customer) => sum + customer.sale, 0);
    const active = scored.filter((customer) => customer.invoices > 0).length;
    const vip = scored.filter((customer) => customer.segment === "vip").length;
    const loyal = scored.filter((customer) => customer.segment === "loyal").length;
    const inactive = scored.filter((customer) => customer.segment === "inactive").length;
    const noPhone = scored.filter((customer) => !customer.phone).length;
    const opportunity = scored.filter(
      (customer) => customer.segment === "opportunity",
    ).length;

    return {
      customers: scored,
      totalSale,
      active,
      vip,
      loyal,
      inactive,
      noPhone,
      opportunity,
    };
  }, [customers]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = analysis.customers.filter((customer) => {
      const matchesSearch =
        !normalizedSearch ||
        String(customer.name || "").toLowerCase().includes(normalizedSearch) ||
        String(customer.phone || "").includes(normalizedSearch) ||
        String(customer.personCode || "").includes(normalizedSearch);

      const matchesSegment =
        segment === "all" ||
        (segment === "noPhone"
          ? !customer.phone
          : customer.segment === segment);

      return matchesSearch && matchesSegment;
    });

    return [...result].sort((a, b) => {
      if (sort === "name") {
        return String(a.name || "").localeCompare(String(b.name || ""), "fa");
      }
      if (sort === "sale") return b.sale - a.sale;
      if (sort === "invoice") return b.invoices - a.invoices;
      return b.score - a.score;
    });
  }, [analysis.customers, search, segment, sort]);

  const exportCsv = () => {
    const rows = [
      ["نام مشتری", "شماره تماس", "تعداد فاکتور", "مجموع خرید", "میانگین خرید", "امتیاز", "گروه"],
      ...filtered.map((customer) => [
        customer.name || "بدون نام",
        customer.phone || "",
        customer.invoices,
        customer.sale,
        Math.round(customer.average),
        customer.score,
        customer.segment,
      ]),
    ];

    const csv = `\uFEFF${rows.map((row) => row.map(safeCsv).join(",")).join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tak-crm-sales-intelligence.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const segmentLabel = (value: ScoredCustomer["segment"]) => {
    if (value === "vip") return "VIP";
    if (value === "loyal") return "وفادار";
    if (value === "inactive") return "بدون خرید";
    return "فرصت رشد";
  };

  const cards = [
    {
      title: "مشتریان VIP",
      value: analysis.vip,
      detail: "بالاترین امتیاز خرید و تکرار",
      icon: <FaCrown />,
      tone: "gold",
      key: "vip" as SegmentKey,
    },
    {
      title: "مشتریان وفادار",
      value: analysis.loyal,
      detail: "حداقل سه فاکتور ثبت‌شده",
      icon: <FaUserCheck />,
      tone: "green",
      key: "loyal" as SegmentKey,
    },
    {
      title: "فرصت رشد",
      value: analysis.opportunity,
      detail: "خریداران قابل تبدیل به وفادار",
      icon: <FaArrowTrendUp />,
      tone: "blue",
      key: "opportunity" as SegmentKey,
    },
    {
      title: "بدون خرید",
      value: analysis.inactive,
      detail: "مشتری بدون فاکتور یا مبلغ خرید",
      icon: <FaUserClock />,
      tone: "red",
      key: "inactive" as SegmentKey,
    },
  ];

  return (
    <section className="salesIntelPage" dir="rtl">
      <header className="salesIntelHero">
        <div>
          <span className="salesIntelEyebrow">
            <FaBolt /> تحلیل خودکار داده‌های CRM
          </span>
          <h1>هوش فروش و بخش‌بندی مشتریان</h1>
          <p>
            مشتریان باارزش، فرصت‌های رشد و اطلاعات ناقص را براساس مبلغ خرید و
            تعداد فاکتور شناسایی کنید.
          </p>
        </div>

        <div className="salesIntelHeroStats">
          <span>ارزش کل خرید مشتریان</span>
          <strong>{loading ? "—" : formatMoney(analysis.totalSale)}</strong>
          <small>{formatNumber(analysis.active)} مشتری دارای سابقه خرید</small>
        </div>
      </header>

      <div className="salesIntelNotice">
        <FaCircleExclamation />
        <span>
          امتیاز فعلی از ترکیب ۶۵٪ مبلغ خرید و ۳۵٪ تعداد فاکتور محاسبه می‌شود.
          برای تحلیل زمان آخرین خرید، تاریخ فاکتور باید در API مشتریان اضافه شود.
        </span>
      </div>

      <section className="salesIntelCards">
        {cards.map((card) => (
          <button
            type="button"
            key={card.title}
            className={`salesIntelMetric ${card.tone} ${segment === card.key ? "active" : ""}`}
            onClick={() => setSegment(segment === card.key ? "all" : card.key)}
          >
            <span className="salesIntelMetricIcon">{card.icon}</span>
            <div>
              <small>{card.title}</small>
              <strong>{loading ? "—" : formatNumber(card.value)}</strong>
              <span>{card.detail}</span>
            </div>
          </button>
        ))}
      </section>

      <section className="salesIntelInsights">
        <article>
          <span className="insightIcon green"><FaSackDollar /></span>
          <div>
            <small>میانگین ارزش هر مشتری فعال</small>
            <strong>
              {loading || !analysis.active
                ? "—"
                : formatMoney(analysis.totalSale / analysis.active)}
            </strong>
          </div>
        </article>

        <article>
          <span className="insightIcon purple"><FaChartSimple /></span>
          <div>
            <small>نرخ مشتری فعال</small>
            <strong>
              {loading || !customers.length
                ? "—"
                : `${formatNumber(Math.round((analysis.active / customers.length) * 100))}٪`}
            </strong>
          </div>
        </article>

        <button
          type="button"
          className="salesIntelMissingPhone"
          onClick={() => setSegment(segment === "noPhone" ? "all" : "noPhone")}
        >
          <span className="insightIcon red"><FaPhoneSlash /></span>
          <div>
            <small>شماره تماس ناقص</small>
            <strong>{loading ? "—" : formatNumber(analysis.noPhone)}</strong>
          </div>
        </button>
      </section>

      <section className="salesIntelTablePanel">
        <div className="salesIntelToolbar">
          <label className="salesIntelSearch">
            <FaMagnifyingGlass />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجو با نام، شماره تماس یا کد شخص..."
            />
          </label>

          <div className="salesIntelActions">
            <label className="salesIntelSelect">
              <FaFilter />
              <select value={segment} onChange={(event) => setSegment(event.target.value as SegmentKey)}>
                <option value="all">همه مشتریان</option>
                <option value="vip">VIP</option>
                <option value="loyal">وفادار</option>
                <option value="opportunity">فرصت رشد</option>
                <option value="inactive">بدون خرید</option>
                <option value="noPhone">شماره ناقص</option>
              </select>
            </label>

            <select className="salesIntelSort" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="score">بیشترین امتیاز</option>
              <option value="sale">بیشترین خرید</option>
              <option value="invoice">بیشترین فاکتور</option>
              <option value="name">نام مشتری</option>
            </select>

            <button type="button" className="salesIntelIconButton" onClick={load} title="بروزرسانی">
              <FaRotate />
            </button>

            <button type="button" className="salesIntelExport" onClick={exportCsv} disabled={!filtered.length}>
              <FaDownload /> خروجی CSV
            </button>
          </div>
        </div>

        <div className="salesIntelTableTitle">
          <div>
            <span>نتیجه تحلیل</span>
            <strong>{formatNumber(filtered.length)} مشتری</strong>
          </div>
          {(segment !== "all" || search) && (
            <button type="button" onClick={() => { setSegment("all"); setSearch(""); }}>
              پاک‌کردن فیلترها
            </button>
          )}
        </div>

        {loading ? (
          <div className="salesIntelSkeletons">
            {Array.from({ length: 6 }).map((_, index) => <span key={index} />)}
          </div>
        ) : error ? (
          <div className="salesIntelEmpty error">
            <FaCircleExclamation />
            <strong>{error}</strong>
            <button type="button" onClick={load}>تلاش دوباره</button>
          </div>
        ) : !filtered.length ? (
          <div className="salesIntelEmpty">
            <FaUsers />
            <strong>مشتری مطابق این فیلتر پیدا نشد</strong>
            <span>فیلترها یا عبارت جستجو را تغییر دهید.</span>
          </div>
        ) : (
          <div className="salesIntelTableWrap">
            <table className="salesIntelTable">
              <thead>
                <tr>
                  <th>مشتری</th>
                  <th>گروه</th>
                  <th>تعداد فاکتور</th>
                  <th>مجموع خرید</th>
                  <th>میانگین خرید</th>
                  <th>امتیاز</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="salesIntelCustomer">
                        <span>{String(customer.name || "م").trim().charAt(0)}</span>
                        <div>
                          <strong>{customer.name || "مشتری بدون نام"}</strong>
                          <small>{customer.phone || "شماره تماس ثبت نشده"}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className={`salesIntelBadge ${customer.segment}`}>{segmentLabel(customer.segment)}</span></td>
                    <td>{formatNumber(customer.invoices)}</td>
                    <td><strong>{formatMoney(customer.sale)}</strong></td>
                    <td>{formatMoney(Math.round(customer.average))}</td>
                    <td>
                      <div className="salesIntelScore">
                        <span><i style={{ width: `${customer.score}%` }} /></span>
                        <strong>{formatNumber(customer.score)}</strong>
                      </div>
                    </td>
                    <td><Link className="salesIntelProfileLink" to={`/customer/${customer.id}`}>مشاهده پروفایل</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

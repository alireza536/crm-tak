import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRotateRight,
  FaBullhorn,
  FaCheck,
  FaCircleExclamation,
  FaCopy,
  FaCrown,
  FaDownload,
  FaFilter,
  FaMagnifyingGlass,
  FaMessage,
  FaPaperPlane,
  FaPhone,
  FaPlus,
  FaTrash,
  FaUsers,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { Link } from "react-router-dom";

import { getCustomers } from "../services/api";
import "./CampaignCenter.css";

type Customer = {
  id: number | string;
  name?: string;
  phone?: string;
  personCode?: string | number;
  totalSale?: number | string;
  invoiceCount?: number;
};

type Segment = "all" | "vip" | "loyal" | "opportunity" | "inactive" | "phone";
type CampaignStatus = "draft" | "ready" | "completed";

type SavedCampaign = {
  id: string;
  name: string;
  segment: Segment;
  message: string;
  recipients: number;
  status: CampaignStatus;
  createdAt: string;
};

type PreparedCustomer = Customer & {
  sale: number;
  invoices: number;
  score: number;
  segment: Exclude<Segment, "all" | "phone">;
};

const storageKey = "tak-crm-campaigns-v1";

const formatNumber = (value: number | string | undefined) =>
  Number(value || 0).toLocaleString("fa-IR");

const segmentLabels: Record<Segment, string> = {
  all: "همه مشتریان",
  vip: "مشتریان VIP",
  loyal: "مشتریان وفادار",
  opportunity: "فرصت‌های رشد",
  inactive: "بدون خرید",
  phone: "دارای شماره معتبر",
};

const templates = [
  {
    title: "معرفی محصول جدید",
    text: "سلام {name} عزیز، محصولات جدید TAK موجود شده‌اند. برای اطلاع از قیمت همکاری و ثبت سفارش با ما در تماس باشید.",
  },
  {
    title: "فعال‌سازی مشتری غیرفعال",
    text: "سلام {name} عزیز، مدتی است از شما خبری نداریم. برای سفارش جدید و دریافت شرایط ویژه فروش با مجموعه TAK تماس بگیرید.",
  },
  {
    title: "پیشنهاد ویژه VIP",
    text: "سلام {name} عزیز، به‌عنوان یکی از مشتریان ویژه TAK، شرایط اختصاصی خرید برای شما فعال شده است. برای دریافت جزئیات پاسخ دهید.",
  },
];

function loadCampaigns(): SavedCampaign[] {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function CampaignCenter() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<Segment>("phone");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState("کمپین فروش جدید");
  const [message, setMessage] = useState(templates[0].text);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>(loadCampaigns);
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getCustomers();
      setCustomers(Array.isArray(result) ? result : []);
    } catch (loadError) {
      console.error("Campaign customers loading failed:", loadError);
      setError("دریافت اطلاعات مشتریان با مشکل مواجه شد.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const prepared = useMemo<PreparedCustomer[]>(() => {
    const normalized = customers.map((customer) => ({
      ...customer,
      sale: Number(customer.totalSale || 0),
      invoices: Number(customer.invoiceCount || 0),
    }));
    const maxSale = Math.max(...normalized.map((item) => item.sale), 1);
    const maxInvoices = Math.max(...normalized.map((item) => item.invoices), 1);

    return normalized.map((customer) => {
      const score = Math.round(
        Math.min(100, (customer.sale / maxSale) * 65 + (customer.invoices / maxInvoices) * 35),
      );
      let customerSegment: PreparedCustomer["segment"] = "opportunity";
      if (!customer.sale || !customer.invoices) customerSegment = "inactive";
      else if (score >= 75) customerSegment = "vip";
      else if (customer.invoices >= 3) customerSegment = "loyal";

      return { ...customer, score, segment: customerSegment };
    });
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prepared.filter((customer) => {
      const matchesSearch =
        !q ||
        String(customer.name || "").toLowerCase().includes(q) ||
        String(customer.phone || "").includes(q) ||
        String(customer.personCode || "").includes(q);
      const hasPhone = String(customer.phone || "").replace(/\D/g, "").length >= 10;
      const matchesSegment =
        segment === "all" ||
        (segment === "phone" ? hasPhone : customer.segment === segment);
      return matchesSearch && matchesSegment;
    });
  }, [prepared, search, segment]);

  useEffect(() => {
    setSelectedIds([]);
  }, [segment]);

  const selectedCustomers = useMemo(
    () => prepared.filter((customer) => selectedIds.includes(String(customer.id))),
    [prepared, selectedIds],
  );

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((customer) => selectedIds.includes(String(customer.id)));

  const toggleAll = () => {
    if (allVisibleSelected) {
      const visible = new Set(filtered.map((customer) => String(customer.id)));
      setSelectedIds((current) => current.filter((id) => !visible.has(id)));
    } else {
      setSelectedIds((current) => [
        ...new Set([...current, ...filtered.map((customer) => String(customer.id))]),
      ]);
    }
  };

  const toggleCustomer = (id: number | string) => {
    const key = String(id);
    setSelectedIds((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  const saveCampaign = (status: CampaignStatus) => {
    if (!campaignName.trim() || !message.trim()) {
      setNotice("نام کمپین و متن پیام نباید خالی باشد.");
      return;
    }
    const campaign: SavedCampaign = {
      id: `${Date.now()}`,
      name: campaignName.trim(),
      segment,
      message: message.trim(),
      recipients: selectedCustomers.length,
      status,
      createdAt: new Date().toISOString(),
    };
    const next = [campaign, ...savedCampaigns].slice(0, 12);
    setSavedCampaigns(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setNotice(status === "draft" ? "کمپین به‌صورت پیش‌نویس ذخیره شد." : "کمپین آماده اجرا ثبت شد.");
  };

  const deleteCampaign = (id: string) => {
    const next = savedCampaigns.filter((item) => item.id !== id);
    setSavedCampaigns(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
    setNotice("متن پیام کپی شد.");
  };

  const exportRecipients = () => {
    const rows = [
      ["نام مشتری", "شماره تماس", "کد مشتری", "مجموع خرید", "تعداد فاکتور"],
      ...selectedCustomers.map((customer) => [
        customer.name || "بدون نام",
        customer.phone || "",
        customer.personCode || "",
        customer.sale,
        customer.invoices,
      ]),
    ];
    const csv = `\uFEFF${rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tak-crm-campaign-recipients.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const personalizedPreview = message.replace(
    /\{name\}/g,
    selectedCustomers[0]?.name || "مشتری",
  );

  const validPhoneCount = selectedCustomers.filter(
    (customer) => String(customer.phone || "").replace(/\D/g, "").length >= 10,
  ).length;

  return (
    <section className="campaignPage" dir="rtl">
      <header className="campaignHero">
        <div>
          <span className="campaignEyebrow"><FaBullhorn /> موتور کمپین فروش TAK</span>
          <h1>کمپین هدفمند مشتریان</h1>
          <p>گروه مناسب را انتخاب کنید، مخاطبان را بررسی کنید و پیام کمپین را برای ارسال آماده نگه دارید.</p>
        </div>
        <div className="campaignHeroStats">
          <div><span>مخاطب انتخاب‌شده</span><strong>{formatNumber(selectedCustomers.length)}</strong></div>
          <div><span>شماره معتبر</span><strong>{formatNumber(validPhoneCount)}</strong></div>
          <div><span>کمپین ذخیره‌شده</span><strong>{formatNumber(savedCampaigns.length)}</strong></div>
        </div>
      </header>

      {notice && (
        <button type="button" className="campaignNotice" onClick={() => setNotice("")}>
          <FaCheck /> {notice}
        </button>
      )}

      <div className="campaignGrid">
        <section className="campaignComposer">
          <div className="campaignSectionTitle">
            <div><FaWandMagicSparkles /><span><strong>ساخت کمپین</strong><small>نام، گروه هدف و متن پیام</small></span></div>
            <button type="button" className="campaignIconButton" onClick={load} aria-label="بروزرسانی"><FaArrowRotateRight /></button>
          </div>

          <label className="campaignField">
            <span>نام کمپین</span>
            <input value={campaignName} onChange={(event) => setCampaignName(event.target.value)} />
          </label>

          <div className="campaignField">
            <span>گروه هدف</span>
            <div className="campaignSegments">
              {(Object.keys(segmentLabels) as Segment[]).map((key) => (
                <button key={key} type="button" className={segment === key ? "active" : ""} onClick={() => setSegment(key)}>
                  {segmentLabels[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="campaignTemplates">
            {templates.map((template) => (
              <button key={template.title} type="button" onClick={() => setMessage(template.text)}>
                <FaMessage /><span><strong>{template.title}</strong><small>استفاده از متن آماده</small></span>
              </button>
            ))}
          </div>

          <label className="campaignField campaignMessageField">
            <span>متن پیام <small>{formatNumber(message.length)} کاراکتر</small></span>
            <textarea rows={6} value={message} onChange={(event) => setMessage(event.target.value)} />
            <em>برای درج نام مشتری از <b>{"{name}"}</b> استفاده کن.</em>
          </label>

          <div className="campaignPreview">
            <span>پیش‌نمایش پیام</span>
            <p>{personalizedPreview || "متن پیام اینجا نمایش داده می‌شود."}</p>
            <small>نمایش با نام اولین مخاطب انتخاب‌شده</small>
          </div>

          <div className="campaignActions">
            <button type="button" className="secondary" onClick={copyMessage}><FaCopy /> کپی متن</button>
            <button type="button" className="secondary" onClick={() => saveCampaign("draft")}><FaPlus /> ذخیره پیش‌نویس</button>
            <button type="button" className="primary" onClick={() => saveCampaign("ready")}><FaPaperPlane /> آماده‌سازی کمپین</button>
          </div>
          <div className="campaignSafety"><FaCircleExclamation /> این مرحله پیامک را مستقیماً ارسال نمی‌کند؛ کمپین را برای بررسی و انتقال به صفحه پیامک آماده می‌سازد.</div>
        </section>

        <section className="campaignAudience">
          <div className="campaignSectionTitle">
            <div><FaUsers /><span><strong>انتخاب مخاطبان</strong><small>{formatNumber(filtered.length)} نتیجه در گروه فعلی</small></span></div>
            <button type="button" className="campaignExport" onClick={exportRecipients} disabled={!selectedCustomers.length}><FaDownload /> خروجی CSV</button>
          </div>

          <div className="campaignToolbar">
            <label><FaMagnifyingGlass /><input placeholder="جستجو نام، موبایل یا کد مشتری" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <span><FaFilter /> {segmentLabels[segment]}</span>
          </div>

          {loading ? (
            <div className="campaignState">در حال دریافت مشتریان...</div>
          ) : error ? (
            <div className="campaignState error"><FaCircleExclamation /><p>{error}</p><button type="button" onClick={load}>تلاش دوباره</button></div>
          ) : filtered.length === 0 ? (
            <div className="campaignState"><FaUsers /><p>مشتری مطابق این فیلتر پیدا نشد.</p></div>
          ) : (
            <div className="campaignTableWrap">
              <table className="campaignTable">
                <thead><tr><th><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} /></th><th>مشتری</th><th>تماس</th><th>خرید</th><th>گروه</th></tr></thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr key={customer.id} className={selectedIds.includes(String(customer.id)) ? "selected" : ""}>
                      <td><input type="checkbox" checked={selectedIds.includes(String(customer.id))} onChange={() => toggleCustomer(customer.id)} /></td>
                      <td><Link to={`/customer/${customer.id}`}><strong>{customer.name || "بدون نام"}</strong><small>کد {customer.personCode || "—"}</small></Link></td>
                      <td><span className={customer.phone ? "phone valid" : "phone"}><FaPhone /> {customer.phone || "ثبت نشده"}</span></td>
                      <td><strong>{formatNumber(customer.sale)}</strong><small>{formatNumber(customer.invoices)} فاکتور</small></td>
                      <td><span className={`campaignBadge ${customer.segment}`}>{customer.segment === "vip" && <FaCrown />}{segmentLabels[customer.segment]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="campaignHistory">
        <div className="campaignSectionTitle">
          <div><FaBullhorn /><span><strong>کمپین‌های اخیر</strong><small>ذخیره‌شده روی همین مرورگر</small></span></div>
        </div>
        {savedCampaigns.length === 0 ? (
          <div className="campaignEmptyHistory">هنوز کمپینی ذخیره نشده است.</div>
        ) : (
          <div className="campaignHistoryGrid">
            {savedCampaigns.map((campaign) => (
              <article key={campaign.id}>
                <div><span className={`campaignStatus ${campaign.status}`}>{campaign.status === "draft" ? "پیش‌نویس" : campaign.status === "ready" ? "آماده اجرا" : "تکمیل‌شده"}</span><button type="button" onClick={() => deleteCampaign(campaign.id)} aria-label="حذف"><FaTrash /></button></div>
                <h3>{campaign.name}</h3>
                <p>{campaign.message}</p>
                <footer><span><FaUsers /> {formatNumber(campaign.recipients)} مخاطب</span><span>{segmentLabels[campaign.segment]}</span><time>{new Date(campaign.createdAt).toLocaleDateString("fa-IR")}</time></footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

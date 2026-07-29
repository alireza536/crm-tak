import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaBagShopping,
  FaBolt,
  FaCalendarDay,
  FaChartLine,
  FaChevronLeft,
  FaCircleCheck,
  FaClockRotateLeft,
  FaFileInvoice,
  FaGift,
  FaLocationDot,
  FaMoneyBillTrendUp,
  FaNoteSticky,
  FaPhone,
  FaPrint,
  FaRegCopy,
  FaRotate,
  FaShop,
  FaStar,
  FaUserCheck,
  FaUserClock,
} from "react-icons/fa6";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getCustomerProfile } from "../services/api";
import "./CustomerProfile.css";

type Invoice = {
  id?: number | string;
  factor?: number | string;
  createdAt?: string;
  date?: string;
  sale?: number | string;
  discount?: number | string;
  total?: number | string;
};

type CustomerProfileData = {
  id?: number | string;
  name?: string;
  phone?: string;
  address?: string;
  personCode?: number | string;
  totalSale?: number | string;
  totalDiscount?: number | string;
  invoiceCount?: number;
  lastInvoice?: string;
  invoices?: Invoice[];
};

type CustomerLevel = {
  title: string;
  className: "vip" | "gold" | "active" | "new";
  description: string;
};

const money = (value: number | string | undefined) =>
  Math.round(Number(value || 0)).toLocaleString("fa-IR");

const number = (value: number | string | undefined) =>
  Number(value || 0).toLocaleString("fa-IR");

const persianDate = (value?: string) => {
  if (!value) return "ثبت نشده";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ثبت نشده";
  return date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const relativeDate = (value?: string) => {
  if (!value) return "بدون سابقه خرید";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "بدون سابقه خرید";

  const days = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (days === 0) return "امروز";
  if (days === 1) return "دیروز";
  if (days < 30) return `${number(days)} روز قبل`;
  if (days < 365) return `${number(Math.floor(days / 30))} ماه قبل`;
  return `${number(Math.floor(days / 365))} سال قبل`;
};

const getCustomerLevel = (totalSale: number): CustomerLevel => {
  if (totalSale >= 100_000_000) {
    return {
      title: "مشتری VIP",
      className: "vip",
      description: "جزو مشتریان با ارزش بسیار بالا",
    };
  }
  if (totalSale >= 30_000_000) {
    return {
      title: "مشتری طلایی",
      className: "gold",
      description: "مشتری وفادار با خرید مستمر",
    };
  }
  if (totalSale > 0) {
    return {
      title: "مشتری فعال",
      className: "active",
      description: "دارای سابقه خرید ثبت‌شده",
    };
  }
  return {
    title: "مشتری جدید",
    className: "new",
    description: "هنوز خریدی برای این مشتری ثبت نشده",
  };
};

const getInvoiceAmount = (invoice: Invoice) =>
  Number(invoice.sale ?? invoice.total ?? 0);

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");
      const data = await getCustomerProfile(Number(id));
      setCustomer(data);
    } catch (err) {
      console.error("Customer profile loading failed:", err);
      setError("اطلاعات مشتری دریافت نشد. اتصال اینترنت یا سرور را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const analytics = useMemo(() => {
    const invoices = Array.isArray(customer?.invoices) ? customer.invoices : [];
    const sortedInvoices = [...invoices].sort((a, b) => {
      const first = new Date(a.createdAt || a.date || 0).getTime();
      const second = new Date(b.createdAt || b.date || 0).getTime();
      return second - first;
    });

    const totalSale = Number(customer?.totalSale || 0);
    const totalDiscount = Number(customer?.totalDiscount || 0);
    const invoiceCount = Number(customer?.invoiceCount ?? invoices.length);
    const averagePurchase = invoiceCount ? totalSale / invoiceCount : 0;
    const lastInvoice = customer?.lastInvoice || sortedInvoices[0]?.createdAt || sortedInvoices[0]?.date;
    const level = getCustomerLevel(totalSale);

    const monthlyMap = new Map<string, { label: string; amount: number }>();
    sortedInvoices.forEach((invoice) => {
      const date = new Date(invoice.createdAt || invoice.date || "");
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date.toLocaleDateString("fa-IR", { month: "short" });
      const current = monthlyMap.get(key) || { label, amount: 0 };
      current.amount += getInvoiceAmount(invoice);
      monthlyMap.set(key, current);
    });

    const monthlySales = Array.from(monthlyMap.values()).reverse().slice(-6);
    const maxMonthlySale = Math.max(...monthlySales.map((item) => item.amount), 1);

    const daysSinceLastPurchase = lastInvoice
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(lastInvoice).getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
      : null;

    let healthLabel = "جدید";
    let healthClass = "new";
    let healthDescription = "برای شناخت بهتر مشتری، اولین خرید را ثبت کنید.";

    if (daysSinceLastPurchase !== null) {
      if (daysSinceLastPurchase <= 30) {
        healthLabel = "فعال";
        healthClass = "healthy";
        healthDescription = "مشتری اخیراً خرید داشته و ارتباط او با مجموعه خوب است.";
      } else if (daysSinceLastPurchase <= 60) {
        healthLabel = "نیازمند پیگیری";
        healthClass = "warning";
        healthDescription = "زمان مناسبی برای تماس یا ارسال پیشنهاد فروش است.";
      } else {
        healthLabel = "در خطر ریزش";
        healthClass = "danger";
        healthDescription = "مدت زیادی از آخرین خرید گذشته؛ پیگیری این مشتری اولویت دارد.";
      }
    }

    return {
      invoices: sortedInvoices,
      totalSale,
      totalDiscount,
      invoiceCount,
      averagePurchase,
      lastInvoice,
      level,
      monthlySales,
      maxMonthlySale,
      daysSinceLastPurchase,
      healthLabel,
      healthClass,
      healthDescription,
    };
  }, [customer]);

  const copyPhone = async () => {
    if (!customer?.phone) return;
    try {
      await navigator.clipboard.writeText(customer.phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <section className="customerProfilePage" dir="rtl">
        <div className="profileSkeletonHero" />
        <div className="profileSkeletonGrid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="profileSkeletonCard" key={index} />
          ))}
        </div>
        <div className="profileSkeletonBody" />
      </section>
    );
  }

  if (error || !customer) {
    return (
      <section className="customerProfilePage" dir="rtl">
        <div className="profileErrorState">
          <span><FaUserClock /></span>
          <h2>پروفایل مشتری در دسترس نیست</h2>
          <p>{error || "اطلاعاتی برای این مشتری پیدا نشد."}</p>
          <div>
            <button type="button" onClick={load}><FaRotate /> تلاش دوباره</button>
            <Link to="/customers">بازگشت به مشتریان</Link>
          </div>
        </div>
      </section>
    );
  }

  const firstCharacter = String(customer.name || "?").trim().charAt(0) || "?";
  const phoneHref = customer.phone ? `tel:${customer.phone}` : undefined;
  const smsHref = customer.phone ? `sms:${customer.phone}` : undefined;

  return (
    <section className="customerProfilePage" dir="rtl">
      <div className="profileBreadcrumb">
        <button type="button" onClick={() => navigate(-1)}>
          <FaArrowRight />
          بازگشت
        </button>
        <div>
          <Link to="/customers">مشتریان</Link>
          <FaChevronLeft />
          <span>{customer.name || "پروفایل مشتری"}</span>
        </div>
      </div>

      <header className="customerProfileHero">
        <div className="profileHeroGlow" />

        <div className="profileHeroIdentity">
          <div className="profileAvatarWrap">
            <span className="profileAvatar">{firstCharacter}</span>
            <span className="profileOnlineDot" title="پروفایل فعال" />
          </div>

          <div className="profileHeroText">
            <div className="profileNameRow">
              <h1>{customer.name || "بدون نام"}</h1>
              <span className={`profileLevelBadge ${analytics.level.className}`}>
                <FaStar />
                {analytics.level.title}
              </span>
            </div>
            <p>{analytics.level.description}</p>

            <div className="profileContactRow">
              <button type="button" onClick={copyPhone} disabled={!customer.phone}>
                <FaPhone />
                {customer.phone || "شماره تماس ثبت نشده"}
                {customer.phone && <FaRegCopy />}
                {copied && <small>کپی شد</small>}
              </button>
              <span>
                <FaLocationDot />
                {customer.address || "آدرس ثبت نشده"}
              </span>
              <span>
                <FaUserCheck />
                کد شخص: {customer.personCode || "ثبت نشده"}
              </span>
            </div>
          </div>
        </div>

        <div className="profileHeroActions">
          <a className={!phoneHref ? "disabled" : ""} href={phoneHref}>
            <FaPhone /> تماس
          </a>
          <a className={!smsHref ? "disabled" : ""} href={smsHref}>
            <FaBolt /> پیامک
          </a>
          <Link to="/upload" className="primary">
            <FaFileInvoice /> ثبت فاکتور
          </Link>
        </div>
      </header>

      <div className="profileKpiGrid">
        <article className="profileKpiCard sale">
          <span className="profileKpiIcon"><FaMoneyBillTrendUp /></span>
          <div>
            <small>مجموع خرید</small>
            <strong>{money(analytics.totalSale)}</strong>
            <span>ریال</span>
          </div>
          <em><FaChartLine /> ارزش کل مشتری</em>
        </article>

        <article className="profileKpiCard invoice">
          <span className="profileKpiIcon"><FaFileInvoice /></span>
          <div>
            <small>تعداد فاکتور</small>
            <strong>{number(analytics.invoiceCount)}</strong>
            <span>فاکتور</span>
          </div>
          <em><FaCircleCheck /> سابقه ثبت‌شده</em>
        </article>

        <article className="profileKpiCard average">
          <span className="profileKpiIcon"><FaBagShopping /></span>
          <div>
            <small>میانگین هر خرید</small>
            <strong>{money(analytics.averagePurchase)}</strong>
            <span>ریال</span>
          </div>
          <em><FaShop /> میانگین سبد خرید</em>
        </article>

        <article className="profileKpiCard recent">
          <span className="profileKpiIcon"><FaCalendarDay /></span>
          <div>
            <small>آخرین خرید</small>
            <strong className="dateValue">{relativeDate(analytics.lastInvoice)}</strong>
            <span>{persianDate(analytics.lastInvoice)}</span>
          </div>
          <em><FaClockRotateLeft /> آخرین فعالیت مالی</em>
        </article>
      </div>

      <div className="profileMainGrid">
        <div className="profileMainColumn">
          <section className="profilePanel salesOverviewPanel">
            <div className="profilePanelHeader">
              <div>
                <span className="panelEyebrow">روند مالی</span>
                <h2>نمودار خرید مشتری</h2>
                <p>مقایسه ارزش خرید در ماه‌های دارای فاکتور</p>
              </div>
              <div className="chartTotal">
                <small>فروش ثبت‌شده</small>
                <strong>{money(analytics.totalSale)}</strong>
                <span>ریال</span>
              </div>
            </div>

            {analytics.monthlySales.length ? (
              <div className="profileBarChart" aria-label="نمودار فروش ماهانه">
                {analytics.monthlySales.map((item, index) => (
                  <div className="profileBarItem" key={`${item.label}-${index}`}>
                    <div className="profileBarValue">{money(item.amount)}</div>
                    <div className="profileBarTrack">
                      <div
                        className="profileBar"
                        style={{
                          height: `${Math.max(
                            12,
                            Math.round((item.amount / analytics.maxMonthlySale) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="profileEmptyChart">
                <FaChartLine />
                <strong>هنوز داده کافی برای نمودار وجود ندارد</strong>
                <span>پس از ثبت فاکتور، روند خرید در این قسمت نمایش داده می‌شود.</span>
              </div>
            )}
          </section>

          <section className="profilePanel invoiceHistoryPanel">
            <div className="profilePanelHeader compact">
              <div>
                <span className="panelEyebrow">سوابق مالی</span>
                <h2>فاکتورهای مشتری</h2>
                <p>{number(analytics.invoices.length)} فاکتور در پروفایل موجود است</p>
              </div>
              <button type="button" onClick={() => window.print()}>
                <FaPrint /> چاپ گزارش
              </button>
            </div>

            {analytics.invoices.length ? (
              <div className="profileInvoiceTableWrap">
                <table className="profileInvoiceTable">
                  <thead>
                    <tr>
                      <th>شماره فاکتور</th>
                      <th>تاریخ</th>
                      <th>مبلغ فروش</th>
                      <th>تخفیف</th>
                      <th>مبلغ پس از تخفیف</th>
                      <th>وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.invoices.map((item, index) => {
                      const sale = getInvoiceAmount(item);
                      const discount = Number(item.discount || 0);
                      return (
                        <tr key={item.id || `${item.factor}-${index}`}>
                          <td><strong>#{item.factor || item.id || index + 1}</strong></td>
                          <td>{persianDate(item.createdAt || item.date)}</td>
                          <td>{money(sale)} <small>ریال</small></td>
                          <td className="discountCell">{money(discount)}</td>
                          <td><strong>{money(Math.max(0, sale - discount))}</strong></td>
                          <td><span className="invoiceStatus"><FaCircleCheck /> ثبت‌شده</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="profileEmptyInvoices">
                <FaFileInvoice />
                <h3>فاکتوری برای این مشتری ثبت نشده</h3>
                <p>با ثبت اولین فاکتور، سابقه مالی مشتری در این بخش ساخته می‌شود.</p>
                <Link to="/upload">ثبت اولین فاکتور</Link>
              </div>
            )}
          </section>
        </div>

        <aside className="profileSideColumn">
          <section className={`customerHealthCard ${analytics.healthClass}`}>
            <div className="healthHeader">
              <span><FaUserCheck /></span>
              <div>
                <small>وضعیت ارتباط</small>
                <strong>{analytics.healthLabel}</strong>
              </div>
            </div>
            <div className="healthMeter"><span /></div>
            <p>{analytics.healthDescription}</p>
            {analytics.daysSinceLastPurchase !== null && (
              <em>{number(analytics.daysSinceLastPurchase)} روز از آخرین خرید گذشته است</em>
            )}
          </section>

          <section className="profilePanel smartSuggestionPanel">
            <div className="smartSuggestionIcon"><FaGift /></div>
            <span className="panelEyebrow">پیشنهاد هوشمند فروش</span>
            <h2>
              {analytics.daysSinceLastPurchase !== null && analytics.daysSinceLastPurchase > 45
                ? "زمان مناسبی برای فعال‌سازی مجدد مشتری است"
                : "فرصت افزایش ارزش سبد خرید"}
            </h2>
            <p>
              {analytics.invoiceCount > 1
                ? `این مشتری ${number(analytics.invoiceCount)} خرید ثبت‌شده دارد. یک پیشنهاد مکمل یا تخفیف اختصاصی می‌تواند احتمال خرید بعدی را افزایش دهد.`
                : "پس از ثبت خریدهای بیشتر، پیشنهادها بر اساس الگوی واقعی مشتری دقیق‌تر خواهند شد."}
            </p>
            <a href={smsHref} className={!smsHref ? "disabled" : ""}>
              <FaBolt /> ارسال پیشنهاد با پیامک
            </a>
          </section>

          <section className="profilePanel activityPanel">
            <div className="profilePanelHeader compact">
              <div>
                <span className="panelEyebrow">خط زمانی</span>
                <h2>فعالیت‌های اخیر</h2>
              </div>
            </div>

            <div className="activityTimeline">
              {analytics.invoices.slice(0, 3).map((invoice, index) => (
                <div className="activityItem" key={invoice.id || index}>
                  <span><FaFileInvoice /></span>
                  <div>
                    <strong>فاکتور #{invoice.factor || invoice.id || index + 1} ثبت شد</strong>
                    <p>به مبلغ {money(getInvoiceAmount(invoice))} ریال</p>
                    <small>{relativeDate(invoice.createdAt || invoice.date)}</small>
                  </div>
                </div>
              ))}

              <div className="activityItem first">
                <span><FaUserCheck /></span>
                <div>
                  <strong>پروفایل مشتری ایجاد شد</strong>
                  <p>اطلاعات پایه مشتری در CRM ثبت شده است</p>
                  <small>شروع ارتباط</small>
                </div>
              </div>
            </div>
          </section>

          <section className="profilePanel quickInfoPanel">
            <div className="profilePanelHeader compact">
              <div>
                <span className="panelEyebrow">خلاصه حساب</span>
                <h2>اطلاعات تکمیلی</h2>
              </div>
            </div>
            <dl>
              <div><dt>جمع تخفیف‌ها</dt><dd>{money(analytics.totalDiscount)} ریال</dd></div>
              <div><dt>کد مشتری</dt><dd>{customer.personCode || "ثبت نشده"}</dd></div>
              <div><dt>سطح مشتری</dt><dd>{analytics.level.title}</dd></div>
              <div><dt>آخرین بروزرسانی</dt><dd>همین حالا</dd></div>
            </dl>
            <button type="button" onClick={() => window.print()}>
              <FaNoteSticky /> ذخیره یا چاپ گزارش مشتری
            </button>
          </section>
        </aside>
      </div>
    </section>
  );
}

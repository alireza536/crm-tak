import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRotateRight,
  FaChevronDown,
  FaCircleCheck,
  FaDownload,
  FaEye,
  FaFileInvoice,
  FaFilter,
  FaMagnifyingGlass,
  FaPlus,
  FaReceipt,
  FaTag,
  FaUsers,
  FaWallet,
} from "react-icons/fa6";

import "./Invoices.css";
import { getInvoices } from "../services/api";

type InvoiceRow = {
  id?: string | number;
  factor?: string | number;
  sale?: string | number;
  discount?: string | number;
  createdAt?: string;
  status?: string;
  user?: {
    id?: string | number;
    name?: string;
    phone?: string;
  };
};

const money = (value: unknown) =>
  Number(value || 0).toLocaleString("fa-IR");

const normalize = (value: unknown) =>
  String(value ?? "").toLocaleLowerCase("fa-IR").trim();

export default function Invoices() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await getInvoices();
      setRows(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error(loadError);
      setError("دریافت اطلاعات فاکتورها با مشکل روبه‌رو شد.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredRows = useMemo(() => {
    const query = normalize(search);
    const result = rows.filter((item) => {
      const searchable = [
        item.user?.name,
        item.user?.phone,
        item.factor,
      ]
        .map(normalize)
        .join(" ");

      return searchable.includes(query);
    });

    return [...result].sort((a, b) => {
      if (sort === "sale-high") return Number(b.sale || 0) - Number(a.sale || 0);
      if (sort === "sale-low") return Number(a.sale || 0) - Number(b.sale || 0);
      if (sort === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [rows, search, sort]);

  const statistics = useMemo(() => {
    const totalSale = filteredRows.reduce(
      (sum, item) => sum + Number(item.sale || 0),
      0,
    );
    const totalDiscount = filteredRows.reduce(
      (sum, item) => sum + Number(item.discount || 0),
      0,
    );
    const customers = new Set(
      filteredRows.map((item) => item.user?.id || item.user?.phone || item.user?.name),
    ).size;
    const averageSale = filteredRows.length ? totalSale / filteredRows.length : 0;

    return { totalSale, totalDiscount, customers, averageSale };
  }, [filteredRows]);

  return (
    <main className="invoicePage" dir="rtl">
      <section className="invoiceHero">
        <div className="invoiceHeroContent">
          <span className="invoiceEyebrow">
            <FaFileInvoice /> مدیریت مالی و فروش
          </span>
          <h1>مرکز فاکتورها</h1>
          <p>تمام فاکتورها، مشتریان و وضعیت فروش را یکجا مدیریت کنید.</p>
        </div>

        <div className="invoiceHeroActions">
          <button type="button" className="invoiceSecondaryAction">
            <FaDownload /> خروجی گزارش
          </button>
          <button type="button" className="invoicePrimaryAction">
            <FaPlus /> فاکتور جدید
          </button>
        </div>
      </section>

      <section className="invoiceStatsGrid">
        <article className="invoiceStatCard">
          <span className="invoiceStatIcon green"><FaReceipt /></span>
          <div>
            <span>تعداد فاکتور</span>
            <strong>{filteredRows.length.toLocaleString("fa-IR")}</strong>
            <small>فاکتور نمایش داده‌شده</small>
          </div>
        </article>

        <article className="invoiceStatCard">
          <span className="invoiceStatIcon blue"><FaWallet /></span>
          <div>
            <span>جمع فروش</span>
            <strong>{money(statistics.totalSale)}</strong>
            <small>تومان</small>
          </div>
        </article>

        <article className="invoiceStatCard">
          <span className="invoiceStatIcon orange"><FaTag /></span>
          <div>
            <span>جمع تخفیف</span>
            <strong>{money(statistics.totalDiscount)}</strong>
            <small>تومان</small>
          </div>
        </article>

        <article className="invoiceStatCard">
          <span className="invoiceStatIcon purple"><FaUsers /></span>
          <div>
            <span>مشتریان خریدار</span>
            <strong>{statistics.customers.toLocaleString("fa-IR")}</strong>
            <small>میانگین خرید {money(statistics.averageSale)} تومان</small>
          </div>
        </article>
      </section>

      <section className="invoiceWorkspace">
        <div className="invoiceToolbar">
          <label className="invoiceSearchBox">
            <FaMagnifyingGlass />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="نام مشتری، موبایل یا شماره فاکتور..."
            />
          </label>

          <div className="invoiceToolbarActions">
            <label className="invoiceSelectControl">
              <FaFilter />
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="sale-high">بیشترین مبلغ</option>
                <option value="sale-low">کمترین مبلغ</option>
              </select>
              <FaChevronDown />
            </label>

            <button
              type="button"
              className="invoiceRefreshButton"
              onClick={() => void load()}
              aria-label="بروزرسانی"
              title="بروزرسانی اطلاعات"
            >
              <FaArrowRotateRight />
            </button>
          </div>
        </div>

        {error ? (
          <div className="invoiceState invoiceErrorState">
            <FaFileInvoice />
            <strong>خطا در دریافت فاکتورها</strong>
            <p>{error}</p>
            <button type="button" onClick={() => void load()}>تلاش دوباره</button>
          </div>
        ) : loading ? (
          <div className="invoiceSkeletonList">
            {Array.from({ length: 7 }).map((_, index) => (
              <div className="invoiceSkeletonRow" key={index}>
                <span /> <span /> <span /> <span /> <span />
              </div>
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="invoiceState">
            <FaReceipt />
            <strong>فاکتوری پیدا نشد</strong>
            <p>عبارت جستجو را تغییر دهید یا یک فاکتور جدید ثبت کنید.</p>
          </div>
        ) : (
          <div className="invoiceTableWrapper">
            <table className="invoiceTable">
              <thead>
                <tr>
                  <th>فاکتور</th>
                  <th>مشتری</th>
                  <th>شماره تماس</th>
                  <th>مبلغ فروش</th>
                  <th>تخفیف</th>
                  <th>تاریخ ثبت</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item, index) => {
                  const customerName = item.user?.name || "مشتری بدون نام";
                  const avatar = customerName.trim().charAt(0) || "؟";

                  return (
                    <tr key={item.id ?? `${item.factor}-${index}`}>
                      <td>
                        <div className="invoiceNumberCell">
                          <span><FaFileInvoice /></span>
                          <div>
                            <strong>#{item.factor || "—"}</strong>
                            <small>ردیف {(index + 1).toLocaleString("fa-IR")}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="invoiceCustomerCell">
                          <span className="invoiceCustomerAvatar">{avatar}</span>
                          <div>
                            <strong>{customerName}</strong>
                            <small>مشتری ثبت‌شده</small>
                          </div>
                        </div>
                      </td>
                      <td className="invoicePhone">{item.user?.phone || "—"}</td>
                      <td>
                        <strong className="invoiceMoney">{money(item.sale)} تومان</strong>
                      </td>
                      <td>
                        <span className="invoiceDiscount">{money(item.discount)} تومان</span>
                      </td>
                      <td>
                        <span className="invoiceDate">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString("fa-IR")
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <span className="invoiceStatus">
                          <FaCircleCheck /> ثبت‌شده
                        </span>
                      </td>
                      <td>
                        <button type="button" className="invoiceViewButton">
                          <FaEye /> مشاهده
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filteredRows.length > 0 && (
          <footer className="invoiceTableFooter">
            <span>
              نمایش {filteredRows.length.toLocaleString("fa-IR")} فاکتور از {rows.length.toLocaleString("fa-IR")} مورد
            </span>
            <strong>جمع نتایج: {money(statistics.totalSale)} تومان</strong>
          </footer>
        )}
      </section>
    </main>
  );
}

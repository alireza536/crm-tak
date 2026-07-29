import { useEffect, useMemo, useState } from "react";
import {
  FaArrowDownAZ,
  FaArrowUpWideShort,
  FaBars,
  FaFilter,
  FaMagnifyingGlass,
  FaPlus,
  FaRotate,
  FaTableCellsLarge,
  FaUserGroup,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa6";
import { Link } from "react-router-dom";

import CustomerCard from "../components/CustomerCard";
import { getCustomers } from "../services/api";
import "./Customers.css";

type Customer = {
  id: number | string;
  name?: string;
  phone?: string;
  personCode?: string | number;
  address?: string;
  totalSale?: number | string;
  invoiceCount?: number;
};

type SortKey = "sale" | "name" | "invoice";
type ViewMode = "grid" | "list";

const formatNumber = (value: number | string | undefined) =>
  Number(value || 0).toLocaleString("fa-IR");

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("sale");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);
  const [onlyWithSales, setOnlyWithSales] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Customers loading failed:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const totalSales = customers.reduce(
      (sum, customer) => sum + Number(customer.totalSale || 0),
      0,
    );

    const activeCustomers = customers.filter(
      (customer) => Number(customer.invoiceCount || 0) > 0,
    ).length;

    const vipCustomers = customers.filter(
      (customer) => Number(customer.totalSale || 0) >= 100_000_000,
    ).length;

    return {
      total: customers.length,
      active: activeCustomers,
      vip: vipCustomers,
      totalSales,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = customers.filter((customer) => {
      const matchesSearch =
        !normalizedSearch ||
        String(customer.name || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(customer.phone || "").includes(normalizedSearch) ||
        String(customer.personCode || "").includes(normalizedSearch);

      const matchesPhone = !onlyWithPhone || Boolean(customer.phone);
      const matchesSales =
        !onlyWithSales || Number(customer.totalSale || 0) > 0;

      return matchesSearch && matchesPhone && matchesSales;
    });

    return [...result].sort((a, b) => {
      if (sort === "name") {
        return String(a.name || "").localeCompare(String(b.name || ""), "fa");
      }

      if (sort === "invoice") {
        return Number(b.invoiceCount || 0) - Number(a.invoiceCount || 0);
      }

      return Number(b.totalSale || 0) - Number(a.totalSale || 0);
    });
  }, [customers, search, sort, onlyWithPhone, onlyWithSales]);

  const resetFilters = () => {
    setSearch("");
    setSort("sale");
    setOnlyWithPhone(false);
    setOnlyWithSales(false);
  };

  return (
    <section className="customersPage" dir="rtl">
      <div className="customersHero">
        <div>
          <span className="customersEyebrow">مدیریت ارتباط با مشتری</span>
          <h2>مرکز مشتریان</h2>
          <p>
            اطلاعات مشتریان، سابقه خرید و مشتریان باارزش را از این بخش مدیریت
            کنید.
          </p>
        </div>

        <div className="customersHeroActions">
          <Link to="/customer-upload" className="customerSecondaryButton">
            <FaUserGroup />
            ورود گروهی مشتریان
          </Link>

          <Link to="/upload" className="customerPrimaryButton">
            <FaUserPlus />
            افزودن از طریق فاکتور
          </Link>
        </div>
      </div>

      <div className="customerStatsGrid">
        <article className="customerStatCard green">
          <span className="customerStatIcon">
            <FaUsers />
          </span>
          <div>
            <small>کل مشتریان</small>
            <strong>{loading ? "—" : formatNumber(stats.total)}</strong>
            <span>پروفایل ثبت‌شده</span>
          </div>
        </article>

        <article className="customerStatCard blue">
          <span className="customerStatIcon">
            <FaUserGroup />
          </span>
          <div>
            <small>مشتریان فعال</small>
            <strong>{loading ? "—" : formatNumber(stats.active)}</strong>
            <span>دارای سابقه فاکتور</span>
          </div>
        </article>

        <article className="customerStatCard gold">
          <span className="customerStatIcon">
            <FaArrowUpWideShort />
          </span>
          <div>
            <small>مشتریان VIP</small>
            <strong>{loading ? "—" : formatNumber(stats.vip)}</strong>
            <span>خرید بالای ۱۰۰ میلیون</span>
          </div>
        </article>

        <article className="customerStatCard purple">
          <span className="customerStatIcon">
            <FaArrowDownAZ />
          </span>
          <div>
            <small>ارزش خرید مشتریان</small>
            <strong>{loading ? "—" : formatNumber(stats.totalSales)}</strong>
            <span>ریال فروش ثبت‌شده</span>
          </div>
        </article>
      </div>

      <div className="customersToolbar">
        <label className="customersSearch">
          <FaMagnifyingGlass />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو با نام، شماره تماس یا کد شخص..."
          />
          {search && (
            <button type="button" onClick={() => setSearch("")}>
              پاک‌کردن
            </button>
          )}
        </label>

        <div className="customersToolbarActions">
          <div className="customerSort">
            <span>مرتب‌سازی:</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            >
              <option value="sale">بیشترین خرید</option>
              <option value="invoice">بیشترین فاکتور</option>
              <option value="name">نام مشتری</option>
            </select>
          </div>

          <button
            type="button"
            className={`filterToggle ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters((value) => !value)}
          >
            <FaFilter />
            فیلترها
          </button>

          <div className="viewToggle">
            <button
              type="button"
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
              aria-label="نمایش کارتی"
            >
              <FaTableCellsLarge />
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
              aria-label="نمایش فهرستی"
            >
              <FaBars />
            </button>
          </div>

          <button type="button" className="refreshCustomers" onClick={load}>
            <FaRotate />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="customersFilters">
          <label>
            <input
              type="checkbox"
              checked={onlyWithPhone}
              onChange={(event) => setOnlyWithPhone(event.target.checked)}
            />
            فقط مشتریان دارای شماره تماس
          </label>

          <label>
            <input
              type="checkbox"
              checked={onlyWithSales}
              onChange={(event) => setOnlyWithSales(event.target.checked)}
            />
            فقط مشتریان دارای سابقه خرید
          </label>

          <button type="button" onClick={resetFilters}>
            حذف همه فیلترها
          </button>
        </div>
      )}

      <div className="customersResultHeader">
        <div>
          <strong>{formatNumber(filteredCustomers.length)}</strong>
          <span>مشتری نمایش داده می‌شود</span>
        </div>

        {(search || onlyWithPhone || onlyWithSales) && (
          <button type="button" onClick={resetFilters}>
            نمایش همه مشتریان
          </button>
        )}
      </div>

      {loading ? (
        <div className={`customersCollection ${viewMode}`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="customerSkeleton" key={index}>
              <span />
              <div>
                <i />
                <i />
              </div>
              <b />
              <b />
            </div>
          ))}
        </div>
      ) : filteredCustomers.length ? (
        <div className={`customersCollection ${viewMode}`}>
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="customersEmptyState">
          <span>
            <FaUsers />
          </span>
          <h3>مشتری‌ای پیدا نشد</h3>
          <p>عبارت جستجو یا فیلترهای انتخاب‌شده را تغییر دهید.</p>
          <button type="button" onClick={resetFilters}>
            <FaRotate />
            بازنشانی جستجو
          </button>
        </div>
      )}

      <Link to="/upload" className="customerFloatingAdd" aria-label="افزودن مشتری">
        <FaPlus />
      </Link>
    </section>
  );
}

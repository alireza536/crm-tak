import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBell,
  FaChevronDown,
  FaFileArrowUp,
  FaFileInvoice,
  FaMagnifyingGlass,
  FaMessage,
  FaMoon,
  FaPlus,
  FaSun,
  FaUserPlus,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";
import { Link, useLocation } from "react-router-dom";

import "./topbar.css";

type OpenMenu = "notifications" | "quick" | "profile" | null;

const pageMap: Record<string, { title: string; parent: string }> = {
  "/": { title: "داشبورد", parent: "مدیریت" },
  "/customers": { title: "مشتریان", parent: "مدیریت ارتباط با مشتری" },
  "/invoices": { title: "فاکتورها", parent: "فروش" },
  "/upload": { title: "ورود اطلاعات فروش", parent: "ابزارها" },
  "/customer-upload": { title: "بروزرسانی مشتریان", parent: "ابزارها" },
  "/sms": { title: "پیامک", parent: "بازاریابی" },
  "/settings": { title: "تنظیمات", parent: "سیستم" },
};

export default function Topbar() {
  const location = useLocation();
  const wrapperRef = useRef<HTMLElement | null>(null);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("tak-crm-theme") === "dark";
  });

  const page = useMemo(() => {
    if (location.pathname.startsWith("/customer/")) {
      return { title: "پروفایل مشتری", parent: "مشتریان" };
    }

    return pageMap[location.pathname] || {
      title: "TAK CRM",
      parent: "پنل مدیریت",
    };
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("crmDark", darkMode);
    localStorage.setItem("tak-crm-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  const toggleMenu = (menu: OpenMenu) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  const today = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="globalTopbar" ref={wrapperRef}>
      <div className="topbarPageInfo">
        <div className="topbarBreadcrumb">
          <span>{page.parent}</span>
          <i>/</i>
          <strong>{page.title}</strong>
        </div>

        <div className="topbarPageTitle">
          <h1>{page.title}</h1>
          <span>{today}</span>
        </div>
      </div>

      <div className="topbarTools">
        <label className="globalSearch">
          <FaMagnifyingGlass />
          <input placeholder="جستجوی مشتری، فاکتور یا شماره تماس..." />
          <kbd>Ctrl K</kbd>
        </label>

        <button
          type="button"
          className="topbarIconButton themeButton"
          onClick={() => setDarkMode((value) => !value)}
          aria-label="تغییر حالت نمایش"
          title={darkMode ? "حالت روشن" : "حالت تیره"}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        <div className="topbarDropdownWrapper">
          <button
            type="button"
            className={`topbarIconButton ${
              openMenu === "notifications" ? "active" : ""
            }`}
            onClick={() => toggleMenu("notifications")}
            aria-label="اعلان‌ها"
          >
            <FaBell />
            <span className="notificationDot">3</span>
          </button>

          {openMenu === "notifications" && (
            <div className="topbarDropdown notificationDropdown">
              <div className="dropdownHeader">
                <div>
                  <strong>اعلان‌ها</strong>
                  <span>۳ مورد جدید</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  aria-label="بستن"
                >
                  <FaXmark />
                </button>
              </div>

              <div className="notificationList">
                <button type="button" className="notificationItem important">
                  <span className="notificationIcon">
                    <FaUsers />
                  </span>
                  <span>
                    <strong>۲۸ مشتری نیازمند پیگیری</strong>
                    <small>بیش از ۹۰ روز از آخرین خرید گذشته است</small>
                    <time>امروز</time>
                  </span>
                </button>

                <button type="button" className="notificationItem">
                  <span className="notificationIcon">
                    <FaFileInvoice />
                  </span>
                  <span>
                    <strong>گزارش فروش بروزرسانی شد</strong>
                    <small>اطلاعات جدید در داشبورد قابل مشاهده است</small>
                    <time>۱۰ دقیقه پیش</time>
                  </span>
                </button>

                <button type="button" className="notificationItem">
                  <span className="notificationIcon">
                    <FaMessage />
                  </span>
                  <span>
                    <strong>کمپین پیشنهادی آماده است</strong>
                    <small>مشتریان غیرفعال برای پیگیری شناسایی شدند</small>
                    <time>امروز</time>
                  </span>
                </button>
              </div>

              <button type="button" className="dropdownFooterButton">
                مشاهده همه اعلان‌ها
              </button>
            </div>
          )}
        </div>

        <div className="topbarDropdownWrapper">
          <button
            type="button"
            className={`quickAddButton ${
              openMenu === "quick" ? "active" : ""
            }`}
            onClick={() => toggleMenu("quick")}
          >
            <FaPlus />
            <span>افزودن سریع</span>
            <FaChevronDown />
          </button>

          {openMenu === "quick" && (
            <div className="topbarDropdown quickDropdown">
              <span className="dropdownLabel">ایجاد مورد جدید</span>

              <Link to="/customers" className="quickMenuItem">
                <span className="quickMenuIcon green">
                  <FaUserPlus />
                </span>
                <span>
                  <strong>مشتری جدید</strong>
                  <small>ثبت اطلاعات و مشخصات مشتری</small>
                </span>
              </Link>

              <Link to="/invoices" className="quickMenuItem">
                <span className="quickMenuIcon blue">
                  <FaFileInvoice />
                </span>
                <span>
                  <strong>فاکتور جدید</strong>
                  <small>ثبت سریع فروش و فاکتور</small>
                </span>
              </Link>

              <Link to="/upload" className="quickMenuItem">
                <span className="quickMenuIcon orange">
                  <FaFileArrowUp />
                </span>
                <span>
                  <strong>ورود فایل فروش</strong>
                  <small>آپلود و پردازش اطلاعات</small>
                </span>
              </Link>

              <Link to="/sms" className="quickMenuItem">
                <span className="quickMenuIcon purple">
                  <FaMessage />
                </span>
                <span>
                  <strong>ارسال پیامک</strong>
                  <small>ایجاد پیام یا کمپین جدید</small>
                </span>
              </Link>
            </div>
          )}
        </div>

        <div className="topbarDropdownWrapper">
          <button
            type="button"
            className={`profileButton ${
              openMenu === "profile" ? "active" : ""
            }`}
            onClick={() => toggleMenu("profile")}
          >
            <span className="profileAvatar">A</span>

            <span className="profileText">
              <strong>علیرضا</strong>
              <small>مدیر سیستم</small>
            </span>

            <FaChevronDown />
          </button>

          {openMenu === "profile" && (
            <div className="topbarDropdown profileDropdown">
              <div className="profileDropdownHeader">
                <span className="profileAvatar large">A</span>
                <div>
                  <strong>علیرضا</strong>
                  <span>مدیر مجموعه TAK</span>
                </div>
              </div>

              <Link to="/settings">تنظیمات حساب</Link>
              <Link to="/settings">تنظیمات سیستم</Link>

              <button type="button" className="logoutMenuButton">
                خروج از حساب
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

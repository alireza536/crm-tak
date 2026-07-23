import { useState, type ReactNode } from "react";
import {
  FaArrowRightFromBracket,
  FaBars,
  FaBell,
  FaChartPie,
  FaChartLine,
  FaChartColumn,
  FaCalendarCheck,
  FaBullhorn,
  FaChevronLeft,
  FaFileArrowUp,
  FaFileInvoiceDollar,
  FaGear,
  FaMessage,
  FaRobot,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";
import { NavLink, useLocation } from "react-router-dom";

import "./Sidebar.css";

type MenuItem = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  path: string;
};

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menu: MenuItem[] = [
    {
      title: "داشبورد",
      subtitle: "نمای کلی کسب‌وکار",
      icon: <FaChartPie />,
      path: "/",
    },
    {
      title: "مشتریان",
      subtitle: "مدیریت مشتریان",
      icon: <FaUsers />,
      path: "/customers",
    },
    {
      title: "فاکتورها",
      subtitle: "مدیریت فروش",
      icon: <FaFileInvoiceDollar />,
      path: "/invoices",
    },
    {
      title: "هوش فروش",
      subtitle: "تحلیل و فرصت‌ها",
      icon: <FaChartLine />,
      path: "/insights",
    },
    {
      title: "دستیار هوشمند",
      subtitle: "تحلیل و پاسخ مدیریتی",
      icon: <FaRobot />,
      path: "/ai-assistant",
    },
    {
      title: "مرکز پیگیری",
      subtitle: "اعلان‌ها و کارهای مهم",
      icon: <FaBell />,
      path: "/follow-ups",
    },
    {
      title: "کمپین فروش",
      subtitle: "هدف‌گیری و پیام‌رسانی",
      icon: <FaBullhorn />,
      path: "/campaigns",
    },
    {
      title: "گزارش‌ها",
      subtitle: "تحلیل و خروجی مدیریتی",
      icon: <FaChartColumn />,
      path: "/reports",
    },
    {
      title: "برنامه‌ریز",
      subtitle: "وظایف و پیگیری روزانه",
      icon: <FaCalendarCheck />,
      path: "/tasks",
    },
    {
      title: "قیف فروش",
      subtitle: "فرصت‌ها و مراحل معامله",
      icon: <FaChartLine />,
      path: "/pipeline",
    },
    {
      title: "مرکز ورود اطلاعات",
      subtitle: "فروش و مشتریان",
      icon: <FaFileArrowUp />,
      path: "/upload",
    },
    {
      title: "پیامک",
      subtitle: "ارسال و کمپین‌ها",
      icon: <FaMessage />,
      path: "/sms",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <button
        className="crmMobileMenu"
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="باز کردن منو"
      >
        <FaBars />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="crmSidebarOverlay"
          onClick={() => setMobileOpen(false)}
          aria-label="بستن منو"
        />
      )}

      <aside
        className={`crmSidebar ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobileOpen" : ""
        }`}
      >
        <div className="crmBrand">
          <div className="crmBrandMark">
            <span>TAK</span>
          </div>

          <div className="crmBrandInfo">
            <strong>TAK CRM</strong>
            <small>مدیریت هوشمند فروش</small>
          </div>

          <button
            type="button"
            className="crmMobileClose"
            onClick={() => setMobileOpen(false)}
            aria-label="بستن منو"
          >
            <FaXmark />
          </button>
        </div>

        <div className="crmAccount">
          <span className="crmAccountAvatar">A</span>

          <div className="crmAccountInfo">
            <strong>مجموعه TAK</strong>
            <small>مدیر سیستم</small>
          </div>

          <span className="crmOnlineDot" />
        </div>

        <span className="crmMenuTitle">منوی مدیریت</span>

        <nav className="crmMenu">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={
                isActive(item.path)
                  ? "crmMenuItem active"
                  : "crmMenuItem"
              }
              title={collapsed ? item.title : undefined}
            >
              <span className="crmMenuIcon">{item.icon}</span>

              <span className="crmMenuText">
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </span>

              <FaChevronLeft className="crmMenuArrow" />
            </NavLink>
          ))}
        </nav>

        <div className="crmSidebarFooter">
          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={
              isActive("/settings")
                ? "crmMenuItem active"
                : "crmMenuItem"
            }
            title={collapsed ? "تنظیمات" : undefined}
          >
            <span className="crmMenuIcon">
              <FaGear />
            </span>

            <span className="crmMenuText">
              <strong>تنظیمات</strong>
              <small>تنظیمات حساب و سیستم</small>
            </span>

            <FaChevronLeft className="crmMenuArrow" />
          </NavLink>

          <button type="button" className="crmLogout">
            <span className="crmMenuIcon">
              <FaArrowRightFromBracket />
            </span>

            <span className="crmMenuText">
              <strong>خروج از حساب</strong>
              <small>پایان نشست کاربری</small>
            </span>
          </button>

          <button
            type="button"
            className="crmCollapse"
            onClick={() => setCollapsed((value) => !value)}
          >
            <FaChevronLeft />
            <span>{collapsed ? "باز کردن منو" : "جمع کردن منو"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

import {
  FaChartPie,
  FaUsers,
  FaFileInvoiceDollar,
  FaUpload,
  FaSms,
  FaCog,
} from "react-icons/fa";

import { Link, useLocation } from "react-router-dom";

import logo from "../assets/logo.png";
import profile from "../assets/logo.png";

import "./Sidebar.css";

export default function Sidebar() {

  const location = useLocation();

  const menu = [
    {
      title: "داشبورد",
      icon: <FaChartPie />,
      path: "/",
    },
    {
      title: "مشتریان",
      icon: <FaUsers />,
      path: "/customers",
    },
    
    {
      title: "آپلود فروش",
      icon: <FaUpload />,
      path: "/upload",
    },
    {
      title: "فاکتورها",
      icon: <FaFileInvoiceDollar />,
      path: "/invoices",
    },
    {
      title: "پیامک",
      icon: <FaSms />,
      path: "/sms",
    },
    {
  title: "بروزرسانی مشتریان",
  icon: <FaUpload />,
  path: "/customer-upload",
},
    
    {
      title: "تنظیمات",
      icon: <FaCog />,
      path: "/settings",
    },
  ];

  return (
    <aside className="sidebar">

      <img
        src={logo}
        className="logo"
      />
      

      <h2>TAK CRM</h2>

      <div className="profileBox">

        <img
          src={profile}
          className="profileImg"
        />

        <h3>Alireza</h3>

        <p>Manager</p>

      </div>

      <nav>

        {menu.map((item) => (

          <Link
            key={item.path}
            to={item.path}
            className={
              location.pathname === item.path
                ? "menuItem active"
                : "menuItem"
            }
            
          >
            {item.icon}

            <span>{item.title}</span>

          </Link>

        ))}

      </nav>

    </aside>
  );
}
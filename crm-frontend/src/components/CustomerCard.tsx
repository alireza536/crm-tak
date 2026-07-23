import {
  FaChevronLeft,
  FaFileInvoice,
  FaLocationDot,
  FaPhone,
  FaUser,
} from "react-icons/fa6";
import { Link } from "react-router-dom";

import "./CustomerCard.css";

type ViewMode = "grid" | "list";

interface Props {
  customer: {
    id: number | string;
    name?: string;
    phone?: string;
    personCode?: string | number;
    address?: string;
    totalSale?: number | string;
    invoiceCount?: number;
  };
  viewMode?: ViewMode;
}

const formatNumber = (value: number | string | undefined) =>
  Number(value || 0).toLocaleString("fa-IR");

const getCustomerLevel = (totalSale: number) => {
  if (totalSale >= 100_000_000) return { title: "VIP", className: "vip" };
  if (totalSale >= 30_000_000) return { title: "طلایی", className: "gold" };
  if (totalSale > 0) return { title: "فعال", className: "active" };
  return { title: "جدید", className: "new" };
};

export default function CustomerCard({
  customer,
  viewMode = "grid",
}: Props) {
  const totalSale = Number(customer.totalSale || 0);
  const level = getCustomerLevel(totalSale);
  const firstCharacter = String(customer.name || "?").trim().charAt(0) || "?";

  return (
    <Link
      to={`/customer/${customer.id}`}
      className={`premiumCustomerCard ${viewMode}`}
    >
      <div className="premiumCustomerIdentity">
        <span className="premiumCustomerAvatar">{firstCharacter}</span>

        <div>
          <div className="premiumCustomerNameRow">
            <h3>{customer.name || "بدون نام"}</h3>
            <span className={`customerLevel ${level.className}`}>
              {level.title}
            </span>
          </div>

          <span className="customerCode">
            <FaUser />
            کد شخص: {customer.personCode || "ثبت نشده"}
          </span>
        </div>
      </div>

      <div className="premiumCustomerContact">
        <span>
          <FaPhone />
          {customer.phone || "شماره تماس ثبت نشده"}
        </span>

        <span>
          <FaLocationDot />
          {customer.address || "آدرس ثبت نشده"}
        </span>
      </div>

      <div className="premiumCustomerStats">
        <div>
          <span>مجموع خرید</span>
          <strong>{formatNumber(totalSale)}</strong>
          <small>تومان</small>
        </div>

        <div>
          <span>تعداد فاکتور</span>
          <strong>{formatNumber(customer.invoiceCount)}</strong>
          <small>فاکتور ثبت‌شده</small>
        </div>

        <div>
          <span>میانگین خرید</span>
          <strong>
            {formatNumber(
              Number(customer.invoiceCount || 0)
                ? totalSale / Number(customer.invoiceCount)
                : 0,
            )}
          </strong>
          <small>تومان</small>
        </div>
      </div>

      <div className="premiumCustomerFooter">
        <span>
          <FaFileInvoice />
          مشاهده سابقه و فاکتورها
        </span>

        <span className="customerProfileAction">
          پروفایل مشتری
          <FaChevronLeft />
        </span>
      </div>
    </Link>
  );
}

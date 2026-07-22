import { Link } from "react-router-dom";
import "./CustomerCard.css";

interface Props {
  customer: any;
}

export default function CustomerCard({ customer }: Props) {
  return (
    <Link
      to={`/customer/${customer.id}`}
      className="customerCardLink"
    >
      <div className="customerCard">

        <div className="customerTop">

          <div className="avatar">
            {customer.name
              ? customer.name.charAt(0)
              : "?"}
          </div>

          <div>

            <h3>{customer.name}</h3>

            <p>{customer.phone}</p>

          </div>

        </div>

        <div className="customerStats">

          <div className="statBox">

            <span>فروش کل</span>

            <strong>
              {Number(
                customer.totalSale || 0
              ).toLocaleString()}
            </strong>

          </div>

          <div className="statBox">

            <span>تعداد فاکتور</span>

            <strong>
              {customer.invoiceCount}
            </strong>

          </div>

        </div>

        <button className="profileButton">
          مشاهده پروفایل →
        </button>

      </div>
    </Link>
  );
}
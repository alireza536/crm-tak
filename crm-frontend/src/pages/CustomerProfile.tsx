import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getCustomerProfile,
} from "../services/api";

import "./CustomerProfile.css";

export default function CustomerProfile() {
  const { id } = useParams();

  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await getCustomerProfile(
        Number(id)
      );

      setCustomer(data);

    } catch (err) {
      console.log(err);
    }
  }

  if (!customer) {

    return (
      <div className="loading">

        درحال بارگذاری...

      </div>
    );

  }

  return (

    <div className="profilePage">

      <div className="profileHeader">

        <div className="avatarBig">

          {customer.name.charAt(0)}

        </div>

        <div>

          <h1>{customer.name}</h1>

          <p>📞 {customer.phone}</p>

          <p>📍 {customer.address}</p>

          <p>کد مشتری : {customer.personCode}</p>

        </div>

      </div>

      <div className="profileCards">

        <div className="profileCard">

          <h4>فروش کل</h4>

          <h2>

            {Number(customer.totalSale).toLocaleString()}

          </h2>

        </div>

        <div className="profileCard">

          <h4>جمع تخفیف</h4>

          <h2>

            {Number(customer.totalDiscount).toLocaleString()}

          </h2>

        </div>

        <div className="profileCard">

          <h4>تعداد فاکتور</h4>

          <h2>

            {customer.invoiceCount}

          </h2>

        </div>

        <div className="profileCard">

          <h4>آخرین خرید</h4>

          <h2>

            {

              customer.lastInvoice

              ?

              new Date(
                customer.lastInvoice
              ).toLocaleDateString()

              :

              "-"

            }

          </h2>

        </div>

      </div>

      <div className="profileActions">

        <button>

          📩 ارسال پیامک

        </button>

        <button>

          🖨 چاپ گزارش

        </button>

        <button>

          ⬇ دانلود PDF

        </button>

      </div>

      <div className="invoiceTable">

        <h2>

          فاکتورهای مشتری

        </h2>

        <table>

          <thead>

            <tr>

              <th>شماره</th>

              <th>تاریخ</th>

              <th>فروش</th>

              <th>تخفیف</th>

            </tr>

          </thead>

          <tbody>

            {

              customer.invoices.map((item:any)=>(

                <tr key={item.id}>

                  <td>

                    {item.factor}

                  </td>

                  <td>

                    {

                      new Date(

                        item.createdAt

                      ).toLocaleDateString()

                    }

                  </td>

                  <td>

                    {

                      item.sale.toLocaleString()

                    }

                  </td>

                  <td>

                    {

                      item.discount.toLocaleString()

                    }

                  </td>

                </tr>

              ))

            }

          </tbody>

        </table>

      </div>

    </div>

  );

}
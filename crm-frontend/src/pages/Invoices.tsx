import { useEffect, useMemo, useState } from "react";
import "./Invoices.css";
import { getInvoices } from "../services/api";

export default function Invoices() {

  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getInvoices();
    setRows(data);
  }

  const filteredRows = useMemo(() => {

    return rows.filter((item) => {

      const name =
        item.user?.name?.toLowerCase() || "";

      const phone =
        item.user?.phone || "";

      const factor =
        String(item.factor || "");

      return (
        name.includes(search.toLowerCase()) ||
        phone.includes(search) ||
        factor.includes(search)
      );

    });

  }, [rows, search]);

  const totalSale = filteredRows.reduce(
    (sum, item) => sum + Number(item.sale),
    0
  );

  const totalDiscount = filteredRows.reduce(
    (sum, item) => sum + Number(item.discount),
    0
  );

  return (

    <div className="invoicePage">

      <div className="invoiceHeader">

        <div>

          <h1>مدیریت فاکتورها</h1>

          <p>مشاهده و مدیریت فاکتورهای ثبت شده</p>

        </div>

        <div className="invoiceActions">

          <input
            className="invoiceSearch"
            placeholder="جستجوی مشتری، موبایل یا شماره فاکتور..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <button className="addInvoice">

            + فاکتور جدید

          </button>

        </div>

      </div>

      <div className="invoiceStats">

        <div className="invoiceStat">

          <h4>تعداد فاکتور</h4>

          <h2>{filteredRows.length}</h2>

        </div>

        <div className="invoiceStat">

          <h4>جمع فروش</h4>

          <h2>{totalSale.toLocaleString()}</h2>

        </div>

        <div className="invoiceStat">

          <h4>جمع تخفیف</h4>

          <h2>{totalDiscount.toLocaleString()}</h2>

        </div>

        <div className="invoiceStat">

          <h4>مشتریان</h4>

          <h2>

            {new Set(
              filteredRows.map(r => r.user?.name)
            ).size}

          </h2>

        </div>

      </div>
            <div className="invoiceTableCard">

        <table className="invoiceTable">

          <thead>

            <tr>

              <th>ردیف</th>

              <th>مشتری</th>

              <th>شماره موبایل</th>

              <th>شماره فاکتور</th>

              <th>مبلغ فروش</th>

              <th>تخفیف</th>

              <th>تاریخ</th>

              <th>وضعیت</th>

              <th>عملیات</th>

            </tr>

          </thead>

          <tbody>

            {filteredRows.map((item: any, index: number) => (

              <tr key={item.id}>

                <td>{index + 1}</td>

                <td>

                  <div className="customerInfo">

                    <div className="avatar">

                      {item.user?.name
                        ? item.user.name.charAt(0)
                        : "؟"}

                    </div>

                    <div>

                      <b>{item.user?.name}</b>

                    </div>

                  </div>

                </td>

                <td>

                  {item.user?.phone}

                </td>

                <td>

                  #{item.factor}

                </td>

                <td>

                  {Number(item.sale).toLocaleString()} تومان

                </td>

                <td>

                  {Number(item.discount).toLocaleString()}

                </td>

                <td>

                  {new Date(item.createdAt).toLocaleDateString("fa-IR")}

                </td>

                <td>

                  <span className="status success">

                    ثبت شده

                  </span>

                </td>

                <td>

                  <button className="viewBtn">

                    مشاهده

                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}
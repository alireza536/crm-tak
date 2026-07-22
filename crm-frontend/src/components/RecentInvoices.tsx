export default function RecentInvoices() {
  const invoices = [
    {
      id: 598,
      customer: "Mahboobeh",
      sale: 10000000,
      profit: 200000,
      date: "2025-07-01",
    },
    {
      id: 599,
      customer: "Ali",
      sale: 4200000,
      profit: 150000,
      date: "2025-07-02",
    },
    {
      id: 600,
      customer: "Hossein",
      sale: 8600000,
      profit: 310000,
      date: "2025-07-03",
    },
  ];

  return (
    <div className="invoiceBox">

      <h2>Recent Invoices</h2>

      <table>

        <thead>

          <tr>

            <th>Invoice</th>

            <th>Customer</th>

            <th>Sale</th>

            <th>Profit</th>

            <th>Date</th>

          </tr>

        </thead>

        <tbody>

          {invoices.map((item) => (

            <tr key={item.id}>

              <td>#{item.id}</td>

              <td>{item.customer}</td>

              <td>{item.sale.toLocaleString()}</td>

              <td>{item.profit.toLocaleString()}</td>

              <td>{item.date}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}
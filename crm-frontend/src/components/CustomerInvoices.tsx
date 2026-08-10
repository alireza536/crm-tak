import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { Badge, DataTable, EmptyState, GlassCard } from "./ui/DesignSystem";
import { getInvoices, type InvoiceRecord } from "../services/api";

const labels = { PENDING: "پرداخت نشده", PAID: "پرداخت شده", CANCELLED: "لغو شده" };
const tones = { PENDING: "warning", PAID: "success", CANCELLED: "danger" } as const;

export default function CustomerInvoices({ customerId }: { customerId: number }) {
  const [rows, setRows] = useState<InvoiceRecord[]>([]);

  useEffect(() => {
    getInvoices()
      .then(data => setRows(data.filter(row => Number(row.customerId) === customerId)))
      .catch(() => setRows([]));
  }, [customerId]);

  return <GlassCard className="customerQuotationPanel">
    <header><ReceiptText/><div><small>SALES INVOICES</small><h2>فاکتورهای فروش</h2></div></header>
    {rows.length ? <DataTable>
      <thead><tr><th>شماره فاکتور</th><th>تاریخ</th><th>شرح خرید</th><th>مبلغ</th><th>وضعیت پرداخت</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}>
        <td>{row.invoiceNumber}</td>
        <td>{new Date(row.invoiceDate || row.createdAt).toLocaleDateString("fa-IR")}</td>
        <td>{row.items?.map(item => `${item.productName} × ${item.quantity}`).join("، ") || "—"}</td>
        <td>{row.total.toLocaleString("fa-IR")} ریال</td>
        <td><Badge tone={tones[row.status]}>{labels[row.status]}</Badge></td>
      </tr>)}</tbody>
    </DataTable> : <EmptyState title="فاکتور فروشی برای این مشتری ثبت نشده"/>}
  </GlassCard>;
}

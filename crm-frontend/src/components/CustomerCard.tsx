import { CalendarDays, ChevronLeft, MapPin, Phone, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Card, GlassCard } from "./ui/DesignSystem";
import "./CustomerCard.css";

type ViewMode="grid"|"list";
interface Props{customer:{id:number|string;name?:string;phone?:string;personCode?:string|number;address?:string;city?:string;status?:string;customerType?:string;totalSale?:number|string;invoiceCount?:number;lastPurchase?:string|null};viewMode?:ViewMode}
const fa=(value:unknown)=>Number(value||0).toLocaleString("fa-IR");
const date=(value?:string|null)=>value&&!Number.isNaN(new Date(value).getTime())?new Date(value).toLocaleDateString("fa-IR",{year:"numeric",month:"short",day:"numeric"}):"بدون خرید";

export default function CustomerCard({customer,viewMode="grid"}:Props){
 const sale=Number(customer.totalSale||0);
 const level=customer.customerType==="VIP"||sale>=100_000_000?{label:"VIP",tone:"purple" as const}:customer.status==="ACTIVE"?{label:"فعال",tone:"success" as const}:{label:"غیرفعال",tone:"warning" as const};
 return <Link to={`/customer/${customer.id}`} className={`premiumCustomerCardLink ${viewMode}`}><GlassCard className={`premiumCustomerCard ${viewMode}`}>
  <header><span className="premiumCustomerAvatar">{customer.name?.trim().charAt(0)||"؟"}</span><div><h3>{customer.name||"بدون نام"}</h3><small>{customer.personCode?`کد مشتری ${customer.personCode}`:"پرونده مشتری"}</small></div><Badge tone={level.tone}>{level.label}</Badge></header>
  <div className="customerContact"><span><Phone/>{customer.phone||"شماره ثبت نشده"}</span><span><MapPin/>{customer.city||customer.address||"شهر ثبت نشده"}</span><span><CalendarDays/>{date(customer.lastPurchase)}</span></div>
  <div className="customerNumbers"><Card className="customerMetricCard"><small>تعداد فاکتور</small><strong>{fa(customer.invoiceCount)}</strong><span>سفارش</span></Card><Card className="customerMetricCard"><small>مجموع خرید</small><strong>{fa(sale)}</strong><span>ریال</span></Card></div>
  <footer><span><ReceiptText/>مشاهده پرونده مشتری</span><ChevronLeft/></footer>
 </GlassCard></Link>;
}

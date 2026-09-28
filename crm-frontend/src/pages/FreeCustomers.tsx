import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, RefreshCw, Search, UserCheck, UsersRound } from "lucide-react";
import { ActionButton, Badge, EmptyState, GlassCard, Modal, PageHeader, TableCard } from "../components/ui/DesignSystem";
import { claimCustomer, getFreeCustomers } from "../services/api";
import { getCurrentUser } from "../utils/auth";
import "./FreeCustomers.css";

type FreeCustomer={id:number;name:string;storeName:string|null;phone:string|null;province:string|null;city:string|null;address:string|null;nationalCode:string|null;customerType:string;status:string;totalSale:number;invoiceCount:number;lastPurchase:string|null;createdAt:string};
const notify=(type:"success"|"error",text:string)=>window.dispatchEvent(new CustomEvent("tak-toast",{detail:{type,text}}));
const money=(value:unknown)=>`${Number(value||0).toLocaleString("fa-IR")} ریال`;
const date=(value:string|null)=>value?new Date(value).toLocaleDateString("fa-IR"):"بدون خرید";
const PAGE_SIZE=20;

export default function FreeCustomers(){
 const user=getCurrentUser();
 const [items,setItems]=useState<FreeCustomer[]>([]),[loading,setLoading]=useState(true),[claiming,setClaiming]=useState<number|null>(null),[selected,setSelected]=useState<FreeCustomer|null>(null);
 const [search,setSearch]=useState(""),[customerType,setCustomerType]=useState(""),[province,setProvince]=useState(""),[createdFrom,setCreatedFrom]=useState(""),[page,setPage]=useState(1);
 const load=async()=>{try{setLoading(true);setItems(await getFreeCustomers())}catch{notify("error","دریافت مشتریان آزاد ناموفق بود.")}finally{setLoading(false)}};
 useEffect(()=>{void load()},[]);
 const customerTypes=useMemo(()=>[...new Set(items.map(item=>item.customerType).filter(Boolean))],[items]);
 const provinces=useMemo(()=>[...new Set(items.map(item=>item.province).filter((value):value is string=>Boolean(value)))],[items]);
 const filtered=useMemo(()=>{const q=search.trim().toLowerCase(),from=createdFrom?new Date(`${createdFrom}T00:00:00`).getTime():0;return items.filter(item=>(!customerType||item.customerType===customerType)&&(!province||item.province===province)&&(!from||new Date(item.createdAt).getTime()>=from)&&(!q||[item.name,item.phone||"",item.storeName||""].some(value=>value.toLowerCase().includes(q))))},[createdFrom,customerType,items,province,search]);
 const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)),visible=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
 useEffect(()=>setPage(1),[createdFrom,customerType,province,search]);
 const claim=async()=>{if(!selected)return;try{setClaiming(selected.id);await claimCustomer(selected.id);setItems(current=>current.filter(item=>item.id!==selected.id));setSelected(null);notify("success","مشتری با موفقیت به لیست مشتریان شما اضافه شد.");await load()}catch(error:any){notify("error",error.response?.data?.message||"این مشتری قبلاً توسط کارشناس دیگری انتخاب شده است.");setSelected(null);await load()}finally{setClaiming(null)}};
 return <main className="freeCustomers" dir="rtl">
  <PageHeader eyebrow="CUSTOMER POOL" title="مشتریان آزاد" description="مشتریان بدون کارشناس را مشاهده و برای پیگیری به سبد کاری خود اضافه کنید." actions={<ActionButton className="secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={15}/>بروزرسانی</ActionButton>}/>
  <GlassCard className="freeCustomerFilters"><label><Search size={16}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="جستجو با نام، موبایل یا نام فروشگاه"/></label><select value={customerType} onChange={event=>setCustomerType(event.target.value)}><option value="">همه انواع مشتری</option>{customerTypes.map(value=><option key={value}>{value}</option>)}</select><select value={province} onChange={event=>setProvince(event.target.value)}><option value="">همه استان‌ها</option>{provinces.map(value=><option key={value}>{value}</option>)}</select><label className="freeCustomerDate"><CalendarDays size={15}/><input type="date" value={createdFrom} onChange={event=>setCreatedFrom(event.target.value)} title="تاریخ ورود از"/></label><Badge tone="purple">{filtered.length.toLocaleString("fa-IR")} مشتری آزاد</Badge></GlassCard>
  <TableCard title="فهرست مشتریان بدون مسئول" subtitle="انتخاب مشتری فقط برای کارشناسان فروش فعال است">
   {loading?<div className="freeCustomerLoading"><i/>در حال دریافت مشتریان...</div>:visible.length?<><div className="uiTableWrap"><table className="uiTable"><thead><tr><th>مشتری</th><th>فروشگاه</th><th>موبایل</th><th>شهر / استان</th><th>مجموع خرید</th><th>آخرین خرید</th><th>تاریخ ورود</th><th>عملیات</th></tr></thead><tbody>{visible.map(item=><tr key={item.id}><td><strong><UsersRound size={15}/>{item.name}</strong><small>{item.customerType||"NORMAL"}</small></td><td>{item.storeName||"—"}</td><td>{item.phone||"—"}</td><td><span><MapPin size={13}/>{[item.city,item.province].filter(Boolean).join(" / ")||"—"}</span></td><td>{money(item.totalSale)}</td><td>{date(item.lastPurchase)}</td><td>{date(item.createdAt)}</td><td>{user?.role==="SALES"?<ActionButton disabled={claiming===item.id} onClick={()=>setSelected(item)}><UserCheck size={14}/>{claiming===item.id?"در حال تخصیص...":"انتخاب مشتری"}</ActionButton>:<Badge tone="info">بدون مسئول</Badge>}</td></tr>)}</tbody></table></div><nav className="freeCustomerPagination" aria-label="صفحه‌بندی"><button disabled={page===1} onClick={()=>setPage(value=>value-1)}>قبلی</button><span>صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span><button disabled={page===pages} onClick={()=>setPage(value=>value+1)}>بعدی</button></nav></>:<EmptyState title="مشتری آزادی پیدا نشد" description="مشتری مطابق فیلترهای انتخاب‌شده وجود ندارد."/>}
  </TableCard>
  <Modal open={Boolean(selected)} title="تأیید انتخاب مشتری" onClose={()=>setSelected(null)}><div className="freeCustomerConfirm"><UsersRound/><p>آیا می‌خواهید <strong>{selected?.name}</strong> را به لیست مشتریان خود اضافه کنید؟</p><div><ActionButton className="secondary" onClick={()=>setSelected(null)}>انصراف</ActionButton><ActionButton disabled={claiming!==null} onClick={()=>void claim()}><UserCheck size={14}/>{claiming!==null?"در حال تخصیص...":"تأیید انتخاب"}</ActionButton></div></div></Modal>
 </main>
}

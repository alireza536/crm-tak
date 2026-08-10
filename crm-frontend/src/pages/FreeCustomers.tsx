import { useEffect, useMemo, useState } from "react";
import { MapPin, RefreshCw, Search, UserCheck, UsersRound } from "lucide-react";
import { ActionButton, Badge, EmptyState, GlassCard, PageHeader, TableCard } from "../components/ui/DesignSystem";
import { claimCustomer, getFreeCustomers } from "../services/api";
import { getCurrentUser } from "../utils/auth";
import "./FreeCustomers.css";

type FreeCustomer={id:number;name:string;phone:string|null;city:string|null;address:string|null;nationalCode:string|null;createdAt:string};
const notify=(type:"success"|"error",text:string)=>window.dispatchEvent(new CustomEvent("tak-toast",{detail:{type,text}}));

export default function FreeCustomers(){
 const user=getCurrentUser();
 const [items,setItems]=useState<FreeCustomer[]>([]),[loading,setLoading]=useState(true),[claiming,setClaiming]=useState<number|null>(null),[search,setSearch]=useState(""),[city,setCity]=useState("");
 const load=async()=>{try{setLoading(true);setItems(await getFreeCustomers())}catch{notify("error","دریافت مشتریان آزاد ناموفق بود.")}finally{setLoading(false)}};
 useEffect(()=>{void load()},[]);
 const cities=useMemo(()=>[...new Set(items.map(item=>item.city).filter((value):value is string=>Boolean(value)))],[items]);
 const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return items.filter(item=>(!city||item.city===city)&&(!q||[item.name,item.phone||"",item.nationalCode||"",item.city||""].some(value=>value.toLowerCase().includes(q))))},[city,items,search]);
 const claim=async(id:number)=>{try{setClaiming(id);await claimCustomer(id);setItems(current=>current.filter(item=>item.id!==id));notify("success","مشتری با موفقیت به شما تخصیص یافت.")}catch(error:any){notify("error",error.response?.data?.message||"این مشتری دیگر قابل انتخاب نیست.");await load()}finally{setClaiming(null)}};
 return <main className="freeCustomers" dir="rtl">
  <PageHeader eyebrow="CUSTOMER POOL" title="مشتریان آزاد" description="مشتریان بدون کارشناس را مشاهده و برای پیگیری به سبد کاری خود اضافه کنید." actions={<ActionButton className="secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={15}/>بروزرسانی</ActionButton>}/>
  <GlassCard className="freeCustomerFilters"><label><Search size={16}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="جستجو با نام، موبایل یا کد ملی"/></label><select value={city} onChange={event=>setCity(event.target.value)}><option value="">همه شهرها</option>{cities.map(value=><option key={value}>{value}</option>)}</select><Badge tone="purple">{filtered.length.toLocaleString("fa-IR")} مشتری آزاد</Badge></GlassCard>
  <TableCard title="فهرست مشتریان بدون مسئول" subtitle="انتخاب مشتری فقط برای کارشناسان فروش فعال است">
   {loading?<div className="freeCustomerLoading"><i/>در حال دریافت مشتریان...</div>:filtered.length?<div className="uiTableWrap"><table className="uiTable"><thead><tr><th>مشتری</th><th>موبایل</th><th>کد ملی</th><th>شهر</th><th>آدرس</th><th>تاریخ ورود</th><th>عملیات</th></tr></thead><tbody>{filtered.map(item=><tr key={item.id}><td><strong><UsersRound size={15}/>{item.name}</strong></td><td>{item.phone}</td><td>{item.nationalCode||"—"}</td><td><span><MapPin size={13}/>{item.city||"—"}</span></td><td>{item.address||"—"}</td><td>{new Date(item.createdAt).toLocaleDateString("fa-IR")}</td><td>{user?.role==="SALES"?<ActionButton disabled={claiming===item.id} onClick={()=>void claim(item.id)}><UserCheck size={14}/>{claiming===item.id?"در حال تخصیص...":"انتخاب مشتری"}</ActionButton>:<Badge tone="info">بدون مسئول</Badge>}</td></tr>)}</tbody></table></div>:<EmptyState title="مشتری آزادی پیدا نشد" description="تمام مشتریان موجود به کارشناسان تخصیص یافته‌اند."/>}
  </TableCard>
 </main>
}

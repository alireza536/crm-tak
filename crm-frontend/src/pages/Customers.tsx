import { useEffect, useMemo, useState } from "react";
import { Crown, Grid2X2, LayoutList, RefreshCw, Sparkles, Upload, UserRoundCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import CustomerCard from "../components/CustomerCard";
import AdminCustomerOwnership from "../components/AdminCustomerOwnership";
import { ActionButton, EmptyState, GlassCard, PageHeader, SearchBar, StatCard } from "../components/ui/DesignSystem";
import { getCustomers } from "../services/api";
import { getCurrentUser } from "../utils/auth";
import "./Customers.css";
import "./CustomersEnhancements.css";

type Customer={id:number|string;name?:string;phone?:string;personCode?:string|number;address?:string;city?:string;province?:string;status?:string;customerType?:string;createdAt?:string;lastPurchase?:string|null;totalSale?:number|string;invoiceCount?:number};
type Filter="ALL"|"ACTIVE"|"VIP"|"STALE";type Sort="SALE"|"INVOICE"|"NAME";
const fa=(value:unknown)=>Number(value||0).toLocaleString("fa-IR");
const PAGE_SIZE=48;
const filters:Array<{key:Filter;label:string}>=[{key:"ALL",label:"همه مشتریان"},{key:"ACTIVE",label:"مشتری فعال"},{key:"VIP",label:"مشتری VIP"},{key:"STALE",label:"بدون خرید اخیر"}];

export default function Customers(){
 const user=getCurrentUser(),isSales=user?.role==="SALES";
 const[customers,setCustomers]=useState<Customer[]>([]),[search,setSearch]=useState(""),[filter,setFilter]=useState<Filter>("ALL"),[sort,setSort]=useState<Sort>("SALE"),[view,setView]=useState<"grid"|"list">("grid"),[loading,setLoading]=useState(true),[error,setError]=useState(""),[page,setPage]=useState(1);
 const load=async()=>{try{setLoading(true);setError("");const data=await getCustomers();setCustomers(Array.isArray(data)?data:[])}catch{setError("دریافت مشتریان انجام نشد.");setCustomers([])}finally{setLoading(false)}};
 useEffect(()=>{void load()},[]);
 const stats=useMemo(()=>({total:customers.length,active:customers.filter(c=>["ACTIVE","ASSIGNED"].includes(String(c.status))).length,vip:customers.filter(c=>c.customerType==="VIP"||Number(c.totalSale||0)>=100_000_000).length,newCount:customers.filter(c=>c.createdAt&&+new Date(c.createdAt)>Date.now()-30*864e5).length}),[customers]);
 const filtered=useMemo(()=>{const query=search.trim().toLowerCase(),staleDate=Date.now()-90*864e5;return customers.filter(c=>{const match=!query||[c.name,c.phone,c.personCode].some(value=>String(value||"").toLowerCase().includes(query));const segment=filter==="ALL"||filter==="ACTIVE"&&["ACTIVE","ASSIGNED"].includes(String(c.status))||filter==="VIP"&&(c.customerType==="VIP"||Number(c.totalSale||0)>=100_000_000)||filter==="STALE"&&(!c.lastPurchase||+new Date(c.lastPurchase)<staleDate);return match&&segment}).sort((a,b)=>sort==="NAME"?String(a.name||"").localeCompare(String(b.name||""),"fa"):sort==="INVOICE"?Number(b.invoiceCount||0)-Number(a.invoiceCount||0):Number(b.totalSale||0)-Number(a.totalSale||0))},[customers,search,filter,sort]);
 useEffect(()=>{setPage(1)},[customers,search,filter,sort,view]);
 const pageCount=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)),visibleCustomers=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
 return <main className="customersPage executiveCustomers" dir="rtl">
  <PageHeader eyebrow="CUSTOMER MANAGEMENT" title={isSales?"مشتریان من":"مرکز مشتریان"} description={isSales?"مشتریان اختصاص‌یافته به شما و سوابق خرید آن‌ها":"مدیریت مشتریان و تحلیل خریدهای واقعی ثبت‌شده در CRM"} actions={!isSales?<Link className="uiAction secondary" to="/customers/upload"><Upload size={15}/> آپلود مشتریان</Link>:undefined}/>
  {!isSales&&<AdminCustomerOwnership/>}
  <section className="uiStats customerKpis"><StatCard loading={loading} tone="purple" title="کل مشتریان" value={fa(stats.total)} icon={<Users/>}/><StatCard loading={loading} tone="orange" title="مشتریان VIP" value={fa(stats.vip)} icon={<Crown/>}/><StatCard loading={loading} tone="green" title="مشتریان فعال" value={fa(stats.active)} icon={<UserRoundCheck/>}/><StatCard loading={loading} tone="cyan" title="مشتریان جدید" value={fa(stats.newCount)} hint="۳۰ روز اخیر" icon={<Sparkles/>}/></section>
  <GlassCard className="customerWorkspace"><div className="customerToolbar"><SearchBar value={search} onChange={event=>setSearch(event.target.value)} placeholder="جستجو با نام، شماره تلفن یا کد مشتری..."/><div><select value={sort} onChange={event=>setSort(event.target.value as Sort)}><option value="SALE">بیشترین خرید</option><option value="INVOICE">بیشترین فاکتور</option><option value="NAME">نام مشتری</option></select><span className="viewSwitch"><button className={view==="grid"?"active":""} onClick={()=>setView("grid")}><Grid2X2/></button><button className={view==="list"?"active":""} onClick={()=>setView("list")}><LayoutList/></button></span><ActionButton className="secondary" onClick={()=>void load()}><RefreshCw size={14}/></ActionButton></div></div><div className="customerSegmentFilters">{filters.map(item=><button type="button" key={item.key} className={filter===item.key?"active":""} onClick={()=>setFilter(item.key)}>{item.label}</button>)}</div><div className="customerResult"><span><strong>{fa(filtered.length)}</strong> مشتری نمایش داده می‌شود</span>{(search||filter!=="ALL")&&<button onClick={()=>{setSearch("");setFilter("ALL")}}>نمایش همه</button>}</div>{error?<EmptyState title="مشتریان بارگذاری نشدند" description={error}/>:loading?<div className={`customersCollection ${view}`}>{Array.from({length:6},(_,index)=><div className="customerSkeleton" key={index}/>)}</div>:filtered.length?<><div className={`customersCollection ${view}`}>{visibleCustomers.map((customer,index)=><div className="customerStagger" style={{animationDelay:`${index*.015}s`}} key={customer.id}><CustomerCard customer={customer} viewMode={view}/></div>)}</div>{pageCount>1&&<nav className="customerPagination" aria-label="صفحه‌بندی مشتریان"><button type="button" disabled={page===1} onClick={()=>setPage(current=>Math.max(1,current-1))}>قبلی</button><span>صفحه {fa(page)} از {fa(pageCount)}</span><button type="button" disabled={page===pageCount} onClick={()=>setPage(current=>Math.min(pageCount,current+1))}>بعدی</button></nav>}</>:<EmptyState title="مشتری‌ای پیدا نشد" description="عبارت جستجو یا فیلتر را تغییر دهید."/>}</GlassCard>
 </main>;
}

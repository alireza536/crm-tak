import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, RefreshCw, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { ActionButton, Badge, DataTable, EmptyState, PageHeader, SearchBar, TableCard } from "../components/ui/DesignSystem";
import { getCustomers } from "../services/api";
import "./MyCustomers.css";

type Customer = { id:number; name:string; storeName?:string|null; phone?:string|null; province?:string|null; city?:string|null; customerType?:string; status?:string; totalSale?:number; lastPurchase?:string|null; invoiceCount?:number };
const PAGE_SIZE=15;
const money=(value:unknown)=>`${Number(value||0).toLocaleString("fa-IR")} ریال`;
const date=(value?:string|null)=>value?new Date(value).toLocaleDateString("fa-IR"):"بدون خرید";

export default function MyCustomers(){
  const[items,setItems]=useState<Customer[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const[search,setSearch]=useState(""),[type,setType]=useState("ALL"),[province,setProvince]=useState("ALL"),[page,setPage]=useState(1);
  const load=async()=>{try{setLoading(true);setError("");const data=await getCustomers();setItems(Array.isArray(data)?data:[])}catch{setError("دریافت مشتریان شما انجام نشد.")}finally{setLoading(false)}};
  useEffect(()=>{void load()},[]);
  const types=useMemo(()=>[...new Set(items.map(x=>x.customerType).filter(Boolean))] as string[],[items]);
  const provinces=useMemo(()=>[...new Set(items.map(x=>x.province).filter(Boolean))] as string[],[items]);
  const filtered=useMemo(()=>{const q=search.trim().toLocaleLowerCase("fa");return items.filter(item=>(!q||[item.name,item.storeName,item.phone,item.city].some(v=>String(v||"").toLocaleLowerCase("fa").includes(q)))&&(type==="ALL"||item.customerType===type)&&(province==="ALL"||item.province===province))},[items,search,type,province]);
  useEffect(()=>setPage(1),[search,type,province]);
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)),visible=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  return <main className="myCustomers" dir="rtl">
    <PageHeader eyebrow="PERSONAL CUSTOMER WORKSPACE" title="مشتریان من" description="مشتریان اختصاص‌یافته به شما و خلاصه سوابق خرید آن‌ها" actions={<ActionButton className="secondary" onClick={()=>void load()}><RefreshCw size={15}/> بروزرسانی</ActionButton>}/>
    <TableCard title="فهرست مشتریان من" subtitle={`${filtered.length.toLocaleString("fa-IR")} مشتری`} action={<UsersRound size={20}/>}>
      <div className="myCustomerFilters"><SearchBar value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو با نام، فروشگاه، تلفن یا شهر..."/><select value={type} onChange={e=>setType(e.target.value)}><option value="ALL">همه انواع مشتری</option>{types.map(x=><option key={x}>{x}</option>)}</select><select value={province} onChange={e=>setProvince(e.target.value)}><option value="ALL">همه استان‌ها</option>{provinces.map(x=><option key={x}>{x}</option>)}</select></div>
      {loading?<div className="myCustomerLoading">در حال دریافت مشتریان...</div>:error?<EmptyState title="خطا در دریافت اطلاعات" description={error}/>:visible.length?<><DataTable><thead><tr><th>مشتری</th><th>فروشگاه</th><th>تلفن</th><th>مجموع خرید</th><th>آخرین خرید</th><th>تعداد فاکتور</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{visible.map(item=><tr key={item.id}><td><strong>{item.name}</strong><small>{[item.city,item.province].filter(Boolean).join("، ")||"—"}</small></td><td>{item.storeName||"—"}</td><td dir="ltr">{item.phone||"—"}</td><td className="myCustomerMoney">{money(item.totalSale)}</td><td>{date(item.lastPurchase)}</td><td>{Number(item.invoiceCount||0).toLocaleString("fa-IR")}</td><td><Badge tone={item.status==="ASSIGNED"?"success":"info"}>{item.status==="ASSIGNED"?"اختصاص‌یافته":item.status||"فعال"}</Badge></td><td><Link className="myCustomerView" to={`/customer/${item.id}`}><Eye size={15}/> مشاهده پرونده</Link></td></tr>)}</tbody></DataTable><footer className="myCustomerPagination"><span>صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span><div><button disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronRight/></button><button disabled={page===pages} onClick={()=>setPage(p=>p+1)}><ChevronLeft/></button></div></footer></>:<EmptyState title="مشتری اختصاص‌یافته‌ای پیدا نشد" description="از بخش مشتریان آزاد می‌توانید مشتری جدید انتخاب کنید."/>}
    </TableCard>
  </main>;
}

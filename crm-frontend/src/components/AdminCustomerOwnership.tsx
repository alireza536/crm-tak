import { useEffect, useState } from "react";
import { UserRoundCog, UserRoundMinus } from "lucide-react";
import { ActionButton, GlassCard } from "./ui/DesignSystem";
import { assignCustomer, getCustomers, getSalesUsers, releaseCustomer } from "../services/api";
import "./AdminCustomerOwnership.css";

type Customer={id:number;name:string;assignedTo?:{id:number;name:string}|null};
type SalesUser={id:number;name:string};
const notify=(type:"success"|"error",text:string)=>window.dispatchEvent(new CustomEvent("tak-toast",{detail:{type,text}}));

export default function AdminCustomerOwnership(){
 const[customers,setCustomers]=useState<Customer[]>([]),[users,setUsers]=useState<SalesUser[]>([]),[customerId,setCustomerId]=useState(""),[userId,setUserId]=useState(""),[busy,setBusy]=useState(false);
 const load=async()=>{const[c,u]=await Promise.all([getCustomers(),getSalesUsers()]);setCustomers(Array.isArray(c)?c:[]);setUsers(u);};
 useEffect(()=>{void load().catch(()=>notify("error","اطلاعات تخصیص مشتری دریافت نشد."))},[]);
 const assign=async()=>{if(!customerId||!userId)return notify("error","مشتری و کارشناس را انتخاب کنید.");try{setBusy(true);await assignCustomer(Number(customerId),Number(userId));await load();notify("success","کارشناس مشتری با موفقیت تغییر کرد.")}catch{notify("error","تخصیص مشتری انجام نشد.")}finally{setBusy(false)}};
 const release=async()=>{if(!customerId)return notify("error","ابتدا مشتری را انتخاب کنید.");try{setBusy(true);await releaseCustomer(Number(customerId));await load();notify("success","مشتری به فهرست مشتریان آزاد منتقل شد.")}catch{notify("error","حذف کارشناس مشتری انجام نشد.")}finally{setBusy(false)}};
 return <GlassCard className="adminOwnership"><header><UserRoundCog/><div><strong>مدیریت مالکیت مشتری</strong><small>تخصیص مجدد یا انتقال مشتری به فهرست آزاد</small></div></header><div><select value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">انتخاب مشتری</option>{customers.map(x=><option value={x.id} key={x.id}>{x.name}{x.assignedTo?.name?` — ${x.assignedTo.name}`:" — آزاد"}</option>)}</select><select value={userId} onChange={e=>setUserId(e.target.value)}><option value="">انتخاب کارشناس فروش</option>{users.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select><ActionButton disabled={busy} onClick={()=>void assign()}><UserRoundCog size={15}/> تخصیص / تغییر</ActionButton><ActionButton disabled={busy} className="secondary" onClick={()=>void release()}><UserRoundMinus size={15}/> حذف کارشناس</ActionButton></div></GlassCard>;
}

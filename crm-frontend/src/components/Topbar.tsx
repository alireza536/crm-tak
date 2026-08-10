import { useEffect, useRef, useState } from "react";
import { Bell, Command, Moon, Search, Sun, X } from "lucide-react";
import { getNotifications } from "../services/api";
import { getCurrentUser } from "../utils/auth";
import "./topbar.css";

export default function Topbar(){
  const user=getCurrentUser(); const searchRef=useRef<HTMLInputElement>(null);
  const [dark,setDark]=useState(localStorage.getItem("tak-crm-theme")!=="light");
  const [showNotifications,setShowNotifications]=useState(false); const [notifications,setNotifications]=useState<any[]>([]);
  useEffect(()=>{document.documentElement.classList.toggle("crmDark",dark);localStorage.setItem("tak-crm-theme",dark?"dark":"light")},[dark]);
  useEffect(()=>{void getNotifications().then(v=>setNotifications(Array.isArray(v)?v:[])).catch(()=>setNotifications([]))},[]);
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();searchRef.current?.focus()}};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler)},[]);
  const unread=notifications.filter(item=>!item.read).length;
  return <header className="executiveTopbar" dir="rtl">
    <div className="topBrand"><span>TAK</span><div><strong>TAK CRM</strong><small>مرکز فرماندهی فروش</small></div></div>
    <label className="executiveSearch"><Search size={17}/><input ref={searchRef} placeholder="جستجوی مشتری، فروش یا فاکتور..."/><kbd><Command size={11}/> K</kbd></label>
    <div className="topbarActions">
      <button className="themeToggle" type="button" onClick={()=>setDark(value=>!value)} aria-label="تغییر پوسته">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
      <div className="notificationWrap"><button className="notificationButton" type="button" onClick={()=>setShowNotifications(v=>!v)} aria-label="اعلان‌ها"><Bell size={18}/>{unread>0&&<i>{unread}</i>}</button>{showNotifications&&<div className="executiveNotifications"><header><strong>اعلان‌ها</strong><button onClick={()=>setShowNotifications(false)}><X size={15}/></button></header>{notifications.length?notifications.map(item=><div key={item.id}><span/ ><p><strong>{item.title}</strong><small>{item.message}</small></p></div>):<p className="noNotification">اعلان جدیدی وجود ندارد</p>}</div>}</div>
      <div className="executiveProfile"><span>{user?.name?.charAt(0)||"T"}</span><div><strong>{user?.name}</strong><small>{user?.role==="ADMIN"?"مدیر کل":"کارشناس فروش"}</small></div><i/></div>
    </div>
  </header>
}

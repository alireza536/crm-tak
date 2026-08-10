import { useState, type ComponentType } from "react";
import { BarChart3, ChevronDown, ChevronLeft, CircleHelp, CreditCard, FileBarChart, FileCheck2, FileText, FileUp, Gauge, Headphones, LogOut, Menu, Settings, ShoppingCart, SlidersHorizontal, UserCog, UserPlus, Users, UsersRound, WalletCards, X } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getCurrentUser, type UserRole } from "../utils/auth";
import "./Sidebar.css";

type Item={title:string;path?:string;icon:ComponentType<{size?:number}>;roles:UserRole[];soon?:boolean;children?:Item[]};
const menu:Item[]=[
 {title:"داشبورد",path:"/",icon:Gauge,roles:["ADMIN","SALES"]},
 {title:"مشتریان",icon:Users,roles:["ADMIN","SALES"],children:[
   {title:"همه مشتریان",path:"/customers",icon:Users,roles:["ADMIN","SALES"]},
   {title:"مشتریان آزاد",path:"/customers/free",icon:UsersRound,roles:["ADMIN","SALES"]},
   {title:"آپلود مشتریان",path:"/customers/upload",icon:UserPlus,roles:["ADMIN"]},
 ]},
 {title:"فروش‌ها",path:"/sales",icon:ShoppingCart,roles:["ADMIN","SALES"]},
 {title:"پیش‌فاکتورها",path:"/quotations",icon:FileCheck2,roles:["ADMIN","SALES"]},
 {title:"فاکتورها",path:"/invoices",icon:FileText,roles:["ADMIN","SALES"]},
 {title:"پرداخت‌ها",path:"/payments",icon:CreditCard,roles:["ADMIN","SALES"]},
 {title:"گزارش مالی",path:"/financial-reports",icon:WalletCards,roles:["ADMIN","SALES"]},
 {title:"پیگیری‌ها",path:"/follow-ups",icon:CircleHelp,roles:["SALES"]},
 {title:"گزارش فروش",icon:FileBarChart,roles:["ADMIN","SALES"],children:[
   {title:"مشاهده گزارش‌ها",path:"/reports",icon:FileBarChart,roles:["ADMIN","SALES"]},
   {title:"Upload Sales",path:"/reports/upload",icon:FileUp,roles:["ADMIN"]},
 ]},
 {title:"کارشناسان",path:"/agents",icon:UsersRound,roles:["ADMIN"]},
 {title:"تنظیمات",path:"/settings",icon:Settings,roles:["ADMIN","SALES"]},
 {title:"مدیریت کاربران",path:"/users",icon:UserCog,roles:["ADMIN"]},
 {title:"پشتیبانی",icon:Headphones,roles:["ADMIN","SALES"],soon:true},
];
export default function Sidebar(){
 const user=getCurrentUser(),location=useLocation(),navigate=useNavigate();
 const [collapsed,setCollapsed]=useState(false),[open,setOpen]=useState(false),[reportsOpen,setReportsOpen]=useState(location.pathname.startsWith("/reports")),[customersOpen,setCustomersOpen]=useState(location.pathname.startsWith("/customer"));
 const active=(path?:string)=>path?path==="/"?location.pathname==="/":location.pathname===path:false;
 const logout=()=>{clearSession();navigate("/login",{replace:true})};
 const renderLink=(item:Item,child=false)=>{const Icon=item.icon;return <NavLink key={item.title} to={item.path!} onClick={()=>setOpen(false)} className={"crmMenuItem "+(child?"crmSubMenuItem ":"")+(active(item.path)?"active":"")}><span><Icon size={17}/></span><strong>{item.title}</strong><ChevronLeft className="crmMenuArrow" size={13}/></NavLink>};
 return <><button className="crmMobileMenu" onClick={()=>setOpen(true)}><Menu/></button>{open&&<button className="crmSidebarOverlay" onClick={()=>setOpen(false)}/>}<aside className={"crmSidebar "+(collapsed?"collapsed ":"")+(open?"mobileOpen":"")} dir="rtl">
  <div className="crmBrand"><div className="crmBrandMark"><BarChart3/></div><div className="crmBrandInfo"><strong>TAK CRM</strong><small>EXECUTIVE SUITE</small></div><button className="crmMobileClose" onClick={()=>setOpen(false)}><X/></button></div>
  <div className="crmAccount"><span>{user?.name?.charAt(0)||"T"}</span><div><strong>{user?.name}</strong><small>{user?.role==="ADMIN"?"مدیر کل":"کارشناس فروش"}</small></div><i/></div>
  <p className="crmMenuTitle">فضای کاری</p><nav className="crmMenu">{menu.filter(item=>user&&item.roles.includes(user.role)).map(item=>{
   const Icon=item.icon;
   if(item.children){const children=item.children.filter(child=>user&&child.roles.includes(user.role)),isCustomers=item.title==="مشتریان",isOpen=isCustomers?customersOpen:reportsOpen,toggle=isCustomers?setCustomersOpen:setReportsOpen;return <div className={"crmMenuGroup "+(isOpen?"open":"")} key={item.title}><button className="crmMenuItem crmMenuGroupButton" onClick={()=>toggle(value=>!value)}><span><Icon size={17}/></span><strong>{item.title}</strong><ChevronDown className="crmGroupChevron" size={14}/></button>{isOpen&&<div className="crmSubMenu">{children.map(child=>renderLink(child,true))}</div>}</div>}
   if(item.path)return renderLink(item);
   return <div key={item.title} className="crmMenuItem disabled"><span><Icon size={17}/></span><strong>{item.title}</strong><small>به‌زودی</small></div>;
  })}</nav>
  <div className="crmSidebarFooter"><button className="crmLogout" onClick={logout}><span><LogOut size={17}/></span><strong>خروج از حساب</strong></button><button className="crmCollapse" onClick={()=>setCollapsed(value=>!value)}><SlidersHorizontal size={15}/><span>{collapsed?"باز کردن منو":"جمع کردن منو"}</span></button></div>
 </aside></>;
}

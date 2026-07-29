import { useEffect, useMemo, useRef, useState } from "react";

import {
  FaBell,
  FaChevronDown,
  FaFileArrowUp,
  FaFileInvoice,
  FaMagnifyingGlass,
  FaMessage,
  FaMoon,
  FaPlus,
  FaSun,
  FaUserPlus,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";

import { Link, useLocation } from "react-router-dom";

import { getNotifications } from "../services/api";

import "./topbar.css";


type OpenMenu =
  | "notifications"
  | "quick"
  | "profile"
  | null;



const pageMap: Record<string,{title:string,parent:string}> = {

  "/":
  {
    title:"داشبورد",
    parent:"مدیریت"
  },

  "/customers":
  {
    title:"مشتریان",
    parent:"مدیریت ارتباط با مشتری"
  },

  "/invoices":
  {
    title:"فاکتورها",
    parent:"فروش"
  },

  "/pipeline":
  {
    title:"قیف فروش",
    parent:"فروش"
  },

  "/follow-up":
  {
    title:"مرکز پیگیری",
    parent:"مدیریت مشتری"
  },

  "/sms":
  {
    title:"پیامک",
    parent:"بازاریابی"
  },

  "/settings":
  {
    title:"تنظیمات",
    parent:"سیستم"
  }

};



export default function Topbar(){


const location = useLocation();

const wrapperRef =
useRef<HTMLElement|null>(null);



const [openMenu,setOpenMenu]
=
useState<OpenMenu>(null);



const [darkMode,setDarkMode]
=
useState(
localStorage.getItem("tak-crm-theme")==="dark"
);



const [notifications,setNotifications]
=
useState<any[]>([]);



const [unreadCount,setUnreadCount]
=
useState(0);



const page =
useMemo(()=>{


return pageMap[location.pathname]
||
{
title:"TAK CRM",
parent:"پنل مدیریت"
};


},[location.pathname]);






useEffect(()=>{


document.documentElement.classList.toggle(
"crmDark",
darkMode
);


localStorage.setItem(
"tak-crm-theme",
darkMode ? "dark":"light"
);


},[darkMode]);






useEffect(()=>{


async function load(){


try{


const data =
await getNotifications();



setNotifications(data || []);



setUnreadCount(
(data || [])
.filter((x:any)=>!x.read)
.length
);



}catch(e){

console.log(e);

}


}



load();



const timer =
setInterval(
load,
30000
);



return ()=>clearInterval(timer);



},[]);







useEffect(()=>{


const close=(e:MouseEvent)=>{


if(
wrapperRef.current &&
!wrapperRef.current.contains(
e.target as Node
)
){

setOpenMenu(null);

}


};


document.addEventListener(
"mousedown",
close
);


return ()=>{

document.removeEventListener(
"mousedown",
close
);

};


},[]);








const today =
new Intl.DateTimeFormat(
"fa-IR",
{
weekday:"long",
day:"numeric",
month:"long",
year:"numeric"
}
)
.format(new Date());







return (

<header
className="globalTopbar"
ref={wrapperRef}
>


<div className="topbarPageInfo">


<div className="topbarBreadcrumb">

<span>
{page.parent}
</span>

<i>/</i>

<strong>
{page.title}
</strong>

</div>



<div className="topbarPageTitle">

<h1>
{page.title}
</h1>


<span>
{today}
</span>


</div>



</div>





<div className="topbarTools">





<label className="globalSearch">

<FaMagnifyingGlass/>

<input
placeholder="جستجوی مشتری، فاکتور یا شماره تماس..."
/>

<kbd>
Ctrl K
</kbd>

</label>







<button
className="topbarIconButton themeButton"
onClick={()=>setDarkMode(!darkMode)}
>

{
darkMode
?
<FaSun/>
:
<FaMoon/>
}

</button>









<div className="topbarDropdownWrapper">


<button

className={
`topbarIconButton ${
openMenu==="notifications"
?
"active"
:
""
}`}

onClick={()=>
setOpenMenu(
openMenu==="notifications"
?
null
:
"notifications"
)
}

>


<FaBell/>


{
unreadCount>0 &&
<span className="notificationDot">

{unreadCount}

</span>

}



</button>






{
openMenu==="notifications" &&


<div className="topbarDropdown notificationDropdown">


<div className="dropdownHeader">


<strong>
اعلان‌ها
</strong>



<button
onClick={()=>setOpenMenu(null)}
>

<FaXmark/>

</button>


</div>






<div className="notificationList">



{

notifications.length===0

?

<div className="emptyNotification">

اعلان جدیدی وجود ندارد

</div>


:


notifications.map((item:any)=>(


<button

key={item.id}

className={
`notificationItem ${
item.read
?
""
:
"important"
}`
}


>


<span className="notificationIcon">


{
item.type==="customer"
?
<FaUsers/>
:
item.type==="invoice"
?
<FaFileInvoice/>
:
<FaMessage/>
}


</span>



<span>


<strong>
{item.title}
</strong>



<small>
{item.message}
</small>



<time>
{item.time}
</time>



</span>



</button>



))


}



</div>






<button className="dropdownFooterButton">

مشاهده همه اعلان‌ها

</button>



</div>


}



</div>








<div className="topbarDropdownWrapper">


<button
className="quickAddButton"
onClick={()=>
setOpenMenu(
openMenu==="quick"
?
null
:
"quick"
)
}
>


<FaPlus/>

افزودن سریع


<FaChevronDown/>


</button>



{
openMenu==="quick" &&


<div className="topbarDropdown quickDropdown">


<Link to="/customers">

<FaUserPlus/>

مشتری جدید

</Link>



<Link to="/invoices">

<FaFileInvoice/>

فاکتور جدید

</Link>



<Link to="/upload">

<FaFileArrowUp/>

ورود فایل فروش

</Link>



<Link to="/sms">

<FaMessage/>

پیامک

</Link>



</div>


}



</div>







</div>



</header>


);


}
import { useNavigate } from "react-router-dom";

import {
  FaBullhorn,
  FaUsers,
  FaChartLine,
  FaMoneyBillTrendUp,
  FaPaperPlane,
  FaCartShopping,
  FaArrowPointer,
  FaPlus,
  FaRobot,
} from "react-icons/fa6";

import "./Campaigns.css";


const stats = [
  {
    title:"کمپین فعال",
    value:"24",
    text:"+5 امروز",
    icon:<FaBullhorn/>
  },
  {
    title:"مخاطب هدف",
    value:"12,580",
    text:"+18%",
    icon:<FaUsers/>
  },
  {
    title:"نرخ تبدیل",
    value:"74%",
    text:"+12%",
    icon:<FaChartLine/>
  },
  {
    title:"فروش ایجاد شده",
    value:"285M",
    text:"+23%",
    icon:<FaMoneyBillTrendUp/>
  }
];



const campaigns=[
{
id:1,
name:"جشنواره تابستان TAK",
channel:"اینستاگرام + پیامک",
users:"5200",
sales:"120M",
status:"فعال"
},
{
id:2,
name:"بازگشت مشتری قدیمی",
channel:"پیام هدفمند",
users:"3200",
sales:"75M",
status:"در حال اجرا"
}
];




export default function Campaigns(){

const navigate=useNavigate();



function runCampaign(){

alert(
"کمپین بازگشت مشتری با موفقیت اجرا شد"
);

}



return (

<div className="campaignPage">


<section className="campaignHero">

<div>

<h1>
کمپین فروش
</h1>

<p>
مدیریت تبلیغات، مشتریان هدف و تحلیل عملکرد کمپین‌ها
</p>

</div>


<button
onClick={()=>navigate("/campaign-create")}
>

<FaPlus/>

کمپین جدید

</button>


</section>





<section className="statsGrid">

{
stats.map((item,index)=>(

<div
className="statCard"
key={index}
onClick={()=>navigate("/reports")}
>


<div className="statIcon">

{item.icon}

</div>


<div>

<span>
{item.title}
</span>


<h2>
{item.value}
</h2>


<small>
{item.text}
</small>


</div>


</div>

))

}

</section>






<section className="chartBox">


<h2>
روند کمپین‌ها
</h2>


<div className="bars">

<div style={{height:"65%"}}/>
<div style={{height:"45%"}}/>
<div style={{height:"85%"}}/>
<div style={{height:"55%"}}/>
<div style={{height:"95%"}}/>
<div style={{height:"70%"}}/>

</div>


</section>







<div className="bottomGrid">



<section className="performance">


<h2>
عملکرد امروز
</h2>


<div className="performanceItems">


<div>
<FaPaperPlane/>
<h3>8420</h3>
<p>ارسال پیام</p>
</div>



<div>
<FaArrowPointer/>
<h3>2460</h3>
<p>کلیک</p>
</div>



<div>
<FaCartShopping/>
<h3>58</h3>
<p>فروش</p>
</div>


</div>


</section>








<section className="campaignList">


<h2>
آخرین کمپین‌ها
</h2>



{
campaigns.map(item=>(


<div
className="campaignRow"
key={item.id}
onClick={()=>navigate(`/campaign/${item.id}`)}
>


<div>

<strong>
{item.name}
</strong>


<p>
{item.channel}
</p>


</div>


<div>
{item.users}
<br/>
<small>
مخاطب
</small>
</div>



<div>
{item.sales}
<br/>
<small>
فروش
</small>
</div>



<span className={
item.status==="فعال"
?
"active"
:
"pending"
}>

{item.status}

</span>


</div>


))

}


</section>


</div>







<section className="aiBox">


<div>

<FaRobot/>


<h3>
پیشنهاد هوشمند AI
</h3>


<p>
120 مشتری قدیمی آماده خرید مجدد هستند.
</p>


</div>


<button
onClick={runCampaign}
>

اجرای کمپین

</button>


</section>



</div>

)


}
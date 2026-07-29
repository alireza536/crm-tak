import {
  FaChartLine,
  FaUsers,
  FaMoneyBillTrendUp,
  FaFire,
  FaArrowTrendUp,
  FaCircleCheck,
  FaClock
} from "react-icons/fa6";

import "./SalesIntelligence.css";


const cards = [
  {
    title:"فرصت‌های فعال",
    value:"128",
    change:"+18%",
    icon:<FaFire/>
  },
  {
    title:"ارزش فرصت‌ها",
    value:"850M",
    change:"+12%",
    icon:<FaMoneyBillTrendUp/>
  },
  {
    title:"نرخ تبدیل",
    value:"74%",
    change:"+8%",
    icon:<FaChartLine/>
  },
  {
    title:"مشتریان آماده خرید",
    value:"46",
    change:"+5",
    icon:<FaUsers/>
  }
];


const customers=[
  {
    name:"شرکت آریا",
    chance:"95%",
    value:"120M"
  },
  {
    name:"موبایل پارس",
    chance:"88%",
    value:"75M"
  },
  {
    name:"فروشگاه تک",
    chance:"82%",
    value:"60M"
  }
];



export default function SalesIntelligence(){


return (

<div className="insightPage">


<section className="insightHero">

<div>

<h1>
هوش فروش
</h1>

<p>
تحلیل رفتار مشتریان، فرصت‌های فروش و پیش‌بینی درآمد
</p>

</div>


<button>
مشاهده گزارش‌ها
</button>


</section>





<div className="insightCards">


{
cards.map((item,index)=>(

<div className="insightCard" key={index}>


<div className="iconBox">
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
{item.change}
</small>


</div>


</div>


))
}


</div>





<div className="insightGrid">



<div className="panel chartPanel">


<h3>
پیش‌بینی فروش ماه آینده
</h3>


<div className="bars">


<div style={{height:"70%"}}>
<span>مرداد</span>
</div>

<div style={{height:"85%"}}>
<span>شهریور</span>
</div>


<div style={{height:"55%"}}>
<span>مهر</span>
</div>


<div style={{height:"90%"}}>
<span>آبان</span>
</div>


<div style={{height:"75%"}}>
<span>آذر</span>
</div>


</div>


</div>






<div className="panel warningPanel">


<h3>
هشدارهای فروش
</h3>



<div className="warning green">

<FaCircleCheck/>

<div>
<strong>
مشتریان وفادار
</strong>

<p>
25 مشتری آماده سفارش مجدد
</p>

</div>

</div>



<div className="warning orange">

<FaClock/>

<div>

<strong>
فرصت‌های در انتظار
</strong>

<p>
12 مشتری بدون پیگیری
</p>

</div>

</div>



</div>



</div>






<div className="panel tablePanel">


<h3>
مشتریان با بیشترین احتمال خرید
</h3>


<table>

<thead>

<tr>

<th>
مشتری
</th>

<th>
احتمال خرید
</th>

<th>
ارزش
</th>

</tr>

</thead>


<tbody>


{
customers.map((c,i)=>(

<tr key={i}>

<td>
{c.name}
</td>

<td>
<span className="percent">
{c.chance}
</span>
</td>


<td>
{c.value}
</td>


</tr>


))
}


</tbody>

</table>


</div>



</div>


)


}
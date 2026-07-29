import {
  FaUsers,
  FaPhone,
  FaHandshake,
  FaCircleCheck,
  FaPlus,
  FaMoneyBillTrendUp,
} from "react-icons/fa6";

import "./SalesPipeline.css";


const stages = [
  {
    title: "سرنخ‌های جدید",
    count: "320",
    amount: "450M",
    icon: <FaUsers />,
  },
  {
    title: "تماس گرفته شده",
    count: "180",
    amount: "280M",
    icon: <FaPhone />,
  },
  {
    title: "مذاکره",
    count: "95",
    amount: "190M",
    icon: <FaHandshake />,
  },
  {
    title: "موفق",
    count: "42",
    amount: "120M",
    icon:<FaCircleCheck />
  },
];


export default function SalesPipeline() {

return (

<div className="pipelinePage">


<section className="pipelineHero">

<div>
<h1>قیف فروش</h1>

<p>
مدیریت فرصت‌های فروش، مراحل معامله و پیگیری مشتریان
</p>

</div>


<button>
<FaPlus/>
 فرصت جدید
</button>


</section>





<section className="pipelineStats">


<div className="pipelineStat">

<FaMoneyBillTrendUp/>

<div>
<span>ارزش کل فرصت‌ها</span>
<b>1.2B</b>
</div>

</div>


<div className="pipelineStat">

<FaUsers/>

<div>
<span>مشتریان فعال</span>
<b>320</b>
</div>

</div>


<div className="pipelineStat">

<FaHandshake/>

<div>
<span>معاملات باز</span>
<b>95</b>
</div>

</div>


<div className="pipelineStat">

<FaCircleCheck />

<div>
<span>فروش موفق</span>
<b>42</b>
</div>

</div>


</section>






<section className="pipelineBoard">


<h2>
مراحل فروش
</h2>



<div className="pipelineColumns">


{
stages.map((stage,index)=>(


<div className="pipelineColumn" key={index}>


<div className="columnTitle">

{stage.icon}

<h3>
{stage.title}
</h3>

</div>



<div className="dealCard">

<strong>
فروشگاه TAK
</strong>


<p>
مبلغ معامله:
{stage.amount}
</p>


<span>
{stage.count} مشتری
</span>


</div>




<div className="dealCard">

<strong>
مشتری جدید
</strong>


<p>
پیگیری در انتظار
</p>


<span>
امروز
</span>


</div>



</div>



))
}



</div>


</section>



</div>


);

}
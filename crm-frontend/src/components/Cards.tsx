import "./Cards.css";

import {
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaSms,
} from "react-icons/fa";

import { useEffect, useState } from "react";

import { getDashboard } from "../services/api";

export default function Cards() {

  const [data, setData] = useState({

    customers:0,

    sales:0,

    profit:0,

    sms:0,

  });

  useEffect(()=>{

    load();

  },[]);

  async function load(){

    const result=await getDashboard();

    setData(result);

  }

  const cards=[

    {

      title:"مشتریان",

      value:data.customers,

      icon:<FaUsers/>,

      color:"#0F6A47",

      growth:"+12%"

    },

    {

      title:"فروش کل",

      value:Number(data.sales).toLocaleString(),

      icon:<FaMoneyBillWave/>,

      color:"#219653",

      growth:"+8%"

    },

    {

      title:"سود",

      value:Number(data.profit).toLocaleString(),

      icon:<FaChartLine/>,

      color:"#27AE60",

      growth:"+5%"

    },

    {

      title:"پیامک",

      value:data.sms,

      icon:<FaSms/>,

      color:"#16A085",

      growth:"0%"

    }

  ];

  return(

<div className="cards">

{

cards.map((item,index)=>(

<div

className="dashboardCard"

key={index}

>

<div

className="iconBox"

style={{

background:item.color

}}

>

{item.icon}

</div>

<div className="cardContent">

<h4>

{item.title}

</h4>

<h2>

{item.value}

</h2>

<span>

▲ {item.growth}

</span>

</div>

</div>

))

}

</div>

  );

}
import { useEffect, useState } from "react";
import { ChartNoAxesCombined, MessageSquareText, TrendingUp, UsersRound } from "lucide-react";
import { getDashboard } from "../services/api";
import { StatCard } from "./ui/DesignSystem";
import "./Cards.css";

export default function Cards(){
  const [data,setData]=useState({customers:0,sales:0,profit:0,sms:0});
  const [loading,setLoading]=useState(true);
  useEffect(()=>{getDashboard().then(setData).finally(()=>setLoading(false))},[]);
  return <section className="uiStats cards">
    <StatCard loading={loading} tone="blue" title="مشتریان" value={data.customers} icon={<UsersRound/>}/>
    <StatCard loading={loading} tone="green" title="فروش کل" value={`${Number(data.sales).toLocaleString("fa-IR")} ریال`} icon={<TrendingUp/>}/>
    <StatCard loading={loading} tone="purple" title="سود" value={`${Number(data.profit).toLocaleString("fa-IR")} ریال`} icon={<ChartNoAxesCombined/>}/>
    <StatCard loading={loading} tone="cyan" title="پیامک" value={data.sms} icon={<MessageSquareText/>}/>
  </section>;
}

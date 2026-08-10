import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, CalendarRange, FileText, ReceiptText, RefreshCw, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActionButton, ChartCard, EmptyState, GlassCard, PageHeader, StatCard } from "../components/ui/DesignSystem";
import { getReportCharts, getReportSummary } from "../services/api";
import { getCurrentUser } from "../utils/auth";
import "./ReportsCenter.css";

type Period = "today" | "week" | "month" | "year" | "custom";
type Summary = { totalSalesAmount:number; totalInvoices:number; totalCustomers:number; totalProducts:number };
type Point = { key:string; label:string; revenue:number; invoices:number };
type Charts = {
  dailySales:Point[]; monthlySales:Point[]; yearlySales:Point[];
  salespersonPerformance:Array<{userId:number;name:string;revenue:number;sales:number}>;
  customerRanking:Array<{customerId:number;name:string;revenue:number;sales:number}>;
};

const emptySummary:Summary={totalSalesAmount:0,totalInvoices:0,totalCustomers:0,totalProducts:0};
const emptyCharts:Charts={dailySales:[],monthlySales:[],yearlySales:[],salespersonPerformance:[],customerRanking:[]};
const fa=(value:unknown)=>Number(value||0).toLocaleString("fa-IR");
const money=(value:unknown)=>`${fa(value)} ریال`;
const tooltipStyle={background:"#10182c",border:"1px solid rgba(139,92,246,.28)",borderRadius:12,color:"#f4f7ff"};
const labels:Record<Period,string>={today:"امروز",week:"هفته جاری",month:"ماه جاری",year:"سال جاری",custom:"بازه سفارشی"};
const dateValue=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
function periodRange(period:Period,customStart:string,customEnd:string){
  const now=new Date(),start=new Date(now),end=new Date(now);
  if(period==="today")start.setHours(0,0,0,0);
  if(period==="week"){start.setDate(start.getDate()-((start.getDay()+1)%7));start.setHours(0,0,0,0)}
  if(period==="month"){start.setDate(1);start.setHours(0,0,0,0)}
  if(period==="year"){start.setMonth(0,1);start.setHours(0,0,0,0)}
  return {start:period==="custom"?customStart:dateValue(start),end:period==="custom"?customEnd:dateValue(end)};
}

export default function ReportsCenter(){
  const user=getCurrentUser();
  const [period,setPeriod]=useState<Period>("month");
  const [customStart,setCustomStart]=useState("");
  const [customEnd,setCustomEnd]=useState("");
  const [summary,setSummary]=useState<Summary>(emptySummary);
  const [charts,setCharts]=useState<Charts>(emptyCharts);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const range=useMemo(()=>periodRange(period,customStart,customEnd),[period,customStart,customEnd]);
  const trendData=period==="year"?charts.monthlySales:charts.dailySales;
  const trendLabel=period==="year"?"روند ماهانه فروش":"روند روزانه فروش";
  const averageInvoice=summary.totalInvoices?summary.totalSalesAmount/summary.totalInvoices:0;
  const hasSales=summary.totalInvoices>0;

  const load=useCallback(async()=>{
    if(period==="custom"&&(!range.start||!range.end))return;
    try{
      setLoading(true);setError("");
      const [summaryData,chartData]=await Promise.all([getReportSummary(range.start,range.end),getReportCharts(range.start,range.end)]);
      setSummary(summaryData);setCharts(chartData);
    }catch(e){console.error(e);setError("دریافت گزارش‌های فروش انجام نشد.")}
    finally{setLoading(false)}
  },[period,range.start,range.end]);

  useEffect(()=>{void load();const refresh=()=>void load();window.addEventListener("tak:sales-imported",refresh);return()=>window.removeEventListener("tak:sales-imported",refresh)},[load]);

  const noData=<EmptyState title="داده فروش برای این بازه وجود ندارد" description="بازه دیگری انتخاب کنید یا گزارش فروش جدیدی وارد کنید."/>;
  return <main className="reportsPage executiveReports" dir="rtl">
    <PageHeader eyebrow="EXECUTIVE SALES ANALYTICS" title="مرکز گزارش‌های فروش" description={user?.role==="ADMIN"?"تحلیل اجرایی تمام فروش‌های ثبت‌شده سازمان":"تحلیل فروش‌های شخصی ثبت‌شده شما"} actions={<ActionButton className="secondary" onClick={()=>void load()} disabled={loading}><RefreshCw className={loading?"spin":""} size={15}/> بروزرسانی</ActionButton>}/>
    <GlassCard className="reportControls">
      <div className="periodSelector">{(Object.keys(labels) as Period[]).map(key=><button type="button" key={key} className={period===key?"active":""} onClick={()=>setPeriod(key)}>{labels[key]}</button>)}</div>
      {period==="custom"&&<div className="customDates"><label>از<input type="date" value={customStart} onChange={event=>setCustomStart(event.target.value)}/></label><label>تا<input type="date" value={customEnd} onChange={event=>setCustomEnd(event.target.value)}/></label></div>}
      <span className="reportDatabaseBadge"><CalendarRange/> داده زنده دیتابیس</span>
    </GlassCard>
    {error?<EmptyState title="گزارش بارگذاری نشد" description={error}/>:<>
      <section className="uiStats reportKpis">
        <StatCard loading={loading} tone="green" title="فروش کل" value={money(summary.totalSalesAmount)} hint={labels[period]} icon={<Banknote/>} data={trendData.map(point=>point.revenue)}/>
        <StatCard loading={loading} tone="orange" title="تعداد فاکتور" value={fa(summary.totalInvoices)} hint="فاکتور ثبت‌شده" icon={<FileText/>} data={trendData.map(point=>point.invoices)}/>
        <StatCard loading={loading} tone="blue" title="تعداد مشتری" value={fa(summary.totalCustomers)} hint="مشتری خریدار یکتا" icon={<Users/>}/>
        <StatCard loading={loading} tone="purple" title="میانگین مبلغ فاکتور" value={money(averageInvoice)} hint="فروش کل ÷ تعداد فاکتور" icon={<ReceiptText/>}/>
      </section>
      {!loading&&!hasSales?<GlassCard className="reportGlobalEmpty">{noData}</GlassCard>:<section className="reportExecutiveCharts">
        <ChartCard title={trendLabel} subtitle={labels[period]}><div className="reportChartBox">{trendData.length?<ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><defs><linearGradient id="salesExecutiveArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22d3ee" stopOpacity=".5"/><stop offset="1" stopColor="#3b82f6" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="3 8" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill:"#8793ad",fontSize:9}}/><YAxis hide/><Tooltip contentStyle={tooltipStyle} formatter={value=>[money(value),"فروش"]}/><Area type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={3} fill="url(#salesExecutiveArea)" activeDot={{r:6}}/></AreaChart></ResponsiveContainer>:noData}</div></ChartCard>
        <ChartCard title="عملکرد کارشناسان فروش" subtitle="مقایسه درآمد"><div className="reportChartBox">{charts.salespersonPerformance.length?<ResponsiveContainer width="100%" height="100%"><BarChart data={charts.salespersonPerformance.slice(0,10)}><CartesianGrid strokeDasharray="3 8" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:"#8793ad",fontSize:9}}/><YAxis hide/><Tooltip contentStyle={tooltipStyle} formatter={value=>[money(value),"فروش"]}/><Bar dataKey="revenue" fill="#8b5cf6" radius={[8,8,0,0]} barSize={22}/></BarChart></ResponsiveContainer>:noData}</div></ChartCard>
        <ChartCard title="رتبه‌بندی مشتریان" subtitle="بر اساس مبلغ خرید"><div className="reportCustomerChart">{charts.customerRanking.length?<ResponsiveContainer width="100%" height="100%"><BarChart data={charts.customerRanking.slice(0,10)} layout="vertical" margin={{left:10}}><CartesianGrid strokeDasharray="3 8" horizontal={false}/><XAxis type="number" hide/><YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} tick={{fill:"#aab4c9",fontSize:9}}/><Tooltip contentStyle={tooltipStyle} formatter={value=>[money(value),"خرید"]}/><Bar dataKey="revenue" fill="#22d3ee" radius={[8,8,8,8]} barSize={14}/></BarChart></ResponsiveContainer>:noData}</div></ChartCard>
        <ChartCard title="آمار فاکتورها" subtitle="تعداد فاکتور در بازه"><div className="reportCustomerChart">{trendData.length?<ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><defs><linearGradient id="invoiceExecutiveArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a78bfa" stopOpacity=".55"/><stop offset="1" stopColor="#a78bfa" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="3 8" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill:"#8793ad",fontSize:9}}/><YAxis hide/><Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="invoices" name="فاکتور" stroke="#a78bfa" strokeWidth={3} fill="url(#invoiceExecutiveArea)"/></AreaChart></ResponsiveContainer>:noData}</div></ChartCard>
      </section>}
    </>}
  </main>;
}

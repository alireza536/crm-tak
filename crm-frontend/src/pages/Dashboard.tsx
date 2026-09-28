import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Award, Banknote, CalendarDays, CheckCircle2, CircleDollarSign, CreditCard, Percent, ReceiptText, RefreshCw, TrendingUp, UserRoundCheck, UserRoundPlus, UsersRound } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  getCustomers,
  getFinancialChart,
  getFinancialSummary,
  getInvoices,
  getPayments,
  getReportCharts,
  getRoleDashboard,
  getSales,
  type FinancialChartPoint,
  type FinancialSummary,
  type InvoiceRecord,
  type PaymentRecord,
} from "../services/api";
import { ChartCard, EmptyState, GlassCard, StatCard } from "../components/ui/DesignSystem";
import { getCurrentUser } from "../utils/auth";
import "./Dashboard.css";
import "./DashboardLayout.css";

type Customer = { id: number; name: string; assignedToId?: number | null; assignedTo?: { id: number } | null };
type Sale = { id: number; amount: number | string; createdAt: string; userId?: number; user?: { id: number }; salesperson?: { id: number } };
type ReportPoint = { key: string; label: string; revenue: number; invoices: number };
type ReportCharts = { dailySales: ReportPoint[]; monthlySales: ReportPoint[]; yearlySales: ReportPoint[] };
type DashboardData = {
  summary?: {
    totalCustomers?: number; freeCustomers?: number; assignedCustomers?: number;
    totalSales?: number; totalInvoices?: number; totalPayments?: number; totalRevenue?: number;
    personalSales?: number; personalInvoices?: number; personalPayments?: number;
    personalRevenue?: number; receivedPayments?: number; convertedCustomers?: number; conversionRate?: number;
    todayFollowUps?: number; overdueFollowUps?: number; completedFollowUps?: number;
    bestSalesperson?: string|null;
  };
  salesPerformance?: Array<{ userId: number; name: string; salesCount: number; revenue: number }>;
};

const number = (value: unknown) => Number(value || 0);
const fa = (value: unknown) => number(value).toLocaleString("fa-IR");
const money = (value: unknown) => `${fa(value)} ریال`;
const toast = (text: string) => window.dispatchEvent(new CustomEvent("tak-toast", { detail: { type: "error", text } }));

export default function Dashboard() {
  const user = getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [financialChart, setFinancialChart] = useState<FinancialChartPoint[]>([]);
  const [reportCharts, setReportCharts] = useState<ReportCharts | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [welcomeState, setWelcomeState] = useState<"visible" | "leaving" | "hidden">(() =>
    window.sessionStorage.getItem("tak-dashboard-welcome-seen") ? "hidden" : "visible",
  );

  useEffect(() => {
    if (welcomeState === "hidden") return;
    window.sessionStorage.setItem("tak-dashboard-welcome-seen", "1");
    const leaveTimer = window.setTimeout(() => setWelcomeState("leaving"), 5000);
    const hideTimer = window.setTimeout(() => setWelcomeState("hidden"), 5600);
    return () => { window.clearTimeout(leaveTimer); window.clearTimeout(hideTimer); };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      let failedRequests = 0;
      const [dashboardData, financeData, financeChartData, reportChartData, customerData, salesData, invoiceData, paymentData] = await Promise.all([
        getRoleDashboard().catch(() => { failedRequests++; return null; }),
        (isAdmin ? getFinancialSummary() : Promise.resolve(null)).catch(() => { failedRequests++; return null; }),
        (isAdmin ? getFinancialChart() : Promise.resolve([])).catch(() => { failedRequests++; return []; }),
        (isAdmin ? getReportCharts() : Promise.resolve(null)).catch(() => { failedRequests++; return null; }),
        getCustomers().catch(() => { failedRequests++; return []; }),
        (isAdmin ? getSales() : Promise.resolve([])).catch(() => { failedRequests++; return []; }),
        getInvoices().catch(() => { failedRequests++; return []; }),
        getPayments().catch(() => { failedRequests++; return []; }),
      ]);
      if (import.meta.env.DEV && user?.role === "SALES") {
        console.groupCollapsed("[TAK CRM] SALES dashboard API responses");
        console.log("role", user.role);
        console.log("dashboard response", dashboardData);
        console.log("financial response", financeData);
        console.log("financial chart response", financeChartData);
        console.log("report chart response", reportChartData);
        console.log("sales response", salesData);
        console.log("invoices response", invoiceData);
        console.log("payments response", paymentData);
        console.log("customers response", customerData);
        console.groupEnd();
      }
      setDashboard(dashboardData as DashboardData | null);
      setFinancial(financeData);
      setFinancialChart(Array.isArray(financeChartData) ? financeChartData : []);
      setReportCharts(reportChartData);
      setCustomers(Array.isArray(customerData) ? customerData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setUpdatedAt(new Date());
      if (failedRequests > 0) {
        setError(`بخشی از اطلاعات داشبورد دریافت نشد (${failedRequests} سرویس).`);
      }
    } catch (reason) {
      console.error(reason);
      const message = "دریافت اطلاعات واقعی داشبورد ناموفق بود.";
      setError(message);
      toast(message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.role]);

  useEffect(() => { void load(); }, [load]);

  const ownSales = useMemo(() => isAdmin ? sales : sales.filter(item => {
    const ownerIds = [item.userId, item.user?.id, item.salesperson?.id].filter((id): id is number => typeof id === "number");
    return ownerIds.length === 0 || ownerIds.includes(Number(user?.id));
  }), [isAdmin, sales, user?.id]);
  const ownCustomers = useMemo(() => customers, [customers]);
  const ownInvoices = useMemo(() => invoices, [invoices]);
  const ownInvoiceIds = useMemo(() => new Set(ownInvoices.map(item => item.id)), [ownInvoices]);
  const ownPayments = useMemo(() => isAdmin ? payments : payments.filter(item => ownInvoiceIds.has(item.invoiceId)), [isAdmin, ownInvoiceIds, payments]);
  const completedPayments = useMemo(() => ownPayments.filter(item => item.status === "COMPLETED"), [ownPayments]);
  const received = completedPayments.reduce((sum, item) => sum + number(item.amount), 0);
  const issuedTotal = ownInvoices.reduce((sum, item) => sum + number(item.total), 0);
  const debt = Math.max(0, issuedTotal - received);
  const roleSummary = dashboard?.summary;
  const customerCount = isAdmin ? customers.length : ownCustomers.length || number(roleSummary?.assignedCustomers);
  const invoiceCount = isAdmin ? invoices.length || financial?.totalInvoices || 0 : ownInvoices.length;
  const now = new Date();
  const personalSalesToday = ownInvoices.filter(item => new Date(item.invoiceDate || item.createdAt).toDateString() === now.toDateString()).reduce((sum, item) => sum + number(item.total), 0);
  const personalSalesMonth = ownInvoices.filter(item => { const date = new Date(item.invoiceDate || item.createdAt); return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(); }).reduce((sum, item) => sum + number(item.total), 0);
  const personalSalesYear = ownInvoices.filter(item => new Date(item.invoiceDate || item.createdAt).getFullYear() === now.getFullYear()).reduce((sum, item) => sum + number(item.total), 0);
  const personalDailyTrend = useMemo(() => {
    const points = new Map<string, {name:string;sales:number;invoices:number}>();
    ownSales.forEach(item => { const date = new Date(item.createdAt); if (Number.isNaN(date.getTime())) return; const key = date.toISOString().slice(0,10); const point = points.get(key) || {name:date.toLocaleDateString("fa-IR",{month:"short",day:"numeric"}),sales:0,invoices:0}; point.sales += number(item.amount); points.set(key,point); });
    ownInvoices.forEach(item => { const date = new Date(item.invoiceDate || item.createdAt); if (Number.isNaN(date.getTime())) return; const key = date.toISOString().slice(0,10); const point = points.get(key) || {name:date.toLocaleDateString("fa-IR",{month:"short",day:"numeric"}),sales:0,invoices:0}; point.sales += number(item.total); point.invoices += 1; points.set(key,point); });
    return [...points.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([,point]) => point);
  }, [ownInvoices, ownSales]);
  const personalMonthlyTrend = useMemo(() => {
    const points = new Map<string, {name:string;sales:number;invoices:number}>();
    ownSales.forEach(item => { const date = new Date(item.createdAt); if (Number.isNaN(date.getTime())) return; const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`; const point = points.get(key) || {name:date.toLocaleDateString("fa-IR",{year:"numeric",month:"short"}),sales:0,invoices:0}; point.sales += number(item.amount); points.set(key,point); });
    ownInvoices.forEach(item => { const date = new Date(item.invoiceDate || item.createdAt); if (Number.isNaN(date.getTime())) return; const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`; const point = points.get(key) || {name:date.toLocaleDateString("fa-IR",{year:"numeric",month:"short"}),sales:0,invoices:0}; point.sales += number(item.total); point.invoices += 1; points.set(key,point); });
    return [...points.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([,point]) => point);
  }, [ownInvoices, ownSales]);
  const financialTrend = financialChart.map(item => ({
    name: new Date(item.date).toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
    sales: number(item.sales),
    invoices: number(item.invoices),
  }));
  const dailyReportSales = (reportCharts?.dailySales || []).map(item => ({ name: item.label, sales: number(item.revenue), invoices: number(item.invoices) }));
  const monthlyReportSales = (reportCharts?.monthlySales || []).map(item => ({ name: item.label, sales: number(item.revenue), invoices: number(item.invoices) }));
  const salesTrend = isAdmin ? (financialTrend.length > 1 ? financialTrend : dailyReportSales) : personalDailyTrend;
  const monthlySales = isAdmin ? (monthlyReportSales.length > 1 ? monthlyReportSales : dailyReportSales) : personalMonthlyTrend;
  const displayedDailySales = isAdmin ? financial?.dailySales : personalSalesToday;
  const displayedMonthlySales = isAdmin ? financial?.monthlySales : personalSalesMonth;
  const displayedYearlySales = isAdmin ? financial?.yearlySales : personalSalesYear;
  const displayedPaid = isAdmin ? financial?.totalPaid ?? received : received;
  const displayedDebt = isAdmin ? financial?.totalDebt ?? debt : debt;
  const financialState = [
    { name: "دریافت‌شده", value: displayedPaid, color: "#10b981" },
    { name: "مطالبات", value: displayedDebt, color: "#f59e0b" },
  ].filter(item => item.value > 0);
  const hasRealData = Boolean(dashboard) && (ownSales.length > 0 || ownInvoices.length > 0 || ownCustomers.length > 0 || (isAdmin && financialChart.length > 0));
  const salesPerformance = isAdmin ? dashboard?.salesPerformance || [] : [];

  useEffect(() => {
    if (!import.meta.env.DEV || isAdmin || loading) return;
    console.groupCollapsed("[TAK CRM] SALES dashboard chart data");
    console.log("role", user?.role);
    console.log("financial data", financial);
    console.log("salesTrend data", salesTrend);
    console.log("monthlySales data", monthlySales);
    console.log("financialStatus data", financialState);
    console.log("scoped source records", {
      sales: ownSales,
      invoices: ownInvoices,
      payments: ownPayments,
      customers: ownCustomers,
    });
    console.groupEnd();
  }, [financial, financialState, isAdmin, loading, monthlySales, ownCustomers, ownInvoices, ownPayments, ownSales, salesTrend, user?.role]);

  return (
    <main className="executiveSaas" dir="rtl">
      <section className={`execHero dashboardWelcome dashboardWelcome--${welcomeState}`} aria-hidden={welcomeState === "hidden"}>
        <div className="heroGlow" />
        <div className="heroCopy">
          <span><TrendingUp size={15} /> LIVE EXECUTIVE DATA</span>
          <h1>خوش آمدید {user?.name || "کاربر TAK CRM"} 👋</h1>
          <p>نمای یکپارچه فروش، مشتریان، فاکتورها و وضعیت مالی بر اساس داده‌های واقعی CRM</p>
          <div className="heroMeta">
            <small><CalendarDays size={13} /> {new Date().toLocaleDateString("fa-IR", { dateStyle: "long" })}</small>
            <small><RefreshCw size={13} /> آخرین بروزرسانی: {updatedAt ? updatedAt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : "—"}</small>
          </div>
        </div>
        <div className="heroOrb"><CircleDollarSign /><strong>TAK CRM</strong></div>
      </section>

      <div className="execControl">
        <button type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} className={loading ? "spin" : ""} /> بروزرسانی داده‌ها</button>
      </div>

      {error && <div className="execError"><span>{error}</span><button type="button" onClick={() => void load()}>تلاش دوباره</button></div>}

      <section className="dashboardKpiGrid">
        {isAdmin ? <>
          <StatCard tone="blue" title="کل مشتریان" value={fa(roleSummary?.totalCustomers ?? customerCount)} hint="تمام مشتریان شرکت" icon={<UsersRound />} loading={loading} />
          <StatCard tone="orange" title="مشتریان آزاد" value={fa(roleSummary?.freeCustomers)} hint="بدون کارشناس فروش" icon={<UserRoundPlus />} loading={loading} />
          <StatCard tone="cyan" title="مشتریان تخصیص‌یافته" value={fa(roleSummary?.assignedCustomers)} hint="دارای کارشناس فروش" icon={<UserRoundCheck />} loading={loading} />
          <StatCard tone="purple" title="کل فروش" value={money(roleSummary?.totalRevenue)} hint="مجموع مبلغ فروش شرکت" icon={<TrendingUp />} loading={loading} />
          <StatCard tone="orange" title="کل فاکتورها" value={fa(roleSummary?.totalInvoices ?? invoiceCount)} hint="فاکتورهای ثبت‌شده" icon={<ReceiptText />} loading={loading} />
          <StatCard tone="green" title="کل پرداخت‌ها" value={fa(roleSummary?.totalPayments)} hint="پرداخت‌های تکمیل‌شده" icon={<CreditCard />} loading={loading} />
        </> : <>
          <StatCard tone="blue" title="مشتریان من" value={fa(roleSummary?.assignedCustomers ?? customerCount)} hint="مشتریان اختصاص‌یافته به شما" icon={<UsersRound />} loading={loading} />
          <StatCard tone="orange" title="فاکتورهای من" value={fa(roleSummary?.personalInvoices ?? invoiceCount)} hint="فاکتورهای مشتریان شما" icon={<ReceiptText />} loading={loading} />
          <StatCard tone="purple" title="مبلغ فروش من" value={money(roleSummary?.personalRevenue ?? personalSalesYear)} hint="مجموع فروش شخصی" icon={<Banknote />} loading={loading} />
          <StatCard tone="green" title="پرداخت‌های من" value={money(roleSummary?.receivedPayments ?? received)} hint={`${fa(roleSummary?.personalPayments)} پرداخت تکمیل‌شده`} icon={<CreditCard />} loading={loading} />
          <StatCard tone="cyan" title="نرخ تبدیل من" value={`${fa(roleSummary?.conversionRate)}٪`} hint={`${fa(roleSummary?.convertedCustomers)} مشتری دارای خرید`} icon={<Percent />} loading={loading} />
        </>}
        <StatCard tone="cyan" title="پیگیری‌های امروز" value={fa(roleSummary?.todayFollowUps)} hint={isAdmin?"تمام کارشناسان":"مشتریان شما"} icon={<CalendarDays/>} loading={loading}/>
        <StatCard tone="orange" title="پیگیری‌های عقب‌افتاده" value={fa(roleSummary?.overdueFollowUps)} hint="نیازمند اقدام" icon={<AlertTriangle/>} loading={loading}/>
        <StatCard tone="green" title="پیگیری‌های انجام‌شده" value={fa(roleSummary?.completedFollowUps)} hint="فعالیت‌های تکمیل‌شده" icon={<CheckCircle2/>} loading={loading}/>
        <StatCard tone="green" title="فروش امروز" value={money(displayedDailySales)} hint="فروش ثبت‌شده امروز" icon={<CircleDollarSign/>} loading={loading}/>
        <StatCard tone="purple" title="فروش ماه جاری" value={money(displayedMonthlySales)} hint="فروش این ماه" icon={<TrendingUp/>} loading={loading}/>
        {isAdmin&&<StatCard tone="cyan" title="برترین کارشناس" value={roleSummary?.bestSalesperson||"—"} hint="بیشترین مبلغ فروش" icon={<Award/>} loading={loading}/>}
      </section>

      {loading ? <div className="execLoader"><i /><span>در حال دریافت اطلاعات واقعی داشبورد…</span></div> : !hasRealData ? (
        <GlassCard className="dashboardEmptyCard"><EmptyState title="هنوز داده‌ای برای داشبورد وجود ندارد" description="پس از ثبت فروش، مشتری یا فاکتور، آمار و نمودارها در این بخش نمایش داده می‌شوند." /></GlassCard>
      ) : (
        <section className={`dashboardChartsGrid${isAdmin ? " dashboardChartsGrid--admin" : ""}`}>
          {isAdmin && <ChartCard className="dashboardPerformanceChart" title="عملکرد کارشناسان فروش" subtitle="مقایسه مبلغ فروش کارشناسان">
            <div className="chartBox">{salesPerformance.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={salesPerformance} layout="vertical" margin={{ top: 8, right: 12, bottom: 4, left: 8 }}><CartesianGrid strokeDasharray="3 8" horizontal={false}/><XAxis type="number" axisLine={false} tickLine={false} tickFormatter={value=>fa(value)}/><YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false}/><Tooltip formatter={value => [money(value), "فروش"]}/><Bar dataKey="revenue" fill="#8b5cf6" radius={[8,8,8,8]} maxBarSize={30}/></BarChart></ResponsiveContainer> : <EmptyState title="داده عملکرد کارشناسان موجود نیست" />}</div>
          </ChartCard>}
          <ChartCard className="dashboardTrendChart" title="روند فروش" subtitle="فروش و تعداد فاکتور در بازه زمانی واقعی">
            <div className="chartBox">{salesTrend.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={salesTrend} margin={{top:8,right:8,bottom:4,left:4}}><defs><linearGradient id="dashboardSales" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22d3ee" stopOpacity=".45"/><stop offset="1" stopColor="#22d3ee" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="3 8" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18}/><YAxis width={54} axisLine={false} tickLine={false} tick={{fill:"#8490ac",fontSize:9}} tickFormatter={value=>fa(value)}/><Tooltip formatter={(value, name) => [name === "sales" ? money(value) : fa(value), name === "sales" ? "فروش" : "فاکتور"]}/><Area type="monotone" dataKey="sales" stroke="#22d3ee" strokeWidth={3} fill="url(#dashboardSales)" fillOpacity={1} connectNulls dot={{r:4,fill:"#07111f",stroke:"#22d3ee",strokeWidth:2}} activeDot={{r:6,fill:"#22d3ee",stroke:"#ecfeff",strokeWidth:2}} isAnimationActive/><Area type="monotone" dataKey="invoices" stroke="#8b5cf6" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer> : <EmptyState title="داده روند فروش موجود نیست" />}</div>
          </ChartCard>

          <ChartCard className="dashboardMonthlyChart" title="فروش ماهانه" subtitle="مقایسه درآمد ماه‌های ثبت‌شده">
            <div className="chartBox">{monthlySales.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={monthlySales} margin={{top:8,right:8,bottom:4,left:4}}><CartesianGrid strokeDasharray="3 8" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18}/><YAxis width={54} axisLine={false} tickLine={false} tick={{fill:"#8490ac",fontSize:9}} tickFormatter={value=>fa(value)}/><Tooltip formatter={value => [money(value), "فروش ماهانه"]}/><Bar dataKey="sales" fill="#8b5cf6" radius={[8,8,2,2]} minPointSize={4} maxBarSize={48} isAnimationActive /></BarChart></ResponsiveContainer> : <EmptyState title="داده فروش ماهانه موجود نیست" />}</div>
          </ChartCard>

          <ChartCard className="dashboardFinanceChart" title="وضعیت مالی" subtitle="مقایسه دریافت‌ها و مطالبات مشتریان">
            <div className="financialDonut chartBox">{financialState.length ? <><div className="financialDonutChart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={financialState} dataKey="value" innerRadius={58} outerRadius={84} paddingAngle={5}>{financialState.map(item => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={value => [money(value), "مبلغ"]}/></PieChart></ResponsiveContainer></div><div className="financialLegend">{financialState.map(item => <span key={item.name}><i style={{ background: item.color }} />{item.name}<b>{money(item.value)}</b></span>)}</div></> : <EmptyState title="اطلاعات مالی موجود نیست" />}</div>
          </ChartCard>
        </section>
      )}
    </main>
  );
}

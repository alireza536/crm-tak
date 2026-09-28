import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getChurnRisk, filterIntelligenceCustomers, type IntelligenceCustomer } from '../services/api';
import './SalesIntelligence.css';

export default function SalesIntelligence() {
  const [city, setCity] = useState('');
  const [brand, setBrand] = useState('');
  const [minimum, setMinimum] = useState('');
  const [days, setDays] = useState('30');
  const [customers, setCustomers] = useState<IntelligenceCustomer[]>([]);
  const [risk, setRisk] = useState<Array<IntelligenceCustomer & { daysSinceLastPurchase: number; averagePurchaseIntervalDays: number | null; reason: string }>>([]);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async (event?: FormEvent) => {
    event?.preventDefault(); setBusy(true); setError('');
    try {
      const [filtered, churn] = await Promise.all([
        filterIntelligenceCustomers({ city: city.trim() || undefined, brand: brand.trim() || undefined, minPurchase: minimum || undefined, limit: 100 }),
        getChurnRisk({ inactiveDays: days || 30, city: city.trim() || undefined, limit: 100 }),
      ]);
      setCustomers(filtered.customers); setCount(filtered.count); setRisk(churn.customers);
    } catch { setError('بارگذاری تحلیل مشتریان انجام نشد.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, []);

  return <div className="insightPage" dir="rtl">
    <section className="insightHero"><div><h1>هوش مشتریان</h1><p>فیلتر و تحلیل بر اساس فاکتورهای ثبت‌شده CRM؛ معیارهای ریسک شفاف و قابل بررسی هستند.</p></div><Link to="/ai-assistant">دستیار فروش</Link></section>
    <form className="insightFilter" onSubmit={load}>
      <label>شهر<input value={city} onChange={e => setCity(e.target.value)} placeholder="مثلاً مشهد" /></label>
      <label>محصول یا برند<input value={brand} onChange={e => setBrand(e.target.value)} placeholder="نام محصول یا برند" /></label>
      <label>حداقل خرید<input inputMode="numeric" value={minimum} onChange={e => setMinimum(e.target.value)} /></label>
      <label>روزهای بی‌خرید<input type="number" min="1" value={days} onChange={e => setDays(e.target.value)} /></label>
      <button type="submit" disabled={busy}>{busy ? 'در حال دریافت…' : 'اعمال فیلتر'}</button>
    </form>
    {error && <p role="alert" className="insightError">{error}</p>}
    <div className="insightCards"><article className="insightCard"><span>مشتریان منطبق با فیلتر</span><h2>{count.toLocaleString('fa-IR')}</h2></article><article className="insightCard"><span>مشتریان در معرض غیرفعال‌شدن</span><h2>{risk.length.toLocaleString('fa-IR')}</h2></article></div>
    <section className="insightResults"><h2>مشتریان منطبق</h2>{customers.length ? <div className="insightTable"><div className="insightTableHead"><span>مشتری</span><span>شهر</span><span>خرید</span><span>فاکتورها</span><span>آخرین خرید</span></div>{customers.map(customer => <div className="insightTableRow" key={customer.id}><Link to={`/customer/${customer.id}`}>{customer.name}</Link><span>{customer.city || '—'}</span><span>{Number(customer.totalPurchase).toLocaleString('fa-IR')}</span><span>{customer.purchaseCount}</span><span>{customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString('fa-IR') : 'بدون فاکتور'}</span></div>)}</div> : <p>مشتری‌ای با این شرایط پیدا نشد.</p>}</section>
    <section className="insightResults"><h2>دلایل ریسک غیرفعال‌شدن</h2><p>قاعده: فاصله از آخرین فاکتور از آستانه تنظیم‌شده یا میانگین بازه خرید مشتری بیشتر است.</p>{risk.map(customer => <article className="insightRisk" key={customer.id}><Link to={`/customer/${customer.id}`}>{customer.name}</Link><span>{customer.reason}</span></article>)}</section>
    <p className="insightFooter"><Link to="/campaigns">مدیریت کمپین‌ها</Link> · گروه‌بندی محصول/برند از متن محصول ثبت‌شده استخراج می‌شود؛ فیلد برند مستقل در مدل فروش وجود ندارد.</p>
  </div>;
}

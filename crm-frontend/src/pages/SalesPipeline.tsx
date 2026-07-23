import { useMemo, useState } from "react";
import type { DragEvent, FormEvent } from "react";
import {
  FaArrowLeft,
  FaChartLine,
  FaCircleCheck,
  FaFilter,
  FaGripVertical,
  FaMagnifyingGlass,
  FaPlus,
  FaTrash,
  FaUser,
} from "react-icons/fa6";

import "./SalesPipeline.css";

type Stage = "lead" | "contacted" | "proposal" | "negotiation" | "won";
type Priority = "high" | "medium" | "low";

type Opportunity = {
  id: string;
  customer: string;
  title: string;
  amount: number;
  stage: Stage;
  priority: Priority;
  owner: string;
  nextAction: string;
  createdAt: string;
};

const STORAGE_KEY = "tak-crm-sales-pipeline-v1";

const stages: Array<{ id: Stage; title: string; hint: string }> = [
  { id: "lead", title: "سرنخ جدید", hint: "فرصت‌های تازه" },
  { id: "contacted", title: "تماس انجام شد", hint: "ارتباط اولیه" },
  { id: "proposal", title: "پیشنهاد قیمت", hint: "ارسال پیش‌فاکتور" },
  { id: "negotiation", title: "مذاکره", hint: "نهایی‌سازی شرایط" },
  { id: "won", title: "فروش موفق", hint: "معامله بسته‌شده" },
];

const seed: Opportunity[] = [
  {
    id: "pipeline-1",
    customer: "فروشگاه موبایل آریا",
    title: "سفارش عمده کابل و شارژر",
    amount: 185000000,
    stage: "proposal",
    priority: "high",
    owner: "علیرضا",
    nextAction: "پیگیری پیش‌فاکتور تا فردا",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pipeline-2",
    customer: "پخش همراه شرق",
    title: "تأمین پاوربانک سری جدید",
    amount: 320000000,
    stage: "negotiation",
    priority: "high",
    owner: "تیم فروش",
    nextAction: "تأیید قیمت نهایی",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pipeline-3",
    customer: "موبایل مرکزی",
    title: "خرید آزمایشی لوازم جانبی",
    amount: 42000000,
    stage: "contacted",
    priority: "medium",
    owner: "علیرضا",
    nextAction: "ارسال لیست موجودی",
    createdAt: new Date().toISOString(),
  },
];

function loadOpportunities(): Opportunity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Opportunity[];
    return Array.isArray(parsed) ? parsed : seed;
  } catch {
    return seed;
  }
}

function money(value: number) {
  return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
}

function priorityTitle(priority: Priority) {
  if (priority === "high") return "فوری";
  if (priority === "medium") return "متوسط";
  return "عادی";
}

export default function SalesPipeline() {
  const [items, setItems] = useState<Opportunity[]>(loadOpportunities);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [showForm, setShowForm] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [customer, setCustomer] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<Stage>("lead");
  const [itemPriority, setItemPriority] = useState<Priority>("medium");
  const [owner, setOwner] = useState("علیرضا");
  const [nextAction, setNextAction] = useState("");

  const save = (next: Opportunity[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fa");
    return items.filter((item) => {
      const matchesSearch = !query || `${item.customer} ${item.title} ${item.owner} ${item.nextAction}`
        .toLocaleLowerCase("fa")
        .includes(query);
      const matchesPriority = priority === "all" || item.priority === priority;
      return matchesSearch && matchesPriority;
    });
  }, [items, priority, search]);

  const stats = useMemo(() => {
    const open = items.filter((item) => item.stage !== "won");
    const won = items.filter((item) => item.stage === "won");
    return {
      count: open.length,
      openValue: open.reduce((sum, item) => sum + item.amount, 0),
      wonValue: won.reduce((sum, item) => sum + item.amount, 0),
      conversion: items.length ? Math.round((won.length / items.length) * 100) : 0,
    };
  }, [items]);

  const move = (id: string, destination: Stage) => {
    save(items.map((item) => item.id === id ? { ...item, stage: destination } : item));
  };

  const drop = (event: DragEvent<HTMLDivElement>, destination: Stage) => {
    event.preventDefault();
    const id = draggedId || event.dataTransfer.getData("text/plain");
    if (id) move(id, destination);
    setDraggedId(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!customer.trim() || !title.trim()) return;
    const numericAmount = Number(amount.replace(/,/g, ""));
    const next: Opportunity = {
      id: crypto.randomUUID(),
      customer: customer.trim(),
      title: title.trim(),
      amount: Number.isFinite(numericAmount) ? numericAmount : 0,
      stage,
      priority: itemPriority,
      owner: owner.trim() || "بدون مسئول",
      nextAction: nextAction.trim() || "بدون اقدام بعدی",
      createdAt: new Date().toISOString(),
    };
    save([next, ...items]);
    setCustomer("");
    setTitle("");
    setAmount("");
    setStage("lead");
    setItemPriority("medium");
    setNextAction("");
    setShowForm(false);
  };

  const remove = (id: string) => {
    if (window.confirm("این فرصت فروش حذف شود؟")) {
      save(items.filter((item) => item.id !== id));
    }
  };

  return (
    <section className="salesPipeline" dir="rtl">
      <header className="pipelineHeader">
        <div>
          <span className="pipelineEyebrow"><FaChartLine /> مدیریت چرخه فروش</span>
          <h1>قیف فروش و فرصت‌ها</h1>
          <p>هر مشتری را از سرنخ اولیه تا فروش موفق در یک نمای ستونی دنبال کن.</p>
        </div>
        <button type="button" className="pipelinePrimary" onClick={() => setShowForm(true)}>
          <FaPlus /> فرصت جدید
        </button>
      </header>

      <div className="pipelineStats">
        <article><small>فرصت‌های باز</small><strong>{stats.count.toLocaleString("fa-IR")}</strong></article>
        <article><small>ارزش قیف فعال</small><strong>{money(stats.openValue)}</strong></article>
        <article><small>فروش نهایی‌شده</small><strong>{money(stats.wonValue)}</strong></article>
        <article><small>نرخ تبدیل</small><strong>{stats.conversion.toLocaleString("fa-IR")}٪</strong></article>
      </div>

      <div className="pipelineToolbar">
        <label className="pipelineSearch"><FaMagnifyingGlass /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو در مشتری، فرصت یا مسئول..." /></label>
        <label className="pipelineFilter"><FaFilter /><select value={priority} onChange={(event) => setPriority(event.target.value as "all" | Priority)}><option value="all">همه اولویت‌ها</option><option value="high">فوری</option><option value="medium">متوسط</option><option value="low">عادی</option></select></label>
      </div>

      <div className="pipelineBoard">
        {stages.map((column) => {
          const columnItems = visible.filter((item) => item.stage === column.id);
          const total = columnItems.reduce((sum, item) => sum + item.amount, 0);
          return (
            <div className={`pipelineColumn ${column.id}`} key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, column.id)}>
              <div className="pipelineColumnHeader">
                <div><strong>{column.title}</strong><span>{column.hint}</span></div>
                <b>{columnItems.length.toLocaleString("fa-IR")}</b>
              </div>
              <div className="pipelineColumnValue">{money(total)}</div>
              <div className="pipelineCards">
                {columnItems.map((item) => (
                  <article className="pipelineCard" draggable key={item.id} onDragStart={(event) => { setDraggedId(item.id); event.dataTransfer.setData("text/plain", item.id); }}>
                    <div className="pipelineCardTop"><span className={`pipelinePriority ${item.priority}`}>{priorityTitle(item.priority)}</span><FaGripVertical /></div>
                    <h3>{item.title}</h3>
                    <p className="pipelineCustomer"><FaUser /> {item.customer}</p>
                    <strong className="pipelineAmount">{money(item.amount)}</strong>
                    <div className="pipelineNext"><span>اقدام بعدی</span><p>{item.nextAction}</p></div>
                    <div className="pipelineCardFooter"><span>{item.owner}</span><div>
                      {column.id !== "won" && <button type="button" title="انتقال به مرحله بعد" onClick={() => { const index = stages.findIndex((stageItem) => stageItem.id === column.id); const nextStage = stages[index + 1]; if (nextStage) move(item.id, nextStage.id); }}><FaArrowLeft /></button>}
                      {column.id === "won" && <span className="pipelineWon"><FaCircleCheck /></span>}
                      <button type="button" className="pipelineDelete" onClick={() => remove(item.id)}><FaTrash /></button>
                    </div></div>
                  </article>
                ))}
                {columnItems.length === 0 && <div className="pipelineEmpty">فرصتی در این مرحله نیست</div>}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="pipelineModalBackdrop" onMouseDown={() => setShowForm(false)}>
          <form className="pipelineModal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
            <div className="pipelineModalHeader"><div><strong>فرصت فروش جدید</strong><span>اطلاعات اولیه معامله را ثبت کن.</span></div><button type="button" onClick={() => setShowForm(false)}>×</button></div>
            <div className="pipelineFormGrid">
              <label>نام مشتری<input autoFocus required value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="نام فروشگاه یا مشتری" /></label>
              <label>عنوان فرصت<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثلاً سفارش عمده شارژر" /></label>
              <label>مبلغ تقریبی<input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="مثلاً 150000000" /></label>
              <label>مرحله<select value={stage} onChange={(event) => setStage(event.target.value as Stage)}>{stages.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
              <label>اولویت<select value={itemPriority} onChange={(event) => setItemPriority(event.target.value as Priority)}><option value="high">فوری</option><option value="medium">متوسط</option><option value="low">عادی</option></select></label>
              <label>مسئول<input value={owner} onChange={(event) => setOwner(event.target.value)} /></label>
            </div>
            <label>اقدام بعدی<textarea rows={3} value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="کار بعدی برای پیشبرد فروش..." /></label>
            <div className="pipelineModalActions"><button type="button" onClick={() => setShowForm(false)}>انصراف</button><button className="primary" type="submit"><FaPlus /> ثبت فرصت</button></div>
          </form>
        </div>
      )}
    </section>
  );
}

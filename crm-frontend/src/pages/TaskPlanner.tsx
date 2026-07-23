import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  FaCalendarCheck,
  FaCheck,
  FaClock,
  FaFilter,
  FaFlag,
  FaMagnifyingGlass,
  FaPlus,
  FaRotateLeft,
  FaTrash,
  FaUser,
} from "react-icons/fa6";

import "./TaskPlanner.css";

type Priority = "high" | "medium" | "low";
type TaskStatus = "todo" | "done";

type Task = {
  id: string;
  title: string;
  customer: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  note: string;
  createdAt: string;
};

const STORAGE_KEY = "tak-crm-task-planner-v1";

const seedTasks: Task[] = [
  {
    id: "seed-1",
    title: "تماس برای تکمیل سفارش عمده",
    customer: "فروشگاه موبایل آریا",
    dueDate: new Date().toISOString().slice(0, 10),
    priority: "high",
    status: "todo",
    note: "موجودی کابل تایپ C و شرایط ارسال بررسی شود.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    title: "ارسال پیش‌فاکتور جدید",
    customer: "پخش همراه شرق",
    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    priority: "medium",
    status: "todo",
    note: "قیمت نهایی پاوربانک‌ها قبل از ارسال کنترل شود.",
    createdAt: new Date().toISOString(),
  },
];

function loadTasks(): Task[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return seedTasks;
    const parsed = JSON.parse(saved) as Task[];
    return Array.isArray(parsed) ? parsed : seedTasks;
  } catch {
    return seedTasks;
  }
}

function priorityLabel(priority: Priority) {
  if (priority === "high") return "فوری";
  if (priority === "medium") return "متوسط";
  return "عادی";
}

function persianDate(value: string) {
  if (!value) return "بدون تاریخ";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export default function TaskPlanner() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<Priority>("medium");
  const [note, setNote] = useState("");

  const save = (next: Task[]) => {
    setTasks(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const open = tasks.filter((task) => task.status === "todo").length;
    const todayCount = tasks.filter(
      (task) => task.status === "todo" && task.dueDate === today,
    ).length;
    const overdue = tasks.filter(
      (task) => task.status === "todo" && task.dueDate < today,
    ).length;
    const done = tasks.filter((task) => task.status === "done").length;
    return { open, todayCount, overdue, done };
  }, [tasks, today]);

  const filteredTasks = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("fa");
    return [...tasks]
      .filter((task) => statusFilter === "all" || task.status === statusFilter)
      .filter((task) => priorityFilter === "all" || task.priority === priorityFilter)
      .filter((task) => {
        if (!normalized) return true;
        return `${task.title} ${task.customer} ${task.note}`
          .toLocaleLowerCase("fa")
          .includes(normalized);
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "todo" ? -1 : 1;
        if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        const rank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
        return rank[a.priority] - rank[b.priority];
      });
  }, [priorityFilter, search, statusFilter, tasks]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      customer: customer.trim() || "بدون مشتری",
      dueDate,
      priority,
      status: "todo",
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    save([task, ...tasks]);
    setTitle("");
    setCustomer("");
    setNote("");
    setPriority("medium");
    setDueDate(today);
    setShowForm(false);
  };

  const toggleStatus = (id: string) => {
    save(
      tasks.map((task) =>
        task.id === id
          ? { ...task, status: task.status === "todo" ? "done" : "todo" }
          : task,
      ),
    );
  };

  const removeTask = (id: string) => {
    if (window.confirm("این پیگیری حذف شود؟")) {
      save(tasks.filter((task) => task.id !== id));
    }
  };

  return (
    <section className="taskPlanner" dir="rtl">
      <header className="taskPlannerHeader">
        <div>
          <span className="taskPlannerEyebrow"><FaCalendarCheck /> مدیریت کارهای فروش</span>
          <h1>برنامه‌ریز پیگیری‌ها</h1>
          <p>تماس‌ها، پیش‌فاکتورها و کارهای روزانه فروش را در یک صفحه مدیریت کن.</p>
        </div>
        <button className="taskPrimaryButton" type="button" onClick={() => setShowForm(true)}>
          <FaPlus /> پیگیری جدید
        </button>
      </header>

      <div className="taskStatsGrid">
        <article><span><FaClock /></span><div><small>کارهای باز</small><strong>{stats.open.toLocaleString("fa-IR")}</strong></div></article>
        <article><span><FaCalendarCheck /></span><div><small>موعد امروز</small><strong>{stats.todayCount.toLocaleString("fa-IR")}</strong></div></article>
        <article className={stats.overdue ? "danger" : ""}><span><FaFlag /></span><div><small>عقب‌افتاده</small><strong>{stats.overdue.toLocaleString("fa-IR")}</strong></div></article>
        <article><span><FaCheck /></span><div><small>انجام‌شده</small><strong>{stats.done.toLocaleString("fa-IR")}</strong></div></article>
      </div>

      <div className="taskToolbar">
        <label className="taskSearch"><FaMagnifyingGlass /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو در عنوان، مشتری یا یادداشت..." /></label>
        <div className="taskFilters">
          <FaFilter />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatus)}>
            <option value="all">همه وضعیت‌ها</option><option value="todo">باز</option><option value="done">انجام‌شده</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as "all" | Priority)}>
            <option value="all">همه اولویت‌ها</option><option value="high">فوری</option><option value="medium">متوسط</option><option value="low">عادی</option>
          </select>
        </div>
      </div>

      <div className="taskList">
        {filteredTasks.length === 0 ? (
          <div className="taskEmpty"><FaCalendarCheck /><strong>پیگیری‌ای پیدا نشد</strong><span>فیلترها را تغییر بده یا یک پیگیری جدید بساز.</span></div>
        ) : filteredTasks.map((task) => {
          const overdue = task.status === "todo" && task.dueDate < today;
          return (
            <article className={`taskCard ${task.status} ${overdue ? "overdue" : ""}`} key={task.id}>
              <button className="taskCheck" type="button" onClick={() => toggleStatus(task.id)} aria-label="تغییر وضعیت">{task.status === "done" ? <FaCheck /> : null}</button>
              <div className="taskCardBody">
                <div className="taskCardTitle"><h3>{task.title}</h3><span className={`taskPriority ${task.priority}`}>{priorityLabel(task.priority)}</span></div>
                <div className="taskMeta"><span><FaUser /> {task.customer}</span><span className={overdue ? "late" : ""}><FaClock /> {persianDate(task.dueDate)}{overdue ? " — عقب‌افتاده" : ""}</span></div>
                {task.note && <p>{task.note}</p>}
              </div>
              <div className="taskActions">
                <button type="button" onClick={() => toggleStatus(task.id)}>{task.status === "done" ? <><FaRotateLeft /> بازگردانی</> : <><FaCheck /> انجام شد</>}</button>
                <button className="delete" type="button" onClick={() => removeTask(task.id)}><FaTrash /></button>
              </div>
            </article>
          );
        })}
      </div>

      {showForm && (
        <div className="taskModalBackdrop" onMouseDown={() => setShowForm(false)}>
          <form className="taskModal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
            <div className="taskModalHeader"><div><strong>ثبت پیگیری جدید</strong><span>کار بعدی تیم فروش را مشخص کن.</span></div><button type="button" onClick={() => setShowForm(false)}>×</button></div>
            <label>عنوان پیگیری<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً تماس برای نهایی‌کردن سفارش" required /></label>
            <label>نام مشتری<input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="نام فروشگاه یا مشتری" /></label>
            <div className="taskFormRow"><label>تاریخ انجام<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required /></label><label>اولویت<select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}><option value="high">فوری</option><option value="medium">متوسط</option><option value="low">عادی</option></select></label></div>
            <label>یادداشت<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="جزئیات لازم برای پیگیری..." rows={4} /></label>
            <div className="taskModalActions"><button type="button" onClick={() => setShowForm(false)}>انصراف</button><button className="primary" type="submit"><FaPlus /> ثبت پیگیری</button></div>
          </form>
        </div>
      )}
    </section>
  );
}

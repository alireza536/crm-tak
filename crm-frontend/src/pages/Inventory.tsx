import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaDownload,
  FaPen,
  FaPlus,
  FaXmark,
} from "react-icons/fa6";
import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck, PackageX } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActionButton, Badge, ChartCard, DataTable, GlassCard, PageHeader, SearchBar, StatCard } from "../components/ui/DesignSystem";

import "./Inventory.css";

type StockStatus = "available" | "low" | "out";
type MovementType = "in" | "out";

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  brand: string;
  stock: number;
  minStock: number;
  location: string;
  updatedAt: string;
};

type Movement = {
  id: number;
  productId: number;
  productName: string;
  type: MovementType;
  quantity: number;
  reason: string;
  operator: string;
  date: string;
};

const initialProducts: Product[] = [
  { id: 1, name: "پاوربانک Renjer RJ-Z20", sku: "RJ-Z20", category: "پاوربانک", brand: "Renjer", stock: 36, minStock: 12, location: "A-01", updatedAt: "امروز، ۱۰:۳۰" },
  { id: 2, name: "هندزفری بلوتوث RJ-A90", sku: "RJ-A90", category: "هندزفری", brand: "Renjer", stock: 8, minStock: 10, location: "B-03", updatedAt: "امروز، ۰۹:۱۵" },
  { id: 3, name: "شارژر دیواری RJ-A30", sku: "RJ-A30", category: "شارژر", brand: "Renjer", stock: 0, minStock: 15, location: "C-02", updatedAt: "دیروز، ۱۸:۴۰" },
  { id: 4, name: "شارژر فندکی RJ-C120", sku: "RJ-C120", category: "شارژر خودرو", brand: "Renjer", stock: 54, minStock: 20, location: "C-05", updatedAt: "دیروز، ۱۲:۱۰" },
  { id: 5, name: "کابل Type-C مدل PD-700", sku: "PD-700-CC", category: "کابل", brand: "TAK", stock: 120, minStock: 35, location: "D-08", updatedAt: "۲ روز پیش" },
  { id: 6, name: "پاوربانک Renjer RJ-S1", sku: "RJ-S1", category: "پاوربانک", brand: "Renjer", stock: 14, minStock: 15, location: "A-02", updatedAt: "۳ روز پیش" },
];

const initialMovements: Movement[] = [
  { id: 1, productId: 1, productName: "پاوربانک Renjer RJ-Z20", type: "in", quantity: 20, reason: "رسید محموله جدید", operator: "مدیر سیستم", date: "امروز، ۱۰:۳۰" },
  { id: 2, productId: 2, productName: "هندزفری بلوتوث RJ-A90", type: "out", quantity: 4, reason: "تحویل به واحد فروش", operator: "انباردار", date: "امروز، ۰۹:۱۵" },
  { id: 3, productId: 3, productName: "شارژر دیواری RJ-A30", type: "out", quantity: 6, reason: "ارسال سفارش مشتری", operator: "انباردار", date: "دیروز، ۱۸:۴۰" },
];

function loadProducts() {
  try {
    const saved = localStorage.getItem("tak_inventory_products_simple");
    return saved ? (JSON.parse(saved) as Product[]) : initialProducts;
  } catch {
    return initialProducts;
  }
}

function loadMovements() {
  try {
    const saved = localStorage.getItem("tak_inventory_movements_simple");
    return saved ? (JSON.parse(saved) as Movement[]) : initialMovements;
  } catch {
    return initialMovements;
  }
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [movements, setMovements] = useState<Movement[]>(loadMovements);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [movementProductId, setMovementProductId] = useState(products[0]?.id ?? 0);
  const [movementType, setMovementType] = useState<MovementType>("in");

  const persistProducts = (next: Product[]) => {
    setProducts(next);
    localStorage.setItem("tak_inventory_products_simple", JSON.stringify(next));
  };

  const persistMovements = (next: Movement[]) => {
    setMovements(next);
    localStorage.setItem("tak_inventory_movements_simple", JSON.stringify(next));
  };

  const statusOf = (product: Product): StockStatus => {
    if (product.stock <= 0) return "out";
    if (product.stock <= product.minStock) return "low";
    return "available";
  };

  const categories = useMemo(() => Array.from(new Set(products.map((item) => item.category))), [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || [product.name, product.sku, product.brand, product.location].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || statusOf(product) === statusFilter;
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => ({
    totalProducts: products.length,
    totalUnits: products.reduce((sum, item) => sum + item.stock, 0),
    low: products.filter((item) => statusOf(item) === "low").length,
    out: products.filter((item) => statusOf(item) === "out").length,
  }), [products]);

  const movementChart = useMemo(() => movements.slice(0, 10).reverse().map((item, index) => ({
    name: `${index + 1}`,
    in: item.type === "in" ? item.quantity : 0,
    out: item.type === "out" ? item.quantity : 0,
  })), [movements]);

  const consumedProducts = useMemo(() => {
    const totals = movements.filter((item) => item.type === "out").reduce<Record<string, number>>((acc, item) => {
      acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
      return acc;
    }, {});
    return Object.entries(totals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [movements]);

  const stockStatusChart = useMemo(() => [
    { name: "موجود", value: products.filter((item) => statusOf(item) === "available").length, color: "#34d399" },
    { name: "کم‌موجود", value: stats.low, color: "#f59e0b" },
    { name: "تمام‌شده", value: stats.out, color: "#fb7185" },
  ], [products, stats.low, stats.out]);

  const openNewProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const submitProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product: Product = {
      id: editingProduct?.id ?? Date.now(),
      name: String(form.get("name") || ""),
      sku: String(form.get("sku") || ""),
      category: String(form.get("category") || ""),
      brand: String(form.get("brand") || ""),
      stock: Math.max(0, Number(form.get("stock") || 0)),
      minStock: Math.max(0, Number(form.get("minStock") || 0)),
      location: String(form.get("location") || ""),
      updatedAt: "همین حالا",
    };
    const next = editingProduct
      ? products.map((item) => item.id === product.id ? product : item)
      : [product, ...products];
    persistProducts(next);
    setShowProductModal(false);
  };

  const submitMovement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const quantity = Math.max(1, Number(form.get("quantity") || 1));
    const selected = products.find((item) => item.id === movementProductId);
    if (!selected) return;

    if (movementType === "out" && quantity > selected.stock) {
      window.alert("تعداد خروجی بیشتر از موجودی فعلی است.");
      return;
    }

    const nextStock = movementType === "in" ? selected.stock + quantity : selected.stock - quantity;
    persistProducts(products.map((item) => item.id === selected.id ? { ...item, stock: nextStock, updatedAt: "همین حالا" } : item));

    const movement: Movement = {
      id: Date.now(),
      productId: selected.id,
      productName: selected.name,
      type: movementType,
      quantity,
      reason: String(form.get("reason") || "اصلاح موجودی"),
      operator: String(form.get("operator") || "مدیر سیستم"),
      date: "همین حالا",
    };
    persistMovements([movement, ...movements].slice(0, 50));
    setShowMovementModal(false);
  };

  const exportCsv = () => {
    const rows = [
      ["نام کالا", "SKU", "دسته‌بندی", "برند", "موجودی", "حداقل موجودی", "محل نگهداری", "آخرین تغییر"],
      ...products.map((p) => [p.name, p.sku, p.category, p.brand, p.stock, p.minStock, p.location, p.updatedAt]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tak-inventory-simple.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="inventoryPage executiveInventory" dir="rtl">
      <PageHeader eyebrow="WAREHOUSE CONTROL" title="مدیریت موجودی انبار" description="کنترل زنده موجودی، گردش کالا و هشدارهای تأمین" actions={<><ActionButton className="secondary" type="button" onClick={exportCsv}><FaDownload /> خروجی CSV</ActionButton><ActionButton className="secondary" type="button" onClick={() => setShowMovementModal(true)}><FaArrowDown /> ثبت ورود/خروج</ActionButton><ActionButton type="button" onClick={openNewProduct}><FaPlus /> کالای جدید</ActionButton></>} />

      <section className="uiStats inventoryKpis">
        <StatCard tone="blue" title="تعداد کل کالاها" value={stats.totalProducts.toLocaleString("fa-IR")} hint="کالای ثبت‌شده" icon={<Boxes />} data={products.map((_,index)=>index+1)} />
        <StatCard tone="green" title="موجودی فعلی" value={stats.totalUnits.toLocaleString("fa-IR")} hint="واحد فیزیکی سالم" icon={<PackageCheck />} data={products.map(product=>product.stock)} />
        <StatCard tone="orange" title="کالاهای کم‌موجود" value={stats.low.toLocaleString("fa-IR")} hint={`${stats.out.toLocaleString("fa-IR")} کالای بحرانی`} icon={<PackageX />} data={products.map(product=>Math.max(product.minStock-product.stock,0))} />
        <StatCard tone="green" title="ارزش انبار" value="—" hint="داده قیمت در مدل موجود نیست" icon={<CircleDollarSign />} />
      </section>

      {(stats.low > 0 || stats.out > 0) && (
        <GlassCard className="inventoryAlert"><AlertTriangle /><div><strong>هشدار زنده موجودی</strong><span>{(stats.low + stats.out).toLocaleString("fa-IR")} کالا نیاز به بررسی یا تأمین دارد.</span></div><i /></GlassCard>
      )}

      <section className="inventoryCharts">
        <ChartCard title="گردش کالا" subtitle="آخرین ورود و خروج‌ها"><div className="inventoryChartBox">{movementChart.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={movementChart}><defs><linearGradient id="movementIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34d399" stopOpacity=".45"/><stop offset="1" stopColor="#34d399" stopOpacity="0"/></linearGradient></defs><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:"#71809e",fontSize:9}}/><YAxis hide/><Tooltip contentStyle={{background:"#10182c",border:"1px solid rgba(139,92,246,.28)",borderRadius:12,color:"#f4f7ff"}}/><Area type="monotone" dataKey="in" name="ورود" stroke="#34d399" strokeWidth={3} fill="url(#movementIn)"/><Area type="monotone" dataKey="out" name="خروج" stroke="#fb7185" strokeWidth={2.5} fill="transparent"/></AreaChart></ResponsiveContainer> : null}</div></ChartCard>
        <ChartCard title="کالاهای پرمصرف" subtitle="بر اساس گردش خروج"><div className="inventoryChartBox">{consumedProducts.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={consumedProducts} layout="vertical"><XAxis type="number" hide/><YAxis type="category" dataKey="name" width={105} axisLine={false} tickLine={false} tick={{fill:"#8490aa",fontSize:9}}/><Tooltip cursor={{fill:"rgba(139,92,246,.06)"}} contentStyle={{background:"#10182c",border:"1px solid rgba(34,211,238,.25)",borderRadius:12,color:"#f4f7ff"}}/><Bar dataKey="value" name="تعداد خروج" fill="#8b5cf6" radius={[7,7,7,7]} barSize={13}/></BarChart></ResponsiveContainer> : <div className="inventoryChartEmpty">گردش خروجی ثبت نشده است.</div>}</div></ChartCard>
        <ChartCard title="وضعیت موجودی" subtitle="سلامت انبار"><div className="inventoryDonut"><ResponsiveContainer width="100%" height={180}><PieChart><Pie data={stockStatusChart} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={5}>{stockStatusChart.map((item) => <Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div>{stockStatusChart.map(item=><span key={item.name}><i style={{background:item.color}}/>{item.name}<b>{item.value.toLocaleString("fa-IR")}</b></span>)}</div></div></ChartCard>
      </section>

      <div className="inventoryToolbar">
        <SearchBar className="inventorySearch" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو در نام، SKU، برند یا محل..." />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">همه وضعیت‌ها</option><option value="available">موجود</option><option value="low">رو به اتمام</option><option value="out">ناموجود</option>
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">همه دسته‌ها</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>

      <div className="inventoryContent">
        <GlassCard className="inventoryTableCard">
          <div className="inventoryCardTitle"><div><strong>فهرست موجودی</strong><span>{filteredProducts.length.toLocaleString("fa-IR")} نتیجه</span></div></div>
          <DataTable className="inventoryTableWrap">
              <thead><tr><th>کالا</th><th>دسته/برند</th><th>موجودی</th><th>محل نگهداری</th><th>وضعیت</th><th></th></tr></thead>
              <tbody>{filteredProducts.map((product) => {
                const status = statusOf(product);
                return <tr key={product.id}>
                  <td><div className="inventoryProduct"><span>{product.name.slice(0, 1)}</span><div><strong>{product.name}</strong><small>SKU: {product.sku}</small></div></div></td>
                  <td><strong>{product.category}</strong><small>{product.brand}</small></td>
                  <td><strong>{product.stock.toLocaleString("fa-IR")}</strong><small>حداقل: {product.minStock.toLocaleString("fa-IR")}</small></td>
                  <td><strong>{product.location || "—"}</strong><small>{product.updatedAt}</small></td>
                  <td><Badge tone={status === "available" ? "success" : status === "low" ? "warning" : "danger"}>{status === "available" ? "موجود" : status === "low" ? "کم‌موجود" : "تمام‌شده"}</Badge></td>
                  <td><button className="inventoryIconButton" type="button" onClick={() => openEditProduct(product)} aria-label="ویرایش"><FaPen /></button></td>
                </tr>;
              })}</tbody>
          </DataTable>
        </GlassCard>

        <GlassCard className="inventoryMovements">
          <div className="inventoryCardTitle"><div><strong>آخرین گردش کالا</strong><span>ورود و خروج‌های ثبت‌شده</span></div></div>
          <div className="movementList">{movements.slice(0, 10).map((movement) => <article key={movement.id}>
            <span className={`movementIcon ${movement.type}`}>{movement.type === "in" ? <FaArrowDown /> : <FaArrowUp />}</span>
            <div><strong>{movement.productName}</strong><p>{movement.reason}</p><small>{movement.operator} · {movement.date}</small></div>
            <b className={movement.type}>{movement.type === "in" ? "+" : "−"}{movement.quantity.toLocaleString("fa-IR")}</b>
          </article>)}</div>
        </GlassCard>
      </div>

      {showProductModal && (
        <div className="inventoryModalBackdrop" onMouseDown={() => setShowProductModal(false)}>
          <form className="inventoryModal" onSubmit={submitProduct} onMouseDown={(event) => event.stopPropagation()}>
            <div className="inventoryModalHeader"><div><strong>{editingProduct ? "ویرایش کالا" : "ثبت کالای جدید"}</strong><span>اطلاعات فیزیکی و محل نگهداری کالا</span></div><button type="button" onClick={() => setShowProductModal(false)}><FaXmark /></button></div>
            <div className="inventoryFormGrid">
              <label className="full">نام کالا<input name="name" required defaultValue={editingProduct?.name} /></label>
              <label>کد کالا (SKU)<input name="sku" required defaultValue={editingProduct?.sku} /></label>
              <label>برند<input name="brand" required defaultValue={editingProduct?.brand} /></label>
              <label>دسته‌بندی<input name="category" required defaultValue={editingProduct?.category} /></label>
              <label>محل نگهداری<input name="location" placeholder="مثلاً A-01" defaultValue={editingProduct?.location} /></label>
              <label>موجودی فعلی<input name="stock" type="number" min="0" required defaultValue={editingProduct?.stock ?? 0} /></label>
              <label>حداقل موجودی<input name="minStock" type="number" min="0" required defaultValue={editingProduct?.minStock ?? 0} /></label>
            </div>
            <div className="inventoryModalActions"><button type="button" onClick={() => setShowProductModal(false)}>انصراف</button><button className="primary" type="submit">ذخیره کالا</button></div>
          </form>
        </div>
      )}

      {showMovementModal && (
        <div className="inventoryModalBackdrop" onMouseDown={() => setShowMovementModal(false)}>
          <form className="inventoryModal compact" onSubmit={submitMovement} onMouseDown={(event) => event.stopPropagation()}>
            <div className="inventoryModalHeader"><div><strong>ثبت گردش موجودی</strong><span>ورود یا خروج فیزیکی کالا</span></div><button type="button" onClick={() => setShowMovementModal(false)}><FaXmark /></button></div>
            <div className="movementTypeButtons"><button className={movementType === "in" ? "active in" : ""} type="button" onClick={() => setMovementType("in")}><FaArrowDown /> ورود کالا</button><button className={movementType === "out" ? "active out" : ""} type="button" onClick={() => setMovementType("out")}><FaArrowUp /> خروج کالا</button></div>
            <label>انتخاب کالا<select value={movementProductId} onChange={(event) => setMovementProductId(Number(event.target.value))}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} — موجودی {product.stock.toLocaleString("fa-IR")}</option>)}</select></label>
            <label>تعداد<input name="quantity" type="number" min="1" required defaultValue="1" /></label>
            <label>دلیل ورود یا خروج<input name="reason" required placeholder="مثلاً رسید محموله، تحویل سفارش، اصلاح شمارش" /></label>
            <label>ثبت‌کننده<input name="operator" defaultValue="مدیر سیستم" /></label>
            <div className="inventoryModalActions"><button type="button" onClick={() => setShowMovementModal(false)}>انصراف</button><button className="primary" type="submit">ثبت گردش</button></div>
          </form>
        </div>
      )}
    </section>
  );
}

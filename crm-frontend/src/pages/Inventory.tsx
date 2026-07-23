import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaBoxesStacked,
  FaDownload,
  FaMagnifyingGlass,
  FaPen,
  FaPlus,
  FaTriangleExclamation,
  FaXmark,
} from "react-icons/fa6";

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
    <section className="inventoryPage">
      <header className="inventoryHeader">
        <div>
          <span className="inventoryEyebrow"><FaBoxesStacked /> کنترل فیزیکی کالا</span>
          <h1>انبار و موجودی</h1>
          <p>ثبت تعداد کالا، ورود و خروج، محل نگهداری و هشدار کمبود؛ بدون بخش مالی و حسابداری</p>
        </div>
        <div className="inventoryActions">
          <button className="inventoryGhost" type="button" onClick={exportCsv}><FaDownload /> خروجی CSV</button>
          <button className="inventoryGhost" type="button" onClick={() => setShowMovementModal(true)}><FaArrowDown /> ثبت ورود/خروج</button>
          <button className="inventoryPrimary" type="button" onClick={openNewProduct}><FaPlus /> کالای جدید</button>
        </div>
      </header>

      <div className="inventoryStats simpleStats">
        <article><small>تعداد اقلام</small><strong>{stats.totalProducts.toLocaleString("fa-IR")}</strong><span>کالای ثبت‌شده</span></article>
        <article><small>تعداد کل واحدها</small><strong>{stats.totalUnits.toLocaleString("fa-IR")}</strong><span>مجموع موجودی فیزیکی</span></article>
        <article className="warning"><small>رو به اتمام</small><strong>{stats.low.toLocaleString("fa-IR")}</strong><span>زیر حداقل موجودی</span></article>
        <article className="danger"><small>ناموجود</small><strong>{stats.out.toLocaleString("fa-IR")}</strong><span>موجودی صفر</span></article>
      </div>

      {(stats.low > 0 || stats.out > 0) && (
        <div className="inventoryAlert"><FaTriangleExclamation /><div><strong>هشدار موجودی</strong><span>{(stats.low + stats.out).toLocaleString("fa-IR")} کالا نیاز به بررسی یا تأمین دارد.</span></div></div>
      )}

      <div className="inventoryToolbar">
        <label className="inventorySearch"><FaMagnifyingGlass /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو در نام، SKU، برند یا محل..." /></label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">همه وضعیت‌ها</option><option value="available">موجود</option><option value="low">رو به اتمام</option><option value="out">ناموجود</option>
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">همه دسته‌ها</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>

      <div className="inventoryContent">
        <div className="inventoryTableCard">
          <div className="inventoryCardTitle"><div><strong>فهرست موجودی</strong><span>{filteredProducts.length.toLocaleString("fa-IR")} نتیجه</span></div></div>
          <div className="inventoryTableWrap">
            <table className="inventoryTable simpleTable">
              <thead><tr><th>کالا</th><th>دسته/برند</th><th>موجودی</th><th>محل نگهداری</th><th>وضعیت</th><th></th></tr></thead>
              <tbody>{filteredProducts.map((product) => {
                const status = statusOf(product);
                return <tr key={product.id}>
                  <td><div className="inventoryProduct"><span>{product.name.slice(0, 1)}</span><div><strong>{product.name}</strong><small>SKU: {product.sku}</small></div></div></td>
                  <td><strong>{product.category}</strong><small>{product.brand}</small></td>
                  <td><strong>{product.stock.toLocaleString("fa-IR")}</strong><small>حداقل: {product.minStock.toLocaleString("fa-IR")}</small></td>
                  <td><strong>{product.location || "—"}</strong><small>{product.updatedAt}</small></td>
                  <td><span className={`inventoryStatus ${status}`}>{status === "available" ? "موجود" : status === "low" ? "رو به اتمام" : "ناموجود"}</span></td>
                  <td><button className="inventoryIconButton" type="button" onClick={() => openEditProduct(product)} aria-label="ویرایش"><FaPen /></button></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>

        <aside className="inventoryMovements">
          <div className="inventoryCardTitle"><div><strong>آخرین گردش کالا</strong><span>ورود و خروج‌های ثبت‌شده</span></div></div>
          <div className="movementList">{movements.slice(0, 10).map((movement) => <article key={movement.id}>
            <span className={`movementIcon ${movement.type}`}>{movement.type === "in" ? <FaArrowDown /> : <FaArrowUp />}</span>
            <div><strong>{movement.productName}</strong><p>{movement.reason}</p><small>{movement.operator} · {movement.date}</small></div>
            <b className={movement.type}>{movement.type === "in" ? "+" : "−"}{movement.quantity.toLocaleString("fa-IR")}</b>
          </article>)}</div>
        </aside>
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

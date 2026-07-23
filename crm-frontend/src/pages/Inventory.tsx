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
  buyPrice: number;
  sellPrice: number;
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
  { id: 1, name: "پاوربانک Renjer RJ-Z20", sku: "RJ-Z20", category: "پاوربانک", brand: "Renjer", stock: 36, minStock: 12, buyPrice: 1380000, sellPrice: 1790000, location: "A-01", updatedAt: "امروز، ۱۰:۳۰" },
  { id: 2, name: "هندزفری بلوتوث RJ-A90", sku: "RJ-A90", category: "هندزفری", brand: "Renjer", stock: 8, minStock: 10, buyPrice: 920000, sellPrice: 1290000, location: "B-03", updatedAt: "امروز، ۰۹:۱۵" },
  { id: 3, name: "شارژر دیواری RJ-A30", sku: "RJ-A30", category: "شارژر", brand: "Renjer", stock: 0, minStock: 15, buyPrice: 510000, sellPrice: 690000, location: "C-02", updatedAt: "دیروز، ۱۸:۴۰" },
  { id: 4, name: "شارژر فندکی RJ-C120", sku: "RJ-C120", category: "شارژر خودرو", brand: "Renjer", stock: 54, minStock: 20, buyPrice: 640000, sellPrice: 850000, location: "C-05", updatedAt: "دیروز، ۱۲:۱۰" },
  { id: 5, name: "کابل Type-C مدل PD-700", sku: "PD-700-CC", category: "کابل", brand: "TAK", stock: 120, minStock: 35, buyPrice: 155000, sellPrice: 230000, location: "D-08", updatedAt: "۲ روز پیش" },
  { id: 6, name: "پاوربانک Renjer RJ-S1", sku: "RJ-S1", category: "پاوربانک", brand: "Renjer", stock: 14, minStock: 15, buyPrice: 970000, sellPrice: 1310000, location: "A-02", updatedAt: "۳ روز پیش" },
];

const initialMovements: Movement[] = [
  { id: 1, productId: 1, productName: "پاوربانک Renjer RJ-Z20", type: "in", quantity: 20, reason: "خرید از تأمین‌کننده", operator: "مدیر سیستم", date: "امروز، ۱۰:۳۰" },
  { id: 2, productId: 2, productName: "هندزفری بلوتوث RJ-A90", type: "out", quantity: 4, reason: "فروش فاکتور ۱۴۰۵-۲۱۸", operator: "واحد فروش", date: "امروز، ۰۹:۱۵" },
  { id: 3, productId: 3, productName: "شارژر دیواری RJ-A30", type: "out", quantity: 6, reason: "فروش عمده", operator: "واحد فروش", date: "دیروز، ۱۸:۴۰" },
];

const formatPrice = (value: number) => `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;

function loadProducts() {
  try {
    const saved = localStorage.getItem("tak_inventory_products");
    return saved ? (JSON.parse(saved) as Product[]) : initialProducts;
  } catch {
    return initialProducts;
  }
}

function loadMovements() {
  try {
    const saved = localStorage.getItem("tak_inventory_movements");
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
    localStorage.setItem("tak_inventory_products", JSON.stringify(next));
  };

  const persistMovements = (next: Movement[]) => {
    setMovements(next);
    localStorage.setItem("tak_inventory_movements", JSON.stringify(next));
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

  const stats = useMemo(() => {
    const buyValue = products.reduce((sum, item) => sum + item.stock * item.buyPrice, 0);
    const sellValue = products.reduce((sum, item) => sum + item.stock * item.sellPrice, 0);
    return {
      totalUnits: products.reduce((sum, item) => sum + item.stock, 0),
      low: products.filter((item) => statusOf(item) === "low").length,
      out: products.filter((item) => statusOf(item) === "out").length,
      buyValue,
      potentialProfit: sellValue - buyValue,
    };
  }, [products]);

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
      stock: Number(form.get("stock") || 0),
      minStock: Number(form.get("minStock") || 0),
      buyPrice: Number(form.get("buyPrice") || 0),
      sellPrice: Number(form.get("sellPrice") || 0),
      location: String(form.get("location") || ""),
      updatedAt: "همین حالا",
    };
    const next = editingProduct ? products.map((item) => item.id === product.id ? product : item) : [product, ...products];
    persistProducts(next);
    setShowProductModal(false);
  };

  const submitMovement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const quantity = Math.max(1, Number(form.get("quantity") || 1));
    const selected = products.find((item) => item.id === movementProductId);
    if (!selected) return;
    const nextStock = movementType === "in" ? selected.stock + quantity : Math.max(0, selected.stock - quantity);
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
    persistMovements([movement, ...movements].slice(0, 30));
    setShowMovementModal(false);
  };

  const exportCsv = () => {
    const rows = [
      ["نام کالا", "SKU", "دسته‌بندی", "برند", "موجودی", "حداقل موجودی", "قیمت خرید", "قیمت فروش", "مکان"],
      ...products.map((p) => [p.name, p.sku, p.category, p.brand, p.stock, p.minStock, p.buyPrice, p.sellPrice, p.location]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tak-inventory.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="inventoryPage">
      <header className="inventoryHeader">
        <div>
          <span className="inventoryEyebrow"><FaBoxesStacked /> مدیریت عملیات کالا</span>
          <h1>انبار و موجودی</h1>
          <p>کنترل موجودی، ارزش انبار، هشدار کمبود و ثبت گردش کالاها</p>
        </div>
        <div className="inventoryActions">
          <button className="inventoryGhost" type="button" onClick={exportCsv}><FaDownload /> خروجی CSV</button>
          <button className="inventoryGhost" type="button" onClick={() => setShowMovementModal(true)}><FaArrowDown /> ثبت ورود/خروج</button>
          <button className="inventoryPrimary" type="button" onClick={openNewProduct}><FaPlus /> کالای جدید</button>
        </div>
      </header>

      <div className="inventoryStats">
        <article><small>تعداد کل واحد کالا</small><strong>{stats.totalUnits.toLocaleString("fa-IR")}</strong><span>در {products.length.toLocaleString("fa-IR")} قلم کالا</span></article>
        <article><small>ارزش خرید موجودی</small><strong>{formatPrice(stats.buyValue)}</strong><span>سرمایه فعلی انبار</span></article>
        <article className="warning"><small>رو به اتمام</small><strong>{stats.low.toLocaleString("fa-IR")}</strong><span>نیازمند سفارش مجدد</span></article>
        <article className="danger"><small>ناموجود</small><strong>{stats.out.toLocaleString("fa-IR")}</strong><span>فروش متوقف شده</span></article>
        <article><small>سود بالقوه موجودی</small><strong>{formatPrice(stats.potentialProfit)}</strong><span>بر اساس قیمت فروش</span></article>
      </div>

      {(stats.low > 0 || stats.out > 0) && (
        <div className="inventoryAlert"><FaTriangleExclamation /><div><strong>هشدار تأمین موجودی</strong><span>{(stats.low + stats.out).toLocaleString("fa-IR")} کالا به نقطه سفارش یا اتمام موجودی رسیده است.</span></div></div>
      )}

      <div className="inventoryToolbar">
        <label className="inventorySearch"><FaMagnifyingGlass /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو با نام، SKU، برند یا قفسه..." /></label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">همه وضعیت‌ها</option><option value="available">موجود</option><option value="low">رو به اتمام</option><option value="out">ناموجود</option></select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="all">همه دسته‌ها</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
      </div>

      <div className="inventoryContent">
        <div className="inventoryTableCard">
          <div className="inventoryCardTitle"><div><strong>فهرست کالاها</strong><span>{filteredProducts.length.toLocaleString("fa-IR")} نتیجه</span></div></div>
          <div className="inventoryTableWrap">
            <table className="inventoryTable">
              <thead><tr><th>کالا</th><th>دسته/برند</th><th>موجودی</th><th>قیمت‌ها</th><th>محل</th><th>وضعیت</th><th></th></tr></thead>
              <tbody>{filteredProducts.map((product) => {
                const status = statusOf(product);
                return <tr key={product.id}>
                  <td><div className="inventoryProduct"><span>{product.name.slice(0, 1)}</span><div><strong>{product.name}</strong><small>SKU: {product.sku}</small></div></div></td>
                  <td><strong>{product.category}</strong><small>{product.brand}</small></td>
                  <td><strong>{product.stock.toLocaleString("fa-IR")}</strong><small>حداقل: {product.minStock.toLocaleString("fa-IR")}</small></td>
                  <td><strong>{formatPrice(product.sellPrice)}</strong><small>خرید: {formatPrice(product.buyPrice)}</small></td>
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
          <div className="movementList">{movements.slice(0, 8).map((movement) => <article key={movement.id}>
            <span className={`movementIcon ${movement.type}`}>{movement.type === "in" ? <FaArrowDown /> : <FaArrowUp />}</span>
            <div><strong>{movement.productName}</strong><p>{movement.reason}</p><small>{movement.operator} · {movement.date}</small></div>
            <b className={movement.type}>{movement.type === "in" ? "+" : "−"}{movement.quantity.toLocaleString("fa-IR")}</b>
          </article>)}</div>
        </aside>
      </div>

      {showProductModal && <div className="inventoryModalBackdrop" role="presentation"><form className="inventoryModal" onSubmit={submitProduct}>
        <div className="inventoryModalHeader"><div><strong>{editingProduct ? "ویرایش کالا" : "ثبت کالای جدید"}</strong><span>اطلاعات پایه و کنترل موجودی را تکمیل کنید.</span></div><button type="button" onClick={() => setShowProductModal(false)}><FaXmark /></button></div>
        <div className="inventoryFormGrid">
          <label>نام کالا<input name="name" required defaultValue={editingProduct?.name} /></label>
          <label>کد SKU<input name="sku" required defaultValue={editingProduct?.sku} /></label>
          <label>دسته‌بندی<input name="category" required defaultValue={editingProduct?.category} /></label>
          <label>برند<input name="brand" required defaultValue={editingProduct?.brand} /></label>
          <label>موجودی فعلی<input name="stock" type="number" min="0" required defaultValue={editingProduct?.stock ?? 0} /></label>
          <label>حداقل موجودی<input name="minStock" type="number" min="0" required defaultValue={editingProduct?.minStock ?? 5} /></label>
          <label>قیمت خرید<input name="buyPrice" type="number" min="0" required defaultValue={editingProduct?.buyPrice ?? 0} /></label>
          <label>قیمت فروش<input name="sellPrice" type="number" min="0" required defaultValue={editingProduct?.sellPrice ?? 0} /></label>
          <label className="full">محل نگهداری / قفسه<input name="location" defaultValue={editingProduct?.location} placeholder="مثلاً A-01" /></label>
        </div>
        <div className="inventoryModalActions"><button type="button" onClick={() => setShowProductModal(false)}>انصراف</button><button className="primary" type="submit">ذخیره کالا</button></div>
      </form></div>}

      {showMovementModal && <div className="inventoryModalBackdrop" role="presentation"><form className="inventoryModal compact" onSubmit={submitMovement}>
        <div className="inventoryModalHeader"><div><strong>ثبت گردش موجودی</strong><span>ورود یا خروج کالا را ثبت کنید.</span></div><button type="button" onClick={() => setShowMovementModal(false)}><FaXmark /></button></div>
        <label>کالا<select value={movementProductId} onChange={(e) => setMovementProductId(Number(e.target.value))}>{products.map((product) => <option value={product.id} key={product.id}>{product.name} ({product.stock.toLocaleString("fa-IR")})</option>)}</select></label>
        <div className="movementTypeButtons"><button type="button" className={movementType === "in" ? "active in" : ""} onClick={() => setMovementType("in")}><FaArrowDown /> ورود کالا</button><button type="button" className={movementType === "out" ? "active out" : ""} onClick={() => setMovementType("out")}><FaArrowUp /> خروج کالا</button></div>
        <label>تعداد<input name="quantity" type="number" min="1" required defaultValue="1" /></label>
        <label>علت<input name="reason" required placeholder="خرید، فروش، مرجوعی یا اصلاح موجودی" /></label>
        <label>ثبت‌کننده<input name="operator" defaultValue="مدیر سیستم" /></label>
        <div className="inventoryModalActions"><button type="button" onClick={() => setShowMovementModal(false)}>انصراف</button><button className="primary" type="submit">ثبت گردش</button></div>
      </form></div>}
    </section>
  );
}

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { TeamScreen } from "./TeamScreen";
import { ReportsScreen } from "./ReportsScreen";
import { ZReportPreview, type ShiftCashMovement, type ZReportData } from "./ZReportModal";
import { BackButton } from "./BackButton";
import { FMO_CATALOG, FMO_CATEGORIES } from "./data/fmoCatalog";
import { FmoLookbook } from "./website/FmoLookbook";
export type { ShiftCashMovement, ZReportData };
export { ZReportPreview };
import "./App.css";

type AuthMode = "sign-in" | "sign-up";
type Product = {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  price: number;
  stock: number;
  unit: string;
  imageUrl?: string;
  trackInventory?: boolean;
  taxRate?: number;
  fabric?: string;
  rentalPrice?: number;
  colorHex?: string;
  colors?: { name: string; hex: string; family?: string }[];
  variants?: any[];
};

function formatNaira(amount: number) {
  return `N${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeCategoryName(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ").toLowerCase();
  const aliases: Record<string, string> = {
    "double breasted": "Double-Breasted Suits",
    "double-breasted": "Double-Breasted Suits",
    "db": "Double-Breasted Suits",
    "3 piece": "3-Piece Suits",
    "3-piece": "3-Piece Suits",
    "three piece": "3-Piece Suits",
    "jodhpuri": "Jodhpuri / Bandhgala",
    "bandhgala": "Jodhpuri / Bandhgala",
    "2 piece": "2-Piece Suits",
    "2-piece": "2-Piece Suits",
    "two piece": "2-Piece Suits",
    "wrap": "Wrap Suits",
    "wrap suit": "Wrap Suits",
    "tuxedo": "Wedding Tuxedos",
    "tuxedos": "Wedding Tuxedos",
    "wedding": "Wedding Tuxedos",
    "accessories": "Gentleman Essentials",
    "essentials": "Gentleman Essentials",
    "drinks": "Gentleman Essentials",
    "food": "Gentleman Essentials",
  };
  return aliases[cleaned] ?? cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Master master catalog of 47+ FMO luxury sartorial garments & accessories
const demoProducts: Product[] = FMO_CATALOG.map((item) => {
  const cat = FMO_CATEGORIES.find((c) => c.id === item.categoryId);
  const totalStock = item.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 12;
  const firstVariant = item.variants?.[0];
  return {
    id: item.id,
    name: item.name,
    sku: firstVariant?.sku || `FMO-${item.id.toUpperCase()}`,
    category: cat?.name || "Double-Breasted Suits",
    price: item.basePrice,
    stock: totalStock,
    unit: item.categoryId === "accessories" ? "piece" : "suit",
    imageUrl: (item as any).featuredImage || undefined,
    trackInventory: true,
    taxRate: 7.5,
    fabric: item.fabric,
    rentalPrice: item.rentalPrice,
    colorHex: item.primaryColorHex,
    colors: (item as any).availableColors || [{ name: "Classic", hex: item.primaryColorHex || "#1e293b" }],
    variants: item.variants,
  };
});

function ProductsScreen({
  tenantId,
  preview,
  onBack,
}: {
  tenantId?: string;
  preview: boolean;
  onBack: () => void;
}) {
  const [products, setProducts] = useState<Product[]>(
    preview ? demoProducts : [],
  );
  const [loading, setLoading] = useState(!preview && Boolean(tenantId));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockChange, setStockChange] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "General",
    productType: "physical",
    unit: "each",
    sku: "",
    barcode: "",
    price: "",
    cost: "",
    taxRate: "",
    stock: "",
    reorderLevel: "",
    imageUrl: "",
    trackInventory: true,
  });
  const [reorderLevels, setReorderLevels] = useState<Record<string, number>>({});

  useEffect(() => {
    if (preview || !supabase || !tenantId) {
      setLoading(false);
      return;
    }
    async function loadCatalog() {
      const client = supabase;
      if (!client) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: location, error: locationError } = await client.from("locations").select("id").eq("tenant_id", tenantId).eq("active", true).order("created_at").limit(1).maybeSingle();
        if (locationError) { setError(locationError.message); return; }
        const { data: balances, error: balanceError } = location ? await client.from("inventory_balances").select("product_id, quantity, reorder_level").eq("tenant_id", tenantId).eq("location_id", location.id) : { data: [], error: null };
        if (balanceError) { setError(balanceError.message); return; }
        const balanceByProduct = new Map((balances ?? []).map((balance) => [balance.product_id, balance]));
        const { data, error: queryError } = await client.from("products").select("id, name, sku, unit, track_inventory, image_url, product_prices(price)").eq("tenant_id", tenantId).eq("active", true).order("name");
        if (queryError) { setError(queryError.message); return; }
        setProducts((data ?? []).map((product) => {
          const balance = balanceByProduct.get(product.id);
          return { id: product.id, name: product.name, sku: product.sku, unit: product.unit, category: "General", price: Number(Array.isArray(product.product_prices) ? (product.product_prices[0]?.price ?? 0) : 0), stock: Number(balance?.quantity ?? 0), imageUrl: product.image_url, trackInventory: product.track_inventory };
        }));
        setReorderLevels(Object.fromEntries((balances ?? []).map((balance) => [balance.product_id, Number(balance.reorder_level)])));
      } finally {
        setLoading(false);
      }
    }
    void loadCatalog();
  }, [preview, tenantId]);

  useEffect(() => {
    if (preview || !supabase || !tenantId) return;
    supabase.from("categories").select("name").eq("tenant_id", tenantId).order("name").then(({ data }) => {
      setCategoryNames([...new Set((data ?? []).map((item) => normalizeCategoryName(item.name)))]);
    });
  }, [preview, tenantId]);

  const categories = [
    "All",
    "General",
    ...new Set([...categoryNames, ...products.map((product) => product.category)]),
  ];
  const visibleProducts = products.filter(
    (product) =>
      (category === "All" || product.category === category) &&
      product.name.toLowerCase().includes(query.toLowerCase()),
  );

  function startAddingProduct() {
    setEditingProductId(null);
    setShowForm(true);
  }

  function startEditingProduct(product: Product) {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      description: "",
      category: product.category,
      productType: "physical",
      unit: product.unit,
      sku: product.sku ?? "",
      barcode: "",
      price: String(product.price),
      cost: "",
      taxRate: "",
      stock: String(product.stock),
      reorderLevel: "",
      imageUrl: product.imageUrl ?? "",
      trackInventory: product.trackInventory !== false,
    });
    setShowForm(true);
  }

  async function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const newProduct = {
      id: editingProductId ?? crypto.randomUUID(),
      name: form.name,
      sku: form.sku || null,
      category: normalizeCategoryName(form.category || "General"),
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      unit: form.unit,
      imageUrl: form.imageUrl || undefined,
      trackInventory: form.trackInventory,
    };
    if (!preview && supabase && tenantId && editingProductId) {
      setSaving(true);
      const { data: categoryRow, error: categoryError } = await supabase.from("categories").upsert({ tenant_id: tenantId, name: newProduct.category }, { onConflict: "tenant_id,name" }).select("id").single();
      if (categoryError) { setSaving(false); setError(`Category could not be saved: ${categoryError.message}`); return; }
      const { error: updateError } = await supabase.from("products").update({ name: newProduct.name, description: form.description || null, sku: newProduct.sku, barcode: form.barcode || null, product_type: form.productType, unit: form.unit, cost_price: Number(form.cost) || 0, tax_rate: Number(form.taxRate) || 0, image_url: form.imageUrl || null, track_inventory: form.trackInventory }).eq("id", editingProductId).eq("tenant_id", tenantId);
      if (updateError) { setSaving(false); setError(updateError.message); return; }
      if (categoryRow) await supabase.from("products").update({ category_id: categoryRow.id }).eq("id", editingProductId).eq("tenant_id", tenantId);
      const { error: priceError } = await supabase.from("product_prices").insert({ tenant_id: tenantId, product_id: editingProductId, price: newProduct.price });
      if (priceError) { setSaving(false); setError(`Product changed, but price was not saved: ${priceError.message}`); return; }
      if (form.trackInventory) {
        const { data: location, error: locationError } = await supabase.from("locations").select("id").eq("tenant_id", tenantId).eq("active", true).order("created_at").limit(1).maybeSingle();
        if (locationError || !location) { setSaving(false); setError(locationError?.message ?? "No active store location found"); return; }
        const { error: inventoryError } = await supabase.from("inventory_balances").upsert({ tenant_id: tenantId, location_id: location.id, product_id: editingProductId, quantity: newProduct.stock, reorder_level: Number(form.reorderLevel) || 5, updated_at: new Date().toISOString() }, { onConflict: "location_id,product_id" });
        if (inventoryError) { setSaving(false); setError(`Product saved, but stock was not saved: ${inventoryError.message}`); return; }
      }
      setSaving(false);
    } else if (!preview && supabase && tenantId) {
      setSaving(true);
      const { data: categoryRow, error: categoryError } = await supabase.from("categories").upsert({ tenant_id: tenantId, name: newProduct.category }, { onConflict: "tenant_id,name" }).select("id").single();
      if (categoryError) { setSaving(false); setError(`Category could not be saved: ${categoryError.message}`); return; }
      const { data, error: insertError } = await supabase
        .from("products")
        .insert({
          tenant_id: tenantId,
          name: newProduct.name,
          description: form.description || null,
          sku: newProduct.sku,
          barcode: form.barcode || null,
          product_type: form.productType,
          unit: form.unit,
          cost_price: Number(form.cost) || 0,
          tax_rate: Number(form.taxRate) || 0,
          image_url: form.imageUrl || null,
          track_inventory: form.trackInventory,
          category_id: categoryRow?.id ?? null,
        })
        .select("id")
        .single();
      setSaving(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      newProduct.id = data.id;
      const { error: priceError } = await supabase
        .from("product_prices")
        .insert({
          tenant_id: tenantId,
          product_id: data.id,
          price: newProduct.price,
        });
      if (priceError) {
        setError(
          `Product added, but price was not saved: ${priceError.message}`,
        );
        return;
      }
      const { data: location } = await supabase.from("locations").select("id").eq("tenant_id", tenantId).limit(1).maybeSingle();
      if (location && form.trackInventory) {
        const { error: inventoryError } = await supabase.from("inventory_balances").upsert({ tenant_id: tenantId, location_id: location.id, product_id: data.id, quantity: Number(form.stock) || 0, reorder_level: Number(form.reorderLevel) || 5 }, { onConflict: "location_id,product_id" });
        if (inventoryError) { setError(`Product and price saved, but stock was not saved: ${inventoryError.message}`); return; }
      }
    }
    setProducts((current) => editingProductId ? current.map((product) => product.id === editingProductId ? newProduct : product) : [...current, newProduct]);
    setReorderLevels((current) => ({ ...current, [newProduct.id]: Number(form.reorderLevel) || 5 }));
    setForm({
      name: "",
      description: "",
      category: "General",
      productType: "physical",
      unit: "each",
      sku: "",
      barcode: "",
      price: "",
      cost: "",
      taxRate: "",
      stock: "",
      reorderLevel: "",
      imageUrl: "",
      trackInventory: true,
    });
    setShowForm(false);
    setEditingProductId(null);
  }

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = normalizeCategoryName(newCategory);
    if (!name) return;
    setError("");
    if (!preview && supabase && tenantId) {
      const { error: categoryError } = await supabase.from("categories").upsert({ tenant_id: tenantId, name }, { onConflict: "tenant_id,name" });
      if (categoryError) { setError(`Category could not be saved: ${categoryError.message}`); return; }
    }
    setCategoryNames((current) => current.includes(name) ? current : [...current, name]);
    setCategory(name);
    setNewCategory("");
    setShowCategoryForm(false);
  }

  async function adjustStock() {
    if (!stockProduct) return;
    const amount = Number(stockChange);
    if (!Number.isFinite(amount)) return;
    if (!preview && supabase && tenantId) {
      const client = supabase;
      setSaving(true);
      const { data: location, error: locationError } = await client.from("locations").select("id").eq("tenant_id", tenantId).eq("active", true).order("created_at").limit(1).maybeSingle();
      if (locationError || !location) { setSaving(false); setError(locationError?.message ?? "No active store location found"); return; }
      const { data: balance, error: balanceError } = await client.from("inventory_balances").select("quantity, reorder_level").eq("tenant_id", tenantId).eq("location_id", location.id).eq("product_id", stockProduct.id).maybeSingle();
      if (balanceError) { setSaving(false); setError(`Stock could not be loaded: ${balanceError.message}`); return; }
      const quantity = Math.max(0, Number(balance?.quantity ?? stockProduct.stock) + amount);
      const { error: inventoryError } = await client.from("inventory_balances").upsert({ tenant_id: tenantId, location_id: location.id, product_id: stockProduct.id, quantity, reorder_level: Number(balance?.reorder_level ?? 5), updated_at: new Date().toISOString() }, { onConflict: "location_id,product_id" });
      if (inventoryError) { setSaving(false); setError(`Stock could not be saved: ${inventoryError.message}`); return; }
      const { error: movementError } = await client.from("inventory_movements").insert({ tenant_id: tenantId, location_id: location.id, product_id: stockProduct.id, movement_type: amount >= 0 ? "purchase" : "adjustment", quantity: amount });
      if (movementError) { setSaving(false); setError(`Stock changed, but movement history was not saved: ${movementError.message}`); return; }
      setSaving(false);
    }
    setProducts((current) => current.map((product) => product.id === stockProduct.id ? { ...product, stock: preview ? Math.max(0, product.stock + amount) : product.stock + amount } : product));
    setStockProduct(null);
    setStockChange("");
  }

  return (
    <main className="catalog-shell">
      <header className="catalog-header">
        <BackButton onClick={onBack} label="Home" />
        <div>
          <p className="eyebrow">Products & stock</p>
          <h1>What you sell</h1>
        </div>
      </header>
      {preview && <div className="demo-banner"><strong>Demo mode</strong><span>Products added here stay in this browser and are not sent to Supabase.</span></div>}
      <section className="catalog-toolbar">
        <input
          aria-label="Search products"
          placeholder="Search products..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="category-filter">
          <button className={category !== "All" ? "filter-button active" : "filter-button"} type="button" aria-label="Filter by category" aria-expanded={showCategoryFilter} onClick={() => setShowCategoryFilter((current) => !current)}>
            <span className="funnel-icon" aria-hidden="true" />
            <span className="filter-label">{category === "All" ? "All categories" : category}</span>
          </button>
          {showCategoryFilter && <div className="filter-menu" role="menu">{categories.map((item) => <button className={category === item ? "selected" : ""} key={item} type="button" role="menuitem" onClick={() => { setCategory(item); setShowCategoryFilter(false); }}>{item}</button>)}</div>}
        </div>
        <div className="catalog-actions">
          <button className="secondary-button" type="button" onClick={() => setShowCategoryForm(true)}>
            Add category <span>+</span>
          </button>
          <button className="primary-button" type="button" onClick={startAddingProduct}>
            Add product <span>+</span>
          </button>
        </div>
      </section>
      {error && <p className="form-error catalog-error">{error}</p>}
      <section className="product-list" aria-label="Products">
        {loading ? (
          <div className="catalog-loading-wrap">
            <div className="catalog-loading-badge">
              <span className="catalog-loading-spinner" />
              <span>Loading products & inventory...</span>
            </div>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="product-row skeleton-row">
                <div className="product-symbol skeleton-box" />
                <div className="product-info">
                  <div className="skeleton-bar skeleton-title" />
                  <div className="skeleton-bar skeleton-meta" />
                </div>
                <div className="product-price">
                  <div className="skeleton-bar skeleton-price" />
                </div>
                <div className="stock">
                  <div className="skeleton-bar skeleton-stock" />
                </div>
                <div className="product-actions">
                  <div className="skeleton-btn" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {visibleProducts.map((product) => (
              <article className="product-row" key={product.id}>
                <div className="product-symbol">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : product.name.slice(0, 1)}</div>
                <div className="product-info">
                  <strong>{product.name}</strong>
                  <span>
                    {product.sku ?? "No SKU"} · {product.category} · {product.unit}
                  </span>
                  {product.trackInventory !== false && <button className="stock-button" type="button" onClick={() => setStockProduct(product)}>Adjust stock</button>}
                </div>
                <div className="product-price">{formatNaira(product.price)}</div>
                <div className={product.stock <= (reorderLevels[product.id] ?? 5) ? "stock low" : "stock"}>
                  <strong>{product.trackInventory === false ? "—" : product.stock}</strong>
                  <span>{product.trackInventory === false ? "not tracked" : "in stock"}</span>
                </div>
                <div className="product-actions">
                  <button
                    className="row-action"
                    type="button"
                    aria-label={`Edit ${product.name}`}
                    onClick={() => startEditingProduct(product)}
                  >
                    ···
                  </button>
                </div>
              </article>
            ))}
            {visibleProducts.length === 0 && (
              <div className="empty-state">
                <strong>No products found</strong>
                <span>Try another search or add your first product.</span>
              </div>
            )}
          </>
        )}
      </section>
      {showForm && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="product-modal product-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-product-heading"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">{editingProductId ? "Edit product" : "New product"}</p>
                <h2 id="add-product-heading">{editingProductId ? "Change product details" : "Add something to sell"}</h2>
                <p className="modal-subtitle">Only fill in what makes sense for this item.</p>
              </div>
              <button
                className="close-button"
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={addProduct}>
              <div className="form-section"><h3>Basic details</h3><div className="form-columns"><label className="field-wide">Product name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. House blend coffee" required /></label><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="">Choose a category</option>{categories.filter((item) => item !== "All").map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div><label>Description <span className="optional">optional</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What should staff know about it?" /></label></div>
              <div className="form-section"><h3>How is it sold?</h3><div className="form-columns"><label>Product type<select value={form.productType} onChange={(event) => setForm({ ...form, productType: event.target.value })}><option value="physical">Physical product</option><option value="food">Food or drink</option><option value="medicine">Medicine or pharmacy item</option><option value="clothing">Clothing</option><option value="gadget">Gadget or electronics</option><option value="service">Service or other</option></select></label><label>Sold by<select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}><option value="each">Each</option><option value="weight">Weight</option><option value="bundle">Bundle</option><option value="pack">Pack</option><option value="box">Box</option><option value="litre">Litre</option><option value="metre">Metre</option><option value="hour">Hour</option></select></label></div></div>
              <div className="form-section"><h3>Price and codes</h3><div className="form-columns"><label>Selling price<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="0.00" required /></label><label>Cost price <span className="optional">optional</span><input type="number" min="0" step="0.01" value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value })} placeholder="0.00" /></label><label>Tax rate % <span className="optional">optional</span><input type="number" min="0" step="0.001" value={form.taxRate} onChange={(event) => setForm({ ...form, taxRate: event.target.value })} placeholder="0" /></label><label>SKU <span className="optional">optional</span><input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} placeholder="COF-001" /></label><label>Barcode <span className="optional">optional</span><input value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} placeholder="Scan or type barcode" /></label></div></div>
              <div className="form-section"><h3>Stock and checkout display</h3><label className="toggle-label"><input type="checkbox" checked={form.trackInventory} onChange={(event) => setForm({ ...form, trackInventory: event.target.checked })} /> Track inventory for this product</label>{form.trackInventory && <div className="form-columns"><label>Starting stock<input type="number" min="0" step="0.001" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} placeholder="0" /></label><label>Warn me when stock reaches<input type="number" min="0" step="0.001" value={form.reorderLevel} onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })} placeholder="5" /></label></div>}<label>POS image URL <span className="optional">optional</span><input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="Paste an image URL, or add one later" /></label><p className="field-help">Cashiers will see the image in checkout when one is added. Without an image, the product will use its first letter and color.</p></div>
              <button
                className="primary-button auth-submit"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : editingProductId ? "Save changes" : "Add product"} <span>→</span>
              </button>
            </form>
          </section>
        </div>
      )}
      {stockProduct && <div className="modal-backdrop" role="presentation"><section className="product-modal stock-modal" role="dialog" aria-modal="true" aria-labelledby="stock-heading"><div className="modal-heading"><div><p className="eyebrow">Stock change</p><h2 id="stock-heading">{stockProduct.name}</h2><p className="modal-subtitle">Current stock: {stockProduct.stock} {stockProduct.unit}</p></div><button className="close-button" type="button" onClick={() => setStockProduct(null)} aria-label="Close">×</button></div><form onSubmit={(event) => { event.preventDefault(); void adjustStock(); }}><label>Change in stock<input type="number" step="0.001" value={stockChange} onChange={(event) => setStockChange(event.target.value)} placeholder="Use a positive or negative number" autoFocus required /></label><p className="field-help">Example: enter 12 to receive stock, or -2 for damaged goods.</p><button className="primary-button auth-submit" type="submit" disabled={saving}>Save stock change <span>→</span></button></form></section></div>}
      {showCategoryForm && <div className="modal-backdrop" role="presentation"><section className="product-modal category-modal" role="dialog" aria-modal="true" aria-labelledby="category-heading"><div className="modal-heading"><div><p className="eyebrow">Organise products</p><h2 id="category-heading">Add a category</h2><p className="modal-subtitle">Use categories to keep the product list and checkout tidy.</p></div><button className="close-button" type="button" onClick={() => setShowCategoryForm(false)} aria-label="Close">×</button></div><form onSubmit={addCategory}><label>Category name<input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="e.g. Drinks, Pharmacy, Clothing" autoFocus required /></label><button className="primary-button auth-submit" type="submit">Add category <span>→</span></button></form></section></div>}
    </main>
  );
}

type CartLine = {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  orderType?: "sale" | "rental";
  unitPrice?: number;
  requiresAlteration?: boolean;
  alterationNotes?: string;
  measurements?: {
    chest?: string;
    waist?: string;
    inseam?: string;
    sleeve?: string;
  };
};

type ReceiptSettings = {
  storeName: string;
  addressLines: string;
  phone: string;
  tin: string;
  rcNumber: string;
  regulatoryLicense?: string;
  vatRate: number;
  receiptFooter: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  receiptPaperWidth?: "58mm" | "80mm";
  returnPolicy?: string;
  showCashierOnReceipt?: boolean;
  showRegisterOnReceipt?: boolean;
};

type StoreRegister = {
  id: string;
  name: string;
  active: boolean;
  code?: string;
};

const demoRegisters: StoreRegister[] = [
  { id: "fmo-reg-1", name: "Enugu Flagship Register 1 (Main Floor)", active: true, code: "FMO-01" },
  { id: "fmo-reg-2", name: "VIP Fitting Suite Register 2", active: true, code: "FMO-02" },
];

type ReceiptData = {
  lines: CartLine[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  depositAmount?: number;
  balanceDue?: number;
  cash: number;
  paymentMethod: string;
  paymentReference?: string;
  change: number;
  receiptNumber: string;
  settings: ReceiptSettings;
  cashierName?: string;
  registerName?: string;
  requiresAlterations?: boolean;
};

type CashierMember = {
  id: string;
  name: string;
  role: "owner" | "manager" | "cashier";
  pin?: string;
  hasPin?: boolean;
  pinHash?: string | null;
};

async function hashPinClientSide(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`storeflow_pin_salt_${pin}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "sha256_" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const demoCashiers: CashierMember[] = [
  { id: "fmo-cashier-1", name: "Tony Ubagu (Lead Stylist)", role: "manager", pin: "1234", hasPin: true },
  { id: "fmo-cashier-2", name: "Chidi Okonkwo (Senior Tailor)", role: "cashier", pin: "5678", hasPin: true },
  { id: "fmo-cashier-3", name: "Emeka Ani (Fitting Assistant)", role: "cashier", pin: "9999", hasPin: true },
  { id: "fmo-owner", name: "FMO Store Owner", role: "owner", pin: "1111", hasPin: true },
];

function CashierPinModal({
  cashiers,
  activeCashier,
  preview,
  tenantId,
  onUnlock,
  onCancel,
  onExit,
}: {
  cashiers: CashierMember[];
  activeCashier: CashierMember | null;
  preview: boolean;
  tenantId?: string;
  onUnlock: (cashier: CashierMember) => void;
  onCancel?: () => void;
  onExit?: () => void;
}) {
  const [selected, setSelected] = useState<CashierMember | null>(activeCashier || null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) {
        if (selected) handleDigit(e.key);
      } else if (e.key === "Backspace") {
        if (selected) handleBackspace();
      } else if (e.key === "Escape") {
        if (selected && !activeCashier) {
          setSelected(null);
          setPin("");
          setError("");
        } else if (onCancel) {
          onCancel();
        } else if (onExit) {
          onExit();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, pin, verifying, success]);

  function handleDigit(digit: string) {
    if (pin.length >= 4 || verifying || success) return;
    setError("");
    const nextPin = pin + digit;
    setPin(nextPin);
    if (nextPin.length === 4 && selected) {
      if (!selected.hasPin) {
        void handleSetPin(selected, nextPin);
      } else {
        void verifyPin(selected, nextPin);
      }
    }
  }

  function handleBackspace() {
    if (verifying || success) return;
    setError("");
    setPin((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    if (verifying || success) return;
    setError("");
    setPin("");
  }

  async function handleSetPin(member: CashierMember, newPin: string) {
    setVerifying(true);
    setError("");

    if (preview) {
      member.hasPin = true;
      member.pin = newPin;
      setSuccess(true);
      setTimeout(() => {
        onUnlock(member);
      }, 450);
      setVerifying(false);
      return;
    }

    try {
      const hashed = await hashPinClientSide(newPin);

      if (supabase && tenantId) {
        // 1. Try set_cashier_pin RPC
        const { error: rpcErr } = await supabase.rpc("set_cashier_pin", {
          target_tenant_id: tenantId,
          target_member_id: member.id,
          new_pin: newPin,
        });

        if (rpcErr) {
          // 2. Direct table update
          const { error: updErr } = await supabase
            .from("tenant_members")
            .update({ pin_hash: hashed })
            .eq("id", member.id)
            .eq("tenant_id", tenantId);

          if (updErr) {
            // 3. Fallback upsert_team_member
            await supabase.rpc("upsert_team_member", {
              target_tenant_id: tenantId,
              member_id: member.id,
              member_pin: newPin,
            });
          }
        }
      }

      member.hasPin = true;
      member.pinHash = hashed;
      setSuccess(true);
      setTimeout(() => {
        onUnlock({
          id: member.id,
          name: member.name,
          role: member.role,
        });
      }, 450);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set PIN";
      triggerError(msg);
    } finally {
      setVerifying(false);
    }
  }

  async function verifyPin(member: CashierMember, candidatePin: string) {
    setVerifying(true);
    if (preview) {
      await new Promise((r) => setTimeout(r, 250));
      if (candidatePin === (member.pin || "1234")) {
        setSuccess(true);
        setTimeout(() => {
          onUnlock(member);
        }, 450);
      } else {
        triggerError("Incorrect PIN. Please try again.");
      }
      setVerifying(false);
      return;
    }

    if (!supabase || !tenantId) {
      triggerError("Cannot verify PIN without an active store connection.");
      setVerifying(false);
      return;
    }

    // 1. Instant client-side verification if member.pinHash was loaded from database
    if (member.pinHash) {
      try {
        const clientHash = await hashPinClientSide(candidatePin);
        const rawHex = clientHash.replace("sha256_", "");
        if (
          member.pinHash === clientHash ||
          member.pinHash === rawHex ||
          member.pinHash === candidatePin
        ) {
          setSuccess(true);
          setTimeout(() => {
            onUnlock({
              id: member.id,
              name: member.name,
              role: member.role,
            });
          }, 450);
          setVerifying(false);
          return;
        }
      } catch {}
    }

    // 2. Server RPC verification (with pgcrypto / database verification)
    try {
      const { data, error: rpcError } = await supabase.rpc("verify_cashier_pin", {
        target_tenant_id: tenantId,
        target_member_id: member.id,
        candidate_pin: candidatePin,
      });

      if (rpcError) {
        // Fallback check in case server RPC errored out
        if (member.pinHash) {
          try {
            const clientHash = await hashPinClientSide(candidatePin);
            const rawHex = clientHash.replace("sha256_", "");
            if (
              member.pinHash === clientHash ||
              member.pinHash === rawHex ||
              member.pinHash === candidatePin
            ) {
              setSuccess(true);
              setTimeout(() => {
                onUnlock({
                  id: member.id,
                  name: member.name,
                  role: member.role,
                });
              }, 450);
              return;
            }
          } catch {}
        }
        triggerError(rpcError.message || "Failed to verify PIN");
      } else if (data && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onUnlock({
            id: member.id,
            name: data.display_name || member.name,
            role: member.role,
          });
        }, 450);
      } else if (data?.error && data.error.includes("No PIN configured")) {
        // Server says no PIN configured, switch seamlessly to set-pin mode!
        member.hasPin = false;
        setSelected({ ...member, hasPin: false });
        setPin("");
        setError("No PIN configured yet. Enter 4 digits to create your PIN now.");
      } else {
        triggerError(data?.error || "Incorrect PIN. Please try again.");
      }
    } catch {
      triggerError("PIN verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  function triggerError(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setTimeout(() => setPin(""), 800);
  }

  return (
    <div className="modal-backdrop cashier-pin-backdrop" role="dialog" aria-modal="true">
      <div className="cashier-pin-card">
        <div className="pin-card-top-nav">
          <span />
          {onExit && (
            <button
              type="button"
              className="pin-close-icon-btn"
              onClick={onExit}
              title="Close and return to Home dashboard"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        {!selected ? (
          <div className="cashier-selection-panel">
            <div className="pin-card-header">
              <span className="pin-badge-icon">🔒</span>
              <h2>Register Locked</h2>
              <p>Select who is on duty to unlock the till</p>
            </div>
            <div className="cashier-tiles-list">
              {cashiers.length === 0 ? (
                <div className="pin-loading-cashiers">
                  <span>Loading store team members...</span>
                </div>
              ) : (
                cashiers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="cashier-tile"
                    onClick={() => {
                      setSelected(c);
                      setPin("");
                      setError("");
                    }}
                  >
                    <div className="cashier-avatar">{c.name.slice(0, 1).toUpperCase()}</div>
                    <div className="cashier-meta">
                      <strong>{c.name}</strong>
                      <div className="cashier-meta-sub">
                        <span className={`role-badge ${c.role}`}>
                          {c.role === "owner" ? "Owner" : c.role === "manager" ? "Manager" : "Cashier"}
                        </span>
                        {!c.hasPin && <span className="pin-needed-badge">🔑 Set PIN</span>}
                      </div>
                    </div>
                    <span className="cashier-select-arrow">→</span>
                  </button>
                ))
              )}
            </div>
            {preview && (
              <div className="pin-demo-hint">
                💡 <strong>Demo Mode:</strong> Amina (1234) · John (5678) · David (9999) · Owner (1111)
              </div>
            )}
            {onCancel && activeCashier && (
              <div className="pin-modal-bottom-bar">
                <button type="button" className="secondary-button" onClick={onCancel}>
                  Cancel & Keep {activeCashier.name}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="pin-pad-panel">
            <div className="pin-card-header">
              <div className="selected-cashier-pill">
                <span className="cashier-avatar-sm">{selected.name.slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{selected.name}</strong>
                  <small>{selected.role.toUpperCase()}</small>
                </div>
                <button
                  type="button"
                  className="switch-user-link"
                  onClick={() => {
                    setSelected(null);
                    setPin("");
                    setError("");
                  }}
                >
                  Change staff
                </button>
              </div>
              <p className="pin-prompt-title">
                {!selected.hasPin ? "🔑 Set Your 4-Digit PIN" : "Enter 4-Digit Cashier PIN"}
              </p>
              {!selected.hasPin && (
                <p className="pin-prompt-subtitle">
                  No PIN set for this account yet. Enter 4 digits to create your PIN and unlock:
                </p>
              )}
            </div>

            <div className={`pin-dots-container ${shake ? "shake" : ""} ${success ? "success" : ""}`}>
              {[0, 1, 2, 3].map((idx) => (
                <span
                  key={idx}
                  className={`pin-dot ${pin.length > idx ? "active" : ""} ${success ? "success" : ""} ${
                    error ? "error" : ""
                  }`}
                />
              ))}
            </div>

            {error && <div className="pin-error-text">{error}</div>}
            {success && (
              <div className="pin-success-text">
                {!selected.hasPin ? "✓ PIN created! Opening till..." : "✓ Verified! Opening till..."}
              </div>
            )}
            {verifying && <div className="pin-verifying-text">Processing...</div>}

            <div className="pin-numpad">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  className="pin-key"
                  disabled={verifying || success}
                  onClick={() => handleDigit(digit)}
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                className="pin-key pin-key-action"
                disabled={verifying || success || !pin}
                onClick={handleClear}
                title="Clear"
              >
                C
              </button>
              <button
                type="button"
                className="pin-key"
                disabled={verifying || success}
                onClick={() => handleDigit("0")}
              >
                0
              </button>
              <button
                type="button"
                className="pin-key pin-key-action"
                disabled={verifying || success || !pin}
                onClick={handleBackspace}
                title="Backspace"
              >
                ⌫
              </button>
            </div>

            {preview && selected.hasPin && (
              <div className="pin-demo-hint">
                💡 Demo PIN for {selected.name}: <strong>{selected.pin || "1234"}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type StoreSettingsTab = "general" | "registers" | "receipt" | "payments";

function StoreSettingsScreen({
  tenantId,
  preview,
  onBack,
}: {
  tenantId?: string;
  preview: boolean;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<StoreSettingsTab>("general");
  const [form, setForm] = useState({
    legalName: preview ? "FMO (For Men Only)" : "",
    addressLines: preview ? "Hilmak Place Plaza Plot C, 1A Pocket Layout\nTrans-Ekulu by Bilante Flyover, Enugu" : "",
    phone: preview ? "+234 701 813 5116" : "",
    tin: preview ? "31948201-0001" : "",
    rcNumber: preview ? "RC 1948210" : "",
    regulatoryLicense: preview ? "FMO/EN/SARTORIAL/2026 (Luxury Tailoring Certification)" : "",
    vatRate: "7.5",
    receiptFooter: "No 1 Suit Store in Enugu • Delivering Class & Culture\nThank you for choosing FMO Luxury Sartorial",
    returnPolicy: "ALTERATIONS GUARANTEED WITHIN 7 DAYS.\nBESPOKE CUTTINGS ARE NON-REFUNDABLE.\nTHANK YOU FOR ELEVATING CLASS & CULTURE.",
    receiptPaperWidth: "80mm" as "58mm" | "80mm",
    showCashierOnReceipt: true,
    showRegisterOnReceipt: true,
    bankName: preview ? "Zenith Bank PLC" : "",
    bankAccountNumber: preview ? "1018944521" : "",
    bankAccountName: preview ? "FMO LUXURY MENSWEAR LIMITED" : "",
    enableCashDrawerShifts: true,
  });

  const [registers, setRegisters] = useState<StoreRegister[]>(() => {
    if (preview) {
      const saved = localStorage.getItem("storeflow_demo_registers");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
      return demoRegisters;
    }
    return [];
  });

  const [currentDeviceRegister, setCurrentDeviceRegister] = useState<string>(() => {
    return localStorage.getItem("storeflow_default_register") || "Register 1 (Main)";
  });

  const [newRegisterName, setNewRegisterName] = useState("");
  const [editingRegisterId, setEditingRegisterId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (preview) {
      const saved = localStorage.getItem("storeflow_demo_store_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setForm((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }
      return;
    }

    if (!supabase || !tenantId) return;

    supabase
      .from("tenants")
      .select("name, legal_name, address_lines, phone, tin, rc_number, vat_rate, receipt_footer, regulatory_license, bank_name, bank_account_number, bank_account_name, receipt_paper_width, return_policy, show_cashier_on_receipt, show_register_on_receipt, enable_cash_drawer_shifts")
      .eq("id", tenantId)
      .single()
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError(queryError.message);
        } else if (data) {
          setForm({
            legalName: data.legal_name ?? data.name ?? "",
            addressLines: data.address_lines ?? "",
            phone: data.phone ?? "",
            tin: data.tin ?? "",
            rcNumber: data.rc_number ?? "",
            regulatoryLicense: data.regulatory_license ?? "",
            vatRate: String(data.vat_rate ?? 7.5),
            receiptFooter: data.receipt_footer ?? "Thank you for shopping with us!",
            returnPolicy: data.return_policy ?? "NO REFUND OF MONEY AFTER PAYMENT.\nEXCHANGE WITHIN 48 HRS WITH THIS TICKET.\nVALID ONLY IN GOOD CONDITION.",
            receiptPaperWidth: (data.receipt_paper_width as "58mm" | "80mm") || "80mm",
            showCashierOnReceipt: data.show_cashier_on_receipt !== false,
            showRegisterOnReceipt: data.show_register_on_receipt !== false,
            bankName: data.bank_name ?? "",
            bankAccountNumber: data.bank_account_number ?? "",
            bankAccountName: data.bank_account_name ?? "",
            enableCashDrawerShifts: data.enable_cash_drawer_shifts !== false,
          });
          localStorage.setItem("storeflow_enable_drawer_shifts", String(data.enable_cash_drawer_shifts !== false));
        }
      });

    void loadRegisters();
  }, [preview, tenantId]);

  async function loadRegisters() {
    if (!supabase || !tenantId) return;
    const { data, error: regError } = await supabase
      .from("registers")
      .select("id, name, active")
      .eq("tenant_id", tenantId)
      .order("name");

    if (regError) {
      setError(regError.message);
    } else if (data && data.length > 0) {
      setRegisters(data);
    } else {
      const { data: rpcData } = await supabase.rpc("get_or_create_tenant_registers", {
        target_tenant_id: tenantId,
      });
      if (Array.isArray(rpcData) && rpcData.length > 0) {
        setRegisters(rpcData);
      }
    }
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (preview) {
      localStorage.setItem("storeflow_demo_store_settings", JSON.stringify(form));
      localStorage.setItem("storeflow_enable_drawer_shifts", String(form.enableCashDrawerShifts));
      setMessage("Store settings saved successfully (Demo Mode).");
      setTimeout(() => setMessage(""), 3500);
      return;
    }

    if (!supabase || !tenantId) return;
    setSaving(true);

    const { error: saveError } = await supabase
      .from("tenants")
      .update({
        legal_name: form.legalName || null,
        address_lines: form.addressLines || null,
        phone: form.phone || null,
        tin: form.tin || null,
        rc_number: form.rcNumber || null,
        vat_rate: Number(form.vatRate) || 7.5,
        receipt_footer: form.receiptFooter || null,
        regulatory_license: form.regulatoryLicense || null,
        bank_name: form.bankName || null,
        bank_account_number: form.bankAccountNumber || null,
        bank_account_name: form.bankAccountName || null,
        receipt_paper_width: form.receiptPaperWidth || "80mm",
        return_policy: form.returnPolicy || null,
        show_cashier_on_receipt: form.showCashierOnReceipt,
        show_register_on_receipt: form.showRegisterOnReceipt,
        enable_cash_drawer_shifts: form.enableCashDrawerShifts,
      })
      .eq("id", tenantId);

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
    } else {
      localStorage.setItem("storeflow_enable_drawer_shifts", String(form.enableCashDrawerShifts));
      setMessage("Store settings saved successfully.");
      setTimeout(() => setMessage(""), 3500);
    }
  }

  async function handleToggleDrawerShifts(checked: boolean) {
    const updated = { ...form, enableCashDrawerShifts: checked };
    setForm(updated);
    localStorage.setItem("storeflow_enable_drawer_shifts", String(checked));

    if (preview) {
      localStorage.setItem("storeflow_demo_store_settings", JSON.stringify(updated));
      setMessage(`Till drawer & shift tracking ${checked ? "enabled" : "disabled"}.`);
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    if (!supabase || !tenantId) return;
    const { error: err } = await supabase
      .from("tenants")
      .update({ enable_cash_drawer_shifts: checked })
      .eq("id", tenantId);

    if (err) {
      setError(err.message);
    } else {
      setMessage(`Till drawer & shift tracking ${checked ? "enabled" : "disabled"}.`);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function handleSetDeviceDefault(registerName: string) {
    localStorage.setItem("storeflow_default_register", registerName);
    setCurrentDeviceRegister(registerName);
    setMessage(`This device is now assigned to "${registerName}" by default.`);
    setTimeout(() => setMessage(""), 3500);
  }

  async function handleAddRegister(event: React.FormEvent) {
    event.preventDefault();
    if (!newRegisterName.trim()) return;
    const regName = newRegisterName.trim();
    setError("");
    setMessage("");

    if (preview) {
      const newReg: StoreRegister = {
        id: `demo-reg-${Date.now()}`,
        name: regName,
        active: true,
      };
      const updated = [...registers, newReg];
      setRegisters(updated);
      localStorage.setItem("storeflow_demo_registers", JSON.stringify(updated));
      setNewRegisterName("");
      setMessage(`Register "${regName}" created successfully.`);
      setTimeout(() => setMessage(""), 3500);
      return;
    }

    if (!supabase || !tenantId) return;
    setSaving(true);
    const { data: locs } = await supabase.from("locations").select("id").eq("tenant_id", tenantId).limit(1);
    const locationId = locs && locs.length > 0 ? locs[0].id : null;

    const { error: insError } = await supabase.from("registers").insert({
      tenant_id: tenantId,
      location_id: locationId,
      name: regName,
      active: true,
    });
    setSaving(false);

    if (insError) {
      setError(insError.message);
    } else {
      setNewRegisterName("");
      setMessage(`Register "${regName}" created.`);
      setTimeout(() => setMessage(""), 3500);
      void loadRegisters();
    }
  }

  async function handleToggleRegisterActive(reg: StoreRegister) {
    setError("");
    if (preview) {
      const updated = registers.map((r) => (r.id === reg.id ? { ...r, active: !r.active } : r));
      setRegisters(updated);
      localStorage.setItem("storeflow_demo_registers", JSON.stringify(updated));
      return;
    }

    if (!supabase || !tenantId) return;
    const { error: updError } = await supabase
      .from("registers")
      .update({ active: !reg.active })
      .eq("id", reg.id);
    if (updError) setError(updError.message);
    else void loadRegisters();
  }

  async function handleRenameRegister(regId: string) {
    if (!editingName.trim()) return;
    const name = editingName.trim();
    setError("");

    if (preview) {
      const updated = registers.map((r) => (r.id === regId ? { ...r, name } : r));
      setRegisters(updated);
      localStorage.setItem("storeflow_demo_registers", JSON.stringify(updated));
      const target = registers.find((r) => r.id === regId);
      if (target && currentDeviceRegister === target.name) {
        localStorage.setItem("storeflow_default_register", name);
        setCurrentDeviceRegister(name);
      }
      setEditingRegisterId(null);
      setEditingName("");
      return;
    }

    if (!supabase || !tenantId) return;
    const { error: updError } = await supabase
      .from("registers")
      .update({ name })
      .eq("id", regId);
    if (updError) {
      setError(updError.message);
    } else {
      setEditingRegisterId(null);
      setEditingName("");
      void loadRegisters();
    }
  }

  return (
    <main className="settings-shell">
      <header className="settings-header">
        <BackButton onClick={onBack} label="Home" />
        <div className="settings-title-block">
          <p className="eyebrow">Store administration</p>
          <h1>Store settings</h1>
          <p className="intro">
            Configure your store identity, checkout registers, thermal printing, and payment accounts.
          </p>
        </div>
      </header>

      {/* Settings Sub-nav Tabs */}
      <nav className="settings-subnav" aria-label="Store settings sections">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          <span className="tab-icon">🏢</span>
          <span>General & Tax</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "registers" ? "active" : ""}`}
          onClick={() => setActiveTab("registers")}
        >
          <span className="tab-icon">🖥️</span>
          <span>Registers & Tills</span>
          <span className="tab-pill-count">{registers.length}</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "receipt" ? "active" : ""}`}
          onClick={() => setActiveTab("receipt")}
        >
          <span className="tab-icon">🧾</span>
          <span>Receipt & Printing</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          <span className="tab-icon">💳</span>
          <span>Payment Accounts</span>
        </button>
      </nav>

      {message && <div className="form-notice settings-banner-notice">{message}</div>}
      {error && <div className="form-error settings-banner-error">{error}</div>}

      {/* ── TAB 1: GENERAL & TAX ── */}
      {activeTab === "general" && (
        <form className="settings-card" onSubmit={saveSettings}>
          <div className="form-section">
            <div className="section-title-wrap">
              <h3>Business & Legal Identity</h3>
              <p className="section-desc">Official details that establish your business identity on invoices and tax authorities.</p>
            </div>
            <div className="form-columns">
              <label>
                Legal / Registered Store Name
                <input
                  value={form.legalName}
                  onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                  placeholder="e.g. Northline Pharmacy & Stores Ltd"
                  required
                />
              </label>
              <label>
                Official Phone Number
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. +234 803 123 4567"
                />
              </label>
            </div>
            <label>
              Physical Business Address
              <textarea
                rows={3}
                value={form.addressLines}
                onChange={(e) => setForm({ ...form, addressLines: e.target.value })}
                placeholder="e.g. Plot 14, Adeola Odeku Street&#10;Victoria Island, Lagos"
              />
            </label>
            <div className="form-columns">
              <label>
                Corporate Affairs Commission (CAC RC / BN)
                <input
                  value={form.rcNumber}
                  onChange={(e) => setForm({ ...form, rcNumber: e.target.value })}
                  placeholder="e.g. RC 1892044 or BN 452901"
                />
              </label>
              <label>
                Tax Identification Number (TIN / FIRS)
                <input
                  value={form.tin}
                  onChange={(e) => setForm({ ...form, tin: e.target.value })}
                  placeholder="e.g. 24590112-0001"
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="section-title-wrap">
              <h3>Regulatory & Tax Compliance</h3>
              <p className="section-desc">Specific licenses for retail pharmacies, supermarkets, and sales tax.</p>
            </div>
            <div className="form-columns">
              <label>
                Regulatory License / Premises Certificate (e.g. PCN / NAFDAC)
                <input
                  value={form.regulatoryLicense}
                  onChange={(e) => setForm({ ...form, regulatoryLicense: e.target.value })}
                  placeholder="e.g. PCN/PH/2024/0981 or MOH/REG/4412"
                />
                <span className="field-help">Printed on receipts to certify licensed retail pharmacy practice.</span>
              </label>
              <label>
                Standard VAT Rate %
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.001"
                  value={form.vatRate}
                  onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
                />
                <span className="field-help">Default Nigeria VAT is 7.5%. Applied to taxable items at checkout.</span>
              </label>
            </div>
          </div>

          <div className="settings-form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving changes..." : "Save store settings"} <span>→</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 2: REGISTERS & TILLS ── */}
      {activeTab === "registers" && (
        <div className="settings-registers-pane">
          {/* Cash Drawer & Shift Tracking Feature Toggle */}
          <div className="settings-card drawer-feature-toggle-card">
            <div className="drawer-feature-toggle-left">
              <span className="feature-toggle-icon">💵</span>
              <div>
                <h3>Daily Cash Drawer &amp; Till Shift Tracking</h3>
                <p className="section-desc">
                  Require cashiers to declare opening cash floats, log in-shift petty cash expenses, and perform end-of-day cash counts with Z-Reports. If disabled, cashiers can check out directly with no shift lifecycle.
                </p>
                <div className="drawer-feature-chips">
                  <span className="feature-mini-chip">Starting Floats</span>
                  <span className="feature-mini-chip">Petty Cash In/Out</span>
                  <span className="feature-mini-chip">Cash Count &amp; Variance</span>
                  <span className="feature-mini-chip">Z-Reports</span>
                </div>
              </div>
            </div>
            <div className="drawer-feature-toggle-right">
              <label className="toggle-switch-wrapper">
                <input
                  type="checkbox"
                  checked={form.enableCashDrawerShifts}
                  onChange={(e) => handleToggleDrawerShifts(e.target.checked)}
                />
                <span className="toggle-switch-slider" />
              </label>
              <span className={`toggle-state-badge ${form.enableCashDrawerShifts ? "active" : "disabled"}`}>
                {form.enableCashDrawerShifts ? "Active" : "Disabled"}
              </span>
            </div>
          </div>

          <div className="settings-card registers-header-card">
            <div className="registers-top-info">
              <div>
                <h3>Physical Checkout Registers</h3>
                <p className="section-desc">
                  Manage POS stations, till drawers, and counter terminals. You can designate this physical device to open a specific register automatically.
                </p>
              </div>
              <div className="this-device-indicator">
                <span className="device-icon">💻</span>
                <div>
                  <span className="device-label">This Device's Default Till:</span>
                  <strong>{currentDeviceRegister}</strong>
                </div>
              </div>
            </div>

            <form className="add-register-form" onSubmit={handleAddRegister}>
              <input
                value={newRegisterName}
                onChange={(e) => setNewRegisterName(e.target.value)}
                placeholder="New register name (e.g. Register 4 - Dispensary, Bakery Counter)"
                required
              />
              <button className="secondary-button" type="submit" disabled={saving || !newRegisterName.trim()}>
                + Add register
              </button>
            </form>
          </div>

          <div className="registers-grid">
            {registers.map((reg) => {
              const isDeviceDefault = currentDeviceRegister === reg.name;
              const isEditing = editingRegisterId === reg.id;

              return (
                <div key={reg.id} className={`register-card ${isDeviceDefault ? "is-device-default" : ""}`}>
                  <div className="register-card-top">
                    <div className="register-card-badge-row">
                      <span className={`reg-status-pill ${reg.active ? "active" : "inactive"}`}>
                        {reg.active ? "● Active Till" : "○ Inactive"}
                      </span>
                      {isDeviceDefault && (
                        <span className="reg-default-badge">
                          📍 This Device's Default
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="register-edit-inline">
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                        />
                        <div className="register-edit-actions">
                          <button
                            className="primary-button sm-btn"
                            type="button"
                            onClick={() => handleRenameRegister(reg.id)}
                          >
                            Save
                          </button>
                          <button
                            className="secondary-button sm-btn"
                            type="button"
                            onClick={() => setEditingRegisterId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <h4 className="register-card-title">{reg.name}</h4>
                    )}
                  </div>

                  <div className="register-card-footer">
                    <div className="register-primary-action">
                      {isDeviceDefault ? (
                        <span className="device-assigned-text">✓ Assigned to this screen</span>
                      ) : (
                        <button
                          type="button"
                          className="secondary-button assign-device-btn"
                          onClick={() => handleSetDeviceDefault(reg.name)}
                        >
                          Set as this device's register
                        </button>
                      )}
                    </div>

                    <div className="register-secondary-actions">
                      {!isEditing && (
                        <button
                          type="button"
                          className="text-action-btn"
                          onClick={() => {
                            setEditingRegisterId(reg.id);
                            setEditingName(reg.name);
                          }}
                        >
                          Rename
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-action-btn"
                        onClick={() => handleToggleRegisterActive(reg)}
                      >
                        {reg.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: RECEIPT & PRINTING ── */}
      {activeTab === "receipt" && (
        <div className="receipt-settings-layout">
          <form className="settings-card" onSubmit={saveSettings}>
            <div className="form-section">
              <div className="section-title-wrap">
                <h3>Thermal Paper & Hardware Format</h3>
                <p className="section-desc">Format tickets to match your physical thermal printer roll width.</p>
              </div>

              <div className="paper-width-picker">
                <label className={`paper-option-card ${form.receiptPaperWidth === "80mm" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="paperWidth"
                    value="80mm"
                    checked={form.receiptPaperWidth === "80mm"}
                    onChange={() => setForm({ ...form, receiptPaperWidth: "80mm" })}
                  />
                  <div className="paper-card-content">
                    <span className="paper-icon">🖨️</span>
                    <strong>80mm Thermal Paper</strong>
                    <span>Standard high-speed countertop POS printer (Epson, Bixolon, Xprinter)</span>
                  </div>
                </label>

                <label className={`paper-option-card ${form.receiptPaperWidth === "58mm" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="paperWidth"
                    value="58mm"
                    checked={form.receiptPaperWidth === "58mm"}
                    onChange={() => setForm({ ...form, receiptPaperWidth: "58mm" })}
                  />
                  <div className="paper-card-content">
                    <span className="paper-icon">🧾</span>
                    <strong>58mm Compact Paper</strong>
                    <span>Portable Bluetooth, handheld mPOS, or compact receipt printers</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-section">
              <div className="section-title-wrap">
                <h3>Receipt Information Display</h3>
                <p className="section-desc">Control what metadata is printed on customer receipts.</p>
              </div>

              <div className="checkbox-options-list">
                <label className="settings-checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.showCashierOnReceipt}
                    onChange={(e) => setForm({ ...form, showCashierOnReceipt: e.target.checked })}
                  />
                  <div>
                    <strong>Print Cashier Name on Receipt</strong>
                    <span>Identifies which cashier or staff member served the customer.</span>
                  </div>
                </label>

                <label className="settings-checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.showRegisterOnReceipt}
                    onChange={(e) => setForm({ ...form, showRegisterOnReceipt: e.target.checked })}
                  />
                  <div>
                    <strong>Print Register / Station Name on Receipt</strong>
                    <span>Prints the till number (e.g. Register 1, Counter) for sales reconciliation.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-section">
              <div className="section-title-wrap">
                <h3>Return Policy & Footers</h3>
                <p className="section-desc">Legal disclaimers, exchange timelines, and friendly greetings.</p>
              </div>

              <label>
                Return & Exchange Policy Disclaimer
                <textarea
                  rows={3}
                  value={form.returnPolicy}
                  onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })}
                  placeholder="NO REFUND OF MONEY AFTER PAYMENT. EXCHANGE WITHIN 48 HRS WITH THIS TICKET."
                />
              </label>

              <label>
                Receipt Footer Greeting Note
                <input
                  value={form.receiptFooter}
                  onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                  placeholder="Thank you for shopping with us! Wish you speedy recovery."
                />
              </label>
            </div>

            <div className="settings-form-actions">
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? "Saving changes..." : "Save receipt settings"} <span>→</span>
              </button>
            </div>
          </form>

          {/* Live Thermal Receipt Simulator */}
          <div className="receipt-live-preview-box">
            <div className="preview-sticky-wrap">
              <div className="preview-badge">Live Thermal Print Preview ({form.receiptPaperWidth})</div>
              <article className={`receipt-paper ${form.receiptPaperWidth === "58mm" ? "receipt-paper-58mm" : "receipt-paper-80mm"}`}>
                <header className="receipt-store">
                  <strong>{(form.legalName || "YOUR STORE NAME").toUpperCase()}</strong>
                  {(form.addressLines || "Plot 14, Adeola Odeku Street\nVictoria Island, Lagos").split("\n").map((l, i) => (
                    <span key={i}>{l}</span>
                  ))}
                  <span>Tel: {form.phone || "+234 803 123 4567"}</span>
                  {form.tin && <span>TIN: {form.tin} (VAT Reg)</span>}
                  {form.regulatoryLicense && <span>Licence: {form.regulatoryLicense}</span>}
                </header>
                <div className="receipt-rule" />
                <div className="receipt-meta">
                  <span>RC: {form.rcNumber || "1892044"}</span>
                  <span>{new Date().toLocaleDateString("en-NG")} {new Date().toLocaleTimeString("en-NG")}</span>
                  <span>Receipt No: SF-PREVIEW-001</span>
                  <div className="receipt-meta-cashier-row">
                    {form.showCashierOnReceipt && <span>Cashier: Amina Yusuf</span>}
                    {form.showRegisterOnReceipt && <i>Register: {currentDeviceRegister}</i>}
                  </div>
                </div>
                <div className="receipt-rule" />
                <h3>ITEMS</h3>
                <div className="receipt-item">
                  <span>2x Paracetamol 500mg</span>
                  <strong>N1,200.00</strong>
                  <small>(2 x N600.00)</small>
                </div>
                <div className="receipt-item">
                  <span>1x Multivitamin Syrup</span>
                  <strong>N2,500.00</strong>
                </div>
                <div className="receipt-rule" />
                <div className="receipt-total-line">
                  <span>TOTAL DUE:</span>
                  <strong>N3,700.00</strong>
                </div>
                <div className="receipt-rule" />
                <p className="receipt-note">
                  {(form.returnPolicy || "").split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
                <p className="receipt-thanks">
                  {form.receiptFooter || "Thank you for shopping with us!"}
                  <br />
                  <small>Software Powered by Storeflow</small>
                </p>
              </article>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PAYMENT ACCOUNTS ── */}
      {activeTab === "payments" && (
        <form className="settings-card" onSubmit={saveSettings}>
          <div className="form-section">
            <div className="section-title-wrap">
              <h3>Direct Bank Transfer Account</h3>
              <p className="section-desc">
                In Nigeria and retail operations, customers often make direct bank transfers at checkout. Configure the store bank details that cashiers provide and print on receipts.
              </p>
            </div>

            <div className="form-columns">
              <label>
                Bank Name
                <input
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="e.g. Moniepoint MFB, Zenith Bank, GTBank"
                />
              </label>
              <label>
                Account Number
                <input
                  value={form.bankAccountNumber}
                  onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                  placeholder="e.g. 8031234567 or 0123456789"
                />
              </label>
            </div>

            <label>
              Account Name
              <input
                value={form.bankAccountName}
                onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })}
                placeholder="e.g. Northline Stores Ltd / Main Collection"
              />
            </label>

            <div className="bank-account-preview-box">
              <span className="preview-label">Till Customer Transfer Card Preview:</span>
              <div className="bank-card-visual">
                <div className="bank-card-head">
                  <span className="bank-chip">💳</span>
                  <strong>{form.bankName || "Moniepoint MFB"}</strong>
                </div>
                <div className="bank-card-number">
                  {form.bankAccountNumber || "803 123 4567"}
                </div>
                <div className="bank-card-name">
                  {form.bankAccountName || "Northline Stores Ltd"}
                </div>
              </div>
            </div>
          </div>

          <div className="settings-form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving changes..." : "Save payment accounts"} <span>→</span>
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

function ReceiptPreview({ receipt, onClose, onLockTill }: { receipt: ReceiptData; onClose: () => void; onLockTill?: () => void }) {
  const s = receipt.settings;
  const itemCount = receipt.lines.reduce((sum, line) => sum + line.quantity, 0);
  const storeName = s.storeName || "YOUR STORE";
  const paperClass = s.receiptPaperWidth === "58mm" ? "receipt-paper-58mm" : "receipt-paper-80mm";
  return (
    <div className="modal-backdrop receipt-backdrop" role="presentation">
      <section className="receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-heading">
        <div className="receipt-actions">
          {onLockTill && (
            <button className="secondary-button lock-till-action" type="button" onClick={onLockTill}>
              Done & Lock Till 🔒
            </button>
          )}
          <button className="secondary-button" type="button" onClick={() => window.print()}>
            Print receipt
          </button>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <article className={`receipt-paper ${paperClass}`} id="receipt-heading">
          <header className="receipt-store">
            <strong>{storeName.toUpperCase()}</strong>
            {s.addressLines && s.addressLines.split("\n").map((line, i) => <span key={i}>{line}</span>)}
            {s.phone && <span>Tel: {s.phone}</span>}
            {s.tin && <span>TIN: {s.tin} (VAT Reg)</span>}
            {s.regulatoryLicense && <span>Licence: {s.regulatoryLicense}</span>}
          </header>
          <div className="receipt-rule" />
          <div className="receipt-meta">
            <span>RC: {s.rcNumber || "—"}</span>
            <span>{new Date().toLocaleDateString("en-NG")} {new Date().toLocaleTimeString("en-NG")}</span>
            <span>Receipt No: {receipt.receiptNumber}</span>
            <div className="receipt-meta-cashier-row">
              {s.showCashierOnReceipt !== false && <span>Cashier: {receipt.cashierName || "Cashier"}</span>}
              {s.showRegisterOnReceipt !== false && <i>Register: {receipt.registerName || "POS-01"}</i>}
            </div>
          </div>
          <div className="receipt-rule" />
          <h3>ITEMS</h3>
          {receipt.lines.map((line, idx) => {
            const linePrice = (line.unitPrice || line.product.price) * line.quantity;
            return (
              <div className="receipt-item" key={`${line.product.id}-${idx}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span>{line.quantity}x {line.product.name}</span>
                  <strong>N{linePrice.toFixed(2)}</strong>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", margin: "2px 0" }}>
                  {line.selectedSize && <span>Size: {line.selectedSize} · </span>}
                  {line.selectedColor && <span>Color: {line.selectedColor} · </span>}
                  <span style={{ textTransform: "uppercase", fontWeight: 600 }}>
                    {line.orderType === "rental" ? "Rental Service" : "Suit Purchase"}
                  </span>
                </div>
                {line.requiresAlteration && (
                  <div style={{ fontSize: "10px", color: "#b91c1c", fontStyle: "italic", background: "#fef2f2", padding: "3px 6px", borderRadius: "4px", margin: "3px 0" }}>
                    ✂️ Alterations: {line.alterationNotes || "Custom bespoke adjustments requested"}
                  </div>
                )}
                {line.quantity > 1 && <small>({line.quantity} x N{(line.unitPrice || line.product.price).toFixed(2)})</small>}
              </div>
            );
          })}
          <div className="receipt-rule" />
          <div className="receipt-total-line">
            <span>TOTAL ITEMS:</span>
            <strong>{itemCount}</strong>
          </div>
          <div className="receipt-rule" />
          <div className="receipt-total-line">
            <span>SUBTOTAL:</span>
            <strong>N{receipt.subtotal.toFixed(2)}</strong>
          </div>
          {receipt.discountAmount > 0 && (
            <div className="receipt-total-line receipt-discount-line">
              <span>DISCOUNT:</span>
              <strong>-N{receipt.discountAmount.toFixed(2)}</strong>
            </div>
          )}
          <div className="receipt-total-line">
            <span>VAT ({s.vatRate}%):</span>
            <strong>N{receipt.tax.toFixed(2)}</strong>
          </div>
          <div className="receipt-rule" />
          <div className="receipt-total-line receipt-grand-total">
            <span>TOTAL AMOUNT:</span>
            <strong>N{receipt.total.toFixed(2)}</strong>
          </div>

          {receipt.depositAmount !== undefined && receipt.depositAmount < receipt.total && (
            <>
              <div className="receipt-rule" />
              <div className="receipt-total-line" style={{ color: "#166534" }}>
                <span>DEPOSIT COLLECTED:</span>
                <strong>N{receipt.depositAmount.toFixed(2)}</strong>
              </div>
              <div className="receipt-total-line" style={{ color: "#b91c1c", fontWeight: 700 }}>
                <span>BALANCE DUE AT PICKUP:</span>
                <strong>N{(receipt.balanceDue || 0).toFixed(2)}</strong>
              </div>
            </>
          )}

          <div className="receipt-rule" />
          <h3>PAYMENT INFO</h3>
          <div className="receipt-meta">
            <span>
              Payment Channel:{" "}
              {receipt.paymentMethod === "cash"
                ? "Cash (Physical Currency)"
                : receipt.paymentMethod === "bank_transfer"
                ? "Direct Bank Transfer"
                : receipt.paymentMethod === "debit_card"
                ? "POS Terminal (Debit Card)"
                : receipt.paymentMethod === "credit_card"
                ? "POS Terminal (Credit Card)"
                : receipt.paymentMethod === "paypal"
                ? "PayPal / Electronic"
                : receipt.paymentMethod === "cheque"
                ? "Bank Check"
                : "POS (Card / Electronic)"}
            </span>
            {receipt.paymentReference && <span>Ref: {receipt.paymentReference}</span>}
            {receipt.paymentMethod === "cash" ? (
              <>
                <span>Cash tendered: N{receipt.cash.toFixed(2)}</span>
                <span>Change returned: N{receipt.change.toFixed(2)}</span>
              </>
            ) : (
              <span>Status: CONFIRMED / CLEARED</span>
            )}
          </div>
          {s.bankName && s.bankAccountNumber && (
            <div className="receipt-bank-box">
              <span className="receipt-bank-title">Flagship Bank Transfer Account:</span>
              <span>{s.bankName} | {s.bankAccountNumber}</span>
              {s.bankAccountName && <span>{s.bankAccountName}</span>}
            </div>
          )}
          <div className="receipt-rule" />
          <p className="receipt-note">
            {(s.returnPolicy || "NO REFUND OF MONEY AFTER PAYMENT.\nEXCHANGE WITHIN 48 HRS WITH THIS TICKET\nVALID ONLY IN GOOD CONDITION.")
              .split("\n")
              .map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
          </p>
          <p className="receipt-thanks">
            {s.receiptFooter || "Thank you for shopping with us!"}<br />
            <small>Software Powered by Storeflow</small>
          </p>
        </article>
      </section>
    </div>
  );
}

// ── Cash Drawer & Shift Reconciliation Types & Modals ──
export interface ActiveShift {
  id: string;
  tenantId?: string;
  registerId?: string;
  registerName: string;
  employeeId?: string;
  cashierName: string;
  startedAt: string;
  endedAt?: string | null;
  openingCash: number;
  closingCash?: number | null;
  cashSalesTotal: number;
  cardSalesTotal: number;
  cashInTotal: number;
  cashOutTotal: number;
  totalSalesCount: number;
  expectedCash: number;
  cashVariance?: number;
  status: "open" | "closed";
  notes?: string;
  movements: ShiftCashMovement[];
}

function OpenShiftModal({
  registerName,
  cashierName,
  onConfirm,
  onCancel,
}: {
  registerName: string;
  cashierName: string;
  onConfirm: (openingFloat: number, notes: string) => void;
  onCancel?: () => void;
}) {
  const [floatAmount, setFloatAmount] = useState("10000");
  const [notes, setNotes] = useState("");

  const quickAmounts = [0, 5000, 10000, 20000, 50000];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Math.max(0, parseFloat(floatAmount) || 0);
    onConfirm(parsed, notes.trim());
  }

  return (
    <div className="modal-backdrop shift-modal-backdrop" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="shift-card-panel" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
        {onCancel && (
          <button
            type="button"
            className="pin-close-icon-btn"
            onClick={onCancel}
            aria-label="Close"
            style={{ position: "absolute", top: 16, right: 16 }}
          >
            ✕
          </button>
        )}
        <div className="shift-modal-header">
          <div className="shift-icon-tile">💵</div>
          <h2>Open Cash Drawer</h2>
          <p>
            Starting a new sales shift on <strong>{registerName}</strong>
          </p>
        </div>

        <div className="shift-duty-pill">
          <span>Duty Cashier</span>
          <strong>{cashierName}</strong>
        </div>

        <form onSubmit={handleSubmit} className="shift-form">
          <div className="shift-input-group">
            <label htmlFor="opening-float-input">Opening Cash Float (Change in Drawer)</label>
            <div className="naira-input-wrap">
              <span className="naira-symbol">₦</span>
              <input
                id="opening-float-input"
                type="number"
                min="0"
                step="100"
                value={floatAmount}
                onChange={(e) => setFloatAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="shift-chip-row">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`shift-chip ${parseFloat(floatAmount) === amt ? "active" : ""}`}
                  onClick={() => setFloatAmount(amt.toString())}
                >
                  {amt === 0 ? "₦0 (Empty)" : formatNaira(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="shift-input-group">
            <label htmlFor="shift-notes-input">Shift Notes (Optional)</label>
            <input
              id="shift-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Morning duty, clean drawer"
            />
          </div>

          <div className="shift-modal-actions">
            {onCancel && (
              <button type="button" className="secondary-button" onClick={onCancel}>
                Later
              </button>
            )}
            <button type="submit" className="primary-button shift-btn-primary">
              Open Register & Start Selling <span>→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DrawerManagerModal({
  shift,
  onClose,
  onAddMovement,
  onRequestCloseShift,
}: {
  shift: ActiveShift;
  onClose: () => void;
  onAddMovement: (type: "cash_in" | "cash_out", amount: number, reason: string) => void;
  onRequestCloseShift: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"summary" | "petty_cash">("summary");
  const [movementType, setMovementType] = useState<"cash_out" | "cash_in">("cash_out");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const commonReasons = [
    "Generator / Fuel",
    "Courier / Delivery",
    "Store Supplies",
    "Cleaning Materials",
    "Staff Meal",
    "Bank Deposit",
    "Customer Refund",
    "Other Expense",
  ];

  function handleRecordMovement(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }
    if (!reason.trim()) {
      setError("Please select or enter a reason");
      return;
    }
    setError("");
    onAddMovement(movementType, parsed, reason.trim());
    setAmount("");
    setReason("");
    setActiveTab("summary");
  }

  return (
    <div className="modal-backdrop drawer-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="drawer-card-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-top-nav">
          <div>
            <h2>Cash Drawer Manager</h2>
            <p>
              Register: <strong>{shift.registerName}</strong> · Cashier: <strong>{shift.cashierName}</strong>
            </p>
          </div>
          <button type="button" className="pin-close-icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="drawer-tab-bar">
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            📊 Drawer Status
          </button>
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === "petty_cash" ? "active" : ""}`}
            onClick={() => setActiveTab("petty_cash")}
          >
            💸 Cash In / Out (Petty Cash)
          </button>
        </div>

        {activeTab === "summary" ? (
          <div className="drawer-summary-view">
            <div className="drawer-balance-hero">
              <span className="drawer-hero-label">Cash in Drawer Should Be</span>
              <strong className="drawer-hero-amount">{formatNaira(shift.expectedCash)}</strong>
              <small>Expected physical paper money in till</small>
            </div>

            <div className="drawer-ledger-list">
              <div className="ledger-row">
                <span>Opening Cash Float:</span>
                <strong>{formatNaira(shift.openingCash)}</strong>
              </div>
              <div className="ledger-row positive">
                <span>+ Cash Sales Collected:</span>
                <strong>+{formatNaira(shift.cashSalesTotal)}</strong>
              </div>
              {shift.cashInTotal > 0 && (
                <div className="ledger-row positive">
                  <span>+ Extra Cash In (Float Additions):</span>
                  <strong>+{formatNaira(shift.cashInTotal)}</strong>
                </div>
              )}
              {shift.cashOutTotal > 0 && (
                <div className="ledger-row negative">
                  <span>- Cash Out (Petty Expenses):</span>
                  <strong>-{formatNaira(shift.cashOutTotal)}</strong>
                </div>
              )}
              <div className="ledger-divider" />
              <div className="ledger-row muted">
                <span>Card / Electronic POS Sales (In Bank):</span>
                <span>{formatNaira(shift.cardSalesTotal)}</span>
              </div>
              <div className="ledger-row muted">
                <span>Total Orders Completed:</span>
                <span>{shift.totalSalesCount} sales</span>
              </div>
              <div className="ledger-row muted">
                <span>Shift Started At:</span>
                <span>{new Date(shift.startedAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>

            <div className="drawer-summary-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveTab("petty_cash")}
              >
                💸 Record Petty Cash
              </button>
              <button
                type="button"
                className="danger-button close-shift-cta"
                onClick={onRequestCloseShift}
              >
                🔒 Close Till & End Shift (Z-Report)
              </button>
            </div>
          </div>
        ) : (
          <div className="drawer-movement-view">
            <div className="movement-type-toggle">
              <button
                type="button"
                className={`mov-toggle-btn ${movementType === "cash_out" ? "active negative" : ""}`}
                onClick={() => setMovementType("cash_out")}
              >
                📤 Cash Out (Petty Expense)
              </button>
              <button
                type="button"
                className={`mov-toggle-btn ${movementType === "cash_in" ? "active positive" : ""}`}
                onClick={() => setMovementType("cash_in")}
              >
                📥 Cash In (Add Float)
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="movement-form">
              <div className="shift-input-group">
                <label htmlFor="mov-amount">
                  {movementType === "cash_out" ? "Amount Taken from Drawer" : "Amount Added to Drawer"}
                </label>
                <div className="naira-input-wrap">
                  <span className="naira-symbol">₦</span>
                  <input
                    id="mov-amount"
                    type="number"
                    min="100"
                    step="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 2000"
                    autoFocus
                  />
                </div>
              </div>

              <div className="shift-input-group">
                <label>Reason / Expense Category</label>
                <div className="reason-chips-grid">
                  {commonReasons.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`reason-chip ${reason === r ? "active" : ""}`}
                      onClick={() => setReason(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Or type custom reason..."
                  style={{ marginTop: "8px" }}
                />
              </div>

              {error && <div className="shift-error-alert">{error}</div>}

              <button type="submit" className="primary-button shift-btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                {movementType === "cash_out" ? "Record Cash Out" : "Record Cash In"} <span>→</span>
              </button>
            </form>

            {shift.movements.length > 0 && (
              <div className="recent-movements-section">
                <h4>Today's Recorded Drawer Movements</h4>
                <div className="movement-list">
                  {shift.movements.map((m) => (
                    <div key={m.id} className={`movement-row ${m.type}`}>
                      <div className="movement-info">
                        <strong>{m.reason}</strong>
                        <small>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {m.createdBy || "Staff"}
                        </small>
                      </div>
                      <span className={`movement-amount ${m.type}`}>
                        {m.type === "cash_out" ? "-" : "+"}
                        {formatNaira(m.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CloseShiftModal({
  shift,
  onClose,
  onFinalizeClose,
}: {
  shift: ActiveShift;
  onClose: () => void;
  onFinalizeClose: (countedCash: number, closingNotes: string) => void;
}) {
  const [countedCash, setCountedCash] = useState("");
  const [useDenominations, setUseDenominations] = useState(false);
  const [denominations, setDenominations] = useState<Record<number, string>>({
    1000: "",
    500: "",
    200: "",
    100: "",
    50: "",
  });
  const [closingNotes, setClosingNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const expectedCash = shift.expectedCash;
  const parsedCounted = parseFloat(countedCash) || 0;
  const variance = parsedCounted - expectedCash;

  function updateDenomination(note: number, countStr: string) {
    const next = { ...denominations, [note]: countStr };
    setDenominations(next);
    let total = 0;
    Object.entries(next).forEach(([val, qty]) => {
      const c = parseInt(qty) || 0;
      total += Number(val) * c;
    });
    setCountedCash(total.toString());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    onFinalizeClose(parsedCounted, closingNotes.trim());
  }

  return (
    <div className="modal-backdrop close-shift-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="close-shift-card" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="pin-close-icon-btn"
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: 16, right: 16 }}
        >
          ✕
        </button>
        <div className="shift-modal-header">
          <div className="shift-icon-tile red">🔒</div>
          <h2>End of Shift Cash Balancing</h2>
          <p>
            Reconcile register cash & generate official <strong>Z-Report</strong>
          </p>
        </div>

        <div className="shift-meta-banner">
          <div>
            <span>Register:</span> <strong>{shift.registerName}</strong>
          </div>
          <div>
            <span>Cashier:</span> <strong>{shift.cashierName}</strong>
          </div>
          <div>
            <span>Started:</span>{" "}
            <strong>{new Date(shift.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
          </div>
        </div>

        <div className="reconcile-expected-box">
          <div className="rec-row">
            <span>Starting Cash Float:</span>
            <strong>{formatNaira(shift.openingCash)}</strong>
          </div>
          <div className="rec-row">
            <span>Cash Sales:</span>
            <strong>+{formatNaira(shift.cashSalesTotal)}</strong>
          </div>
          {shift.cashInTotal > 0 && (
            <div className="rec-row">
              <span>Cash In:</span>
              <strong>+{formatNaira(shift.cashInTotal)}</strong>
            </div>
          )}
          {shift.cashOutTotal > 0 && (
            <div className="rec-row">
              <span>Petty Cash Out:</span>
              <strong>-{formatNaira(shift.cashOutTotal)}</strong>
            </div>
          )}
          <div className="rec-divider" />
          <div className="rec-expected-row">
            <span>Expected in Cash Drawer:</span>
            <strong className="expected-val">{formatNaira(expectedCash)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="reconcile-form">
          <div className="shift-input-group">
            <div className="label-with-toggle">
              <label htmlFor="counted-cash-input">Actual Cash Counted in Drawer</label>
              <button
                type="button"
                className="denom-toggle-btn"
                onClick={() => setUseDenominations(!useDenominations)}
              >
                {useDenominations ? "Simple Total Input" : "Count by Notes (₦1000, ₦500...)"}
              </button>
            </div>

            {useDenominations ? (
              <div className="denom-grid">
                {[1000, 500, 200, 100, 50].map((denom) => (
                  <div key={denom} className="denom-row">
                    <span className="denom-tag">₦{denom}</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={denominations[denom] || ""}
                      onChange={(e) => updateDenomination(denom, e.target.value)}
                    />
                    <span className="denom-subtotal">
                      = {formatNaira(denom * (parseInt(denominations[denom]) || 0))}
                    </span>
                  </div>
                ))}
                <div className="denom-sum-row">
                  <span>Total Calculated:</span>
                  <strong>{formatNaira(parsedCounted)}</strong>
                </div>
              </div>
            ) : (
              <div className="naira-input-wrap">
                <span className="naira-symbol">₦</span>
                <input
                  id="counted-cash-input"
                  type="number"
                  min="0"
                  step="100"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  placeholder="Enter physical cash in drawer..."
                  autoFocus
                  required
                />
              </div>
            )}
          </div>

          {countedCash !== "" && (
            <div
              className={`variance-status-box ${
                Math.abs(variance) < 0.01 ? "balanced" : variance > 0 ? "overage" : "shortage"
              }`}
            >
              {Math.abs(variance) < 0.01 ? (
                <div>
                  <strong>✓ Till Perfectly Balanced!</strong>
                  <span>Physical cash matches system sales exactly (Difference: ₦0.00)</span>
                </div>
              ) : variance > 0 ? (
                <div>
                  <strong>⚠️ Cash Overage: +{formatNaira(variance)}</strong>
                  <span>Drawer has more physical money than recorded sales.</span>
                </div>
              ) : (
                <div>
                  <strong>🚨 Cash Shortage: -{formatNaira(Math.abs(variance))}</strong>
                  <span>Cash in drawer is less than recorded sales. Please inspect receipts.</span>
                </div>
              )}
            </div>
          )}

          <div className="shift-input-group">
            <label htmlFor="closing-notes-input">Closing Notes (Optional)</label>
            <textarea
              id="closing-notes-input"
              rows={2}
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="e.g. ₦500 note was torn, customer overpaid on order #12..."
            />
          </div>

          <div className="shift-modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>
              Back to POS
            </button>
            <button
              type="submit"
              className="primary-button shift-btn-primary"
              disabled={submitting || countedCash === ""}
            >
              {submitting ? "Finalizing..." : "Confirm & Print Z-Report"} <span>→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function CheckoutScreen({ preview, tenantId, onBack }: { preview: boolean; tenantId?: string; onBack: () => void }) {
  const [products, setProducts] = useState<Product[]>(preview ? demoProducts : []);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [cash, setCash] = useState("");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [registers, setRegisters] = useState<StoreRegister[]>(() => {
    if (preview) {
      const saved = localStorage.getItem("storeflow_demo_registers");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
      return demoRegisters;
    }
    return [];
  });
  const [selectedRegister, setSelectedRegister] = useState<string>(() => {
    return localStorage.getItem("storeflow_default_register") || "Enugu Flagship Register 1 (Main Floor)";
  });

  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    storeName: "FMO (For Men Only)",
    addressLines: "Hilmak Place Plaza Plot C, 1A Pocket Layout\nTrans-Ekulu by Bilante Flyover, Enugu",
    phone: "+234 701 813 5116",
    tin: "31948201-0001",
    rcNumber: "RC 1948210",
    regulatoryLicense: "FMO/EN/SARTORIAL/2026",
    vatRate: 7.5,
    receiptFooter: "No 1 Suit Store in Enugu • Delivering Class & Culture\nThank you for choosing FMO Luxury Sartorial",
    bankName: "Zenith Bank PLC",
    bankAccountNumber: "1018944521",
    bankAccountName: "FMO LUXURY MENSWEAR LIMITED",
    receiptPaperWidth: "80mm",
    returnPolicy: "ALTERATIONS GUARANTEED WITHIN 7 DAYS.\nBESPOKE CUTTINGS ARE NON-REFUNDABLE.\nTHANK YOU FOR ELEVATING CLASS & CULTURE.",
  });

  // Cashier PIN and Register Lock State
  const [cashiers, setCashiers] = useState<CashierMember[]>(preview ? demoCashiers : []);
  const [activeCashier, setActiveCashier] = useState<CashierMember | null>(preview ? demoCashiers[0] : null);
  const [isRegisterLocked, setIsRegisterLocked] = useState<boolean>(false);

  // Sartorial Tailoring & Fitting Variant Modal State
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [modalSize, setModalSize] = useState<string>("42R");
  const [modalColor, setModalColor] = useState<string>("Navy Blue");
  const [modalOrderType, setModalOrderType] = useState<"sale" | "rental">("sale");
  const [modalRequiresAlterations, setModalRequiresAlterations] = useState<boolean>(false);
  const [modalAlterationNotes, setModalAlterationNotes] = useState<string>("");
  const [modalMeasurements, setModalMeasurements] = useState({ chest: "42R", waist: "34", inseam: "32", sleeve: "25" });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [isDepositHold, setIsDepositHold] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>("");

  // Active Till Shift & Cash Drawer Reconciliation State
  const [enableCashDrawerShifts, setEnableCashDrawerShifts] = useState<boolean>(() => {
    const saved = localStorage.getItem("storeflow_enable_drawer_shifts");
    if (saved !== null) return saved === "true";
    return true;
  });
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState<boolean>(false);
  const [showDrawerModal, setShowDrawerModal] = useState<boolean>(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false);
  const [zReportData, setZReportData] = useState<ZReportData | null>(null);

  // Helper to persist active shift
  function persistActiveShift(shift: ActiveShift | null) {
    if (preview) {
      try {
        const saved = localStorage.getItem("storeflow_demo_active_shifts");
        const dict = saved ? JSON.parse(saved) : {};
        if (shift) {
          dict[shift.registerName] = shift;
        } else {
          delete dict[selectedRegister];
        }
        localStorage.setItem("storeflow_demo_active_shifts", JSON.stringify(dict));
      } catch {}
    }
  }

  // Load active shift for selected register
  useEffect(() => {
    if (!enableCashDrawerShifts) {
      setActiveShift(null);
      return;
    }

    if (preview) {
      const saved = localStorage.getItem("storeflow_demo_active_shifts");
      if (saved) {
        try {
          const dict = JSON.parse(saved);
          if (dict && dict[selectedRegister]) {
            setActiveShift(dict[selectedRegister]);
            return;
          }
        } catch {}
      }
      setActiveShift(null);
      return;
    }

    if (!supabase || !tenantId) return;

    supabase
      .from("employee_shifts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "open")
      .order("started_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const match = data.find((s) => s.register_name === selectedRegister) || data[0];
          setActiveShift({
            id: match.id,
            tenantId: match.tenant_id,
            registerId: match.register_id,
            registerName: match.register_name || selectedRegister,
            employeeId: match.employee_id,
            cashierName: match.cashier_name || "Cashier",
            startedAt: match.started_at,
            endedAt: match.ended_at,
            openingCash: Number(match.opening_cash || 0),
            closingCash: match.closing_cash ? Number(match.closing_cash) : null,
            cashSalesTotal: Number(match.cash_sales_total || 0),
            cardSalesTotal: Number(match.card_sales_total || 0),
            cashInTotal: Number(match.cash_in_total || 0),
            cashOutTotal: Number(match.cash_out_total || 0),
            totalSalesCount: Number(match.total_sales_count || 0),
            expectedCash: Number(match.expected_cash || match.opening_cash || 0),
            status: "open",
            notes: match.notes,
            movements: [],
          });
        } else {
          setActiveShift(null);
        }
      });
  }, [preview, tenantId, selectedRegister]);

  // Prompt to open shift when cashier unlocks register if no active shift exists AND drawer shifts are enabled
  useEffect(() => {
    if (enableCashDrawerShifts && activeCashier && !isRegisterLocked && !activeShift) {
      setShowOpenShiftModal(true);
    }
  }, [enableCashDrawerShifts, activeCashier, isRegisterLocked, activeShift]);

  async function handleOpenShift(openingFloat: number, notes: string) {
    const shiftId = `shift-${Date.now()}`;
    const newShift: ActiveShift = {
      id: shiftId,
      tenantId,
      registerName: selectedRegister,
      cashierName: activeCashier ? activeCashier.name : "Duty Cashier",
      startedAt: new Date().toISOString(),
      openingCash: openingFloat,
      cashSalesTotal: 0,
      cardSalesTotal: 0,
      cashInTotal: 0,
      cashOutTotal: 0,
      totalSalesCount: 0,
      expectedCash: openingFloat,
      status: "open",
      notes,
      movements: [],
    };

    if (!preview && supabase && tenantId) {
      try {
        const { data } = await supabase.rpc("open_cashier_shift", {
          target_tenant_id: tenantId,
          target_register_id: null,
          target_employee_id: activeCashier?.id || null,
          opening_float: openingFloat,
          shift_notes: notes,
          c_name: activeCashier?.name || "Duty Cashier",
          r_name: selectedRegister,
        });
        if (data && data.shift_id) {
          newShift.id = data.shift_id;
        }
      } catch {}
    }

    setActiveShift(newShift);
    persistActiveShift(newShift);
    setShowOpenShiftModal(false);
  }

  async function handleAddShiftMovement(type: "cash_in" | "cash_out", amount: number, reason: string) {
    if (!activeShift) return;
    const movement: ShiftCashMovement = {
      id: `mov-${Date.now()}`,
      type,
      amount,
      reason,
      createdBy: activeCashier ? activeCashier.name : "Staff",
      createdAt: new Date().toISOString(),
    };

    const nextIn = type === "cash_in" ? activeShift.cashInTotal + amount : activeShift.cashInTotal;
    const nextOut = type === "cash_out" ? activeShift.cashOutTotal + amount : activeShift.cashOutTotal;
    const nextExpected = activeShift.openingCash + activeShift.cashSalesTotal + nextIn - nextOut;

    const updated: ActiveShift = {
      ...activeShift,
      cashInTotal: nextIn,
      cashOutTotal: nextOut,
      expectedCash: nextExpected,
      movements: [movement, ...activeShift.movements],
    };

    setActiveShift(updated);
    persistActiveShift(updated);

    if (!preview && supabase && tenantId) {
      try {
        await supabase.rpc("record_shift_cash_movement", {
          target_tenant_id: tenantId,
          target_shift_id: activeShift.id,
          m_type: type,
          m_amount: amount,
          m_reason: reason,
          staff_name: activeCashier ? activeCashier.name : "Staff",
        });
      } catch {}
    }
  }

  async function handleFinalizeCloseShift(actualCountedCash: number, closingNotes: string) {
    if (!activeShift) return;
    const endedAt = new Date().toISOString();
    const variance = actualCountedCash - activeShift.expectedCash;

    const zReport: ZReportData = {
      shiftId: activeShift.id,
      storeName: receiptSettings.storeName,
      addressLines: receiptSettings.addressLines,
      phone: receiptSettings.phone,
      tin: receiptSettings.tin,
      rcNumber: receiptSettings.rcNumber,
      regulatoryLicense: receiptSettings.regulatoryLicense,
      paperWidth: receiptSettings.receiptPaperWidth || "80mm",
      registerName: activeShift.registerName,
      cashierName: activeShift.cashierName,
      startedAt: activeShift.startedAt,
      endedAt,
      totalTransactions: activeShift.totalSalesCount,
      cashSalesTotal: activeShift.cashSalesTotal,
      cardSalesTotal: activeShift.cardSalesTotal,
      grossSalesTotal: activeShift.cashSalesTotal + activeShift.cardSalesTotal,
      openingFloat: activeShift.openingCash,
      cashInTotal: activeShift.cashInTotal,
      cashOutTotal: activeShift.cashOutTotal,
      movements: activeShift.movements,
      expectedCash: activeShift.expectedCash,
      actualCountedCash,
      variance,
      closingNotes,
    };

    const closedShift: ActiveShift = {
      ...activeShift,
      endedAt,
      closingCash: actualCountedCash,
      cashVariance: variance,
      status: "closed",
      notes: closingNotes ? `${activeShift.notes || ""} | ${closingNotes}`.trim() : activeShift.notes,
    };

    try {
      const closedList = localStorage.getItem("storeflow_demo_closed_shifts");
      const list = closedList ? JSON.parse(closedList) : [];
      list.unshift(closedShift);
      localStorage.setItem("storeflow_demo_closed_shifts", JSON.stringify(list.slice(0, 100)));
    } catch {}

    if (!preview && supabase && tenantId) {
      try {
        await supabase.rpc("close_cashier_shift", {
          target_tenant_id: tenantId,
          target_shift_id: activeShift.id,
          actual_closing_cash: actualCountedCash,
          closing_notes: closingNotes,
        });
      } catch {}
    }

    persistActiveShift(null);
    setActiveShift(null);
    setShowCloseShiftModal(false);
    setShowDrawerModal(false);
    setZReportData(zReport);
  }

  useEffect(() => {
    if (preview) {
      const savedRegs = localStorage.getItem("storeflow_demo_registers");
      if (savedRegs) {
        try {
          const list = JSON.parse(savedRegs);
          if (Array.isArray(list) && list.length > 0) setRegisters(list);
        } catch {}
      }
      const savedDefault = localStorage.getItem("storeflow_default_register");
      if (savedDefault) setSelectedRegister(savedDefault);
      return;
    }

    if (!supabase || !tenantId) return;

    supabase
      .from("registers")
      .select("id, name, active")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setRegisters(data);
          const savedDefault = localStorage.getItem("storeflow_default_register");
          if (savedDefault && data.some((r) => r.name === savedDefault)) {
            setSelectedRegister(savedDefault);
          } else {
            setSelectedRegister(data[0].name);
          }
        }
      });
  }, [preview, tenantId]);

  useEffect(() => {
    if (preview || !supabase || !tenantId) return;
    supabase
      .from("tenant_members")
      .select("id, display_name, email, role, pin_hash")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("created_at")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: CashierMember[] = data.map((m) => ({
            id: m.id,
            name: m.display_name || (m.email ? m.email.split("@")[0] : "Staff Member"),
            role: m.role,
            hasPin: Boolean(m.pin_hash && m.pin_hash.trim() !== ""),
            pinHash: m.pin_hash,
          }));
          setCashiers(mapped);
        }
      });
  }, [preview, tenantId]);

  useEffect(() => {
    if (preview || !supabase || !tenantId) return;
    supabase.from("products").select("id, name, sku, unit, image_url, track_inventory, tax_rate, product_prices(price)").eq("tenant_id", tenantId).eq("active", true).order("name").then(({ data }) => {
      setProducts((data ?? []).map((product) => ({ id: product.id, name: product.name, sku: product.sku, unit: product.unit, category: "General", price: Number(Array.isArray(product.product_prices) ? product.product_prices[0]?.price ?? 0 : 0), stock: 0, imageUrl: product.image_url, trackInventory: product.track_inventory, taxRate: Number(product.tax_rate ?? 0) })));
    });
  }, [preview, tenantId]);

  useEffect(() => {
    if (preview) {
      const saved = localStorage.getItem("storeflow_demo_store_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.enableCashDrawerShifts !== undefined) {
            setEnableCashDrawerShifts(parsed.enableCashDrawerShifts);
          }
          setReceiptSettings({
            storeName: parsed.legalName || "Northline Pharmacy & Stores Ltd",
            addressLines: parsed.addressLines || "Plot 14, Adeola Odeku Street\nVictoria Island, Lagos",
            phone: parsed.phone || "+234 803 123 4567",
            tin: parsed.tin || "24590112-0001",
            rcNumber: parsed.rcNumber || "RC 1892044",
            regulatoryLicense: parsed.regulatoryLicense || "PCN/PH/2024/0981",
            vatRate: Number(parsed.vatRate) || 7.5,
            receiptFooter: parsed.receiptFooter || "Thank you for shopping with us! Wish you speedy recovery.",
            receiptPaperWidth: parsed.receiptPaperWidth || "80mm",
            returnPolicy: parsed.returnPolicy || "NO REFUND OF MONEY AFTER PAYMENT.\nEXCHANGE WITHIN 48 HRS WITH THIS TICKET\nVALID ONLY IN GOOD CONDITION.",
            showCashierOnReceipt: parsed.showCashierOnReceipt !== false,
            showRegisterOnReceipt: parsed.showRegisterOnReceipt !== false,
            bankName: parsed.bankName || "Moniepoint MFB",
            bankAccountNumber: parsed.bankAccountNumber || "8031234567",
            bankAccountName: parsed.bankAccountName || "Northline Stores Ltd",
          });
        } catch {}
      }
      return;
    }

    if (!supabase || !tenantId) return;
    supabase
      .from("tenants")
      .select("name, legal_name, address_lines, phone, tin, rc_number, vat_rate, receipt_footer, regulatory_license, bank_name, bank_account_number, bank_account_name, receipt_paper_width, return_policy, show_cashier_on_receipt, show_register_on_receipt, enable_cash_drawer_shifts")
      .eq("id", tenantId)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.enable_cash_drawer_shifts !== undefined && data.enable_cash_drawer_shifts !== null) {
            setEnableCashDrawerShifts(data.enable_cash_drawer_shifts);
            localStorage.setItem("storeflow_enable_drawer_shifts", String(data.enable_cash_drawer_shifts));
          }
          setReceiptSettings({
            storeName: data.legal_name || data.name || "Your Store",
            addressLines: data.address_lines ?? "",
            phone: data.phone ?? "",
            tin: data.tin ?? "",
            rcNumber: data.rc_number ?? "",
            regulatoryLicense: data.regulatory_license ?? "",
            vatRate: Number(data.vat_rate ?? 7.5),
            receiptFooter: data.receipt_footer ?? "Thank you for shopping with us!",
            receiptPaperWidth: (data.receipt_paper_width as "58mm" | "80mm") || "80mm",
            returnPolicy: data.return_policy ?? "NO REFUND OF MONEY AFTER PAYMENT.\nEXCHANGE WITHIN 48 HRS WITH THIS TICKET\nVALID ONLY IN GOOD CONDITION.",
            showCashierOnReceipt: data.show_cashier_on_receipt !== false,
            showRegisterOnReceipt: data.show_register_on_receipt !== false,
            bankName: data.bank_name ?? "",
            bankAccountNumber: data.bank_account_number ?? "",
            bankAccountName: data.bank_account_name ?? "",
          });
        }
      });
  }, [preview, tenantId]);

  const categories = ["All", ...new Set(products.map((product) => product.category))];
  const visibleProducts = products.filter((product) => (category === "All" || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase()));
  const subtotal = cart.reduce((total, line) => total + (line.unitPrice || line.product.price) * line.quantity, 0);
  const discountAmount = discountType === "percent"
    ? subtotal * Math.min(100, Math.max(0, Number(discount) || 0)) / 100
    : Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const discountedSubtotal = subtotal - discountAmount;
  const tax = cart.reduce((amount, line) => amount + (line.unitPrice || line.product.price) * line.quantity * (line.product.taxRate ?? 0) / 100, 0);
  const total = discountedSubtotal + tax;
  const parsedDeposit = isDepositHold ? Math.max(0, Math.min(total, parseFloat(depositAmount) || Math.round(total * 0.5))) : total;
  const balanceDue = isDepositHold ? Math.max(0, total - parsedDeposit) : 0;
  const effectiveDue = isDepositHold ? parsedDeposit : total;
  const change = paymentMethod === "cash" ? Math.max(0, Number(cash || 0) - effectiveDue) : 0;

  function handleProductTileClick(product: Product) {
    if (product.category === "Gentleman Essentials" && (!product.variants || product.variants.length <= 1)) {
      setCart((current) => {
        const existing = current.find((l) => l.product.id === product.id && !l.selectedSize);
        if (existing) {
          return current.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
        }
        return [...current, { product, quantity: 1, unitPrice: product.price, orderType: "sale" }];
      });
      return;
    }

    // Open Sartorial Fitting Modal for suit sizing, colors, alterations, sale/rental
    setSelectedProductForVariant(product);
    setModalSize("42R");
    setModalColor(product.colors?.[0]?.name || "Classic");
    setModalOrderType("sale");
    setModalRequiresAlterations(false);
    setModalAlterationNotes("");
    setModalMeasurements({ chest: "42R", waist: "34", inseam: "32", sleeve: "25" });
  }

  function confirmAddVariant() {
    if (!selectedProductForVariant) return;
    const unitPrice = modalOrderType === "rental" ? (selectedProductForVariant.rentalPrice || 75000) : selectedProductForVariant.price;
    const newLine: CartLine = {
      product: selectedProductForVariant,
      quantity: 1,
      selectedSize: modalSize,
      selectedColor: modalColor,
      orderType: modalOrderType,
      unitPrice,
      requiresAlteration: modalRequiresAlterations,
      alterationNotes: modalRequiresAlterations ? modalAlterationNotes : undefined,
      measurements: modalRequiresAlterations ? modalMeasurements : undefined,
    };
    setCart((curr) => [...curr, newLine]);
    setSelectedProductForVariant(null);
  }

  function updateQuantity(index: number, quantity: number) {
    setCart((current) =>
      quantity < 1
        ? current.filter((_, idx) => idx !== index)
        : current.map((line, idx) => (idx === index ? { ...line, quantity } : line))
    );
  }

  async function finishSale() {
    if ((paymentMethod === "cash" && Number(cash) < effectiveDue) || !cart.length) return;
    setError("");
    const depositPaid = isDepositHold ? parsedDeposit : total;
    const balanceRemaining = isDepositHold ? balanceDue : 0;

    if (!preview && supabase && tenantId) {
      setSaving(true);
      const serverTotal = subtotal + tax;
      const tenderedCash = Math.max(Number(cash), serverTotal);
      const { error: saleError } = await supabase.rpc("complete_sale", {
        target_tenant_id: tenantId,
        sale_items: cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
        payment_method: paymentMethod === "cash" ? "cash" : "card",
        tendered_amount: paymentMethod === "cash" ? tenderedCash : 9999999
      });
      setSaving(false);
      if (saleError) { setError(saleError.message); return; }
    }

    setMessage(
      isDepositHold
        ? `Deposit accepted (${formatNaira(depositPaid)}). Balance due at fitting: ${formatNaira(balanceRemaining)}`
        : paymentMethod === "cash"
        ? `Sale complete. Change: ${formatNaira(change)}`
        : paymentMethod === "bank_transfer"
        ? "Sale complete. Zenith Bank Transfer confirmed."
        : "Sale complete. Card payment recorded."
    );

    const receiptNumber = `FMO-${new Date().getTime().toString().slice(-6)}-NG`;
    setReceipt({
      lines: cart,
      subtotal,
      discountAmount,
      tax,
      total,
      depositAmount: isDepositHold ? depositPaid : total,
      balanceDue: balanceRemaining,
      cash: Number(cash),
      paymentMethod,
      paymentReference,
      change,
      receiptNumber,
      settings: receiptSettings,
      cashierName: activeCashier ? activeCashier.name : "Cashier",
      registerName: selectedRegister,
      requiresAlterations: cart.some((l) => l.requiresAlteration),
    });

    if (enableCashDrawerShifts && activeShift) {
      const saleAmount = depositPaid;
      const isCash = paymentMethod === "cash";
      const nextCash = isCash ? activeShift.cashSalesTotal + saleAmount : activeShift.cashSalesTotal;
      const nextCard = !isCash ? activeShift.cardSalesTotal + saleAmount : activeShift.cardSalesTotal;
      const nextCount = activeShift.totalSalesCount + 1;
      const nextExpected = activeShift.openingCash + nextCash + activeShift.cashInTotal - activeShift.cashOutTotal;

      const updatedShift: ActiveShift = {
        ...activeShift,
        cashSalesTotal: nextCash,
        cardSalesTotal: nextCard,
        totalSalesCount: nextCount,
        expectedCash: nextExpected,
      };
      setActiveShift(updatedShift);
      persistActiveShift(updatedShift);
    }

    setCart([]);
    setCash("");
    setDiscount("");
    setIsDepositHold(false);
    setDepositAmount("");
    setPaymentReference("");
  }

  return (
    <main className="checkout-shell">
      <header className="checkout-header">
        <BackButton onClick={onBack} label="Home" />
        <div>
          <p className="eyebrow">Checkout Terminal</p>
          <h1>Start a sale</h1>
        </div>
        <div className="checkout-station-controls">
          <div className="active-cashier-pill">
            <span className={`cashier-status-dot ${activeCashier ? "active" : "locked"}`} />
            <span className="cashier-name-text">
              {activeCashier ? activeCashier.name : "Register Locked"}
            </span>
            <button
              type="button"
              className="switch-cashier-btn"
              onClick={() => setIsRegisterLocked(true)}
              title="Switch cashier or lock register"
            >
              🔒 {activeCashier ? "Switch" : "Unlock"}
            </button>
          </div>
          <select
            aria-label="Select register"
            className="register-pill"
            value={selectedRegister}
            onChange={(event) => setSelectedRegister(event.target.value)}
          >
            {registers.length > 0 ? (
              registers
                .filter((r) => r.active !== false)
                .map((r) => (
                  <option key={r.id} value={r.name}>
                    📍 {r.name} {r.name === localStorage.getItem("storeflow_default_register") ? "(This Device)" : ""}
                  </option>
                ))
            ) : (
              <option value="Register 1 (Main)">📍 Register 1 (Main)</option>
            )}
          </select>

          {enableCashDrawerShifts && (
            activeShift ? (
              <button
                type="button"
                className="till-status-pill open"
                onClick={() => setShowDrawerModal(true)}
                title="Manage drawer cash, record petty cash, or close till"
              >
                <span className="till-status-dot open" />
                <div className="till-status-info">
                  <span className="till-status-label">Till Open</span>
                  <strong className="till-status-val">{formatNaira(activeShift.expectedCash)}</strong>
                </div>
                <span className="till-status-gear">⚙</span>
              </button>
            ) : (
              <button
                type="button"
                className="till-status-pill closed"
                onClick={() => setShowOpenShiftModal(true)}
                title="Start shift and enter starting cash float"
              >
                <span className="till-status-dot closed" />
                <div className="till-status-info">
                  <span className="till-status-label">Till Closed</span>
                  <strong className="till-status-val">Open Shift</strong>
                </div>
                <span className="till-status-plus">+</span>
              </button>
            )
          )}
        </div>
      </header>

      {isRegisterLocked && (
        <CashierPinModal
          cashiers={cashiers}
          activeCashier={activeCashier}
          preview={preview}
          tenantId={tenantId}
          onUnlock={(unlockedCashier) => {
            setActiveCashier(unlockedCashier);
            setIsRegisterLocked(false);
          }}
          onCancel={activeCashier ? () => setIsRegisterLocked(false) : undefined}
          onExit={onBack}
        />
      )}

      <div className="checkout-layout">
        <section className="checkout-products">
          <div className="checkout-toolbar">
            <input
              aria-label="Find a product"
              placeholder="Search or scan a barcode..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="checkout-categories">
              {categories.map((item) => (
                <button
                  className={category === item ? "active" : ""}
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="product-tiles">
            {visibleProducts.map((product) => (
              <button
                className="product-tile"
                type="button"
                key={product.id}
                onClick={() => handleProductTileClick(product)}
                style={{ position: "relative" }}
              >
                <div className="tile-image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" />
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#0f172a", color: "#f8fafc", fontSize: "16px", fontWeight: 700 }}>
                      {product.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "4px 0 2px" }}>
                  {product.colorHex && (
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: product.colorHex, border: "1px solid rgba(0,0,0,0.2)" }} />
                  )}
                  <strong style={{ fontSize: "12px", lineHeight: "1.25" }}>{product.name}</strong>
                </div>
                {product.fabric && (
                  <small style={{ color: "#64748b", fontSize: "10px", display: "block", marginBottom: "2px" }}>
                    {product.fabric}
                  </small>
                )}
                <span>
                  {formatNaira(product.price)} · {product.unit}
                </span>
              </button>
            ))}
          </div>
        </section>
        <aside className="ticket-panel">
          <div className="ticket-heading">
            <div>
              <p className="eyebrow">
                {activeCashier ? activeCashier.name : "Current sale"} · {selectedRegister}
              </p>
              <h2>Ticket</h2>
            </div>
            <span>{cart.reduce((sum, line) => sum + line.quantity, 0)} items</span>
          </div>
          <div className="ticket-lines">
            {cart.length ? (
              cart.map((line, idx) => {
                const linePrice = (line.unitPrice || line.product.price) * line.quantity;
                return (
                  <div className="ticket-line" key={`${line.product.id}-${idx}`}>
                    <div style={{ flex: 1 }}>
                      <strong>{line.product.name}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b", margin: "2px 0", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {line.selectedSize && (
                          <span style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: "4px", fontWeight: 600 }}>
                            {line.selectedSize}
                          </span>
                        )}
                        {line.selectedColor && (
                          <span style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: "4px" }}>
                            {line.selectedColor}
                          </span>
                        )}
                        <span style={{ background: line.orderType === "rental" ? "#ede9fe" : "#dcfce7", color: line.orderType === "rental" ? "#6d28d9" : "#166534", padding: "1px 5px", borderRadius: "4px", fontWeight: 700 }}>
                          {line.orderType === "rental" ? "Rental" : "Sale"}
                        </span>
                      </div>
                      {line.requiresAlteration && (
                        <div style={{ fontSize: "10px", color: "#b91c1c", fontStyle: "italic", background: "#fef2f2", padding: "2px 5px", borderRadius: "3px", marginTop: "2px" }}>
                          ✂️ {line.alterationNotes || "Tailor Alterations Requested"}
                        </div>
                      )}
                      <span>{formatNaira(linePrice)} {line.quantity > 1 ? `(${formatNaira(line.unitPrice || line.product.price)} ea)` : ""}</span>
                    </div>
                    <div className="quantity-control">
                      <button type="button" onClick={() => updateQuantity(idx, line.quantity - 1)}>
                        -
                      </button>
                      <span>{line.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(idx, line.quantity + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="ticket-empty">Tap a suit or accessory to ring up.</div>
            )}
          </div>
          <div className="ticket-total">
            <div>
              <span>Subtotal</span>
              <strong>{formatNaira(subtotal)}</strong>
            </div>
            {discountAmount > 0 && (
              <div>
                <span>Discount</span>
                <strong style={{ color: "#a04040" }}>-{formatNaira(discountAmount)}</strong>
              </div>
            )}
            <div>
              <span>Tax (7.5%)</span>
              <strong>{formatNaira(tax)}</strong>
            </div>
            <div className="total-row">
              <span>Total Amount</span>
              <strong>{formatNaira(total)}</strong>
            </div>
          </div>
          {cart.length > 0 && (
            <div className="discount-row">
              <span className="discount-toggle">
                <button
                  className={discountType === "percent" ? "active" : ""}
                  type="button"
                  onClick={() => setDiscountType("percent")}
                >
                  %
                </button>
                <button
                  className={discountType === "flat" ? "active" : ""}
                  type="button"
                  onClick={() => setDiscountType("flat")}
                >
                  ₦
                </button>
              </span>
              <label>
                Discount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  placeholder={discountType === "percent" ? "0 %" : "0.00"}
                />
              </label>
            </div>
          )}

          {/* Payment Method Selector (All 6 Storeflow/FMO Payment Options) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", margin: "14px 0 8px" }}>
            {[
              { id: "cash", label: "💰 Cash" },
              { id: "debit_card", label: "💳 Debit Card" },
              { id: "credit_card", label: "💳 Credit Card" },
              { id: "bank_transfer", label: "🏦 Transfer" },
              { id: "paypal", label: "🅿️ PayPal" },
              { id: "cheque", label: "🏦 Check" },
            ].map((method) => (
              <button
                key={method.id}
                className={paymentMethod === method.id ? "primary-button" : "secondary-button"}
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                style={{ padding: "8px 4px", fontSize: "11px", borderRadius: "6px", fontWeight: 600, textAlign: "center", minHeight: "34px" }}
              >
                {method.label}
              </button>
            ))}
          </div>

          {/* Zenith Bank Direct Transfer Details */}
          {paymentMethod === "bank_transfer" && (
            <div style={{ padding: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", margin: "10px 0" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                Zenith Bank Transfer Details:
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "1px", color: "#0f172a" }}>
                    1018944521
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                    Zenith Bank PLC · FMO LUXURY MENSWEAR
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText("1018944521");
                    alert("Zenith Bank account number (1018944521) copied to clipboard!");
                  }}
                  style={{ fontSize: "10px", padding: "4px 8px", background: "#0f172a", color: "#ffffff", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  Copy
                </button>
              </div>
              <label style={{ marginTop: "8px", display: "block" }}>
                <span style={{ fontSize: "10px", color: "#64748b" }}>Bank Reference / RRN (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. ZENITH-TRF-094812"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  style={{ marginTop: "2px", fontSize: "11px", padding: "6px 8px" }}
                />
              </label>
            </div>
          )}

          {/* Fitting Deposit / Down-Payment Hold Option */}
          <div style={{ margin: "10px 0", padding: "8px 10px", background: isDepositHold ? "#f0fdf4" : "#f8fafc", border: `1px solid ${isDepositHold ? "#86efac" : "#e2e8f0"}`, borderRadius: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: "#1e293b", margin: 0 }}>
              <input
                type="checkbox"
                checked={isDepositHold}
                onChange={(e) => {
                  setIsDepositHold(e.target.checked);
                  if (e.target.checked && !depositAmount) {
                    setDepositAmount(String(Math.round(total * 0.5)));
                  }
                }}
              />
              <span>Take Down-Payment Deposit (Fitting Hold)</span>
            </label>
            {isDepositHold && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <input
                    type="number"
                    min="0"
                    max={total}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder={String(Math.round(total * 0.5))}
                    style={{ flex: 1, margin: 0, padding: "6px 8px", fontSize: "12px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setDepositAmount(String(Math.round(total * 0.5)))}
                    style={{ padding: "6px 8px", fontSize: "10px", borderRadius: "5px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 700 }}
                  >
                    50%
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "11px" }}>
                  <span style={{ color: "#64748b" }}>Balance at pickup:</span>
                  <strong style={{ color: "#b91c1c" }}>{formatNaira(balanceDue)}</strong>
                </div>
              </div>
            )}
          </div>

          {paymentMethod === "cash" && (
            <label>
              Cash received
              <input
                type="number"
                min="0"
                step="0.01"
                value={cash}
                onChange={(event) => setCash(event.target.value)}
                placeholder={formatNaira(effectiveDue)}
              />
            </label>
          )}
          {paymentMethod === "cash" && Number(cash) >= effectiveDue && effectiveDue > 0 && (
            <p className="change-line">
              Change <strong>{formatNaira(change)}</strong>
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-notice">{message}</p>}
          <button
            className="primary-button payment-button"
            type="button"
            disabled={saving || !cart.length || (paymentMethod === "cash" && Number(cash) < effectiveDue)}
            onClick={finishSale}
          >
            {saving
              ? "Saving sale..."
              : paymentMethod === "cash"
              ? isDepositHold ? "Accept Cash Deposit" : "Take cash payment"
              : paymentMethod === "bank_transfer"
              ? "Confirm Bank Transfer"
              : "Take card payment"}{" "}
            <span>→</span>
          </button>
        </aside>
      </div>

      {/* Sartorial Tailoring Variant & Fitting Modal */}
      {selectedProductForVariant && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setSelectedProductForVariant(null)}>
          <div className="product-modal sartorial-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px", width: "95%", background: "white", borderRadius: "12px", padding: "24px" }}>
            <div className="modal-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <p className="eyebrow" style={{ margin: 0, color: "#168379" }}>Sartorial Fitting & Sizing</p>
                <h2 style={{ margin: "4px 0", fontSize: "18px" }}>{selectedProductForVariant.name}</h2>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                  Fabric: {selectedProductForVariant.fabric || "Super 140s Wool"} · {selectedProductForVariant.category}
                </p>
              </div>
              <button className="close-button" type="button" onClick={() => setSelectedProductForVariant(null)} style={{ fontSize: "18px", border: "none", background: "none", cursor: "pointer" }}>✕</button>
            </div>

            {/* Purchase vs Rental Option */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => setModalOrderType("sale")}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: modalOrderType === "sale" ? "2px solid #168379" : "1px solid #cbd5e1",
                  background: modalOrderType === "sale" ? "#f0fdf9" : "white",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <strong style={{ display: "block", fontSize: "12px", color: "#0f172a" }}>Bespoke Purchase</strong>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#168379" }}>{formatNaira(selectedProductForVariant.price)}</span>
              </button>
              <button
                type="button"
                onClick={() => setModalOrderType("rental")}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: modalOrderType === "rental" ? "2px solid #168379" : "1px solid #cbd5e1",
                  background: modalOrderType === "rental" ? "#f0fdf9" : "white",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <strong style={{ display: "block", fontSize: "12px", color: "#0f172a" }}>Event Rental</strong>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#7c3aed" }}>
                  {formatNaira(selectedProductForVariant.rentalPrice || 75000)}
                </span>
              </button>
            </div>

            {/* Size Selector */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#475569", display: "block", marginBottom: "6px" }}>
                Select Jacket & Trouser Size:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {["38R", "40R", "42R", "44R", "46R", "48R", "Custom Bespoke"].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setModalSize(sz)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      border: modalSize === sz ? "2px solid #168379" : "1px solid #cbd5e1",
                      background: modalSize === sz ? "#168379" : "white",
                      color: modalSize === sz ? "white" : "#1e293b",
                      cursor: "pointer"
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Swatches */}
            {selectedProductForVariant.colors && selectedProductForVariant.colors.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#475569", display: "block", marginBottom: "6px" }}>
                  Fabric Color Swatch:
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedProductForVariant.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setModalColor(c.name)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 600,
                        border: modalColor === c.name ? "2px solid #0f172a" : "1px solid #cbd5e1",
                        background: modalColor === c.name ? "#f1f5f9" : "white",
                        cursor: "pointer"
                      }}
                    >
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: c.hex, display: "inline-block", border: "1px solid rgba(0,0,0,0.2)" }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Alterations Toggle */}
            <div style={{ padding: "10px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", margin: 0, fontWeight: 700, fontSize: "12px" }}>
                <input
                  type="checkbox"
                  checked={modalRequiresAlterations}
                  onChange={(e) => setModalRequiresAlterations(e.target.checked)}
                />
                <span>✂️ Tailoring & Fitting Alterations Required?</span>
              </label>

              {modalRequiresAlterations && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                    <label style={{ margin: 0, fontSize: "10px" }}>
                      Chest (in)
                      <input
                        type="text"
                        value={modalMeasurements.chest}
                        onChange={(e) => setModalMeasurements({ ...modalMeasurements, chest: e.target.value })}
                        style={{ marginTop: "2px", padding: "5px", fontSize: "11px" }}
                      />
                    </label>
                    <label style={{ margin: 0, fontSize: "10px" }}>
                      Waist (in)
                      <input
                        type="text"
                        value={modalMeasurements.waist}
                        onChange={(e) => setModalMeasurements({ ...modalMeasurements, waist: e.target.value })}
                        style={{ marginTop: "2px", padding: "5px", fontSize: "11px" }}
                      />
                    </label>
                    <label style={{ margin: 0, fontSize: "10px" }}>
                      Inseam (in)
                      <input
                        type="text"
                        value={modalMeasurements.inseam}
                        onChange={(e) => setModalMeasurements({ ...modalMeasurements, inseam: e.target.value })}
                        style={{ marginTop: "2px", padding: "5px", fontSize: "11px" }}
                      />
                    </label>
                    <label style={{ margin: 0, fontSize: "10px" }}>
                      Sleeve (in)
                      <input
                        type="text"
                        value={modalMeasurements.sleeve}
                        onChange={(e) => setModalMeasurements({ ...modalMeasurements, sleeve: e.target.value })}
                        style={{ marginTop: "2px", padding: "5px", fontSize: "11px" }}
                      />
                    </label>
                  </div>
                  <label style={{ margin: 0, fontSize: "10px" }}>
                    Tailor Instructions
                    <input
                      type="text"
                      placeholder="e.g. Hem trousers 1 inch, taper lower leg"
                      value={modalAlterationNotes}
                      onChange={(e) => setModalAlterationNotes(e.target.value)}
                      style={{ marginTop: "2px", padding: "5px", fontSize: "11px" }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="secondary-button" onClick={() => setSelectedProductForVariant(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={confirmAddVariant}>
                Add Suit to Ticket <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {receipt && (
        <ReceiptPreview
          receipt={receipt}
          onClose={() => setReceipt(null)}
          onLockTill={() => {
            setReceipt(null);
            setIsRegisterLocked(true);
          }}
        />
      )}

      {enableCashDrawerShifts && showOpenShiftModal && (
        <OpenShiftModal
          registerName={selectedRegister}
          cashierName={activeCashier ? activeCashier.name : "Duty Cashier"}
          onConfirm={handleOpenShift}
          onCancel={() => setShowOpenShiftModal(false)}
        />
      )}

      {enableCashDrawerShifts && showDrawerModal && activeShift && (
        <DrawerManagerModal
          shift={activeShift}
          onClose={() => setShowDrawerModal(false)}
          onAddMovement={handleAddShiftMovement}
          onRequestCloseShift={() => {
            setShowDrawerModal(false);
            setShowCloseShiftModal(true);
          }}
        />
      )}

      {enableCashDrawerShifts && showCloseShiftModal && activeShift && (
        <CloseShiftModal
          shift={activeShift}
          onClose={() => setShowCloseShiftModal(false)}
          onFinalizeClose={handleFinalizeCloseShift}
        />
      )}

      {zReportData && (
        <ZReportPreview
          data={zReportData}
          onClose={() => setZReportData(null)}
          onLockTill={() => {
            setZReportData(null);
            setIsRegisterLocked(true);
          }}
        />
      )}
    </main>
  );
}

const demoEmail = "demo@storeflow.test";
const demoPassword = "Storeflow123!";

function AuthScreen({ onDemo }: { onDemo: () => void }) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (
      mode === "sign-in" &&
      email === demoEmail &&
      password === demoPassword
    ) {
      onDemo();
      return;
    }
    if (!supabase) {
      setError(
        "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local first.",
      );
      return;
    }
    setSubmitting(true);
    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setSubmitting(false);
    if (result.error) setError(result.error.message);
    else if (mode === "sign-up")
      setNotice("Check your email to confirm your account, then sign in.");
  }

  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <div className="brand-lockup">
          <div className="brand-mark">S</div>
          <div>
            <strong>Storeflow</strong>
            <span>Your store, in one place</span>
          </div>
        </div>
        <p className="eyebrow">Let's get your store set up</p>
        <h1>Run the store without the fuss.</h1>
        <p className="intro">
          Keep your products, people, and sales together so the day is easier to
          manage.
        </p>
        <div className="auth-points">
          <span>✓</span> Your business stays separate <span>✓</span> Made for
          busy shifts
        </div>
      </section>
      <section className="auth-card">
        <div className="auth-card-heading">
          <p className="eyebrow">
            {mode === "sign-in" ? "Welcome back" : "New here?"}
          </p>
          <h2>
            {mode === "sign-in" ? "Sign in to Storeflow" : "Make an account"}
          </h2>
          <p>
            {mode === "sign-in"
              ? "Use your email to get back in."
              : "We'll set up your store next."}
          </p>
        </div>
        <form onSubmit={submitAuth}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
            />
          </label>
          {mode === "sign-in" && (
            <p className="demo-help">
              Try the demo: <strong>{demoEmail}</strong> /{" "}
              <strong>{demoPassword}</strong>
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
          {notice && <p className="form-notice">{notice}</p>}
          <button
            className="primary-button auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "One moment..."
              : mode === "sign-in"
                ? "Sign in"
                : "Make my account"}{" "}
            <span>→</span>
          </button>
        </form>
        <button
          className="mode-toggle"
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError("");
            setNotice("");
          }}
        >
          {mode === "sign-in"
            ? "Need an account? Make one"
            : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}

function OnboardingScreen() {
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function createWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    const result = await supabase.rpc("create_tenant_with_owner", {
      tenant_name: businessName,
      tenant_slug: slug,
    });
    setSubmitting(false);
    if (result.error) setError(result.error.message);
    else window.location.reload();
  }

  return (
    <main className="onboarding-layout">
      <div className="onboarding-card">
        <div className="brand-lockup">
          <div className="brand-mark">S</div>
          <div>
            <strong>Storeflow</strong>
            <span>Your store, in one place</span>
          </div>
        </div>
        <p className="eyebrow">Let's get things ready</p>
        <h1>What's your store called?</h1>
        <p className="intro">
          This is your private store. You can add locations and people when
          you're ready.
        </p>
        <form onSubmit={createWorkspace}>
          <label>
            Store name
            <input
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="e.g. Northline Market"
              required
            />
          </label>
          <label>
            Short name for your store
            <input
              value={slug}
              onChange={(event) =>
                setSlug(
                  event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                )
              }
              placeholder="northline-market"
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button
            className="primary-button auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Setting things up..." : "Set up my store"}{" "}
            <span>→</span>
          </button>
        </form>
        <button
          className="mode-toggle"
          type="button"
          onClick={() => supabase?.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [previewMode, setPreviewMode] = useState(true);
  const [showLookbookModal, setShowLookbookModal] = useState(false);
  const [workspace, setWorkspace] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);
  type ScreenType = "home" | "products" | "checkout" | "settings" | "team" | "reports";

  function getScreenFromHash(): ScreenType {
    if (typeof window === "undefined") return "home";
    const raw = window.location.hash.replace(/^#\/?/, "").toLowerCase();
    const validScreens: ScreenType[] = ["home", "products", "checkout", "settings", "team", "reports"];
    if (validScreens.includes(raw as ScreenType)) {
      return raw as ScreenType;
    }
    return "home";
  }

  const [screen, setScreen] = useState<ScreenType>(() => getScreenFromHash());
  const [checkingWorkspace, setCheckingWorkspace] = useState(false);

  const navigateTo = (targetScreen: ScreenType) => {
    const currentScreen = getScreenFromHash();
    if (currentScreen !== targetScreen) {
      const targetHash = targetScreen === "home" ? "" : `#/${targetScreen}`;
      window.history.pushState(
        { screen: targetScreen },
        "",
        targetHash || window.location.pathname + window.location.search
      );
    }
    setScreen(targetScreen);
  };

  const handleGoBack = () => {
    if (window.location.hash && window.location.hash !== "#" && window.location.hash !== "#/") {
      window.history.back();
    } else {
      navigateTo("home");
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const target = getScreenFromHash();
      setScreen(target);
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);

    const initialScreen = getScreenFromHash();
    const initialHash = initialScreen === "home" ? "" : `#/${initialScreen}`;
    if (!window.history.state || window.history.state.screen !== initialScreen) {
      window.history.replaceState(
        { screen: initialScreen },
        "",
        initialHash || window.location.pathname + window.location.search
      );
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setWorkspace(null);
        setCheckingWorkspace(Boolean(nextSession));
        setSession(nextSession);
      },
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !supabase) return;

    async function fetchWorkspace() {
      if (!supabase || !session) return;

      try {
        const { data: rpcClaim } = await supabase.rpc("claim_my_invitation");
        if (rpcClaim && rpcClaim.tenant_id && rpcClaim.name) {
          setWorkspace({
            id: rpcClaim.tenant_id as string,
            name: rpcClaim.name as string,
            role: (rpcClaim.role as string) ?? "cashier",
          });
          setCheckingWorkspace(false);
          return;
        }
      } catch (e) {
        console.warn("claim_my_invitation RPC not available yet:", e);
      }

      const { data: userMatch } = await supabase
        .from("tenant_members")
        .select("id, tenant_id, role, tenants(name)")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (userMatch) {
        const tenant = Array.isArray(userMatch.tenants) ? userMatch.tenants[0] : userMatch.tenants;
        if (tenant?.name) {
          setWorkspace({
            id: userMatch.tenant_id,
            name: tenant.name,
            role: userMatch.role ?? "cashier",
          });
          setCheckingWorkspace(false);
          return;
        }
      }

      setCheckingWorkspace(false);
    }

    fetchWorkspace();
  }, [session]);

  if (!session && !previewMode)
    return <AuthScreen onDemo={() => setPreviewMode(true)} />;
  if (!previewMode && checkingWorkspace)
    return <main className="loading-screen">Loading your workspace...</main>;
  if (!previewMode && !workspace) return <OnboardingScreen />;

  if (screen === "products")
    return (
      <ProductsScreen
        tenantId={workspace?.id}
        preview={previewMode}
        onBack={handleGoBack}
      />
    );
  if (screen === "checkout") return <CheckoutScreen preview={previewMode} tenantId={workspace?.id} onBack={handleGoBack} />;
  if (screen === "settings") return <StoreSettingsScreen tenantId={workspace?.id} preview={previewMode} onBack={handleGoBack} />;
  if (screen === "team")
    return (
      <TeamScreen
        tenantId={workspace?.id}
        preview={previewMode}
        currentUserRole={workspace?.role}
        onBack={handleGoBack}
      />
    );
  if (screen === "reports")
    return (
      <ReportsScreen
        tenantId={workspace?.id}
        preview={previewMode}
        currentUserRole={workspace?.role}
        onBack={handleGoBack}
      />
    );

  const displayEmail = session?.user.email ?? "flagship@fmo.ng";
  const displayWorkspace = workspace ?? {
    id: "preview",
    name: "FMO Flagship Store (Enugu)",
    role: "owner",
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" style={{ background: "#0f172a", border: "1px solid #334155", color: "#f8fafc", fontSize: "12px", letterSpacing: "0.5px", fontWeight: 800 }}>
            FMO
          </div>
          <div>
            <strong>Storeflow</strong>
            <span>FMO Flagship · Sartorial House</span>
          </div>
        </div>
        <div className="workspace-status">
          <span className="status-dot" /> {displayWorkspace.name}
          <span className={`role-badge ${displayWorkspace.role}`} style={{ marginLeft: "8px" }}>
            {displayWorkspace.role === "owner" ? "Owner" : displayWorkspace.role === "manager" ? "Lead Stylist" : "Cashier"}
          </span>
        </div>
        <button
          className="settings-link"
          type="button"
          onClick={() => setShowLookbookModal(true)}
          style={{ background: "#f8fafc", borderColor: "#cbd5e1", color: "#1e293b", fontWeight: 700 }}
        >
          📖 Brand Lookbook
        </button>
        {(previewMode || displayWorkspace.role === "owner" || displayWorkspace.role === "manager") && (
          <button className="settings-link" type="button" onClick={() => navigateTo("settings")}>Store settings</button>
        )}
        <button
          className="avatar-button"
          type="button"
          aria-label="Sign out"
          title={`Signed in as ${displayEmail} (${displayWorkspace.role}). Click to sign out.`}
          onClick={() =>
            previewMode ? setPreviewMode(false) : supabase?.auth.signOut()
          }
        >
          {displayEmail.slice(0, 2).toUpperCase()}
        </button>
      </header>
      <section className="welcome-panel">
        <div>
          <p className="eyebrow">{displayWorkspace.role} account · Enugu Flagship</p>
          <h1>FMO Sartorial House & Boutique</h1>
          <p className="intro">
            No 1 Suit Store in Enugu. For the Man of Class & Culture. Ready for orders, tailor fittings, stock, and checkout.
          </p>
        </div>
        <div className="sync-card">
          <span className="sync-icon" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div>
            <strong>Tony Ubagu (Lead Stylist)</strong>
            <span>{displayEmail}</span>
          </div>
        </div>
      </section>
      <section className="workspace-grid" aria-label="Workspace modules">
        <article className="module-card module-card-primary">
          <div className="card-heading">
            <span className="icon-tile blue">▦</span>
            <span className="module-state">Primary Duty</span>
          </div>
          <h2>Checkout & Sales</h2>
          <p>Ring up bespoke suits, fitting deposits, take Cash, Card, or Zenith Bank Transfer, and print tailor work slips.</p>
          <button className="primary-button" type="button" onClick={() => navigateTo("checkout")}>
            Open checkout <span>→</span>
          </button>
        </article>

        <article className="module-card">
          <div className="card-heading">
            <span className="icon-tile green">◈</span>
            <span className="module-state">Catalog Ready</span>
          </div>
          <h2>Products & stock</h2>
          <p>
            Browse 47+ luxury suit cuts across 7 sartorial categories, manage sizes, colors, fabrics, and inventory.
          </p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => navigateTo("products")}
          >
            See products <span>→</span>
          </button>
        </article>

        <article className="module-card">
          <div className="card-heading">
            <span className="icon-tile purple">⬡</span>
            <span className="module-state">Stylists & Tailors</span>
          </div>
          <h2>Team & cashiers</h2>
          <p>
            Manage sartorial stylists, master tailors, fitting roles, and quick 4-digit register PINs.
          </p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => navigateTo("team")}
          >
            Manage team <span>→</span>
          </button>
        </article>

        <article className="module-card">
          <div className="card-heading">
            <span className="icon-tile amber">📈</span>
            <span className="module-state">Sartorial Analytics</span>
          </div>
          <h2>Reports & analytics</h2>
          <p>See daily suit sales totals, fitting deposits collected, VAT 7.5%, payment breakdowns, and margins.</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => navigateTo("reports")}
          >
            View sales reports <span>→</span>
          </button>
        </article>

        <article className="module-card">
          <div className="card-heading">
            <span className="icon-tile teal">⚙️</span>
            <span className="module-state">Administration</span>
          </div>
          <h2>Store settings</h2>
          <p>Flagship boutique address in Trans-Ekulu Enugu, Zenith Bank transfer details, and register tills.</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => navigateTo("settings")}
          >
            Store settings <span>→</span>
          </button>
        </article>
      </section>
      <footer className="setup-footer">
        <span>Storeflow v0.1 · FMO Tailoring ERP</span>
        <span>
          <i /> Trans-Ekulu, Enugu Flagship
        </span>
      </footer>

      {/* Editorial Lookbook Modal */}
      {showLookbookModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" style={{ zIndex: 9999, background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)", padding: "20px" }}>
          <div style={{ maxWidth: "1280px", width: "100%", maxHeight: "92vh", overflowY: "auto", background: "#0a0a0a", color: "white", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontWeight: 800, letterSpacing: "2px", fontSize: "16px", color: "#d4af37" }}>FMO EDITORIAL</span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>The 2026 Sartorial Lookbook & Collection</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLookbookModal(false)}
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}
              >
                ✕ Back to Storeflow POS
              </button>
            </div>
            <div style={{ padding: "24px" }}>
              <FmoLookbook onSelectProductForFitting={() => setShowLookbookModal(false)} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;

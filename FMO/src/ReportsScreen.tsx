import { useEffect, useState, useMemo } from "react";
import { supabase } from "./lib/supabase";
import { ZReportPreview, type ZReportData } from "./ZReportModal";
import { BackButton } from "./BackButton";

interface ReportsScreenProps {
  tenantId?: string;
  preview?: boolean;
  currentUserRole?: string;
  onBack: () => void;
}

type TabType = "overview" | "items" | "team" | "receipts" | "taxes" | "shifts";

export interface ClosedShiftReport {
  id: string;
  registerName: string;
  cashierName: string;
  startedAt: string;
  endedAt: string;
  openingCash: number;
  closingCash: number;
  expectedCash: number;
  variance: number;
  cashSalesTotal: number;
  cardSalesTotal: number;
  grossSalesTotal: number;
  totalSalesCount: number;
  cashInTotal: number;
  cashOutTotal: number;
  notes?: string;
}

interface SalesSummary {
  grossSales: number;
  netSales: number;
  totalSalesCount: number;
  totalProfit: number;
  totalDiscounts: number;
  discountedOrdersCount: number;
  totalTax: number;
  averageOrderValue: number;
  cashRevenue: number;
  cardRevenue: number;
}

interface ItemReport {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
  costOfGoods: number;
  profit: number;
  taxCollected: number;
}

interface CategoryReport {
  name: string;
  itemCount: number;
  quantitySold: number;
  totalRevenue: number;
  costOfGoods: number;
  profit: number;
  percentageOfSales: number;
}

interface StaffReport {
  cashierId: string;
  cashierName: string;
  role: string;
  salesCount: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface DetailedSaleItem {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxAmount: number;
}

interface DetailedReceipt {
  id: string;
  createdAt: string;
  total: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  paymentMethod: string;
  tenderedAmount: number;
  changeAmount: number;
  itemCount: number;
  cashierName: string;
  cashierRole?: string;
  items: DetailedSaleItem[];
}

function formatNaira(amount: number) {
  return `₦${Number(amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// RFC-compliant in-browser CSV generator
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map(row => row.map(escapeCsv).join(","))
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Realistic Mock Data for Preview & Demo
const mockSummary: SalesSummary = {
  grossSales: 260800,
  netSales: 245800,
  totalSalesCount: 42,
  totalProfit: 86400,
  totalDiscounts: 15000,
  discountedOrdersCount: 6,
  totalTax: 17150,
  averageOrderValue: 5852.38,
  cashRevenue: 165000,
  cardRevenue: 80800,
};

const mockItemReports: ItemReport[] = [
  { id: "1", name: "Coffee - House Blend", sku: "COF-001", category: "Beverages", quantitySold: 34, totalRevenue: 119000, costOfGoods: 71400, profit: 47600, taxCollected: 8325 },
  { id: "2", name: "Croissant - Butter", sku: "BAK-002", category: "Bakery", quantitySold: 28, totalRevenue: 42000, costOfGoods: 25200, profit: 16800, taxCollected: 2940 },
  { id: "3", name: "Cold Brew Coffee", sku: "COF-003", category: "Beverages", quantitySold: 22, totalRevenue: 39600, costOfGoods: 23760, profit: 15840, taxCollected: 2772 },
  { id: "4", name: "Matcha Latte", sku: "BEV-004", category: "Beverages", quantitySold: 18, totalRevenue: 32400, costOfGoods: 19440, profit: 12960, taxCollected: 2268 },
  { id: "5", name: "Almond Milk", sku: "MIL-005", category: "Dairy", quantitySold: 8, totalRevenue: 12800, costOfGoods: 9600, profit: 3200, taxCollected: 845 },
];

const mockCategoryReports: CategoryReport[] = [
  { name: "Beverages", itemCount: 3, quantitySold: 74, totalRevenue: 191000, costOfGoods: 114600, profit: 76400, percentageOfSales: 78 },
  { name: "Bakery", itemCount: 1, quantitySold: 28, totalRevenue: 42000, costOfGoods: 25200, profit: 16800, percentageOfSales: 17 },
  { name: "Dairy", itemCount: 1, quantitySold: 8, totalRevenue: 12800, costOfGoods: 9600, profit: 3200, percentageOfSales: 5 },
];

const mockStaffReports: StaffReport[] = [
  { cashierId: "staff-1", cashierName: "Amina Lawal", role: "Cashier", salesCount: 26, totalRevenue: 152400, averageOrderValue: 5861.54 },
  { cashierId: "staff-2", cashierName: "Store Owner", role: "Owner", salesCount: 16, totalRevenue: 93400, averageOrderValue: 5837.5 },
];

const mockDetailedReceipts: DetailedReceipt[] = [
  {
    id: "TXN-849201",
    createdAt: new Date().toISOString(),
    total: 8500,
    subtotal: 9000,
    discountTotal: 500,
    taxTotal: 625,
    paymentMethod: "cash",
    tenderedAmount: 10000,
    changeAmount: 1500,
    itemCount: 3,
    cashierName: "Amina Lawal",
    cashierRole: "Cashier",
    items: [
      { name: "Coffee - House Blend", sku: "COF-001", quantity: 2, unitPrice: 3500, lineTotal: 7000, taxAmount: 490 },
      { name: "Croissant - Butter", sku: "BAK-002", quantity: 1, unitPrice: 1500, lineTotal: 1500, taxAmount: 105 },
    ]
  },
  {
    id: "TXN-849188",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    total: 4200,
    subtotal: 4200,
    discountTotal: 0,
    taxTotal: 294,
    paymentMethod: "card",
    tenderedAmount: 4200,
    changeAmount: 0,
    itemCount: 2,
    cashierName: "Amina Lawal",
    cashierRole: "Cashier",
    items: [
      { name: "Cold Brew Coffee", sku: "COF-003", quantity: 2, unitPrice: 1800, lineTotal: 3600, taxAmount: 252 },
      { name: "Croissant - Butter", sku: "BAK-002", quantity: 1, unitPrice: 600, lineTotal: 600, taxAmount: 42 },
    ]
  },
  {
    id: "TXN-849154",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    total: 12500,
    subtotal: 15000,
    discountTotal: 2500,
    taxTotal: 875,
    paymentMethod: "cash",
    tenderedAmount: 15000,
    changeAmount: 2500,
    itemCount: 5,
    cashierName: "Store Owner",
    cashierRole: "Owner",
    items: [
      { name: "Coffee - House Blend", sku: "COF-001", quantity: 3, unitPrice: 3500, lineTotal: 10500, taxAmount: 735 },
      { name: "Croissant - Butter", sku: "BAK-002", quantity: 2, unitPrice: 1500, lineTotal: 3000, taxAmount: 210 },
    ]
  },
  {
    id: "TXN-849099",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    total: 3500,
    subtotal: 3500,
    discountTotal: 0,
    taxTotal: 245,
    paymentMethod: "card",
    tenderedAmount: 3500,
    changeAmount: 0,
    itemCount: 1,
    cashierName: "Amina Lawal",
    cashierRole: "Cashier",
    items: [
      { name: "Coffee - House Blend", sku: "COF-001", quantity: 1, unitPrice: 3500, lineTotal: 3500, taxAmount: 245 },
    ]
  },
  {
    id: "TXN-848972",
    createdAt: new Date(Date.now() - 21600000).toISOString(),
    total: 6750,
    subtotal: 6750,
    discountTotal: 0,
    taxTotal: 472.5,
    paymentMethod: "cash",
    tenderedAmount: 7000,
    changeAmount: 250,
    itemCount: 4,
    cashierName: "Store Owner",
    cashierRole: "Owner",
    items: [
      { name: "Matcha Latte", sku: "BEV-004", quantity: 2, unitPrice: 1800, lineTotal: 3600, taxAmount: 252 },
      { name: "Croissant - Butter", sku: "BAK-002", quantity: 2, unitPrice: 1500, lineTotal: 3000, taxAmount: 210 },
    ]
  },
];

const mockClosedShifts: ClosedShiftReport[] = [
  {
    id: "shift-demo-101",
    registerName: "Register 1 (Main)",
    cashierName: "Amina Yusuf",
    startedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    openingCash: 10000,
    closingCash: 85500,
    expectedCash: 85500,
    variance: 0,
    cashSalesTotal: 77000,
    cardSalesTotal: 65400,
    grossSalesTotal: 142400,
    totalSalesCount: 22,
    cashInTotal: 0,
    cashOutTotal: 1500,
    notes: "Closed after afternoon rush. All cash balanced.",
  },
  {
    id: "shift-demo-100",
    registerName: "Register 2 (Express)",
    cashierName: "John (Register 2)",
    startedAt: new Date(Date.now() - 3600000 * 32).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    openingCash: 10000,
    closingCash: 48000,
    expectedCash: 48500,
    variance: -500,
    cashSalesTotal: 40500,
    cardSalesTotal: 31000,
    grossSalesTotal: 71500,
    totalSalesCount: 14,
    cashInTotal: 0,
    cashOutTotal: 2000,
    notes: "₦500 note torn, discarded with manager sign-off.",
  },
];

export function ReportsScreen({
  tenantId,
  preview = false,
  currentUserRole = "owner",
  onBack,
}: ReportsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("today");
  const [loading, setLoading] = useState(false);

  // Sub-controls
  const [itemSubView, setItemSubView] = useState<"items" | "categories">("items");
  const [chartView, setChartView] = useState<"bar" | "distribution">("bar");
  const [itemSearch, setItemSearch] = useState("");
  const [receiptSearch, setReceiptSearch] = useState("");
  const [receiptFilterMethod, setReceiptFilterMethod] = useState<"all" | "cash" | "card">("all");
  const [selectedReceipt, setSelectedReceipt] = useState<DetailedReceipt | null>(null);

  // Till Shifts & Z-Reports State
  const [closedShifts, setClosedShifts] = useState<ClosedShiftReport[]>(mockClosedShifts);
  const [shiftSearch, setShiftSearch] = useState("");
  const [selectedShiftForZReport, setSelectedShiftForZReport] = useState<ClosedShiftReport | null>(null);

  const [storeSettings, setStoreSettings] = useState<{
    businessName: string;
    receiptPhone: string;
    receiptAddress: string;
    receiptTin: string;
    receiptLicense: string;
    receiptPaperWidth: "58mm" | "80mm";
    enableCashDrawerShifts: boolean;
  }>({
    businessName: "Storeflow Retail",
    receiptPhone: "+234 800 123 4567",
    receiptAddress: "Victoria Island, Lagos, Nigeria",
    receiptTin: "TIN-23094810-0001",
    receiptLicense: "RC-8392019",
    receiptPaperWidth: "80mm",
    enableCashDrawerShifts: typeof window !== "undefined" ? localStorage.getItem("storeflow_enable_drawer_shifts") !== "false" : true,
  });

  // Aggregated Data States
  const [summary, setSummary] = useState<SalesSummary>(mockSummary);
  const [itemReports, setItemReports] = useState<ItemReport[]>(mockItemReports);
  const [categoryReports, setCategoryReports] = useState<CategoryReport[]>(mockCategoryReports);
  const [staffReports, setStaffReports] = useState<StaffReport[]>(mockStaffReports);
  const [receipts, setReceipts] = useState<DetailedReceipt[]>(mockDetailedReceipts);

  const isCashier = currentUserRole === "cashier";
  const marginPercent = summary.netSales > 0 ? Math.round((summary.totalProfit / summary.netSales) * 100) : 0;
  const cashPercent = summary.netSales > 0 ? Math.round((summary.cashRevenue / summary.netSales) * 100) : 50;
  const cardPercent = 100 - cashPercent;

  useEffect(() => {
    if (preview) {
      const savedSettings = localStorage.getItem("storeflow_demo_settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setStoreSettings(prev => ({
            ...prev,
            businessName: parsed.name || prev.businessName,
            receiptPhone: parsed.phone || prev.receiptPhone,
            receiptAddress: parsed.address || prev.receiptAddress,
            receiptTin: parsed.tin || prev.receiptTin,
            receiptLicense: parsed.regulatoryLicense || prev.receiptLicense,
            receiptPaperWidth: parsed.paperWidth === "58mm" ? "58mm" : "80mm",
            enableCashDrawerShifts: localStorage.getItem("storeflow_enable_drawer_shifts") !== "false",
          }));
        } catch {}
      }
    }
  }, [preview]);

  useEffect(() => {
    if (preview || !supabase || !tenantId) return;

    async function loadReportData() {
      if (!supabase) return;
      setLoading(true);
      try {
        // Fetch tenant settings for Z-Reports and branding
        const { data: tenantRow } = await supabase
          .from("tenants")
          .select("name, receipt_phone, receipt_address, receipt_tin, receipt_license, receipt_paper_width, enable_cash_drawer_shifts")
          .eq("id", tenantId)
          .maybeSingle();

        if (tenantRow) {
          setStoreSettings({
            businessName: tenantRow.name || "Storeflow Retail",
            receiptPhone: tenantRow.receipt_phone || "+234 800 123 4567",
            receiptAddress: tenantRow.receipt_address || "Victoria Island, Lagos, Nigeria",
            receiptTin: tenantRow.receipt_tin || "TIN-23094810-0001",
            receiptLicense: tenantRow.receipt_license || "RC-8392019",
            receiptPaperWidth: tenantRow.receipt_paper_width === "58mm" ? "58mm" : "80mm",
            enableCashDrawerShifts: tenantRow.enable_cash_drawer_shifts !== false,
          });
        }

        // 1. Fetch team members to map cashier UUIDs -> names
        const nameMap: Record<string, { name: string; role: string }> = {};
        const { data: members } = await supabase
          .from("tenant_members")
          .select("user_id, display_name, email, role")
          .eq("tenant_id", tenantId);
        if (members) {
          members.forEach((m: any) => {
            if (m.user_id) {
              nameMap[m.user_id] = {
                name: m.display_name || m.email || (m.role === "owner" ? "Store Owner" : "Staff"),
                role: m.role || "cashier"
              };
            }
          });
        }

        // 2. Fetch categories and products to map items -> category names
        const categoryMap: Record<string, string> = {};
        const { data: catData } = await supabase
          .from("categories")
          .select("id, name")
          .eq("tenant_id", tenantId);
        if (catData) {
          catData.forEach((c: any) => { categoryMap[c.id] = c.name; });
        }

        const productCategoryMap: Record<string, string> = {};
        const { data: prodData } = await supabase
          .from("products")
          .select("id, category_id")
          .eq("tenant_id", tenantId);
        if (prodData) {
          prodData.forEach((p: any) => {
            if (p.category_id && categoryMap[p.category_id]) {
              productCategoryMap[p.id] = categoryMap[p.category_id];
            }
          });
        }

        // 3. Filter cutoff date
        let cutoffDate: Date | null = null;
        const now = new Date();
        if (timeRange === "today") {
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (timeRange === "week") {
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeRange === "month") {
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // 4. Fetch sales
        let query = supabase
          .from("sales")
          .select(`
            id, total, subtotal, tax_total, discount_total, created_at, cashier_id,
            payments(method, amount, tendered_amount, change_amount),
            sale_items(product_id, product_name, sku, quantity, unit_price, unit_cost, line_total, tax_rate, tax_amount)
          `)
          .eq("tenant_id", tenantId)
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        if (cutoffDate) {
          query = query.gte("created_at", cutoffDate.toISOString());
        }

        const { data: salesData, error } = await query;

        if (error || !salesData) {
          console.warn("Could not load sales data, fallback to mock:", error?.message);
          setLoading(false);
          return;
        }

        if (salesData.length === 0) {
          setSummary({
            grossSales: 0, netSales: 0, totalSalesCount: 0, totalProfit: 0,
            totalDiscounts: 0, discountedOrdersCount: 0, totalTax: 0,
            averageOrderValue: 0, cashRevenue: 0, cardRevenue: 0
          });
          setItemReports([]);
          setCategoryReports([]);
          setStaffReports([]);
          setReceipts([]);
          setLoading(false);
          return;
        }

        let totalGross = 0;
        let totalNet = 0;
        let totalDiscountsVal = 0;
        let discountedCount = 0;
        let totalTaxVal = 0;
        let totalProfitVal = 0;
        let cashRev = 0;
        let cardRev = 0;

        const productAgg: Record<string, ItemReport> = {};
        const categoryAgg: Record<string, { itemCount: Set<string>; qty: number; rev: number; cost: number; profit: number }> = {};
        const staffAgg: Record<string, { name: string; role: string; count: number; rev: number }> = {};
        const receiptsList: DetailedReceipt[] = [];

        salesData.forEach((sale: any) => {
          const saleNet = Number(sale.total || 0);
          const saleDiscount = Number(sale.discount_total || 0);
          const saleTax = Number(sale.tax_total || 0);
          const saleSubtotal = Number(sale.subtotal || (saleNet + saleDiscount - saleTax));
          const saleGross = saleNet + saleDiscount;

          totalGross += saleGross;
          totalNet += saleNet;
          totalDiscountsVal += saleDiscount;
          if (saleDiscount > 0) discountedCount += 1;
          totalTaxVal += saleTax;

          // Payments
          const payments = sale.payments || [];
          let saleTendered = saleNet;
          let saleChange = 0;
          let primaryMethod = "cash";

          if (payments.length > 0) {
            payments.forEach((p: any) => {
              const amt = Number(p.amount || 0);
              if (p.method === "cash") {
                cashRev += amt;
                primaryMethod = "cash";
              } else if (p.method === "card") {
                cardRev += amt;
                primaryMethod = "card";
              }
              if (p.tendered_amount) saleTendered = Number(p.tendered_amount);
              if (p.change_amount) saleChange = Number(p.change_amount);
            });
          } else {
            cashRev += saleNet;
          }

          // Staff
          const cashierId = sale.cashier_id || "unknown";
          const staffInfo = nameMap[cashierId] || { name: "Store Staff", role: "cashier" };
          if (!staffAgg[cashierId]) {
            staffAgg[cashierId] = { name: staffInfo.name, role: staffInfo.role, count: 0, rev: 0 };
          }
          staffAgg[cashierId].count += 1;
          staffAgg[cashierId].rev += saleNet;

          // Items
          const items = sale.sale_items || [];
          const receiptItems: DetailedSaleItem[] = [];

          items.forEach((item: any) => {
            const qty = Number(item.quantity || 0);
            const lineRev = Number(item.line_total || (item.unit_price * qty));
            const cost = Number(item.unit_cost || 0) * qty;
            const profit = lineRev - cost;
            const taxAmt = Number(item.tax_amount || 0);
            totalProfitVal += profit;

            const name = item.product_name || "Product";
            const sku = item.sku || "-";
            const catName = (item.product_id && productCategoryMap[item.product_id]) || "General";

            if (!productAgg[name]) {
              productAgg[name] = {
                id: item.product_id || name,
                name,
                sku,
                category: catName,
                quantitySold: 0,
                totalRevenue: 0,
                costOfGoods: 0,
                profit: 0,
                taxCollected: 0
              };
            }
            productAgg[name].quantitySold += qty;
            productAgg[name].totalRevenue += lineRev;
            productAgg[name].costOfGoods += cost;
            productAgg[name].profit += profit;
            productAgg[name].taxCollected += taxAmt;

            // Category aggregation
            if (!categoryAgg[catName]) {
              categoryAgg[catName] = { itemCount: new Set<string>(), qty: 0, rev: 0, cost: 0, profit: 0 };
            }
            categoryAgg[catName].itemCount.add(name);
            categoryAgg[catName].qty += qty;
            categoryAgg[catName].rev += lineRev;
            categoryAgg[catName].cost += cost;
            categoryAgg[catName].profit += profit;

            receiptItems.push({
              name,
              sku,
              quantity: qty,
              unitPrice: Number(item.unit_price || 0),
              lineTotal: lineRev,
              taxAmount: taxAmt
            });
          });

          receiptsList.push({
            id: sale.id.slice(0, 8).toUpperCase(),
            createdAt: sale.created_at,
            total: saleNet,
            subtotal: saleSubtotal,
            discountTotal: saleDiscount,
            taxTotal: saleTax,
            paymentMethod: primaryMethod,
            tenderedAmount: saleTendered,
            changeAmount: saleChange,
            itemCount: items.length,
            cashierName: staffInfo.name,
            cashierRole: staffInfo.role,
            items: receiptItems
          });
        });

        const sortedItems = Object.values(productAgg).sort((a, b) => b.totalRevenue - a.totalRevenue);
        const sortedCategories: CategoryReport[] = Object.entries(categoryAgg)
          .map(([name, cat]) => ({
            name,
            itemCount: cat.itemCount.size,
            quantitySold: cat.qty,
            totalRevenue: cat.rev,
            costOfGoods: cat.cost,
            profit: cat.profit,
            percentageOfSales: totalNet > 0 ? Math.round((cat.rev / totalNet) * 100) : 0
          }))
          .sort((a, b) => b.totalRevenue - a.totalRevenue);

        const sortedStaff: StaffReport[] = Object.entries(staffAgg).map(([cashierId, data]) => ({
          cashierId,
          cashierName: data.name,
          role: data.role,
          salesCount: data.count,
          totalRevenue: data.rev,
          averageOrderValue: data.count > 0 ? data.rev / data.count : 0
        })).sort((a, b) => b.totalRevenue - a.totalRevenue);

        setSummary({
          grossSales: totalGross,
          netSales: totalNet,
          totalSalesCount: salesData.length,
          totalProfit: Math.max(0, totalProfitVal),
          totalDiscounts: totalDiscountsVal,
          discountedOrdersCount: discountedCount,
          totalTax: totalTaxVal,
          averageOrderValue: salesData.length > 0 ? totalNet / salesData.length : 0,
          cashRevenue: cashRev,
          cardRevenue: cardRev,
        });

        setItemReports(sortedItems);
        setCategoryReports(sortedCategories);
        setStaffReports(sortedStaff);
        setReceipts(receiptsList);

        // 6. Fetch closed shifts
        const { data: shiftData } = await supabase
          .from("employee_shifts")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("started_at", { ascending: false });

        if (shiftData && shiftData.length > 0) {
          const mappedShifts: ClosedShiftReport[] = shiftData.map((s: any) => ({
            id: s.id,
            registerName: s.register_name || "Register 1 (Main)",
            cashierName: s.cashier_name || "Cashier",
            startedAt: s.started_at,
            endedAt: s.ended_at || s.started_at,
            openingCash: Number(s.opening_cash || 0),
            closingCash: Number(s.closing_cash ?? s.expected_cash ?? 0),
            expectedCash: Number(s.expected_cash || s.opening_cash || 0),
            variance: Number(s.cash_variance || 0),
            cashSalesTotal: Number(s.cash_sales_total || 0),
            cardSalesTotal: Number(s.card_sales_total || 0),
            grossSalesTotal: Number(s.cash_sales_total || 0) + Number(s.card_sales_total || 0),
            totalSalesCount: Number(s.total_sales_count || 0),
            cashInTotal: Number(s.cash_in_total || 0),
            cashOutTotal: Number(s.cash_out_total || 0),
            notes: s.notes,
          }));
          setClosedShifts(mappedShifts);
        }
      } catch (err) {
        console.error("Error loading comprehensive report data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReportData();
  }, [timeRange, tenantId, preview]);

  // Demo mode closed shifts loader
  useEffect(() => {
    if (preview) {
      const saved = localStorage.getItem("storeflow_demo_closed_shifts");
      if (saved) {
        try {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) {
            setClosedShifts([...list, ...mockClosedShifts]);
          }
        } catch {}
      }
    }
  }, [preview]);

  // Contextual CSV Exporter
  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    if (activeTab === "overview") {
      downloadCsv(`Storeflow_Sales_Summary_${timeRange}_${dateStr}.csv`,
        ["Metric", "Value"],
        [
          ["Gross Sales", summary.grossSales.toFixed(2)],
          ["Total Discounts", summary.totalDiscounts.toFixed(2)],
          ["Net Sales", summary.netSales.toFixed(2)],
          ["Estimated Gross Profit", summary.totalProfit.toFixed(2)],
          ["Gross Margin %", `${marginPercent}%`],
          ["Total Tax Collected", summary.totalTax.toFixed(2)],
          ["Completed Transactions", summary.totalSalesCount],
          ["Average Order Value", summary.averageOrderValue.toFixed(2)],
          ["Cash Sales", summary.cashRevenue.toFixed(2)],
          ["Card Sales", summary.cardRevenue.toFixed(2)],
        ]
      );
    } else if (activeTab === "items") {
      if (itemSubView === "items") {
        downloadCsv(`Storeflow_Sales_By_Item_${timeRange}_${dateStr}.csv`,
          ["Product Name", "SKU", "Category", "Qty Sold", "Gross Revenue (NGN)", "Cost of Goods (NGN)", "Gross Profit (NGN)", "Margin %", "Tax Collected (NGN)"],
          itemReports.map(item => [
            item.name,
            item.sku,
            item.category,
            item.quantitySold,
            item.totalRevenue.toFixed(2),
            item.costOfGoods.toFixed(2),
            item.profit.toFixed(2),
            `${item.totalRevenue > 0 ? Math.round((item.profit / item.totalRevenue) * 100) : 0}%`,
            item.taxCollected.toFixed(2)
          ])
        );
      } else {
        downloadCsv(`Storeflow_Sales_By_Category_${timeRange}_${dateStr}.csv`,
          ["Category Name", "Products Count", "Qty Sold", "Gross Revenue (NGN)", "Cost of Goods (NGN)", "Gross Profit (NGN)", "Margin %", "Share of Sales %"],
          categoryReports.map(cat => [
            cat.name,
            cat.itemCount,
            cat.quantitySold,
            cat.totalRevenue.toFixed(2),
            cat.costOfGoods.toFixed(2),
            cat.profit.toFixed(2),
            `${cat.totalRevenue > 0 ? Math.round((cat.profit / cat.totalRevenue) * 100) : 0}%`,
            `${cat.percentageOfSales}%`
          ])
        );
      }
    } else if (activeTab === "team") {
      downloadCsv(`Storeflow_Sales_By_Staff_${timeRange}_${dateStr}.csv`,
        ["Staff Name", "Role", "Transactions Processed", "Total Revenue (NGN)", "Avg Order Value (NGN)", "Share of Revenue %"],
        staffReports.map(staff => [
          staff.cashierName,
          staff.role,
          staff.salesCount,
          staff.totalRevenue.toFixed(2),
          staff.averageOrderValue.toFixed(2),
          `${summary.netSales > 0 ? Math.round((staff.totalRevenue / summary.netSales) * 100) : 0}%`
        ])
      );
    } else if (activeTab === "receipts") {
      downloadCsv(`Storeflow_Receipts_Ledger_${timeRange}_${dateStr}.csv`,
        ["Receipt ID", "Timestamp", "Cashier", "Items Count", "Payment Method", "Subtotal (NGN)", "Discount (NGN)", "Tax (NGN)", "Total (NGN)"],
        receipts.map(r => [
          r.id,
          new Date(r.createdAt).toLocaleString("en-NG"),
          r.cashierName,
          r.itemCount,
          r.paymentMethod.toUpperCase(),
          r.subtotal.toFixed(2),
          r.discountTotal.toFixed(2),
          r.taxTotal.toFixed(2),
          r.total.toFixed(2)
        ])
      );
    } else if (activeTab === "taxes") {
      downloadCsv(`Storeflow_Taxes_and_Discounts_${timeRange}_${dateStr}.csv`,
        ["Metric", "Value"],
        [
          ["Total Tax Collected", summary.totalTax.toFixed(2)],
          ["Taxable Net Sales", summary.netSales.toFixed(2)],
          ["Effective Tax Rate", `${summary.netSales > 0 ? ((summary.totalTax / summary.netSales) * 100).toFixed(1) : "7.5"}%`],
          ["Total Discounts Applied", summary.totalDiscounts.toFixed(2)],
          ["Orders with Discounts", summary.discountedOrdersCount],
          ["Avg Discount per Offer", summary.discountedOrdersCount > 0 ? (summary.totalDiscounts / summary.discountedOrdersCount).toFixed(2) : "0.00"],
          ["Gross Revenue Forgiven %", `${summary.grossSales > 0 ? ((summary.totalDiscounts / summary.grossSales) * 100).toFixed(1) : 0}%`]
        ]
      );
    } else if (activeTab === "shifts") {
      downloadCsv(`Storeflow_Till_Shifts_ZReports_${dateStr}.csv`,
        ["Shift ID", "Register", "Cashier", "Opened At", "Closed At", "Opening Float (NGN)", "Cash Sales (NGN)", "Card Sales (NGN)", "Gross Sales (NGN)", "Cash In (NGN)", "Cash Out (NGN)", "Expected Cash (NGN)", "Actual Counted Cash (NGN)", "Variance (NGN)", "Status", "Notes"],
        filteredShifts.map(s => [
          s.id,
          s.registerName,
          s.cashierName,
          new Date(s.startedAt).toLocaleString("en-NG"),
          new Date(s.endedAt).toLocaleString("en-NG"),
          s.openingCash.toFixed(2),
          s.cashSalesTotal.toFixed(2),
          s.cardSalesTotal.toFixed(2),
          s.grossSalesTotal.toFixed(2),
          s.cashInTotal.toFixed(2),
          s.cashOutTotal.toFixed(2),
          s.expectedCash.toFixed(2),
          s.closingCash.toFixed(2),
          s.variance.toFixed(2),
          Math.abs(s.variance) < 0.01 ? "BALANCED" : s.variance > 0 ? "OVERAGE" : "SHORTAGE",
          s.notes || ""
        ])
      );
    }
  };

  // Filtered views
  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return itemReports;
    const q = itemSearch.toLowerCase();
    return itemReports.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [itemReports, itemSearch]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const matchesSearch = !receiptSearch.trim() ||
        r.id.toLowerCase().includes(receiptSearch.toLowerCase()) ||
        r.cashierName.toLowerCase().includes(receiptSearch.toLowerCase());
      const matchesMethod = receiptFilterMethod === "all" || r.paymentMethod.toLowerCase() === receiptFilterMethod;
      return matchesSearch && matchesMethod;
    });
  }, [receipts, receiptSearch, receiptFilterMethod]);

  const filteredShifts = useMemo(() => {
    if (!shiftSearch.trim()) return closedShifts;
    const q = shiftSearch.toLowerCase();
    return closedShifts.filter(s =>
      s.id.toLowerCase().includes(q) ||
      s.registerName.toLowerCase().includes(q) ||
      s.cashierName.toLowerCase().includes(q) ||
      (s.notes && s.notes.toLowerCase().includes(q))
    );
  }, [closedShifts, shiftSearch]);

  const shiftsSummary = useMemo(() => {
    let totalCount = closedShifts.length;
    let balancedCount = 0;
    let discrepancyCount = 0;
    let totalCashCounted = 0;
    let totalExpectedCash = 0;
    let netVariance = 0;

    closedShifts.forEach(s => {
      totalCashCounted += s.closingCash;
      totalExpectedCash += s.expectedCash;
      netVariance += s.variance;
      if (Math.abs(s.variance) < 0.01) {
        balancedCount++;
      } else {
        discrepancyCount++;
      }
    });

    return {
      totalCount,
      balancedCount,
      discrepancyCount,
      totalCashCounted,
      totalExpectedCash,
      netVariance,
    };
  }, [closedShifts]);

  const zReportDataForShift = useMemo<ZReportData | null>(() => {
    if (!selectedShiftForZReport) return null;
    return {
      shiftId: selectedShiftForZReport.id,
      storeName: storeSettings.businessName,
      addressLines: storeSettings.receiptAddress,
      phone: storeSettings.receiptPhone,
      tin: storeSettings.receiptTin,
      regulatoryLicense: storeSettings.receiptLicense,
      paperWidth: storeSettings.receiptPaperWidth,
      registerName: selectedShiftForZReport.registerName,
      cashierName: selectedShiftForZReport.cashierName,
      startedAt: selectedShiftForZReport.startedAt,
      endedAt: selectedShiftForZReport.endedAt,
      totalTransactions: selectedShiftForZReport.totalSalesCount,
      cashSalesTotal: selectedShiftForZReport.cashSalesTotal,
      cardSalesTotal: selectedShiftForZReport.cardSalesTotal,
      grossSalesTotal: selectedShiftForZReport.grossSalesTotal,
      openingFloat: selectedShiftForZReport.openingCash,
      cashInTotal: selectedShiftForZReport.cashInTotal,
      cashOutTotal: selectedShiftForZReport.cashOutTotal,
      movements: [],
      expectedCash: selectedShiftForZReport.expectedCash,
      actualCountedCash: selectedShiftForZReport.closingCash,
      variance: selectedShiftForZReport.variance,
      closingNotes: selectedShiftForZReport.notes,
    };
  }, [selectedShiftForZReport, storeSettings]);

  return (
    <main className="catalog-shell">
      {/* ──── Header ──── */}
      <header className="catalog-header rpt-header">
        <BackButton onClick={onBack} label="Home" />
        <div style={{ textAlign: "right" }}>
          <p className="eyebrow">REPORTS &amp; ANALYTICS</p>
          <h1>Sales Insights</h1>
        </div>
      </header>

      {/* ──── Sticky Toolbar: Sub-Tabs, Date Range & CSV Export ──── */}
      <section className="catalog-toolbar rpt-master-toolbar">
        {/* Sub-Navigation Tabs */}
        <nav className="rpt-subnav" aria-label="Reports sub-navigation">
          <button
            type="button"
            className={`rpt-subnav-btn${activeTab === "overview" ? " active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className={`rpt-subnav-btn${activeTab === "items" ? " active" : ""}`}
            onClick={() => setActiveTab("items")}
          >
            Items &amp; Categories
          </button>
          <button
            type="button"
            className={`rpt-subnav-btn${activeTab === "team" ? " active" : ""}`}
            onClick={() => setActiveTab("team")}
          >
            Team
          </button>
          <button
            type="button"
            className={`rpt-subnav-btn${activeTab === "receipts" ? " active" : ""}`}
            onClick={() => setActiveTab("receipts")}
          >
            Receipts Ledger
          </button>
          <button
            type="button"
            className={`rpt-subnav-btn${activeTab === "taxes" ? " active" : ""}`}
            onClick={() => setActiveTab("taxes")}
          >
            Taxes &amp; Discounts
          </button>
          {(storeSettings.enableCashDrawerShifts || closedShifts.length > 0) && (
            <button
              type="button"
              className={`rpt-subnav-btn${activeTab === "shifts" ? " active" : ""}`}
              onClick={() => setActiveTab("shifts")}
            >
              📋 Till Shifts (Z-Reports)
            </button>
          )}
        </nav>

        {/* Date Filter Pills + CSV Export */}
        <div className="rpt-toolbar-right">
          <div className="rpt-range-pills">
            {(["today", "week", "month", "all"] as const).map((range) => (
              <button
                key={range}
                type="button"
                className={`rpt-pill${timeRange === range ? " active" : ""}`}
                onClick={() => setTimeRange(range)}
              >
                {range === "today" ? "Today" : range === "week" ? "7 Days" : range === "month" ? "This Month" : "All Time"}
              </button>
            ))}
            {loading && <span className="rpt-pill" style={{ opacity: 0.7, pointerEvents: "none" }}>Loading…</span>}
          </div>

          <button
            type="button"
            className="rpt-export-btn"
            onClick={handleExportCsv}
            title="Download report data as CSV file"
          >
            <span className="rpt-export-icon">📥</span> Export CSV
          </button>
        </div>
      </section>

      {/* ──── Role Gate ──── */}
      {isCashier ? (
        <div className="rpt-restricted">
          <span className="rpt-restricted-icon">🔒</span>
          <h2>Owner &amp; Manager Access Only</h2>
          <p>Sales revenue, tax reporting, and profit margins are restricted to store owners and managers.</p>
        </div>
      ) : (
        <div className="rpt-body">

          {/* ══════════════════════════════════════════════════════════
              TAB 1: OVERVIEW (EXECUTIVE SUMMARY)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="rpt-tab-pane fade-in">
              {/* Top 6 KPI Cards Grid */}
              <section className="rpt-kpi-grid">
                {/* Gross Sales */}
                <article className="rpt-kpi-card">
                  <div className="rpt-kpi-icon green">₦</div>
                  <div className="rpt-kpi-content">
                    <span className="rpt-kpi-label">Gross Sales</span>
                    <strong className="rpt-kpi-value">{formatNaira(summary.grossSales)}</strong>
                    <span className="rpt-kpi-sub">Before discounts &amp; refunds</span>
                  </div>
                </article>

                {/* Net Sales */}
                <article className="rpt-kpi-card rpt-kpi-revenue">
                  <div className="rpt-kpi-icon green">★</div>
                  <div className="rpt-kpi-content">
                    <span className="rpt-kpi-label">Net Sales</span>
                    <strong className="rpt-kpi-value">{formatNaira(summary.netSales)}</strong>
                    <span className="rpt-kpi-sub">{summary.totalSalesCount} completed {summary.totalSalesCount === 1 ? "sale" : "sales"}</span>
                  </div>
                </article>

                {/* Gross Profit & Margin */}
                <article className="rpt-kpi-card rpt-kpi-profit">
                  <div className="rpt-kpi-icon emerald">↑</div>
                  <div className="rpt-kpi-content">
                    <span className="rpt-kpi-label">Est. Gross Profit</span>
                    <strong className="rpt-kpi-value">{formatNaira(summary.totalProfit)}</strong>
                    <span className="rpt-kpi-sub">{marginPercent}% margin</span>
                  </div>
                  <div className="rpt-margin-ring" aria-label={`${marginPercent}% margin`}>
                    <svg viewBox="0 0 36 36" className="rpt-ring-svg">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e1edea" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none" stroke="#2d7a46"
                        strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${marginPercent} ${100 - marginPercent}`}
                        strokeDashoffset="25"
                      />
                    </svg>
                    <span className="rpt-ring-text">{marginPercent}%</span>
                  </div>
                </article>

                {/* Average Order Value */}
                <article className="rpt-kpi-card">
                  <div className="rpt-kpi-icon blue">⌀</div>
                  <div className="rpt-kpi-content">
                    <span className="rpt-kpi-label">Average Order</span>
                    <strong className="rpt-kpi-value">{formatNaira(summary.averageOrderValue)}</strong>
                    <span className="rpt-kpi-sub">Per completed ticket</span>
                  </div>
                </article>

                {/* Discounts */}
                <article className="rpt-kpi-card">
                  <div className="rpt-kpi-icon orange">%</div>
                  <div className="rpt-kpi-content">
                    <span className="rpt-kpi-label">Total Discounts</span>
                    <strong className="rpt-kpi-value">{formatNaira(summary.totalDiscounts)}</strong>
                    <span className="rpt-kpi-sub">{summary.discountedOrdersCount} orders discounted</span>
                  </div>
                </article>

                {/* Taxes Collected */}
                <article className="rpt-kpi-card">
                  <div className="rpt-kpi-icon teal">⚖</div>
                  <div className="rpt-kpi-content">
                    <span className="rpt-kpi-label">Taxes Collected</span>
                    <strong className="rpt-kpi-value">{formatNaira(summary.totalTax)}</strong>
                    <span className="rpt-kpi-sub">7.5% Nigerian VAT</span>
                  </div>
                </article>
              </section>

              {/* Payment Split & Mini Previews */}
              <section className="rpt-details-grid">
                {/* Left: Payment Breakdown & Best Sellers Mini */}
                <div className="rpt-left-stack">
                  {/* Payment Breakdown */}
                  <article className="rpt-card rpt-kpi-payment-full">
                    <div className="rpt-card-head">
                      <div>
                        <p className="eyebrow">TILL BREAKDOWN</p>
                        <h2>Sales by Payment Type</h2>
                      </div>
                    </div>
                    <div className="rpt-pay-labels">
                      <span className="rpt-pay-label cash">
                        <span className="rpt-pay-dot cash" /> Cash: {formatNaira(summary.cashRevenue)} ({cashPercent}%)
                      </span>
                      <span className="rpt-pay-label card">
                        <span className="rpt-pay-dot card" /> Card: {formatNaira(summary.cardRevenue)} ({cardPercent}%)
                      </span>
                    </div>
                    <div className="rpt-pay-bar large">
                      <div className="rpt-pay-fill cash" style={{ width: `${cashPercent}%` }} />
                      <div className="rpt-pay-fill card" style={{ width: `${cardPercent}%` }} />
                    </div>
                  </article>

                  {/* Top 5 Products Quick Leaderboard */}
                  <article className="rpt-card rpt-bestsellers" style={{ marginTop: "20px" }}>
                    <div className="rpt-card-head">
                      <div>
                        <p className="eyebrow">TOP PERFORMERS</p>
                        <h2>Best-Selling Items</h2>
                      </div>
                      <button
                        type="button"
                        className="rpt-link-btn"
                        onClick={() => setActiveTab("items")}
                      >
                        View all items →
                      </button>
                    </div>

                    <div className="rpt-product-list">
                      {itemReports.slice(0, 5).map((product, idx) => {
                        const maxRev = itemReports[0]?.totalRevenue || 1;
                        const barWidth = Math.max(8, Math.round((product.totalRevenue / maxRev) * 100));
                        return (
                          <div className="rpt-product-row" key={product.name + idx}>
                            <span className={`rpt-rank${idx === 0 ? " gold" : idx === 1 ? " silver" : ""}`}>
                              {idx + 1}
                            </span>
                            <div className="rpt-product-info">
                              <strong>{product.name}</strong>
                              <span className="rpt-product-meta">{product.quantitySold} units · {product.category}</span>
                              <div className="rpt-product-bar-track">
                                <div className="rpt-product-bar-fill" style={{ width: `${barWidth}%` }} />
                              </div>
                            </div>
                            <div className="rpt-product-numbers">
                              <strong>{formatNaira(product.totalRevenue)}</strong>
                              <span className="rpt-profit-tag">+{formatNaira(product.profit)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                </div>

                {/* Right: Live Receipts Preview */}
                <div className="rpt-right-stack">
                  <article className="rpt-card rpt-recent">
                    <div className="rpt-card-head">
                      <div>
                        <p className="eyebrow">LIVE TRANSACTIONS</p>
                        <h2>Recent Receipts</h2>
                      </div>
                      <button
                        type="button"
                        className="rpt-link-btn"
                        onClick={() => setActiveTab("receipts")}
                      >
                        Open Ledger →
                      </button>
                    </div>
                    <div className="rpt-txn-list">
                      {receipts.slice(0, 6).map((sale) => (
                        <div
                          className="rpt-txn-row clickable"
                          key={sale.id}
                          onClick={() => setSelectedReceipt(sale)}
                          title="Click to view digital receipt"
                        >
                          <div className={`rpt-txn-method ${sale.paymentMethod}`}>
                            {sale.paymentMethod === "cash" ? "💵" : "💳"}
                          </div>
                          <div className="rpt-txn-info">
                            <strong>{sale.id}</strong>
                            <span>
                              {sale.itemCount} {sale.itemCount === 1 ? "item" : "items"} · {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="rpt-txn-amount">
                            <strong>{formatNaira(sale.total)}</strong>
                            <span className="rpt-txn-badge">{sale.paymentMethod}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: ITEMS & CATEGORIES
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "items" && (
            <div className="rpt-tab-pane fade-in">
              {/* Segmented controls & search */}
              <div className="rpt-controls-bar">
                <div className="rpt-seg-toggle">
                  <button
                    type="button"
                    className={`rpt-seg-btn${itemSubView === "items" ? " active" : ""}`}
                    onClick={() => setItemSubView("items")}
                  >
                    📦 Sales by Item
                  </button>
                  <button
                    type="button"
                    className={`rpt-seg-btn${itemSubView === "categories" ? " active" : ""}`}
                    onClick={() => setItemSubView("categories")}
                  >
                    📂 Sales by Category
                  </button>
                </div>

                <div className="rpt-controls-right">
                  <div className="rpt-chart-toggle">
                    <button
                      type="button"
                      className={`rpt-chart-btn${chartView === "bar" ? " active" : ""}`}
                      onClick={() => setChartView("bar")}
                      title="Bar chart comparison"
                    >
                      📊 Bar Chart
                    </button>
                    <button
                      type="button"
                      className={`rpt-chart-btn${chartView === "distribution" ? " active" : ""}`}
                      onClick={() => setChartView("distribution")}
                      title="Revenue share distribution"
                    >
                      🥧 Share View
                    </button>
                  </div>

                  {itemSubView === "items" && (
                    <div className="rpt-search-wrap">
                      <input
                        type="text"
                        className="rpt-search-input"
                        placeholder="Search product or SKU…"
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                      />
                      {itemSearch && (
                        <button type="button" className="rpt-search-clear" onClick={() => setItemSearch("")}>×</button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Chart Visualization Section */}
              {chartView === "distribution" && (
                <div className="rpt-card rpt-chart-card">
                  <div className="rpt-card-head">
                    <div>
                      <p className="eyebrow">REVENUE DISTRIBUTION</p>
                      <h2>{itemSubView === "items" ? "Product Revenue Share" : "Category Revenue Share"}</h2>
                    </div>
                  </div>

                  {/* Multi-color segment bar */}
                  <div className="rpt-dist-bar">
                    {(itemSubView === "items" ? itemReports.slice(0, 5) : categoryReports).map((entry, idx) => {
                      const totalRev = summary.netSales || 1;
                      const share = Math.round((entry.totalRevenue / totalRev) * 100);
                      const colors = ["#168379", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];
                      const color = colors[idx % colors.length];
                      return (
                        <div
                          key={entry.name}
                          className="rpt-dist-seg"
                          style={{ width: `${Math.max(4, share)}%`, background: color }}
                          title={`${entry.name}: ${formatNaira(entry.totalRevenue)} (${share}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="rpt-dist-legend">
                    {(itemSubView === "items" ? itemReports.slice(0, 5) : categoryReports).map((entry, idx) => {
                      const totalRev = summary.netSales || 1;
                      const share = Math.round((entry.totalRevenue / totalRev) * 100);
                      const colors = ["#168379", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];
                      return (
                        <div className="rpt-dist-legend-item" key={entry.name}>
                          <span className="rpt-dist-dot" style={{ background: colors[idx % colors.length] }} />
                          <span className="rpt-dist-name">{entry.name}</span>
                          <strong className="rpt-dist-val">{share}%</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Data Table: Items */}
              {itemSubView === "items" ? (
                <div className="rpt-card rpt-table-card">
                  <div className="rpt-card-head">
                    <div>
                      <p className="eyebrow">FULL CATALOG PERFORMANCE</p>
                      <h2>Product Sales &amp; Margin Ledger ({filteredItems.length} items)</h2>
                    </div>
                  </div>

                  {filteredItems.length === 0 ? (
                    <p className="rpt-empty-msg">No products matching &ldquo;{itemSearch}&rdquo;</p>
                  ) : (
                    <div className="rpt-table-responsive">
                      <table className="rpt-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th style={{ textAlign: "right" }}>Qty Sold</th>
                            <th style={{ textAlign: "right" }}>Gross Sales</th>
                            <th style={{ textAlign: "right" }}>COGS (Cost)</th>
                            <th style={{ textAlign: "right" }}>Gross Profit</th>
                            <th style={{ textAlign: "right" }}>Margin %</th>
                            <th style={{ textAlign: "right" }}>Tax (VAT)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map((item, idx) => {
                            const margin = item.totalRevenue > 0 ? Math.round((item.profit / item.totalRevenue) * 100) : 0;
                            return (
                              <tr key={item.name + idx}>
                                <td className="rpt-cell-muted">{idx + 1}</td>
                                <td><strong>{item.name}</strong></td>
                                <td className="rpt-cell-muted">{item.sku}</td>
                                <td><span className="rpt-tag">{item.category}</span></td>
                                <td style={{ textAlign: "right" }}><strong>{item.quantitySold}</strong></td>
                                <td style={{ textAlign: "right" }}>{formatNaira(item.totalRevenue)}</td>
                                <td style={{ textAlign: "right", color: "#8a9da4" }}>{formatNaira(item.costOfGoods)}</td>
                                <td style={{ textAlign: "right", color: "#2d7a46", fontWeight: 700 }}>+{formatNaira(item.profit)}</td>
                                <td style={{ textAlign: "right" }}>
                                  <span className={`rpt-margin-badge ${margin >= 40 ? "high" : margin >= 20 ? "mid" : "low"}`}>
                                    {margin}%
                                  </span>
                                </td>
                                <td style={{ textAlign: "right", color: "#546e7a" }}>{formatNaira(item.taxCollected)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* Data Table: Categories */
                <div className="rpt-card rpt-table-card">
                  <div className="rpt-card-head">
                    <div>
                      <p className="eyebrow">CATEGORY BREAKDOWN</p>
                      <h2>Performance by Category ({categoryReports.length} categories)</h2>
                    </div>
                  </div>

                  <div className="rpt-table-responsive">
                    <table className="rpt-table">
                      <thead>
                        <tr>
                          <th>Category Name</th>
                          <th style={{ textAlign: "right" }}>Products Active</th>
                          <th style={{ textAlign: "right" }}>Units Sold</th>
                          <th style={{ textAlign: "right" }}>Gross Revenue</th>
                          <th style={{ textAlign: "right" }}>Cost of Goods</th>
                          <th style={{ textAlign: "right" }}>Gross Profit</th>
                          <th style={{ textAlign: "right" }}>Margin %</th>
                          <th style={{ textAlign: "right" }}>Revenue Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryReports.map((cat) => {
                          const margin = cat.totalRevenue > 0 ? Math.round((cat.profit / cat.totalRevenue) * 100) : 0;
                          return (
                            <tr key={cat.name}>
                              <td><strong>{cat.name}</strong></td>
                              <td style={{ textAlign: "right" }}>{cat.itemCount}</td>
                              <td style={{ textAlign: "right" }}><strong>{cat.quantitySold}</strong></td>
                              <td style={{ textAlign: "right" }}>{formatNaira(cat.totalRevenue)}</td>
                              <td style={{ textAlign: "right", color: "#8a9da4" }}>{formatNaira(cat.costOfGoods)}</td>
                              <td style={{ textAlign: "right", color: "#2d7a46", fontWeight: 700 }}>+{formatNaira(cat.profit)}</td>
                              <td style={{ textAlign: "right" }}>
                                <span className={`rpt-margin-badge ${margin >= 40 ? "high" : "mid"}`}>
                                  {margin}%
                                </span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <strong>{cat.percentageOfSales}%</strong>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modifier Ready Note */}
              <div className="rpt-info-banner">
                <span className="rpt-info-icon">💡</span>
                <div>
                  <strong>Looking for Sales by Modifier?</strong>
                  <p>Custom add-ons and order modifiers (e.g. extra shots, special syrups, custom toppings) will automatically populate a dedicated Modifier Breakdown here as soon as item modifiers are enabled in your catalog settings.</p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: TEAM PERFORMANCE (SALES BY EMPLOYEE)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "team" && (
            <div className="rpt-tab-pane fade-in">
              <div className="rpt-card rpt-staff-full">
                <div className="rpt-card-head">
                  <div>
                    <p className="eyebrow">STAFF PRODUCTIVITY</p>
                    <h2>Sales Generated by Employee</h2>
                  </div>
                </div>

                <div className="rpt-staff-grid">
                  {staffReports.map((staff, idx) => {
                    const maxStaffRev = staffReports[0]?.totalRevenue || 1;
                    const staffBar = Math.max(12, Math.round((staff.totalRevenue / maxStaffRev) * 100));
                    const shareOfStore = summary.netSales > 0 ? Math.round((staff.totalRevenue / summary.netSales) * 100) : 0;
                    return (
                      <article className="rpt-staff-card" key={staff.cashierId}>
                        <div className="rpt-staff-card-header">
                          <div className="rpt-staff-avatar large">{staff.cashierName.slice(0, 2).toUpperCase()}</div>
                          <div>
                            <strong>{staff.cashierName}</strong>
                            <span className="rpt-tag role">{staff.role}</span>
                          </div>
                          <div className="rpt-staff-rank">#{idx + 1}</div>
                        </div>

                        <div className="rpt-staff-metrics">
                          <div className="rpt-staff-metric">
                            <span className="rpt-staff-metric-label">Revenue</span>
                            <strong className="rpt-staff-metric-val">{formatNaira(staff.totalRevenue)}</strong>
                          </div>
                          <div className="rpt-staff-metric">
                            <span className="rpt-staff-metric-label">Tickets</span>
                            <strong className="rpt-staff-metric-val">{staff.salesCount}</strong>
                          </div>
                          <div className="rpt-staff-metric">
                            <span className="rpt-staff-metric-label">Avg Order</span>
                            <strong className="rpt-staff-metric-val">{formatNaira(staff.averageOrderValue)}</strong>
                          </div>
                        </div>

                        <div className="rpt-staff-bar-wrap">
                          <div className="rpt-staff-bar-labels">
                            <span>Contribution</span>
                            <span>{shareOfStore}% of store sales</span>
                          </div>
                          <div className="rpt-staff-bar-track">
                            <div className="rpt-staff-bar-fill" style={{ width: `${staffBar}%` }} />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4: RECEIPTS LEDGER
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "receipts" && (
            <div className="rpt-tab-pane fade-in">
              <div className="rpt-card rpt-table-card">
                <div className="rpt-card-head">
                  <div>
                    <p className="eyebrow">DIGITAL TRANSACTION LEDGER</p>
                    <h2>Receipts &amp; Tickets Audit ({filteredReceipts.length} transactions)</h2>
                  </div>

                  {/* Filter & Search */}
                  <div className="rpt-ledger-filters">
                    <input
                      type="text"
                      className="rpt-search-input"
                      placeholder="Search receipt ID or staff…"
                      value={receiptSearch}
                      onChange={(e) => setReceiptSearch(e.target.value)}
                    />
                    <select
                      className="rpt-select"
                      value={receiptFilterMethod}
                      onChange={(e) => setReceiptFilterMethod(e.target.value as any)}
                    >
                      <option value="all">All Payment Modes</option>
                      <option value="cash">Cash Only</option>
                      <option value="card">Card (POS) Only</option>
                    </select>
                  </div>
                </div>

                {filteredReceipts.length === 0 ? (
                  <p className="rpt-empty-msg">No receipts match your search filters.</p>
                ) : (
                  <div className="rpt-table-responsive">
                    <table className="rpt-table clickable-rows">
                      <thead>
                        <tr>
                          <th>Receipt ID</th>
                          <th>Date &amp; Time</th>
                          <th>Cashier</th>
                          <th>Items</th>
                          <th>Payment Mode</th>
                          <th style={{ textAlign: "right" }}>Subtotal</th>
                          <th style={{ textAlign: "right" }}>Discount</th>
                          <th style={{ textAlign: "right" }}>Tax (VAT)</th>
                          <th style={{ textAlign: "right" }}>Total Paid</th>
                          <th style={{ textAlign: "center" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReceipts.map((r) => (
                          <tr key={r.id} onClick={() => setSelectedReceipt(r)}>
                            <td><strong className="rpt-ticket-code">{r.id}</strong></td>
                            <td className="rpt-cell-muted">
                              {new Date(r.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })} · {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td>{r.cashierName}</td>
                            <td>{r.itemCount} items</td>
                            <td>
                              <span className={`rpt-tag method ${r.paymentMethod}`}>
                                {r.paymentMethod === "cash" ? "💵 Cash" : "💳 Card"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>{formatNaira(r.subtotal)}</td>
                            <td style={{ textAlign: "right", color: r.discountTotal > 0 ? "#e65100" : "#8a9da4" }}>
                              {r.discountTotal > 0 ? `-${formatNaira(r.discountTotal)}` : "—"}
                            </td>
                            <td style={{ textAlign: "right", color: "#546e7a" }}>{formatNaira(r.taxTotal)}</td>
                            <td style={{ textAlign: "right" }}><strong className="rpt-total-bold">{formatNaira(r.total)}</strong></td>
                            <td style={{ textAlign: "center" }}>
                              <button type="button" className="rpt-view-btn" onClick={(e) => { e.stopPropagation(); setSelectedReceipt(r); }}>
                                View Ticket
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 5: TAXES & DISCOUNTS
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "taxes" && (
            <div className="rpt-tab-pane fade-in">
              <div className="rpt-taxes-grid">
                {/* Tax Compliance Card */}
                <article className="rpt-card">
                  <div className="rpt-card-head">
                    <div>
                      <p className="eyebrow">REGULATORY &amp; COMPLIANCE</p>
                      <h2>Tax Collection Breakdown</h2>
                    </div>
                  </div>

                  <div className="rpt-kpi-stack">
                    <div className="rpt-kpi-row">
                      <span>Total Value Added Tax (VAT) Collected:</span>
                      <strong style={{ color: "#168379", fontSize: "20px" }}>{formatNaira(summary.totalTax)}</strong>
                    </div>
                    <div className="rpt-kpi-row">
                      <span>Taxable Net Sales Volume:</span>
                      <strong>{formatNaira(summary.netSales)}</strong>
                    </div>
                    <div className="rpt-kpi-row">
                      <span>Standard Nigerian VAT Rate:</span>
                      <strong className="rpt-tag teal">7.5%</strong>
                    </div>
                  </div>

                  <p className="rpt-card-note">
                    VAT amounts are calculated on taxable line items during checkout and stored per transaction for audit readiness.
                  </p>
                </article>

                {/* Discounts Card */}
                <article className="rpt-card">
                  <div className="rpt-card-head">
                    <div>
                      <p className="eyebrow">PROMOTIONS &amp; VOUCHERS</p>
                      <h2>Discount Financial Impact</h2>
                    </div>
                  </div>

                  <div className="rpt-kpi-stack">
                    <div className="rpt-kpi-row">
                      <span>Total Discount Amount Forgiven:</span>
                      <strong style={{ color: "#d97706", fontSize: "20px" }}>{formatNaira(summary.totalDiscounts)}</strong>
                    </div>
                    <div className="rpt-kpi-row">
                      <span>Discounted Checkouts:</span>
                      <strong>{summary.discountedOrdersCount} of {summary.totalSalesCount} sales</strong>
                    </div>
                    <div className="rpt-kpi-row">
                      <span>Discount Loss vs Gross Sales:</span>
                      <strong style={{ color: "#dc2626" }}>
                        {summary.grossSales > 0 ? ((summary.totalDiscounts / summary.grossSales) * 100).toFixed(1) : 0}%
                      </strong>
                    </div>
                  </div>

                  <p className="rpt-card-note">
                    Monitors store discounts granted by cashiers or managers during checkout to prevent margin leakage.
                  </p>
                </article>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 6: TILL SHIFTS & RECONCILIATION (Z-REPORTS)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === "shifts" && (
            <div className="rpt-tab-pane fade-in">
              {!storeSettings.enableCashDrawerShifts && (
                <div style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  fontSize: "12px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <span>ℹ️</span>
                  <span>
                    Till shift tracking &amp; Z-reports are currently <strong>disabled</strong> in Store Settings. Showing historical shift records.
                  </span>
                </div>
              )}
              {/* Shifts KPI Grid */}
              <div className="rpt-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <article className="rpt-kpi-card">
                  <div className="rpt-kpi-icon blue">📋</div>
                  <div className="rpt-kpi-content">
                    <p className="rpt-kpi-label">Completed Till Shifts</p>
                    <p className="rpt-kpi-value">{shiftsSummary.totalCount}</p>
                    <p className="rpt-kpi-sub">Across all station registers</p>
                  </div>
                </article>

                <article className="rpt-kpi-card">
                  <div className="rpt-kpi-icon emerald">💵</div>
                  <div className="rpt-kpi-content">
                    <p className="rpt-kpi-label">Total Counted Cash</p>
                    <p className="rpt-kpi-value" style={{ color: "#2d7a46" }}>{formatNaira(shiftsSummary.totalCashCounted)}</p>
                    <p className="rpt-kpi-sub">Physical notes &amp; coins audited</p>
                  </div>
                </article>

                <article className="rpt-kpi-card">
                  <div className="rpt-kpi-icon teal">🛡️</div>
                  <div className="rpt-kpi-content">
                    <p className="rpt-kpi-label">Till Balancing Integrity</p>
                    <p className="rpt-kpi-value">
                      {shiftsSummary.balancedCount} <small style={{ fontSize: "14px", color: "#546e7a", fontWeight: "normal" }}>/ {shiftsSummary.totalCount} balanced</small>
                    </p>
                    <p className="rpt-kpi-sub">
                      <span className={`rpt-tag ${shiftsSummary.discrepancyCount === 0 ? "success" : "warning"}`} style={{ fontSize: "11px", padding: "1px 6px" }}>
                        {shiftsSummary.totalCount > 0 ? `${Math.round((shiftsSummary.balancedCount / shiftsSummary.totalCount) * 100)}% Balanced` : "No Shifts"}
                      </span>
                    </p>
                  </div>
                </article>

                <article className="rpt-kpi-card">
                  <div className={`rpt-kpi-icon ${Math.abs(shiftsSummary.netVariance) < 0.01 ? "green" : shiftsSummary.netVariance > 0 ? "orange" : "red"}`}>
                    ⚖️
                  </div>
                  <div className="rpt-kpi-content">
                    <p className="rpt-kpi-label">Net Till Discrepancy</p>
                    <p className="rpt-kpi-value" style={{
                      color: Math.abs(shiftsSummary.netVariance) < 0.01 ? "#168379" : shiftsSummary.netVariance > 0 ? "#d97706" : "#dc2626"
                    }}>
                      {shiftsSummary.netVariance >= 0 ? "+" : ""}{formatNaira(shiftsSummary.netVariance)}
                    </p>
                    <p className="rpt-kpi-sub">
                      {Math.abs(shiftsSummary.netVariance) < 0.01
                        ? "100% Perfectly balanced"
                        : shiftsSummary.netVariance > 0
                        ? "Net cash overage"
                        : "Net cash shortage"}
                    </p>
                  </div>
                </article>
              </div>

              {/* Shifts Table Card */}
              <div className="rpt-table-card" style={{ marginTop: "24px" }}>
                <div className="rpt-table-head">
                  <div>
                    <p className="eyebrow">AUDIT TRAIL &amp; CASH LEDGER</p>
                    <h2>Register Shifts &amp; Z-Reports</h2>
                  </div>
                  <div className="rpt-table-actions">
                    <div className="rpt-search-wrap">
                      <span className="rpt-search-icon">🔍</span>
                      <input
                        type="search"
                        className="rpt-search-input"
                        placeholder="Filter by cashier, register, or notes..."
                        value={shiftSearch}
                        onChange={(e) => setShiftSearch(e.target.value)}
                        aria-label="Filter shifts"
                      />
                    </div>
                  </div>
                </div>

                {filteredShifts.length === 0 ? (
                  <div className="rpt-empty-state">
                    <p>No till shifts found matching &ldquo;{shiftSearch}&rdquo;.</p>
                  </div>
                ) : (
                  <div className="rpt-table-scroll">
                    <table className="rpt-table">
                      <thead>
                        <tr>
                          <th>Register &amp; Shift ID</th>
                          <th>Cashier</th>
                          <th>Duration</th>
                          <th style={{ textAlign: "right" }}>Opening Float</th>
                          <th style={{ textAlign: "right" }}>Cash Sales</th>
                          <th style={{ textAlign: "right" }}>Expected Cash</th>
                          <th style={{ textAlign: "right" }}>Counted Cash</th>
                          <th style={{ textAlign: "center" }}>Reconciliation</th>
                          <th style={{ textAlign: "center" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredShifts.map((s) => (
                          <tr key={s.id} onClick={() => setSelectedShiftForZReport(s)} style={{ cursor: "pointer" }}>
                            <td>
                              <strong>{s.registerName}</strong>
                              <span style={{ display: "block", fontSize: "11px", color: "#8a9da4", fontFamily: "monospace" }}>
                                #{s.id.slice(0, 10)}
                              </span>
                            </td>
                            <td>{s.cashierName}</td>
                            <td className="rpt-cell-muted">
                              <div>{new Date(s.startedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</div>
                              <span style={{ fontSize: "11px" }}>
                                {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(s.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>{formatNaira(s.openingCash)}</td>
                            <td style={{ textAlign: "right" }}>{formatNaira(s.cashSalesTotal)}</td>
                            <td style={{ textAlign: "right", color: "#546e7a" }}>{formatNaira(s.expectedCash)}</td>
                            <td style={{ textAlign: "right" }}>
                              <strong className="rpt-total-bold">{formatNaira(s.closingCash)}</strong>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {Math.abs(s.variance) < 0.01 ? (
                                <span className="rpt-tag success">Balanced (₦0.00)</span>
                              ) : s.variance > 0 ? (
                                <span className="rpt-tag" style={{ background: "#fef3c7", color: "#b45309" }}>
                                  +{formatNaira(s.variance)} Overage
                                </span>
                              ) : (
                                <span className="rpt-tag danger">
                                  -{formatNaira(Math.abs(s.variance))} Shortage
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                className="rpt-view-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedShiftForZReport(s);
                                }}
                              >
                                📄 View Z-Report
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SLIDE-OVER RECEIPT DETAIL DRAWER / MODAL
         ══════════════════════════════════════════════════════════ */}
      {selectedReceipt && (
        <div className="rpt-drawer-backdrop" role="presentation" onClick={() => setSelectedReceipt(null)}>
          <aside className="rpt-drawer" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <header className="rpt-drawer-header">
              <div>
                <p className="eyebrow">TRANSACTION INSPECTOR</p>
                <h2>Receipt {selectedReceipt.id}</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setSelectedReceipt(null)}
                aria-label="Close"
              >
                ×
              </button>
            </header>

            <div className="rpt-drawer-body">
              {/* Meta bar */}
              <div className="rpt-drawer-meta">
                <div>
                  <span className="rpt-drawer-meta-label">Date &amp; Time</span>
                  <strong>{new Date(selectedReceipt.createdAt).toLocaleString("en-NG")}</strong>
                </div>
                <div>
                  <span className="rpt-drawer-meta-label">Processed By</span>
                  <strong>{selectedReceipt.cashierName}</strong>
                </div>
                <div>
                  <span className="rpt-drawer-meta-label">Status</span>
                  <span className="rpt-tag success">Completed</span>
                </div>
              </div>

              {/* Printable Receipt Paper Container */}
              <div className="receipt-paper" style={{ margin: "16px 0", boxShadow: "none", border: "1px solid #e2e9ed" }}>
                <header className="receipt-store">
                  <strong>STOREFLOW RECEIPT</strong>
                  <span>Ticket #{selectedReceipt.id}</span>
                  <span>Cashier: {selectedReceipt.cashierName}</span>
                </header>

                <div className="receipt-rule" />

                <div className="receipt-item-list">
                  {selectedReceipt.items.map((item, idx) => (
                    <div className="receipt-item" key={item.name + idx}>
                      <span>{item.quantity}x {item.name}</span>
                      <strong>₦{item.lineTotal.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>

                <div className="receipt-rule" />

                <div className="receipt-total-line">
                  <span>SUBTOTAL:</span>
                  <strong>₦{selectedReceipt.subtotal.toFixed(2)}</strong>
                </div>

                {selectedReceipt.discountTotal > 0 && (
                  <div className="receipt-total-line receipt-discount-line">
                    <span>DISCOUNT:</span>
                    <strong>-₦{selectedReceipt.discountTotal.toFixed(2)}</strong>
                  </div>
                )}

                <div className="receipt-total-line">
                  <span>VAT (7.5%):</span>
                  <strong>₦{selectedReceipt.taxTotal.toFixed(2)}</strong>
                </div>

                <div className="receipt-rule" />

                <div className="receipt-total-line receipt-grand-total">
                  <span>TOTAL PAID:</span>
                  <strong>₦{selectedReceipt.total.toFixed(2)}</strong>
                </div>

                <div className="receipt-rule" />

                <div className="receipt-meta">
                  <span>Payment Mode: {selectedReceipt.paymentMethod.toUpperCase()}</span>
                  {selectedReceipt.paymentMethod === "cash" && (
                    <>
                      <span>Cash Received: ₦{selectedReceipt.tenderedAmount.toFixed(2)}</span>
                      <span>Change: ₦{selectedReceipt.changeAmount.toFixed(2)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="rpt-drawer-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => window.print()}
                >
                  🖨️ Re-print Receipt
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setSelectedReceipt(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          Z-REPORT AUDIT PREVIEW MODAL
         ══════════════════════════════════════════════════════════ */}
      {zReportDataForShift && (
        <ZReportPreview
          data={zReportDataForShift}
          onClose={() => setSelectedShiftForZReport(null)}
        />
      )}
    </main>
  );
}

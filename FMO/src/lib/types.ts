export type SuitCategory = 
  | 'double-breasted'
  | 'three-piece'
  | 'jodhpuri'
  | 'two-piece'
  | 'wrap'
  | 'wedding-tuxedo'
  | 'accessories';

export interface Category {
  id: SuitCategory;
  name: string;
  tagline: string;
  itemCount: number;
  icon: string;
}

export type ColorFamily = 
  | 'all'
  | 'navy'
  | 'burgundy'
  | 'oxblood'
  | 'purple'
  | 'ash-grey'
  | 'emerald-green'
  | 'army-green'
  | 'milk-cream'
  | 'black'
  | 'brown'
  | 'royal-blue'
  | 'light-blue'
  | 'camel-tan'
  | 'orange'
  | 'pink-black';

export interface ProductVariant {
  id: string;
  productId: string;
  colorName: string;
  colorHex: string;
  colorFamily: ColorFamily;
  size: string; // e.g. "38R", "40R", "42R", "44R", "46R", "48R", "Custom Bespoke"
  sku: string;
  barcode: string;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  rentalPrice: number;
}

export interface Product {
  id: string;
  categoryId: SuitCategory;
  name: string;
  visualDetails: string;
  basePrice: number;
  rentalPrice: number;
  fabric: string;
  silhouette: string;
  colorFamily: ColorFamily;
  primaryColorHex: string;
  availableColors: { name: string; hex: string; family: ColorFamily }[];
  variants: ProductVariant[];
  featured?: boolean;
}

export interface ClientMeasurements {
  chest?: string;
  waist?: string;
  inseam?: string;
  sleeve?: string;
  shoulder?: string;
  neck?: string;
  trouserLength?: string;
  notes?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  type: 'sale' | 'rental';
  rentalReturnDate?: string;
  requiresAlteration: boolean;
  alterationNotes?: string;
  measurements?: ClientMeasurements;
  unitPrice: number;
}

export type PaymentMethod = 
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'paypal'
  | 'bank_check'
  | 'other';

export type OrderStatus = 
  | 'completed'
  | 'deposit_held'
  | 'fitting_ready'
  | 'picked_up'
  | 'rental_active'
  | 'rental_returned';

export interface Sale {
  id: string;
  receiptNumber: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  depositAmount: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  cashierName: string;
  registerName: string;
  requiresAlterations: boolean;
}

export interface Shift {
  id: string;
  registerId: string;
  registerName: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  openingFloat: number;
  closingCashActual?: number;
  expectedCash: number;
  totalSalesCount: number;
  totalGrossSales: number;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  otherSales: number;
  status: 'open' | 'closed';
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  phone: string;
  instagram: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  vatEnabled: boolean;
  vatRate: number; // 0.075 for 7.5%
  enableDrawerShifts: boolean; // toggle for Z-Reports & drawer shifts
  openingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
}

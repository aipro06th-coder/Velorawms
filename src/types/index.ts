import type { ReactNode } from 'react';

// ==========================================
// Authentication & User Types
// ==========================================
export interface AuthUserMetadata {
  full_name?: string;
  role?: string;
  [key: string]: any;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: AuthUserMetadata;
  [key: string]: any;
}

// ==========================================
// Product & Inventory Types
// ==========================================
export interface Product {
  id: string;
  name: string;
  category: string;
  status: 'Active' | 'Inactive' | 'Discontinued' | string;
}

export interface ProductSizePreset {
  name: string;
  bottlesPerCarton: number | string;
  purchasePrice: number | string;
  sellingPrice: number | string;
  minStock: number | string;
}

export interface ProductCategory {
  label: string;
  sizes: ProductSizePreset[];
}

export interface ProductSize {
  id: string | number;
  product_id: string;
  product_name?: string;
  category?: string;
  size?: string;
  size_name?: string;
  name?: string;
  bottles_per_carton?: number;
  bottlesPerCarton?: number;
  purchase_price?: number;
  selling_price?: number;
  purchasePrice?: number | string;
  sellingPrice?: number | string;
  minimum_stock?: number;
  minStock?: number | string;
  reorder_level?: number;
  available_bottles?: number;
  bottle_quantity?: number;
  cartons?: number;
  carton_quantity?: number;
  sticker_quantity?: number;
  stickers?: number;
  damaged_bottles?: number;
  damaged_cartons?: number;
  damaged_stickers?: number;
  total_sold?: number;
  total_returned?: number;
  pallet_location?: string;
  status?: string;
  [key: string]: any;
}

// ==========================================
// Empty Cartons Types
// ==========================================
export interface EmptyCarton {
  id: string;
  name: string;
  category: string;
  size: string;
  bottle_capacity: number;
  quantity: number;
  damaged_quantity: number;
  minimum_stock: number;
  purchase_price: number;
  supplier: string;
  spec: string;
  status: string;
  [key: string]: any;
}

// ==========================================
// Raw Materials Types
// ==========================================
export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  current_liters?: number;
  bori_count?: number;
  loose_kg?: number;
  kg_per_bori?: number;
  weight_per_bori_kg?: number;
  quantity: number;
  purchase_price: number;
  minimum_stock: number;
  unit_price?: number;
  status?: string;
  [key: string]: any;
}

// ==========================================
// Stickers & Labels Types
// ==========================================
export interface StickerItem {
  id: string | number;
  name: string;
  category?: string;
  size?: string;
  unit?: string;
  quantity: number;
  damaged_quantity: number;
  purchase_price: number;
  minimum_stock: number;
  supplier?: string;
  status?: string;
  product_name?: string;
  [key: string]: any;
}

// ==========================================
// Suppliers Types
// ==========================================
export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  material_supplied?: string;
  rating?: number;
  [key: string]: any;
}

// ==========================================
// Transactions & Audit Ledger Types
// ==========================================
export interface InventoryTransaction {
  id: string;
  transaction_type: 'Stock In' | 'Stock Out' | 'Adjustment' | 'Damage' | 'Return' | string;
  item_type: 'Finished Product' | 'Raw Material' | 'Stickers' | 'Empty Cartons' | string;
  item_name: string;
  size_name?: string;
  quantity: number;
  unit: string;
  reference_no?: string;
  notes?: string;
  performed_by?: string;
  created_at?: string;
  [key: string]: any;
}

// ==========================================
// Gate Pass Types
// ==========================================
export interface GatePassItem {
  sizeId: string | number;
  cartonQuantity: number;
  productName?: string;
  sizeName?: string;
  bottlesPerCarton?: number;
  totalBottles?: number;
  [key: string]: any;
}

export interface GatePass {
  id: string;
  gatePassNo: string;
  date: string;
  time: string;
  customerName: string;
  destination: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  securityGuard: string;
  notes?: string;
  items: GatePassItem[];
  status?: 'Pending' | 'Dispatched' | 'Completed' | string;
  totalCartons?: number;
  totalBottles?: number;
  [key: string]: any;
}

// ==========================================
// Component Props Types
// ==========================================
export interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export interface BottlesInventoryProps {
  productSizes?: ProductSize[];
  products?: Product[];
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  categoryFilter?: string;
  setCategoryFilter?: (filter: string) => void;
  sizeFilter?: string;
  setSizeFilter?: (size: string) => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  onStockIn?: (itemType: string, sizeId?: string | number) => void;
  onStockOut?: (itemType: string, sizeId?: string | number) => void;
  onNewProduct?: () => void;
  onEditSize?: (size: ProductSize) => void;
  onDeleteSize?: (sizeId: string | number) => void;
  onClearAllData?: () => void;
  onExportCSV?: () => void;
  showToast?: (msg: string) => void;
}

export interface EmptyCartonsInventoryProps {
  emptyCartons?: EmptyCarton[];
  setEmptyCartons?: React.Dispatch<React.SetStateAction<EmptyCarton[]>>;
  onStockIn?: (carton: EmptyCarton, qty: number, meta?: any) => void;
  onStockOut?: (carton: EmptyCarton, qty: number, meta?: any) => void;
  onAdjust?: (carton: EmptyCarton, newQty: number, reason?: string) => void;
  onDamage?: (carton: EmptyCarton, dmgQty: number, reason?: string) => void;
  onAddNewCarton?: (carton: EmptyCarton) => void;
  onDeleteCarton?: (carton: EmptyCarton) => void;
  showToast?: (msg: string) => void;
}

export interface FilledCartonsInventoryProps {
  productSizes?: ProductSize[];
  products?: Product[];
  onPackCartons?: (targetSize: ProductSize, cartonsToAdd: number, meta?: any) => Promise<any> | void;
  onDispatchCartons?: (targetSize: ProductSize, cartonsToSub: number, meta?: any) => Promise<any> | void;
  onAdjustCartons?: (targetSize: ProductSize, newCartonCount: number, reason?: string) => Promise<any> | void;
  onOpenAddProduct?: () => void;
  onOpenGatePass?: () => void;
  showToast?: (msg: string) => void;
}

export interface GatePassManagerProps {
  productSizes?: ProductSize[];
  gatePasses?: GatePass[];
  setGatePasses?: React.Dispatch<React.SetStateAction<GatePass[]>>;
  onIssueGatePass?: (gp: GatePass) => Promise<any> | void;
  onDeleteGatePass?: (gp: GatePass) => void;
  currentUser?: AuthUser | null;
  showToast?: (msg: string) => void;
}

export interface LabelsInventoryProps {
  stickers?: StickerItem[];
  productSizes?: ProductSize[];
  products?: Product[];
  onStockIn?: (itemType: string, stickerId?: string | number) => void;
  onStockOut?: (itemType: string, stickerId?: string | number) => void;
  onAddNewSticker?: () => void;
  onAdjustStickers?: () => void;
  onDamageStickers?: () => void;
  onDeleteSticker?: (stickerId: string | number) => void;
  showToast?: (msg: string) => void;
}

export interface RawMaterialsInventoryProps {
  rawMaterials?: RawMaterial[];
  onStockIn?: (itemType: string, rawId?: string) => void;
  onStockOut?: (itemType: string, rawId?: string) => void;
  onAddNewMaterial?: () => void;
  onDeleteRawMaterial?: (rawId: string) => void;
  showToast?: (msg: string) => void;
}

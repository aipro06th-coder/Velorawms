'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Boxes,
  Database,
  Search,
  Plus,
  Minus,
  SlidersHorizontal,
  AlertTriangle,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  AlertOctagon,
  TrendingUp,
  Tag,
  Layers,
  FlaskConical,
  ExternalLink,
  Copy,
  Check,
  Building,
  RefreshCw,
  Menu,
  X,
  Pencil,
  Trash2,
  LogOut,
  User
} from 'lucide-react';

import { getSupabase, testSupabaseConnection, signOutUser, getAuthSession, onAuthChange } from '../lib/supabase';
import AuthScreen from '../components/AuthScreen';
import FilledCartonsInventory from '../components/FilledCartonsInventory';



// Predefined Categories & Default Size Presets
export const PRODUCT_CATEGORIES = [
  {
    label: 'Sweep / Toilet Cleaner (600ml & 1.2 Liter)',
    sizes: [
      { name: 'Sweep 600ml Bottle', bottlesPerCarton: 12, purchasePrice: '', sellingPrice: '', minStock: '' },
      { name: 'Toilet 1.2 Liter Bottle', bottlesPerCarton: 6, purchasePrice: '', sellingPrice: '', minStock: '' }
    ]
  },
  {
    label: 'Dishwash Bottle (250ml, 500ml, 1L & 4.5L)',
    sizes: [
      { name: 'Dishwash 250ml Bottle', bottlesPerCarton: 24, purchasePrice: '', sellingPrice: '', minStock: '' },
      { name: 'Dishwash 500ml Bottle', bottlesPerCarton: 16, purchasePrice: '', sellingPrice: '', minStock: '' },
      { name: 'Dishwash 1 Liter Bottle', bottlesPerCarton: 15, purchasePrice: '', sellingPrice: '', minStock: '' },
      { name: 'Dishwash 4.5 Liter Can', bottlesPerCarton: 4, purchasePrice: '', sellingPrice: '', minStock: '' }
    ]
  },
  {
    label: 'Bleach Bottle (600ml)',
    sizes: [
      { name: 'Bleach 600ml Bottle', bottlesPerCarton: 12, purchasePrice: '', sellingPrice: '', minStock: '' }
    ]
  },
  {
    label: 'Harpic Bottles (600ml & 1000ml)',
    sizes: [
      { name: 'Harpic 500ml Bottle', bottlesPerCarton: 14, purchasePrice: '', sellingPrice: '', minStock: '' },
      { name: 'Harpic 1000ml Bottle', bottlesPerCarton: 14, purchasePrice: '', sellingPrice: '', minStock: '' }
    ]
  },
  {
    label: 'Custom Category...',
    sizes: [
      { name: 'Small Bottle', bottlesPerCarton: '', purchasePrice: '', sellingPrice: '', minStock: '' },
      { name: 'Medium Bottle', bottlesPerCarton: '', purchasePrice: '', sellingPrice: '', minStock: '' },
      { name: 'Large Bottle', bottlesPerCarton: '', purchasePrice: '', sellingPrice: '', minStock: '' }
    ]
  }
];

// Helper to determine bottles per carton based on exact packaging ratios:
// - Sweep 600ml: 12 bottles/ctn
// - Sweep 1.2L: 6 bottles/ctn
// - Dishwash 500ml: 16 bottles/ctn
// - Dishwash 1L: 15 bottles/ctn
// - Harpic: 14 bottles/ctn
// - Bleach 600ml: 12 bottles/ctn
export const getBottlesPerCarton = (sizeObj, productName = '') => {
  if (!sizeObj) return 24;
  const pName = (sizeObj.product_name || productName || '').toLowerCase();
  const sName = (sizeObj.size || sizeObj.size_name || sizeObj.name || '').toLowerCase();
  const combined = `${pName} ${sName}`;

  // 1. Sweep 600ml / Small Sweep -> 12 bottles
  if ((combined.includes('sweep') || combined.includes('toilet')) && (combined.includes('600') || combined.includes('small'))) {
    return 12;
  }
  // 2. Sweep 1.2L / Toilet 1.2L -> 6 bottles
  if ((combined.includes('sweep') || combined.includes('toilet')) && (combined.includes('1.2') || combined.includes('1200') || combined.includes('medium') || combined.includes('large'))) {
    return 6;
  }
  // 3. Dishwash 500ml -> 16 bottles
  if ((combined.includes('dishwash') || combined.includes('dish') || combined.includes('diswash')) && (combined.includes('500') || combined.includes('medium') || combined.includes('small'))) {
    return 16;
  }
  // 4. Dishwash 1L -> 15 bottles
  if ((combined.includes('dishwash') || combined.includes('dish') || combined.includes('diswash')) && (combined.includes('1l') || combined.includes('1 l') || combined.includes('1000') || combined.includes('1 liter') || combined.includes('large'))) {
    return 15;
  }
  // 5. Harpic -> 14 bottles
  if (combined.includes('harpic')) {
    return 14;
  }
  // 6. Bleach 600ml -> 12 bottles
  if (combined.includes('bleach') || combined.includes('belach')) {
    return 12;
  }

  const rawVal = Number(sizeObj.bottles_per_carton || sizeObj.bottlesPerCarton);
  if (rawVal > 0 && rawVal !== 24) return rawVal;

  return 24;
};

export default function WarehouseManagementApp() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sizeFilter, setSizeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  // Domain state - Loaded directly from Database
  const [products, setProducts] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Supabase state
  const [isSupabaseWorking, setIsSupabaseWorking] = useState(false);
  const [supabaseUrl] = useState(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihbnnwdkggayjyxazpkc.supabase.co');
  const [supabaseKey] = useState(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_BR3QrHhJGqMawC5UvVyfzQ_tJWk7aQl');
  const [isCopiedSql, setIsCopiedSql] = useState(false);

  // Modals state
  const [modalType, setModalType] = useState(null); // 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN', 'ADD_PRODUCT', 'ADD_RAW', 'ADD_STICKER', 'EDIT_STICKER', 'SUPABASE'
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [stockForm, setStockForm] = useState({
    itemType: 'FINISHED',
    productId: '',
    sizeId: '',
    stickerId: '',
    rawMaterialId: '',
    bottleQty: 240,
    cartonQty: 12,
    stickerQty: 500,
    rawQty: 0,
    purchasePrice: '',
    supplier: '',
    customer: '',
    reference: 'PO-001',
    reason: 'Bottling & Packaging Batch',
    damageType: 'FINISHED',
    notes: '',
    entryMode: 'CARTON'
  });

  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: PRODUCT_CATEGORIES[0].label,
    customCategory: '',
    status: 'Available',
    sizes: PRODUCT_CATEGORIES[0].sizes.map(s => ({ ...s }))
  });

  const [newRawForm, setNewRawForm] = useState({
    name: '',
    unit: 'Liters',
    quantity: 0,
    minimum_stock: 100,
    purchase_price: 0,
    weight_per_bori_kg: 25
  });

  const [newSupplierForm, setNewSupplierForm] = useState({
    name: '',
    company_name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [editSizeForm, setEditSizeForm] = useState({
    id: '',
    productId: '',
    productName: '',
    sizeName: '',
    bottlesPerCarton: '',
    purchasePrice: '',
    sellingPrice: '',
    minStock: ''
  });

  const [editRawForm, setEditRawForm] = useState({
    id: '',
    name: '',
    unit: 'Liters',
    quantity: 0,
    minimum_stock: 100,
    purchase_price: 0,
    weight_per_bori_kg: 25
  });

  const [newStickerForm, setNewStickerForm] = useState({
    name: '',
    category: 'Sweep / Toilet Cleaner',
    size: '600ml Bottle',
    unit: 'Pcs',
    quantity: 0,
    minimum_stock: 500,
    purchase_price: 2.5,
    supplier: 'Printing Press',
    notes: ''
  });

  const [editStickerForm, setEditStickerForm] = useState({
    id: '',
    name: '',
    category: 'Sweep / Toilet Cleaner',
    size: '600ml Bottle',
    unit: 'Pcs',
    quantity: 0,
    damaged_quantity: 0,
    minimum_stock: 500,
    purchase_price: 2.5,
    supplier: 'Printing Press',
    notes: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Auth Session Lifecycle & Persistence
  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      try {
        // 1. Check local storage for persistent or demo session
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('velora_auth_user');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed && isMounted) {
                setCurrentUser(parsed);
              }
            } catch (e) { }
          }
        }

        // 2. Check Supabase Auth
        const { data } = await getAuthSession();
        if (data?.session?.user && isMounted) {
          setCurrentUser(data.session.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('velora_auth_user', JSON.stringify(data.session.user));
          }
        }
      } catch (err) {
        console.warn('Error checking auth session:', err);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    checkAuthSession();

    const { data: authSub } = onAuthChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('velora_auth_user', JSON.stringify(session.user));
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('velora_auth_user');
        }
      }
    });

    return () => {
      isMounted = false;
      if (authSub?.subscription) {
        authSub.subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('velora_auth_user');
    }
    showToast('👋 Successfully logged out.');
  };

  // ----------------- Filled Cartons Handlers -----------------
  const handlePackCartons = async (targetSize, cartonsToAdd, meta = {}) => {
    try {
      const newCartons = (targetSize.carton_quantity || 0) + cartonsToAdd;
      const bpc = getBottlesPerCarton(targetSize);
      const packedBottles = cartonsToAdd * bpc;

      setProductSizes(prev => prev.map(s => {
        if (String(s.id) === String(targetSize.id)) {
          return {
            ...s,
            carton_quantity: newCartons,
            pallet_location: meta.palletLocation || s.pallet_location || 'Pallet Bay A-01'
          };
        }
        return s;
      }));

      // Record transaction
      const newTx = {
        id: `TX-CTN-${Date.now()}`,
        type: 'PACKING_IN',
        item_type: 'FINISHED_CARTON',
        product_name: targetSize.product_name,
        size: targetSize.size || targetSize.size_name,
        quantity: cartonsToAdd,
        unit: 'cartons',
        details: `Packed ${cartonsToAdd} master cartons (${packedBottles.toLocaleString()} bottles). Batch: ${meta.batchNo || 'N/A'}. Location: ${meta.palletLocation || 'Warehouse'}. ${meta.notes || ''}`,
        performed_by: currentUser?.user_metadata?.full_name || currentUser?.email || 'Warehouse Manager',
        created_at: new Date().toISOString()
      };
      setTransactions(prev => [newTx, ...prev]);

      // Sync to Supabase if live
      const client = getSupabase();
      if (client && isSupabaseWorking) {
        try {
          const numId = parseInt(targetSize.id, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').update({
              cartons: newCartons,
              updated_at: new Date().toISOString()
            }).eq('product_size_id', numId);

            await client.from('inventory_transactions').insert({
              id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              transaction_type: 'Stock In',
              item_type: 'Finished Product',
              item_name: targetSize.product_name,
              size_name: targetSize.size || targetSize.size_name || 'Standard',
              quantity: cartonsToAdd,
              unit: 'cartons',
              reference_no: meta.batchNo || 'PACK-BATCH',
              notes: `Packed ${cartonsToAdd} master cartons (${packedBottles} bottles). Batch: ${meta.batchNo || 'N/A'}. Location: ${meta.palletLocation || 'Warehouse Bay'}`,
              performed_by: currentUser?.user_metadata?.full_name || currentUser?.email || 'Admin',
              created_at: new Date().toISOString()
            });
          }
        } catch (dbErr) {
          console.warn('Supabase carton sync note:', dbErr);
        }
      }

      showToast(`📦 Successfully packed +${cartonsToAdd} Master Cartons of ${targetSize.product_name} (${targetSize.size || targetSize.size_name})!`);
    } catch (err) {
      console.error('Error packing cartons:', err);
      showToast(`Error packing cartons: ${err.message}`);
    }
  };

  const handleDispatchCartons = async (targetSize, cartonsToSub, meta = {}) => {
    try {
      const newCartons = Math.max(0, (targetSize.carton_quantity || 0) - cartonsToSub);
      const bpc = getBottlesPerCarton(targetSize);
      const dispatchedBottles = cartonsToSub * bpc;

      setProductSizes(prev => prev.map(s => {
        if (String(s.id) === String(targetSize.id)) {
          return {
            ...s,
            carton_quantity: newCartons
          };
        }
        return s;
      }));

      // Record transaction
      const newTx = {
        id: `TX-DISP-${Date.now()}`,
        type: 'DISPATCH_OUT',
        item_type: 'FINISHED_CARTON',
        product_name: targetSize.product_name,
        size: targetSize.size || targetSize.size_name,
        quantity: cartonsToSub,
        unit: 'cartons',
        details: `Dispatched ${cartonsToSub} cartons (${dispatchedBottles.toLocaleString()} bottles) to ${meta.customerName || 'Customer'}. Gate Pass: ${meta.gatePassNo || 'N/A'}. ${meta.notes || ''}`,
        performed_by: currentUser?.user_metadata?.full_name || currentUser?.email || 'Warehouse Manager',
        created_at: new Date().toISOString()
      };
      setTransactions(prev => [newTx, ...prev]);

      // Sync to Supabase if live
      const client = getSupabase();
      if (client && isSupabaseWorking) {
        try {
          const numId = parseInt(targetSize.id, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').update({
              cartons: newCartons,
              total_sold: ((targetSize.total_sold || 0) + dispatchedBottles),
              updated_at: new Date().toISOString()
            }).eq('product_size_id', numId);

            await client.from('inventory_transactions').insert({
              id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              transaction_type: 'Stock Out',
              item_type: 'Finished Product',
              item_name: targetSize.product_name,
              size_name: targetSize.size || targetSize.size_name || 'Standard',
              quantity: cartonsToSub,
              unit: 'cartons',
              reference_no: meta.gatePassNo || 'GP-DISPATCH',
              notes: `Dispatched ${cartonsToSub} cartons (${dispatchedBottles} bottles) to ${meta.customerName || 'Customer'}. Gate Pass: ${meta.gatePassNo || ''}`,
              performed_by: currentUser?.user_metadata?.full_name || currentUser?.email || 'Admin',
              created_at: new Date().toISOString()
            });
          }
        } catch (dbErr) {
          console.warn('Supabase carton dispatch sync note:', dbErr);
        }
      }

      showToast(`🚚 Dispatched -${cartonsToSub} Master Cartons to ${meta.customerName || 'Customer'}! (Gate Pass: ${meta.gatePassNo})`);
    } catch (err) {
      console.error('Error dispatching cartons:', err);
      showToast(`Error dispatching cartons: ${err.message}`);
    }
  };

  const handleAdjustCartons = async (targetSize, newCartonCount, reason = 'Opening physical stock count') => {
    try {
      const bpc = getBottlesPerCarton(targetSize);
      const oldCartons = targetSize.carton_quantity || 0;
      const count = Math.max(0, parseInt(newCartonCount, 10) || 0);
      const diff = count - oldCartons;
      const newBottles = count * bpc;

      setProductSizes(prev => prev.map(s => {
        if (String(s.id) === String(targetSize.id)) {
          return {
            ...s,
            carton_quantity: count,
            bottle_quantity: newBottles
          };
        }
        return s;
      }));

      // Record transaction in history
      const newTx = {
        id: `TX-ADJ-CTN-${Date.now()}`,
        type: 'STOCK_ADJUSTMENT',
        item_type: 'FINISHED_CARTON',
        product_name: targetSize.product_name,
        size: targetSize.size || targetSize.size_name,
        quantity: count,
        unit: 'cartons',
        details: `Manual Carton Stock Set: Previous ${oldCartons} ctns -> New ${count} ctns (${newBottles.toLocaleString()} btls @ ${bpc}/ctn). Diff: ${diff >= 0 ? '+' : ''}${diff}. Reason: ${reason}`,
        performed_by: currentUser?.user_metadata?.full_name || currentUser?.email || 'Warehouse Manager',
        created_at: new Date().toISOString()
      };
      setTransactions(prev => [newTx, ...prev]);

      // Sync to Supabase if live
      const client = getSupabase();
      if (client && isSupabaseWorking) {
        try {
          const numId = parseInt(targetSize.id, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').update({
              cartons: count,
              available_bottles: newBottles,
              updated_at: new Date().toISOString()
            }).eq('product_size_id', numId);
          }
        } catch (dbErr) {
          console.warn('Supabase carton adjust sync note:', dbErr);
        }
      }

      showToast(`✅ "${targetSize.product_name} - ${targetSize.size}" stock manually set to ${count} cartons (${newBottles.toLocaleString()} bottles)!`);
    } catch (err) {
      console.error('Carton adjust error:', err);
      showToast(`Error adjusting cartons: ${err.message}`);
    }
  };

  // 1. Load from localStorage on client mount if available (and purge seeded factory data)
  useEffect(() => {
    try {
      const isSeededId = (id) => {
        const s = String(id || '');
        return s.startsWith('prod-sweep') || s.startsWith('prod-dishwash') || s.startsWith('prod-bleach') || s.startsWith('prod-harpic') ||
          s.startsWith('size-sweep') || s.startsWith('size-dish') || s.startsWith('size-bleach') || s.startsWith('size-harpic') ||
          s.startsWith('raw-hcl') || s.startsWith('raw-dish') || s.startsWith('raw-bleach') || s.startsWith('raw-harpic') ||
          s.startsWith('raw-btl') || s.startsWith('raw-can') || s.startsWith('raw-ctn') || s.startsWith('raw-stk');
      };

      const savedProds = localStorage.getItem('wms_products');
      if (savedProds) {
        const parsed = JSON.parse(savedProds).filter(p => !isSeededId(p.id));
        setProducts(parsed);
      }

      const savedSizes = localStorage.getItem('wms_productSizes');
      if (savedSizes) {
        const parsed = JSON.parse(savedSizes)
          .filter(s => !isSeededId(s.id) && !isSeededId(s.product_id))
          .map(s => {
            const bpc = getBottlesPerCarton(s);
            return { ...s, bottles_per_carton: bpc };
          });
        setProductSizes(parsed);
      }

      const savedStickers = localStorage.getItem('wms_stickers');
      if (savedStickers) {
        try {
          const parsed = JSON.parse(savedStickers).filter(stk => !isSeededId(stk.id));
          setStickers(parsed);
        } catch (e) { }
      }

      const savedRaw = localStorage.getItem('wms_rawMaterials');
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw).filter(r => !isSeededId(r.id));
        setRawMaterials(parsed);
      }

      const savedSups = localStorage.getItem('wms_suppliers');
      if (savedSups) setSuppliers(JSON.parse(savedSups));

      const savedTxs = localStorage.getItem('wms_transactions');
      if (savedTxs) {
        const parsed = JSON.parse(savedTxs).filter(t => !String(t.notes || '').includes('Bottling Process: Consumed') && !String(t.notes || '').includes('Packaging Process: Consumed'));
        setTransactions(parsed);
      }
    } catch (e) {
      console.warn('localStorage load error:', e);
    }
  }, []);

  // 2. Save state updates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wms_products', JSON.stringify(products));
      localStorage.setItem('wms_productSizes', JSON.stringify(productSizes));
      localStorage.setItem('wms_stickers', JSON.stringify(stickers));
      localStorage.setItem('wms_rawMaterials', JSON.stringify(rawMaterials));
      localStorage.setItem('wms_suppliers', JSON.stringify(suppliers));
      localStorage.setItem('wms_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.warn('localStorage save error:', e);
    }
  }, [products, productSizes, stickers, rawMaterials, suppliers, transactions]);

  // Test Supabase connection on mount and auto-fetch live tables
  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      testSupabaseConnection(supabaseUrl, supabaseKey).then((res) => {
        setIsSupabaseWorking(res.success);
        if (res.success && res.tablesCreated) {
          fetchDataFromSupabase();
        }
      });
    }
  }, [supabaseUrl, supabaseKey]);

  // Calculations for KPI Cards (Section 13)
  const totalProductsCount = products.length;
  const totalBottles = productSizes.reduce((acc, s) => acc + (s.bottle_quantity || 0), 0);
  const totalCartons = productSizes.reduce((acc, s) => acc + (s.carton_quantity || 0), 0);
  const totalStickers = stickers.length > 0
    ? stickers.reduce((acc, s) => acc + (s.quantity || 0), 0)
    : productSizes.reduce((acc, s) => acc + (s.sticker_quantity || 0), 0);
  const totalStickerTypes = stickers.length > 0 ? stickers.length : productSizes.length;
  const totalRawMaterialsCount = rawMaterials.length;

  // Finished Goods Inventory Valuation = Available Bottles × Purchase Price
  const finishedInventoryValue = productSizes.reduce((acc, s) => {
    return acc + ((s.bottle_quantity || 0) * (s.purchase_price || 0));
  }, 0);

  // Raw Materials Valuation (Liters × Price or KG × Price for TSP)
  const rawInventoryValue = rawMaterials.reduce((acc, r) => {
    if (r.unit.includes('Bori')) {
      const totalKg = (r.quantity || 0) * (r.weight_per_bori_kg || 25);
      return acc + (totalKg * (r.purchase_price || 0));
    }
    return acc + ((r.quantity || 0) * (r.purchase_price || 0));
  }, 0);

  // Stickers Inventory Valuation = Available Stickers × Purchase Rate
  const stickersValuation = stickers.reduce((acc, s) => {
    return acc + ((s.quantity || 0) * (s.purchase_price || 0));
  }, 0);

  const totalInventoryValue = finishedInventoryValue + rawInventoryValue + stickersValuation;

  // Low Stock Items & Out of Stock Items Calculation
  const lowStockFinished = productSizes.filter(s => s.bottle_quantity > 0 && s.bottle_quantity <= s.minimum_stock);
  const outOfStockFinished = productSizes.filter(s => (s.bottle_quantity || 0) <= 0);

  const lowStockRaw = rawMaterials.filter(r => r.quantity > 0 && r.quantity <= r.minimum_stock);
  const outOfStockRaw = rawMaterials.filter(r => (r.quantity || 0) <= 0);

  const lowStockStickers = stickers.length > 0
    ? stickers.filter(s => (s.quantity || 0) > 0 && (s.quantity || 0) <= (s.minimum_stock || 100))
    : productSizes.filter(s => (s.sticker_quantity || 0) > 0 && (s.sticker_quantity || 0) <= (s.minimum_stock || 100));
  const outOfStockStickers = stickers.length > 0
    ? stickers.filter(s => (s.quantity || 0) <= 0)
    : productSizes.filter(s => (s.sticker_quantity || 0) <= 0);
  const totalDamagedStickers = stickers.length > 0
    ? stickers.reduce((acc, s) => acc + (s.damaged_quantity || 0), 0)
    : productSizes.reduce((acc, s) => acc + (s.damaged_stickers || 0), 0);

  const totalLowStockCount = lowStockFinished.length + lowStockRaw.length + lowStockStickers.length;
  const totalOutOfStockCount = outOfStockFinished.length + outOfStockRaw.length + outOfStockStickers.length;

  // Parent product lookup helper
  const getProductForSize = (s) => {
    return products.find(p => String(p.id) === String(s.product_id)) || null;
  };

  // Helper matching functions for Category Cards & Filter
  const isToiletItem = (s, p) => {
    const cat = ((p?.category) || '').toLowerCase();
    const name = ((s?.product_name || p?.name) || '').toLowerCase();
    const sz = ((s?.size) || '').toLowerCase();
    return cat.includes('toilet') || name.includes('toilet') ||
      cat.includes('sweep') || name.includes('sweep') || sz.includes('sweep') ||
      cat.includes('tolie') || name.includes('tolie');
  };

  const isDishwashItem = (s, p) => {
    const cat = ((p?.category) || '').toLowerCase();
    const name = ((s?.product_name || p?.name) || '').toLowerCase();
    const sz = ((s?.size) || '').toLowerCase();
    if (isToiletItem(s, p)) return false;
    return cat.includes('dish') || name.includes('dish') || sz.includes('dish') ||
      cat.includes('250ml') || sz.includes('250ml') ||
      (cat.includes('bottle') && !cat.includes('bleach') && !cat.includes('harpic'));
  };

  const isHarpicItem = (s, p) => {
    const cat = ((p?.category) || '').toLowerCase();
    const name = ((s?.product_name || p?.name) || '').toLowerCase();
    const sz = ((s?.size) || '').toLowerCase();
    return cat.includes('harpic') || name.includes('harpic') || sz.includes('harpic');
  };

  const isBleachItem = (s, p) => {
    const cat = ((p?.category) || '').toLowerCase();
    const name = ((s?.product_name || p?.name) || '').toLowerCase();
    const sz = ((s?.size) || '').toLowerCase();
    return cat.includes('bleach') || name.includes('bleach') || sz.includes('bleach');
  };

  // Delete a product size (and parent product if no sizes remain)
  // Delete a product size (and parent product if no sizes remain)
  const handleDeleteProductSize = async (sizeId) => {
    const targetSize = productSizes.find(s => String(s.id) === String(sizeId));
    if (!targetSize) return;

    if (window.confirm(`Are you sure you want to delete "${targetSize.product_name} - ${targetSize.size}"?`)) {
      const remaining = productSizes.filter(s => String(s.id) !== String(sizeId));
      const siblingSizes = remaining.filter(s => s.product_id === targetSize.product_id);

      setProductSizes(remaining);
      if (siblingSizes.length === 0) {
        setProducts(prods => prods.filter(p => p.id !== targetSize.product_id));
      }

      // Directly delete from Supabase Database
      try {
        const client = getSupabase();
        if (client) {
          const numId = parseInt(sizeId, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').delete().eq('product_size_id', numId);
            await client.from('product_sizes').delete().eq('id', numId);
          }
          if (siblingSizes.length === 0) {
            await client.from('products').delete().eq('id', targetSize.product_id);
          }
        }
      } catch (err) {
        console.warn('Supabase delete size error:', err);
      }

      showToast(`🗑️ "${targetSize.product_name} - ${targetSize.size}" deleted successfully!`);
    }
  };

  // Delete a raw material
  const handleDeleteRawMaterial = async (rawId) => {
    const targetRaw = rawMaterials.find(r => String(r.id) === String(rawId));
    if (!targetRaw) return;

    if (window.confirm(`Are you sure you want to delete raw material "${targetRaw.name}"?`)) {
      setRawMaterials(prev => prev.filter(r => String(r.id) !== String(rawId)));

      // Directly delete from Supabase Database
      try {
        const client = getSupabase();
        if (client) {
          await client.from('raw_materials').delete().eq('id', rawId);
        }
      } catch (err) {
        console.warn('Supabase delete raw error:', err);
      }

      showToast(`🗑️ "${targetRaw.name}" deleted successfully!`);
    }
  };

  // Delete a sticker from inventory
  const handleDeleteSticker = async (stkId) => {
    const targetStk = stickers.find(s => String(s.id) === String(stkId));
    if (!targetStk) return;

    if (window.confirm(`Are you sure you want to delete sticker "${targetStk.name}" from inventory?`)) {
      setStickers(prev => prev.filter(s => String(s.id) !== String(stkId)));

      try {
        const client = getSupabase();
        if (client) {
          await client.from('stickers').delete().eq('id', stkId);
        }
      } catch (err) {
        console.warn('Supabase delete sticker error:', err);
      }

      showToast(`🗑️ Sticker "${targetStk.name}" deleted successfully!`);
    }
  };

  // Clear / Reset all inventory data
  const handleClearAllData = async () => {
    if (window.confirm('⚠️ Are you sure you want to DELETE ALL warehouse data? This will clear all finished products, raw materials, stickers, and transaction history.')) {
      setProducts([]);
      setProductSizes([]);
      setStickers([]);
      setRawMaterials([]);
      setTransactions([]);
      try {
        localStorage.removeItem('wms_products');
        localStorage.removeItem('wms_productSizes');
        localStorage.removeItem('wms_stickers');
        localStorage.removeItem('wms_rawMaterials');
        localStorage.removeItem('wms_suppliers');
        localStorage.removeItem('wms_transactions');

        // Directly wipe from Supabase Database
        const client = getSupabase();
        if (client) {
          await client.from('inventory_transactions').delete().neq('id', '');
          await client.from('inventory').delete().neq('id', 0);
          await client.from('product_sizes').delete().neq('id', 0);
          await client.from('products').delete().neq('id', '');
          await client.from('stickers').delete().neq('id', '');
          await client.from('raw_materials').delete().neq('id', '');
        }
      } catch (err) {
        console.warn('Error clearing database data:', err);
      }
      showToast('🗑️ All warehouse data deleted and reset successfully!');
    }
  };

  // Filter Finished Products Table
  const filteredProductSizes = productSizes.filter(s => {
    const matchesSearch =
      !searchQuery ||
      s.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.size.toLowerCase().includes(searchQuery.toLowerCase());

    const prod = products.find(p => p.id === s.product_id);

    let matchesCategory = false;
    if (categoryFilter === 'ALL') {
      matchesCategory = true;
    } else if (categoryFilter === 'TOILET') {
      matchesCategory = isToiletItem(s, prod);
    } else if (categoryFilter === 'DISHWASH') {
      matchesCategory = isDishwashItem(s, prod);
    } else if (categoryFilter === 'HARPIC') {
      matchesCategory = isHarpicItem(s, prod);
    } else if (categoryFilter === 'BLEACH') {
      matchesCategory = isBleachItem(s, prod);
    } else {
      matchesCategory = prod?.category === categoryFilter;
    }

    const matchesSize = sizeFilter === 'ALL' ||
      s.size === sizeFilter ||
      (sizeFilter === '600ml Bottle' && s.size.toLowerCase().includes('600')) ||
      (sizeFilter === '1.2 Liter Bottle' && (s.size.toLowerCase().includes('1.2') || s.size.toLowerCase().includes('1200'))) ||
      (sizeFilter === '250ml Bottle' && s.size.toLowerCase().includes('250')) ||
      (sizeFilter === '500ml Bottle' && s.size.toLowerCase().includes('500')) ||
      (sizeFilter === '4.5 Liter Can' && (s.size.toLowerCase().includes('4.5') || s.size.toLowerCase().includes('4500'))) ||
      (sizeFilter === '1000ml Bottle' && (s.size.toLowerCase().includes('1000') || s.size.toLowerCase().includes('1l') || s.size.toLowerCase().includes('1 liter')));

    let itemStatus = 'Available';
    if (s.bottle_quantity <= 0) itemStatus = 'Out of Stock';
    else if (s.bottle_quantity <= s.minimum_stock) itemStatus = 'Low Stock';

    const matchesStatus = statusFilter === 'ALL' || itemStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesSize && matchesStatus;
  });

  // Filter Raw Materials Table
  const filteredRawMaterials = rawMaterials.filter(r => {
    return !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter Stickers Table
  const filteredStickers = stickers.filter(s => {
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.size && s.size.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper to open Stock In modal with correct defaults
  const openStockInModal = (type = 'FINISHED', targetId = null) => {
    const actualType = (type === 'FINISHED' && productSizes.length === 0 && rawMaterials.length > 0) ? 'RAW' : type;
    const defaultRawId = (targetId && actualType === 'RAW') ? targetId : (rawMaterials[0]?.id || '');
    const defaultSizeId = (targetId && actualType === 'FINISHED') ? targetId : (productSizes[0]?.id || '');
    const defaultStickerId = (targetId && actualType === 'STICKER') ? targetId : (stickers[0]?.id || '');
    const curRaw = rawMaterials.find(r => String(r.id) === String(defaultRawId)) || rawMaterials[0] || null;
    const curSize = productSizes.find(s => String(s.id) === String(defaultSizeId)) || productSizes[0] || null;
    const curStk = stickers.find(s => String(s.id) === String(defaultStickerId)) || stickers[0] || null;
    const selectedProd = products.find(p => String(p.id) === String(curSize?.product_id)) || products[0] || null;

    const bpc = getBottlesPerCarton(curSize);
    const defaultCartons = 10;

    setStockForm({
      itemType: actualType,
      productId: selectedProd?.id || '',
      sizeId: curSize?.id || defaultSizeId,
      stickerId: curStk?.id || defaultStickerId,
      rawMaterialId: curRaw?.id || defaultRawId,
      entryMode: 'CARTON',
      cartonQty: defaultCartons,
      bottleQty: defaultCartons * bpc,
      stickerQty: actualType === 'STICKER' ? 500 : 0,
      rawQty: 100,
      purchasePrice: actualType === 'RAW'
        ? (curRaw?.purchase_price !== undefined ? curRaw.purchase_price : '')
        : actualType === 'STICKER'
          ? (curStk?.purchase_price !== undefined ? curStk.purchase_price : 2.5)
          : (curSize?.purchase_price !== undefined ? curSize.purchase_price : ''),
      supplier: suppliers[0]?.company_name || (actualType === 'STICKER' ? (curStk?.supplier || 'Print Pack Suppliers') : 'Direct Delivery'),
      customer: '',
      reference: actualType === 'STICKER' ? `STK-${Math.floor(1000 + Math.random() * 9000)}` : `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
      reason: actualType === 'RAW' ? 'Raw Material Stock In' : actualType === 'STICKER' ? 'Product Stickers / Labels Stock In' : 'Finished Goods Stock In',
      damageType: actualType,
      notes: ''
    });
    setModalType('STOCK_IN');
  };

  // Helper to open Add Product modal with completely blank numeric fields
  const openAddProductModal = (categoryPreset = null, defaultName = '') => {
    const preset = categoryPreset
      ? (PRODUCT_CATEGORIES.find(c => c.label === categoryPreset) || PRODUCT_CATEGORIES[0])
      : PRODUCT_CATEGORIES[0];

    setNewProductForm({
      name: defaultName,
      category: preset.label,
      customCategory: '',
      status: 'Available',
      sizes: preset ? preset.sizes.map(s => ({
        ...s,
        bottlesPerCarton: (s.bottlesPerCarton !== undefined && s.bottlesPerCarton !== '') ? s.bottlesPerCarton : '',
        purchasePrice: '',
        sellingPrice: '',
        minStock: ''
      })) : []
    });
    setModalType('ADD_PRODUCT');
  };

  // Helper to open Stock Out modal
  const openStockOutModal = (type = 'FINISHED', targetId = null) => {
    const actualType = (type === 'FINISHED' && productSizes.length === 0 && rawMaterials.length > 0) ? 'RAW' : type;
    const defaultRawId = targetId && actualType === 'RAW' ? targetId : (rawMaterials[0]?.id || '');
    const defaultSizeId = targetId && actualType === 'FINISHED' ? targetId : (productSizes[0]?.id || '');
    const defaultStickerId = targetId && actualType === 'STICKER' ? targetId : (stickers[0]?.id || '');
    const curStk = stickers.find(s => String(s.id) === String(defaultStickerId)) || stickers[0] || null;
    const selectedProd = products.find(p => p.id === (productSizes.find(s => s.id === defaultSizeId)?.product_id)) || products[0] || null;

    setStockForm({
      itemType: actualType,
      productId: selectedProd?.id || '',
      sizeId: defaultSizeId,
      stickerId: curStk?.id || defaultStickerId,
      rawMaterialId: defaultRawId,
      bottleQty: 50,
      cartonQty: 2,
      stickerQty: actualType === 'STICKER' ? 100 : 0,
      rawQty: 100,
      purchasePrice: '',
      supplier: '',
      customer: actualType === 'RAW' ? 'Factory Production Line' : actualType === 'STICKER' ? 'Bottling & Labeling Line' : 'Wholesale Client',
      reference: actualType === 'STICKER' ? `ISS-${Math.floor(1000 + Math.random() * 9000)}` : `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      reason: actualType === 'RAW' ? 'Issued to Mixing Plant' : actualType === 'STICKER' ? 'Issued for Bottle Labeling' : 'Customer Dispatch',
      damageType: actualType,
      notes: '',
      entryMode: 'CARTON'
    });
    setModalType('STOCK_OUT');
  };

  // Handle Stock In (Strictly adds to Finished Goods, Stickers, or Raw Materials)
  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    if (stockForm.itemType === 'STICKER') {
      const activeStkId = stockForm.stickerId || stickers[0]?.id;
      const targetSticker = stickers.find(s => String(s.id) === String(activeStkId));

      if (targetSticker) {
        const addStickers = parseInt(stockForm.stickerQty || 0, 10);
        if (isNaN(addStickers) || addStickers <= 0) {
          alert('Please enter a valid quantity of stickers greater than 0.');
          return;
        }

        const enteredPrice = parseFloat(stockForm.purchasePrice);
        const stickerRate = (!isNaN(enteredPrice) && enteredPrice >= 0) ? enteredPrice : (targetSticker.purchase_price || 2.5);
        const newStickers = (targetSticker.quantity || 0) + addStickers;

        setStickers(prev => prev.map(s => {
          if (s.id === targetSticker.id) {
            return {
              ...s,
              quantity: newStickers,
              purchase_price: stickerRate,
              status: newStickers <= 0 ? 'Out of Stock' : newStickers <= (s.minimum_stock || 100) ? 'Low Stock' : 'In Stock'
            };
          }
          return s;
        }));

        const newTx = {
          id: `tx-${Date.now()}`,
          date: new Date().toLocaleString(),
          item: targetSticker.name,
          size: targetSticker.size || '—',
          type: 'STOCK_IN',
          quantity: addStickers,
          unit: targetSticker.unit || 'Pcs',
          user: 'Admin',
          reference: stockForm.reference || `STK-${Math.floor(1000 + Math.random() * 9000)}`,
          notes: stockForm.notes
            ? `${stockForm.notes} (@ Rs. ${stickerRate}/${targetSticker.unit || 'pc'})`
            : `Stickers Delivery: +${addStickers.toLocaleString()} ${targetSticker.unit || 'pcs'} @ Rs. ${stickerRate}/${targetSticker.unit || 'pc'} from ${stockForm.supplier || targetSticker.supplier || 'Printing Press'}`
        };

        setTransactions(prev => [newTx, ...prev]);
        showToast(` Stickers Stock In: +${addStickers.toLocaleString()} ${targetSticker.unit || 'pcs'} added to ${targetSticker.name}! Total: ${newStickers.toLocaleString()}`);
        setModalType(null);

        try {
          const client = getSupabase();
          if (client) {
            await client.from('stickers').update({
              quantity: newStickers,
              purchase_price: stickerRate,
              status: newStickers <= 0 ? 'Out of Stock' : newStickers <= (targetSticker.minimum_stock || 100) ? 'Low Stock' : 'In Stock'
            }).eq('id', targetSticker.id);

            await client.from('inventory_transactions').insert({
              id: `TXN-${Date.now()}`,
              transaction_type: 'Stock In',
              item_type: 'Stickers',
              item_name: targetSticker.name,
              size_name: targetSticker.size || '-',
              quantity: addStickers,
              unit: targetSticker.unit || 'Pcs',
              reference_no: stockForm.reference || 'STK-AUTO',
              notes: newTx.notes,
              performed_by: 'Admin'
            });
          }
        } catch (err) {
          console.warn('Supabase sticker stock in error:', err);
        }
        return;
      }

      // Fallback for legacy productSizes sticker tracking
      if (productSizes.length === 0) {
        alert('No stickers in inventory. Please click "+ Add New Sticker" to add one.');
        setModalType('ADD_STICKER');
        return;
      }

      const activeSizeId = stockForm.sizeId || productSizes[0]?.id;
      const targetSize = productSizes.find(s => String(s.id) === String(activeSizeId));
      if (!targetSize) {
        showToast('Please select a valid sticker product from the dropdown');
        return;
      }

      const addStickers = parseInt(stockForm.stickerQty || 0, 10);
      if (isNaN(addStickers) || addStickers <= 0) {
        alert('Please enter a valid quantity of stickers greater than 0.');
        return;
      }

      const enteredPrice = parseFloat(stockForm.purchasePrice);
      const stickerRate = (!isNaN(enteredPrice) && enteredPrice >= 0) ? enteredPrice : 2.5;
      const newStickers = (targetSize.sticker_quantity || 0) + addStickers;

      setProductSizes(prev => prev.map(s => {
        if (s.id === targetSize.id) {
          return {
            ...s,
            sticker_quantity: newStickers
          };
        }
        return s;
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: `${targetSize.product_name} (${targetSize.size}) Stickers`,
        size: targetSize.size,
        type: 'STOCK_IN',
        quantity: addStickers,
        unit: 'Pcs',
        user: 'Admin',
        reference: stockForm.reference || `STK-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: stockForm.notes
          ? `${stockForm.notes} (@ Rs. ${stickerRate}/pc)`
          : `Stickers Delivery: +${addStickers.toLocaleString()} pcs @ Rs. ${stickerRate}/pc from ${stockForm.supplier || 'Printing Press'}`
      };

      setTransactions(prev => [newTx, ...prev]);
      showToast(` Stickers Stock In: +${addStickers.toLocaleString()} pcs added to ${targetSize.product_name} (${targetSize.size})! Total: ${newStickers.toLocaleString()} pcs`);
      setModalType(null);

      try {
        const client = getSupabase();
        if (client) {
          const numId = parseInt(targetSize.id, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').upsert({
              product_size_id: numId,
              stickers: newStickers
            }, { onConflict: 'product_size_id' });

            await client.from('inventory_transactions').insert({
              id: `TXN-${Date.now()}`,
              transaction_type: 'Stock In',
              item_type: 'Stickers',
              item_name: `${targetSize.product_name} (${targetSize.size}) Stickers`,
              size_name: targetSize.size,
              quantity: addStickers,
              unit: 'Pcs',
              reference_no: stockForm.reference || 'STK-AUTO',
              notes: newTx.notes,
              performed_by: 'Admin'
            });
          }
        }
      } catch (err) {
        console.warn('Supabase sticker stock in error:', err);
      }
    } else if (stockForm.itemType === 'FINISHED') {
      if (productSizes.length === 0) {
        alert('No finished products exist yet. Please create a product first.');
        setModalType('ADD_PRODUCT');
        return;
      }

      const activeSizeId = stockForm.sizeId || productSizes[0]?.id;
      const targetSize = productSizes.find(s => String(s.id) === String(activeSizeId));
      if (!targetSize) {
        showToast('Please select a valid product size from the dropdown');
        return;
      }

      const addBottles = parseInt(stockForm.bottleQty || 0, 10);
      const addCartons = parseInt(stockForm.cartonQty || 0, 10);
      const enteredPrice = parseFloat(stockForm.purchasePrice);
      const updatedPrice = (!isNaN(enteredPrice) && enteredPrice >= 0) ? enteredPrice : (targetSize.purchase_price || 0);

      if (addBottles <= 0 && addCartons <= 0) {
        alert('Please enter a valid quantity of bottles or cartons.');
        return;
      }

      const newBottles = (targetSize.bottle_quantity || 0) + addBottles;
      const newCartons = (targetSize.carton_quantity || 0) + addCartons;

      // Update finished product stock in state
      setProductSizes(prev => prev.map(s => {
        if (s.id === targetSize.id) {
          return {
            ...s,
            bottle_quantity: newBottles,
            carton_quantity: newCartons,
            purchase_price: updatedPrice
          };
        }
        return s;
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: targetSize.product_name,
        size: targetSize.size,
        type: 'STOCK_IN',
        quantity: addBottles,
        unit: 'bottles',
        user: 'Admin',
        reference: stockForm.reference || `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: stockForm.notes
          ? `${stockForm.notes} (+${addCartons} cartons)`
          : `Stock In: +${addCartons} Cartons (${addBottles} bottles) @ Rs. ${updatedPrice}/btl`
      };

      setTransactions(prev => [newTx, ...prev]);
      showToast(`✅ Stock In Complete: +${addCartons} Cartons (${addBottles} bottles) of ${targetSize.product_name} - ${targetSize.size}!`);
      setModalType(null);

      // Save directly to Supabase Cloud Database
      try {
        const client = getSupabase();
        if (client) {
          const numId = parseInt(targetSize.id, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').upsert({
              product_size_id: numId,
              available_bottles: newBottles,
              cartons: newCartons
            }, { onConflict: 'product_size_id' });

            await client.from('product_sizes').update({
              purchase_price: updatedPrice
            }).eq('id', numId);
          }

          await client.from('inventory_transactions').insert({
            id: `TXN-${Date.now()}`,
            transaction_type: 'Stock In',
            item_type: 'Finished Product',
            item_name: targetSize.product_name,
            size_name: targetSize.size,
            quantity: addBottles,
            unit: 'bottles',
            reference_no: stockForm.reference || 'PO-AUTO',
            notes: newTx.notes,
            performed_by: 'Admin'
          });
        }
      } catch (err) {
        console.warn('Supabase stock in error:', err);
      }
    } else {
      // RAW MATERIAL STOCK IN
      if (rawMaterials.length === 0) {
        alert('No raw materials exist yet. Please create a raw material first.');
        setModalType('ADD_RAW');
        return;
      }

      const activeRawId = stockForm.rawMaterialId || rawMaterials[0]?.id;
      const targetRaw = rawMaterials.find(r => String(r.id) === String(activeRawId)) || rawMaterials[0];
      if (!targetRaw) {
        showToast('Please select a valid raw material from the dropdown');
        return;
      }

      const addRaw = parseFloat(stockForm.rawQty || 0);
      if (isNaN(addRaw) || addRaw <= 0) {
        alert('Please enter a valid incoming quantity greater than 0.');
        return;
      }

      const enteredPrice = parseFloat(stockForm.purchasePrice);
      const updatedPrice = (!isNaN(enteredPrice) && enteredPrice >= 0) ? enteredPrice : (targetRaw.purchase_price || 0);
      const isTSP = Boolean(targetRaw.unit && targetRaw.unit.includes('Bori'));
      const rateLabel = isTSP ? `Rs. ${updatedPrice}/KG` : `Rs. ${updatedPrice}/L`;
      const updatedQty = (targetRaw.quantity || 0) + addRaw;

      // 1. Update React state immediately
      setRawMaterials(prev => prev.map(r => {
        if (r.id === targetRaw.id) {
          return {
            ...r,
            quantity: updatedQty,
            purchase_price: updatedPrice,
            status: updatedQty <= 0 ? 'Out of Stock' : updatedQty <= r.minimum_stock ? 'Low Stock' : 'In Stock'
          };
        }
        return r;
      }));

      // 2. Add audit transaction
      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: targetRaw.name,
        size: '—',
        type: 'STOCK_IN',
        quantity: addRaw,
        unit: targetRaw.unit,
        user: 'Admin',
        reference: stockForm.reference || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: stockForm.notes
          ? `${stockForm.notes} (${rateLabel})`
          : `Raw Material Delivery: +${addRaw} ${targetRaw.unit} @ ${rateLabel} from ${stockForm.supplier || 'Supplier'}`
      };
      setTransactions(prev => [newTx, ...prev]);

      // 3. User feedback
      showToast(`✅ Raw Material Stock In: +${addRaw.toLocaleString()} ${targetRaw.unit} added to ${targetRaw.name} (@ ${rateLabel})! Total: ${updatedQty.toLocaleString()} ${targetRaw.unit}`);
      setModalType(null);

      // 4. Save directly to Supabase Database
      try {
        const client = getSupabase();
        if (client) {
          await client.from('raw_materials').update({
            current_liters: isTSP ? 0 : updatedQty,
            bori_count: isTSP ? updatedQty : 0,
            unit_price: updatedPrice,
            status: updatedQty <= 0 ? 'Critical' : updatedQty <= targetRaw.minimum_stock ? 'Low Stock' : 'Adequate'
          }).eq('id', targetRaw.id);

          await client.from('inventory_transactions').insert({
            id: `TXN-${Date.now()}`,
            transaction_type: 'Stock In',
            item_type: 'Raw Material',
            item_name: targetRaw.name,
            size_name: '-',
            quantity: addRaw,
            unit: targetRaw.unit,
            reference_no: stockForm.reference || 'PO-AUTO',
            notes: `${stockForm.notes || 'Raw material stock in received'} (${rateLabel})`,
            performed_by: 'Admin'
          });
        }
      } catch (err) {
        console.warn('Supabase sync skipped:', err);
      }
    }
  };

  // Handle Stock Out (Validating Stock Cannot Be Negative)
  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    if (stockForm.itemType === 'STICKER') {
      const activeStkId = stockForm.stickerId || stickers[0]?.id;
      const targetSticker = stickers.find(s => String(s.id) === String(activeStkId));

      if (targetSticker) {
        const subStickers = parseInt(stockForm.stickerQty || 0, 10);
        if (isNaN(subStickers) || subStickers <= 0) {
          alert('Please enter a valid quantity of stickers to issue.');
          return;
        }

        if ((targetSticker.quantity || 0) < subStickers) {
          alert(`Insufficient Stickers! Available: ${(targetSticker.quantity || 0).toLocaleString()} ${targetSticker.unit || 'pcs'}. Requested: ${subStickers.toLocaleString()} ${targetSticker.unit || 'pcs'}. Stock negative nahi ho sakta.`);
          return;
        }

        const newStickers = Math.max(0, (targetSticker.quantity || 0) - subStickers);

        setStickers(prev => prev.map(s => {
          if (s.id === targetSticker.id) {
            return {
              ...s,
              quantity: newStickers,
              status: newStickers <= 0 ? 'Out of Stock' : newStickers <= (s.minimum_stock || 100) ? 'Low Stock' : 'In Stock'
            };
          }
          return s;
        }));

        const newTx = {
          id: `tx-${Date.now()}`,
          date: new Date().toLocaleString(),
          item: targetSticker.name,
          size: targetSticker.size || '—',
          type: 'STOCK_OUT',
          quantity: subStickers,
          unit: targetSticker.unit || 'Pcs',
          user: 'Admin',
          reference: stockForm.reference || `ISS-${Math.floor(1000 + Math.random() * 9000)}`,
          notes: stockForm.notes || `Issued to ${stockForm.customer || 'Labeling Station'}: -${subStickers} ${targetSticker.unit || 'pcs'} (${stockForm.reason || 'Production'})`
        };
        setTransactions(prev => [newTx, ...prev]);
        showToast(`Stock Out recorded: -${subStickers} ${targetSticker.unit || 'pcs'} for ${targetSticker.name}`);
        setModalType(null);

        try {
          const client = getSupabase();
          if (client) {
            await client.from('stickers').update({
              quantity: newStickers,
              status: newStickers <= 0 ? 'Out of Stock' : newStickers <= (targetSticker.minimum_stock || 100) ? 'Low Stock' : 'In Stock'
            }).eq('id', targetSticker.id);

            await client.from('inventory_transactions').insert({
              id: `TXN-${Date.now()}`,
              transaction_type: 'Stock Out',
              item_type: 'Stickers',
              item_name: targetSticker.name,
              size_name: targetSticker.size || '-',
              quantity: subStickers,
              unit: targetSticker.unit || 'Pcs',
              reference_no: stockForm.reference || 'ISS-AUTO',
              notes: newTx.notes,
              performed_by: 'Admin'
            });
          }
        } catch (err) {
          console.warn('Supabase sticker stock out error:', err);
        }
        return;
      }

      // Legacy fallback
      const activeSizeId = stockForm.sizeId || productSizes[0]?.id;
      const targetSize = productSizes.find(s => String(s.id) === String(activeSizeId));
      if (!targetSize) return;

      const subStickers = parseInt(stockForm.stickerQty || 0, 10);
      if (isNaN(subStickers) || subStickers <= 0) {
        alert('Please enter a valid quantity of stickers to issue.');
        return;
      }

      if ((targetSize.sticker_quantity || 0) < subStickers) {
        alert(`Insufficient Stickers! Available: ${targetSize.sticker_quantity || 0} pcs. Requested: ${subStickers} pcs. Stock negative nahi ho sakta.`);
        return;
      }

      const newStickers = Math.max(0, (targetSize.sticker_quantity || 0) - subStickers);

      setProductSizes(prev => prev.map(s => {
        if (s.id === targetSize.id) {
          return {
            ...s,
            sticker_quantity: newStickers
          };
        }
        return s;
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: `${targetSize.product_name} (${targetSize.size}) Stickers`,
        size: targetSize.size,
        type: 'STOCK_OUT',
        quantity: subStickers,
        unit: 'Pcs',
        user: 'Admin',
        reference: stockForm.reference || `ISS-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: stockForm.notes || `Issued to ${stockForm.customer || 'Labeling Station'}: -${subStickers} pcs (${stockForm.reason || 'Production'})`
      };
      setTransactions(prev => [newTx, ...prev]);
      showToast(`Stock Out recorded: -${subStickers} pcs stickers for ${targetSize.product_name} (${targetSize.size})`);
      setModalType(null);

      try {
        const client = getSupabase();
        if (client) {
          const numId = parseInt(targetSize.id, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').upsert({
              product_size_id: numId,
              stickers: newStickers
            }, { onConflict: 'product_size_id' });

            await client.from('inventory_transactions').insert({
              id: `TXN-${Date.now()}`,
              transaction_type: 'Stock Out',
              item_type: 'Stickers',
              item_name: `${targetSize.product_name} (${targetSize.size}) Stickers`,
              size_name: targetSize.size,
              quantity: subStickers,
              unit: 'Pcs',
              reference_no: stockForm.reference || 'ISS-AUTO',
              notes: newTx.notes,
              performed_by: 'Admin'
            });
          }
        }
      } catch (err) {
        console.warn('Supabase sticker stock out error:', err);
      }
    } else if (stockForm.itemType === 'FINISHED') {
      const targetSize = productSizes.find(s => s.id === stockForm.sizeId);
      if (!targetSize) return;

      const subBottles = parseInt(stockForm.bottleQty || 0, 10);
      const subCartons = parseInt(stockForm.cartonQty || 0, 10);

      // Business Rule: Stock negative nahi hona chahiye!
      if (targetSize.bottle_quantity < subBottles) {
        alert(`Insufficient Stock! Available Bottles: ${targetSize.bottle_quantity}. Requested: ${subBottles}. Stock negative nahi ho sakta.`);
        return;
      }

      const newBottles = Math.max(0, targetSize.bottle_quantity - subBottles);
      const newCartons = Math.max(0, targetSize.carton_quantity - subCartons);
      const newSold = (targetSize.issued_bottles || 0) + subBottles;

      setProductSizes(prev => prev.map(s => {
        if (s.id === targetSize.id) {
          return {
            ...s,
            bottle_quantity: newBottles,
            carton_quantity: newCartons,
            issued_bottles: newSold
          };
        }
        return s;
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: targetSize.product_name,
        size: targetSize.size,
        type: 'STOCK_OUT',
        quantity: subBottles,
        unit: 'bottles',
        user: 'Admin',
        reference: stockForm.reference || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: stockForm.notes || `Dispatched to ${stockForm.customer || 'Customer'} (${stockForm.reason})`
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Stock Out recorded: -${subBottles} ${targetSize.product_name} (${targetSize.size})`);
      setModalType(null);

      // Directly update Supabase Database
      try {
        const client = getSupabase();
        if (client) {
          const numId = parseInt(targetSize.id, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').upsert({
              product_size_id: numId,
              available_bottles: newBottles,
              cartons: newCartons,
              total_sold: newSold
            }, { onConflict: 'product_size_id' });
          }

          await client.from('inventory_transactions').insert({
            id: `TXN-${Date.now()}`,
            transaction_type: 'Stock Out',
            item_type: 'Finished Product',
            item_name: targetSize.product_name,
            size_name: targetSize.size,
            quantity: subBottles,
            unit: 'bottles',
            reference_no: stockForm.reference || 'INV-AUTO',
            notes: newTx.notes,
            performed_by: 'Admin'
          });
        }
      } catch (err) {
        console.warn('Supabase stock out error:', err);
      }
    } else {
      const activeRawId = stockForm.rawMaterialId || rawMaterials[0]?.id;
      const targetRaw = rawMaterials.find(r => r.id === activeRawId) || rawMaterials[0];
      if (!targetRaw) {
        showToast('Error: Raw material not found');
        return;
      }

      const subRaw = parseFloat(stockForm.rawQty || 0);
      if (isNaN(subRaw) || subRaw <= 0) {
        alert('Please enter a valid issue quantity.');
        return;
      }

      // Validation: Stock cannot be negative
      if (targetRaw.quantity < subRaw) {
        alert(`Insufficient Raw Material Stock! Available: ${targetRaw.quantity} ${targetRaw.unit}. Requested: ${subRaw}. Stock negative nahi ho sakta.`);
        return;
      }

      const updatedQty = Math.max(0, targetRaw.quantity - subRaw);

      setRawMaterials(prev => prev.map(r => {
        if (r.id === targetRaw.id) {
          return {
            ...r,
            quantity: updatedQty,
            status: updatedQty <= 0 ? 'Out of Stock' : updatedQty <= r.minimum_stock ? 'Low Stock' : 'In Stock'
          };
        }
        return r;
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: targetRaw.name,
        size: '—',
        type: 'STOCK_OUT',
        quantity: subRaw,
        unit: targetRaw.unit,
        user: 'Admin',
        reference: stockForm.reference || `ISSUE-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: stockForm.notes || `Issued for production: -${subRaw} ${targetRaw.unit} to ${stockForm.customer || 'Production Floor'}`
      };
      setTransactions(prev => [newTx, ...prev]);
      showToast(`Stock Out recorded: -${subRaw} ${targetRaw.unit} ${targetRaw.name}`);
      setModalType(null);

      // Background Supabase Sync
      try {
        const client = getSupabase();
        if (client) {
          const isTSP = Boolean(targetRaw.unit && targetRaw.unit.includes('Bori'));
          await client.from('raw_materials').update({
            current_liters: isTSP ? 0 : updatedQty,
            bori_count: isTSP ? updatedQty : 0,
            status: updatedQty <= 0 ? 'Critical' : updatedQty <= targetRaw.minimum_stock ? 'Low Stock' : 'Adequate'
          }).eq('id', targetRaw.id);

          await client.from('inventory_transactions').insert({
            id: `TXN-${Date.now()}`,
            transaction_type: 'Stock Out',
            item_type: 'Raw Material',
            item_name: targetRaw.name,
            size_name: '-',
            quantity: subRaw,
            unit: targetRaw.unit,
            reference_no: stockForm.reference || 'ISSUE-AUTO',
            notes: newTx.notes,
            performed_by: 'Admin'
          });
        }
      } catch (err) {
        console.warn('Supabase sync skipped:', err);
      }
    }
  };

  // Handle Damage Management (Damaged stock excluded from available stock)
  const handleDamageSubmit = async (e) => {
    e.preventDefault();
    if (stockForm.itemType === 'STICKER') {
      const activeStkId = stockForm.stickerId || stickers[0]?.id;
      const targetSticker = stickers.find(s => String(s.id) === String(activeStkId));

      if (targetSticker) {
        const dmgStickers = parseInt(stockForm.stickerQty || 0, 10);
        if (isNaN(dmgStickers) || dmgStickers <= 0) {
          alert('Please enter a valid quantity of damaged stickers.');
          return;
        }

        if ((targetSticker.quantity || 0) < dmgStickers) {
          alert(`Cannot damage more than available stock! Available: ${(targetSticker.quantity || 0).toLocaleString()} ${targetSticker.unit || 'pcs'}. Requested: ${dmgStickers.toLocaleString()}.`);
          return;
        }

        const newStickers = Math.max(0, (targetSticker.quantity || 0) - dmgStickers);
        const newDmg = (targetSticker.damaged_quantity || 0) + dmgStickers;

        setStickers(prev => prev.map(s => {
          if (s.id === targetSticker.id) {
            return {
              ...s,
              quantity: newStickers,
              damaged_quantity: newDmg,
              status: newStickers <= 0 ? 'Out of Stock' : newStickers <= (s.minimum_stock || 100) ? 'Low Stock' : 'In Stock'
            };
          }
          return s;
        }));

        const newTx = {
          id: `tx-${Date.now()}`,
          date: new Date().toLocaleString(),
          item: targetSticker.name,
          size: targetSticker.size || '—',
          type: 'DAMAGE',
          quantity: dmgStickers,
          unit: targetSticker.unit || 'Pcs',
          user: 'Admin',
          reference: stockForm.reference || `DMG-${Math.floor(100 + Math.random() * 900)}`,
          notes: stockForm.notes || `Damaged / Wasted Stickers: ${dmgStickers} ${targetSticker.unit || 'pcs'} (${stockForm.reason || 'Torn / Misprint'})`
        };
        setTransactions([newTx, ...transactions]);
        showToast(`Damage recorded: ${dmgStickers} ${targetSticker.unit || 'pcs'} for ${targetSticker.name}`);
        setModalType(null);

        try {
          const client = getSupabase();
          if (client) {
            await client.from('stickers').update({
              quantity: newStickers,
              damaged_quantity: newDmg,
              status: newStickers <= 0 ? 'Out of Stock' : newStickers <= (targetSticker.minimum_stock || 100) ? 'Low Stock' : 'In Stock'
            }).eq('id', targetSticker.id);

            await client.from('inventory_transactions').insert({
              id: `TXN-${Date.now()}`,
              transaction_type: 'Damage',
              item_type: 'Stickers',
              item_name: targetSticker.name,
              size_name: targetSticker.size || '-',
              quantity: dmgStickers,
              unit: targetSticker.unit || 'Pcs',
              reference_no: stockForm.reference || 'DMG-AUTO',
              notes: newTx.notes,
              performed_by: 'Admin'
            });
          }
        } catch (err) {
          console.warn('Supabase sticker damage error:', err);
        }
        return;
      }

      // Legacy fallback
      const activeSizeId = stockForm.sizeId || productSizes[0]?.id;
      const targetSize = productSizes.find(s => String(s.id) === String(activeSizeId));
      if (!targetSize) return;

      const dmgStickers = parseInt(stockForm.stickerQty || 0, 10);
      if (isNaN(dmgStickers) || dmgStickers <= 0) {
        alert('Please enter a valid quantity of damaged stickers.');
        return;
      }

      if ((targetSize.sticker_quantity || 0) < dmgStickers) {
        alert(`Cannot damage more than available stock! Available: ${targetSize.sticker_quantity || 0} pcs. Requested: ${dmgStickers} pcs.`);
        return;
      }

      const newStickers = Math.max(0, (targetSize.sticker_quantity || 0) - dmgStickers);
      const newDmgStickers = (targetSize.damaged_stickers || 0) + dmgStickers;

      setProductSizes(prev => prev.map(s => {
        if (s.id === targetSize.id) {
          return {
            ...s,
            sticker_quantity: newStickers,
            damaged_stickers: newDmgStickers
          };
        }
        return s;
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: `${targetSize.product_name} (${targetSize.size}) Stickers`,
        size: targetSize.size,
        type: 'DAMAGE',
        quantity: dmgStickers,
        unit: 'Pcs',
        user: 'Admin',
        reference: stockForm.reference || `DMG-${Math.floor(100 + Math.random() * 900)}`,
        notes: stockForm.notes || `Damaged / Wasted Stickers: ${dmgStickers} pcs (${stockForm.reason || 'Torn / Misprint'})`
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Damage recorded: ${dmgStickers} pcs stickers for ${targetSize.product_name}`);
      setModalType(null);

      try {
        const client = getSupabase();
        if (client) {
          const numId = parseInt(targetSize.id, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').upsert({
              product_size_id: numId,
              stickers: newStickers,
              damaged_stickers: newDmgStickers
            }, { onConflict: 'product_size_id' });

            await client.from('inventory_transactions').insert({
              id: `TXN-${Date.now()}`,
              transaction_type: 'Damage',
              item_type: 'Stickers',
              item_name: `${targetSize.product_name} (${targetSize.size}) Stickers`,
              size_name: targetSize.size,
              quantity: dmgStickers,
              unit: 'Pcs',
              reference_no: stockForm.reference || 'DMG-AUTO',
              notes: newTx.notes,
              performed_by: 'Admin'
            });
          }
        }
      } catch (err) {
        console.warn('Supabase sticker damage error:', err);
      }
    } else if (stockForm.itemType === 'FINISHED') {
      const targetSize = productSizes.find(s => s.id === stockForm.sizeId);
      if (!targetSize) return;

      const dmgBottles = parseInt(stockForm.bottleQty || 0, 10);
      const dmgCartons = parseInt(stockForm.cartonQty || 0, 10);

      const newBottles = Math.max(0, targetSize.bottle_quantity - dmgBottles);
      const newCartons = Math.max(0, targetSize.carton_quantity - dmgCartons);
      const newDmgBottles = (targetSize.damaged_bottles || 0) + dmgBottles;
      const newDmgCartons = (targetSize.damaged_cartons || 0) + dmgCartons;

      setProductSizes(prev => prev.map(s => {
        if (s.id === targetSize.id) {
          return {
            ...s,
            bottle_quantity: newBottles,
            carton_quantity: newCartons,
            damaged_bottles: newDmgBottles,
            damaged_cartons: newDmgCartons
          };
        }
        return s;
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: targetSize.product_name,
        size: targetSize.size,
        type: 'DAMAGE',
        quantity: dmgBottles,
        unit: 'bottles',
        user: 'Admin',
        reference: stockForm.reference || `DMG-${Math.floor(100 + Math.random() * 900)}`,
        notes: stockForm.notes || `Damaged: ${dmgBottles} bottles, ${dmgCartons} cartons`
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Damage recorded & excluded from available stock: ${dmgBottles} bottles`);
      setModalType(null);

      // Directly update Supabase Database
      try {
        const client = getSupabase();
        if (client) {
          const numId = parseInt(targetSize.id, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').upsert({
              product_size_id: numId,
              available_bottles: newBottles,
              cartons: newCartons,
              damaged_bottles: newDmgBottles,
              damaged_cartons: newDmgCartons
            }, { onConflict: 'product_size_id' });
          }

          await client.from('inventory_transactions').insert({
            id: `TXN-${Date.now()}`,
            transaction_type: 'Damage',
            item_type: 'Finished Product',
            item_name: targetSize.product_name,
            size_name: targetSize.size,
            quantity: dmgBottles,
            unit: 'bottles',
            reference_no: stockForm.reference || 'DMG-AUTO',
            notes: newTx.notes,
            performed_by: 'Admin'
          });
        }
      } catch (err) {
        console.warn('Supabase damage error:', err);
      }
    } else {
      const targetRaw = rawMaterials.find(r => r.id === stockForm.rawMaterialId);
      if (!targetRaw) return;

      const dmgRaw = parseFloat(stockForm.rawQty || 0);
      const newQty = Math.max(0, targetRaw.quantity - dmgRaw);

      setRawMaterials(prev => prev.map(r => {
        if (r.id === targetRaw.id) {
          return {
            ...r,
            quantity: newQty,
            status: newQty <= 0 ? 'Out of Stock' : newQty <= r.minimum_stock ? 'Low Stock' : 'In Stock'
          };
        }
        return r;
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: targetRaw.name,
        size: '—',
        type: 'DAMAGE',
        quantity: dmgRaw,
        unit: targetRaw.unit,
        user: 'Admin',
        reference: stockForm.reference || `DMG-${Math.floor(100 + Math.random() * 900)}`,
        notes: stockForm.notes || `Wastage / Leakage: -${dmgRaw} ${targetRaw.unit}`
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Raw material damage/wastage recorded: -${dmgRaw} ${targetRaw.unit}`);
      setModalType(null);

      // Directly update Supabase Database
      try {
        const client = getSupabase();
        if (client) {
          const isTSP = Boolean(targetRaw.unit && targetRaw.unit.includes('Bori'));
          await client.from('raw_materials').update({
            current_liters: isTSP ? 0 : newQty,
            bori_count: isTSP ? newQty : 0,
            status: newQty <= 0 ? 'Critical' : newQty <= targetRaw.minimum_stock ? 'Low Stock' : 'Adequate'
          }).eq('id', targetRaw.id);

          await client.from('inventory_transactions').insert({
            id: `TXN-${Date.now()}`,
            transaction_type: 'Damage',
            item_type: 'Raw Material',
            item_name: targetRaw.name,
            size_name: '-',
            quantity: dmgRaw,
            unit: targetRaw.unit,
            reference_no: stockForm.reference || 'DMG-AUTO',
            notes: newTx.notes,
            performed_by: 'Admin'
          });
        }
      } catch (err) {
        console.warn('Supabase raw damage error:', err);
      }
    }
  };

  // Handle Returns (Restores available stock)
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    const targetSize = productSizes.find(s => s.id === stockForm.sizeId);
    if (!targetSize) return;

    const returnBottles = parseInt(stockForm.bottleQty || 0, 10);
    const newBottles = targetSize.bottle_quantity + returnBottles;
    const newReturned = (targetSize.returned_bottles || 0) + returnBottles;

    setProductSizes(prev => prev.map(s => {
      if (s.id === targetSize.id) {
        return {
          ...s,
          bottle_quantity: newBottles,
          returned_bottles: newReturned
        };
      }
      return s;
    }));

    const newTx = {
      id: `tx-${Date.now()}`,
      date: new Date().toLocaleString(),
      item: targetSize.product_name,
      size: targetSize.size,
      type: 'RETURN',
      quantity: returnBottles,
      unit: 'bottles',
      user: 'Admin',
      reference: stockForm.reference || `RET-${Math.floor(100 + Math.random() * 900)}`,
      notes: stockForm.notes || `Customer return restocked: +${returnBottles} bottles`
    };
    setTransactions([newTx, ...transactions]);
    showToast(`Return processed: +${returnBottles} ${targetSize.product_name} restocked`);
    setModalType(null);

    // Directly update Supabase Database
    try {
      const client = getSupabase();
      if (client) {
        const numId = parseInt(targetSize.id, 10);
        if (!isNaN(numId)) {
          await client.from('inventory').upsert({
            product_size_id: numId,
            available_bottles: newBottles,
            total_returned: newReturned
          }, { onConflict: 'product_size_id' });
        }

        await client.from('inventory_transactions').insert({
          id: `TXN-${Date.now()}`,
          transaction_type: 'Return',
          item_type: 'Finished Product',
          item_name: targetSize.product_name,
          size_name: targetSize.size,
          quantity: returnBottles,
          unit: 'bottles',
          reference_no: stockForm.reference || 'RET-AUTO',
          notes: newTx.notes,
          performed_by: 'Admin'
        });
      }
    } catch (err) {
      console.warn('Supabase return error:', err);
    }
  };

  // Handle Stock Adjustment
  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (stockForm.itemType === 'STICKER') {
      const activeStkId = stockForm.stickerId || stickers[0]?.id;
      const targetSticker = stickers.find(s => String(s.id) === String(activeStkId));

      if (targetSticker) {
        const physicalCount = parseInt(stockForm.stickerQty || 0, 10);
        const delta = physicalCount - (targetSticker.quantity || 0);

        setStickers(prev => prev.map(s => {
          if (s.id === targetSticker.id) {
            return {
              ...s,
              quantity: physicalCount,
              status: physicalCount <= 0 ? 'Out of Stock' : physicalCount <= (s.minimum_stock || 100) ? 'Low Stock' : 'In Stock'
            };
          }
          return s;
        }));

        const newTx = {
          id: `tx-${Date.now()}`,
          date: new Date().toLocaleString(),
          item: targetSticker.name,
          size: targetSticker.size || '—',
          type: 'ADJUSTMENT',
          quantity: Math.abs(delta),
          unit: targetSticker.unit || 'Pcs',
          user: 'Admin',
          reference: stockForm.reference || `ADJ-${Math.floor(100 + Math.random() * 900)}`,
          notes: stockForm.notes || `Sticker Audit: System ${targetSticker.quantity || 0} -> Physical ${physicalCount} (Diff: ${delta >= 0 ? '+' : ''}${delta}). Reason: ${stockForm.reason || 'Cycle count'}`
        };
        setTransactions([newTx, ...transactions]);
        showToast(`Stickers Adjusted: ${targetSticker.name} is now ${physicalCount.toLocaleString()} ${targetSticker.unit || 'pcs'}`);
        setModalType(null);

        try {
          const client = getSupabase();
          if (client) {
            await client.from('stickers').update({
              quantity: physicalCount,
              status: physicalCount <= 0 ? 'Out of Stock' : physicalCount <= (targetSticker.minimum_stock || 100) ? 'Low Stock' : 'In Stock'
            }).eq('id', targetSticker.id);

            await client.from('inventory_transactions').insert({
              id: `TXN-${Date.now()}`,
              transaction_type: 'Adjustment',
              item_type: 'Stickers',
              item_name: targetSticker.name,
              size_name: targetSticker.size || '-',
              quantity: Math.abs(delta),
              unit: targetSticker.unit || 'Pcs',
              reference_no: stockForm.reference || 'ADJ-AUTO',
              notes: newTx.notes,
              performed_by: 'Admin'
            });
          }
        } catch (err) {
          console.warn('Supabase sticker adjustment error:', err);
        }
        return;
      }

      // Legacy fallback
      const activeSizeId = stockForm.sizeId || productSizes[0]?.id;
      const targetSize = productSizes.find(s => String(s.id) === String(activeSizeId));
      if (!targetSize) return;

      const physicalCount = parseInt(stockForm.stickerQty || 0, 10);
      const delta = physicalCount - (targetSize.sticker_quantity || 0);

      setProductSizes(prev => prev.map(s => {
        if (s.id === targetSize.id) {
          return {
            ...s,
            sticker_quantity: physicalCount
          };
        }
        return s;
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: `${targetSize.product_name} (${targetSize.size}) Stickers`,
        size: targetSize.size,
        type: 'ADJUSTMENT',
        quantity: delta,
        unit: 'Pcs',
        user: 'Admin',
        reference: stockForm.reference || `ADJ-${Math.floor(100 + Math.random() * 900)}`,
        notes: `Sticker Adjustment: System ${targetSize.sticker_quantity || 0} -> Physical ${physicalCount} (Diff: ${delta}). Reason: ${stockForm.reason || 'Cycle count'}`
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Stickers Adjusted: ${targetSize.product_name} now set to ${physicalCount} pcs`);
      setModalType(null);

      try {
        const client = getSupabase();
        if (client) {
          const numId = parseInt(targetSize.id, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').upsert({
              product_size_id: numId,
              stickers: physicalCount
            }, { onConflict: 'product_size_id' });

            await client.from('inventory_transactions').insert({
              id: `TXN-${Date.now()}`,
              transaction_type: 'Adjustment',
              item_type: 'Stickers',
              item_name: `${targetSize.product_name} (${targetSize.size}) Stickers`,
              size_name: targetSize.size,
              quantity: delta,
              unit: 'Pcs',
              reference_no: stockForm.reference || 'ADJ-AUTO',
              notes: newTx.notes,
              performed_by: 'Admin'
            });
          }
        }
      } catch (err) {
        console.warn('Supabase sticker adjustment error:', err);
      }
    } else if (stockForm.itemType === 'FINISHED') {
      const targetSize = productSizes.find(s => s.id === stockForm.sizeId);
      if (!targetSize) return;

      const physicalCount = parseInt(stockForm.bottleQty || 0, 10);
      const delta = physicalCount - targetSize.bottle_quantity;

      setProductSizes(prev => prev.map(s => {
        if (s.id === targetSize.id) {
          return {
            ...s,
            bottle_quantity: physicalCount
          };
        }
        return s;
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: targetSize.product_name,
        size: targetSize.size,
        type: 'ADJUSTMENT',
        quantity: delta,
        unit: 'bottles',
        user: 'Admin',
        reference: stockForm.reference || `ADJ-${Math.floor(100 + Math.random() * 900)}`,
        notes: `Adjustment: System ${targetSize.bottle_quantity} -> Physical ${physicalCount} (Diff: ${delta}). Reason: ${stockForm.reason || 'Cycle count'}`
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Stock Adjusted: ${targetSize.product_name} now set to ${physicalCount} bottles`);
      setModalType(null);

      // Directly update Supabase Database
      try {
        const client = getSupabase();
        if (client) {
          const numId = parseInt(targetSize.id, 10);
          if (!isNaN(numId)) {
            await client.from('inventory').upsert({
              product_size_id: numId,
              available_bottles: physicalCount
            }, { onConflict: 'product_size_id' });
          }

          await client.from('inventory_transactions').insert({
            id: `TXN-${Date.now()}`,
            transaction_type: 'Adjustment',
            item_type: 'Finished Product',
            item_name: targetSize.product_name,
            size_name: targetSize.size,
            quantity: delta,
            unit: 'bottles',
            reference_no: stockForm.reference || 'ADJ-AUTO',
            notes: newTx.notes,
            performed_by: 'Admin'
          });
        }
      } catch (err) {
        console.warn('Supabase adjustment error:', err);
      }
    } else {
      const targetRaw = rawMaterials.find(r => r.id === stockForm.rawMaterialId);
      if (!targetRaw) return;

      const physicalCount = parseFloat(stockForm.rawQty || 0);
      const delta = physicalCount - targetRaw.quantity;

      setRawMaterials(prev => prev.map(r => {
        if (r.id === targetRaw.id) {
          return {
            ...r,
            quantity: physicalCount,
            status: physicalCount <= 0 ? 'Out of Stock' : physicalCount <= r.minimum_stock ? 'Low Stock' : 'In Stock'
          };
        }
        return r;
      }));

      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: targetRaw.name,
        size: '—',
        type: 'ADJUSTMENT',
        quantity: delta,
        unit: targetRaw.unit,
        user: 'Admin',
        reference: stockForm.reference || `ADJ-${Math.floor(100 + Math.random() * 900)}`,
        notes: `Raw Adjustment: System ${targetRaw.quantity} -> Physical ${physicalCount} (Diff: ${delta}). Reason: ${stockForm.reason || 'Tanker gauge'}`
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Stock Adjusted: ${targetRaw.name} now set to ${physicalCount} ${targetRaw.unit}`);
      setModalType(null);

      // Directly update Supabase Database
      try {
        const client = getSupabase();
        if (client) {
          const isTSP = Boolean(targetRaw.unit && targetRaw.unit.includes('Bori'));
          await client.from('raw_materials').update({
            current_liters: isTSP ? 0 : physicalCount,
            bori_count: isTSP ? physicalCount : 0,
            status: physicalCount <= 0 ? 'Critical' : physicalCount <= targetRaw.minimum_stock ? 'Low Stock' : 'Adequate'
          }).eq('id', targetRaw.id);

          await client.from('inventory_transactions').insert({
            id: `TXN-${Date.now()}`,
            transaction_type: 'Adjustment',
            item_type: 'Raw Material',
            item_name: targetRaw.name,
            size_name: '-',
            quantity: delta,
            unit: targetRaw.unit,
            reference_no: stockForm.reference || 'ADJ-AUTO',
            notes: newTx.notes,
            performed_by: 'Admin'
          });
        }
      } catch (err) {
        console.warn('Supabase raw adjustment error:', err);
      }
    }
  };

  // Add Finished Product (Section 16: Product Name, Category, Status + Sizes)
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProductForm.name) {
      alert('Please enter a product name');
      return;
    }

    const finalCategory = newProductForm.category === 'Custom Category...'
      ? (newProductForm.customCategory || 'General Products')
      : newProductForm.category;

    const newProdId = `prod-${Date.now()}`;
    const newProd = {
      id: newProdId,
      name: newProductForm.name,
      category: finalCategory,
      status: newProductForm.status || 'Available'
    };

    const sizesToUse = (newProductForm.sizes && newProductForm.sizes.length > 0)
      ? newProductForm.sizes
      : [
        { name: 'Small Bottle', bottlesPerCarton: '', purchasePrice: '', sellingPrice: '', minStock: '' },
        { name: 'Medium Bottle', bottlesPerCarton: '', purchasePrice: '', sellingPrice: '', minStock: '' },
        { name: 'Large Bottle', bottlesPerCarton: '', purchasePrice: '', sellingPrice: '', minStock: '' }
      ];

    let createdSizes = sizesToUse.map((s, idx) => {
      const defaultBpc = getBottlesPerCarton({
        name: s.name,
        product_name: newProductForm.name
      });
      const bpc = parseInt(s.bottlesPerCarton, 10) || defaultBpc;
      const pp = parseFloat(s.purchasePrice) || 0;
      const sp = parseFloat(s.sellingPrice) || 0;
      const minStock = parseInt(s.minStock, 10) || 0;
      const btls = parseInt(s.bottleQuantity || 0, 10);
      const ctns = s.cartonQuantity ? parseInt(s.cartonQuantity, 10) : Math.floor(btls / bpc);

      return {
        id: `size-${newProdId}-${idx}`,
        product_id: newProdId,
        product_name: newProductForm.name,
        size: s.name || `Size ${idx + 1}`,
        bottles_per_carton: bpc,
        purchase_price: pp,
        selling_price: sp,
        minimum_stock: minStock,
        reorder_level: minStock * 2,
        bottle_quantity: btls,
        carton_quantity: ctns,
        sticker_quantity: btls,
        damaged_bottles: 0,
        damaged_cartons: 0,
        damaged_stickers: 0
      };
    });

    setProducts(prev => [...prev, newProd]);
    setProductSizes(prev => [...prev, ...createdSizes]);
    showToast(`✅ Product "${newProductForm.name}" created with ${createdSizes.length} sizes in ${finalCategory}!`);
    setModalType(null);

    // Save directly to Supabase Cloud Database
    try {
      const client = getSupabase();
      if (client) {
        // 1. Insert product
        await client.from('products').insert({
          id: newProdId,
          name: newProductForm.name,
          category: finalCategory,
          status: 'Active'
        });

        // 2. Insert sizes & inventory
        for (let idx = 0; idx < sizesToUse.length; idx++) {
          const s = sizesToUse[idx];
          const defaultBpc = getBottlesPerCarton({
            name: s.name,
            product_name: newProductForm.name
          });
          const bpc = parseInt(s.bottlesPerCarton, 10) || defaultBpc;
          const pp = parseFloat(s.purchasePrice) || 0;
          const sp = parseFloat(s.sellingPrice) || 0;
          const minStock = parseInt(s.minStock, 10) || 0;
          const btls = parseInt(s.bottleQuantity || 0, 10);
          const ctns = s.cartonQuantity ? parseInt(s.cartonQuantity, 10) : Math.floor(btls / bpc);
          const sizeName = s.name || `Size ${idx + 1}`;

          let sRes = await client.from('product_sizes').insert({
            product_id: newProdId,
            size_name: sizeName,
            bottles_per_carton: bpc,
            purchase_price: pp,
            selling_price: sp,
            minimum_stock: minStock,
            reorder_level: minStock * 2
          }).select();

          // Fallback if check constraint restricts size_name to Small/Medium/Large
          if (sRes.error && sRes.error.code === '23514') {
            const fallbackName = idx === 0 ? 'Small' : idx === 1 ? 'Medium' : 'Large';
            sRes = await client.from('product_sizes').insert({
              product_id: newProdId,
              size_name: fallbackName,
              bottles_per_carton: bpc,
              purchase_price: pp,
              selling_price: sp,
              minimum_stock: minStock,
              reorder_level: minStock * 2
            }).select();
          }

          if (sRes.data && sRes.data[0]) {
            const realSizeId = sRes.data[0].id;
            setProductSizes(prev => prev.map(ps => ps.id === `size-${newProdId}-${idx}` ? { ...ps, id: String(realSizeId) } : ps));

            await client.from('inventory').insert({
              product_size_id: realSizeId,
              available_bottles: btls,
              cartons: ctns,
              stickers: btls,
              damaged_bottles: 0,
              damaged_cartons: 0,
              damaged_stickers: 0,
              total_sold: 0,
              total_returned: 0
            });

            if (btls > 0) {
              await client.from('inventory_transactions').insert({
                id: `TXN-${Date.now()}-${idx}`,
                transaction_type: 'Stock In',
                item_type: 'Finished Product',
                item_name: newProductForm.name,
                size_name: sizeName,
                quantity: btls,
                unit: 'bottles',
                reference_no: 'PO-INITIAL',
                notes: `Initial stock: +${ctns} Cartons (${btls} bottles)`,
                performed_by: 'Admin'
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase product creation error:', err);
    }
  };

  // Add Raw Material (Section 17)
  const handleAddRawSubmit = async (e) => {
    e.preventDefault();
    if (!newRawForm.name) return;

    const newRawId = `raw-${Date.now()}`;
    const newRaw = {
      id: newRawId,
      name: newRawForm.name,
      unit: newRawForm.unit,
      quantity: parseFloat(newRawForm.quantity || 0),
      minimum_stock: parseFloat(newRawForm.minimum_stock || 100),
      purchase_price: parseFloat(newRawForm.purchase_price || 0),
      weight_per_bori_kg: newRawForm.unit.includes('Bori') ? parseFloat(newRawForm.weight_per_bori_kg || 25) : 0,
      status: parseFloat(newRawForm.quantity || 0) <= 0 ? 'Out of Stock' : 'In Stock'
    };

    setRawMaterials(prev => [...prev, newRaw]);
    showToast(`Raw Material "${newRawForm.name}" added to inventory!`);
    setModalType(null);

    // Save directly to Supabase Cloud Database
    try {
      const client = getSupabase();
      if (client) {
        const isTSP = newRawForm.unit.includes('Bori');
        let unitToSave = newRawForm.unit;
        if (unitToSave.includes('Bori')) unitToSave = 'Bori + KG';
        else if (!['Liters', 'Bori + KG'].includes(unitToSave)) unitToSave = 'Liters';

        await client.from('raw_materials').insert({
          id: newRawId,
          name: newRawForm.name,
          unit: unitToSave,
          current_liters: isTSP ? 0 : newRaw.quantity,
          bori_count: isTSP ? newRaw.quantity : 0,
          loose_kg: 0,
          kg_per_bori: newRaw.weight_per_bori_kg || 25,
          unit_price: newRaw.purchase_price,
          minimum_stock: newRaw.minimum_stock,
          status: newRaw.quantity <= 0 ? 'Critical' : newRaw.quantity <= newRaw.minimum_stock ? 'Low Stock' : 'Adequate'
        });

        if (newRaw.quantity > 0) {
          await client.from('inventory_transactions').insert({
            id: `TXN-${Date.now()}`,
            transaction_type: 'Stock In',
            item_type: 'Raw Material',
            item_name: newRawForm.name,
            size_name: '-',
            quantity: newRaw.quantity,
            unit: newRawForm.unit,
            reference_no: 'PO-INITIAL',
            notes: `Initial raw material stock: +${newRaw.quantity} ${newRawForm.unit}`,
            performed_by: 'Admin'
          });
        }
      }
    } catch (err) {
      console.warn('Supabase raw insert error:', err);
    }
  };

  // Add Sticker to Inventory (Independent Category)
  const handleAddStickerSubmit = async (e) => {
    e.preventDefault();
    if (!newStickerForm.name.trim()) {
      alert('Please enter a sticker / label name.');
      return;
    }

    const initQty = parseInt(newStickerForm.quantity || 0, 10);
    const minStock = parseInt(newStickerForm.minimum_stock || 500, 10);
    const price = parseFloat(newStickerForm.purchase_price || 2.5);
    const newStkId = `stk-${Date.now()}`;

    const newSticker = {
      id: newStkId,
      name: newStickerForm.name.trim(),
      category: newStickerForm.category || 'General',
      size: newStickerForm.size || 'Standard',
      unit: newStickerForm.unit || 'Pcs',
      quantity: initQty,
      damaged_quantity: 0,
      purchase_price: price,
      minimum_stock: minStock,
      supplier: newStickerForm.supplier || 'Printing Press',
      status: initQty <= 0 ? 'Out of Stock' : initQty <= minStock ? 'Low Stock' : 'In Stock'
    };

    setStickers(prev => [...prev, newSticker]);
    showToast(`🏷️ Sticker "${newSticker.name}" added to inventory!`);
    setModalType(null);

    // Initial transaction log if initial quantity > 0
    if (initQty > 0) {
      const newTx = {
        id: `tx-${Date.now()}`,
        date: new Date().toLocaleString(),
        item: newSticker.name,
        size: newSticker.size,
        type: 'STOCK_IN',
        quantity: initQty,
        unit: newSticker.unit,
        user: 'Admin',
        reference: 'STK-INIT',
        notes: `Initial sticker stock added: +${initQty.toLocaleString()} ${newSticker.unit} @ Rs. ${price}/${newSticker.unit}`
      };
      setTransactions(prev => [newTx, ...prev]);
    }

    // Reset form
    setNewStickerForm({
      name: '',
      category: 'Sweep / Toilet Cleaner',
      size: '600ml Bottle',
      unit: 'Pcs',
      quantity: 0,
      minimum_stock: 500,
      purchase_price: 2.5,
      supplier: 'Printing Press',
      notes: ''
    });

    // Save directly to Supabase Database
    try {
      const client = getSupabase();
      if (client) {
        await client.from('stickers').insert({
          id: newStkId,
          name: newSticker.name,
          category: newSticker.category,
          size: newSticker.size,
          unit: newSticker.unit,
          quantity: initQty,
          damaged_quantity: 0,
          purchase_price: price,
          minimum_stock: minStock,
          supplier: newSticker.supplier,
          status: newSticker.status
        });

        if (initQty > 0) {
          await client.from('inventory_transactions').insert({
            id: `TXN-${Date.now()}`,
            transaction_type: 'Stock In',
            item_type: 'Stickers',
            item_name: newSticker.name,
            size_name: newSticker.size,
            quantity: initQty,
            unit: newSticker.unit,
            reference_no: 'STK-INIT',
            notes: `Initial stock: +${initQty} ${newSticker.unit} from ${newSticker.supplier}`,
            performed_by: 'Admin'
          });
        }
      }
    } catch (err) {
      console.warn('Supabase sticker insert error:', err);
    }
  };

  // Open Edit Product Size Modal
  const openEditSizeModal = (sizeObj) => {
    setEditSizeForm({
      id: sizeObj.id,
      productId: sizeObj.product_id,
      productName: sizeObj.product_name,
      sizeName: sizeObj.size,
      bottlesPerCarton: sizeObj.bottles_per_carton || getBottlesPerCarton(sizeObj),
      purchasePrice: sizeObj.purchase_price,
      sellingPrice: sizeObj.selling_price,
      minStock: sizeObj.minimum_stock,
      bottleQuantity: sizeObj.bottle_quantity || 0,
      cartonQuantity: sizeObj.carton_quantity || 0
    });
    setModalType('EDIT_SIZE');
  };

  // Submit Edit Product Size Form
  const handleEditSizeSubmit = async (e) => {
    e.preventDefault();
    if (!editSizeForm.id) return;

    const updatedProdName = editSizeForm.productName.trim() || 'Product';
    const updatedSizeName = editSizeForm.sizeName.trim() || 'Standard';
    const isSmallSweep = ((updatedProdName || '') + ' ' + (updatedSizeName || '')).toLowerCase().includes('sweep') &&
      (((updatedProdName || '') + ' ' + (updatedSizeName || '')).toLowerCase().includes('600') ||
        ((updatedProdName || '') + ' ' + (updatedSizeName || '')).toLowerCase().includes('small'));
    const defaultBpc = isSmallSweep ? 12 : 24;
    const bpc = parseInt(editSizeForm.bottlesPerCarton, 10) || defaultBpc;
    const pp = parseFloat(editSizeForm.purchasePrice) || 0;
    const sp = parseFloat(editSizeForm.sellingPrice) || 0;
    const minStock = parseInt(editSizeForm.minStock, 10) || 0;
    const btls = parseInt(editSizeForm.bottleQuantity || 0, 10);
    const ctns = editSizeForm.cartonQuantity !== '' && editSizeForm.cartonQuantity !== undefined
      ? parseInt(editSizeForm.cartonQuantity, 10)
      : Math.floor(btls / bpc);

    setProductSizes(prev => prev.map(s => {
      if (s.id === editSizeForm.id) {
        return {
          ...s,
          product_name: updatedProdName,
          size: updatedSizeName,
          bottles_per_carton: bpc,
          purchase_price: pp,
          selling_price: sp,
          minimum_stock: minStock,
          reorder_level: minStock * 2,
          bottle_quantity: btls,
          carton_quantity: ctns,
          sticker_quantity: btls
        };
      }
      return s;
    }));

    if (editSizeForm.productId) {
      setProducts(prev => prev.map(p => {
        if (p.id === editSizeForm.productId) {
          return { ...p, name: updatedProdName };
        }
        return p;
      }));
    }

    showToast(`✅ "${updatedProdName} - ${updatedSizeName}" updated successfully!`);
    setModalType(null);

    // Save directly to Supabase Database
    try {
      const client = getSupabase();
      if (client) {
        if (editSizeForm.productId) {
          await client.from('products').update({ name: updatedProdName }).eq('id', editSizeForm.productId);
        }

        const numId = parseInt(editSizeForm.id, 10);
        if (!isNaN(numId)) {
          const sRes = await client.from('product_sizes').update({
            size_name: updatedSizeName,
            bottles_per_carton: bpc,
            purchase_price: pp,
            selling_price: sp,
            minimum_stock: minStock,
            reorder_level: minStock * 2
          }).eq('id', numId);

          if (sRes.error && sRes.error.code === '23514') {
            await client.from('product_sizes').update({
              bottles_per_carton: bpc,
              purchase_price: pp,
              selling_price: sp,
              minimum_stock: minStock,
              reorder_level: minStock * 2
            }).eq('id', numId);
          }

          await client.from('inventory').upsert({
            product_size_id: numId,
            available_bottles: btls,
            cartons: ctns,
            stickers: btls
          }, { onConflict: 'product_size_id' });
        }
      }
    } catch (err) {
      console.warn('Supabase edit size error:', err);
    }
  };

  // Open Edit Raw Material Modal
  const openEditRawModal = (rawObj) => {
    setEditRawForm({
      id: rawObj.id,
      name: rawObj.name,
      unit: rawObj.unit,
      quantity: rawObj.quantity,
      minimum_stock: rawObj.minimum_stock,
      purchase_price: rawObj.purchase_price,
      weight_per_bori_kg: rawObj.weight_per_bori_kg || 25
    });
    setModalType('EDIT_RAW');
  };

  // Submit Edit Raw Material Form
  const handleEditRawSubmit = async (e) => {
    e.preventDefault();
    if (!editRawForm.id) return;

    const qty = parseFloat(editRawForm.quantity || 0);
    const minStock = parseFloat(editRawForm.minimum_stock || 100);
    const pp = parseFloat(editRawForm.purchase_price || 0);
    const boriKg = parseFloat(editRawForm.weight_per_bori_kg || 25);
    const updatedName = editRawForm.name.trim() || 'Raw Material';

    setRawMaterials(prev => prev.map(r => {
      if (r.id === editRawForm.id) {
        return {
          ...r,
          name: updatedName,
          unit: editRawForm.unit,
          quantity: qty,
          minimum_stock: minStock,
          purchase_price: pp,
          weight_per_bori_kg: editRawForm.unit.includes('Bori') ? boriKg : 0,
          status: qty <= 0 ? 'Out of Stock' : qty <= minStock ? 'Low Stock' : 'In Stock'
        };
      }
      return r;
    }));

    showToast(`✅ Raw material "${updatedName}" updated successfully!`);
    setModalType(null);

    // Save directly to Supabase Database
    try {
      const client = getSupabase();
      if (client) {
        const isTSP = editRawForm.unit.includes('Bori');
        let unitToSave = editRawForm.unit;
        if (unitToSave.includes('Bori')) unitToSave = 'Bori + KG';
        else if (!['Liters', 'Bori + KG'].includes(unitToSave)) unitToSave = 'Liters';

        await client.from('raw_materials').update({
          name: updatedName,
          unit: unitToSave,
          current_liters: isTSP ? 0 : qty,
          bori_count: isTSP ? qty : 0,
          kg_per_bori: isTSP ? boriKg : 25,
          unit_price: pp,
          minimum_stock: minStock,
          status: qty <= 0 ? 'Critical' : qty <= minStock ? 'Low Stock' : 'Adequate'
        }).eq('id', editRawForm.id);
      }
    } catch (err) {
      console.warn('Supabase edit raw error:', err);
    }
  };

  // Add Supplier (Section 28)
  const handleAddSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!newSupplierForm.name) return;

    const newSupId = `sup-${Date.now()}`;
    const newSup = {
      id: newSupId,
      name: newSupplierForm.name,
      company_name: newSupplierForm.company_name || newSupplierForm.name,
      phone: newSupplierForm.phone || '+92 300 0000000',
      email: newSupplierForm.email || 'info@supplier.com',
      address: newSupplierForm.address || 'Industrial Area',
      status: 'Active'
    };

    setSuppliers(prev => [...prev, newSup]);
    showToast(`Supplier "${newSupplierForm.company_name || newSupplierForm.name}" added!`);
    setNewSupplierForm({ name: '', company_name: '', phone: '', email: '', address: '' });

    // Save directly to Supabase Database
    try {
      const client = getSupabase();
      if (client) {
        await client.from('suppliers').insert({
          id: newSupId,
          name: newSup.company_name,
          contact_person: newSup.name,
          phone: newSup.phone,
          email: newSup.email,
          material_supplied: newSup.address
        });
      }
    } catch (err) {
      console.warn('Supabase add supplier error:', err);
    }
  };

  // Export CSV Report
  const exportCSVReport = () => {
    const headers = ['Category', 'Product / Material', 'Size / Unit', 'Available Qty', 'Cartons / Bori', 'Stickers', 'Purchase Price (Rs.)', 'Selling Price (Rs.)', 'Inventory Value (Rs.)', 'Status'];

    const finishedRows = productSizes.map(s => {
      const prod = products.find(p => p.id === s.product_id);
      const val = s.bottle_quantity * s.purchase_price;
      const status = s.bottle_quantity <= 0 ? 'Out of Stock' : s.bottle_quantity <= s.minimum_stock ? 'Low Stock' : 'Available';
      return [
        `"${prod?.category || 'Finished Goods'}"`,
        `"${s.product_name}"`,
        s.size,
        s.bottle_quantity,
        s.carton_quantity,
        s.sticker_quantity,
        s.purchase_price,
        s.selling_price,
        val,
        status
      ];
    });

    const rawRows = rawMaterials.map(r => {
      const val = r.unit.includes('Bori')
        ? (r.quantity * (r.weight_per_bori_kg || 25) * r.purchase_price)
        : (r.quantity * r.purchase_price);
      return [
        '"Raw Materials"',
        `"${r.name}"`,
        r.unit,
        r.quantity,
        r.unit.includes('Bori') ? `${r.quantity} Bori (${r.quantity * (r.weight_per_bori_kg || 25)} KG)` : '—',
        '—',
        r.purchase_price,
        '—',
        val,
        r.status
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...finishedRows.map(e => e.join(',')), ...rawRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `warehouse_inventory_valuation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inventory valuation report downloaded as CSV!');
  };

  // Fetch live tables from Supabase Cloud
  const fetchDataFromSupabase = async () => {
    try {
      const client = getSupabase();
      if (!client) {
        showToast('Supabase client not initialized');
        return;
      }

      // Check if raw_materials table exists
      const { data: rawData, error: rawError } = await client.from('raw_materials').select('*');
      if (rawError) {
        if (rawError.code === 'PGRST205') {
          showToast('Notice: Tables not found in Supabase yet. Please execute the SQL in Supabase SQL Editor.');
        } else {
          showToast(`Supabase: ${rawError.message}`);
        }
        setIsSupabaseWorking(false);
        return;
      }

      setIsSupabaseWorking(true);

      if (rawData && rawData.length > 0) {
        setRawMaterials(rawData.map(r => ({
          id: r.id,
          name: r.name,
          unit: r.unit,
          quantity: r.unit.includes('Bori') ? (r.bori_count || 0) : (r.current_liters || 0),
          minimum_stock: r.minimum_stock || 100,
          purchase_price: r.unit_price || 0,
          status: (r.unit.includes('Bori') ? (r.bori_count || 0) : (r.current_liters || 0)) <= 0 ? 'Out of Stock' : (r.unit.includes('Bori') ? (r.bori_count || 0) : (r.current_liters || 0)) <= (r.minimum_stock || 100) ? 'Low Stock' : 'In Stock',
          weight_per_bori_kg: r.kg_per_bori || 25
        })));
      } else {
        setRawMaterials([]);
      }

      // Fetch products and sizes
      const { data: prodData } = await client.from('products').select('*');
      setProducts(prodData || []);

      const { data: sizesData } = await client.from('product_sizes').select('*');
      const { data: invData } = await client.from('inventory').select('*');

      if (sizesData && sizesData.length > 0) {
        setProductSizes(sizesData.map(s => {
          const inv = invData?.find(i => i.product_size_id === s.id) || {};
          const prod = prodData?.find(p => p.id === s.product_id);
          const bpc = getBottlesPerCarton({
            ...s,
            product_name: prod ? prod.name : 'Product',
            size: s.size_name
          });
          return {
            id: String(s.id),
            product_id: s.product_id,
            product_name: prod ? prod.name : 'Product',
            size: s.size_name,
            bottles_per_carton: bpc,
            purchase_price: parseFloat(s.purchase_price || 0),
            selling_price: parseFloat(s.selling_price || 0),
            minimum_stock: s.minimum_stock || 50,
            reorder_level: s.reorder_level || 100,
            bottle_quantity: inv.available_bottles || 0,
            carton_quantity: inv.cartons || 0,
            sticker_quantity: inv.stickers || 0,
            damaged_bottles: inv.damaged_bottles || 0,
            damaged_cartons: inv.damaged_cartons || 0,
            damaged_stickers: inv.damaged_stickers || 0,
            issued_bottles: inv.total_sold || 0,
            returned_bottles: inv.total_returned || 0
          };
        }));
      } else {
        setProductSizes([]);
      }

      // Fetch suppliers
      const { data: supData } = await client.from('suppliers').select('*');
      setSuppliers(supData ? supData.map(sp => ({
        id: sp.id,
        name: sp.contact_person || sp.name,
        company_name: sp.name,
        phone: sp.phone || '',
        email: sp.email || '',
        address: sp.material_supplied || 'Packaging & Chemical Vendor',
        status: 'Active'
      })) : []);

      // Fetch transactions
      const { data: txData } = await client.from('inventory_transactions').select('*').order('created_at', { ascending: false }).limit(25);
      setTransactions(txData ? txData.map(t => ({
        id: t.id,
        date: new Date(t.created_at).toLocaleString(),
        item: t.item_name,
        size: t.size_name || '—',
        type: t.transaction_type.toUpperCase().replace(' ', '_'),
        quantity: t.quantity,
        unit: t.unit,
        user: t.performed_by || 'Admin',
        reference: t.reference_no || 'PO-AUTO',
        notes: t.notes || ''
      })) : []);

      showToast('✅ Live inventory synced from Supabase Cloud PostgreSQL!');
    } catch (err) {
      console.warn('Supabase fetch error:', err);
      showToast(`Supabase sync: ${err.message}`);
    }
  };

  // Seed the 5 factory chemicals into Supabase with 0 stock
  const seedCleanRawMaterialsToSupabase = async () => {
    try {
      const client = getSupabase();
      if (!client) {
        showToast('Supabase client not initialized');
        return;
      }
      const standardRawMaterials = [
        { id: 'raw-1', name: 'Hydrochloric Acid (HCL 33%)', unit: 'Liters', weight_per_bori_kg: 0, minimum_stock: 500 },
        { id: 'raw-2', name: 'Bleach Liquid (Sodium Hypochlorite)', unit: 'Liters', weight_per_bori_kg: 0, minimum_stock: 300 },
        { id: 'raw-3', name: 'Sulphonic Acid (LABSA 96%)', unit: 'Liters', weight_per_bori_kg: 0, minimum_stock: 200 },
        { id: 'raw-4', name: 'SLES Shampoo Base (Liquid)', unit: 'Liters', weight_per_bori_kg: 0, minimum_stock: 250 },
        { id: 'raw-5', name: 'Trisodium Phosphate (TSP Powder)', unit: 'Bori + KG', weight_per_bori_kg: 50, minimum_stock: 20 }
      ];
      for (const r of standardRawMaterials) {
        const isTSP = r.unit.includes('Bori');
        await client.from('raw_materials').upsert({
          id: r.id,
          name: r.name,
          unit: r.unit,
          current_liters: 0,
          bori_count: 0,
          loose_kg: 0,
          kg_per_bori: r.weight_per_bori_kg || 25,
          unit_price: 0,
          minimum_stock: r.minimum_stock || 100,
          status: 'Critical'
        });
      }
      showToast('✅ 5 Standard Factory Chemicals (HCL, Bleach, Sulphonic, Shampoo, TSP) initialized in Supabase with 0 stock!');
      await fetchDataFromSupabase();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Clear all application data (Reset to clean zero state)
  const clearAllData = async () => {
    if (!window.confirm('Reset all data in database and local cache? System will be fresh and clean.')) return;
    setProducts([]);
    setProductSizes([]);
    setSuppliers([]);
    setTransactions([]);
    setRawMaterials([]);
    try {
      localStorage.removeItem('wms_products');
      localStorage.removeItem('wms_productSizes');
      localStorage.removeItem('wms_rawMaterials');
      localStorage.removeItem('wms_suppliers');
      localStorage.removeItem('wms_transactions');

      const client = getSupabase();
      if (client) {
        await client.from('inventory_transactions').delete().neq('id', '');
        await client.from('inventory').delete().neq('id', 0);
        await client.from('product_sizes').delete().neq('id', 0);
        await client.from('products').delete().neq('id', '');
        await client.from('raw_materials').delete().neq('id', '');
        await client.from('suppliers').delete().neq('id', '');
      }
    } catch (e) {
      console.warn('Supabase clear error:', e);
    }
    showToast('✨ All data reset in Database! Fresh clean zero-stock baseline.');
  };

  const copySqlSchema = () => {
    const sql = `-- =========================================================================
-- WAREHOUSE INVENTORY MANAGEMENT SYSTEM (WMS)
-- Database Schema for Supabase PostgreSQL
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- UNLOCK CONSTRAINTS (If tables were created previously):
ALTER TABLE product_sizes DROP CONSTRAINT IF EXISTS product_sizes_size_name_check;
ALTER TABLE raw_materials DROP CONSTRAINT IF EXISTS raw_materials_unit_check;
ALTER TABLE raw_materials DROP CONSTRAINT IF EXISTS raw_materials_status_check;
ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_item_type_check;
ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;

DROP TABLE IF EXISTS stock_adjustments CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS product_sizes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS raw_materials CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- 1. FINISHED PRODUCTS TABLE (Strictly 4 fields: id, name, category, status)
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active'
);

-- 2. PRODUCT SIZES TABLE (Supports Any Custom Size Names)
CREATE TABLE product_sizes (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_name VARCHAR(100) NOT NULL,
    bottles_per_carton INT NOT NULL DEFAULT 24 CHECK (bottles_per_carton > 0),
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0),
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    minimum_stock INT NOT NULL DEFAULT 50 CHECK (minimum_stock >= 0),
    reorder_level INT NOT NULL DEFAULT 100 CHECK (reorder_level >= 0),
    CONSTRAINT unique_product_size UNIQUE (product_id, size_name)
);

-- 3. INVENTORY TABLE
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_size_id INT NOT NULL UNIQUE REFERENCES product_sizes(id) ON DELETE CASCADE,
    available_bottles INT NOT NULL DEFAULT 0 CHECK (available_bottles >= 0),
    cartons INT NOT NULL DEFAULT 0 CHECK (cartons >= 0),
    stickers INT NOT NULL DEFAULT 0 CHECK (stickers >= 0),
    damaged_bottles INT NOT NULL DEFAULT 0 CHECK (damaged_bottles >= 0),
    damaged_cartons INT NOT NULL DEFAULT 0 CHECK (damaged_cartons >= 0),
    damaged_stickers INT NOT NULL DEFAULT 0 CHECK (damaged_stickers >= 0),
    total_sold INT NOT NULL DEFAULT 0 CHECK (total_sold >= 0),
    total_returned INT NOT NULL DEFAULT 0 CHECK (total_returned >= 0),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RAW MATERIALS TABLE (HCL, Bleach, Sulphonic Oil, Shampoo Paste, TSP, etc.)
CREATE TABLE raw_materials (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(100) NOT NULL,
    current_liters NUMERIC(12, 2) DEFAULT 0.00 CHECK (current_liters >= 0),
    bori_count INT DEFAULT 0 CHECK (bori_count >= 0),
    loose_kg NUMERIC(12, 2) DEFAULT 0.00 CHECK (loose_kg >= 0),
    kg_per_bori NUMERIC(12, 2) DEFAULT 25.00 CHECK (kg_per_bori > 0),
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    minimum_stock NUMERIC(12, 2) NOT NULL DEFAULT 100.00 CHECK (minimum_stock >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Adequate'
);

-- 5. SUPPLIERS DIRECTORY
CREATE TABLE suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(100),
    material_supplied VARCHAR(255),
    rating NUMERIC(3, 1) DEFAULT 4.5
);

-- 6. INVENTORY TRANSACTIONS AUDIT LEDGER
CREATE TABLE inventory_transactions (
    id VARCHAR(50) PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    size_name VARCHAR(100),
    quantity NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reference_no VARCHAR(100),
    notes TEXT,
    performed_by VARCHAR(100) DEFAULT 'Warehouse Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DATABASE SECURITY POLICIES (RLS)

-- RLS POLICIES
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on products" ON products FOR ALL USING (true);

CREATE POLICY "Allow public read on product_sizes" ON product_sizes FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on product_sizes" ON product_sizes FOR ALL USING (true);

CREATE POLICY "Allow public read on inventory" ON inventory FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on inventory" ON inventory FOR ALL USING (true);

CREATE POLICY "Allow public read on raw_materials" ON raw_materials FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on raw_materials" ON raw_materials FOR ALL USING (true);

CREATE POLICY "Allow public read on suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on suppliers" ON suppliers FOR ALL USING (true);

CREATE POLICY "Allow public read on inventory_transactions" ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on inventory_transactions" ON inventory_transactions FOR ALL USING (true);
`;
    navigator.clipboard.writeText(sql);
    setIsCopiedSql(true);
    showToast('✅ Supabase SQL Schema copied to clipboard!');
    setTimeout(() => setIsCopiedSql(false), 2500);
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: '16px' }}>
        <div className="auth-logo-badge" style={{ animation: 'authSpin 1.8s linear infinite' }}>
          <Layers size={28} />
        </div>
        <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>Authenticating Velora WMS...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast('✅ Welcome to Velora WMS!');
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            zIndex: 9999,
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Layers size={22} />
          </div>
          <div>
            <div className="brand-title">Velora WMS</div>

          </div>
        </div>

        <nav className="nav-menu">
          <div className="nav-section-title">Core Sections</div>
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <Boxes size={18} />
            <span>Dashboard</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'finished' ? 'active' : ''}`}
            onClick={() => { setActiveTab('finished'); setMobileMenuOpen(false); }}
          >
            <Package size={18} />
            <span>Products</span>
            {lowStockFinished.length > 0 && (
              <span className="nav-badge danger">{lowStockFinished.length} Low</span>
            )}
          </div>

          <div
            className={`nav-item ${activeTab === 'cartons' ? 'active' : ''}`}
            onClick={() => { setActiveTab('cartons'); setMobileMenuOpen(false); }}
          >
            <Boxes size={18} />
            <span>Filled Cartons </span>
            {totalCartons > 0 && (
              <span className="nav-badge info">{totalCartons.toLocaleString()} Ctns</span>
            )}
          </div>

          <div
            className={`nav-item ${activeTab === 'stickers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('stickers'); setMobileMenuOpen(false); }}
          >
            <Tag size={18} />
            <span> Stickers Inventory</span>
            {lowStockStickers.length > 0 && (
              <span className="nav-badge danger">{lowStockStickers.length} Low</span>
            )}
          </div>

          <div
            className={`nav-item ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => { setActiveTab('raw'); setMobileMenuOpen(false); }}
          >
            <FlaskConical size={18} />
            <span>Raw Materials</span>
            {lowStockRaw.length > 0 && (
              <span className="nav-badge danger">{lowStockRaw.length} Low</span>
            )}
          </div>

          <div className="nav-section-title">Operations</div>
          <div
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('transactions'); setMobileMenuOpen(false); }}
          >
            <FileText size={18} />
            <span>Transactions History</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('suppliers'); setMobileMenuOpen(false); }}
          >
            <Building size={18} />
            <span>Suppliers Directory</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
          >
            <TrendingUp size={18} />
            <span>Reports & Valuation</span>
          </div>

          <div className="nav-section-title">Cloud Database</div>
          <div
            className={`nav-item ${activeTab === 'supabase' ? 'active' : ''}`}
            onClick={() => { setActiveTab('supabase'); setMobileMenuOpen(false); }}
          >
            <Database size={18} />
            <span>Supabase Cloud</span>
            <span className={`nav-badge ${isSupabaseWorking ? 'info' : 'danger'}`}>
              {isSupabaseWorking ? 'Live' : 'Config'}
            </span>
          </div>
        </nav>

        {/* Database Footer */}
        <div className="sidebar-footer">
          <div className="db-status-card" onClick={() => { setActiveTab('supabase'); setMobileMenuOpen(false); }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                Supabase Engine
              </span>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isSupabaseWorking ? '#059669' : '#d97706',
                  boxShadow: `0 0 6px ${isSupabaseWorking ? '#059669' : '#d97706'}`
                }}
              />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} style={{ color: isSupabaseWorking ? '#059669' : '#d97706' }} />
              <span>{isSupabaseWorking ? 'PostgreSQL Active' : 'ihbnnwdkggayj...'}</span>
            </div>
          </div>

          {currentUser && (
            <div className="sidebar-user-card">
              <div className="sidebar-user-left">
                <div className="user-avatar-circle" style={{ width: 30, height: 30, fontSize: '0.72rem' }}>
                  {(currentUser.user_metadata?.full_name || currentUser.email || 'Admin').substring(0, 2).toUpperCase()}
                </div>
                <div className="user-details-col">
                  <span className="user-display-name" style={{ fontSize: '0.78rem' }}>
                    {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                  </span>
                  <span className="user-role-pill" style={{ fontSize: '0.64rem' }}>
                    {currentUser.user_metadata?.role || 'Administrator'}
                  </span>
                </div>
              </div>
              <button
                className="sidebar-logout-icon-btn"
                onClick={handleLogout}
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="page-info">
              <h1 className="page-title">Warehouse Inventory Management</h1>
            </div>
          </div>

          <div className="topbar-actions">
            {/* Global Search */}
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search Product / Material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Quick Actions */}
            <button
              className="btn btn-emerald btn-sm"
              onClick={() => openStockInModal(activeTab === 'raw' ? 'RAW' : activeTab === 'stickers' ? 'STICKER' : 'FINISHED')}
              title="Add incoming stock (Raw Materials, Stickers, or Finished Goods)"
            >
              <Plus size={15} />
              <span>Stock In</span>
            </button>

            <button
              className="btn btn-danger btn-sm"
              onClick={() => openStockOutModal(activeTab === 'raw' ? 'RAW' : activeTab === 'stickers' ? 'STICKER' : 'FINISHED')}
              title="Issue stock (Raw Material consumption, Stickers, or Customer dispatch)"
            >
              <Minus size={15} />
              <span>Stock Out</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const isStk = activeTab === 'stickers';
                const isRaw = activeTab === 'raw';
                setStockForm({
                  itemType: isRaw ? 'RAW' : isStk ? 'STICKER' : 'FINISHED',
                  productId: products[0]?.id || '',
                  sizeId: productSizes[0]?.id || '',
                  rawMaterialId: rawMaterials[0]?.id || '',
                  bottleQty: productSizes[0]?.bottle_quantity || 0,
                  cartonQty: productSizes[0]?.carton_quantity || 0,
                  stickerQty: productSizes[0]?.sticker_quantity || 0,
                  rawQty: rawMaterials[0]?.quantity || 0,
                  purchasePrice: '',
                  supplier: '',
                  customer: '',
                  reference: `ADJ-${Math.floor(100 + Math.random() * 900)}`,
                  reason: 'Cycle Count Audit',
                  damageType: isRaw ? 'RAW' : isStk ? 'STICKER' : 'BOTTLE',
                  notes: ''
                });
                setModalType('ADJUSTMENT');
              }}
            >
              <SlidersHorizontal size={14} />
              <span>Adjust</span>
            </button>

            <button
              className="btn btn-amber btn-sm"
              onClick={() => {
                const isStk = activeTab === 'stickers';
                const isRaw = activeTab === 'raw';
                setStockForm({
                  itemType: isRaw ? 'RAW' : isStk ? 'STICKER' : 'FINISHED',
                  productId: products[0]?.id || '',
                  sizeId: productSizes[0]?.id || '',
                  rawMaterialId: rawMaterials[0]?.id || '',
                  bottleQty: 0,
                  cartonQty: 0,
                  stickerQty: 0,
                  rawQty: 0,
                  purchasePrice: '',
                  supplier: '',
                  customer: '',
                  reference: `DMG-${Math.floor(100 + Math.random() * 900)}`,
                  reason: isStk ? 'Torn Roll / Printing Defect' : 'Packaging Damage / Leakage',
                  damageType: isRaw ? 'RAW' : isStk ? 'STICKER' : 'BOTTLE',
                  notes: ''
                });
                setModalType('DAMAGE');
              }}
            >
              <AlertOctagon size={14} />
              <span>Damage</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
              onClick={handleClearAllData}
              title="Delete and reset all warehouse data"
            >
              <Trash2 size={14} />
              <span>Clear Data</span>
            </button>

            {/* User Profile Badge & Logout Button */}
            {currentUser && (
              <>
                <div className="topbar-user-badge">
                  <div className="user-avatar-circle">
                    {(currentUser.user_metadata?.full_name || currentUser.email || 'Admin').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="user-details-col">
                    <span className="user-display-name">
                      {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                    </span>
                    <span className="user-role-pill">
                      {currentUser.user_metadata?.role || 'Administrator'}
                    </span>
                  </div>
                </div>

                <button
                  className="topbar-logout-btn"
                  onClick={handleLogout}
                  title="Sign out of Velora WMS"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="content-body">
          {/* ========================================================
              VIEW 1: OVERVIEW DASHBOARD (Section 13, 14, 15, 25, 27, 40)
             ======================================================== */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Main 8 Metric Cards Grid (Section 13 & 40) */}
              <div className="kpi-grid-8">
                {/* 1. Total Products */}
                <div className="kpi-card" style={{ '--card-accent': '#0284c7' }}>
                  <div className="kpi-top">
                    <span className="kpi-title">Total Products</span>
                    <div className="kpi-icon-wrap" style={{ background: '#f0f9ff', color: '#0284c7' }}>
                      <Package size={18} />
                    </div>
                  </div>
                  <div className="kpi-value">{totalProductsCount}</div>
                  <div className="kpi-footer">
                    <span>Finished Product lines</span>
                  </div>
                </div>

                {/* 2. Total Bottles */}
                <div className="kpi-card" style={{ '--card-accent': '#2563eb' }}>
                  <div className="kpi-top">
                    <span className="kpi-title">Total Bottles</span>
                    <div className="kpi-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      <Boxes size={18} />
                    </div>
                  </div>
                  <div className="kpi-value">{totalBottles.toLocaleString()}</div>
                  <div className="kpi-footer">
                    <span>Small, Medium & Large</span>
                  </div>
                </div>

                {/* 3. Total Cartons */}
                <div className="kpi-card" style={{ '--card-accent': '#d97706' }}>
                  <div className="kpi-top">
                    <span className="kpi-title">Total Cartons</span>
                    <div className="kpi-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
                      <Package size={18} />
                    </div>
                  </div>
                  <div className="kpi-value">{totalCartons.toLocaleString()}</div>
                  <div className="kpi-footer">
                    <span>Available shipper cartons</span>
                  </div>
                </div>

                {/* 4. Total Stickers */}
                <div className="kpi-card" style={{ '--card-accent': '#7c3aed' }}>
                  <div className="kpi-top">
                    <span className="kpi-title">Total Stickers</span>
                    <div className="kpi-icon-wrap" style={{ background: '#faf5ff', color: '#7c3aed' }}>
                      <Tag size={18} />
                    </div>
                  </div>
                  <div className="kpi-value">{totalStickers.toLocaleString()}</div>
                  <div className="kpi-footer">
                    <span>Product front/back stickers</span>
                  </div>
                </div>

                {/* 5. Total Raw Materials */}
                <div className="kpi-card" style={{ '--card-accent': '#059669' }}>
                  <div className="kpi-top">
                    <span className="kpi-title">Raw Materials</span>
                    <div className="kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <FlaskConical size={18} />
                    </div>
                  </div>
                  <div className="kpi-value">{totalRawMaterialsCount}</div>
                  <div className="kpi-footer">
                    <span>Bulk chemicals & raw stock</span>
                  </div>
                </div>

                {/* 6. Total Inventory Value */}
                <div className="kpi-card" style={{ '--card-accent': '#0284c7' }}>
                  <div className="kpi-top">
                    <span className="kpi-title">Total Inventory Value</span>
                    <div className="kpi-icon-wrap" style={{ background: '#f0f9ff', color: '#0284c7' }}>
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div className="kpi-value">Rs. {totalInventoryValue.toLocaleString()}</div>
                  <div className="kpi-footer">
                    <span>Finished: Rs. {finishedInventoryValue.toLocaleString()}</span>
                  </div>
                </div>

                {/* 7. Low Stock Items */}
                <div className="kpi-card" style={{ '--card-accent': '#d97706' }}>
                  <div className="kpi-top">
                    <span className="kpi-title">Low Stock Items</span>
                    <div className="kpi-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
                      <AlertTriangle size={18} />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ color: totalLowStockCount > 0 ? '#d97706' : '#0f172a' }}>
                    {totalLowStockCount}
                  </div>
                  <div className="kpi-footer">
                    <span>Below minimum threshold</span>
                  </div>
                </div>

                {/* 8. Out of Stock Items */}
                <div className="kpi-card" style={{ '--card-accent': '#e11d48' }}>
                  <div className="kpi-top">
                    <span className="kpi-title">Out of Stock</span>
                    <div className="kpi-icon-wrap" style={{ background: '#fff1f2', color: '#e11d48' }}>
                      <XCircle size={18} />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ color: totalOutOfStockCount > 0 ? '#e11d48' : '#0f172a' }}>
                    {totalOutOfStockCount}
                  </div>
                  <div className="kpi-footer">
                    <span>Zero balance items</span>
                  </div>
                </div>
              </div>

              {/* FINISHED PRODUCTS DASHBOARD TABLE (Section 14 & 40) */}
              <div className="panel" id="finished-inventory-table">
                <div className="panel-header">
                  <div className="panel-title-group">
                    <Package size={20} style={{ color: '#0284c7' }} />
                    <div>
                      <h2 className="panel-title">Finished Products Inventory</h2>
                      <p className="panel-desc">Small, Medium, and Large bottle stock, cartons, stickers, purchase/selling price, and inventory value</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={exportCSVReport}>
                      <Download size={14} />
                      <span>Export CSV</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
                      onClick={handleClearAllData}
                      title="Delete and reset all warehouse data"
                    >
                      <Trash2 size={13} />
                      <span>Clear All Data</span>
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => openAddProductModal()}>
                      <Plus size={14} />
                      <span>New Product</span>
                    </button>
                  </div>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Category:</span>
                    <select
                      className="form-select"
                      style={{ padding: '5px 10px', fontSize: '0.82rem' }}
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="ALL">All Categories</option>
                      <option value="TOILET">🚽 Toilet Bottles</option>
                      <option value="DISHWASH">🍽️ Dishwash Bottles</option>
                      <option value="HARPIC">⚡ Harpic Bottles</option>
                      <option value="BLEACH">🧪 Bleach Bottles</option>
                      {[...new Set([
                        ...PRODUCT_CATEGORIES.map(c => c.label).filter(l => l !== 'Custom Category...'),
                        ...products.map(p => p.category)
                      ])].filter(Boolean).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Size:</span>
                    <select
                      className="form-select"
                      style={{ padding: '5px 10px', fontSize: '0.82rem' }}
                      value={sizeFilter}
                      onChange={(e) => setSizeFilter(e.target.value)}
                    >
                      <option value="ALL">All Sizes</option>
                      {[...new Set([
                        '600ml Bottle',
                        '1.2 Liter Bottle',
                        '500ml Bottle',
                        '4.5 Liter Can',
                        '250ml Bottle',
                        '1000ml Bottle',
                        ...productSizes.map(s => s.size)
                      ])].filter(Boolean).map(sz => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Status:</span>
                    <select
                      className="form-select"
                      style={{ padding: '5px 10px', fontSize: '0.82rem' }}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">All Status</option>
                      <option value="Available">Available</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Size</th>
                        <th>Bottles</th>
                        <th>Cartons</th>
                        <th>Purchase Price</th>
                        <th>Selling Price</th>
                        <th>Inventory Value</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProductSizes.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                            No finished products match the selected criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredProductSizes.map((s) => {
                          const val = s.bottle_quantity * s.purchase_price;
                          const potentialSales = s.bottle_quantity * s.selling_price;
                          const isLow = s.bottle_quantity > 0 && s.bottle_quantity <= s.minimum_stock;
                          const isOut = s.bottle_quantity <= 0;
                          const bpc = getBottlesPerCarton(s);
                          const cartonBottles = s.carton_quantity * bpc;

                          return (
                            <tr key={s.id}>
                              <td>
                                <strong style={{ color: '#0f172a' }}>{s.product_name}</strong>
                              </td>
                              <td>
                                <span className={`size-tag ${s.size.toLowerCase()}`}>{s.size}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: isOut ? '#e11d48' : isLow ? '#d97706' : '#0f172a' }}>
                                  {s.bottle_quantity.toLocaleString()}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                                  Min: {s.minimum_stock}
                                </span>
                              </td>
                              <td>
                                <span className="badge" style={{
                                  background: s.carton_quantity > 0 ? '#fef3c7' : '#f1f5f9',
                                  color: s.carton_quantity > 0 ? '#b45309' : '#64748b',
                                  border: s.carton_quantity > 0 ? '1px solid #fde68a' : '1px solid #cbd5e1',
                                  fontSize: '0.84rem',
                                  fontWeight: 800,
                                  padding: '4px 9px'
                                }}>
                                  📦 {s.carton_quantity.toLocaleString()} Cartons
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                                  ({cartonBottles.toLocaleString()} btls @ {bpc}/ctn)
                                </span>
                              </td>
                              <td>
                                <span style={{ color: '#475569' }}>Rs. {s.purchase_price.toFixed(2)}</span>
                              </td>
                              <td>
                                <span style={{ color: '#059669', fontWeight: 600 }}>Rs. {s.selling_price.toFixed(2)}</span>
                              </td>
                              <td>
                                <strong style={{ color: '#0284c7' }}>Rs. {val.toLocaleString()}</strong>
                                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                                  Sales: Rs. {potentialSales.toLocaleString()}
                                </span>
                              </td>
                              <td>
                                {isOut ? (
                                  <span className="badge badge-danger">Out of Stock</span>
                                ) : isLow ? (
                                  <span className="badge badge-warning">Low Stock</span>
                                ) : (
                                  <span className="badge badge-success">Available</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '4px' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '3px 7px', color: '#0284c7', borderColor: '#bae6fd', fontSize: '0.74rem' }}
                                    title="Edit Product, Size & Price Details"
                                    onClick={() => openEditSizeModal(s)}
                                  >
                                    <Pencil size={12} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    title="Stock In"
                                    onClick={() => {
                                      setStockForm(prev => ({
                                        ...prev,
                                        itemType: 'FINISHED',
                                        productId: s.product_id,
                                        sizeId: s.id
                                      }));
                                      setModalType('STOCK_IN');
                                    }}
                                  >
                                    <Plus size={13} />
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    title="Stock Out"
                                    onClick={() => {
                                      setStockForm(prev => ({
                                        ...prev,
                                        itemType: 'FINISHED',
                                        productId: s.product_id,
                                        sizeId: s.id
                                      }));
                                      setModalType('STOCK_OUT');
                                    }}
                                  >
                                    <Minus size={13} />
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '3px 7px', color: '#ef4444', borderColor: '#fecaca', fontSize: '0.74rem' }}
                                    title="Delete product size"
                                    onClick={() => handleDeleteProductSize(s.id)}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RAW MATERIALS DASHBOARD TABLE (Section 15 & 40) */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title-group">
                    <FlaskConical size={20} style={{ color: '#059669' }} />
                    <div>
                      <h2 className="panel-title">Raw Material Inventory</h2>
                      <p className="panel-desc">Liquid chemicals in Liters and bulk raw materials in Bori + KG</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-emerald btn-sm" onClick={() => openStockInModal('RAW')}>
                      <Plus size={14} />
                      <span>+ Stock In Raw Material</span>
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setModalType('ADD_RAW')}>
                      <Plus size={14} />
                      <span>New Material</span>
                    </button>
                  </div>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Raw Material</th>
                        <th>Quantity On Hand</th>
                        <th>Unit</th>
                        <th>Purchase Price</th>
                        <th>Inventory Value</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRawMaterials.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                            No raw materials registered yet. Click &quot;+ Stock In Raw Material&quot; or &quot;New Material&quot; to add raw materials.
                          </td>
                        </tr>
                      ) : (
                        filteredRawMaterials.map((r) => {
                          const isTSP = r.unit.includes('Bori');
                          const totalKg = isTSP ? (r.quantity * (r.weight_per_bori_kg || 25)) : 0;
                          const val = isTSP
                            ? (totalKg * r.purchase_price)
                            : (r.quantity * r.purchase_price);

                          const isLow = r.quantity > 0 && r.quantity <= r.minimum_stock;
                          const isOut = r.quantity <= 0;

                          return (
                            <tr key={r.id}>
                              <td>
                                <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{r.name}</strong>
                              </td>
                              <td>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color: isOut ? '#e11d48' : isLow ? '#d97706' : '#0f172a' }}>
                                  {r.quantity.toLocaleString()}
                                </span>
                                {isTSP && (
                                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                                    = {totalKg.toLocaleString()} KG (25 KG/Bori)
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className="code-badge">{r.unit}</span>
                              </td>
                              <td>
                                <span style={{ color: '#475569', fontWeight: 600 }}>
                                  Rs. {r.purchase_price.toFixed(2)} {isTSP ? '/ KG' : '/ L'}
                                </span>
                              </td>
                              <td>
                                <strong style={{ color: '#059669', fontSize: '0.95rem' }}>Rs. {val.toLocaleString()}</strong>
                              </td>
                              <td>
                                {isOut ? (
                                  <span className="badge badge-danger">Out of Stock</span>
                                ) : isLow ? (
                                  <span className="badge badge-warning">Low Stock</span>
                                ) : (
                                  <span className="badge badge-success">Available</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 9px', fontSize: '0.78rem', color: '#0284c7', borderColor: '#bae6fd' }}
                                    title="Edit Raw Material Details & Rates"
                                    onClick={() => openEditRawModal(r)}
                                  >
                                    <Pencil size={12} /> Edit
                                  </button>
                                  <button
                                    className="btn btn-emerald btn-sm"
                                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                    title="Add incoming stock to this raw material"
                                    onClick={() => openStockInModal('RAW', r.id)}
                                  >
                                    <Plus size={12} /> Stock In
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                    title="Issue raw material for production"
                                    onClick={() => openStockOutModal('RAW', r.id)}
                                  >
                                    <Minus size={12} /> Issue
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 8px', color: '#ef4444', borderColor: '#fecaca', fontSize: '0.78rem' }}
                                    title="Delete raw material"
                                    onClick={() => handleDeleteRawMaterial(r.id)}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LOW STOCK ITEMS & RECENT TRANSACTIONS (Section 25 & 27) */}
              <div className="dashboard-split-grid">
                {/* Low Stock Panel */}
                <div className="panel" style={{ margin: 0 }}>
                  <div className="panel-header">
                    <div className="panel-title-group">
                      <AlertTriangle size={18} style={{ color: '#d97706' }} />
                      <div>
                        <h3 className="panel-title">Low Stock Alert Panel</h3>
                        <p className="panel-desc">Items at or below safe minimum reorder points</p>
                      </div>
                    </div>
                  </div>

                  {totalLowStockCount === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#059669' }}>
                      <CheckCircle2 size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ fontWeight: 600 }}>All Finished Goods & Raw Materials are well stocked!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {lowStockFinished.map(s => (
                        <div
                          key={s.id}
                          style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.product_name} ({s.size})</div>
                            <span style={{ fontSize: '0.78rem', color: '#92400e' }}>
                              Current: <strong>{s.bottle_quantity}</strong> bottles | Minimum: <strong>{s.minimum_stock}</strong>
                            </span>
                          </div>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: '#d97706', color: '#b45309' }}
                            onClick={() => {
                              setStockForm(prev => ({ ...prev, itemType: 'FINISHED', productId: s.product_id, sizeId: s.id }));
                              setModalType('STOCK_IN');
                            }}
                          >
                            + Stock In
                          </button>
                        </div>
                      ))}

                      {lowStockRaw.map(r => (
                        <div
                          key={r.id}
                          style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.name} (Raw Material)</div>
                            <span style={{ fontSize: '0.78rem', color: '#92400e' }}>
                              Current: <strong>{r.quantity} {r.unit}</strong> | Minimum: <strong>{r.minimum_stock}</strong>
                            </span>
                          </div>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: '#d97706', color: '#b45309' }}
                            onClick={() => {
                              setStockForm(prev => ({ ...prev, itemType: 'RAW', rawMaterialId: r.id }));
                              setModalType('STOCK_IN');
                            }}
                          >
                            + Stock In
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Transactions Preview */}
                <div className="panel" style={{ margin: 0 }}>
                  <div className="panel-header">
                    <div className="panel-title-group">
                      <FileText size={18} style={{ color: '#0284c7' }} />
                      <div>
                        <h3 className="panel-title">Recent Stock Transactions</h3>
                        <p className="panel-desc">Audit history of Stock In, Stock Out, Returns & Damages</p>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('transactions')}>
                      View All
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {transactions.slice(0, 5).map(tx => (
                      <div
                        key={tx.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                            {tx.item} {tx.size !== '—' ? `(${tx.size})` : ''}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {tx.date} • Ref: {tx.reference}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span
                            className={`badge ${tx.type === 'STOCK_IN' || tx.type === 'RETURN'
                              ? 'badge-success'
                              : tx.type === 'STOCK_OUT'
                                ? 'badge-info'
                                : 'badge-danger'
                              }`}
                          >
                            {tx.type}
                          </span>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                            {tx.quantity} {tx.unit}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 2: FINISHED PRODUCTS DETAIL
             ======================================================== */}
          {activeTab === 'finished' && (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Finished Products & Sizes Master Table</h2>
                  <p className="panel-desc">Complete stock metrics for Small, Medium, and Large bottles with carton calculation</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => openAddProductModal()}>
                  <Plus size={14} />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Size</th>
                      <th>Bottles (Avail)</th>
                      <th>Bottles (Sold)</th>
                      <th>Cartons</th>
                      <th>Damaged</th>
                      <th>Purchase Price</th>
                      <th>Selling Price</th>
                      <th>Total Value</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSizes.length === 0 ? (
                      <tr>
                        <td colSpan="11" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                          No finished products registered yet. Click &quot;Add Product&quot; above to create one.
                        </td>
                      </tr>
                    ) : (
                      productSizes.map(s => {
                        const isLow = s.bottle_quantity > 0 && s.bottle_quantity <= s.minimum_stock;
                        const isOut = s.bottle_quantity <= 0;
                        return (
                          <tr key={s.id}>
                            <td><strong>{s.product_name}</strong></td>
                            <td><span className={`size-tag ${s.size.toLowerCase()}`}>{s.size}</span></td>
                            <td><strong style={{ color: isOut ? '#e11d48' : '#0f172a' }}>{s.bottle_quantity}</strong></td>
                            <td style={{ color: '#64748b' }}>{s.issued_bottles || 0}</td>
                            <td><strong>{s.carton_quantity}</strong> ({s.carton_quantity * getBottlesPerCarton(s)} btls)</td>
                            <td style={{ color: '#e11d48' }}>{s.damaged_bottles || 0}</td>
                            <td>Rs. {s.purchase_price}</td>
                            <td style={{ color: '#059669', fontWeight: 600 }}>Rs. {s.selling_price}</td>
                            <td><strong style={{ color: '#0284c7' }}>Rs. {(s.bottle_quantity * s.purchase_price).toLocaleString()}</strong></td>
                            <td>
                              {isOut ? <span className="badge badge-danger">Out of Stock</span> : isLow ? <span className="badge badge-warning">Low Stock</span> : <span className="badge badge-success">Available</span>}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', color: '#0284c7', borderColor: '#bae6fd', fontSize: '0.74rem' }}
                                title="Edit Product Size & Rates"
                                onClick={() => openEditSizeModal(s)}
                              >
                                <Pencil size={12} />
                                <span>Edit</span>
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', color: '#ef4444', borderColor: '#fecaca', fontSize: '0.74rem', marginLeft: '4px' }}
                                title="Delete Product Size"
                                onClick={() => handleDeleteProductSize(s.id)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW: FILLED CARTONS INVENTORY (بھرے ہوئے کارٹن)
             ======================================================== */}
          {activeTab === 'cartons' && (
            <FilledCartonsInventory
              productSizes={productSizes}
              products={products}
              onPackCartons={handlePackCartons}
              onDispatchCartons={handleDispatchCartons}
              onAdjustCartons={handleAdjustCartons}
              onOpenAddProduct={() => setModalType('ADD_PRODUCT')}
              showToast={showToast}
            />
          )}

          {/* ========================================================
              VIEW 3: RAW MATERIALS DETAIL
             ======================================================== */}
          {activeTab === 'raw' && (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Raw Materials Storage & Stock</h2>
                  <p className="panel-desc">Bulk chemical storage tracking in Liters and TSP in 25 KG Bori</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-emerald btn-sm" onClick={() => openStockInModal('RAW')}>
                    <Plus size={14} />
                    <span>+ Stock In Raw Material</span>
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setModalType('ADD_RAW')}>
                    <Plus size={14} />
                    <span>New Material</span>
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Material Name</th>
                      <th>Quantity</th>
                      <th>Unit of Measure</th>
                      <th>Minimum Threshold</th>
                      <th>Purchase Rate</th>
                      <th>Current Valuation</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawMaterials.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                          No raw materials registered yet. Click &quot;+ Stock In Raw Material&quot; or &quot;New Material&quot; to add raw materials.
                        </td>
                      </tr>
                    ) : (
                      rawMaterials.map(r => {
                        const isTSP = r.unit.includes('Bori');
                        const totalKg = isTSP ? (r.quantity * (r.weight_per_bori_kg || 25)) : 0;
                        const val = isTSP ? (totalKg * r.purchase_price) : (r.quantity * r.purchase_price);

                        return (
                          <tr key={r.id}>
                            <td><strong style={{ fontSize: '1rem', color: '#0f172a' }}>{r.name}</strong></td>
                            <td>
                              <strong style={{ fontSize: '1.05rem', color: r.status === 'Low Stock' ? '#d97706' : '#0f172a' }}>
                                {r.quantity.toLocaleString()}
                              </strong>
                              {isTSP && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total: {totalKg.toLocaleString()} KG</div>}
                            </td>
                            <td><span className="code-badge">{r.unit}</span></td>
                            <td>{r.minimum_stock} {r.unit}</td>
                            <td>Rs. {r.purchase_price} {isTSP ? '/ KG' : '/ L'}</td>
                            <td><strong style={{ color: '#059669', fontSize: '1rem' }}>Rs. {val.toLocaleString()}</strong></td>
                            <td>
                              <span className={`badge ${r.status === 'Low Stock' ? 'badge-warning' : 'badge-success'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  className="btn btn-emerald btn-sm"
                                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                  title="Add incoming stock to this raw material"
                                  onClick={() => openStockInModal('RAW', r.id)}
                                >
                                  <Plus size={12} /> Stock In
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                  title="Issue raw material for production"
                                  onClick={() => openStockOutModal('RAW', r.id)}
                                >
                                  <Minus size={12} /> Issue
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 8px', color: '#ef4444', borderColor: '#fecaca', fontSize: '0.78rem' }}
                                  title="Delete raw material"
                                  onClick={() => handleDeleteRawMaterial(r.id)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 3B: DEDICATED STICKERS & LABELS INVENTORY
             ======================================================== */}
          {activeTab === 'stickers' && (
            <div className="panel">
              <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={22} style={{ color: '#7c3aed' }} />
                    <span>Product Stickers & Branding Labels Inventory</span>
                  </h2>
                  <p className="panel-desc">Dedicated stock management for bottle roll stickers, branding labels, and packaging seals</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-emerald btn-sm" onClick={() => openStockInModal('STICKER')}>
                    <Plus size={14} />
                    <span>+ Stock In Stickers</span>
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => openStockOutModal('STICKER')}>
                    <Minus size={14} />
                    <span>- Issue Stickers</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setStockForm({
                        itemType: 'STICKER',
                        productId: products[0]?.id || '',
                        sizeId: productSizes[0]?.id || '',
                        rawMaterialId: '',
                        bottleQty: 0,
                        cartonQty: 0,
                        stickerQty: productSizes[0]?.sticker_quantity || 0,
                        rawQty: 0,
                        purchasePrice: 2.5,
                        supplier: '',
                        customer: '',
                        reference: `ADJ-${Math.floor(100 + Math.random() * 900)}`,
                        reason: 'Physical Sticker Count Audit',
                        damageType: 'STICKER',
                        notes: ''
                      });
                      setModalType('ADJUSTMENT');
                    }}
                  >
                    <SlidersHorizontal size={14} />
                    <span>Adjust</span>
                  </button>
                  <button
                    className="btn btn-amber btn-sm"
                    onClick={() => {
                      setStockForm({
                        itemType: 'STICKER',
                        productId: products[0]?.id || '',
                        sizeId: productSizes[0]?.id || '',
                        rawMaterialId: '',
                        bottleQty: 0,
                        cartonQty: 0,
                        stickerQty: 0,
                        rawQty: 0,
                        purchasePrice: 2.5,
                        supplier: '',
                        customer: '',
                        reference: `DMG-${Math.floor(100 + Math.random() * 900)}`,
                        reason: 'Torn Stickers / Roll Defect',
                        damageType: 'STICKER',
                        notes: ''
                      });
                      setModalType('DAMAGE');
                    }}
                  >
                    <AlertOctagon size={14} />
                    <span>Damage</span>
                  </button>
                </div>
              </div>

              {/* Stickers Category KPI Metrics Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#7c3aed' }}>
                    Total Available Stickers
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#581c87', marginTop: '4px' }}>
                    {totalStickers.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Pcs</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#6b21a8' }}>
                    Across {productSizes.length} product bottle SKUs
                  </div>
                </div>

                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#1d4ed8' }}>
                    Active Sticker Types
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>
                    {productSizes.length} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>SKUs</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#1e40af' }}>
                    Roll labels & stickers registered
                  </div>
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#b45309' }}>
                    Low Stock Alerts
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#78350f', marginTop: '4px' }}>
                    {lowStockStickers.length} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Item(s)</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#92400e' }}>
                    Below minimum buffer threshold
                  </div>
                </div>

                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#dc2626' }}>
                    Damaged / Wasted
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#991b1b', marginTop: '4px' }}>
                    {totalDamagedStickers.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Pcs</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#b91c1c' }}>
                    Excluded from active stock
                  </div>
                </div>
              </div>

              {/* Stickers Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sticker / Label Name</th>
                      <th>Target Product</th>
                      <th>Bottle Size</th>
                      <th>Available Stickers</th>
                      <th>Damaged / Wasted</th>
                      <th>Min Alert Buffer</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSizes.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                          No product sizes registered yet. Create products first to track their stickers.
                        </td>
                      </tr>
                    ) : (
                      productSizes.map(s => {
                        const isLow = (s.sticker_quantity || 0) > 0 && (s.sticker_quantity || 0) <= (s.minimum_stock || 100);
                        const isOut = (s.sticker_quantity || 0) <= 0;
                        return (
                          <tr key={s.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  background: '#faf5ff',
                                  color: '#7c3aed',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <Tag size={15} />
                                </div>
                                <div>
                                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                                    {s.product_name} Label
                                  </strong>
                                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                    Front & Back Bottle Sticker
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: '#334155' }}>{s.product_name}</span>
                            </td>
                            <td>
                              <span className={`size-tag ${s.size.toLowerCase()}`}>{s.size}</span>
                            </td>
                            <td>
                              <strong style={{
                                fontSize: '1.05rem',
                                color: isOut ? '#e11d48' : isLow ? '#d97706' : '#0f172a'
                              }}>
                                {(s.sticker_quantity || 0).toLocaleString()} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Pcs</span>
                              </strong>
                            </td>
                            <td>
                              <span style={{ color: (s.damaged_stickers || 0) > 0 ? '#e11d48' : '#94a3b8', fontWeight: 600 }}>
                                {(s.damaged_stickers || 0).toLocaleString()} Pcs
                              </span>
                            </td>
                            <td>
                              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                {s.minimum_stock || 100} Pcs
                              </span>
                            </td>
                            <td>
                              {isOut ? (
                                <span className="badge badge-danger">Out of Stock</span>
                              ) : isLow ? (
                                <span className="badge badge-warning">Low Stock</span>
                              ) : (
                                <span className="badge badge-success">In Stock</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '4px' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '3px 7px', color: '#059669', borderColor: '#a7f3d0', fontSize: '0.74rem' }}
                                  title="Stock In Stickers"
                                  onClick={() => openStockInModal('STICKER', s.id)}
                                >
                                  <Plus size={12} /> In
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '3px 7px', color: '#d97706', borderColor: '#fde68a', fontSize: '0.74rem' }}
                                  title="Issue Stickers to Production"
                                  onClick={() => openStockOutModal('STICKER', s.id)}
                                >
                                  <Minus size={12} /> Issue
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '3px 7px', color: '#e11d48', borderColor: '#fecaca', fontSize: '0.74rem' }}
                                  title="Record Damaged Stickers"
                                  onClick={() => {
                                    setStockForm({
                                      itemType: 'STICKER',
                                      productId: s.product_id,
                                      sizeId: s.id,
                                      rawMaterialId: '',
                                      bottleQty: 0,
                                      cartonQty: 0,
                                      stickerQty: 0,
                                      rawQty: 0,
                                      purchasePrice: 2.5,
                                      supplier: '',
                                      customer: '',
                                      reference: `DMG-${Math.floor(100 + Math.random() * 900)}`,
                                      reason: 'Torn / Misprint Stickers',
                                      damageType: 'STICKER',
                                      notes: ''
                                    });
                                    setModalType('DAMAGE');
                                  }}
                                >
                                  <AlertOctagon size={12} /> Damage
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 4: TRANSACTIONS HISTORY (Section 27 & 40)
             ======================================================== */}
          {activeTab === 'transactions' && (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Inventory Transaction History & Audit Ledger</h2>
                  <p className="panel-desc">Immutable history of Stock In, Stock Out, Returns, Damages, and Physical Adjustments</p>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Item Description</th>
                      <th>Size</th>
                      <th>Transaction Type</th>
                      <th>Quantity</th>
                      <th>Operator / User</th>
                      <th>Reference #</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id}>
                        <td><span style={{ fontSize: '0.78rem', color: '#64748b' }}>{tx.date}</span></td>
                        <td><strong>{tx.item}</strong></td>
                        <td>{tx.size !== '—' ? <span className="size-tag small">{tx.size}</span> : '—'}</td>
                        <td>
                          <span className={`badge ${tx.type === 'STOCK_IN' || tx.type === 'RETURN' ? 'badge-success' :
                            tx.type === 'STOCK_OUT' ? 'badge-info' : 'badge-danger'
                            }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td><strong>{tx.quantity} {tx.unit}</strong></td>
                        <td>{tx.user}</td>
                        <td><span className="code-badge">{tx.reference}</span></td>
                        <td style={{ fontSize: '0.8rem', color: '#475569' }}>{tx.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 5: SUPPLIERS DIRECTORY (Section 28)
             ======================================================== */}
          {activeTab === 'suppliers' && (
            <div className="suppliers-layout-grid">
              <div className="panel" style={{ margin: 0 }}>
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Approved Packaging & Chemical Suppliers</h2>
                    <p className="panel-desc">Vendor partners for bottles, cartons, stickers, and bulk raw materials</p>
                  </div>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Company Name</th>
                        <th>Contact Person</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map(sup => (
                        <tr key={sup.id}>
                          <td><strong>{sup.company_name}</strong></td>
                          <td>{sup.name}</td>
                          <td>{sup.phone}</td>
                          <td>{sup.email}</td>
                          <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{sup.address}</td>
                          <td><span className="badge badge-success">{sup.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Supplier Form */}
              <div className="panel" style={{ margin: 0 }}>
                <h3 className="panel-title" style={{ marginBottom: '14px' }}>Add New Supplier</h3>
                <form onSubmit={handleAddSupplierSubmit}>
                  <div className="form-group">
                    <label className="form-label">Contact Person Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Tariq Mehmood"
                      value={newSupplierForm.name}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company / Factory Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. National Blow Moulding"
                      value={newSupplierForm.company_name}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, company_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+92 300 1234567"
                      value={newSupplierForm.phone}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="supplier@domain.com"
                      value={newSupplierForm.email}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address / Location</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Plot 45, Industrial Zone"
                      value={newSupplierForm.address}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, address: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    Save Supplier
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 6: REPORTS & VALUATION (Section 30)
             ======================================================== */}
          {activeTab === 'reports' && (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Warehouse Inventory Valuation & Reports</h2>
                  <p className="panel-desc">Audit financial statements and physical asset valuation in PKR / Rs.</p>
                </div>
                <button className="btn btn-emerald btn-sm" onClick={exportCSVReport}>
                  <Download size={14} />
                  <span>Export Full CSV Report</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '18px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 700 }}>FINISHED GOODS VALUATION</span>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    Rs. {finishedInventoryValue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                    Across {totalBottles.toLocaleString()} available bottles
                  </div>
                </div>

                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '18px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 700 }}>RAW MATERIALS VALUATION</span>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    Rs. {rawInventoryValue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                    Chemicals (Liters) + TSP Bori & KG
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700 }}>TOTAL WAREHOUSE ASSETS</span>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                    Rs. {totalInventoryValue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                    Current purchase cost basis
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 7: SUPABASE CLOUD STUDIO (Section 31-37)
             ======================================================== */}
          {activeTab === 'supabase' && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <Database size={22} style={{ color: '#059669' }} />
                  <div>
                    <h2 className="panel-title">Supabase Cloud Database Integration</h2>
                    <p className="panel-desc">Connected to project: https://ihbnnwdkggayjyxazpkc.supabase.co</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-emerald btn-sm"
                    onClick={fetchDataFromSupabase}
                    title="Load live data from Supabase Cloud"
                  >
                    <RefreshCw size={14} />
                    <span>Sync Cloud Data</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={copySqlSchema}
                    style={{ borderColor: isCopiedSql ? '#059669' : undefined }}
                  >
                    {isCopiedSql ? <Check size={14} style={{ color: '#059669' }} /> : <Copy size={14} />}
                    <span>{isCopiedSql ? 'Copied to Clipboard!' : 'Copy Supabase SQL'}</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: isSupabaseWorking ? '#ecfdf5' : '#fffbeb',
                  border: `1px solid ${isSupabaseWorking ? '#a7f3d0' : '#fde68a'}`,
                  marginBottom: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <strong style={{ color: isSupabaseWorking ? '#065f46' : '#92400e', fontSize: '0.95rem' }}>
                    {isSupabaseWorking ? '✓ Live Supabase PostgreSQL Connected & Synced' : '⚠️ Supabase Connected — Tables Pending Initial Creation'}
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '3px' }}>
                    URL: <code>{supabaseUrl}</code> | API Key: <code>{supabaseKey.slice(0, 16)}...</code>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href="https://supabase.com/dashboard/project/ihbnnwdkggayjyxazpkc/sql"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <span>Open Supabase SQL Editor</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Setup Instructions */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px', marginBottom: '22px' }}>
                <h4 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  Supabase Setup — 3 Simple Steps:
                </h4>
                <ol style={{ paddingLeft: '20px', fontSize: '0.88rem', color: '#334155', lineHeight: '1.8' }}>
                  <li>Click the <strong>"Copy Supabase SQL"</strong> button above (or open <code>supabase_schema.sql</code> in your workspace).</li>
                  <li>Click <strong>"Open Supabase SQL Editor"</strong> to visit <a href="https://supabase.com/dashboard/project/ihbnnwdkggayjyxazpkc/sql" target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 700 }}>Supabase SQL Editor</a>.</li>
                  <li>Paste the SQL and click <strong>RUN</strong>. This creates all 6 tables (<code>products</code>, <code>product_sizes</code>, <code>raw_materials</code>, <code>inventory</code>, <code>suppliers</code>, <code>inventory_transactions</code>) with RLS security policies and initial seed records!</li>
                  <li>After running, click <strong>"Sync Cloud Data"</strong> button above to immediately pull the live database rows into the application.</li>
                </ol>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          MODAL: STOCK IN (Section 18) - Full Raw Material & Finished Goods Support
         ======================================================== */}
      {modalType === 'STOCK_IN' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {stockForm.itemType === 'RAW'
                    ? '🧪 Raw Material Stock In (Chemicals / TSP)'
                    : stockForm.itemType === 'STICKER'
                      ? '🏷️ Product Stickers & Labels Stock In'
                      : '📦 Finished Product Stock In'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  {stockForm.itemType === 'RAW'
                    ? 'Receive bulk raw chemical tankers or TSP bori directly into warehouse inventory'
                    : stockForm.itemType === 'STICKER'
                      ? 'Receive bottle branding labels, roll stickers, and packaging seals'
                      : 'Receive finished goods bottles and packaging cartons'}
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleStockInSubmit}>
              <div className="modal-body">
                {/* Category Selector Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: stockForm.itemType === 'RAW' ? '2px solid #059669' : '1px solid #cbd5e1',
                      background: stockForm.itemType === 'RAW' ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => {
                      const chosenRaw = rawMaterials.find(r => String(r.id) === String(stockForm.rawMaterialId)) || rawMaterials[0] || null;
                      setStockForm(prev => ({
                        ...prev,
                        itemType: 'RAW',
                        rawMaterialId: chosenRaw?.id || '',
                        purchasePrice: chosenRaw?.purchase_price !== undefined ? chosenRaw.purchase_price : prev.purchasePrice
                      }));
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: stockForm.itemType === 'RAW' ? '#059669' : '#f1f5f9',
                      color: stockForm.itemType === 'RAW' ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FlaskConical size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: stockForm.itemType === 'RAW' ? '#065f46' : '#1e293b' }}>
                        🧪 Raw Material
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Bulk Chemicals
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: stockForm.itemType === 'FINISHED' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: stockForm.itemType === 'FINISHED' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => {
                      const chosenSize = productSizes.find(s => String(s.id) === String(stockForm.sizeId)) || productSizes[0] || null;
                      setStockForm(prev => ({
                        ...prev,
                        itemType: 'FINISHED',
                        sizeId: chosenSize?.id || '',
                        purchasePrice: chosenSize?.purchase_price !== undefined ? chosenSize.purchase_price : prev.purchasePrice
                      }));
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: stockForm.itemType === 'FINISHED' ? '#0284c7' : '#f1f5f9',
                      color: stockForm.itemType === 'FINISHED' ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Package size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: stockForm.itemType === 'FINISHED' ? '#0369a1' : '#1e293b' }}>
                        📦 Finished Goods
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Bottles & Cartons
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: stockForm.itemType === 'STICKER' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                      background: stockForm.itemType === 'STICKER' ? '#faf5ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => {
                      const chosenSize = productSizes.find(s => String(s.id) === String(stockForm.sizeId)) || productSizes[0] || null;
                      setStockForm(prev => ({
                        ...prev,
                        itemType: 'STICKER',
                        sizeId: chosenSize?.id || '',
                        stickerQty: 500,
                        purchasePrice: 2.5
                      }));
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: stockForm.itemType === 'STICKER' ? '#7c3aed' : '#f1f5f9',
                      color: stockForm.itemType === 'STICKER' ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Tag size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: stockForm.itemType === 'STICKER' ? '#581c87' : '#1e293b' }}>
                        🏷️ Stickers
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Branding Labels
                      </div>
                    </div>
                  </button>
                </div>

                {stockForm.itemType === 'STICKER' ? (
                  <div>
                    {/* Active Sticker Live Balance Card */}
                    {(() => {
                      const curSize = productSizes.find(s => String(s.id) === String(stockForm.sizeId || productSizes[0]?.id)) || productSizes[0];
                      if (!curSize) return null;
                      const incomingStk = parseInt(stockForm.stickerQty || 0, 10);
                      const expectedTotal = (curSize.sticker_quantity || 0) + (isNaN(incomingStk) ? 0 : incomingStk);

                      return (
                        <div style={{
                          background: '#faf5ff',
                          border: '1px solid #e9d5ff',
                          borderRadius: '10px',
                          padding: '14px 16px',
                          marginBottom: '16px',
                          display: 'grid',
                          gridTemplateColumns: '1.2fr 1fr',
                          gap: '12px'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#7c3aed' }}>
                              Selected Sticker SKU & Current Stock
                            </span>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                              {curSize.product_name} ({curSize.size})
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: 700 }}>
                              Current Balance: {(curSize.sticker_quantity || 0).toLocaleString()} Pcs
                            </div>
                          </div>

                          <div style={{
                            background: '#f3e8ff',
                            border: '1px solid #d8b4fe',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            textAlign: 'right'
                          }}>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: '#6b21a8' }}>
                              Sticker Balance After Entry
                            </span>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#6b21a8' }}>
                              {expectedTotal.toLocaleString()} Pcs
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#7c3aed' }}>
                              Rate: Rs. {stockForm.purchasePrice || 2.5} / Pc
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label className="form-label">Select Target Product Sticker SKU</label>
                        <select
                          className="form-select"
                          value={stockForm.sizeId || (productSizes[0]?.id || '')}
                          onChange={(e) => setStockForm({ ...stockForm, sizeId: e.target.value })}
                        >
                          {productSizes.length === 0 ? (
                            <option value="" disabled>-- ⚠️ No Products Available --</option>
                          ) : (
                            <>
                              <option value="">-- Choose Product Sticker --</option>
                              {productSizes.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.product_name} — {s.size} Labels (Current Stock: {(s.sticker_quantity || 0).toLocaleString()} pcs)
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ color: '#7c3aed', fontWeight: 800 }}>
                          🏷️ Sticker Quantity to Add (Pcs)
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          className="form-input"
                          style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7c3aed', borderColor: '#d8b4fe', background: '#faf5ff' }}
                          value={stockForm.stickerQty}
                          onChange={(e) => setStockForm({ ...stockForm, stickerQty: e.target.value })}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                          Total stickers or labels received from printer
                        </span>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Unit Printing Rate (Rs. / Sticker)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input"
                          value={stockForm.purchasePrice}
                          placeholder="e.g. 2.50"
                          onChange={(e) => setStockForm({ ...stockForm, purchasePrice: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Printing Press / Supplier</label>
                        <select
                          className="form-select"
                          value={stockForm.supplier}
                          onChange={(e) => setStockForm({ ...stockForm, supplier: e.target.value })}
                        >
                          <option value="Print Pack Suppliers">Print Pack Suppliers</option>
                          <option value="Star Packaging & Labels Press">Star Packaging & Labels Press</option>
                          <option value="Universal Printing House">Universal Printing House</option>
                          {suppliers.map(sup => (
                            <option key={sup.id} value={sup.company_name}>{sup.company_name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Delivery Challan / Invoice #</label>
                        <input
                          type="text"
                          className="form-input"
                          value={stockForm.reference}
                          onChange={(e) => setStockForm({ ...stockForm, reference: e.target.value })}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label className="form-label">Delivery Notes / Remarks</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 500 pcs roll labels received in good condition"
                          value={stockForm.notes}
                          onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : stockForm.itemType === 'RAW' ? (
                  <div>
                    {/* Active Raw Material Live Balance Card */}
                    {(() => {
                      const curRaw = rawMaterials.find(r => String(r.id) === String(stockForm.rawMaterialId || rawMaterials[0]?.id)) || rawMaterials[0];
                      if (!curRaw) return null;
                      const isTSP = Boolean(curRaw.unit && curRaw.unit.includes('Bori'));
                      const incomingVal = parseFloat(stockForm.rawQty || 0);
                      const expectedTotal = (curRaw.quantity || 0) + (isNaN(incomingVal) ? 0 : incomingVal);

                      return (
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '14px 16px',
                          marginBottom: '16px',
                          display: 'grid',
                          gridTemplateColumns: '1.2fr 1fr',
                          gap: '12px'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#64748b' }}>
                              Selected Material & Current Stock
                            </span>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                              {curRaw.name || 'Unnamed Material'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>
                              Current: {(curRaw.quantity || 0).toLocaleString()} {curRaw.unit || 'Units'}
                              {isTSP && ` (${((curRaw.quantity || 0) * (curRaw.weight_per_bori_kg || 25)).toLocaleString()} KG)`}
                            </div>
                          </div>

                          <div style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            textAlign: 'right'
                          }}>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: '#047857' }}>
                              Stock Balance After Entry
                            </span>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#047857' }}>
                              {expectedTotal.toLocaleString()} {curRaw.unit || 'Units'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#059669' }}>
                              Rate: Rs. {curRaw.purchase_price || 0} {isTSP ? '/ KG' : '/ Litre'}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="form-grid">
                      <div className="form-group full-width">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="form-label" style={{ margin: 0 }}>Select Raw Material</label>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '3px 8px', color: '#047857', borderColor: '#a7f3d0' }}
                            onClick={() => setModalType('ADD_RAW')}
                          >
                            + Add New Material
                          </button>
                        </div>
                        <select
                          className="form-select"
                          value={stockForm.rawMaterialId || (rawMaterials[0]?.id || '')}
                          onChange={(e) => {
                            const chosen = rawMaterials.find(r => String(r.id) === String(e.target.value));
                            setStockForm({
                              ...stockForm,
                              rawMaterialId: e.target.value,
                              purchasePrice: chosen?.purchase_price !== undefined ? chosen.purchase_price : stockForm.purchasePrice
                            });
                          }}
                        >
                          {rawMaterials.length === 0 ? (
                            <option value="" disabled>-- ⚠️ No Raw Materials Found. Click &quot;+ Add New Material&quot; above --</option>
                          ) : (
                            <>
                              <option value="">-- Choose Raw Material --</option>
                              {rawMaterials.map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.name} — Current: {(r.quantity || 0).toLocaleString()} {r.unit || 'Units'} (Rate: Rs. {r.purchase_price || 0} {r.unit?.includes('Bori') ? '/KG' : '/L'})
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                        {rawMaterials.length === 0 && (
                          <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px' }}>
                            No raw materials found. Please click <strong>&ldquo;+ Add New Material&rdquo;</strong> to register your chemicals/TSP first.
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Quantity to Add ({
                            (rawMaterials.find(r => String(r.id) === String(stockForm.rawMaterialId || rawMaterials[0]?.id))?.unit?.includes('Bori'))
                              ? 'Bori'
                              : (rawMaterials.find(r => String(r.id) === String(stockForm.rawMaterialId || rawMaterials[0]?.id))?.unit || 'Units')
                          })
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          required
                          className="form-input"
                          style={{ fontSize: '1.05rem', fontWeight: 700 }}
                          value={stockForm.rawQty}
                          onChange={(e) => setStockForm({ ...stockForm, rawQty: e.target.value })}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                          {(rawMaterials.find(r => String(r.id) === String(stockForm.rawMaterialId || rawMaterials[0]?.id))?.unit?.includes('Bori'))
                            ? '1 Bori = 25 KG'
                            : 'Volume / Units'}
                        </span>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Unit / KG Purchase Rate (Rs. {
                            (rawMaterials.find(r => String(r.id) === String(stockForm.rawMaterialId || rawMaterials[0]?.id))?.unit?.includes('Bori'))
                              ? '/ KG'
                              : '/ Unit'
                          })
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input"
                          style={{ fontSize: '1.05rem', fontWeight: 700, color: '#059669' }}
                          placeholder="e.g. 150.00"
                          value={stockForm.purchasePrice}
                          onChange={(e) => setStockForm({ ...stockForm, purchasePrice: e.target.value })}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                          Rate per {(rawMaterials.find(r => String(r.id) === String(stockForm.rawMaterialId || rawMaterials[0]?.id))?.unit?.includes('Bori')) ? 'KG' : 'Unit'}
                        </span>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Supplier / Vendor</label>
                        <select
                          className="form-select"
                          value={stockForm.supplier}
                          onChange={(e) => setStockForm({ ...stockForm, supplier: e.target.value })}
                        >
                          <option value="Direct Chemical Tanker Delivery">Direct Chemical Tanker Delivery</option>
                          {suppliers.map(sup => (
                            <option key={sup.id} value={sup.company_name}>{sup.company_name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Purchase Order / Challan #</label>
                        <input
                          type="text"
                          className="form-input"
                          value={stockForm.reference}
                          onChange={(e) => setStockForm({ ...stockForm, reference: e.target.value })}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label className="form-label">Delivery Notes / Tanker Details</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Tanker #5, Batch 802, unloaded to Chemical Storage Tank"
                          value={stockForm.notes}
                          onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Active Finished Product Live Balance Card */}
                    {(() => {
                      const curSize = productSizes.find(s => String(s.id) === String(stockForm.sizeId || productSizes[0]?.id)) || productSizes[0];
                      if (!curSize) return null;
                      const bpc = getBottlesPerCarton(curSize);
                      const incomingBottles = parseInt(stockForm.bottleQty || 0, 10);
                      const incomingCartons = parseInt(stockForm.cartonQty || 0, 10);
                      const expectedBottles = (curSize.bottle_quantity || 0) + (isNaN(incomingBottles) ? 0 : incomingBottles);
                      const expectedCartons = (curSize.carton_quantity || 0) + (isNaN(incomingCartons) ? 0 : incomingCartons);

                      return (
                        <div>
                          <div style={{
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '10px',
                            padding: '14px 16px',
                            marginBottom: '16px',
                            display: 'grid',
                            gridTemplateColumns: '1.2fr 1fr',
                            gap: '12px'
                          }}>
                            <div>
                              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#0369a1' }}>
                                Selected Product & Current Stock
                              </span>
                              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                                {curSize.product_name} ({curSize.size})
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 700 }}>
                                Available: {(curSize.carton_quantity || 0).toLocaleString()} Cartons | {(curSize.bottle_quantity || 0).toLocaleString()} Bottles ({bpc} bpc)
                              </div>
                            </div>

                            <div style={{
                              background: '#e0f2fe',
                              border: '1px solid #7dd3fc',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              textAlign: 'right'
                            }}>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: '#0284c7' }}>
                                Stock Balance After Entry
                              </span>
                              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0369a1' }}>
                                {expectedCartons.toLocaleString()} Cartons
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                                {expectedBottles.toLocaleString()} Total Bottles
                              </div>
                            </div>
                          </div>

                          {/* Packing Mode Selector (Cartons vs Loose Bottles) */}
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '16px',
                            background: '#f8fafc',
                            padding: '6px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <button
                              type="button"
                              className={`btn btn-sm ${stockForm.entryMode === 'CARTON' ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ flex: 1, padding: '7px 10px', fontSize: '0.82rem', fontWeight: 700 }}
                              onClick={() => {
                                const currentCtns = parseInt(stockForm.cartonQty || 10, 10);
                                setStockForm(prev => ({
                                  ...prev,
                                  entryMode: 'CARTON',
                                  cartonQty: currentCtns,
                                  bottleQty: currentCtns * bpc,
                                  stickerQty: currentCtns * bpc
                                }));
                              }}
                            >
                              📦 Pack by Cartons (Recommended)
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${stockForm.entryMode === 'BOTTLE' ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ flex: 1, padding: '7px 10px', fontSize: '0.82rem', fontWeight: 700 }}
                              onClick={() => {
                                setStockForm(prev => ({ ...prev, entryMode: 'BOTTLE' }));
                              }}
                            >
                              🍾 Enter Loose Bottles
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="form-grid">
                      <div className="form-group full-width">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="form-label" style={{ margin: 0 }}>Select Finished Product & Size</label>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '3px 8px', color: '#0284c7', borderColor: '#bae6fd' }}
                            onClick={() => openAddProductModal()}
                          >
                            + Add New Product
                          </button>
                        </div>
                        <select
                          className="form-select"
                          value={stockForm.sizeId || (productSizes[0]?.id || '')}
                          onChange={(e) => {
                            const chosen = productSizes.find(s => String(s.id) === String(e.target.value));
                            const bpc = getBottlesPerCarton(chosen);
                            const curCtns = parseInt(stockForm.cartonQty || 10, 10);
                            setStockForm({
                              ...stockForm,
                              sizeId: e.target.value,
                              bottleQty: stockForm.entryMode === 'CARTON' ? curCtns * bpc : stockForm.bottleQty,
                              stickerQty: stockForm.entryMode === 'CARTON' ? curCtns * bpc : stockForm.stickerQty,
                              purchasePrice: chosen?.purchase_price !== undefined ? chosen.purchase_price : stockForm.purchasePrice
                            });
                          }}
                        >
                          {productSizes.length === 0 ? (
                            <option value="" disabled>-- ⚠️ No Finished Products Found. Click &quot;+ Add New Product&quot; above --</option>
                          ) : (
                            <>
                              <option value="">-- Choose Product & Size --</option>
                              {products.length > 0 ? (
                                products.map(prod => {
                                  const sizesForProd = productSizes.filter(s => String(s.product_id) === String(prod.id));
                                  if (sizesForProd.length === 0) return null;
                                  return (
                                    <optgroup key={prod.id} label={`${prod.name} (${prod.category || 'Finished Goods'})`}>
                                      {sizesForProd.map(s => (
                                        <option key={s.id} value={s.id}>
                                          {s.product_name} — {s.size} (Current: {(s.carton_quantity || 0).toLocaleString()} ctns, {(s.bottle_quantity || 0).toLocaleString()} btls)
                                        </option>
                                      ))}
                                    </optgroup>
                                  );
                                })
                              ) : (
                                productSizes.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.product_name} — {s.size} (Current: {(s.carton_quantity || 0).toLocaleString()} ctns, {(s.bottle_quantity || 0).toLocaleString()} btls)
                                  </option>
                                ))
                              )}
                            </>
                          )}
                        </select>
                        {productSizes.length === 0 && (
                          <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px' }}>
                            No finished products found. Please click <strong>&ldquo;+ Add New Product&rdquo;</strong> to register your products and bottle sizes first.
                          </div>
                        )}
                      </div>

                      {/* Quantity Input depending on entryMode */}
                      {stockForm.entryMode === 'CARTON' ? (
                        <>
                          <div className="form-group">
                            <label className="form-label" style={{ color: '#b45309', fontWeight: 800 }}>
                              📦 Carton Quantity to Pack
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              className="form-input"
                              style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b45309', borderColor: '#fde68a', background: '#fffbeb' }}
                              value={stockForm.cartonQty}
                              onChange={(e) => {
                                const ctns = parseInt(e.target.value || 0, 10);
                                const activeSize = productSizes.find(s => String(s.id) === String(stockForm.sizeId || productSizes[0]?.id));
                                const bpc = getBottlesPerCarton(activeSize);
                                setStockForm({
                                  ...stockForm,
                                  cartonQty: e.target.value,
                                  bottleQty: ctns * bpc,
                                  stickerQty: ctns * bpc
                                });
                              }}
                            />
                            <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                              = {parseInt(stockForm.cartonQty || 0, 10) * getBottlesPerCarton(productSizes.find(s => String(s.id) === String(stockForm.sizeId || productSizes[0]?.id)))} Total Bottles filled & packed
                            </span>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Total Filled Bottles</label>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              style={{ fontSize: '1.05rem', fontWeight: 700 }}
                              value={stockForm.bottleQty}
                              onChange={(e) => {
                                const btls = parseInt(e.target.value || 0, 10);
                                const activeSize = productSizes.find(s => String(s.id) === String(stockForm.sizeId || productSizes[0]?.id));
                                const bpc = getBottlesPerCarton(activeSize);
                                setStockForm({
                                  ...stockForm,
                                  bottleQty: e.target.value,
                                  cartonQty: Math.floor(btls / bpc),
                                  stickerQty: btls
                                });
                              }}
                            />
                            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                              Editable: changes cartons & stickers automatically
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="form-group">
                            <label className="form-label">Bottle Quantity to Add</label>
                            <input
                              type="number"
                              min="1"
                              required
                              className="form-input"
                              style={{ fontSize: '1.1rem', fontWeight: 700 }}
                              value={stockForm.bottleQty}
                              onChange={(e) => {
                                const btls = parseInt(e.target.value || 0, 10);
                                const activeSize = productSizes.find(s => String(s.id) === String(stockForm.sizeId || productSizes[0]?.id));
                                const bpc = getBottlesPerCarton(activeSize);
                                setStockForm({
                                  ...stockForm,
                                  bottleQty: e.target.value,
                                  cartonQty: Math.floor(btls / bpc),
                                  stickerQty: btls
                                });
                              }}
                            />
                            <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                              Packaged into {Math.floor(parseInt(stockForm.bottleQty || 0, 10) / getBottlesPerCarton(productSizes.find(s => String(s.id) === String(stockForm.sizeId || productSizes[0]?.id))))} Full Cartons
                            </span>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Full Cartons Packed</label>
                            <input
                              type="number"
                              className="form-input"
                              style={{ fontSize: '1.05rem', fontWeight: 700, color: '#b45309' }}
                              value={stockForm.cartonQty}
                              onChange={(e) => setStockForm({ ...stockForm, cartonQty: e.target.value })}
                            />
                            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                              Available cartons to add to stock
                            </span>
                          </div>
                        </>
                      )}

                      <div className="form-group">
                        <label className="form-label">Unit Cost Rate (Rs. / Bottle)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input"
                          style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0284c7' }}
                          placeholder="e.g. 85.00"
                          value={stockForm.purchasePrice}
                          onChange={(e) => setStockForm({ ...stockForm, purchasePrice: e.target.value })}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                          Cost per bottle for valuation.
                        </span>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Packaging Line / Partner</label>
                        <select
                          className="form-select"
                          value={stockForm.supplier}
                          onChange={(e) => setStockForm({ ...stockForm, supplier: e.target.value })}
                        >
                          <option value="Direct Factory Packaging Line">Direct Factory Packaging Line</option>
                          {suppliers.map(sup => (
                            <option key={sup.id} value={sup.company_name}>{sup.company_name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Batch Code / PO #</label>
                        <input
                          type="text"
                          className="form-input"
                          value={stockForm.reference}
                          onChange={(e) => setStockForm({ ...stockForm, reference: e.target.value })}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label className="form-label">Production / Batch Notes</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Batch #204 filled and packed into cartons"
                          value={stockForm.notes}
                          onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '9px 22px',
                    fontSize: '0.92rem',
                    background: stockForm.itemType === 'RAW'
                      ? 'linear-gradient(135deg, #059669, #10b981)'
                      : 'linear-gradient(135deg, #0284c7, #2563eb)'
                  }}
                >
                  {stockForm.itemType === 'RAW'
                    ? `+ Receive ${(stockForm.rawQty || 0)} Units of Chemical`
                    : `🧪 Fill & Pack ${stockForm.cartonQty || 0} Cartons (${stockForm.bottleQty || 0} Bottles)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: STOCK OUT (Section 19 - Stock cannot be negative)
         ======================================================== */}
      {modalType === 'STOCK_OUT' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Warehouse Stock Out / Issue</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleStockOutSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Inventory Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <button
                      type="button"
                      className={`btn ${stockForm.itemType === 'FINISHED' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setStockForm({ ...stockForm, itemType: 'FINISHED' })}
                    >
                      📦 Finished Product
                    </button>
                    <button
                      type="button"
                      className={`btn ${stockForm.itemType === 'STICKER' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setStockForm({ ...stockForm, itemType: 'STICKER' })}
                    >
                      🏷️ Stickers
                    </button>
                    <button
                      type="button"
                      className={`btn ${stockForm.itemType === 'RAW' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setStockForm({ ...stockForm, itemType: 'RAW' })}
                    >
                      🧪 Raw Material
                    </button>
                  </div>
                </div>

                {stockForm.itemType === 'STICKER' ? (
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Select Target Product Sticker SKU</label>
                      <select
                        className="form-select"
                        value={stockForm.sizeId || (productSizes[0]?.id || '')}
                        onChange={(e) => setStockForm({ ...stockForm, sizeId: e.target.value })}
                      >
                        {productSizes.length === 0 ? (
                          <option value="" disabled>-- ⚠️ No Product Stickers Available in Stock --</option>
                        ) : (
                          <>
                            <option value="">-- Choose Product Sticker --</option>
                            {productSizes.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.product_name} — {s.size} Labels (Available: {(s.sticker_quantity || 0).toLocaleString()} pcs)
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: '#7c3aed', fontWeight: 800 }}>
                        🏷️ Sticker Quantity to Issue (Pcs)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="form-input"
                        style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed', borderColor: '#d8b4fe' }}
                        value={stockForm.stickerQty}
                        onChange={(e) => setStockForm({ ...stockForm, stickerQty: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Issued To / Station</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Bottling & Labeling Line 1"
                        value={stockForm.customer}
                        onChange={(e) => setStockForm({ ...stockForm, customer: e.target.value })}
                      />
                    </div>
                  </div>
                ) : stockForm.itemType === 'FINISHED' ? (
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Select Product & Size</label>
                      <select
                        className="form-select"
                        value={stockForm.sizeId || (productSizes[0]?.id || '')}
                        onChange={(e) => setStockForm({ ...stockForm, sizeId: e.target.value })}
                      >
                        {productSizes.length === 0 ? (
                          <option value="" disabled>-- ⚠️ No Products Available in Stock --</option>
                        ) : (
                          <>
                            <option value="">-- Choose Product & Size --</option>
                            {productSizes.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.product_name} — {s.size} (Available: {s.bottle_quantity || 0} btls)
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Bottle Quantity to Issue/Sell</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={stockForm.bottleQty}
                        onChange={(e) => setStockForm({ ...stockForm, bottleQty: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Cartons Dispatched</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={stockForm.cartonQty}
                        onChange={(e) => setStockForm({ ...stockForm, cartonQty: e.target.value })}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Customer / Department Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Metro Cash & Carry / Filling Line 1"
                        value={stockForm.customer}
                        onChange={(e) => setStockForm({ ...stockForm, customer: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Select Raw Material</label>
                      <select
                        className="form-select"
                        value={stockForm.rawMaterialId || (rawMaterials[0]?.id || '')}
                        onChange={(e) => setStockForm({ ...stockForm, rawMaterialId: e.target.value })}
                      >
                        {rawMaterials.length === 0 ? (
                          <option value="" disabled>-- ⚠️ No Raw Materials Available in Stock --</option>
                        ) : (
                          <>
                            <option value="">-- Choose Raw Material --</option>
                            {rawMaterials.map(r => (
                              <option key={r.id} value={r.id}>
                                {r.name} — Available: {r.quantity || 0} {r.unit || 'Units'}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Quantity to Issue (Liters or Bori)</label>
                      <input
                        type="number"
                        step="any"
                        min="1"
                        className="form-input"
                        value={stockForm.rawQty}
                        onChange={(e) => setStockForm({ ...stockForm, rawQty: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="form-grid" style={{ marginTop: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <input
                      type="text"
                      className="form-input"
                      value={stockForm.reason}
                      onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reference # / Invoice</label>
                    <input
                      type="text"
                      className="form-input"
                      value={stockForm.reference}
                      onChange={(e) => setStockForm({ ...stockForm, reference: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Confirm Stock Out</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DAMAGE MANAGEMENT (Section 22)
         ======================================================== */}
      {modalType === 'DAMAGE' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e11d48' }}>Record Damaged / Wasted Stock</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleDamageSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <button
                      type="button"
                      className={`btn ${stockForm.itemType === 'FINISHED' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setStockForm({ ...stockForm, itemType: 'FINISHED' })}
                    >
                      📦 Finished Product
                    </button>
                    <button
                      type="button"
                      className={`btn ${stockForm.itemType === 'STICKER' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setStockForm({ ...stockForm, itemType: 'STICKER' })}
                    >
                      🏷️ Stickers
                    </button>
                    <button
                      type="button"
                      className={`btn ${stockForm.itemType === 'RAW' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setStockForm({ ...stockForm, itemType: 'RAW' })}
                    >
                      🧪 Raw Material
                    </button>
                  </div>
                </div>

                {stockForm.itemType === 'STICKER' ? (
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Select Target Product Sticker SKU</label>
                      <select
                        className="form-select"
                        value={stockForm.sizeId || (productSizes[0]?.id || '')}
                        onChange={(e) => setStockForm({ ...stockForm, sizeId: e.target.value })}
                      >
                        {productSizes.length === 0 ? (
                          <option value="" disabled>-- ⚠️ No Products Available --</option>
                        ) : (
                          <>
                            <option value="">-- Choose Product Sticker --</option>
                            {productSizes.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.product_name} — {s.size} Labels (Available: {(s.sticker_quantity || 0).toLocaleString()} pcs)
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label" style={{ color: '#e11d48', fontWeight: 800 }}>
                        Damaged / Wasted Stickers (Pcs)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="form-input"
                        style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e11d48', borderColor: '#fecaca' }}
                        value={stockForm.stickerQty}
                        onChange={(e) => setStockForm({ ...stockForm, stickerQty: e.target.value })}
                      />
                    </div>
                  </div>
                ) : stockForm.itemType === 'FINISHED' ? (
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Select Product & Size</label>
                      <select
                        className="form-select"
                        value={stockForm.sizeId || (productSizes[0]?.id || '')}
                        onChange={(e) => setStockForm({ ...stockForm, sizeId: e.target.value })}
                      >
                        {productSizes.length === 0 ? (
                          <option value="" disabled>-- ⚠️ No Products Available --</option>
                        ) : (
                          <>
                            <option value="">-- Choose Product & Size --</option>
                            {productSizes.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.product_name} — {s.size} (Avail: {s.bottle_quantity || 0} btls)
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Damaged Bottles</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={stockForm.bottleQty}
                        onChange={(e) => setStockForm({ ...stockForm, bottleQty: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Damaged Cartons</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={stockForm.cartonQty}
                        onChange={(e) => setStockForm({ ...stockForm, cartonQty: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Select Raw Material</label>
                      <select
                        className="form-select"
                        value={stockForm.rawMaterialId || (rawMaterials[0]?.id || '')}
                        onChange={(e) => setStockForm({ ...stockForm, rawMaterialId: e.target.value })}
                      >
                        {rawMaterials.length === 0 ? (
                          <option value="" disabled>-- ⚠️ No Raw Materials Available --</option>
                        ) : (
                          <>
                            <option value="">-- Choose Raw Material --</option>
                            {rawMaterials.map(r => (
                              <option key={r.id} value={r.id}>{r.name} ({r.unit || 'Units'})</option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Damaged / Leaked Quantity</label>
                      <input
                        type="number"
                        step="any"
                        min="1"
                        className="form-input"
                        value={stockForm.rawQty}
                        onChange={(e) => setStockForm({ ...stockForm, rawQty: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group full-width">
                  <label className="form-label">Damage Reason / Inspection Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cap crack during transit / moisture damage"
                    value={stockForm.notes}
                    onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Confirm Damage Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PHYSICAL STOCK ADJUSTMENT (Section 20)
         ======================================================== */}
      {modalType === 'ADJUSTMENT' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Physical Stock Adjustment</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleAdjustmentSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <button
                      type="button"
                      className={`btn ${stockForm.itemType === 'FINISHED' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setStockForm({ ...stockForm, itemType: 'FINISHED' })}
                    >
                      📦 Finished Product
                    </button>
                    <button
                      type="button"
                      className={`btn ${stockForm.itemType === 'STICKER' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        const curSize = productSizes.find(x => String(x.id) === String(stockForm.sizeId)) || productSizes[0];
                        setStockForm({
                          ...stockForm,
                          itemType: 'STICKER',
                          sizeId: curSize?.id || '',
                          stickerQty: curSize ? (curSize.sticker_quantity || 0) : 0
                        });
                      }}
                    >
                      🏷️ Stickers
                    </button>
                    <button
                      type="button"
                      className={`btn ${stockForm.itemType === 'RAW' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setStockForm({ ...stockForm, itemType: 'RAW' })}
                    >
                      🧪 Raw Material
                    </button>
                  </div>
                </div>

                {stockForm.itemType === 'STICKER' ? (
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Select Target Product Sticker SKU</label>
                      <select
                        className="form-select"
                        value={stockForm.sizeId || (productSizes[0]?.id || '')}
                        onChange={(e) => {
                          const s = productSizes.find(x => String(x.id) === String(e.target.value));
                          setStockForm({
                            ...stockForm,
                            sizeId: e.target.value,
                            stickerQty: s ? (s.sticker_quantity || 0) : 0
                          });
                        }}
                      >
                        {productSizes.length === 0 ? (
                          <option value="" disabled>-- ⚠️ No Products Available --</option>
                        ) : (
                          <>
                            <option value="">-- Choose Product Sticker --</option>
                            {productSizes.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.product_name} — {s.size} Labels (System Count: {(s.sticker_quantity || 0).toLocaleString()} pcs)
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label" style={{ color: '#7c3aed', fontWeight: 800 }}>
                        Actual Physical Stickers Count (Pcs)
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed', borderColor: '#d8b4fe' }}
                        value={stockForm.stickerQty}
                        onChange={(e) => setStockForm({ ...stockForm, stickerQty: e.target.value })}
                      />
                    </div>
                  </div>
                ) : stockForm.itemType === 'FINISHED' ? (
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Select Product & Size</label>
                      <select
                        className="form-select"
                        value={stockForm.sizeId || (productSizes[0]?.id || '')}
                        onChange={(e) => {
                          const s = productSizes.find(x => String(x.id) === String(e.target.value));
                          setStockForm({
                            ...stockForm,
                            sizeId: e.target.value,
                            bottleQty: s ? s.bottle_quantity : 0
                          });
                        }}
                      >
                        {productSizes.length === 0 ? (
                          <option value="" disabled>-- ⚠️ No Products Available --</option>
                        ) : (
                          <>
                            <option value="">-- Choose Product & Size --</option>
                            {productSizes.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.product_name} — {s.size} (System Count: {s.bottle_quantity || 0} btls)
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Actual Physical Bottles Count</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={stockForm.bottleQty}
                        onChange={(e) => setStockForm({ ...stockForm, bottleQty: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Select Raw Material</label>
                      <select
                        className="form-select"
                        value={stockForm.rawMaterialId || (rawMaterials[0]?.id || '')}
                        onChange={(e) => {
                          const r = rawMaterials.find(x => String(x.id) === String(e.target.value));
                          setStockForm({
                            ...stockForm,
                            rawMaterialId: e.target.value,
                            rawQty: r ? r.quantity : 0
                          });
                        }}
                      >
                        {rawMaterials.length === 0 ? (
                          <option value="" disabled>-- ⚠️ No Raw Materials Available --</option>
                        ) : (
                          <>
                            <option value="">-- Choose Raw Material --</option>
                            {rawMaterials.map(r => (
                              <option key={r.id} value={r.id}>{r.name} (System: {r.quantity || 0} {r.unit || 'Units'})</option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Actual Physical Quantity (Liters / Bori)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        value={stockForm.rawQty}
                        onChange={(e) => setStockForm({ ...stockForm, rawQty: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group full-width">
                  <label className="form-label">Reason for Discrepancy</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cycle Count Correction / Damaged / Missing"
                    value={stockForm.reason}
                    onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update System Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD NEW FINISHED PRODUCT (Section 16)
         ======================================================== */}
      {modalType === 'ADD_PRODUCT' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Add Finished Product</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleAddProductSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Sweep Toilet Cleaner / Lemon Dishwash"
                      value={newProductForm.name}
                      onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newProductForm.category}
                      onChange={(e) => {
                        const selectedCat = e.target.value;
                        const matched = PRODUCT_CATEGORIES.find(c => c.label === selectedCat);
                        setNewProductForm(prev => ({
                          ...prev,
                          category: selectedCat,
                          sizes: matched ? matched.sizes.map(s => ({ ...s })) : prev.sizes
                        }));
                      }}
                    >
                      {PRODUCT_CATEGORIES.map(cat => (
                        <option key={cat.label} value={cat.label}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={newProductForm.status}
                      onChange={(e) => setNewProductForm({ ...newProductForm, status: e.target.value })}
                    >
                      <option value="Available">Available</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>

                  {newProductForm.category === 'Custom Category...' && (
                    <div className="form-group full-width">
                      <label className="form-label">Custom Category Name</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. Floor Cleaner / Hand Sanitizers"
                        value={newProductForm.customCategory || ''}
                        onChange={(e) => setNewProductForm({ ...newProductForm, customCategory: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '0.96rem' }}>
                        Bottle Sizes Configuration:
                      </h4>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Auto-preset for {newProductForm.category} &mdash; customize bottle volume, packaging, and rates.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.76rem', padding: '4px 10px', color: '#0284c7', borderColor: '#bae6fd' }}
                      onClick={() => {
                        setNewProductForm(prev => ({
                          ...prev,
                          sizes: [
                            ...(prev.sizes || []),
                            { name: `Size ${(prev.sizes?.length || 0) + 1}`, bottlesPerCarton: '', purchasePrice: '', sellingPrice: '', minStock: '' }
                          ]
                        }));
                      }}
                    >
                      + Add Another Size
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(newProductForm.sizes || []).map((sz, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '12px 14px',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.88rem' }}>
                            Variation #{idx + 1}: {sz.name}
                          </div>
                          {(newProductForm.sizes || []).length > 1 && (
                            <button
                              type="button"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                fontWeight: 700
                              }}
                              onClick={() => {
                                setNewProductForm(prev => ({
                                  ...prev,
                                  sizes: prev.sizes.filter((_, i) => i !== idx)
                                }));
                              }}
                            >
                              ✕ Remove
                            </button>
                          )}
                        </div>

                        <div className="form-grid">
                          <div className="form-group full-width">
                            <label className="form-label" style={{ fontSize: '0.76rem' }}>Size / Bottle Name</label>
                            <input
                              type="text"
                              required
                              className="form-input"
                              value={sz.name}
                              placeholder="e.g. 600ml Bottle / 1.2 Liter Can"
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewProductForm(prev => ({
                                  ...prev,
                                  sizes: prev.sizes.map((item, i) => i === idx ? { ...item, name: val } : item)
                                }));
                              }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.76rem' }}>Bottles / Carton</label>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              placeholder="e.g. 12 or 24"
                              value={sz.bottlesPerCarton ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewProductForm(prev => ({
                                  ...prev,
                                  sizes: prev.sizes.map((item, i) => i === idx ? { ...item, bottlesPerCarton: val } : item)
                                }));
                              }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.76rem' }}>Purchase Cost (Rs.)</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              className="form-input"
                              placeholder="e.g. 220"
                              value={sz.purchasePrice ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewProductForm(prev => ({
                                  ...prev,
                                  sizes: prev.sizes.map((item, i) => i === idx ? { ...item, purchasePrice: val } : item)
                                }));
                              }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.76rem' }}>Selling Price (Rs.)</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              className="form-input"
                              placeholder="e.g. 320"
                              value={sz.sellingPrice ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewProductForm(prev => ({
                                  ...prev,
                                  sizes: prev.sizes.map((item, i) => i === idx ? { ...item, sellingPrice: val } : item)
                                }));
                              }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.76rem' }}>Min Stock Alert</label>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              placeholder="e.g. 30"
                              value={sz.minStock ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewProductForm(prev => ({
                                  ...prev,
                                  sizes: prev.sizes.map((item, i) => i === idx ? { ...item, minStock: val } : item)
                                }));
                              }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.76rem', color: '#0284c7', fontWeight: 700 }}>
                              Available Bottles (Stock)
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              placeholder="e.g. 120 (Optional)"
                              value={sz.bottleQuantity ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewProductForm(prev => ({
                                  ...prev,
                                  sizes: prev.sizes.map((item, i) => i === idx ? { ...item, bottleQuantity: val } : item)
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Finished Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD RAW MATERIAL (Section 17)
         ======================================================== */}
      {modalType === 'ADD_RAW' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Add Raw Material</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleAddRawSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Material Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. HCL / Bleach / Sulphonic Oil / Shampoo Paste / TSP"
                      value={newRawForm.name}
                      onChange={(e) => setNewRawForm({ ...newRawForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit of Measure</label>
                    <select
                      className="form-select"
                      value={newRawForm.unit}
                      onChange={(e) => setNewRawForm({ ...newRawForm, unit: e.target.value })}
                    >
                      <option value="Liters">Liters</option>
                      <option value="Bori + KG">Bori + KG</option>
                      <option value="KG">KG</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Quantity</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={newRawForm.quantity}
                      onChange={(e) => setNewRawForm({ ...newRawForm, quantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Price (Rs. / Unit)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={newRawForm.purchase_price}
                      onChange={(e) => setNewRawForm({ ...newRawForm, purchase_price: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Minimum Stock Alert Threshold</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newRawForm.minimum_stock}
                      onChange={(e) => setNewRawForm({ ...newRawForm, minimum_stock: e.target.value })}
                    />
                  </div>

                  {newRawForm.unit.includes('Bori') && (
                    <div className="form-group full-width">
                      <label className="form-label">Weight Per Bori (KG)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newRawForm.weight_per_bori_kg}
                        onChange={(e) => setNewRawForm({ ...newRawForm, weight_per_bori_kg: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Material</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT FINISHED PRODUCT SIZE & RATES
         ======================================================== */}
      {modalType === 'EDIT_SIZE' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#f0f9ff', padding: '6px', borderRadius: '8px', color: '#0284c7' }}>
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Edit Product Size & Rates
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Update carton packaging, pricing rates, and stock alerts
                  </p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSizeSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Sweep Toilet Cleaner"
                      value={editSizeForm.productName}
                      onChange={(e) => setEditSizeForm({ ...editSizeForm, productName: e.target.value })}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Size / Bottle Variation</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. 600ml Bottle / 1.2 Liter Can"
                      value={editSizeForm.sizeName}
                      onChange={(e) => setEditSizeForm({ ...editSizeForm, sizeName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bottles / Carton</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder="e.g. 12 or 24"
                      value={editSizeForm.bottlesPerCarton ?? ''}
                      onChange={(e) => setEditSizeForm({ ...editSizeForm, bottlesPerCarton: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Cost (Rs.)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 220"
                      value={editSizeForm.purchasePrice ?? ''}
                      onChange={(e) => setEditSizeForm({ ...editSizeForm, purchasePrice: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Selling Price (Rs.)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 320"
                      value={editSizeForm.sellingPrice ?? ''}
                      onChange={(e) => setEditSizeForm({ ...editSizeForm, sellingPrice: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Min Stock Alert</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 30"
                      value={editSizeForm.minStock ?? ''}
                      onChange={(e) => setEditSizeForm({ ...editSizeForm, minStock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#0284c7', fontWeight: 700 }}>
                      Available Bottles Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 120"
                      value={editSizeForm.bottleQuantity ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const btls = parseInt(val || 0, 10);
                        const bpc = getBottlesPerCarton({
                          bottles_per_carton: editSizeForm.bottlesPerCarton,
                          product_name: editSizeForm.productName,
                          size: editSizeForm.sizeName
                        });
                        setEditSizeForm({
                          ...editSizeForm,
                          bottleQuantity: val,
                          cartonQuantity: Math.floor(btls / bpc)
                        });
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#b45309', fontWeight: 700 }}>
                      Available Cartons Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 10"
                      value={editSizeForm.cartonQuantity ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const ctns = parseInt(val || 0, 10);
                        const bpc = getBottlesPerCarton({
                          bottles_per_carton: editSizeForm.bottlesPerCarton,
                          product_name: editSizeForm.productName,
                          size: editSizeForm.sizeName
                        });
                        setEditSizeForm({
                          ...editSizeForm,
                          cartonQuantity: val,
                          bottleQuantity: ctns * bpc
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT RAW MATERIAL
         ======================================================== */}
      {modalType === 'EDIT_RAW' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#ecfdf5', padding: '6px', borderRadius: '8px', color: '#059669' }}>
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Edit Raw Material
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Update chemical / material rates and alert thresholds
                  </p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalType(null)}>✕</button>
            </div>
            <form onSubmit={handleEditRawSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Material Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={editRawForm.name}
                      onChange={(e) => setEditRawForm({ ...editRawForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit of Measure</label>
                    <select
                      className="form-select"
                      value={editRawForm.unit}
                      onChange={(e) => setEditRawForm({ ...editRawForm, unit: e.target.value })}
                    >
                      <option value="Liters">Liters</option>
                      <option value="Bori + KG">Bori + KG</option>
                      <option value="KG">KG</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current Quantity</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={editRawForm.quantity}
                      onChange={(e) => setEditRawForm({ ...editRawForm, quantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Price (Rs. / Unit)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={editRawForm.purchase_price}
                      onChange={(e) => setEditRawForm({ ...editRawForm, purchase_price: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Minimum Stock Alert Threshold</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editRawForm.minimum_stock}
                      onChange={(e) => setEditRawForm({ ...editRawForm, minimum_stock: e.target.value })}
                    />
                  </div>

                  {editRawForm.unit.includes('Bori') && (
                    <div className="form-group full-width">
                      <label className="form-label">Weight Per Bori (KG)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={editRawForm.weight_per_bori_kg}
                        onChange={(e) => setEditRawForm({ ...editRawForm, weight_per_bori_kg: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

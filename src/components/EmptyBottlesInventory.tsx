'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Minus,
  Search,
  SlidersHorizontal,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  Tag,
  X,
  Edit2,
  Check,
  RefreshCw,
  Archive,
  ArrowRight,
  FlaskConical,
  Layers
} from 'lucide-react';
import { EmptyBottlesInventoryProps, EmptyBottle } from '../types';

// Default standard empty bottle presets for chemical and detergent bottling
export const DEFAULT_EMPTY_BOTTLES: EmptyBottle[] = [
  {
    id: 'btl-sweep-600',
    name: 'Empty Sweep 600ml Bottle (خالی بوتل)',
    category: 'Sweep / Toilet Cleaner',
    size: '600ml Bottle',
    material: 'HDPE Angular Neck',
    cap_type: 'Angled Directional Nozzle Cap',
    quantity: 1500,
    damaged_quantity: 12,
    minimum_stock: 500,
    purchase_price: 18.0,
    supplier: 'Apex Blow Molders Ltd',
    status: 'In Stock'
  },
  {
    id: 'btl-sweep-1200',
    name: 'Empty Sweep 1.2L Bottle (خالی بوتل)',
    category: 'Sweep / Toilet Cleaner',
    size: '1.2 Liter Bottle',
    material: 'HDPE Heavy Handle Bottle',
    cap_type: 'Heavy Child-Proof Screw Cap',
    quantity: 850,
    damaged_quantity: 6,
    minimum_stock: 300,
    purchase_price: 32.0,
    supplier: 'Apex Blow Molders Ltd',
    status: 'In Stock'
  },
  {
    id: 'btl-dish-500',
    name: 'Empty Dishwash 500ml Bottle (خالی بوتل)',
    category: 'Dishwash Cleaner',
    size: '500ml Bottle',
    material: 'Clear Transparent PET',
    cap_type: 'Push-Pull Dispenser Cap',
    quantity: 1250,
    damaged_quantity: 8,
    minimum_stock: 400,
    purchase_price: 16.5,
    supplier: 'Crystal PET Packaging',
    status: 'In Stock'
  },
  {
    id: 'btl-dish-1000',
    name: 'Empty Dishwash 1L Bottle (خالی بوتل)',
    category: 'Dishwash Cleaner',
    size: '1 Liter Bottle',
    material: 'Clear Rigid PET Bottle',
    cap_type: 'Lotion Pump / Push-Pull Cap',
    quantity: 920,
    damaged_quantity: 7,
    minimum_stock: 350,
    purchase_price: 24.0,
    supplier: 'Crystal PET Packaging',
    status: 'In Stock'
  },
  {
    id: 'btl-dish-250',
    name: 'Empty Dishwash 250ml Bottle (خالی بوتل)',
    category: 'Dishwash Cleaner',
    size: '250ml Bottle',
    material: 'Compact Transparent PET',
    cap_type: 'Flip-Top Squeeze Cap',
    quantity: 650,
    damaged_quantity: 4,
    minimum_stock: 250,
    purchase_price: 12.0,
    supplier: 'Crystal PET Packaging',
    status: 'In Stock'
  },
  {
    id: 'btl-dish-4500',
    name: 'Empty Dishwash 4.5L Can (خالی کین)',
    category: 'Dishwash Cleaner',
    size: '4.5 Liter Can',
    material: 'HDPE Heavy Molded Gallon Can',
    cap_type: 'Wide Screw Cap with Inner Plug',
    quantity: 210,
    damaged_quantity: 2,
    minimum_stock: 100,
    purchase_price: 65.0,
    supplier: 'Crown Plastic Industries',
    status: 'In Stock'
  },
  {
    id: 'btl-harpic-600',
    name: 'Empty Harpic 600ml Bottle (خالی بوتل)',
    category: 'Harpic Cleaner',
    size: '500ml / 600ml Bottle',
    material: 'HDPE Colored Angular Duck-Neck',
    cap_type: 'Precision Nozzle Cap',
    quantity: 950,
    damaged_quantity: 8,
    minimum_stock: 350,
    purchase_price: 19.5,
    supplier: 'Crown Plastic Industries',
    status: 'In Stock'
  },
  {
    id: 'btl-bleach-600',
    name: 'Empty Bleach 600ml Bottle (خالی بوتل)',
    category: 'Bleach Cleaner',
    size: '600ml Bottle',
    material: 'HDPE Chemical Resistant Wall',
    cap_type: 'Vented Child-Resistant Cap',
    quantity: 1150,
    damaged_quantity: 9,
    minimum_stock: 400,
    purchase_price: 17.5,
    supplier: 'Crown Plastic Industries',
    status: 'In Stock'
  },
  {
    id: 'btl-bleach-1250',
    name: 'Empty Bleach 1.25L Bottle (خالی بوتل)',
    category: 'Bleach Cleaner',
    size: '1.25 Liter Bottle',
    material: 'HDPE High Chemical Grade',
    cap_type: 'Vented Safety Screw Cap',
    quantity: 520,
    damaged_quantity: 4,
    minimum_stock: 200,
    purchase_price: 28.0,
    supplier: 'Crown Plastic Industries',
    status: 'In Stock'
  }
];

export default function EmptyBottlesInventory({
  emptyBottles = [],
  setEmptyBottles,
  onStockIn,
  onStockOut,
  onAdjust,
  onDamage,
  onAddNewBottle,
  onDeleteBottle,
  showToast
}: EmptyBottlesInventoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [activeModal, setActiveModal] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUST' | 'DAMAGE' | 'ADD_NEW' | 'EDIT' | null>(null);
  const [selectedBottle, setSelectedBottle] = useState<EmptyBottle | null>(null);

  // Form states
  const [stockInForm, setStockInForm] = useState<{
    quantity: number | string;
    supplier: string;
    purchasePrice: number | string;
    invoiceNo: string;
    notes: string;
  }>({
    quantity: 200,
    supplier: '',
    purchasePrice: '',
    invoiceNo: '',
    notes: ''
  });

  const [stockOutForm, setStockOutForm] = useState<{
    quantity: number | string;
    packagingLine: string;
    batchNo: string;
    notes: string;
  }>({
    quantity: 100,
    packagingLine: 'Filling Line 1',
    batchNo: `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    notes: ''
  });

  const [adjustForm, setAdjustForm] = useState<{
    newQuantity: number | string;
    reason: string;
  }>({
    newQuantity: 0,
    reason: 'Monthly physical warehouse bottle count'
  });

  const [damageForm, setDamageForm] = useState<{
    quantity: number | string;
    reason: string;
  }>({
    quantity: 10,
    reason: 'Crushed/dented during blow molding or transport'
  });

  const [newBottleForm, setNewBottleForm] = useState<{
    name: string;
    category: string;
    size: string;
    material: string;
    cap_type: string;
    quantity: number | string;
    minimum_stock: number | string;
    purchase_price: number | string;
    supplier: string;
  }>({
    name: '',
    category: 'Sweep / Toilet Cleaner',
    size: '600ml Bottle',
    material: 'HDPE Angular Neck',
    cap_type: 'Nozzle Cap',
    quantity: 500,
    minimum_stock: 300,
    purchase_price: 18,
    supplier: 'Apex Blow Molders Ltd'
  });

  const [editBottleForm, setEditBottleForm] = useState<{
    id: string;
    name: string;
    category: string;
    size: string;
    material: string;
    cap_type: string;
    minimum_stock: number | string;
    purchase_price: number | string;
    supplier: string;
  }>({
    id: '',
    name: '',
    category: '',
    size: '',
    material: '',
    cap_type: '',
    minimum_stock: 300,
    purchase_price: 18,
    supplier: ''
  });

  // Calculate items with dynamic status
  const items = useMemo(() => {
    return emptyBottles.map(b => {
      const q = Number(b.quantity || 0);
      const min = Number(b.minimum_stock || 300);
      let status = 'In Stock';
      if (q <= 0) status = 'Out of Stock';
      else if (q <= min) status = 'Low Stock';
      return { ...b, status };
    });
  }, [emptyBottles]);

  // Filter items
  const filtered = useMemo(() => {
    return items.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.size || '').toLowerCase().includes(q) ||
        (item.material || '').toLowerCase().includes(q) ||
        (item.supplier || '').toLowerCase().includes(q);

      let matchCategory = true;
      if (categoryFilter !== 'ALL') {
        matchCategory = item.category === categoryFilter;
      }

      let matchStatus = true;
      if (statusFilter !== 'ALL') {
        matchStatus = item.status === statusFilter;
      }

      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, searchQuery, categoryFilter, statusFilter]);

  // KPIs
  const totalQuantity = useMemo(() => {
    return items.reduce((acc, b) => acc + Number(b.quantity || 0), 0);
  }, [items]);

  const totalDamaged = useMemo(() => {
    return items.reduce((acc, b) => acc + Number(b.damaged_quantity || 0), 0);
  }, [items]);

  const totalValuation = useMemo(() => {
    return items.reduce((acc, b) => acc + (Number(b.quantity || 0) * Number(b.purchase_price || 0)), 0);
  }, [items]);

  const lowStockCount = useMemo(() => {
    return items.filter(b => b.status === 'Low Stock' || b.status === 'Out of Stock').length;
  }, [items]);

  // Quick Preset Add Helper
  const handleApplyPreset = (preset: EmptyBottle) => {
    const existing = emptyBottles.find(b => b.id === preset.id || b.name === preset.name);
    if (existing) {
      setSelectedBottle(existing);
      setStockInForm({
        quantity: 200,
        supplier: existing.supplier || 'Plastic Blow Molders',
        purchasePrice: existing.purchase_price || 18,
        invoiceNo: `INV-BTL-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: `Quick restock delivery for ${existing.name}`
      });
      setActiveModal('STOCK_IN');
      if (showToast) showToast(`Selected "${existing.name}". Enter quantity to Stock In.`);
    } else {
      const newSku: EmptyBottle = {
        id: preset.id || `btl-${Date.now()}`,
        name: preset.name,
        category: preset.category,
        size: preset.size,
        material: preset.material,
        cap_type: preset.cap_type,
        quantity: 500,
        damaged_quantity: 0,
        minimum_stock: preset.minimum_stock || 300,
        purchase_price: preset.purchase_price || 18,
        supplier: preset.supplier || 'Plastic Packaging Supplier',
        status: 'In Stock'
      };

      if (onAddNewBottle) {
        onAddNewBottle(newSku);
      } else if (setEmptyBottles) {
        setEmptyBottles(prev => [newSku, ...prev]);
      }
      if (showToast) showToast(`Added "${preset.name}" to Empty Bottles Inventory!`);
    }
  };

  // Submit Stock In
  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBottle) return;
    const qty = parseInt(String(stockInForm.quantity), 10);
    if (!qty || qty <= 0) {
      if (showToast) showToast('Please enter a valid quantity.');
      return;
    }

    if (onStockIn) {
      onStockIn(selectedBottle, qty, stockInForm);
    } else if (setEmptyBottles) {
      setEmptyBottles(prev =>
        prev.map(b => (b.id === selectedBottle.id ? { ...b, quantity: Number(b.quantity || 0) + qty } : b))
      );
      if (showToast) showToast(`Received +${qty} Empty Bottles for ${selectedBottle.name}!`);
    }

    setActiveModal(null);
  };

  // Submit Stock Out / Issue to Filling Line
  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBottle) return;
    const qty = parseInt(String(stockOutForm.quantity), 10);
    if (!qty || qty <= 0) {
      if (showToast) showToast('Please enter a valid quantity.');
      return;
    }

    if (qty > (selectedBottle.quantity || 0)) {
      if (showToast) showToast(`Cannot issue ${qty} bottles. Current stock is only ${selectedBottle.quantity}.`);
      return;
    }

    if (onStockOut) {
      onStockOut(selectedBottle, qty, stockOutForm);
    } else if (setEmptyBottles) {
      setEmptyBottles(prev =>
        prev.map(b => (b.id === selectedBottle.id ? { ...b, quantity: Math.max(0, Number(b.quantity || 0) - qty) } : b))
      );
      if (showToast) showToast(`Issued -${qty} Empty Bottles to ${stockOutForm.packagingLine}!`);
    }

    setActiveModal(null);
  };

  // Submit Adjustment
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBottle) return;
    const newQty = Math.max(0, parseInt(String(adjustForm.newQuantity), 10) || 0);

    if (onAdjust) {
      onAdjust(selectedBottle, newQty, adjustForm.reason);
    } else if (setEmptyBottles) {
      setEmptyBottles(prev =>
        prev.map(b => (b.id === selectedBottle.id ? { ...b, quantity: newQty } : b))
      );
      if (showToast) showToast(`Stock for ${selectedBottle.name} adjusted to ${newQty} bottles.`);
    }

    setActiveModal(null);
  };

  // Submit Damage
  const handleDamageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBottle) return;
    const dmgQty = parseInt(String(damageForm.quantity), 10);
    if (!dmgQty || dmgQty <= 0) return;

    if (onDamage) {
      onDamage(selectedBottle, dmgQty, damageForm.reason);
    } else if (setEmptyBottles) {
      setEmptyBottles(prev =>
        prev.map(b => {
          if (b.id === selectedBottle.id) {
            return {
              ...b,
              quantity: Math.max(0, Number(b.quantity || 0) - dmgQty),
              damaged_quantity: Number(b.damaged_quantity || 0) + dmgQty
            };
          }
          return b;
        })
      );
      if (showToast) showToast(`Recorded ${dmgQty} defective / damaged bottles for ${selectedBottle.name}.`);
    }

    setActiveModal(null);
  };

  // Submit Add New SKU
  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBottleForm.name.trim()) {
      if (showToast) showToast('Please enter a bottle name.');
      return;
    }

    const newSku: EmptyBottle = {
      id: `btl-${Date.now()}`,
      name: newBottleForm.name.trim(),
      category: newBottleForm.category,
      size: newBottleForm.size,
      material: newBottleForm.material,
      cap_type: newBottleForm.cap_type,
      quantity: parseInt(String(newBottleForm.quantity), 10) || 0,
      damaged_quantity: 0,
      minimum_stock: parseInt(String(newBottleForm.minimum_stock), 10) || 300,
      purchase_price: parseFloat(String(newBottleForm.purchase_price)) || 0,
      supplier: newBottleForm.supplier || 'Plastic Blow Molders',
      status: 'In Stock'
    };

    if (onAddNewBottle) {
      onAddNewBottle(newSku);
    } else if (setEmptyBottles) {
      setEmptyBottles(prev => [newSku, ...prev]);
    }

    if (showToast) showToast(`Created new bottle SKU: "${newSku.name}"!`);
    setActiveModal(null);
    setNewBottleForm({
      name: '',
      category: 'Sweep / Toilet Cleaner',
      size: '600ml Bottle',
      material: 'HDPE Angular Neck',
      cap_type: 'Nozzle Cap',
      quantity: 500,
      minimum_stock: 300,
      purchase_price: 18,
      supplier: 'Apex Blow Molders Ltd'
    });
  };

  // Submit Edit SKU
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBottleForm.id) return;

    if (setEmptyBottles) {
      setEmptyBottles(prev =>
        prev.map(b => {
          if (b.id === editBottleForm.id) {
            return {
              ...b,
              name: editBottleForm.name,
              category: editBottleForm.category,
              size: editBottleForm.size,
              material: editBottleForm.material,
              cap_type: editBottleForm.cap_type,
              minimum_stock: parseInt(String(editBottleForm.minimum_stock), 10) || 300,
              purchase_price: parseFloat(String(editBottleForm.purchase_price)) || 0,
              supplier: editBottleForm.supplier
            };
          }
          return b;
        })
      );
    }

    if (showToast) showToast(`Updated specifications for "${editBottleForm.name}".`);
    setActiveModal(null);
  };

  const QUICK_PRESETS = [
    { id: 'btl-sweep-600', keyword: 'Sweep 600ml', color: '#0284c7' },
    { id: 'btl-sweep-1200', keyword: 'Sweep 1.2L', color: '#0369a1' },
    { id: 'btl-dish-500', keyword: 'Dishwash 500ml', color: '#059669' },
    { id: 'btl-dish-1000', keyword: 'Dishwash 1L', color: '#047857' },
    { id: 'btl-harpic-600', keyword: 'Harpic 600ml', color: '#7c3aed' },
    { id: 'btl-bleach-600', keyword: 'Bleach 600ml', color: '#d97706' },
  ];

  return (
    <div className="empty-cartons-section">
      {/* Top Banner / Actions Bar */}
      <div className="panel" style={{ margin: 0 }}>
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div className="panel-title-group">
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)'
            }}>
              <Package size={24} />
            </div>
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.28rem' }}>
                Empty Bottles Inventory <span style={{ color: '#0284c7', fontSize: '0.92rem', fontWeight: 700 }}> (خالی بوتلوں کی انوینٹری)</span>
              </h2>
              <p className="panel-desc">
                Unfilled plastic bottles, containers, caps, and preforms received from blow molding vendors ready for chemical filling.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-emerald btn-sm"
              onClick={() => {
                if (items.length > 0) {
                  setSelectedBottle(items[0]);
                  setStockInForm({
                    quantity: 200,
                    supplier: items[0].supplier || 'Plastic Blow Molders',
                    purchasePrice: items[0].purchase_price || 18,
                    invoiceNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                    notes: ''
                  });
                  setActiveModal('STOCK_IN');
                } else {
                  setActiveModal('ADD_NEW');
                }
              }}
              title="Record incoming bottle delivery from vendor"
            >
              <Plus size={14} />
              <span>+ Stock In Bottles</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveModal('ADD_NEW')}
              title="Register a new empty bottle SKU or mold"
            >
              <Plus size={14} />
              <span>New Bottle SKU</span>
            </button>
          </div>
        </div>

        {/* Quick Factory Presets Strip */}
        <div style={{
          marginTop: '14px',
          padding: '12px 14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>
            ⚡ Factory Bottle Presets:
          </span>
          {QUICK_PRESETS.map((qp) => {
            const def = DEFAULT_EMPTY_BOTTLES.find(b => b.id === qp.id);
            if (!def) return null;
            return (
              <button
                key={qp.id}
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => handleApplyPreset(def)}
                style={{
                  gap: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  borderColor: '#cbd5e1',
                  background: '#ffffff'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: qp.color }} />
                <span>+ {qp.keyword}</span>
              </button>
            );
          })}
        </div>

        {/* KPIs Grid */}
        <div className="cartons-kpi-grid" style={{ marginTop: '16px', marginBottom: '20px' }}>
          <div className="carton-kpi-card" style={{ '--card-accent': '#0284c7' } as React.CSSProperties}>
            <div className="carton-kpi-header">
              <span className="carton-kpi-label">Total Empty Bottles</span>
              <div className="carton-kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <Package size={18} />
              </div>
            </div>
            <div className="carton-kpi-value">{totalQuantity.toLocaleString()}</div>
            <div className="carton-kpi-footer">
              <span className="carton-kpi-sub">Across {items.length} Bottle Shapes & Sizes</span>
            </div>
          </div>

          <div className="carton-kpi-card" style={{ '--card-accent': '#059669' } as React.CSSProperties}>
            <div className="carton-kpi-header">
              <span className="carton-kpi-label">Empty Bottles Valuation</span>
              <div className="carton-kpi-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="carton-kpi-value">Rs. {Math.round(totalValuation).toLocaleString()}</div>
            <div className="carton-kpi-footer">
              <span className="carton-kpi-sub">Raw Unfilled Plastic Stock Value</span>
            </div>
          </div>

          <div className="carton-kpi-card" style={{ '--card-accent': '#d97706' } as React.CSSProperties}>
            <div className="carton-kpi-header">
              <span className="carton-kpi-label">Low Stock Alerts</span>
              <div className="carton-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="carton-kpi-value">{lowStockCount}</div>
            <div className="carton-kpi-footer">
              <span className="carton-kpi-sub">Below Minimum Buffer Level</span>
            </div>
          </div>

          <div className="carton-kpi-card" style={{ '--card-accent': '#e11d48' } as React.CSSProperties}>
            <div className="carton-kpi-header">
              <span className="carton-kpi-label">Damaged / Defective</span>
              <div className="carton-kpi-icon" style={{ background: '#ffe4e6', color: '#e11d48' }}>
                <AlertOctagon size={18} />
              </div>
            </div>
            <div className="carton-kpi-value">{totalDamaged.toLocaleString()}</div>
            <div className="carton-kpi-footer">
              <span className="carton-kpi-sub">Molding Flaws or In-Transit Crushed</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.84rem', width: '100%' }}
              placeholder="Search by bottle name, mold size, material, or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Category:</span>
            <select
              className="form-select"
              style={{ padding: '5px 10px', fontSize: '0.82rem' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Sweep / Toilet Cleaner">Toilet & Sweep Cleaners</option>
              <option value="Dishwash Cleaner">Dishwash Liquid Cleaners</option>
              <option value="Harpic Cleaner">Harpic Cleaners</option>
              <option value="Bleach Cleaner">Bleach Cleaners</option>
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
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Table / Cards toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            <button
              type="button"
              className={`btn btn-xs ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px' }}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
            <button
              type="button"
              className={`btn btn-xs ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px' }}
              onClick={() => setViewMode('cards')}
            >
              Cards View
            </button>
          </div>
        </div>

        {/* Content Table or Cards */}
        {viewMode === 'table' ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bottle SKU & Mold Name</th>
                  <th>Bottle Size</th>
                  <th>Plastic Material & Cap</th>
                  <th>In Stock (Pcs)</th>
                  <th>Defect / Damaged</th>
                  <th>Min Alert Buffer</th>
                  <th>Purchase Rate</th>
                  <th>Inventory Value</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <Package size={40} style={{ margin: '0 auto 10px', opacity: 0.3, color: '#0284c7' }} />
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>No Empty Bottles Found</div>
                      <div style={{ fontSize: '0.85rem' }}>No empty bottle SKU matches your search or filter.</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((bottle) => {
                    const isLow = bottle.status === 'Low Stock';
                    const isOut = bottle.status === 'Out of Stock';
                    const val = Number(bottle.quantity || 0) * Number(bottle.purchase_price || 0);

                    return (
                      <tr key={bottle.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#f0f9ff',
                              color: '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Package size={17} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>{bottle.name}</strong>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Supplier: {bottle.supplier || 'Plastic Blow Molders'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="size-tag standard">{bottle.size}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                            {bottle.material}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Cap: {bottle.cap_type}
                          </div>
                        </td>
                        <td>
                          <strong style={{
                            fontSize: '1.05rem',
                            color: isOut ? '#e11d48' : isLow ? '#d97706' : '#0f172a'
                          }}>
                            {Number(bottle.quantity || 0).toLocaleString()} <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748b' }}>Pcs</span>
                          </strong>
                        </td>
                        <td>
                          <span style={{ color: Number(bottle.damaged_quantity || 0) > 0 ? '#e11d48' : '#94a3b8', fontWeight: 600 }}>
                            {Number(bottle.damaged_quantity || 0).toLocaleString()} Pcs
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                            {Number(bottle.minimum_stock || 300).toLocaleString()} Pcs
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#475569', fontWeight: 600 }}>
                            Rs. {Number(bottle.purchase_price || 0).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#0284c7', fontSize: '0.95rem' }}>
                            Rs. {Math.round(val).toLocaleString()}
                          </strong>
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
                          <div style={{ display: 'inline-flex', gap: '5px' }}>
                            <button
                              type="button"
                              className="btn btn-emerald btn-xs"
                              onClick={() => {
                                setSelectedBottle(bottle);
                                setStockInForm({
                                  quantity: 200,
                                  supplier: bottle.supplier || '',
                                  purchasePrice: bottle.purchase_price || 18,
                                  invoiceNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                                  notes: ''
                                });
                                setActiveModal('STOCK_IN');
                              }}
                              title="Receive incoming delivery"
                            >
                              <Plus size={12} /> Stock In
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-xs"
                              onClick={() => {
                                setSelectedBottle(bottle);
                                setStockOutForm({
                                  quantity: 100,
                                  packagingLine: 'Filling Line 1',
                                  batchNo: `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                                  notes: ''
                                });
                                setActiveModal('STOCK_OUT');
                              }}
                              title="Issue to Filling Floor"
                            >
                              <Minus size={12} /> Issue
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              onClick={() => {
                                setSelectedBottle(bottle);
                                setEditBottleForm({
                                  id: bottle.id,
                                  name: bottle.name,
                                  category: bottle.category,
                                  size: bottle.size,
                                  material: bottle.material,
                                  cap_type: bottle.cap_type,
                                  minimum_stock: bottle.minimum_stock,
                                  purchase_price: bottle.purchase_price,
                                  supplier: bottle.supplier
                                });
                                setActiveModal('EDIT');
                              }}
                              title="Edit Bottle Specifications"
                            >
                              <Edit2 size={12} />
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
        ) : (
          /* Cards Grid View */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px'
          }}>
            {filtered.map((bottle) => {
              const isLow = bottle.status === 'Low Stock';
              const isOut = bottle.status === 'Out of Stock';
              const val = Number(bottle.quantity || 0) * Number(bottle.purchase_price || 0);

              return (
                <div
                  key={bottle.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span className="size-tag standard">{bottle.size}</span>
                      {isOut ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : isLow ? (
                        <span className="badge badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </div>

                    <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                      {bottle.name}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>
                      {bottle.material} • {bottle.cap_type}
                    </div>

                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px',
                      marginBottom: '14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Available Stock:</span>
                        <strong style={{ fontSize: '1rem', color: isOut ? '#e11d48' : isLow ? '#d97706' : '#0f172a' }}>
                          {Number(bottle.quantity || 0).toLocaleString()} Pcs
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Defect/Damaged:</span>
                        <span style={{ fontSize: '0.76rem', color: '#e11d48', fontWeight: 600 }}>
                          {Number(bottle.damaged_quantity || 0).toLocaleString()} Pcs
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Rate / Box Value:</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7' }}>
                          Rs. {Math.round(val).toLocaleString()} (@ Rs {bottle.purchase_price})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-emerald btn-xs"
                      style={{ justifyContent: 'center' }}
                      onClick={() => {
                        setSelectedBottle(bottle);
                        setStockInForm({
                          quantity: 200,
                          supplier: bottle.supplier || '',
                          purchasePrice: bottle.purchase_price || 18,
                          invoiceNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                          notes: ''
                        });
                        setActiveModal('STOCK_IN');
                      }}
                    >
                      <Plus size={13} />
                      <span>Receive</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-xs"
                      style={{ justifyContent: 'center' }}
                      onClick={() => {
                        setSelectedBottle(bottle);
                        setStockOutForm({
                          quantity: 100,
                          packagingLine: 'Filling Line 1',
                          batchNo: `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                          notes: ''
                        });
                        setActiveModal('STOCK_OUT');
                      }}
                    >
                      <Minus size={13} />
                      <span>Issue</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Stock In (Receive Bottles) */}
      {activeModal === 'STOCK_IN' && selectedBottle && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Receive Empty Bottles (سٹاک اِن)
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleStockInSubmit}>
              <div className="modal-body">
                <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 600 }}>Bottle Mold SKU:</div>
                  <strong style={{ fontSize: '1rem', color: '#0c4a6e' }}>{selectedBottle.name}</strong>
                  <div style={{ fontSize: '0.76rem', color: '#0369a1', marginTop: '2px' }}>
                    Material: {selectedBottle.material} • Current Stock: {selectedBottle.quantity} Pcs
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity of Empty Bottles Received (Pcs)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={stockInForm.quantity}
                    onChange={e => setStockInForm(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Purchase Rate / Bottle (Rs)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      value={stockInForm.purchasePrice}
                      onChange={e => setStockInForm(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Invoice / DC #</label>
                    <input
                      type="text"
                      className="form-input"
                      value={stockInForm.invoiceNo}
                      onChange={e => setStockInForm(prev => ({ ...prev, invoiceNo: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier / Blow Molding Vendor</label>
                  <input
                    type="text"
                    className="form-input"
                    value={stockInForm.supplier}
                    onChange={e => setStockInForm(prev => ({ ...prev, supplier: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Received in 10 poly bags"
                    value={stockInForm.notes}
                    onChange={e => setStockInForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-emerald">Confirm Stock In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Stock Out (Issue to Filling Floor) */}
      {activeModal === 'STOCK_OUT' && selectedBottle && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Issue Bottles to Filling Line (جاری کریں)
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleStockOutSubmit}>
              <div className="modal-body">
                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>Bottle Mold SKU:</div>
                  <strong style={{ fontSize: '1rem', color: '#7f1d1d' }}>{selectedBottle.name}</strong>
                  <div style={{ fontSize: '0.76rem', color: '#991b1b', marginTop: '2px' }}>
                    Available: {selectedBottle.quantity} Pcs • Cap: {selectedBottle.cap_type}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Bottles Quantity to Issue (Pcs)</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedBottle.quantity}
                    className="form-input"
                    value={stockOutForm.quantity}
                    onChange={e => setStockOutForm(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Filling / Packaging Line</label>
                    <select
                      className="form-select"
                      value={stockOutForm.packagingLine}
                      onChange={e => setStockOutForm(prev => ({ ...prev, packagingLine: e.target.value }))}
                    >
                      <option value="Filling Line 1">Filling Line 1 (Automatic)</option>
                      <option value="Filling Line 2">Filling Line 2 (Manual)</option>
                      <option value="Packaging Bay B">Packaging Bay B</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch Reference #</label>
                    <input
                      type="text"
                      className="form-input"
                      value={stockOutForm.batchNo}
                      onChange={e => setStockOutForm(prev => ({ ...prev, batchNo: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Issued for Toilet Cleaner 600ml production batch"
                    value={stockOutForm.notes}
                    onChange={e => setStockOutForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Confirm Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add New Bottle SKU */}
      {activeModal === 'ADD_NEW' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Register New Empty Bottle SKU (نئی خالی بوتل)
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddNewSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Bottle Mold / Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Empty Toilet 600ml Blue Bottle"
                    value={newBottleForm.name}
                    onChange={e => setNewBottleForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newBottleForm.category}
                      onChange={e => setNewBottleForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Sweep / Toilet Cleaner">Sweep / Toilet Cleaner</option>
                      <option value="Dishwash Cleaner">Dishwash Cleaner</option>
                      <option value="Harpic Cleaner">Harpic Cleaner</option>
                      <option value="Bleach Cleaner">Bleach Cleaner</option>
                      <option value="General Plastic">General Plastic</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bottle Size</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 600ml Bottle"
                      value={newBottleForm.size}
                      onChange={e => setNewBottleForm(prev => ({ ...prev, size: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Plastic Material</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. HDPE Angular Neck / PET"
                      value={newBottleForm.material}
                      onChange={e => setNewBottleForm(prev => ({ ...prev, material: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cap Type / Closure</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Nozzle Cap / Flip Top"
                      value={newBottleForm.cap_type}
                      onChange={e => setNewBottleForm(prev => ({ ...prev, cap_type: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Initial Qty</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={newBottleForm.quantity}
                      onChange={e => setNewBottleForm(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Alert</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={newBottleForm.minimum_stock}
                      onChange={e => setNewBottleForm(prev => ({ ...prev, minimum_stock: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rate (Rs)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      value={newBottleForm.purchase_price}
                      onChange={e => setNewBottleForm(prev => ({ ...prev, purchase_price: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier / Blow Molder</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Apex Blow Molders Ltd"
                    value={newBottleForm.supplier}
                    onChange={e => setNewBottleForm(prev => ({ ...prev, supplier: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Bottle SKU</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Bottle SKU */}
      {activeModal === 'EDIT' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Edit Bottle Specifications (ترمیم کریں)
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Bottle Mold Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editBottleForm.name}
                    onChange={e => setEditBottleForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Plastic Material</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editBottleForm.material}
                      onChange={e => setEditBottleForm(prev => ({ ...prev, material: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cap Type</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editBottleForm.cap_type}
                      onChange={e => setEditBottleForm(prev => ({ ...prev, cap_type: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Minimum Alert (Pcs)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editBottleForm.minimum_stock}
                      onChange={e => setEditBottleForm(prev => ({ ...prev, minimum_stock: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Rate (Rs)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      value={editBottleForm.purchase_price}
                      onChange={e => setEditBottleForm(prev => ({ ...prev, purchase_price: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editBottleForm.supplier}
                    onChange={e => setEditBottleForm(prev => ({ ...prev, supplier: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Specs</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Package,
  Plus,
  Minus,
  Search,
  SlidersHorizontal,
  Trash2,
  Layers,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Truck,
  TrendingUp,
  Tag,
  X,
  Edit2,
  Check,
  RefreshCw,
  Archive,
  ArrowRight
} from 'lucide-react';

// Default standard carton presets for detergent and chemical bottling
export const DEFAULT_EMPTY_CARTONS = [
  {
    id: 'ctn-sweep-600',
    name: 'Empty Sweep 600ml Carton',
    category: 'Sweep / Toilet Cleaner',
    size: '600ml Bottle',
    bottle_capacity: 12,
    quantity: 350,
    damaged_quantity: 4,
    minimum_stock: 150,
    purchase_price: 45,
    supplier: 'Packages Ltd / Corrugated Mills',
    spec: '3-Ply Corrugated Printed Box (12 Bottles)',
    status: 'In Stock'
  },
  {
    id: 'ctn-sweep-1200',
    name: 'Empty Sweep 1.2L Carton',
    category: 'Sweep / Toilet Cleaner',
    size: '1.2 Liter Bottle',
    bottle_capacity: 6,
    quantity: 200,
    damaged_quantity: 2,
    minimum_stock: 100,
    purchase_price: 55,
    supplier: 'Packages Ltd / Corrugated Mills',
    spec: '3-Ply Heavy Duty Printed Box (6 Bottles)',
    status: 'In Stock'
  },
  {
    id: 'ctn-dish-500',
    name: 'Empty Dishwash 500ml Carton',
    category: 'Dishwash Cleaner',
    size: '500ml Bottle',
    bottle_capacity: 16,
    quantity: 280,
    damaged_quantity: 3,
    minimum_stock: 150,
    purchase_price: 50,
    supplier: 'Premier Packaging',
    spec: '3-Ply Printed Box with Partition (16 Bottles)',
    status: 'In Stock'
  },
  {
    id: 'ctn-dish-1000',
    name: 'Empty Dishwash 1L Carton',
    category: 'Dishwash Cleaner',
    size: '1 Liter Bottle',
    bottle_capacity: 15,
    quantity: 180,
    damaged_quantity: 2,
    minimum_stock: 100,
    purchase_price: 60,
    supplier: 'Premier Packaging',
    spec: '5-Ply Heavy Corrugated Box (15 Bottles)',
    status: 'In Stock'
  },
  {
    id: 'ctn-dish-250',
    name: 'Empty Dishwash 250ml Carton',
    category: 'Dishwash Cleaner',
    size: '250ml Bottle',
    bottle_capacity: 24,
    quantity: 120,
    damaged_quantity: 1,
    minimum_stock: 80,
    purchase_price: 48,
    supplier: 'Premier Packaging',
    spec: '3-Ply Box (24 Bottles)',
    status: 'In Stock'
  },
  {
    id: 'ctn-harpic-600',
    name: 'Empty Harpic Carton',
    category: 'Harpic Cleaner',
    size: '500ml / 600ml Bottle',
    bottle_capacity: 14,
    quantity: 160,
    damaged_quantity: 1,
    minimum_stock: 100,
    purchase_price: 52,
    supplier: 'Crown Box Industries',
    spec: '3-Ply Heavy Printed Box (14 Bottles)',
    status: 'In Stock'
  },
  {
    id: 'ctn-bleach-600',
    name: 'Empty Bleach 600ml Carton',
    category: 'Bleach Cleaner',
    size: '600ml Bottle',
    bottle_capacity: 12,
    quantity: 140,
    damaged_quantity: 0,
    minimum_stock: 80,
    purchase_price: 45,
    supplier: 'Crown Box Industries',
    spec: '3-Ply Printed Box (12 Bottles)',
    status: 'In Stock'
  }
];

export default function EmptyCartonsInventory({
  emptyCartons = [],
  setEmptyCartons,
  onStockIn,
  onStockOut,
  onAdjust,
  onDamage,
  onAddNewCarton,
  onDeleteCarton,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'STOCK_IN' | 'STOCK_OUT' | 'ADJUST' | 'DAMAGE' | 'ADD_NEW' | 'EDIT'
  const [selectedCarton, setSelectedCarton] = useState(null);

  // Form states
  const [stockInForm, setStockInForm] = useState({
    quantity: 50,
    supplier: '',
    purchasePrice: '',
    invoiceNo: '',
    notes: ''
  });

  const [stockOutForm, setStockOutForm] = useState({
    quantity: 20,
    packagingLine: 'Packaging Line 1',
    batchNo: `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    notes: ''
  });

  const [adjustForm, setAdjustForm] = useState({
    newQuantity: 0,
    reason: 'Monthly physical warehouse audit'
  });

  const [damageForm, setDamageForm] = useState({
    quantity: 5,
    reason: 'Crushed during warehouse stacking'
  });

  const [newCartonForm, setNewCartonForm] = useState({
    name: '',
    category: 'Sweep / Toilet Cleaner',
    size: '600ml Bottle',
    bottle_capacity: 12,
    quantity: 100,
    minimum_stock: 100,
    purchase_price: 45,
    supplier: 'Corrugated Packaging Mills',
    spec: '3-Ply Corrugated Printed Box'
  });

  const [editCartonForm, setEditCartonForm] = useState({
    id: '',
    name: '',
    category: '',
    size: '',
    bottle_capacity: 12,
    minimum_stock: 100,
    purchase_price: 45,
    supplier: '',
    spec: ''
  });

  // Calculate items with dynamic status
  const items = useMemo(() => {
    return emptyCartons.map(c => {
      const q = Number(c.quantity || 0);
      const min = Number(c.minimum_stock || 100);
      let status = 'In Stock';
      if (q <= 0) status = 'Out of Stock';
      else if (q <= min) status = 'Low Stock';
      return { ...c, status };
    });
  }, [emptyCartons]);

  // Filter items
  const filtered = useMemo(() => {
    return items.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.size || '').toLowerCase().includes(q) ||
        (item.supplier || '').toLowerCase().includes(q) ||
        (item.spec || '').toLowerCase().includes(q);

      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchCat && matchStatus;
    });
  }, [items, searchQuery, categoryFilter, statusFilter]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean));
    return Array.from(set);
  }, [items]);

  // KPI Metrics
  const totalCartons = items.reduce((acc, c) => acc + Number(c.quantity || 0), 0);
  const totalDamaged = items.reduce((acc, c) => acc + Number(c.damaged_quantity || 0), 0);
  const lowStockCount = items.filter(c => c.status === 'Low Stock' || c.status === 'Out of Stock').length;
  const totalValuation = items.reduce((acc, c) => acc + (Number(c.quantity || 0) * Number(c.purchase_price || 0)), 0);
  const totalBottleCapacity = items.reduce((acc, c) => acc + (Number(c.quantity || 0) * Number(c.bottle_capacity || 12)), 0);

  // Quick Preset Add/Stock-In Trigger
  const handleQuickPresetClick = (preset) => {
    // Check if preset already exists in emptyCartons
    const existing = items.find(
      c => c.name.toLowerCase().includes(preset.keyword.toLowerCase()) || c.id === preset.id
    );

    if (existing) {
      // Open Stock In modal for that carton
      setSelectedCarton(existing);
      setStockInForm({
        quantity: 50,
        supplier: existing.supplier || 'Corrugated Packaging Mills',
        purchasePrice: existing.purchase_price || 45,
        invoiceNo: `INV-CTN-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: `Quick restock for ${existing.name}`
      });
      setActiveModal('STOCK_IN');
      if (showToast) showToast(`Selected "${existing.name}". Enter quantity to Stock In.`);
    } else {
      // Add new preset to inventory list
      const newSku = {
        id: preset.id || `ctn-${Date.now()}`,
        name: preset.name,
        category: preset.category,
        size: preset.size,
        bottle_capacity: preset.bottle_capacity,
        quantity: 100,
        damaged_quantity: 0,
        minimum_stock: preset.minimum_stock || 100,
        purchase_price: preset.purchase_price || 45,
        supplier: preset.supplier || 'Corrugated Packaging Mills',
        spec: preset.spec || `${preset.bottle_capacity} Bottles Capacity Box`,
        status: 'In Stock'
      };

      if (onAddNewCarton) {
        onAddNewCarton(newSku);
      } else if (setEmptyCartons) {
        setEmptyCartons(prev => [newSku, ...prev]);
      }
      if (showToast) showToast(`Added "${preset.name}" to Empty Cartons Inventory!`);
    }
  };

  // Submit Stock In
  const handleStockInSubmit = (e) => {
    e.preventDefault();
    if (!selectedCarton) return;
    const qty = parseInt(stockInForm.quantity, 10);
    if (!qty || qty <= 0) {
      if (showToast) showToast('Please enter a valid quantity.');
      return;
    }

    if (onStockIn) {
      onStockIn(selectedCarton, qty, stockInForm);
    } else if (setEmptyCartons) {
      setEmptyCartons(prev =>
        prev.map(c => (c.id === selectedCarton.id ? { ...c, quantity: Number(c.quantity || 0) + qty } : c))
      );
      if (showToast) showToast(`Received +${qty} Empty Cartons for ${selectedCarton.name}!`);
    }

    setActiveModal(null);
  };

  // Submit Stock Out / Issue to Packing Floor
  const handleStockOutSubmit = (e) => {
    e.preventDefault();
    if (!selectedCarton) return;
    const qty = parseInt(stockOutForm.quantity, 10);
    if (!qty || qty <= 0) {
      if (showToast) showToast('Please enter a valid quantity.');
      return;
    }

    if (qty > (selectedCarton.quantity || 0)) {
      if (showToast) showToast(`Cannot issue ${qty} cartons. Current stock is only ${selectedCarton.quantity}.`);
      return;
    }

    if (onStockOut) {
      onStockOut(selectedCarton, qty, stockOutForm);
    } else if (setEmptyCartons) {
      setEmptyCartons(prev =>
        prev.map(c => (c.id === selectedCarton.id ? { ...c, quantity: Math.max(0, Number(c.quantity || 0) - qty) } : c))
      );
      if (showToast) showToast(`Issued -${qty} Empty Cartons to ${stockOutForm.packagingLine}!`);
    }

    setActiveModal(null);
  };

  // Submit Adjustment
  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!selectedCarton) return;
    const newQty = Math.max(0, parseInt(adjustForm.newQuantity, 10) || 0);

    if (onAdjust) {
      onAdjust(selectedCarton, newQty, adjustForm.reason);
    } else if (setEmptyCartons) {
      setEmptyCartons(prev =>
        prev.map(c => (c.id === selectedCarton.id ? { ...c, quantity: newQty } : c))
      );
      if (showToast) showToast(`Stock for ${selectedCarton.name} adjusted to ${newQty} cartons.`);
    }

    setActiveModal(null);
  };

  // Submit Damage
  const handleDamageSubmit = (e) => {
    e.preventDefault();
    if (!selectedCarton) return;
    const dmgQty = parseInt(damageForm.quantity, 10);
    if (!dmgQty || dmgQty <= 0) return;

    if (onDamage) {
      onDamage(selectedCarton, dmgQty, damageForm.reason);
    } else if (setEmptyCartons) {
      setEmptyCartons(prev =>
        prev.map(c => {
          if (c.id === selectedCarton.id) {
            return {
              ...c,
              quantity: Math.max(0, Number(c.quantity || 0) - dmgQty),
              damaged_quantity: Number(c.damaged_quantity || 0) + dmgQty
            };
          }
          return c;
        })
      );
      if (showToast) showToast(`Recorded ${dmgQty} damaged cartons for ${selectedCarton.name}.`);
    }

    setActiveModal(null);
  };

  // Submit Add New SKU
  const handleAddNewSubmit = (e) => {
    e.preventDefault();
    if (!newCartonForm.name.trim()) {
      if (showToast) showToast('Please enter a carton name.');
      return;
    }

    const newSku = {
      id: `ctn-${Date.now()}`,
      name: newCartonForm.name.trim(),
      category: newCartonForm.category,
      size: newCartonForm.size,
      bottle_capacity: parseInt(newCartonForm.bottle_capacity, 10) || 12,
      quantity: parseInt(newCartonForm.quantity, 10) || 0,
      damaged_quantity: 0,
      minimum_stock: parseInt(newCartonForm.minimum_stock, 10) || 100,
      purchase_price: parseFloat(newCartonForm.purchase_price) || 0,
      supplier: newCartonForm.supplier || 'Packaging Supplier',
      spec: newCartonForm.spec || 'Standard Corrugated Box',
      status: 'In Stock'
    };

    if (onAddNewCarton) {
      onAddNewCarton(newSku);
    } else if (setEmptyCartons) {
      setEmptyCartons(prev => [newSku, ...prev]);
    }

    if (showToast) showToast(`Created new carton SKU: "${newSku.name}"!`);
    setActiveModal(null);
    setNewCartonForm({
      name: '',
      category: 'Sweep / Toilet Cleaner',
      size: '600ml Bottle',
      bottle_capacity: 12,
      quantity: 100,
      minimum_stock: 100,
      purchase_price: 45,
      supplier: 'Corrugated Packaging Mills',
      spec: '3-Ply Corrugated Printed Box'
    });
  };

  // Submit Edit SKU
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editCartonForm.id) return;

    if (setEmptyCartons) {
      setEmptyCartons(prev =>
        prev.map(c => {
          if (c.id === editCartonForm.id) {
            return {
              ...c,
              name: editCartonForm.name,
              category: editCartonForm.category,
              size: editCartonForm.size,
              bottle_capacity: parseInt(editCartonForm.bottle_capacity, 10) || 12,
              minimum_stock: parseInt(editCartonForm.minimum_stock, 10) || 100,
              purchase_price: parseFloat(editCartonForm.purchase_price) || 0,
              supplier: editCartonForm.supplier,
              spec: editCartonForm.spec
            };
          }
          return c;
        })
      );
    }

    if (showToast) showToast(`Updated specifications for "${editCartonForm.name}".`);
    setActiveModal(null);
  };

  // Quick Presets List for the Top Action Strip
  const QUICK_PRESETS = [
    {
      id: 'ctn-sweep-600',
      keyword: 'Sweep 600',
      name: 'Empty Sweep 600ml Carton',
      category: 'Sweep / Toilet Cleaner',
      size: '600ml Bottle',
      bottle_capacity: 12,
      purchase_price: 45,
      spec: '12 Bottles / Carton (Sweep 600ml)',
      badgeColor: '#0284c7'
    },
    {
      id: 'ctn-sweep-1200',
      keyword: 'Sweep 1.2',
      name: 'Empty Sweep 1.2L Carton',
      category: 'Sweep / Toilet Cleaner',
      size: '1.2 Liter Bottle',
      bottle_capacity: 6,
      purchase_price: 55,
      spec: '6 Bottles / Carton (Sweep 1.2L)',
      badgeColor: '#2563eb'
    },
    {
      id: 'ctn-dish-500',
      keyword: 'Dishwash 500',
      name: 'Empty Dishwash 500ml Carton',
      category: 'Dishwash Cleaner',
      size: '500ml Bottle',
      bottle_capacity: 16,
      purchase_price: 50,
      spec: '16 Bottles / Carton (Dishwash 500ml)',
      badgeColor: '#059669'
    },
    {
      id: 'ctn-dish-1000',
      keyword: 'Dishwash 1L',
      name: 'Empty Dishwash 1L Carton',
      category: 'Dishwash Cleaner',
      size: '1 Liter Bottle',
      bottle_capacity: 15,
      purchase_price: 60,
      spec: '15 Bottles / Carton (Dishwash 1L)',
      badgeColor: '#d97706'
    },
    {
      id: 'ctn-harpic-600',
      keyword: 'Harpic',
      name: 'Empty Harpic Carton',
      category: 'Harpic Cleaner',
      size: '500ml / 600ml Bottle',
      bottle_capacity: 14,
      purchase_price: 52,
      spec: '14 Bottles / Carton (Harpic)',
      badgeColor: '#7c3aed'
    },
    {
      id: 'ctn-bleach-600',
      keyword: 'Bleach 600',
      name: 'Empty Bleach 600ml Carton',
      category: 'Bleach Cleaner',
      size: '600ml Bottle',
      bottle_capacity: 12,
      purchase_price: 45,
      spec: '12 Bottles / Carton (Bleach 600ml)',
      badgeColor: '#e11d48'
    }
  ];

  return (
    <div className="empty-cartons-section" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ========================================================
          PANEL 1: HEADER & QUICK PRESET BUTTONS
         ======================================================== */}
      <div className="panel" style={{ margin: 0 }}>
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div className="panel-title-group">
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.28)'
              }}
            >
              <Layers size={24} />
            </div>
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.3rem' }}>
                Empty Cartons Storage{' '}
                <span style={{ color: '#0284c7', fontSize: '0.95rem', fontWeight: 700 }}>
                  (خالی کارٹن اور کوروگیٹڈ باکسز)
                </span>
              </h2>
              <p className="panel-desc">
                Manage raw master cartons, corrugated packaging boxes, partitions, and pack-ready containers.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-emerald btn-sm"
              onClick={() => {
                if (items.length > 0) {
                  setSelectedCarton(items[0]);
                  setStockInForm({
                    quantity: 50,
                    supplier: items[0].supplier || 'Corrugated Packaging Mills',
                    purchasePrice: items[0].purchase_price || 45,
                    invoiceNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                    notes: ''
                  });
                  setActiveModal('STOCK_IN');
                } else {
                  setActiveModal('ADD_NEW');
                }
              }}
              title="Receive incoming empty cartons from factory"
            >
              <Plus size={15} />
              <span>+ Receive Empty Cartons</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveModal('ADD_NEW')}
              title="Add a new custom empty carton size / specification"
            >
              <Plus size={15} />
              <span>+ Add Custom Carton</span>
            </button>
          </div>
        </div>

        {/* QUICK PRESET BUTTONS STRIP */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: '#fafbfc' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={16} color="#0284c7" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>
                Quick Presets (ایک کلک سے کارٹن شامل کریں):
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Click any carton below to quickly restock or register
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '10px'
            }}
          >
            {QUICK_PRESETS.map(preset => {
              const matched = items.find(
                c => c.name.toLowerCase().includes(preset.keyword.toLowerCase()) || c.id === preset.id
              );

              return (
                <div
                  key={preset.id}
                  onClick={() => handleQuickPresetClick(preset)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = preset.badgeColor;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                      {preset.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Holds <strong style={{ color: preset.badgeColor }}>{preset.bottle_capacity} Bottles</strong> (Rs {preset.purchase_price})
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {matched ? (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: matched.status === 'In Stock' ? '#ecfdf5' : '#fef2f2',
                          color: matched.status === 'In Stock' ? '#059669' : '#e11d48'
                        }}
                      >
                        {matched.quantity} in stock
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          color: '#475569'
                        }}
                      >
                        + Add SKU
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* METRICS KPI CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            padding: '18px 20px',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#0284c7',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Boxes size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                Total Empty Cartons
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0c4a6e' }}>
                {totalCartons.toLocaleString()}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Boxes</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#059669',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                Packaging Capacity
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#064e3b' }}>
                {totalBottleCapacity.toLocaleString()}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Bottles</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#7c3aed',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase' }}>
                Inventory Valuation
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4c1d95' }}>
                Rs {totalValuation.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: lowStockCount > 0 ? '#fff1f2' : '#f8fafc',
              border: `1px solid ${lowStockCount > 0 ? '#fecdd3' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: lowStockCount > 0 ? '#e11d48' : '#94a3b8',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: lowStockCount > 0 ? '#be123c' : '#64748b',
                  textTransform: 'uppercase'
                }}
              >
                Low / Reorder Stock
              </div>
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: lowStockCount > 0 ? '#881337' : '#334155'
                }}
              >
                {lowStockCount}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>SKUs</span>
              </div>
            </div>
          </div>

          {/* Card 5 */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: totalDamaged > 0 ? '#fffbeb' : '#f8fafc',
              border: `1px solid ${totalDamaged > 0 ? '#fde68a' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: totalDamaged > 0 ? '#d97706' : '#94a3b8',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertOctagon size={20} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: totalDamaged > 0 ? '#b45309' : '#64748b',
                  textTransform: 'uppercase'
                }}
              >
                Damaged / Scrapped
              </div>
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: totalDamaged > 0 ? '#78350f' : '#334155'
                }}
              >
                {totalDamaged}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Boxes</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: '220px', margin: 0 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search empty cartons (Sweep, Dishwash, Harpic, Bleach)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <select
              className="filter-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ minWidth: '170px' }}
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ minWidth: '140px' }}
            >
              <option value="ALL">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              Showing {filtered.length} of {items.length} cartons
            </span>

            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '6px 12px',
                  background: viewMode === 'table' ? '#0284c7' : '#ffffff',
                  color: viewMode === 'table' ? '#ffffff' : '#64748b',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Table View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '6px 12px',
                  background: viewMode === 'cards' ? '#0284c7' : '#ffffff',
                  color: viewMode === 'cards' ? '#ffffff' : '#64748b',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cards View
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            VIEW MODE: TABLE VIEW
           ======================================================== */}
        {viewMode === 'table' ? (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Carton Name & Specifications</th>
                  <th>Category & Size</th>
                  <th style={{ textAlign: 'center' }}>Bottle Capacity</th>
                  <th style={{ textAlign: 'right' }}>Stock (Boxes)</th>
                  <th style={{ textAlign: 'center' }}>Damaged</th>
                  <th>Supplier & Price</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <Layers size={36} color="#cbd5e1" />
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
                          No Empty Cartons Found
                        </div>
                        <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                          Add your empty carton inventory by clicking the quick presets above (Sweep 600ml, Sweep 1.2L, Dishwash, etc.) or add a custom carton SKU.
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveModal('ADD_NEW')}
                          style={{ marginTop: '8px' }}
                        >
                          <Plus size={14} />
                          <span>+ Add Empty Carton SKU</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(carton => {
                    const isLow = carton.status === 'Low Stock';
                    const isOut = carton.status === 'Out of Stock';

                    return (
                      <tr key={carton.id} style={{ background: isOut ? '#fff5f5' : isLow ? '#fffdf7' : 'inherit' }}>
                        {/* Column 1: Name & Spec */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: '#f1f5f9',
                                color: '#0284c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Layers size={18} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                                {carton.name}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                {carton.spec || `${carton.bottle_capacity} Bottles Packaging Box`}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Category */}
                        <td>
                          <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.84rem' }}>
                            {carton.category}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{carton.size}</div>
                        </td>

                        {/* Column 3: Capacity */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontWeight: 700,
                              fontSize: '0.82rem'
                            }}
                          >
                            {carton.bottle_capacity} btls/ctn
                          </span>
                        </td>

                        {/* Column 4: Stock Quantity */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isOut ? '#e11d48' : '#0f172a' }}>
                            {Number(carton.quantity || 0).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Min Reorder: {carton.minimum_stock || 100}
                          </div>
                        </td>

                        {/* Column 5: Damaged */}
                        <td style={{ textAlign: 'center' }}>
                          {carton.damaged_quantity > 0 ? (
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: '#fffbeb',
                                color: '#b45309',
                                fontSize: '0.78rem',
                                fontWeight: 700
                              }}
                            >
                              {carton.damaged_quantity} waste
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>0</span>
                          )}
                        </td>

                        {/* Column 6: Supplier & Price */}
                        <td>
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                            Rs {carton.purchase_price || 0} / ctn
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {carton.supplier || 'Packaging Supplier'}
                          </div>
                        </td>

                        {/* Column 7: Status */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`badge ${
                              carton.status === 'In Stock'
                                ? 'badge-success'
                                : carton.status === 'Low Stock'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {carton.status}
                          </span>
                        </td>

                        {/* Column 8: Actions */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-emerald btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setSelectedCarton(carton);
                                setStockInForm({
                                  quantity: 50,
                                  supplier: carton.supplier || '',
                                  purchasePrice: carton.purchase_price || 45,
                                  invoiceNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                                  notes: ''
                                });
                                setActiveModal('STOCK_IN');
                              }}
                              title="Receive / Stock In Cartons"
                            >
                              <Plus size={13} />
                              <span>Receive</span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setSelectedCarton(carton);
                                setStockOutForm({
                                  quantity: Math.min(20, carton.quantity || 1),
                                  packagingLine: 'Packaging Line 1',
                                  batchNo: `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                                  notes: ''
                                });
                                setActiveModal('STOCK_OUT');
                              }}
                              disabled={carton.quantity <= 0}
                              title="Issue to Packaging Floor"
                            >
                              <Minus size={13} />
                              <span>Issue</span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setSelectedCarton(carton);
                                setAdjustForm({
                                  newQuantity: carton.quantity || 0,
                                  reason: 'Physical count audit'
                                });
                                setActiveModal('ADJUST');
                              }}
                              title="Set Stock / Adjust"
                            >
                              <SlidersHorizontal size={13} />
                            </button>

                            <button
                              type="button"
                              className="btn btn-amber btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setSelectedCarton(carton);
                                setDamageForm({
                                  quantity: 2,
                                  reason: 'Crushed box'
                                });
                                setActiveModal('DAMAGE');
                              }}
                              title="Log Damaged Box"
                            >
                              <AlertOctagon size={13} />
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setEditCartonForm({
                                  id: carton.id,
                                  name: carton.name,
                                  category: carton.category,
                                  size: carton.size,
                                  bottle_capacity: carton.bottle_capacity || 12,
                                  minimum_stock: carton.minimum_stock || 100,
                                  purchase_price: carton.purchase_price || 45,
                                  supplier: carton.supplier || '',
                                  spec: carton.spec || ''
                                });
                                setActiveModal('EDIT');
                              }}
                              title="Edit Specifications"
                            >
                              <Edit2 size={13} />
                            </button>

                            {onDeleteCarton && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', color: '#e11d48' }}
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${carton.name}"?`)) {
                                    onDeleteCarton(carton);
                                  }
                                }}
                                title="Delete SKU"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
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
          /* ========================================================
              VIEW MODE: CARDS GRID VIEW
             ======================================================== */
          <div
            style={{
              padding: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px'
            }}
          >
            {filtered.map(carton => {
              const isLow = carton.status === 'Low Stock';
              const isOut = carton.status === 'Out of Stock';

              return (
                <div
                  key={carton.id}
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${isOut ? '#fca5a5' : isLow ? '#fde047' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span className={`badge ${carton.status === 'In Stock' ? 'badge-success' : carton.status === 'Low Stock' ? 'badge-warning' : 'badge-danger'}`}>
                        {carton.status}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '2px 8px', borderRadius: '4px' }}>
                        {carton.bottle_capacity} btls/ctn
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                      {carton.name}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>
                      {carton.spec || `${carton.category} - ${carton.size}`}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Available Stock</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isOut ? '#e11d48' : '#0f172a' }}>
                          {carton.quantity} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>ctns</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Holds Bottles</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                          {(carton.quantity * carton.bottle_capacity).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>btls</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '14px' }}>
                      <span>Reorder Point: <strong>{carton.minimum_stock || 100}</strong></span>
                      <span>Rate: <strong>Rs {carton.purchase_price || 0}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-emerald btn-sm"
                      style={{ justifyContent: 'center' }}
                      onClick={() => {
                        setSelectedCarton(carton);
                        setStockInForm({
                          quantity: 50,
                          supplier: carton.supplier || '',
                          purchasePrice: carton.purchase_price || 45,
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
                      className="btn btn-danger btn-sm"
                      style={{ justifyContent: 'center' }}
                      disabled={carton.quantity <= 0}
                      onClick={() => {
                        setSelectedCarton(carton);
                        setStockOutForm({
                          quantity: Math.min(20, carton.quantity || 1),
                          packagingLine: 'Packaging Line 1',
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

      {/* ========================================================
          MODAL 1: STOCK IN / RECEIVE EMPTY CARTONS
         ======================================================== */}
      {activeModal === 'STOCK_IN' && selectedCarton && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Receive Empty Cartons (کارٹن وصول کریں)</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedCarton.name}</div>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStockInSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Current Stock</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{selectedCarton.quantity} Boxes</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Bottle Capacity</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0284c7' }}>{selectedCarton.bottle_capacity} bottles/ctn</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Quantity to Receive (کتنے کارٹن آئے؟) <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={stockInForm.quantity}
                    onChange={e => setStockInForm(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    This delivery will provide packaging space for <strong>{(parseInt(stockInForm.quantity, 10) || 0) * (selectedCarton.bottle_capacity || 12)} bottles</strong>.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Purchase Rate / Box (Rs)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      value={stockInForm.purchasePrice}
                      onChange={e => setStockInForm(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Invoice / DC Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={stockInForm.invoiceNo}
                      onChange={e => setStockInForm(prev => ({ ...prev, invoiceNo: e.target.value }))}
                      placeholder="e.g. DC-5021"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier / Factory</label>
                  <input
                    type="text"
                    className="form-input"
                    value={stockInForm.supplier}
                    onChange={e => setStockInForm(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="e.g. Packages Ltd / Corrugated Mills"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Storage Pallet Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={stockInForm.notes}
                    onChange={e => setStockInForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g. Pallet Rack Bay B-03, Fluted Grade A"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-emerald">
                  <Plus size={16} />
                  <span>Confirm Receive (+{stockInForm.quantity} Cartons)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: STOCK OUT / ISSUE TO PACKAGING FLOOR
         ======================================================== */}
      {activeModal === 'STOCK_OUT' && selectedCarton && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Minus size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Issue Cartons to Packaging Floor (پیکنگ کے لیے جاری کریں)</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedCarton.name}</div>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStockOutSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Available Stock</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{selectedCarton.quantity} Boxes</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Holds Bottles</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}>{selectedCarton.bottle_capacity} btls/ctn</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Quantity to Issue (کتنے کارٹن جاری کریں؟) <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedCarton.quantity || 1}
                    className="form-input"
                    value={stockOutForm.quantity}
                    onChange={e => setStockOutForm(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Sufficient to pack <strong>{(parseInt(stockOutForm.quantity, 10) || 0) * (selectedCarton.bottle_capacity || 12)} bottles</strong>.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Packaging Line</label>
                    <select
                      className="form-select"
                      value={stockOutForm.packagingLine}
                      onChange={e => setStockOutForm(prev => ({ ...prev, packagingLine: e.target.value }))}
                    >
                      <option value="Packaging Line 1">Packaging Line 1 (Automatic)</option>
                      <option value="Packaging Line 2">Packaging Line 2 (Manual)</option>
                      <option value="Packaging Line 3">Packaging Line 3</option>
                      <option value="Dispatch Area">Dispatch Area</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Batch / Lot Number</label>
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
                    value={stockOutForm.notes}
                    onChange={e => setStockOutForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g. Issued for today's filling shift"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  <Minus size={16} />
                  <span>Issue (-{stockOutForm.quantity} Cartons)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: ADJUST STOCK / PHYSICAL AUDIT
         ======================================================== */}
      {activeModal === 'ADJUST' && selectedCarton && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Adjust Physical Stock (انوینٹری آڈٹ)</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedCarton.name}</div>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">
                    New Physical Count (اصل گنتی کے مطابق تعداد) <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={adjustForm.newQuantity}
                    onChange={e => setAdjustForm(prev => ({ ...prev, newQuantity: e.target.value }))}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Previous Count: <strong>{selectedCarton.quantity}</strong> | Difference:{' '}
                    <strong style={{ color: Number(adjustForm.newQuantity) >= Number(selectedCarton.quantity) ? '#059669' : '#e11d48' }}>
                      {Number(adjustForm.newQuantity) - Number(selectedCarton.quantity)} boxes
                    </strong>
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Adjustment</label>
                  <input
                    type="text"
                    className="form-input"
                    value={adjustForm.reason}
                    onChange={e => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g. Monthly physical stock audit / count correction"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  <span>Update Stock Count</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: DAMAGE / WASTE RECORDING
         ======================================================== */}
      {activeModal === 'DAMAGE' && selectedCarton && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertOctagon size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Record Damaged Cartons (ضائع شدہ کارٹن)</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedCarton.name}</div>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDamageSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Damaged / Torn Quantity (کتنے کارٹن خراب یا ٹوٹے؟) <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={damageForm.quantity}
                    onChange={e => setDamageForm(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    This amount will be deducted from active stock and logged as waste.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Damage Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={damageForm.reason}
                    onChange={e => setDamageForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g. Water damage, crushed under heavy stack, torn partition"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-amber">
                  <AlertOctagon size={16} />
                  <span>Record Waste</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: ADD NEW EMPTY CARTON SKU
         ======================================================== */}
      {activeModal === 'ADD_NEW' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Register Empty Carton SKU (نیا کارٹن شامل کریں)</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Define packaging box capacity, size, and supplier</div>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Carton Name (کارٹن کا نام) <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCartonForm.name}
                    onChange={e => setNewCartonForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Empty Sweep 600ml Carton, Empty Harpic 500ml Carton"
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newCartonForm.category}
                      onChange={e => setNewCartonForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Sweep / Toilet Cleaner">Sweep / Toilet Cleaner</option>
                      <option value="Dishwash Cleaner">Dishwash Cleaner</option>
                      <option value="Harpic Cleaner">Harpic Cleaner</option>
                      <option value="Bleach Cleaner">Bleach Cleaner</option>
                      <option value="General Packaging">General Packaging</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bottle Size It Packs</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newCartonForm.size}
                      onChange={e => setNewCartonForm(prev => ({ ...prev, size: e.target.value }))}
                      placeholder="e.g. 600ml Bottle, 1.2L Bottle, 500ml"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Bottles per Carton (بوتلوں کی گنجائش) <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={newCartonForm.bottle_capacity}
                      onChange={e => setNewCartonForm(prev => ({ ...prev, bottle_capacity: e.target.value }))}
                      required
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      e.g. 12 for Sweep 600ml, 6 for 1.2L, 16 for Dishwash 500ml
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Stock (Boxes)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={newCartonForm.quantity}
                      onChange={e => setNewCartonForm(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Minimum Reorder Stock</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={newCartonForm.minimum_stock}
                      onChange={e => setNewCartonForm(prev => ({ ...prev, minimum_stock: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Price / Box (Rs)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      value={newCartonForm.purchase_price}
                      onChange={e => setNewCartonForm(prev => ({ ...prev, purchase_price: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Box Specifications</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCartonForm.spec}
                    onChange={e => setNewCartonForm(prev => ({ ...prev, spec: e.target.value }))}
                    placeholder="e.g. 3-Ply Printed Corrugated Box with honeycomb partition"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier / Factory</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCartonForm.supplier}
                    onChange={e => setNewCartonForm(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="e.g. Packages Ltd / Corrugated Mills"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Register Carton SKU</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: EDIT CARTON SKU
         ======================================================== */}
      {activeModal === 'EDIT' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Edit Carton Specifications (کارٹن کی تفصیلات)</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Update packaging capacity and price</div>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Carton Name <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editCartonForm.name}
                    onChange={e => setEditCartonForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editCartonForm.category}
                      onChange={e => setEditCartonForm(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Size</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editCartonForm.size}
                      onChange={e => setEditCartonForm(prev => ({ ...prev, size: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Bottle Capacity per Carton</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={editCartonForm.bottle_capacity}
                      onChange={e => setEditCartonForm(prev => ({ ...prev, bottle_capacity: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Minimum Stock</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={editCartonForm.minimum_stock}
                      onChange={e => setEditCartonForm(prev => ({ ...prev, minimum_stock: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Purchase Rate / Box (Rs)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      value={editCartonForm.purchase_price}
                      onChange={e => setEditCartonForm(prev => ({ ...prev, purchase_price: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supplier</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editCartonForm.supplier}
                      onChange={e => setEditCartonForm(prev => ({ ...prev, supplier: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Specifications / Grade</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editCartonForm.spec}
                    onChange={e => setEditCartonForm(prev => ({ ...prev, spec: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

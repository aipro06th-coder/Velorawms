'use client';

import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Package,
  Truck,
  Plus,
  Minus,
  Search,
  SlidersHorizontal,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  MapPin,
  FileText,
  X,
  Tag,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Check
} from 'lucide-react';

export default function FilledCartonsInventory({
  productSizes = [],
  products = [],
  onPackCartons,
  onDispatchCartons,
  onAdjustCartons,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'PACK' | 'DISPATCH' | 'PRINT_LABEL' | 'ADJUST'
  const [selectedSize, setSelectedSize] = useState(null);

  // Form states
  const [packForm, setPackForm] = useState({
    sizeId: '',
    cartonsToPack: 10,
    palletLocation: 'Pallet Bay A-01',
    batchNo: `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    packingDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [dispatchForm, setDispatchForm] = useState({
    sizeId: '',
    cartonsToDispatch: 5,
    customerName: '',
    gatePassNo: `GP-${Math.floor(1000 + Math.random() * 9000)}`,
    notes: ''
  });

  // Calculate high-level summary KPIs
  const kpis = useMemo(() => {
    let totalCartons = 0;
    let totalBottlesPacked = 0;
    let totalValuation = 0;
    let lowStockCount = 0;

    productSizes.forEach((s) => {
      const ctns = Number(s.carton_quantity) || 0;
      const bpc = Number(s.bottles_per_carton) || 24;
      const price = Number(s.selling_price) || Number(s.purchase_price) || 0;
      const minStock = Number(s.minimum_stock) || 10;

      totalCartons += ctns;
      totalBottlesPacked += ctns * bpc;
      totalValuation += ctns * bpc * price;

      if (ctns > 0 && ctns <= minStock) {
        lowStockCount += 1;
      }
    });

    return {
      totalCartons,
      totalBottlesPacked,
      totalValuation,
      lowStockCount
    };
  }, [productSizes]);

  // Filtered cartons
  const filteredCartons = useMemo(() => {
    return productSizes.filter((s) => {
      const prodName = (s.product_name || '').toLowerCase();
      const sizeName = (s.size || s.size_name || '').toLowerCase();
      const cat = (s.category || '').toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = prodName.includes(q) || sizeName.includes(q) || cat.includes(q);

      const matchesCategory =
        categoryFilter === 'ALL' ||
        (s.category && s.category.toLowerCase().includes(categoryFilter.toLowerCase())) ||
        (s.product_name && s.product_name.toLowerCase().includes(categoryFilter.toLowerCase()));

      const ctns = Number(s.carton_quantity) || 0;
      const minStock = Number(s.minimum_stock) || 10;

      let matchesStatus = true;
      if (stockStatusFilter === 'IN_STOCK') {
        matchesStatus = ctns > minStock;
      } else if (stockStatusFilter === 'LOW_STOCK') {
        matchesStatus = ctns > 0 && ctns <= minStock;
      } else if (stockStatusFilter === 'OUT_OF_STOCK') {
        matchesStatus = ctns === 0;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [productSizes, searchQuery, categoryFilter, stockStatusFilter]);

  // Handle Pack Submit
  const handlePackSubmit = (e) => {
    e.preventDefault();
    const size = productSizes.find((s) => String(s.id) === String(packForm.sizeId));
    if (!size) {
      if (showToast) showToast('Please select a valid product size to pack.');
      return;
    }

    const ctns = parseInt(packForm.cartonsToPack, 10);
    if (!ctns || ctns <= 0) {
      if (showToast) showToast('Please enter a valid carton quantity.');
      return;
    }

    if (onPackCartons) {
      onPackCartons(size, ctns, {
        palletLocation: packForm.palletLocation,
        batchNo: packForm.batchNo,
        notes: packForm.notes
      });
    }

    setActiveModal(null);
  };

  // Handle Dispatch Submit
  const handleDispatchSubmit = (e) => {
    e.preventDefault();
    const size = productSizes.find((s) => String(s.id) === String(dispatchForm.sizeId));
    if (!size) {
      if (showToast) showToast('Please select a valid product size to dispatch.');
      return;
    }

    const ctns = parseInt(dispatchForm.cartonsToDispatch, 10);
    if (!ctns || ctns <= 0) {
      if (showToast) showToast('Please enter a valid carton quantity to dispatch.');
      return;
    }

    if (ctns > (size.carton_quantity || 0)) {
      if (showToast) showToast(`Cannot dispatch ${ctns} cartons! Only ${size.carton_quantity || 0} in stock.`);
      return;
    }

    if (onDispatchCartons) {
      onDispatchCartons(size, ctns, {
        customerName: dispatchForm.customerName || 'Wholesale Customer',
        gatePassNo: dispatchForm.gatePassNo,
        notes: dispatchForm.notes
      });
    }

    setActiveModal(null);
  };

  return (
    <div className="filled-cartons-section">
      {/* Header Banner */}
      <div className="cartons-header">
        <div className="cartons-header-left">
          <div className="cartons-icon-badge">
            <Boxes size={26} />
          </div>
          <div>
            <h2 className="cartons-title">
              Filled Cartons Inventory <span className="cartons-urdu-subtitle">(بھرے ہوئے کارٹن / Packed Goods)</span>
            </h2>
            <p className="cartons-desc">
              Manage finished products packed into master cartons ready for warehouse storage and customer dispatch.
            </p>
          </div>
        </div>

        <div className="cartons-header-actions">
          <button
            className="btn btn-emerald btn-sm"
            onClick={() => {
              const defaultSize = productSizes[0];
              setPackForm({
                sizeId: defaultSize ? String(defaultSize.id) : '',
                cartonsToPack: 10,
                palletLocation: 'Pallet Bay A-01',
                batchNo: `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                packingDate: new Date().toISOString().split('T')[0],
                notes: ''
              });
              setActiveModal('PACK');
            }}
          >
            <Plus size={16} />
            <span>Pack New Cartons (کارٹن پیک کریں)</span>
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              const availableSize = productSizes.find((s) => (s.carton_quantity || 0) > 0) || productSizes[0];
              setDispatchForm({
                sizeId: availableSize ? String(availableSize.id) : '',
                cartonsToDispatch: 5,
                customerName: '',
                gatePassNo: `GP-${Math.floor(1000 + Math.random() * 9000)}`,
                notes: ''
              });
              setActiveModal('DISPATCH');
            }}
          >
            <Truck size={16} />
            <span>Dispatch Cartons (ڈسپیچ کریں)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="cartons-kpi-grid">
        <div className="carton-kpi-card" style={{ '--card-accent': '#0284c7' }}>
          <div className="carton-kpi-header">
            <span className="carton-kpi-label">Total Filled Cartons (کل کارٹن)</span>
            <div className="carton-kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Boxes size={18} />
            </div>
          </div>
          <div className="carton-kpi-value">{kpis.totalCartons.toLocaleString()}</div>
          <div className="carton-kpi-footer">
            <span className="carton-kpi-sub">Ready for Wholesale & Dispatch</span>
          </div>
        </div>

        <div className="carton-kpi-card" style={{ '--card-accent': '#059669' }}>
          <div className="carton-kpi-header">
            <span className="carton-kpi-label">Bottles Inside Cartons (بوتلیں)</span>
            <div className="carton-kpi-icon" style={{ background: '#d1fae5', color: '#059669' }}>
              <Package size={18} />
            </div>
          </div>
          <div className="carton-kpi-value">{kpis.totalBottlesPacked.toLocaleString()}</div>
          <div className="carton-kpi-footer">
            <span className="carton-kpi-sub">Total Units Sealed in Boxes</span>
          </div>
        </div>

        <div className="carton-kpi-card" style={{ '--card-accent': '#7c3aed' }}>
          <div className="carton-kpi-header">
            <span className="carton-kpi-label">Master Cartons Valuation (کل قیمت)</span>
            <div className="carton-kpi-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="carton-kpi-value">Rs. {Math.round(kpis.totalValuation).toLocaleString()}</div>
          <div className="carton-kpi-footer">
            <span className="carton-kpi-sub">Finished Goods Inventory Value</span>
          </div>
        </div>

        <div className="carton-kpi-card" style={{ '--card-accent': '#d97706' }}>
          <div className="carton-kpi-header">
            <span className="carton-kpi-label">Low Stock Alerts (کم کارٹن)</span>
            <div className="carton-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="carton-kpi-value">{kpis.lowStockCount}</div>
          <div className="carton-kpi-footer">
            <span className="carton-kpi-sub">SKUs below safe carton threshold</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="cartons-control-bar">
        <div className="cartons-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="cartons-search-input"
            placeholder="Search filled carton by product name, category, or size..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="cartons-filter-group">
          <select
            className="cartons-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="Sweep">Sweep / Toilet Cleaner</option>
            <option value="Dishwash">Dishwash Bottles & Cans</option>
            <option value="Bleach">Bleach Cleaners</option>
            <option value="Harpic">Harpic Cleaners</option>
          </select>

          <select
            className="cartons-select"
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_STOCK">Well Stocked (&gt; 10 ctns)</option>
            <option value="LOW_STOCK">Low Stock (≤ 10 ctns)</option>
            <option value="OUT_OF_STOCK">Zero Cartons (0 ctns)</option>
          </select>

          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              Table
            </button>
            <button
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Pallet Cards View"
            >
              Pallet Cards
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {viewMode === 'table' ? (
        <div className="table-wrapper cartons-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product & Master Carton SKU</th>
                <th>Packing Spec (Pack Ratio)</th>
                <th>Filled Cartons in Stock (بھرے کارٹن)</th>
                <th>Bottled Units Equivalent</th>
                <th>Pallet / Rack Location</th>
                <th>Selling Price / Carton</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCartons.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <Boxes size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 600 }}>No filled cartons match your search criteria.</p>
                    <p style={{ fontSize: '0.8rem' }}>Click &quot;Pack New Cartons&quot; to add packed goods.</p>
                  </td>
                </tr>
              ) : (
                filteredCartons.map((s) => {
                  const ctns = Number(s.carton_quantity) || 0;
                  const bpc = Number(s.bottles_per_carton) || 24;
                  const totalBtls = ctns * bpc;
                  const minStock = Number(s.minimum_stock) || 10;
                  const price = Number(s.selling_price) || Number(s.purchase_price) || 0;
                  const cartonPrice = price * bpc;

                  const isLow = ctns > 0 && ctns <= minStock;
                  const isZero = ctns === 0;

                  return (
                    <tr key={s.id} className={isLow ? 'row-warning' : isZero ? 'row-danger' : ''}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#0284c7',
                              fontWeight: 800,
                              fontSize: '0.8rem'
                            }}
                          >
                            📦
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.product_name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              Size: <strong>{s.size || s.size_name}</strong> • Cat: {s.category || 'Cleaner'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                          {bpc} Bottles / Carton
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '1.05rem',
                              fontWeight: 800,
                              color: isZero ? '#ef4444' : isLow ? '#d97706' : '#059669'
                            }}
                          >
                            {ctns.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Cartons</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#334155' }}>
                          {totalBtls.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>bottles</span>
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569' }}>
                          <MapPin size={13} style={{ color: '#0284c7' }} />
                          <span>{s.pallet_location || 'Warehouse Bay 1'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          Rs. {Math.round(cartonPrice).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          (@ Rs. {price}/btl)
                        </div>
                      </td>
                      <td>
                        {isZero ? (
                          <span className="status-badge danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="status-badge warning">Low Stock</span>
                        ) : (
                          <span className="status-badge success">In Stock</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => {
                              setSelectedSize(s);
                              setActiveModal('PRINT_LABEL');
                            }}
                            title="Print Master Carton Label"
                          >
                            <Printer size={13} />
                            <span>Label</span>
                          </button>

                          <button
                            className="btn btn-emerald btn-xs"
                            onClick={() => {
                              setPackForm({
                                sizeId: String(s.id),
                                cartonsToPack: 10,
                                palletLocation: s.pallet_location || 'Pallet Bay A-01',
                                batchNo: `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                                packingDate: new Date().toISOString().split('T')[0],
                                notes: ''
                              });
                              setActiveModal('PACK');
                            }}
                            title="Pack more cartons of this item"
                          >
                            <Plus size={13} />
                            <span>Pack</span>
                          </button>

                          <button
                            className="btn btn-danger btn-xs"
                            disabled={ctns === 0}
                            onClick={() => {
                              setDispatchForm({
                                sizeId: String(s.id),
                                cartonsToDispatch: Math.min(ctns, 5),
                                customerName: '',
                                gatePassNo: `GP-${Math.floor(1000 + Math.random() * 9000)}`,
                                notes: ''
                              });
                              setActiveModal('DISPATCH');
                            }}
                            title="Dispatch cartons to customer"
                          >
                            <Truck size={13} />
                            <span>Dispatch</span>
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
        /* Pallet Grid Cards View */
        <div className="cartons-grid-cards">
          {filteredCartons.map((s) => {
            const ctns = Number(s.carton_quantity) || 0;
            const bpc = Number(s.bottles_per_carton) || 24;
            const totalBtls = ctns * bpc;
            const price = Number(s.selling_price) || Number(s.purchase_price) || 0;
            const cartonPrice = price * bpc;
            const minStock = Number(s.minimum_stock) || 10;
            const isLow = ctns > 0 && ctns <= minStock;
            const isZero = ctns === 0;

            return (
              <div key={s.id} className={`pallet-card ${isLow ? 'pallet-warning' : isZero ? 'pallet-danger' : ''}`}>
                <div className="pallet-card-top">
                  <div className="pallet-badge">
                    <Boxes size={16} />
                    <span>MASTER CARTON</span>
                  </div>
                  <span className={`status-pill ${isZero ? 'danger' : isLow ? 'warning' : 'success'}`}>
                    {isZero ? '0 Left' : isLow ? 'Low Stock' : 'Sealed & Ready'}
                  </span>
                </div>

                <div className="pallet-card-body">
                  <h3 className="pallet-product-title">{s.product_name}</h3>
                  <div className="pallet-spec-row">
                    <span>Size: <strong>{s.size || s.size_name}</strong></span>
                    <span>Pack: <strong>{bpc} btls/ctn</strong></span>
                  </div>

                  <div className="pallet-qty-box">
                    <div className="pallet-qty-col">
                      <div className="pallet-qty-number">{ctns.toLocaleString()}</div>
                      <div className="pallet-qty-label">Filled Cartons</div>
                    </div>
                    <div className="pallet-qty-divider" />
                    <div className="pallet-qty-col">
                      <div className="pallet-qty-number" style={{ color: '#0284c7' }}>
                        {totalBtls.toLocaleString()}
                      </div>
                      <div className="pallet-qty-label">Total Bottles</div>
                    </div>
                  </div>

                  <div className="pallet-meta-row">
                    <div className="pallet-meta-item">
                      <MapPin size={13} />
                      <span>{s.pallet_location || 'Warehouse Bay 1'}</span>
                    </div>
                    <div className="pallet-meta-item">
                      <span>Val: <strong>Rs. {Math.round(cartonPrice * ctns).toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pallet-card-actions">
                  <button
                    className="btn btn-secondary btn-sm flex-1"
                    onClick={() => {
                      setSelectedSize(s);
                      setActiveModal('PRINT_LABEL');
                    }}
                  >
                    <Printer size={13} />
                    <span>Slip</span>
                  </button>

                  <button
                    className="btn btn-emerald btn-sm flex-1"
                    onClick={() => {
                      setPackForm({
                        sizeId: String(s.id),
                        cartonsToPack: 10,
                        palletLocation: s.pallet_location || 'Pallet Bay A-01',
                        batchNo: `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                        packingDate: new Date().toISOString().split('T')[0],
                        notes: ''
                      });
                      setActiveModal('PACK');
                    }}
                  >
                    <Plus size={13} />
                    <span>Pack</span>
                  </button>

                  <button
                    className="btn btn-danger btn-sm flex-1"
                    disabled={ctns === 0}
                    onClick={() => {
                      setDispatchForm({
                        sizeId: String(s.id),
                        cartonsToDispatch: Math.min(ctns, 5),
                        customerName: '',
                        gatePassNo: `GP-${Math.floor(1000 + Math.random() * 9000)}`,
                        notes: ''
                      });
                      setActiveModal('DISPATCH');
                    }}
                  >
                    <Truck size={13} />
                    <span>Dispatch</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== MODAL 1: PACK NEW CARTONS ===================== */}
      {activeModal === 'PACK' && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={20} style={{ color: '#059669' }} />
                <h3>Pack New Filled Cartons (کارٹن پیک کریں)</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePackSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Product & Size to Pack</label>
                  <select
                    className="form-input"
                    value={packForm.sizeId}
                    onChange={(e) => setPackForm({ ...packForm, sizeId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Product Size --</option>
                    {productSizes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.product_name} - {s.size || s.size_name} ({s.bottles_per_carton} btls/ctn) - Current: {s.carton_quantity || 0} ctns
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Number of Cartons to Pack</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={packForm.cartonsToPack}
                      onChange={(e) => setPackForm({ ...packForm, cartonsToPack: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Batch / Lot Reference #</label>
                    <input
                      type="text"
                      className="form-input"
                      value={packForm.batchNo}
                      onChange={(e) => setPackForm({ ...packForm, batchNo: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Live Packaging Calculation */}
                {(() => {
                  const sel = productSizes.find((s) => String(s.id) === String(packForm.sizeId));
                  if (!sel) return null;
                  const ctns = parseInt(packForm.cartonsToPack, 10) || 0;
                  const bpc = sel.bottles_per_carton || 24;
                  const totalBtls = ctns * bpc;
                  return (
                    <div className="pack-calc-box">
                      <div className="pack-calc-row">
                        <span>Carton Packaging Ratio:</span>
                        <strong>{bpc} Bottles per 1 Carton</strong>
                      </div>
                      <div className="pack-calc-row highlight">
                        <span>Bottles Sealed in this Batch:</span>
                        <strong>{totalBtls.toLocaleString()} Bottles</strong>
                      </div>
                      <div className="pack-calc-row">
                        <span>New Total In Stock:</span>
                        <span>{((sel.carton_quantity || 0) + ctns).toLocaleString()} Master Cartons</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Pallet / Warehouse Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={packForm.palletLocation}
                      onChange={(e) => setPackForm({ ...packForm, palletLocation: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Packing Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={packForm.packingDate}
                      onChange={(e) => setPackForm({ ...packForm, packingDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Packing Notes / Inspector</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. QC Approved - Tape Sealed - Batch 04"
                    value={packForm.notes}
                    onChange={(e) => setPackForm({ ...packForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-emerald">
                  <Check size={16} />
                  <span>Confirm Packing & Seal Cartons</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: DISPATCH CARTONS ===================== */}
      {activeModal === 'DISPATCH' && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} style={{ color: '#ef4444' }} />
                <h3>Dispatch Cartons (کارٹن ڈسپیچ کریں)</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Packed Product to Dispatch</label>
                  <select
                    className="form-input"
                    value={dispatchForm.sizeId}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, sizeId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Product Size --</option>
                    {productSizes.map((s) => (
                      <option key={s.id} value={s.id} disabled={(s.carton_quantity || 0) === 0}>
                        {s.product_name} - {s.size || s.size_name} (Stock: {s.carton_quantity || 0} ctns)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Cartons to Dispatch</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={dispatchForm.cartonsToDispatch}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, cartonsToDispatch: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gate Pass / Order #</label>
                    <input
                      type="text"
                      className="form-input"
                      value={dispatchForm.gatePassNo}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, gatePassNo: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Customer / Wholesaler Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Al-Madina Superstore / Metro Cash & Carry"
                    value={dispatchForm.customerName}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, customerName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dispatch Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dispatched via Truck # LES-4589"
                    value={dispatchForm.notes}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  <Truck size={16} />
                  <span>Issue & Dispatch Cartons</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: PRINT MASTER CARTON LABEL ===================== */}
      {activeModal === 'PRINT_LABEL' && selectedSize && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} style={{ color: '#0284c7' }} />
                <h3>Master Carton Label & Shipping Slip</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Visual Printable Shipping Carton Slip */}
              <div className="printable-carton-label">
                <div className="carton-label-header">
                  <div className="carton-label-brand">VELORA WMS</div>
                  <div className="carton-label-badge">SEALED MASTER CARTON</div>
                </div>

                <div className="carton-label-prod-name">{selectedSize.product_name}</div>
                <div className="carton-label-size">{selectedSize.size || selectedSize.size_name}</div>

                <div className="carton-label-grid">
                  <div className="carton-label-col">
                    <span className="carton-label-caption">PACK QUANTITY:</span>
                    <strong className="carton-label-val">{selectedSize.bottles_per_carton} BOTTLES</strong>
                  </div>
                  <div className="carton-label-col">
                    <span className="carton-label-caption">NET WEIGHT/VOL:</span>
                    <strong className="carton-label-val">APPROX. 14.5 KG</strong>
                  </div>
                </div>

                <div className="carton-label-grid">
                  <div className="carton-label-col">
                    <span className="carton-label-caption">BATCH NUMBER:</span>
                    <strong className="carton-label-val">LOT-{new Date().getFullYear()}-00{selectedSize.id}</strong>
                  </div>
                  <div className="carton-label-col">
                    <span className="carton-label-caption">PACKING DATE:</span>
                    <strong className="carton-label-val">{new Date().toISOString().split('T')[0]}</strong>
                  </div>
                </div>

                <div className="carton-label-footer">
                  <div className="carton-barcode-mock">
                    ||||| | |||| |||||| || | |||| ||| |||||
                  </div>
                  <div className="carton-qc-stamp">QC PASSED</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={16} />
                <span>Print Carton Label</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

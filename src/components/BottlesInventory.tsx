'use client';

import React from 'react';
import {
  Package,
  Plus,
  Minus,
  Search,
  Download,
  Trash2,
  Pencil
} from 'lucide-react';
import { getBottlesPerCarton } from './FilledCartonsInventory';
import { BottlesInventoryProps, ProductSize, Product } from '../types';

export default function BottlesInventory({
  productSizes = [],
  products = [],
  searchQuery = '',
  setSearchQuery,
  categoryFilter = 'ALL',
  setCategoryFilter,
  sizeFilter = 'ALL',
  setSizeFilter,
  statusFilter = 'ALL',
  setStatusFilter,
  onStockIn,
  onStockOut,
  onNewProduct,
  onEditSize,
  onDeleteSize,
  onClearAllData,
  onExportCSV
}: BottlesInventoryProps) {
  // Helper matching functions
  const isToiletItem = (s: ProductSize, p?: Product): boolean => {
    const cat = ((p?.category) || '').toLowerCase();
    const name = ((s?.product_name || p?.name) || '').toLowerCase();
    const sz = ((s?.size) || '').toLowerCase();
    return cat.includes('toilet') || name.includes('toilet') ||
      cat.includes('sweep') || name.includes('sweep') || sz.includes('sweep') ||
      cat.includes('tolie') || name.includes('tolie');
  };

  const isDishwashItem = (s: ProductSize, p?: Product): boolean => {
    const cat = ((p?.category) || '').toLowerCase();
    const name = ((s?.product_name || p?.name) || '').toLowerCase();
    const sz = ((s?.size) || '').toLowerCase();
    if (isToiletItem(s, p)) return false;
    return cat.includes('dish') || name.includes('dish') || sz.includes('dish') ||
      cat.includes('250ml') || sz.includes('250ml') ||
      (cat.includes('bottle') && !cat.includes('bleach') && !cat.includes('harpic'));
  };

  const isHarpicItem = (s: ProductSize, p?: Product): boolean => {
    const cat = ((p?.category) || '').toLowerCase();
    const name = ((s?.product_name || p?.name) || '').toLowerCase();
    const sz = ((s?.size) || '').toLowerCase();
    return cat.includes('harpic') || name.includes('harpic') || sz.includes('harpic');
  };

  const isBleachItem = (s: ProductSize, p?: Product): boolean => {
    const cat = ((p?.category) || '').toLowerCase();
    const name = ((s?.product_name || p?.name) || '').toLowerCase();
    const sz = ((s?.size) || '').toLowerCase();
    return cat.includes('bleach') || name.includes('bleach') || sz.includes('bleach');
  };

  // Filtered bottle products
  const filtered = productSizes.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      (s.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.size || '').toLowerCase().includes(searchQuery.toLowerCase());

    const prod = products.find((p) => p.id === s.product_id);

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
      (sizeFilter === '600ml Bottle' && (s.size || '').toLowerCase().includes('600')) ||
      (sizeFilter === '1.2 Liter Bottle' && ((s.size || '').toLowerCase().includes('1.2') || (s.size || '').toLowerCase().includes('1200'))) ||
      (sizeFilter === '250ml Bottle' && (s.size || '').toLowerCase().includes('250')) ||
      (sizeFilter === '500ml Bottle' && (s.size || '').toLowerCase().includes('500')) ||
      (sizeFilter === '4.5 Liter Can' && ((s.size || '').toLowerCase().includes('4.5') || (s.size || '').toLowerCase().includes('4500'))) ||
      (sizeFilter === '1000ml Bottle' && ((s.size || '').toLowerCase().includes('1000') || (s.size || '').toLowerCase().includes('1l') || (s.size || '').toLowerCase().includes('1 liter')));

    let itemStatus = 'Available';
    if ((s.bottle_quantity || 0) <= 0) itemStatus = 'Out of Stock';
    else if ((s.bottle_quantity || 0) <= (s.minimum_stock || 10)) itemStatus = 'Low Stock';

    const matchesStatus = statusFilter === 'ALL' || itemStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesSize && matchesStatus;
  });

  // Bottle Inventory KPIs
  const totalBottles = productSizes.reduce((acc, s) => acc + (s.bottle_quantity || 0), 0);
  const totalValuation = productSizes.reduce((acc, s) => acc + ((s.bottle_quantity || 0) * (Number(s.purchase_price) || 0)), 0);
  const lowStockBottles = productSizes.filter(s => (s.bottle_quantity || 0) > 0 && (s.bottle_quantity || 0) <= (s.minimum_stock || 10)).length;
  const outOfStockBottles = productSizes.filter(s => (s.bottle_quantity || 0) <= 0).length;

  return (
    <div className="bottles-inventory-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Action Bar */}
      <div className="panel" style={{ margin: 0 }}>
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div className="panel-title-group">
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}>
              <Package size={22} />
            </div>
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.25rem' }}>
                Bottles & Finished Goods Inventory <span style={{ color: '#0284c7', fontSize: '0.9rem', fontWeight: 700 }}> (بوتلوں کی انوینٹری)</span>
              </h2>
              <p className="panel-desc">Manage individual bottles stock, bottling entries, unit pricing, and minimum buffer levels.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-emerald btn-sm"
              onClick={() => onStockIn && onStockIn('FINISHED')}
              title="Add incoming stock of bottles"
            >
              <Plus size={14} />
              <span>+ Stock In Bottles</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onStockOut && onStockOut('FINISHED')}
              title="Issue bottles for sale or sample"
            >
              <Minus size={14} />
              <span>- Issue Bottles</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNewProduct && onNewProduct()}
              title="Register a new product or bottle size"
            >
              <Plus size={14} />
              <span>New Product</span>
            </button>

            {onExportCSV && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={onExportCSV} title="Export CSV Report">
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            )}

            {onClearAllData && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
                onClick={onClearAllData}
                title="Reset all inventory data"
              >
                <Trash2 size={13} />
                <span>Clear All Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottles KPI Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#0284c7' }}>
              Total Available Bottles
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0369a1', marginTop: '4px' }}>
              {totalBottles.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bottles</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7' }}>
              Across {productSizes.length} bottle SKU sizes
            </div>
          </div>

          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#059669' }}>
              Bottles Valuation
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
              Rs. {Math.round(totalValuation).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669' }}>
              Based on purchase rate
            </div>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#d97706' }}>
              Low Stock Alerts
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#92400e', marginTop: '4px' }}>
              {lowStockBottles} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>SKUs</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#b45309' }}>
              Below minimum threshold
            </div>
          </div>

          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#e11d48' }}>
              Out of Stock
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#9f1239', marginTop: '4px' }}>
              {outOfStockBottles} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>SKUs</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#be123c' }}>
              0 bottles left in warehouse
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.84rem', width: '100%' }}
              placeholder="Search bottles by name or size..."
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Category:</span>
            <select
              className="form-select"
              style={{ padding: '5px 10px', fontSize: '0.82rem' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter && setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="TOILET">🚽 Toilet Bottles</option>
              <option value="DISHWASH">🍽️ Dishwash Bottles</option>
              <option value="HARPIC">⚡ Harpic Bottles</option>
              <option value="BLEACH">🧪 Bleach Bottles</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Size:</span>
            <select
              className="form-select"
              style={{ padding: '5px 10px', fontSize: '0.82rem' }}
              value={sizeFilter}
              onChange={(e) => setSizeFilter && setSizeFilter(e.target.value)}
            >
              <option value="ALL">All Sizes</option>
              <option value="600ml Bottle">600ml Bottle</option>
              <option value="1.2 Liter Bottle">1.2 Liter Bottle</option>
              <option value="500ml Bottle">500ml Bottle</option>
              <option value="1000ml Bottle">1000ml / 1L Bottle</option>
              <option value="250ml Bottle">250ml Bottle</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Status:</span>
            <select
              className="form-select"
              style={{ padding: '5px 10px', fontSize: '0.82rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter && setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Bottles Data Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bottle SKU & Product</th>
                <th>Bottle Size</th>
                <th>Available Bottles</th>
                <th>Pack Spec (Ratio)</th>
                <th>Purchase Rate</th>
                <th>Selling Rate</th>
                <th>Inventory Valuation</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <Package size={40} style={{ margin: '0 auto 10px', opacity: 0.3, color: '#0284c7' }} />
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>No Bottles Found</div>
                    <div style={{ fontSize: '0.85rem' }}>No bottle SKU matches your search or filter criteria.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const bpc = getBottlesPerCarton(s);
                  const val = (s.bottle_quantity || 0) * (Number(s.purchase_price) || 0);
                  const isLow = (s.bottle_quantity || 0) > 0 && (s.bottle_quantity || 0) <= (s.minimum_stock || 10);
                  const isOut = (s.bottle_quantity || 0) <= 0;

                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            background: '#f0f9ff',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Package size={16} />
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '0.94rem' }}>{s.product_name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`size-tag ${(s.size || '').toLowerCase()}`}>{s.size || s.size_name}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isOut ? '#e11d48' : isLow ? '#d97706' : '#0f172a' }}>
                          {(s.bottle_quantity || 0).toLocaleString()} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Bottles</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Min Alert: {s.minimum_stock || 10} btls
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', background: '#f0f9ff', padding: '3px 8px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                          📦 {bpc} btls / 1 ctn
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#475569', fontWeight: 600 }}>Rs. {Number(s.purchase_price || 0).toFixed(2)}</span>
                      </td>
                      <td>
                        <span style={{ color: '#059669', fontWeight: 700 }}>Rs. {Number(s.selling_price || 0).toFixed(2)}</span>
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
                          <span className="badge badge-success">Available</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-emerald btn-xs"
                            onClick={() => onStockIn && onStockIn('FINISHED', s.id)}
                            title="Stock In Bottles"
                          >
                            <Plus size={12} />
                            <span>Stock In</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => onEditSize && onEditSize(s)}
                            title="Edit Bottle Size & Pricing"
                          >
                            <Pencil size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            style={{ color: '#ef4444', borderColor: '#fecaca' }}
                            onClick={() => onDeleteSize && onDeleteSize(s.id)}
                            title="Delete Bottle SKU"
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
    </div>
  );
}

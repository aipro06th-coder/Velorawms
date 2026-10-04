'use client';

import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Minus,
  Search,
  AlertOctagon,
  SlidersHorizontal,
  Trash2,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Boxes
} from 'lucide-react';

export default function LabelsInventory({
  stickers = [],
  productSizes = [],
  products = [],
  onStockIn,
  onStockOut,
  onAddNewSticker,
  onAdjustStickers,
  onDamageStickers,
  onDeleteSticker,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Unified items list: prefers dedicated stickers state if populated, else falls back to productSizes sticker columns
  const stickerItems = stickers.length > 0
    ? stickers
    : productSizes.map(s => ({
      id: s.id,
      name: `${s.product_name} Label`,
      category: s.category || 'General Cleaners',
      size: s.size || s.size_name || 'Standard',
      quantity: s.sticker_quantity || 0,
      damaged_quantity: s.damaged_stickers || 0,
      minimum_stock: s.minimum_stock || 500,
      purchase_price: 2.5,
      supplier: 'Printing Press',
      status: (s.sticker_quantity || 0) <= 0 ? 'Out of Stock' : (s.sticker_quantity || 0) <= (s.minimum_stock || 500) ? 'Low Stock' : 'In Stock'
    }));

  const filtered = stickerItems.filter(item => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (item.name || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q) || (item.size || '').toLowerCase().includes(q);
    const statusMatch = statusFilter === 'ALL' || item.status === statusFilter;
    return nameMatch && statusMatch;
  });

  // Calculate Metrics
  const totalStickers = stickerItems.reduce((acc, s) => acc + (s.quantity || 0), 0);
  const totalDamaged = stickerItems.reduce((acc, s) => acc + (s.damaged_quantity || 0), 0);
  const lowStockCount = stickerItems.filter(s => (s.quantity || 0) > 0 && (s.quantity || 0) <= (s.minimum_stock || 500)).length;
  const totalValuation = stickerItems.reduce((acc, s) => acc + ((s.quantity || 0) * (s.purchase_price || 2.5)), 0);

  return (
    <div className="labels-inventory-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="panel" style={{ margin: 0 }}>
        {/* Header */}
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div className="panel-title-group">
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
            }}>
              <Tag size={22} />
            </div>
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.25rem' }}>
                Labels & Stickers Inventory <span style={{ color: '#7c3aed', fontSize: '0.9rem', fontWeight: 700 }}> (لیبلز اور سٹیکرز کی انوینٹری)</span>
              </h2>
              <p className="panel-desc">Dedicated stock management for bottle roll stickers, branding labels, and packaging seals.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-emerald btn-sm"
              onClick={() => onStockIn && onStockIn('STICKER')}
              title="Receive incoming labels from printing press"
            >
              <Plus size={14} />
              <span>+ Stock In Labels</span>
            </button>

            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => onStockOut && onStockOut('STICKER')}
              title="Issue labels to bottling line"
            >
              <Minus size={14} />
              <span>- Issue Labels</span>
            </button>

            {onAddNewSticker && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onAddNewSticker}
                title="Register new sticker design / label SKU"
              >
                <Plus size={14} />
                <span>New Label SKU</span>
              </button>
            )}

            {onAdjustStickers && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onAdjustStickers}
                title="Perform physical label audit adjustment"
              >
                <SlidersHorizontal size={14} />
                <span>Adjust Stock</span>
              </button>
            )}

            {onDamageStickers && (
              <button
                type="button"
                className="btn btn-amber btn-sm"
                onClick={onDamageStickers}
                title="Record torn or misprinted wasted labels"
              >
                <AlertOctagon size={14} />
                <span>Record Waste</span>
              </button>
            )}
          </div>
        </div>

        {/* Labels KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#7c3aed' }}>
              Total Available Labels
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#581c87', marginTop: '4px' }}>
              {totalStickers.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pcs</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6b21a8' }}>
              Ready for bottle application
            </div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#1d4ed8' }}>
              Active Label SKUs
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>
              {stickerItems.length} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Designs</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#1e40af' }}>
              Roll labels registered
            </div>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#b45309' }}>
              Low Stock Buffer Alerts
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#78350f', marginTop: '4px' }}>
              {lowStockCount} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>SKUs</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#92400e' }}>
              Reorder from press soon
            </div>
          </div>

          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#dc2626' }}>
              Damaged / Wasted
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#991b1b', marginTop: '4px' }}>
              {totalDamaged.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pcs</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#b91c1c' }}>
              Excluded from active stock
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.84rem', width: '100%' }}
              placeholder="Search labels by name, product or size..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
        </div>

        {/* Labels Table */}
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
                <th>Purchase Rate</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <Tag size={40} style={{ margin: '0 auto 10px', opacity: 0.3, color: '#7c3aed' }} />
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>No Labels Registered</div>
                    <div style={{ fontSize: '0.85rem' }}>No stickers found matching your search. Click &apos;+ Stock In Labels&apos; to add.</div>
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  const isLow = (s.quantity || 0) > 0 && (s.quantity || 0) <= (s.minimum_stock || 500);
                  const isOut = (s.quantity || 0) <= 0;

                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            background: '#faf5ff',
                            color: '#7c3aed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Tag size={16} />
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>
                              {s.name}
                            </strong>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Front & Back Bottle Sticker
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#334155' }}>
                          {s.product_name || s.category || 'General Cleaners'}
                        </span>
                      </td>
                      <td>
                        <span className={`size-tag ${(s.size || '').toLowerCase()}`}>
                          {s.size}
                        </span>
                      </td>
                      <td>
                        <strong style={{
                          fontSize: '1.05rem',
                          color: isOut ? '#e11d48' : isLow ? '#d97706' : '#0f172a'
                        }}>
                          {(s.quantity || 0).toLocaleString()} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Pcs</span>
                        </strong>
                      </td>
                      <td>
                        <span style={{ color: (s.damaged_quantity || 0) > 0 ? '#e11d48' : '#94a3b8', fontWeight: 600 }}>
                          {(s.damaged_quantity || 0).toLocaleString()} Pcs
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {s.minimum_stock || 500} Pcs
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#475569', fontWeight: 600 }}>
                          Rs. {Number(s.purchase_price || 2.5).toFixed(2)}
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
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-emerald btn-xs"
                            onClick={() => onStockIn && onStockIn('STICKER', s.id)}
                            title="Stock In Labels"
                          >
                            <Plus size={12} /> Stock In
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => onStockOut && onStockOut('STICKER', s.id)}
                            title="Issue Labels"
                          >
                            <Minus size={12} /> Issue
                          </button>
                          {onDeleteSticker && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              style={{ color: '#ef4444', borderColor: '#fecaca' }}
                              onClick={() => onDeleteSticker(s.id)}
                              title="Delete Sticker SKU"
                            >
                              <Trash2 size={12} />
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
      </div>
    </div>
  );
}

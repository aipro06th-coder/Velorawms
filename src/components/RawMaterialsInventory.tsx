'use client';

import React, { useState } from 'react';
import {
  FlaskConical,
  Plus,
  Minus,
  Search,
  Trash2
} from 'lucide-react';
import { RawMaterialsInventoryProps, RawMaterial } from '../types';

export default function RawMaterialsInventory({
  rawMaterials = [],
  onStockIn,
  onStockOut,
  onAddNewMaterial,
  onDeleteRawMaterial
}: RawMaterialsInventoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');

  const filtered = rawMaterials.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (r.name || '').toLowerCase().includes(q) || (r.unit || '').toLowerCase().includes(q);
    const matchesUnit = unitFilter === 'ALL' || (unitFilter === 'BORI' ? (r.unit || '').includes('Bori') : !(r.unit || '').includes('Bori'));
    return matchesSearch && matchesUnit;
  });

  // Calculate Metrics
  const totalLiters = rawMaterials.filter(r => !(r.unit || '').includes('Bori')).reduce((acc, r) => acc + (r.quantity || 0), 0);
  const totalBori = rawMaterials.filter(r => (r.unit || '').includes('Bori')).reduce((acc, r) => acc + (r.quantity || 0), 0);
  const totalTspKg = rawMaterials.filter(r => (r.unit || '').includes('Bori')).reduce((acc, r) => acc + ((r.quantity || 0) * (r.weight_per_bori_kg || 25)), 0);
  const totalValuation = rawMaterials.reduce((acc, r) => {
    const isTSP = (r.unit || '').includes('Bori');
    const totalKg = isTSP ? (r.quantity * (r.weight_per_bori_kg || 25)) : 0;
    return acc + (isTSP ? (totalKg * (r.purchase_price || 0)) : ((r.quantity || 0) * (r.purchase_price || 0)));
  }, 0);
  const lowStockCount = rawMaterials.filter(r => (r.quantity || 0) > 0 && (r.quantity || 0) <= (r.minimum_stock || 100)).length;

  return (
    <div className="raw-inventory-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="panel" style={{ margin: 0 }}>
        {/* Header */}
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div className="panel-title-group">
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
            }}>
              <FlaskConical size={22} />
            </div>
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.25rem' }}>
                Raw Materials Storage & Chemicals <span style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 700 }}> (خام مال اور کیمیکلز)</span>
              </h2>
              <p className="panel-desc">Bulk chemical storage tracking in Liters (Tankers/Drums) and TSP in 25 KG Bori.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-emerald btn-sm"
              onClick={() => onStockIn && onStockIn('RAW')}
              title="Record incoming chemical tanker or TSP delivery"
            >
              <Plus size={14} />
              <span>+ Stock In Chemical / Raw</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onStockOut && onStockOut('RAW')}
              title="Issue raw chemicals for production / mixing"
            >
              <Minus size={14} />
              <span>- Issue for Production</span>
            </button>

            {onAddNewMaterial && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onAddNewMaterial}
                title="Register a new raw chemical or compound"
              >
                <Plus size={14} />
                <span>New Material</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#059669' }}>
              Bulk Chemical Volume
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
              {totalLiters.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Liters</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669' }}>
              HCL, Detergent, Bleach & cleaner compounds
            </div>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#16a34a' }}>
              TSP Powder Storage
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#14532d', marginTop: '4px' }}>
              {totalBori.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bori</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>
              Total: {totalTspKg.toLocaleString()} KG (@ 25 KG / Bori)
            </div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#2563eb' }}>
              Raw Stock Valuation
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>
              Rs. {Math.round(totalValuation).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>
              Total value of bulk raw chemicals
            </div>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#d97706' }}>
              Low Buffer Alerts
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#92400e', marginTop: '4px' }}>
              {lowStockCount} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Chemicals</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#b45309' }}>
              Below production safety margin
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.84rem', width: '100%' }}
              placeholder="Search raw chemicals or compounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Filter By:</span>
            <select
              className="form-select"
              style={{ padding: '5px 10px', fontSize: '0.82rem' }}
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
            >
              <option value="ALL">All Raw Materials</option>
              <option value="LITERS">Bulk Liquid Chemicals (Liters)</option>
              <option value="BORI">TSP Solid Bags (25 KG Bori)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Quantity in Stock</th>
                <th>Unit of Measure</th>
                <th>Minimum Threshold</th>
                <th>Purchase Rate</th>
                <th>Current Valuation</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <FlaskConical size={40} style={{ margin: '0 auto 10px', opacity: 0.3, color: '#059669' }} />
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>No Raw Materials Found</div>
                    <div style={{ fontSize: '0.85rem' }}>No materials match your search. Click &apos;+ Stock In Chemical / Raw&apos; to add.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((r: RawMaterial) => {
                  const isTSP = (r.unit || '').includes('Bori');
                  const totalKg = isTSP ? ((r.quantity || 0) * (r.weight_per_bori_kg || 25)) : 0;
                  const val = isTSP ? (totalKg * (r.purchase_price || 0)) : ((r.quantity || 0) * (r.purchase_price || 0));

                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            background: '#ecfdf5',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FlaskConical size={16} />
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>{r.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: r.status === 'Low Stock' ? '#d97706' : '#0f172a' }}>
                          {(r.quantity || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{r.unit}</span>
                        </div>
                        {isTSP && (
                          <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                            Total Net: {totalKg.toLocaleString()} KG
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                          {r.unit}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#64748b', fontSize: '0.86rem' }}>
                          {r.minimum_stock || 100} {r.unit}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#475569', fontWeight: 600 }}>
                          Rs. {Number(r.purchase_price || 0).toFixed(2)} {isTSP ? '/ KG' : '/ L'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#059669', fontSize: '0.98rem' }}>
                          Rs. {Math.round(val).toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <span className={`badge ${r.status === 'Low Stock' ? 'badge-warning' : r.status === 'Out of Stock' ? 'badge-danger' : 'badge-success'}`}>
                          {r.status || 'In Stock'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-emerald btn-xs"
                            onClick={() => onStockIn && onStockIn('RAW', r.id)}
                            title="Add stock in"
                          >
                            <Plus size={12} /> Stock In
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => onStockOut && onStockOut('RAW', r.id)}
                            title="Issue material for mixing"
                          >
                            <Minus size={12} /> Issue
                          </button>
                          {onDeleteRawMaterial && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              style={{ color: '#ef4444', borderColor: '#fecaca' }}
                              onClick={() => onDeleteRawMaterial(r.id)}
                              title="Delete raw material"
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

'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Truck,
  FileText,
  Printer,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  Phone,
  MapPin,
  X,
  Copy,
  Check,
  ShieldCheck,
  Boxes,
  Package,
  Layers,
  Clock,
  ArrowRight,
  Eye,
  Trash2
} from 'lucide-react';
import { getBottlesPerCarton } from './FilledCartonsInventory';

export default function GatePassManager({
  productSizes = [],
  gatePasses = [],
  setGatePasses,
  onIssueGatePass,
  onDeleteGatePass,
  currentUser,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK'
  const [activeModal, setActiveModal] = useState(null); // 'CREATE' | 'THERMAL_PRINT'
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // New Gate Pass Form State
  const [gatePassForm, setGatePassForm] = useState({
    gatePassNo: `GP-${Math.floor(100000 + Math.random() * 900000)}`,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    customerName: '',
    destination: '',
    vehicleNo: '',
    driverName: '',
    driverPhone: '',
    securityGuard: 'Gate Guard on Duty',
    notes: '',
    items: [] // array of { sizeId, cartonQuantity }
  });

  // Available filled cartons in stock (only sizes with carton_quantity > 0)
  const availableStock = useMemo(() => {
    return productSizes.filter(s => (s.carton_quantity || 0) > 0);
  }, [productSizes]);

  // Open Create Modal
  const handleOpenCreateModal = (preselectedSize = null) => {
    const defaultItem = preselectedSize
      ? [{ sizeId: preselectedSize.id, cartonQuantity: Math.min(10, preselectedSize.carton_quantity || 1) }]
      : availableStock.length > 0
      ? [{ sizeId: availableStock[0].id, cartonQuantity: Math.min(10, availableStock[0].carton_quantity || 1) }]
      : [];

    setGatePassForm({
      gatePassNo: `GP-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: '',
      destination: '',
      vehicleNo: '',
      driverName: '',
      driverPhone: '',
      securityGuard: 'Gate Security Guard',
      notes: '',
      items: defaultItem
    });
    setActiveModal('CREATE');
  };

  // Add Item Row in Gate Pass
  const handleAddItemRow = () => {
    if (availableStock.length === 0) {
      if (showToast) showToast('No filled cartons available in stock to dispatch!');
      return;
    }
    // Find first available size not already selected
    const selectedIds = new Set(gatePassForm.items.map(i => String(i.sizeId)));
    const nextAvailable = availableStock.find(s => !selectedIds.has(String(s.id))) || availableStock[0];

    setGatePassForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          sizeId: nextAvailable.id,
          cartonQuantity: Math.min(5, nextAvailable.carton_quantity || 1)
        }
      ]
    }));
  };

  // Remove Item Row
  const handleRemoveItemRow = (index) => {
    setGatePassForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  // Update Item in Gate Pass Form
  const handleUpdateItem = (index, field, value) => {
    setGatePassForm(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  // Submit and Issue Gate Pass (AUTOMATIC DEDUCTION OF FILLED CARTONS)
  const handleSubmitGatePass = (e) => {
    e.preventDefault();

    if (!gatePassForm.customerName.trim()) {
      if (showToast) showToast('Please enter Customer / Distributor Name.');
      return;
    }

    if (!gatePassForm.vehicleNo.trim()) {
      if (showToast) showToast('Please enter Vehicle / Truck Number.');
      return;
    }

    if (gatePassForm.items.length === 0) {
      if (showToast) showToast('Please add at least one filled carton product to the Gate Pass.');
      return;
    }

    // Validate quantities against actual stock
    const detailedItems = [];
    for (const item of gatePassForm.items) {
      const sizeObj = productSizes.find(s => String(s.id) === String(item.sizeId));
      if (!sizeObj) {
        if (showToast) showToast('Invalid product selected in items list.');
        return;
      }

      const ctns = parseInt(item.cartonQuantity, 10);
      if (!ctns || ctns <= 0) {
        if (showToast) showToast(`Please enter a valid carton quantity for ${sizeObj.product_name}.`);
        return;
      }

      if (ctns > (sizeObj.carton_quantity || 0)) {
        if (showToast) showToast(
          `Insufficient stock for ${sizeObj.product_name} (${sizeObj.size || sizeObj.size_name}). Available: ${sizeObj.carton_quantity}, Requested: ${ctns}`
        );
        return;
      }

      const bpc = getBottlesPerCarton(sizeObj);
      detailedItems.push({
        sizeId: sizeObj.id,
        productId: sizeObj.product_id,
        productName: sizeObj.product_name,
        sizeName: sizeObj.size || sizeObj.size_name || 'Standard',
        cartonsDispatched: ctns,
        bottlesPerCarton: bpc,
        totalBottlesDispatched: ctns * bpc,
        sellingPrice: sizeObj.selling_price || 0
      });
    }

    const totalCartons = detailedItems.reduce((acc, i) => acc + i.cartonsDispatched, 0);
    const totalBottles = detailedItems.reduce((acc, i) => acc + i.totalBottlesDispatched, 0);

    const newGatePassRecord = {
      id: `GP-${Date.now()}`,
      gatePassNo: gatePassForm.gatePassNo,
      issuedAt: `${gatePassForm.date} ${gatePassForm.time}`,
      date: gatePassForm.date,
      time: gatePassForm.time,
      customerName: gatePassForm.customerName.trim(),
      destination: gatePassForm.destination.trim() || 'Local Market',
      vehicleNo: gatePassForm.vehicleNo.trim().toUpperCase(),
      driverName: gatePassForm.driverName.trim() || 'Driver',
      driverPhone: gatePassForm.driverPhone.trim() || 'N/A',
      securityGuard: gatePassForm.securityGuard || 'Gate Security',
      notes: gatePassForm.notes.trim(),
      items: detailedItems,
      totalCartons,
      totalBottles,
      issuedBy: currentUser?.user_metadata?.full_name || currentUser?.email || 'Store Incharge',
      status: 'DISPATCHED'
    };

    // 1. Invoke handler to AUTOMATICALLY DEDUCT from productSizes and record transactions in DB
    if (onIssueGatePass) {
      onIssueGatePass(newGatePassRecord);
    }

    // 2. Add to gate passes history list
    if (setGatePasses) {
      setGatePasses(prev => [newGatePassRecord, ...prev]);
    }

    if (showToast) {
      showToast(`🚚 Gate Pass ${newGatePassRecord.gatePassNo} issued! -${totalCartons} Cartons automatically cut from stock.`);
    }

    // 3. Immediately switch to Thermal Print Preview
    setSelectedGatePass(newGatePassRecord);
    setActiveModal('THERMAL_PRINT');
  };

  // Filter Gate Passes History
  const filteredGatePasses = useMemo(() => {
    return gatePasses.filter(gp => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        (gp.gatePassNo || '').toLowerCase().includes(q) ||
        (gp.customerName || '').toLowerCase().includes(q) ||
        (gp.vehicleNo || '').toLowerCase().includes(q) ||
        (gp.driverName || '').toLowerCase().includes(q) ||
        (gp.destination || '').toLowerCase().includes(q) ||
        (gp.items || []).some(i => (i.productName || '').toLowerCase().includes(q));

      let matchDate = true;
      if (dateFilter === 'TODAY') {
        const todayStr = new Date().toISOString().split('T')[0];
        matchDate = gp.date === todayStr;
      }

      return matchSearch && matchDate;
    });
  }, [gatePasses, searchQuery, dateFilter]);

  // Overall Gate Pass Metrics
  const totalCartonsDispatched = useMemo(() => {
    return gatePasses.reduce((acc, gp) => acc + (gp.totalCartons || 0), 0);
  }, [gatePasses]);

  const totalBottlesDispatched = useMemo(() => {
    return gatePasses.reduce((acc, gp) => acc + (gp.totalBottles || 0), 0);
  }, [gatePasses]);

  const todayGatePassesCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return gatePasses.filter(gp => gp.date === today).length;
  }, [gatePasses]);

  // Thermal Print Trigger
  const handleTriggerPrint = () => {
    window.print();
  };

  // Copy plain text receipt
  const handleCopyReceiptText = () => {
    if (!selectedGatePass) return;
    const itemsLines = (selectedGatePass.items || [])
      .map(
        i =>
          `${(i.productName + ' ' + i.sizeName).padEnd(24)} ${String(i.cartonsDispatched).padStart(4)} ctn  ${String(i.totalBottlesDispatched).padStart(5)} btls`
      )
      .join('\n');

    const text = `
========================================
           VELORA CHEMICALS & WMS
        OUTWARD DISPATCH GATE PASS
========================================
GP NO:    ${selectedGatePass.gatePassNo}
DATE:     ${selectedGatePass.date}  ${selectedGatePass.time}
PARTY:    ${selectedGatePass.customerName}
DEST.:    ${selectedGatePass.destination}
VEHICLE:  ${selectedGatePass.vehicleNo}
DRIVER:   ${selectedGatePass.driverName} (${selectedGatePass.driverPhone})
========================================
ITEM DESCRIPTION          CARTONS BOTTLES
----------------------------------------
${itemsLines}
========================================
TOTAL MASTER CARTONS:     ${selectedGatePass.totalCartons} CTNS
TOTAL FINISHED BOTTLES:   ${selectedGatePass.totalBottles} BTLS
========================================
GATE VERIFICATION: [✓] CHECKED & PASSED
ISSUED BY:         ${selectedGatePass.issuedBy}
SECURITY OFFICER:  ${selectedGatePass.securityGuard}
========================================
    *** SYSTEM GENERATED THERMAL SLIP ***
`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (showToast) showToast('Receipt text copied to clipboard!');
  };

  return (
    <div className="gate-pass-section" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ========================================================
          PANEL 1: HEADER & STATS
         ======================================================== */}
      <div className="panel" style={{ margin: 0 }}>
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div className="panel-title-group">
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)'
              }}
            >
              <Truck size={24} />
            </div>
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.3rem' }}>
                Outward Gate Pass System{' '}
                <span style={{ color: '#2563eb', fontSize: '0.95rem', fontWeight: 700 }}>
                  (گیٹ پاس اور آٹومیٹک اسٹاک کٹنگ)
                </span>
              </h2>
              <p className="panel-desc">
                Generate outward dispatch gate passes, automatically deduct filled cartons stock, and print 80mm POS thermal receipts.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.88rem', fontWeight: 700 }}
              onClick={() => handleOpenCreateModal()}
            >
              <Plus size={16} />
              <span>+ Create Gate Pass (نیا گیٹ پاس)</span>
            </button>
          </div>
        </div>

        {/* STATS KPI CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
            padding: '18px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: '#fafbfc'
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#2563eb',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                Total Gate Passes Issued
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a' }}>
                {gatePasses.length}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Passes</span>
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
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#059669',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Boxes size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                Cartons Cut & Dispatched
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#064e3b' }}>
                {totalCartonsDispatched.toLocaleString()}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Ctns</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#16a34a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                Total Bottles Dispatched
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#14532d' }}>
                {totalBottlesDispatched.toLocaleString()}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Bottles</span>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#64748b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Dispatched Today
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                {todayGatePassesCount}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Passes</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER STRIP */}
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
            <div className="search-bar" style={{ flex: 1, minWidth: '240px', margin: 0 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search Gate Pass No, Customer, Vehicle, Driver..."
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
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="ALL">All Time Passes</option>
              <option value="TODAY">Today's Passes Only</option>
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
            Showing {filteredGatePasses.length} of {gatePasses.length} Gate Passes
          </div>
        </div>

        {/* ========================================================
            GATE PASS HISTORY TABLE
           ======================================================== */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Gate Pass No & Time</th>
                <th>Party / Customer</th>
                <th>Vehicle & Driver Details</th>
                <th>Dispatched Items Breakdown</th>
                <th style={{ textAlign: 'center' }}>Total Cartons</th>
                <th style={{ textAlign: 'center' }}>Total Bottles</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGatePasses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Truck size={38} color="#cbd5e1" />
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
                        No Gate Passes Issued Yet
                      </div>
                      <p style={{ fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto' }}>
                        When you dispatch filled cartons, generate a Gate Pass. Stock will automatically be deducted and an 80mm Thermal Receipt will be generated.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '8px' }}
                        onClick={() => handleOpenCreateModal()}
                      >
                        <Plus size={14} />
                        <span>Create First Gate Pass</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGatePasses.map(gp => {
                  return (
                    <tr key={gp.id}>
                      {/* Column 1: GP No */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FileText size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                              {gp.gatePassNo}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {gp.date} | {gp.time}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Customer */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>
                          {gp.customerName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />
                          {gp.destination}
                        </div>
                      </td>

                      {/* Column 3: Vehicle & Driver */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                          <Truck size={13} style={{ display: 'inline', marginRight: '4px', color: '#2563eb' }} />
                          {gp.vehicleNo}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {gp.driverName} ({gp.driverPhone})
                        </div>
                      </td>

                      {/* Column 4: Items */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '240px' }}>
                          {(gp.items || []).map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: '0.76rem',
                                color: '#334155',
                                background: '#f8fafc',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}
                            >
                              <span>
                                <strong>{item.productName}</strong> ({item.sizeName})
                              </span>
                              <strong style={{ color: '#0284c7' }}>{item.cartonsDispatched} ctns</strong>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Column 5: Total Cartons */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontWeight: 800,
                            fontSize: '0.9rem'
                          }}
                        >
                          {gp.totalCartons} Ctns
                        </span>
                      </td>

                      {/* Column 6: Total Bottles */}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.88rem' }}>
                          {gp.totalBottles.toLocaleString()} btls
                        </span>
                      </td>

                      {/* Column 7: Status */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} />
                          <span>Dispatched</span>
                        </span>
                      </td>

                      {/* Column 8: Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '5px 10px', fontSize: '0.76rem', gap: '4px' }}
                            onClick={() => {
                              setSelectedGatePass(gp);
                              setActiveModal('THERMAL_PRINT');
                            }}
                            title="Print 80mm Thermal Receipt Slip"
                          >
                            <Printer size={13} />
                            <span>Thermal Print</span>
                          </button>

                          {onDeleteGatePass && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 8px', color: '#e11d48' }}
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete Gate Pass ${gp.gatePassNo}?`)) {
                                  onDeleteGatePass(gp);
                                }
                              }}
                              title="Delete Record"
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
      </div>

      {/* ========================================================
          MODAL 1: CREATE NEW GATE PASS
         ======================================================== */}
      {activeModal === 'CREATE' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Generate Outward Gate Pass (گیٹ پاس بنائیں)</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Filled cartons will be automatically cut from inventory
                  </div>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitGatePass}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '72vh', overflowY: 'auto' }}>
                {/* Notice Banner */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.82rem',
                    color: '#1e40af'
                  }}
                >
                  <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Automatic Stock Deduction:</strong> Jaise hi aap gate pass confirm karenge, select kiye gaye cartons filled inventory se foran minus (cut) ho jayenge aur 80mm thermal slip print ke liye open hogi.
                  </div>
                </div>

                {/* Row 1: GP Number & Date/Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Gate Pass Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={gatePassForm.gatePassNo}
                      onChange={e => setGatePassForm(prev => ({ ...prev, gatePassNo: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={gatePassForm.date}
                      onChange={e => setGatePassForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dispatch Time</label>
                    <input
                      type="text"
                      className="form-input"
                      value={gatePassForm.time}
                      onChange={e => setGatePassForm(prev => ({ ...prev, time: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Customer / Destination */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Customer / Distributor / Party <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Al-Madina Traders, Metro Wholesalers"
                      value={gatePassForm.customerName}
                      onChange={e => setGatePassForm(prev => ({ ...prev, customerName: e.target.value }))}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination / City / Area</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Lahore, Multan Road, Warehouse 2"
                      value={gatePassForm.destination}
                      onChange={e => setGatePassForm(prev => ({ ...prev, destination: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Row 3: Vehicle & Driver */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Vehicle No / Truck <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. LES-7821 / Shahzore"
                      value={gatePassForm.vehicleNo}
                      onChange={e => setGatePassForm(prev => ({ ...prev, vehicleNo: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Driver Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Muhammad Tariq"
                      value={gatePassForm.driverName}
                      onChange={e => setGatePassForm(prev => ({ ...prev, driverName: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Driver Phone No</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 0300-1234567"
                      value={gatePassForm.driverPhone}
                      onChange={e => setGatePassForm(prev => ({ ...prev, driverPhone: e.target.value }))}
                    />
                  </div>
                </div>

                {/* CARTON ITEMS TO DISPATCH */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>
                      Filled Cartons to Dispatch (بھیجے جانے والے کارٹن):
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddItemRow}
                      style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                    >
                      <Plus size={13} />
                      <span>+ Add Another Product</span>
                    </button>
                  </div>

                  {gatePassForm.items.length === 0 ? (
                    <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', color: '#b91c1c', fontSize: '0.82rem', textAlign: 'center' }}>
                      No items selected. Click "+ Add Another Product" to select cartons.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {gatePassForm.items.map((item, idx) => {
                        const selectedSizeObj = productSizes.find(s => String(s.id) === String(item.sizeId));
                        const maxAvailable = selectedSizeObj ? Number(selectedSizeObj.carton_quantity || 0) : 0;
                        const bpc = selectedSizeObj ? getBottlesPerCarton(selectedSizeObj) : 24;

                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '2fr 1fr 1fr 34px',
                              gap: '10px',
                              alignItems: 'center',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <div>
                              <select
                                className="form-select"
                                value={item.sizeId}
                                onChange={e => handleUpdateItem(idx, 'sizeId', e.target.value)}
                                style={{ fontSize: '0.84rem' }}
                                required
                              >
                                {availableStock.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.product_name} - {s.size || s.size_name} (In Stock: {s.carton_quantity} ctns)
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <input
                                type="number"
                                min="1"
                                max={maxAvailable || 1}
                                className="form-input"
                                value={item.cartonQuantity}
                                onChange={e => handleUpdateItem(idx, 'cartonQuantity', e.target.value)}
                                placeholder="Cartons"
                                style={{ fontSize: '0.84rem' }}
                                required
                              />
                            </div>

                            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                              <div>
                                Holds: <strong>{(parseInt(item.cartonQuantity, 10) || 0) * bpc} btls</strong>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>({bpc} btls/ctn)</div>
                            </div>

                            <div>
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#e11d48',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '4px'
                                }}
                                title="Remove item"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Additional Notes & Security Officer */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Gate Security Guard</label>
                    <input
                      type="text"
                      className="form-input"
                      value={gatePassForm.securityGuard}
                      onChange={e => setGatePassForm(prev => ({ ...prev, securityGuard: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes / Instructions</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Inspect seal before exit, fragile goods"
                      value={gatePassForm.notes}
                      onChange={e => setGatePassForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
                  <Truck size={16} />
                  <span>Issue Gate Pass & Cut Stock (گیٹ پاس جاری کریں)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: THERMAL PRINT RECEIPT SLIP (80mm / POS Format)
         ======================================================== */}
      {activeModal === 'THERMAL_PRINT' && selectedGatePass && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="modal-container"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: 0, overflow: 'hidden' }}
          >
            {/* Top Toolbar */}
            <div
              style={{
                padding: '12px 16px',
                background: '#1e293b',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700 }}>
                <Printer size={16} color="#38bdf8" />
                <span>80mm Thermal Receipt Print Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* RECEIPT WRAPPER */}
            <div
              style={{
                padding: '24px 20px',
                background: '#f1f5f9',
                display: 'flex',
                justifyContent: 'center',
                maxHeight: '70vh',
                overflowY: 'auto'
              }}
            >
              {/* THE 80mm THERMAL RECEIPT SLIP CONTAINER */}
              <div
                id="thermal-print-area"
                style={{
                  width: '320px',
                  background: '#ffffff',
                  padding: '18px 14px',
                  borderRadius: '6px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  fontFamily: '"Courier New", Courier, monospace',
                  color: '#000000',
                  fontSize: '11px',
                  lineHeight: 1.35
                }}
              >
                {/* Thermal Header */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '1px' }}>
                    VELORA WMS FACTORY
                  </div>
                  <div style={{ fontSize: '10px' }}>INDUSTRIAL ESTATE, UNIT 4</div>
                  <div style={{ fontSize: '10px' }}>CELL: 0300-0000000</div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      marginTop: '6px',
                      padding: '2px 0',
                      borderTop: '1px dashed #000',
                      borderBottom: '1px dashed #000'
                    }}
                  >
                    *** OUTWARD DISPATCH GATE PASS ***
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{ marginBottom: '8px', fontSize: '10.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GP NO: <strong>{selectedGatePass.gatePassNo}</strong></span>
                    <span>{selectedGatePass.date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>TIME: {selectedGatePass.time}</span>
                    <span>TYPE: OUTWARD</span>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    PARTY: <strong>{selectedGatePass.customerName}</strong>
                  </div>
                  <div>
                    DEST.: {selectedGatePass.destination}
                  </div>
                  <div style={{ borderTop: '1px dotted #888', marginTop: '4px', paddingTop: '4px' }}>
                    VEHICLE: <strong>{selectedGatePass.vehicleNo}</strong>
                  </div>
                  <div>
                    DRIVER: {selectedGatePass.driverName} ({selectedGatePass.driverPhone})
                  </div>
                </div>

                {/* Items Divider */}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* Items Table Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 40px 48px',
                    fontWeight: 800,
                    fontSize: '10.5px',
                    paddingBottom: '3px',
                    borderBottom: '1px solid #000'
                  }}
                >
                  <span>ITEM / PRODUCT</span>
                  <span style={{ textAlign: 'right' }}>CTN</span>
                  <span style={{ textAlign: 'right' }}>BTLS</span>
                </div>

                {/* Items List */}
                <div style={{ margin: '6px 0' }}>
                  {(selectedGatePass.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 40px 48px',
                        padding: '2px 0',
                        fontSize: '10.5px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.productName}</div>
                        <div style={{ fontSize: '9.5px', color: '#444' }}>{item.sizeName} ({item.bottlesPerCarton}/ctn)</div>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 800 }}>{item.cartonsDispatched}</div>
                      <div style={{ textAlign: 'right' }}>{item.totalBottlesDispatched}</div>
                    </div>
                  ))}
                </div>

                {/* Summary Box */}
                <div
                  style={{
                    borderTop: '1px dashed #000',
                    borderBottom: '1px dashed #000',
                    padding: '6px 0',
                    margin: '8px 0',
                    fontSize: '11px',
                    fontWeight: 800
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>TOTAL CARTONS:</span>
                    <span>{selectedGatePass.totalCartons} CTNS</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>TOTAL BOTTLES:</span>
                    <span>{selectedGatePass.totalBottles} BTLS</span>
                  </div>
                </div>

                {/* Notes if any */}
                {selectedGatePass.notes && (
                  <div style={{ fontSize: '9.5px', marginBottom: '8px', fontStyle: 'italic' }}>
                    Note: {selectedGatePass.notes}
                  </div>
                )}

                {/* Security Verification Stamp */}
                <div
                  style={{
                    textAlign: 'center',
                    padding: '4px',
                    border: '1px solid #000',
                    fontWeight: 800,
                    fontSize: '10px',
                    marginBottom: '10px'
                  }}
                >
                  GATE SECURITY: [✓] VERIFIED & ALLOWED EXIT
                </div>

                {/* Barcode Mock */}
                <div style={{ textAlign: 'center', margin: '8px 0' }}>
                  <div style={{ fontSize: '13px', letterSpacing: '4px' }}>
                    ||| | ||||| || |||||| | ||| ||
                  </div>
                  <div style={{ fontSize: '9px', letterSpacing: '1px' }}>
                    *{selectedGatePass.gatePassNo}*
                  </div>
                </div>

                {/* Signatures */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginTop: '16px',
                    paddingTop: '8px',
                    fontSize: '9.5px',
                    textAlign: 'center'
                  }}
                >
                  <div>
                    <div style={{ borderBottom: '1px dotted #000', height: '18px' }} />
                    <div style={{ marginTop: '2px', fontWeight: 700 }}>Store Incharge</div>
                  </div>
                  <div>
                    <div style={{ borderBottom: '1px dotted #000', height: '18px' }} />
                    <div style={{ marginTop: '2px', fontWeight: 700 }}>Security Guard</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '14px' }}>
                  <div style={{ borderBottom: '1px dotted #000', width: '60%', margin: '0 auto', height: '18px' }} />
                  <div style={{ marginTop: '2px', fontSize: '9.5px', fontWeight: 700 }}>Driver Signature</div>
                </div>

                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '8.5px',
                    color: '#666',
                    marginTop: '12px',
                    borderTop: '1px dotted #aaa',
                    paddingTop: '4px'
                  }}
                >
                  Software by Velora WMS • {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Modal Bottom Buttons */}
            <div
              style={{
                padding: '12px 16px',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyReceiptText}
                style={{ gap: '4px' }}
              >
                {isCopied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveModal(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleTriggerPrint}
                  style={{ gap: '6px', fontWeight: 700 }}
                >
                  <Printer size={16} />
                  <span>Print Thermal Slip (80mm)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Print Styles for 80mm Thermal Printer */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-print-area,
          #thermal-print-area * {
            visibility: visible !important;
          }
          #thermal-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 78mm !important;
            max-width: 80mm !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .modal-overlay,
          .modal-container {
            position: static !important;
            background: transparent !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

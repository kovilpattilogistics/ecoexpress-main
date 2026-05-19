import React, { useEffect, useState } from 'react';
import {
  Users, Package, ClipboardList, BarChart3, ShoppingCart, Truck,
  AlertTriangle, FileText, TrendingDown, CircleDollarSign,
} from 'lucide-react';
import { InvoiceGenerator } from './InvoiceGenerator';
import { subscribeInventory, subscribeOrders, subscribeCustomers, calculateCases } from '../services/firestoreService';
import { InventoryItem, Order, Customer, ProductType, CanState } from '../types';
import { LOW_STOCK_THRESHOLD_CANS, LOW_STOCK_THRESHOLD_BOTTLES } from '../constants';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    const unsubInv  = subscribeInventory(setInventory);
    const unsubOrd  = subscribeOrders(setOrders);
    const unsubCust = subscribeCustomers(setCustomers);
    return () => { unsubInv(); unsubOrd(); unsubCust(); };
  }, []);

  const pendingAmount  = customers.reduce((acc, c) => acc + (c.pendingAmount || 0), 0);
  const upcomingOrders = orders.filter(o => !o.status.includes('Delivered') && !o.status.includes('picked')).slice(0, 5);

  const lowStockItems = inventory.filter(item => {
    if (item.type === ProductType.CAN_20L && item.canState === CanState.FILLED)
      return item.quantity < LOW_STOCK_THRESHOLD_CANS;
    if (item.type !== ProductType.CAN_20L)
      return item.quantity < LOW_STOCK_THRESHOLD_BOTTLES;
    return false;
  });

  // ─── Nav items ──────────────────────────────────────────────────────────────
  const navItems = [
    { label: 'Customers',      icon: Users,           page: 'customers' },
    { label: 'Orders',         icon: ClipboardList,   page: 'orders' },
    { label: 'Inventory',      icon: Package,         page: 'inventory' },
    { label: 'Revenue',        icon: BarChart3,       page: 'revenue' },
    { label: 'Create Order',   icon: ShoppingCart,    page: 'create-order' },
    { label: 'Live Delivery',  icon: Truck,           page: 'delivery-status' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* ── Top Nav Row ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {navItems.map(({ label, icon: Icon, page }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 9,
              border: '1px solid #e2e8f0', background: '#fff',
              color: '#374151', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f0fdf4'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a5c2a'; (e.currentTarget as HTMLButtonElement).style.color = '#1a5c2a'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}

        {/* Invoice Button — stands out */}
        <button
          onClick={() => setShowInvoice(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 9,
            border: 'none', background: '#1a5c2a',
            color: '#fff', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', marginLeft: 'auto',
            boxShadow: '0 2px 8px rgba(26,92,42,0.25)',
          }}
        >
          <FileText size={16} />
          Generate Invoice
        </button>
      </div>

      {/* ── Low Stock Alert ─────────────────────────────────────────────────── */}
      {lowStockItems.length > 0 && (
        <div
          onClick={() => onNavigate('inventory')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, marginBottom: 20, cursor: 'pointer' }}
        >
          <AlertTriangle size={16} color="#ea580c" style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 700, color: '#c2410c', fontSize: 13 }}>Low Stock: </span>
            <span style={{ color: '#9a3412', fontSize: 13 }}>
              {lowStockItems.map(i => `${i.type} (${i.canState || 'Cases'}): ${i.quantity}`).join(' • ')}
            </span>
          </div>
        </div>
      )}

      {/* ── Key Stats ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard icon={<CircleDollarSign size={18} color="#dc2626" />} label="Pending Payments" value={`₹${pendingAmount.toLocaleString('en-IN')}`} color="#fef2f2" border="#fecaca" textColor="#dc2626" onClick={() => onNavigate('customers')} />
        <StatCard icon={<ClipboardList size={18} color="#2563eb" />} label="Pending Orders" value={String(upcomingOrders.length)} color="#eff6ff" border="#bfdbfe" textColor="#2563eb" onClick={() => onNavigate('orders')} />
        <StatCard icon={<Users size={18} color="#059669" />} label="Total Customers" value={String(customers.length)} color="#f0fdf4" border="#bbf7d0" textColor="#059669" onClick={() => onNavigate('customers')} />
        <StatCard icon={<TrendingDown size={18} color="#7c3aed" />} label="Low Stock Items" value={String(lowStockItems.length)} color="#faf5ff" border="#e9d5ff" textColor="#7c3aed" onClick={() => onNavigate('inventory')} />
      </div>

      {/* ── Stock Overview (compact) ─────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 12 }}>Stock Overview</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {inventory.length === 0
            ? <span style={{ color: '#9ca3af', fontSize: 13 }}>Loading stock…</span>
            : inventory.map((item, idx) => {
                const isLow = item.type === ProductType.CAN_20L
                  ? item.quantity < LOW_STOCK_THRESHOLD_CANS
                  : item.quantity < LOW_STOCK_THRESHOLD_BOTTLES;
                const display = item.type.includes('Bottle') ? calculateCases(item.type, item.quantity).display : `${item.quantity} Cans`;
                return (
                  <div key={idx} style={{ padding: '7px 14px', borderRadius: 8, background: isLow ? '#fef2f2' : '#f8fafc', border: `1px solid ${isLow ? '#fecaca' : '#e2e8f0'}`, cursor: 'pointer' }} onClick={() => onNavigate('inventory')}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{item.type}{item.canState ? ` (${item.canState})` : ''}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: isLow ? '#dc2626' : '#1a1a1a' }}>{display}</div>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* ── Upcoming Orders (compact table) ─────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>Upcoming Orders</div>
          <button onClick={() => onNavigate('orders')} style={{ fontSize: 12, color: '#1a5c2a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
        </div>
        {upcomingOrders.length === 0
          ? <p style={{ color: '#9ca3af', fontSize: 13 }}>No pending orders.</p>
          : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {['Customer', 'Date', 'Items', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upcomingOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f8f8f8', cursor: 'pointer' }} onClick={() => onNavigate('orders')}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{order.customerName}</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280' }}>{order.deliveryDate}</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280', fontSize: 12 }}>{order.items.map(i => `${i.productType} ×${i.quantity}`).join(', ')}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>₹{order.totalAmount}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: '#f0fdf4', color: '#059669', fontWeight: 600 }}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      {/* Invoice Modal */}
      {showInvoice && <InvoiceGenerator onClose={() => setShowInvoice(false)} />}
    </div>
  );
};

// ── Stat Card helper ──────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, border, textColor, onClick }: any) => (
  <div onClick={onClick} style={{ background: color, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'transform 0.1s' }}
    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'}
    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>{icon}<span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span></div>
    <div style={{ fontSize: 22, fontWeight: 900, color: textColor }}>{value}</div>
  </div>
);

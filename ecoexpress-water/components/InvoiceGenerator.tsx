import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Printer, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { PRODUCT_CONFIG } from '../constants';
import { ProductType } from '../types';
import logo from '../assets/logo-final.png';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LineItem {
  id: string;
  date: string;
  product: ProductType;
  unit: string;
  qty: number;
  rate: number;
}

interface InvoiceData {
  invoiceNo: string;
  invoiceDate: string;
  periodFrom: string;
  periodTo: string;
  customerName: string;
  shopName: string;
  customerLocation: string;
  notes: string;
  items: LineItem[];
}

const PRODUCT_UNITS: Record<ProductType, string> = {
  [ProductType.BOTTLE_300ML]: 'Case',
  [ProductType.BOTTLE_500ML]: 'Case',
  [ProductType.BOTTLE_1L]:    'Case',
  [ProductType.BOTTLE_2L]:    'Case',
  [ProductType.CAN_20L]:      'Can',
};

const PRODUCT_ITEMS_PER_CASE: Record<ProductType, number | null> = {
  [ProductType.BOTTLE_300ML]: 35,
  [ProductType.BOTTLE_500ML]: 24,
  [ProductType.BOTTLE_1L]:    12,
  [ProductType.BOTTLE_2L]:    9,
  [ProductType.CAN_20L]:      null,
};

function uid() { return Math.random().toString(36).slice(2, 9); }

function today() { return new Date().toISOString().split('T')[0]; }

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatInvoiceNo() {
  const d = new Date();
  return `EEL-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function getCaseInfo(product: ProductType, qty: number): string {
  const ipp = PRODUCT_ITEMS_PER_CASE[product];
  if (!ipp) return '–';
  return `${ipp} items/case → ${qty * ipp} items`;
}

// ─── Invoice Print Template ────────────────────────────────────────────────────
const PrintableInvoice = React.forwardRef<HTMLDivElement, { data: InvoiceData }>(
  ({ data }, ref) => {
    // Group items by date
    const grouped: Record<string, LineItem[]> = {};
    data.items.forEach(item => {
      if (!grouped[item.date]) grouped[item.date] = [];
      grouped[item.date].push(item);
    });
    const sortedDates = Object.keys(grouped).sort();

    const dayTotals = sortedDates.map(d =>
      grouped[d].reduce((s, i) => s + i.qty * i.rate, 0)
    );
    const grandTotal = dayTotals.reduce((s, v) => s + v, 0);

    return (
      <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', padding: '32px', maxWidth: '760px', margin: '0 auto', fontSize: '13px', color: '#1a1a1a' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 56, height: 56, border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={logo} alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1a5c2a' }}>EcoExpress Logistics</div>
              <div style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>Clean Water. Fast Delivery. Eco Future.</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#1a5c2a', letterSpacing: 2 }}>INVOICE</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Invoice No: <strong>{data.invoiceNo}</strong></div>
            <div style={{ fontSize: 12 }}>Invoice Date: <strong>{formatDate(data.invoiceDate)}</strong></div>
            {data.periodFrom && data.periodTo && (
              <div style={{ fontSize: 12 }}>Period Covered: <strong>{formatDate(data.periodFrom)} – {formatDate(data.periodTo)}</strong></div>
            )}
            <div style={{ fontSize: 12 }}>Status: <span style={{ color: '#1a5c2a', fontWeight: 700 }}>✓ Issued</span></div>
          </div>
        </div>

        <hr style={{ borderColor: '#1a5c2a', borderWidth: 2, margin: '16px 0' }} />

        {/* From / Bill To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ border: '1px solid #c6e0cc', borderRadius: 8, padding: '12px 16px', background: '#f6fbf7' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1a5c2a', textTransform: 'uppercase', marginBottom: 8 }}>📦 From (Distributor)</div>
            <div style={{ fontWeight: 700 }}>EcoExpress Logistics</div>
            <div style={{ color: '#444', lineHeight: 1.7 }}>
              36/A, Valluvar Nagar,<br />
              Kadalaiyur Road,<br />
              Kovilpatti – 628 501<br />
              Tamil Nadu, India<br />
              📞 +91 63810 65877
            </div>
          </div>
          <div style={{ border: '1px solid #c6e0cc', borderRadius: 8, padding: '12px 16px', background: '#f6fbf7' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1a5c2a', textTransform: 'uppercase', marginBottom: 8 }}>📞 Bill To (Customer)</div>
            <div style={{ fontWeight: 700 }}>{data.customerName || '—'}</div>
            {data.shopName && <div style={{ color: '#444' }}>{data.shopName}</div>}
            {data.customerLocation && <div style={{ color: '#666', fontSize: 12 }}>{data.customerLocation}</div>}
          </div>
        </div>

        {/* Day-by-day tables */}
        {sortedDates.map((date, di) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ background: '#1a5c2a', color: '#fff', padding: '6px 12px', borderRadius: 6, display: 'inline-block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              📅 {formatDate(date)}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#2d7a3a', color: '#fff' }}>
                  {['#', 'Product', 'Unit', 'Qty', 'Case / Unit Count', 'Rate (₹)', 'Amount (₹)'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: h === '#' ? 'center' : 'left', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grouped[date].map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f6fbf7' }}>
                    <td style={{ padding: '7px 10px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1a5c2a' }}>{item.product}</td>
                    <td style={{ padding: '7px 10px' }}>{item.unit}</td>
                    <td style={{ padding: '7px 10px' }}>{item.unit === 'Case' ? `${item.qty} cases` : item.qty}</td>
                    <td style={{ padding: '7px 10px', color: '#555' }}>{getCaseInfo(item.product, item.qty)}</td>
                    <td style={{ padding: '7px 10px' }}>{item.rate.toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{(item.qty * item.rate).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ background: '#eef6ef', borderTop: '2px solid #c6e0cc' }}>
                  <td colSpan={6} style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#1a5c2a' }}>Day Sub-Total ({formatDate(date)})</td>
                  <td style={{ padding: '7px 10px', fontWeight: 700, color: '#1a5c2a' }}>₹ {dayTotals[di].toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* Summary */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <table style={{ minWidth: 320, fontSize: 13 }}>
            <tbody>
              {sortedDates.map((date, di) => (
                <tr key={date}>
                  <td style={{ padding: '5px 16px', color: '#555' }}>Sub-Total ({formatDate(date)})</td>
                  <td style={{ padding: '5px 16px', textAlign: 'right', fontWeight: 600 }}>₹ {dayTotals[di].toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '5px 16px', color: '#555' }}>Tax / GST</td>
                <td style={{ padding: '5px 16px', textAlign: 'right', fontWeight: 600 }}>₹ 0.00</td>
              </tr>
              <tr style={{ background: '#1a5c2a', color: '#fff' }}>
                <td style={{ padding: '10px 16px', fontWeight: 900, fontSize: 15 }}>GRAND TOTAL</td>
                <td style={{ padding: '10px 16px', fontWeight: 900, fontSize: 15, textAlign: 'right' }}>₹ {grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {data.notes && (
          <div style={{ marginTop: 24, padding: '12px 16px', background: '#f6fbf7', border: '1px solid #c6e0cc', borderRadius: 8 }}>
            <div style={{ fontWeight: 700, color: '#1a5c2a', marginBottom: 4 }}>Notes</div>
            <div style={{ color: '#444', whiteSpace: 'pre-line' }}>{data.notes}</div>
          </div>
        )}

        <div style={{ marginTop: 32, borderTop: '1px solid #e2e8f0', paddingTop: 12, color: '#999', fontSize: 11, textAlign: 'center' }}>
          EcoExpress Logistics • Kovilpatti, Tamil Nadu • +91 63810 65877 • Thank you for your business!
        </div>
      </div>
    );
  }
);

// ─── Main Modal ────────────────────────────────────────────────────────────────
interface Props { onClose: () => void; prefillCustomer?: { name: string; shopName?: string; location?: string }; }

export const InvoiceGenerator: React.FC<Props> = ({ onClose, prefillCustomer }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState(false);

  const [data, setData] = useState<InvoiceData>({
    invoiceNo: formatInvoiceNo(),
    invoiceDate: today(),
    periodFrom: '',
    periodTo: today(),
    customerName: prefillCustomer?.name ?? '',
    shopName: prefillCustomer?.shopName ?? '',
    customerLocation: prefillCustomer?.location ?? '',
    notes: '',
    items: [{ id: uid(), date: today(), product: ProductType.CAN_20L, unit: 'Can', qty: 1, rate: PRODUCT_CONFIG[ProductType.CAN_20L].retailPrice }],
  });

  const set = (key: keyof InvoiceData, val: any) => setData(d => ({ ...d, [key]: val }));

  const addItem = () => setData(d => ({
    ...d,
    items: [...d.items, { id: uid(), date: today(), product: ProductType.CAN_20L, unit: 'Can', qty: 1, rate: PRODUCT_CONFIG[ProductType.CAN_20L].retailPrice }],
  }));

  const updateItem = (id: string, key: keyof LineItem, value: any) => setData(d => ({
    ...d,
    items: d.items.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, [key]: value };
      if (key === 'product') {
        updated.unit = PRODUCT_UNITS[value as ProductType];
        updated.rate = PRODUCT_CONFIG[value as ProductType].retailPrice;
      }
      return updated;
    }),
  }));

  const removeItem = (id: string) => setData(d => ({ ...d, items: d.items.filter(i => i.id !== id) }));

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice - ${data.invoiceNo}</title>
      <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head>
      <body>${content}
      <script>window.onload = () => { window.print(); }<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const grandTotal = data.items.reduce((s, i) => s + i.qty * i.rate, 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px 0' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 820, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} color="#1a5c2a" />
            <span style={{ fontWeight: 700, fontSize: 18, color: '#1a2a1a' }}>Generate Invoice</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPreview(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #1a5c2a', color: '#1a5c2a', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {preview ? <ChevronUp size={15} /> : <ChevronDown size={15} />} {preview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#1a5c2a', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              <Printer size={15} /> Print / Save PDF
            </button>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {preview ? (
          /* Preview Mode */
          <div style={{ overflowY: 'auto', maxHeight: '80vh' }}>
            <PrintableInvoice ref={printRef} data={data} />
          </div>
        ) : (
          /* Edit Mode */
          <div style={{ padding: 24, overflowY: 'auto', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Invoice Meta */}
            <div>
              <div style={{ fontWeight: 700, color: '#1a5c2a', fontSize: 13, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Invoice Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Invoice No', key: 'invoiceNo', type: 'text' },
                  { label: 'Invoice Date', key: 'invoiceDate', type: 'date' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input type={f.type} value={String(data[f.key as keyof InvoiceData])} onChange={e => set(f.key as keyof InvoiceData, e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Period From</label>
                  <input type="date" value={data.periodFrom} onChange={e => set('periodFrom', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Period To</label>
                  <input type="date" value={data.periodTo} onChange={e => set('periodTo', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Customer */}
            <div>
              <div style={{ fontWeight: 700, color: '#1a5c2a', fontSize: 13, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bill To</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Customer Name *', key: 'customerName' },
                  { label: 'Shop / Business Name', key: 'shopName' },
                  { label: 'Location', key: 'customerLocation' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input value={String(data[f.key as keyof InvoiceData])} onChange={e => set(f.key as keyof InvoiceData, e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, color: '#1a5c2a', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Items</div>
                <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px dashed #1a5c2a', color: '#1a5c2a', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                  <Plus size={14} /> Add Row
                </button>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Date', 'Product', 'Qty', 'Rate (₹)', 'Amount', ''].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="date" value={item.date} onChange={e => updateItem(item.id, 'date', e.target.value)}
                            style={{ padding: '5px 7px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 12, width: 130 }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <select value={item.product} onChange={e => updateItem(item.id, 'product', e.target.value as ProductType)}
                            style={{ padding: '5px 7px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 12 }}>
                            {Object.values(ProductType).map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input type="number" min={1} value={item.qty} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                              style={{ padding: '5px 7px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 12, width: 70 }} />
                            <span style={{ color: '#999', fontSize: 11 }}>{item.unit}</span>
                          </div>
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" min={0} value={item.rate} onChange={e => updateItem(item.id, 'rate', Number(e.target.value))}
                            style={{ padding: '5px 7px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 12, width: 80 }} />
                        </td>
                        <td style={{ padding: '6px 12px', fontWeight: 700, color: '#1a5c2a' }}>₹{(item.qty * item.rate).toFixed(2)}</td>
                        <td style={{ padding: '6px 8px' }}>
                          {data.items.length > 1 && (
                            <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#1a5c2a', color: '#fff' }}>
                      <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>GRAND TOTAL</td>
                      <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 900, fontSize: 15 }}>₹{grandTotal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
              <textarea value={data.notes} onChange={e => set('notes', e.target.value)} rows={2}
                placeholder="e.g. Payment due within 7 days..."
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

          </div>
        )}

        {/* Hidden print ref */}
        <div style={{ display: 'none' }}><PrintableInvoice ref={printRef} data={data} /></div>
      </div>
    </div>
  );
};

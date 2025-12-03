import React, { useEffect, useState, useRef } from 'react';
import { FileText, Wifi, WifiOff, Plus, Trash2, Search, Save } from 'lucide-react';
import { db, initDB } from './db';
import { Product, InvoiceItem, NCFType } from './types';
import { calculateInvoiceTotals, validateRNC, formatNCF } from './utils/fiscalUtils';
import { useLiveQuery } from 'dexie-react-hooks';

function App() {
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [simulateOffline, setSimulateOffline] = useState(false);

  // Customer State
  const [customerRnc, setCustomerRnc] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isValidRnc, setIsValidRnc] = useState(false);

  // Line Item State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refs for focus management
  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const products = useLiveQuery(() => db.products.toArray());
  const invoices = useLiveQuery(() => db.invoices.toArray());

  // Initialization
  useEffect(() => {
    initDB();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isActuallyOnline = isOnline && !simulateOffline;

  // Sync Worker Simulation
  useEffect(() => {
    if (!isActuallyOnline) return;

    const runSync = async () => {
      const pendingInvoices = await db.invoices.where({ syncStatus: 'pending' }).toArray();

      if (pendingInvoices.length > 0) {
        console.log(`[Sync Worker] Found ${pendingInvoices.length} pending invoices. Syncing...`);
        for (const invoice of pendingInvoices) {
           try {
             if (Math.random() > 0.1) {
               await new Promise(resolve => setTimeout(resolve, 500));
               await db.invoices.update(invoice.id!, { syncStatus: 'synced' });
               console.log(`[Sync Worker] Invoice ${invoice.ncf} synced.`);
             } else {
                await db.invoices.update(invoice.id!, { syncStatus: 'error', syncError: 'Simulated network error' });
               console.error(`[Sync Worker] Invoice ${invoice.ncf} failed to sync.`);
             }
           } catch (err) { console.error('Sync error', err); }
        }
      }
    };

    // Run immediately when coming online
    runSync();

    // Then interval
    const syncInterval = setInterval(runSync, 5000);
    return () => clearInterval(syncInterval);
  }, [isActuallyOnline]);

  // RNC Validation
  useEffect(() => {
    setIsValidRnc(validateRNC(customerRnc));
  }, [customerRnc]);

  // Filtered Products
  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
    setShowSuggestions(false);
    setQuantity(1);
    // Move focus to quantity
    setTimeout(() => qtyInputRef.current?.focus(), 0);
  };

  const addItemToCart = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedProduct) return;
    if (quantity <= 0) return;

    const subtotal = selectedProduct.price * quantity;
    const taxAmount = subtotal * selectedProduct.taxRate;

    const newItem: InvoiceItem = {
      productId: selectedProduct.id!,
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      quantity: quantity,
      unitPrice: selectedProduct.price,
      taxRate: selectedProduct.taxRate,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount
    };

    setCart([...cart, newItem]);

    // Reset inputs and focus back to search
    setSelectedProduct(null);
    setSearchQuery('');
    setQuantity(1);
    searchInputRef.current?.focus();
  };

  const removeItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleCheckout = async () => {
    if (!cart.length) return;
    if (!isValidRnc) {
      alert('RNC Inválido');
      return;
    }

    const ncfType = NCFType.CONSUMO;
    const sequence = await db.ncfSequences.where({ type: ncfType }).first();

    if (!sequence) {
      alert('No NCF Sequence found');
      return;
    }

    const nextSeq = sequence.currentSequence + 1;
    const ncfString = formatNCF(sequence.serie, sequence.type, nextSeq);

    await db.ncfSequences.update(sequence.id!, { currentSequence: nextSeq });

    const totals = calculateInvoiceTotals(cart);

    await db.invoices.add({
      uuid: crypto.randomUUID(),
      ncf: ncfString,
      ncfType: ncfType,
      customerId: 0,
      customerRnc: customerRnc,
      customerName: customerName || 'Cliente Genérico',
      items: cart,
      subtotal: totals.subtotal,
      totalTax: totals.totalTax,
      totalAmount: totals.totalAmount,
      createdAt: new Date(),
      syncStatus: 'pending'
    });

    setCart([]);
    setCustomerRnc('');
    setCustomerName('');
    alert(`Factura creada: ${ncfString}`);
    searchInputRef.current?.focus();
  };

  const totals = calculateInvoiceTotals(cart);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-800 text-white p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded">
               <FileText size={24} />
             </div>
             <div>
               <h1 className="text-xl font-bold leading-none">SISTEMA FACTURACION LB-E-CF</h1>
               <span className="text-xs text-slate-400">Versión Escritorio</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
            {/* QA Toggle */}
            <button
              onClick={() => setSimulateOffline(!simulateOffline)}
              className="text-xs px-2 py-1 bg-slate-700 rounded hover:bg-slate-600 text-slate-300"
            >
              {simulateOffline ? 'Habilitar Red' : 'Simular Offline'}
            </button>

            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isActuallyOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isActuallyOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
              {isActuallyOnline ? 'Conectado' : 'Offline'}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-6 flex gap-6">

        {/* Main Work Area */}
        <div className="flex-1 flex flex-col gap-6">

          {/* Customer Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Datos del Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RNC / Cédula</label>
                <input
                  type="text"
                  value={customerRnc}
                  onChange={(e) => setCustomerRnc(e.target.value)}
                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none ${!isValidRnc && customerRnc ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                  placeholder="Ingrese RNC..."
                />
                {!isValidRnc && customerRnc && <span className="text-xs text-red-500 mt-1">Formato inválido</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nombre del cliente (Opcional)"
                />
              </div>
            </div>
          </div>

          {/* Product Entry & List */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex-1 flex flex-col">
            <h2 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Detalle de Factura</h2>

            {/* Entry Form */}
            <form onSubmit={addItemToCart} className="flex gap-4 items-end mb-6 bg-slate-50 p-4 rounded border border-slate-200">
              <div className="flex-1 relative">
                <label className="block text-xs font-bold text-slate-600 mb-1">BUSCAR PRODUCTO (F2)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                      if (!e.target.value) setSelectedProduct(null);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Código o nombre..."
                  />
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && searchQuery && filteredProducts && filteredProducts.length > 0 && !selectedProduct && (
                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-b shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {filteredProducts.map(p => (
                        <div
                          key={p.id}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between"
                          onClick={() => handleProductSelect(p)}
                        >
                          <span className="font-medium text-slate-800">{p.name}</span>
                          <span className="text-slate-500 text-sm">${p.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-24">
                <label className="block text-xs font-bold text-slate-600 mb-1">CANT.</label>
                <input
                  ref={qtyInputRef}
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addItemToCart();
                  }}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center"
                />
              </div>

              <button
                ref={addBtnRef}
                type="submit"
                disabled={!selectedProduct || quantity <= 0}
                className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus size={18} /> AGREGAR
              </button>
            </form>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-2">Código</th>
                    <th className="py-3 px-2">Descripción</th>
                    <th className="py-3 px-2 text-right">Precio</th>
                    <th className="py-3 px-2 text-center">Cant.</th>
                    <th className="py-3 px-2 text-right">Impuesto</th>
                    <th className="py-3 px-2 text-right">Total</th>
                    <th className="py-3 px-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {cart.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 text-slate-600">{item.productCode}</td>
                      <td className="py-3 px-2 font-medium text-slate-800">{item.productName}</td>
                      <td className="py-3 px-2 text-right text-slate-600">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-2 text-center text-slate-800">{item.quantity}</td>
                      <td className="py-3 px-2 text-right text-slate-500">${item.taxAmount.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right font-bold text-slate-800">${item.total.toFixed(2)}</td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No hay items en la factura
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Totals & Actions */}
        <div className="w-80 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 sticky top-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase mb-6 tracking-wider">Resumen</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ITBIS (18%)</span>
                <span>${totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between text-2xl font-bold text-slate-800">
                <span>Total</span>
                <span>${totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || !isValidRnc}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex justify-center items-center gap-2"
            >
              <Save size={20} /> EMITIR FACTURA
            </button>

            {!isValidRnc && customerRnc && (
                 <p className="text-red-500 text-xs text-center mt-3">RNC inválido, no se puede facturar.</p>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Últimas Facturas</h3>
              <div className="space-y-3">
                 {invoices?.slice().reverse().slice(0, 3).map(inv => (
                    <div key={inv.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-700">{inv.ncf}</div>
                        <div className="text-slate-500">{new Date(inv.createdAt).toLocaleTimeString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${inv.totalAmount.toFixed(2)}</div>
                        <span className={`inline-block w-2 h-2 rounded-full ${inv.syncStatus === 'synced' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}

export default App;

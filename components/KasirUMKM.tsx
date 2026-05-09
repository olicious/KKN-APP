'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

type Product = {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  stock: number;
};

type CartItem = Product & {
  quantity: number;
};

export default function KasirUMKM() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  }

  async function fetchProducts() {
    setLoading(true);
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
        setLoading(false);
        return;
    }
    
    const { data: storeData } = await supabase
      .from('umkm_stores')
      .select('id')
      .eq('owner_id', authData.user.id)
      .single();

    if (!storeData?.id) {
        setLoading(false);
        return;
    }
    setStoreId(storeData.id);

    const { data, error } = await supabase
      .from('umkm_products')
      .select('id, name, category, selling_price, stock')
      .eq('store_id', storeData.id)
      .order('name', { ascending: true });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function addToCart(product: Product) {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Tidak bisa tambah melebihi stok
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return item; 
          if (newQuantity > item.stock) return item;
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  }

  const totalAmount = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  async function handleCheckout() {
    if (cart.length === 0 || !storeId) return;
    setCheckoutLoading(true);

    try {
      // 1. Insert ke umkm_transactions
      const { data: txData, error: txError } = await supabase
        .from('umkm_transactions')
        .insert({
          store_id: storeId,
          total_amount: totalAmount,
        })
        .select('id')
        .single();

      if (txError || !txData) throw new Error(txError?.message || "Gagal membuat transaksi");

      const transactionId = txData.id;

      // 2. Insert ke umkm_transaction_items
      const itemsPayload = cart.map(item => ({
        transaction_id: transactionId,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.selling_price
      }));

      const { error: itemsError } = await supabase
        .from('umkm_transaction_items')
        .insert(itemsPayload);

      if (itemsError) throw new Error(itemsError.message);

      // 3. Update stock di umkm_products
      const stockUpdates = cart.map(item => {
        const newStock = item.stock - item.quantity;
        return supabase
          .from('umkm_products')
          .update({ stock: newStock })
          .eq('id', item.id);
      });

      await Promise.all(stockUpdates);

      showToast("Transaksi berhasil diselesaikan! ✅", 'success');
      setCart([]);
      fetchProducts(); // Refresh stok di UI
      
    } catch (error: any) {
      console.error(error);
      showToast("Terjadi kesalahan saat memproses pembayaran: " + error.message, 'error');
    } finally {
      setCheckoutLoading(false);
    }
  }

  function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Mesin Kasir (POS)</h2>
        <p className="text-gray-500 text-sm mt-1">Proses transaksi penjualan secara langsung dengan cepat dan mudah.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[500px]">
        
        {/* Area Kiri: Daftar Produk (2/3) */}
        <div className="lg:w-2/3 bg-white rounded-xl shadow-md border border-[#e8dacd] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#e8dacd] bg-[#f4f1e8]">
            <h3 className="font-bold text-[#4a6b5d]">Katalog Produk</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4a6b5d]"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(product => {
                  const outOfStock = product.stock <= 0;
                  return (
                    <div 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`relative p-4 rounded-xl border flex flex-col justify-between h-32 transition-all 
                        ${outOfStock 
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' 
                          : 'border-gray-200 bg-white hover:border-[#4a6b5d] hover:shadow-md cursor-pointer'
                        }`}
                    >
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-2 text-sm leading-tight">{product.name}</p>
                      </div>
                      <div className="flex flex-col mt-2">
                        <p className="font-bold text-[#4a6b5d]">{formatRupiah(product.selling_price)}</p>
                        <p className={`text-xs font-medium mt-1 ${outOfStock ? 'text-red-500' : 'text-gray-500'}`}>
                          Stok: {product.stock}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                Belum ada produk. Tambahkan produk di menu Manajemen Produk.
              </div>
            )}
          </div>
        </div>

        {/* Area Kanan: Keranjang (1/3) */}
        <div className="lg:w-1/3 bg-white rounded-xl shadow-md border border-[#e8dacd] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#e8dacd] bg-[#f4f1e8] flex justify-between items-center">
            <h3 className="font-bold text-[#4a6b5d]">Keranjang Belanja</h3>
            <span className="bg-[#4a6b5d] text-white text-xs px-2.5 py-1 rounded-full font-bold">{cart.length} item</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {cart.length > 0 ? (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-[#4a6b5d] font-medium text-sm mt-0.5">{formatRupiah(item.selling_price)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#f4f1e8] p-1 rounded-lg border border-[#e8dacd]">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-gray-700 hover:bg-gray-100 font-bold border border-gray-200 transition-colors"
                    >-</button>
                    <span className="w-8 text-center text-gray-900 font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-gray-700 hover:bg-gray-100 font-bold border border-gray-200 transition-colors disabled:opacity-50"
                    >+</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-gray-400 gap-3">
                <span className="text-5xl opacity-50">🛒</span>
                <p className="text-sm font-medium">Keranjang masih kosong</p>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-[#e8dacd] bg-[#f4f1e8]">
            <div className="flex justify-between items-center mb-5">
              <span className="text-gray-600 font-medium text-sm">Total Tagihan</span>
              <span className="text-2xl font-bold text-[#b05e45]">{formatRupiah(totalAmount)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutLoading}
              className="w-full py-4 rounded-xl bg-[#4a6b5d] text-white font-bold text-base hover:bg-[#3a5448] shadow-sm transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {checkoutLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Memproses Pembayaran...
                </>
              ) : (
                "Bayar & Selesaikan"
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce z-50 ${toastType === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

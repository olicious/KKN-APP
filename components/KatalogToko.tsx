'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const checkIsOpen = (openTime: string, closeTime: string): boolean => {
  if (!openTime || !closeTime) return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oH, oM] = openTime.split(':').map(Number);
  const [cH, cM] = closeTime.split(':').map(Number);
  return cur >= oH * 60 + oM && cur <= cH * 60 + cM;
};

const getCategoryIcon = (category: string): string => {
  const map: Record<string, string> = {
    'Minuman': '🥤', 'Camilan': '🥟', 'Jajanan Pasar': '🍮',
    'Makanan Berat': '🍲', 'Kuliner': '🍜', 'Kriya': '🧶',
    'Retail': '🛒', 'Jasa': '🔧',
  };
  return map[category] || '🛍️';
};

export default function KatalogToko({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokoDanProduk() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data: storeData, error: storeError } = await supabase
          .from('umkm_stores')
          .select('*')
          .eq('id', storeId)
          .single();

        if (storeError) throw storeError;
        if (!storeData) throw new Error('Toko tidak ditemukan');
        setStoreInfo(storeData);

        const { data: productData, error: productError } = await supabase
          .from('umkm_products')
          .select('*')
          .eq('store_id', storeId)
          .gt('stock', 0);

        if (productError) throw productError;
        setProducts(productData || []);

      } catch (err: any) {
        console.error("Gagal memuat data:", err);
        setErrorMsg(err.message || "Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    }

    if (storeId) fetchTokoDanProduk();
  }, [storeId]);

  // --- Cart Logic ---
  function addToCart(product: any) {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { id: product.id, name: product.name, price: product.selling_price, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart(prev => {
      const existing = prev.find(p => p.id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter(p => p.id !== productId);
      return prev.map(p => p.id === productId ? { ...p, quantity: p.quantity - 1 } : p);
    });
  }

  function getQty(productId: string): number {
    return cart.find(p => p.id === productId)?.quantity || 0;
  }

  function handleCheckoutWA() {
    if (cart.length === 0 || !storeInfo?.whatsapp_number) return;
    const totalHarga = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    let text = `Halo *${storeInfo.nama_toko}*, saya ingin memesan:\n\n`;
    cart.forEach(item => {
      text += `- ${item.quantity}x ${item.name} (Rp ${(item.price * item.quantity).toLocaleString('id-ID')})\n`;
    });
    text += `\n*Total: Rp ${totalHarga.toLocaleString('id-ID')}*\nApakah pesanan bisa diambil atau diantar?`;
    window.open(`https://wa.me/${storeInfo.whatsapp_number}?text=${encodeURIComponent(text)}`, '_blank');
  }

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // --- Early Returns ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f7f6] gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4a6b5d]"></div>
      <p className="text-gray-500 text-sm font-medium">Memuat katalog toko...</p>
    </div>
  );

  if (errorMsg) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white gap-4 text-center">
      <span className="text-5xl">⚠️</span>
      <p className="text-red-500 font-bold text-lg">Gagal memuat data</p>
      <p className="text-sm text-red-400 bg-red-50 border border-red-200 rounded-xl px-4 py-3 max-w-sm">{errorMsg}</p>
      <button onClick={() => window.location.reload()} className="bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">Coba Lagi</button>
    </div>
  );

  if (!storeInfo) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Data toko tidak ditemukan.</div>
  );

  const isOpen = checkIsOpen(storeInfo.open_time, storeInfo.close_time);

  // --- Main UI ---
  return (
    <div className="min-h-screen bg-[#f4f7f6] pb-36 font-sans">

      {/* ── Header ── */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-extrabold text-gray-900 text-base leading-tight truncate">{storeInfo.nama_toko}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {storeInfo.kategori && (
              <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{storeInfo.kategori}</span>
            )}
            <span className={`text-[10px] font-bold flex items-center gap-1 ${isOpen ? 'text-green-600' : 'text-red-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {isOpen ? 'Buka' : 'Tutup'}
            </span>
          </div>
        </div>

        {cartCount > 0 && (
          <div className="shrink-0 bg-[#4a6b5d] text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {cartCount} item
          </div>
        )}
      </header>

      {/* ── Deskripsi Toko ── */}
      {storeInfo.deskripsi && (
        <div className="mx-4 mt-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-600 leading-relaxed">{storeInfo.deskripsi}</p>
        </div>
      )}

      {/* ── Katalog Produk ── */}
      <section className="mt-5 px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold text-gray-900">Menu & Produk</h2>
          <span className="text-xs text-gray-400">{products.length} tersedia</span>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => {
              const qty = getQty(product.id);
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  {/* Icon / Foto */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-28 flex items-center justify-center text-4xl">
                    {getCategoryIcon(product.category)}
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{product.category}</span>
                    <h3 className="font-bold text-gray-800 text-sm leading-tight mt-0.5 mb-2 line-clamp-2 flex-1">{product.name}</h3>

                    <div>
                      <p className="font-extrabold text-[#4a6b5d] text-sm mb-2">
                        Rp {(product.selling_price ?? 0).toLocaleString('id-ID')}
                      </p>

                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full bg-[#4a6b5d] hover:bg-[#3a5448] text-white text-xs font-bold py-2 rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-1"
                        >
                          <span className="text-base leading-none">+</span> Tambah
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-[#4a6b5d]/10 rounded-lg p-0.5">
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="w-8 h-8 bg-white shadow-sm rounded-md flex items-center justify-center text-[#4a6b5d] font-bold text-lg hover:bg-gray-50 transition-colors active:scale-95"
                          >
                            −
                          </button>
                          <span className="font-extrabold text-[#4a6b5d] text-sm min-w-[1.5rem] text-center">{qty}</span>
                          <button
                            onClick={() => addToCart(product)}
                            className="w-8 h-8 bg-[#4a6b5d] rounded-md flex items-center justify-center text-white font-bold text-lg hover:bg-[#3a5448] transition-colors active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-5xl mb-3">🛒</span>
            <p className="font-medium">Belum ada produk tersedia</p>
            <p className="text-xs mt-1">Cek lagi nanti ya!</p>
          </div>
        )}
      </section>

      {/* ── Floating Cart Bar ── */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50">
          {/* Ringkasan item */}
          <div className="mb-3 max-h-24 overflow-y-auto space-y-0.5">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-xs text-gray-500">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-semibold text-gray-700">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400 font-medium">{cartCount} item dipilih</p>
              <p className="text-lg font-extrabold text-gray-900">Rp {cartTotal.toLocaleString('id-ID')}</p>
            </div>
            <button
              onClick={handleCheckoutWA}
              disabled={!storeInfo.whatsapp_number}
              className="bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-40 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all text-sm"
            >
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.711.927 2.871.927 3.182 0 5.768-2.585 5.769-5.766.001-3.181-2.587-5.769-5.771-5.769zm4.213 8.574c-.231-.115-1.365-.674-1.576-.752-.211-.077-.365-.115-.52.115-.154.23-.596.752-.731.905-.135.154-.269.173-.5.058-.231-.115-.975-.36-1.859-1.15-.688-.616-1.152-1.378-1.287-1.609-.135-.231-.014-.356.102-.472.104-.103.231-.269.346-.404.115-.135.154-.23.231-.384.077-.154.038-.288-.019-.404-.058-.115-.52-1.254-.712-1.716-.188-.453-.377-.392-.52-.399-.134-.006-.288-.008-.442-.008-.154 0-.404.058-.615.288-.211.23-.808.79-.808 1.925 0 1.135.827 2.233.942 2.387.115.154 1.627 2.483 3.942 3.483 2.146.927 2.766.75 3.266.69.5-.06 1.365-.558 1.558-1.096.192-.539.192-.998.134-1.095-.058-.098-.212-.155-.443-.271z"/>
              </svg>
              Pesan (WA) 💬
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

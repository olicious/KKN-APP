'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

type Product = {
  id: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  stock: number;
};

export default function ManajemenProduk({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [namaProduk, setNamaProduk] = useState('');
  const [kategori, setKategori] = useState('');
  const [hargaModal, setHargaModal] = useState('');
  const [hargaJual, setHargaJual] = useState('');
  const [stok, setStok] = useState('');

  async function fetchProducts() {
    setLoading(true);
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
        setLoading(false);
        return;
    }
    
    // 1. Dapatkan ID Toko (store_id) yang sebenarnya berdasarkan owner_id
    const { data: storeData } = await supabase
      .from('umkm_stores')
      .select('id')
      .eq('owner_id', authData.user.id)
      .single();

    if (!storeData?.id) {
        setLoading(false);
        return;
    }
    const currentStoreId = storeData.id;

    // 2. Gunakan ID Toko tersebut untuk mengambil produk
    const { data, error } = await supabase
      .from('umkm_products')
      .select('*')
      .eq('store_id', currentStoreId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
        alert("Sesi tidak valid, tidak dapat menyimpan produk.");
        setSaving(false);
        return;
    }
    
    // 1. Dapatkan ID Toko (store_id) yang sebenarnya dari tabel umkm_stores
    const { data: storeData, error: storeError } = await supabase
      .from('umkm_stores')
      .select('id')
      .eq('owner_id', authData.user.id)
      .single();

    if (storeError || !storeData?.id) {
      alert("Gagal menemukan profil toko Anda. Pastikan Anda sudah melengkapi profil toko (Onboarding).");
      setSaving(false);
      return;
    }
    const currentStoreId = storeData.id;

    // 2. Insert menggunakan ID Toko yang benar
    const { error: insertError } = await supabase
      .from('umkm_products')
      .insert({
        store_id: currentStoreId,
        name: namaProduk,
        category: kategori,
        cost_price: parseFloat(hargaModal),
        selling_price: parseFloat(hargaJual),
        stock: parseInt(stok)
      });

    if (insertError) {
      alert("Gagal menambahkan produk: " + insertError.message);
    } else {
      setNamaProduk('');
      setKategori('');
      setHargaModal('');
      setHargaJual('');
      setStok('');
      fetchProducts();
    }
    setSaving(false);
  }

  function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Produk</h2>
        <p className="text-gray-500 text-sm mt-1">Kelola daftar produk, harga modal, harga jual, dan stok Anda secara real-time.</p>
      </header>

      {/* Form Tambah Produk */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-[#e8dacd]">
        <h3 className="text-lg font-bold text-[#4a6b5d] mb-4">Tambah Produk Baru</h3>
        <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="text-sm font-medium text-[#6b5c51] col-span-1 md:col-span-2 lg:col-span-1">
            Nama Produk
            <input
              type="text"
              required
              value={namaProduk}
              onChange={(e) => setNamaProduk(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
              placeholder="Contoh: Kopi Gula Aren"
            />
          </label>
          
          <label className="text-sm font-medium text-[#6b5c51]">
            Kategori
            <input
              type="text"
              required
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
              placeholder="Contoh: Minuman"
            />
          </label>
          
          <label className="text-sm font-medium text-[#6b5c51]">
            Stok Awal
            <input
              type="number"
              min="0"
              required
              value={stok}
              onChange={(e) => setStok(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
              placeholder="Contoh: 50"
            />
          </label>

          <label className="text-sm font-medium text-[#6b5c51]">
            Harga Modal (Rp)
            <input
              type="number"
              min="0"
              required
              value={hargaModal}
              onChange={(e) => setHargaModal(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
              placeholder="Contoh: 10000"
            />
          </label>

          <label className="text-sm font-medium text-[#6b5c51]">
            Harga Jual (Rp)
            <input
              type="number"
              min="0"
              required
              value={hargaJual}
              onChange={(e) => setHargaJual(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
              placeholder="Contoh: 15000"
            />
          </label>

          <div className="flex items-end lg:col-span-1 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-[#4a6b5d] text-white px-4 py-2 text-sm font-medium hover:bg-[#3a5448] transition-colors disabled:opacity-50 h-[38px]"
            >
              {saving ? "Menyimpan..." : "Simpan Produk"}
            </button>
          </div>
        </form>
      </section>

      {/* Tabel Produk */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-[#e8dacd]">
        <h3 className="text-lg font-bold text-[#4a6b5d] mb-4">Daftar Produk</h3>
        {loading ? (
          <div className="py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4a6b5d]"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-[#f4f1e8] text-[#6b5c51] uppercase text-xs border-b border-[#e8dacd]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama Produk</th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold">Harga Modal</th>
                  <th className="px-4 py-3 font-semibold">Harga Jual</th>
                  <th className="px-4 py-3 font-semibold text-center">Stok</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">{formatRupiah(product.cost_price)}</td>
                    <td className="px-4 py-3 text-[#4a6b5d] font-medium">{formatRupiah(product.selling_price)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            Belum ada produk. Silakan tambahkan produk pertama Anda!
          </div>
        )}
      </section>
    </div>
  );
}

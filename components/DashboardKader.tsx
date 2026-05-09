'use client';

import { supabase } from '@/utils/supabase/client';
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { 
  BuildingStorefrontIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon,
  CheckBadgeIcon,
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon 
} from "@heroicons/react/24/outline";

type Store = {
  id: string;
  nama_toko: string;
  kategori: string | null;
  open_time: string | null;
  close_time: string | null;
};

type DashboardKaderProps = {
  user: User;
  searchParams?: {
    message?: string;
    error?: string;
  };
};

export default function DashboardKader({ user, searchParams }: DashboardKaderProps) {
  const params = searchParams;
  const [stores, setStores] = useState<Store[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);

  useEffect(() => {
    async function init() {
      const [storesRes, productsRes, transactionsRes] = await Promise.all([
        supabase.from('umkm_stores').select('id, nama_toko, kategori, open_time, close_time'),
        supabase.from('umkm_products').select('id', { count: 'exact', head: true }),
        supabase.from('umkm_transactions').select('id', { count: 'exact', head: true }),
      ]);

      if (storesRes.data) setStores(storesRes.data as Store[]);
      if (productsRes.count !== null) setTotalProducts(productsRes.count);
      if (transactionsRes.count !== null) setTotalTransactions(transactionsRes.count);
    }
    init();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-emerald-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-800 p-2 rounded-lg shadow-sm">
                <BuildingStorefrontIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-emerald-950">Desa Teras</h1>
                <p className="text-xs text-emerald-700 font-medium tracking-wide">PORTAL KADER</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-emerald-900">Halo, Kader Desa!</p>
                <p className="text-xs text-emerald-600">{user.email}</p>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 shadow-sm"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {params?.message && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-3 shadow-sm">
            <CheckBadgeIcon className="h-5 w-5 text-emerald-600" />
            {params.message}
          </div>
        )}

        {params?.error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
            {params.error}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-emerald-950">Ringkasan Desa</h2>
          <p className="text-slate-500 text-sm mt-1">Pantau perkembangan UMKM dan ekonomi Desa Teras.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BuildingStorefrontIcon className="h-32 w-32 text-emerald-900" />
            </div>
            <div className="flex items-center gap-4 relative">
              <div className="bg-emerald-100 p-3 rounded-xl text-emerald-800">
                <BuildingStorefrontIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Total UMKM Terdaftar</p>
                <p className="text-3xl font-bold text-emerald-950">{stores.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShoppingBagIcon className="h-32 w-32 text-orange-900" />
            </div>
            <div className="flex items-center gap-4 relative">
              <div className="bg-orange-100 p-3 rounded-xl text-orange-700">
                <ShoppingBagIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Total Produk</p>
                <p className="text-3xl font-bold text-emerald-950">{totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CurrencyDollarIcon className="h-32 w-32 text-emerald-900" />
            </div>
            <div className="flex items-center gap-4 relative">
              <div className="bg-emerald-100 p-3 rounded-xl text-emerald-800">
                <CurrencyDollarIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Total Transaksi Desa</p>
                <p className="text-3xl font-bold text-emerald-950">{totalTransactions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* UMKM Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-emerald-100 flex justify-between items-center bg-emerald-50/50">
            <div>
              <h3 className="text-lg font-semibold text-emerald-950">Daftar UMKM Desa Teras</h3>
              <p className="text-sm text-emerald-600 mt-1">Daftar lengkap pelaku usaha yang telah bergabung.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-emerald-100 text-sm">
                  <th className="px-6 py-4 font-semibold text-emerald-900">Nama Usaha</th>
                  <th className="px-6 py-4 font-semibold text-emerald-900">Pemilik</th>
                  <th className="px-6 py-4 font-semibold text-emerald-900">Kategori</th>
                  <th className="px-6 py-4 font-semibold text-emerald-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      Belum ada UMKM yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => (
                    <tr key={store.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-emerald-950">{store.nama_toko || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">Warga Desa</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{store.kategori || 'Umum'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

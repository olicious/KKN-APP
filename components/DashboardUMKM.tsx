import { useEffect, useState } from "react";
import { addProduct, addTransaction } from "@/app/dashboard/actions";
import { AIEvaluationPanel } from "@/app/dashboard/ai-evaluation-panel";
import ManajemenProduk from "./ManajemenProduk";
import KasirUMKM from "./KasirUMKM";
import BukuKasUMKM from "./BukuKasUMKM";
import PengaturanUMKM from "./PengaturanUMKM";
import { User } from "@supabase/supabase-js";
import { supabase } from '@/utils/supabase/client';

type UmkmStoreProfile = {
  id: string;
  owner_id: string;
  nama_toko: string;
  kategori: "Kuliner" | "Kriya" | "Jasa" | "Retail";
  deskripsi: string | null;
  alamat: string | null;
  whatsapp_number?: string | null;
};

type DashboardUMKMProps = {
  user: User;
  searchParams?: {
    message?: string;
    error?: string;
    productMessage?: string;
    productError?: string;
    transactionMessage?: string;
    transactionError?: string;
  };
};

type Product = {
  id: string;
  nama_produk: string;
  harga: number;
  stok: number;
};

type Transaction = {
  id: string;
  tipe: "Pemasukan" | "Pengeluaran";
  jumlah: number;
  keterangan: string | null;
  tanggal: string;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardUMKM({ user, searchParams }: DashboardUMKMProps) {
  const params = searchParams;

  const [storeProfile, setStoreProfile] = useState<UmkmStoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Pick<Transaction, "tipe" | "jumlah">[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, productsSold: 0 });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);



  useEffect(() => {
    async function fetchDashboardStats(storeId: string) {
      const { data: txData, error: txError } = await supabase
        .from('umkm_transactions')
        .select('id, total_amount, created_at')
        .eq('store_id', storeId);

      if (txError || !txData) return;

      const ordersCount = txData.length;
      const totalRevenue = txData.reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0);

      // Sales Chart Logic (Last 7 Days)
      const chartDataMap = new Map();
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('id-ID', { weekday: 'short' });
        const dateStr = d.toISOString().split('T')[0];
        chartDataMap.set(dateStr, { day: dayStr, value: 0 });
      }

      txData.forEach((tx) => {
        if (tx.created_at) {
          const dateStr = tx.created_at.split('T')[0];
          if (chartDataMap.has(dateStr)) {
            const current = chartDataMap.get(dateStr);
            current.value += (Number(tx.total_amount) || 0);
          }
        }
      });

      const chartValues = Array.from(chartDataMap.values());
      const maxSales = Math.max(...chartValues.map(c => c.value));
      
      const normalizedChartData = chartValues.map(c => {
        const percentage = maxSales > 0 ? Math.round((c.value / maxSales) * 100) : 0;
        return {
          day: c.day,
          value: percentage, // This represents height %
          rawValue: c.value
        };
      });
      setSalesChart(normalizedChartData);

      // Top Products Logic
      const txIds = txData.map(tx => tx.id);
      let totalProductsSold = 0;
      let topItems: any[] = [];
      
      if (txIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('umkm_transaction_items')
          .select('quantity, product_id')
          .in('transaction_id', txIds);

        if (!itemsError && itemsData) {
          totalProductsSold = itemsData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
          
          const productCountMap = new Map<string, number>();
          itemsData.forEach(item => {
            if (!item.product_id) return;
            const current = productCountMap.get(item.product_id) || 0;
            productCountMap.set(item.product_id, current + Number(item.quantity));
          });
          
          const sortedProductIds = Array.from(productCountMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
            
          if (sortedProductIds.length > 0) {
            const { data: productsData } = await supabase
              .from('umkm_products')
              .select('id, name')
              .in('id', sortedProductIds.map(p => p[0]));
              
            if (productsData) {
              topItems = sortedProductIds.map(([id, sold], idx) => {
                const prod = productsData.find(p => p.id === id);
                return {
                  id: idx + 1,
                  name: prod ? prod.name : 'Produk Tidak Ditemukan',
                  sold
                };
              });
            }
          }
        }
      }
      
      setTopProducts(topItems);

      setStats({
        revenue: totalRevenue,
        orders: ordersCount,
        productsSold: totalProductsSold
      });
    }

    async function loadAll() {
      setLoading(true);
      const { data: profile } = await supabase
        .from("umkm_stores")
        .select("id, owner_id, nama_toko, kategori, deskripsi, alamat")
        .eq("owner_id", user.id)
        .maybeSingle<UmkmStoreProfile>();

      if (profile) {
        setStoreProfile(profile);

        const [productsRes, allTxRes, recentTxRes] = await Promise.all([
          supabase
            .from("products")
            .select("id, nama_produk, harga, stok")
            .eq("store_id", profile.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("transactions")
            .select("tipe, jumlah")
            .eq("store_id", profile.id),
          supabase
            .from("transactions")
            .select("id, tipe, jumlah, keterangan, tanggal")
            .eq("store_id", profile.id)
            .order("tanggal", { ascending: false })
            .limit(10),
        ]);

        if (productsRes.data) setProducts(productsRes.data);
        if (allTxRes.data) setTransactions(allTxRes.data);
        if (recentTxRes.data) setRecentTransactions(recentTxRes.data);

        await fetchDashboardStats(profile.id);
      }

      setLoading(false);
    }

    loadAll();
  }, [user.id]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f4f1e8]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4a6b5d] mb-4"></div>
        <p className="text-[#6b5c51] font-medium ml-4">Memuat Dashboard UMKM...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f4f1e8] font-sans relative overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="bg-black/50 fixed inset-0 z-40 lg:hidden"
        ></div>
      )}

      {/* Sidebar Layout */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col justify-between border-r border-[#e8dacd]`}>
        <div>
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-[#4a6b5d]">Desa Teras</h1>
            <p className="text-xs text-[#6b5c51] mt-1 font-bold tracking-widest uppercase">Portal UMKM</p>
          </div>
          <nav className="p-4 flex flex-col gap-2">
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[#4a6b5d] text-white shadow-md font-semibold' : 'text-gray-600 hover:bg-[#f4f1e8] hover:text-[#4a6b5d] font-medium'}`}
            >
              <span className="text-lg">📊</span> Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab('produk'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'produk' ? 'bg-[#4a6b5d] text-white shadow-md font-semibold' : 'text-gray-600 hover:bg-[#f4f1e8] hover:text-[#4a6b5d] font-medium'}`}
            >
              <span className="text-lg">📦</span> Manajemen Produk
            </button>
            <button 
              onClick={() => { setActiveTab('kasir'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'kasir' ? 'bg-[#4a6b5d] text-white shadow-md font-semibold' : 'text-gray-600 hover:bg-[#f4f1e8] hover:text-[#4a6b5d] font-medium'}`}
            >
              <span className="text-lg">💰</span> Kasir
            </button>
            <button 
              onClick={() => { setActiveTab('buku_kas'); setIsMobileMenuOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'buku_kas' ? 'bg-[#4a6b5d] text-white shadow-md font-semibold' : 'text-gray-600 hover:bg-[#f4f1e8] hover:text-[#4a6b5d] font-medium'}`}
            >
              <span className="text-lg">📒</span> Buku Kas
            </button>
            <button 
              onClick={() => { setActiveTab('pengaturan'); setIsMobileMenuOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'pengaturan' ? 'bg-[#4a6b5d] text-white shadow-md font-semibold' : 'text-gray-600 hover:bg-[#f4f1e8] hover:text-[#4a6b5d] font-medium'}`}
            >
              <span className="text-lg">⚙️</span> Pengaturan
            </button>
          </nav>
        </div>
        <div className="border-t border-[#e8dacd] bg-[#fcfaf5] p-4 mt-auto">
          <div className="mb-4 px-2">
            <p className="text-sm font-bold text-gray-900 truncate">{storeProfile?.nama_toko || "Usaha Saya"}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#b05e45] text-white rounded-xl hover:bg-[#8f4b36] transition-colors font-medium text-sm shadow-sm"
          >
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Mobile Header */}
        <div className="flex lg:hidden items-center justify-between bg-[#4a6b5d] p-4 shadow-md z-30 flex-shrink-0">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white">Desa Teras</h1>
            <span className="text-[10px] tracking-widest text-[#e8dacd] uppercase font-semibold">Portal UMKM</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-2 text-white hover:bg-[#3a5448] rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        
        {activeTab === 'dashboard' ? (
          <>
            {/* Banner Sapaan */}
            <div className="mb-8 bg-gradient-to-r from-[#e8f0ec] to-white p-6 md:p-8 rounded-2xl border border-[#d1e0d7] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#2d4037]">
                  Halo, <span className="text-[#4a6b5d] capitalize">{storeProfile?.nama_toko || "Juragan"}</span>! 👋
                </h1>
                <p className="text-gray-600 mt-2 font-medium">
                  Semoga dagangan hari ini laris manis. Yuk pantau perkembangan usahamu!
                </p>
              </div>
              
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-auto">
                  <input 
                    type="text" 
                    placeholder="Cari transaksi atau produk..." 
                    className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4a6b5d] focus:ring-1 focus:ring-[#4a6b5d] w-full sm:w-64 bg-white text-gray-900 shadow-sm"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
                </div>
                <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors whitespace-nowrap">
                  Filter: Hari Ini ▾
                </button>
              </div>
            </div>

        {/* Notifikasi Global (jika ada pesan dari Server Action) */}
        {params?.message ? (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {params.message}
          </div>
        ) : null}

        {/* Stats Cards (3 Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-[#e8dacd] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="flex justify-between items-start w-full">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Pendapatan</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{formatRupiah(stats.revenue)}</h3>
              </div>
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-sm font-bold mt-4 w-fit">
              ↑ 12% <span className="text-emerald-600/70 text-xs ml-1 font-medium">dari bulan lalu</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-[#e8dacd] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="flex justify-between items-start w-full">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pesanan Selesai</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{stats.orders}</h3>
              </div>
              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-sm font-bold mt-4 w-fit">
              ↑ 8% <span className="text-emerald-600/70 text-xs ml-1 font-medium">dari bulan lalu</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-[#e8dacd] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="flex justify-between items-start w-full">
              <div>
                <p className="text-gray-500 text-sm font-medium">Produk Terjual</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{stats.productsSold}</h3>
              </div>
              <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-sm font-bold mt-4 w-fit">
              ↓ 3% <span className="text-red-600/70 text-xs ml-1 font-medium">dari bulan lalu</span>
            </div>
          </div>
          
        </div>

        {/* Bottom Area (3 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Top Products - 1 Span */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-[#e8dacd] col-span-1 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Produk Terlaris</h3>
            <div className="flex flex-col gap-4 flex-1">
              {topProducts.length > 0 ? topProducts.map((prod, idx) => (
                <div key={prod.id} className="flex items-center gap-4 p-3 hover:bg-[#f4f1e8] rounded-xl transition-colors border border-transparent hover:border-[#e8dacd]">
                  <div className="w-12 h-12 rounded-xl bg-[#e8f0eb] text-[#4a6b5d] flex items-center justify-center font-bold text-lg shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{prod.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{prod.sold} terjual minggu ini</p>
                  </div>
                </div>
              )) : (
                <div className="flex justify-center items-center h-full text-gray-500 text-sm text-center">
                  Belum ada data penjualan
                </div>
              )}
            </div>
            <button className="w-full mt-6 py-2.5 text-sm font-medium text-[#4a6b5d] border border-[#4a6b5d] rounded-xl hover:bg-[#4a6b5d] hover:text-white transition-colors">
              Lihat Katalog Produk
            </button>
          </div>

          {/* Sales Chart - 2 Spans */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-[#e8dacd] col-span-1 lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Grafik Penjualan</h3>
                <p className="text-sm text-gray-500">Pendapatan kotor 7 hari terakhir</p>
              </div>
              <button className="text-xs font-medium text-[#4a6b5d] bg-[#e8f0eb] px-3 py-1.5 rounded-lg">
                Laporan Lengkap
              </button>
            </div>
            
            {/* CSS Bar Chart Implementation */}
            <div className="flex-1 flex items-end justify-between gap-4 px-2 mt-2 pt-8">
              {salesChart.map((data, i) => (
                <div key={i} className="flex flex-col items-center gap-3 flex-1 group" onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}>
                  <div className={`w-full rounded-t-lg relative h-48 flex items-end justify-center transition-colors cursor-pointer ${activeTooltip === i ? 'bg-[#e8dacd]' : 'bg-[#f4f1e8] lg:group-hover:bg-[#e8dacd]'}`}>
                    {/* Bar Fill */}
                    <div 
                      className={`w-3/4 rounded-t-lg transition-all duration-500 ease-in-out ${activeTooltip === i ? 'bg-[#3a5448]' : 'bg-[#4a6b5d] lg:group-hover:bg-[#3a5448]'}`}
                      style={{ height: `${data.value}%` }}
                    ></div>
                    {/* Tooltip on Hover / Click */}
                    <div className={`absolute -top-10 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg transition-opacity whitespace-nowrap shadow-md z-10 pointer-events-none ${activeTooltip === i ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'}`}>
                      {formatRupiah(data.rawValue)}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{data.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Evaluation - Fitur Unggulan */}
        <div className="mt-8">
           <AIEvaluationPanel stats={stats} />
        </div>
          </>
        ) : activeTab === 'produk' ? (
          <ManajemenProduk user={user} />
        ) : activeTab === 'kasir' ? (
          <KasirUMKM />
        ) : activeTab === 'buku_kas' ? (
          <BukuKasUMKM user={user} />
        ) : activeTab === 'pengaturan' ? (
          <PengaturanUMKM user={user} storeProfile={storeProfile} />
        ) : null}

        </main>
      </div>
    </div>
  );
}

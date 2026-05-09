'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Store = {
  id: string;
  nama_toko: string;
  kategori: string | null;
  open_time: string | null;
  close_time: string | null;
};

/* ─────────────────────────────────────────────
   Helper: format jam operasional
───────────────────────────────────────────── */
function formatJam(open: string | null, close: string | null) {
  if (!open && !close) return '—';
  if (open && close) return `${open} – ${close}`;
  return open ?? close ?? '—';
}

/* ─────────────────────────────────────────────
   Fallback UI: Akses Terkunci
───────────────────────────────────────────── */
function AksesTerkunci() {
  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-emerald-800 mb-2">Akses Terkunci</h2>
        <p className="text-gray-600 mb-6">
          Anda harus masuk sebagai Kader / Perangkat Desa untuk mengakses halaman ini.
        </p>
        <a
          href="/auth/login"
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors inline-block w-full"
        >
          Ke Halaman Masuk
        </a>
        <a href="/" className="mt-4 text-emerald-600 text-sm font-medium hover:underline inline-block w-full">
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function DashboardKaderPage() {
  const router = useRouter();

  const [sessionError, setSessionError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);

  useEffect(() => {
    async function init() {
      /* 1. Cek sesi */
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth/login');
        setSessionError(true);
        setLoading(false);
        return;
      }

      /* 2. Fetch data toko, produk, & transaksi secara paralel */
      const [storesRes, productsRes, transactionsRes] = await Promise.all([
        supabase.from('umkm_stores').select('id, nama_toko, kategori, open_time, close_time'),
        supabase.from('umkm_products').select('id', { count: 'exact', head: true }),
        supabase.from('umkm_transactions').select('id', { count: 'exact', head: true }),
      ]);

      if (storesRes.data) setStores(storesRes.data as Store[]);
      if (productsRes.count !== null) setTotalProducts(productsRes.count);
      if (transactionsRes.count !== null) setTotalTransactions(transactionsRes.count);

      setLoading(false);
    }

    init();
  }, [router]);

  /* ── Guard: sesi kosong ── */
  if (sessionError) return <AksesTerkunci />;

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600" />
        <p className="text-emerald-800 font-medium">Memuat data desa…</p>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ════════════════════════════════════════
          HEADER
      ════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
            Perangkat Desa Teras
          </p>
          <h1 className="text-xl font-extrabold text-emerald-800 leading-tight">
            Dasbor Kader &amp; Perangkat Desa
          </h1>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace('/');
          }}
          className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-all duration-200"
        >
          <span>🚪</span>
          Keluar
        </button>
      </header>

      {/* ════════════════════════════════════════
          KONTEN UTAMA
      ════════════════════════════════════════ */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

        {/* ── HERO STATS ── */}
        <section>
          <div className="mb-4">
            <h2 className="text-sm uppercase tracking-widest font-bold text-gray-400">
              Ringkasan Potensi Desa
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Kartu 1: Total UMKM */}
            <div className="group relative overflow-hidden bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
              {/* Siluet dekoratif */}
              <svg className="absolute -bottom-4 -right-4 w-32 h-32 text-emerald-400 opacity-20 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
                🏪
              </div>
              <div className="relative z-10">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Total UMKM Terdaftar
                </p>
                <p className="text-4xl font-extrabold text-emerald-700 mt-1">
                  {stores.length}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">unit usaha aktif</p>
              </div>
            </div>

            {/* Kartu 2: Total Produk */}
            <div className="group relative overflow-hidden bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
              {/* Siluet dekoratif */}
              <svg className="absolute -bottom-4 -right-4 w-32 h-32 text-amber-400 opacity-20 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0Zm6 0a1.5 1.5 0 0 0-3 0v.75h3V6Zm-7.5 9a1.5 1.5 0 0 1 3 0H6Zm9 0a1.5 1.5 0 0 1 3 0h-3Z" clipRule="evenodd" />
              </svg>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600">
                📦
              </div>
              <div className="relative z-10">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Total Produk Desa
                </p>
                <p className="text-4xl font-extrabold text-blue-600 mt-1">
                  {totalProducts}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">item terdaftar</p>
              </div>
            </div>

            {/* Kartu 3: Total Transaksi */}
            <div className="group relative overflow-hidden bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
              {/* Siluet dekoratif */}
              <svg className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-400 opacity-20 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16.712 4.33a9.027 9.027 0 0 1 1.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 0 0-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 0 1 0 9.424m-4.138-5.976a3.736 3.736 0 0 0-.88-1.388 3.737 3.737 0 0 0-1.388-.88m2.268 2.268a3.765 3.765 0 0 1 0 2.528m-2.268-4.796a3.765 3.765 0 0 0-2.528 0m4.796 4.796c-.181.506-.475.982-.88 1.388a3.736 3.736 0 0 1-1.388.88m2.268-2.268 4.138 3.448m0 0a9.027 9.027 0 0 1-1.306 1.652c-.51.51-1.064.944-1.652 1.306m0 0-3.448-4.138m3.448 4.138a9.014 9.014 0 0 1-9.424 0m5.976-4.138a3.765 3.765 0 0 1-2.528 0m0 0a3.736 3.736 0 0 1-1.388-.88 3.737 3.737 0 0 1-.88-1.388m2.268 2.268L7.288 19.67m0 0a9.024 9.024 0 0 1-1.652-1.306 9.027 9.027 0 0 1-1.306-1.652m0 0 4.138-3.448M4.33 16.712a9.014 9.014 0 0 1 0-9.424m4.138 5.976a3.765 3.765 0 0 1 0-2.528m0 0c.181-.506.475-.982.88-1.388a3.736 3.736 0 0 1 1.388-.88m-2.268 2.268L4.33 7.288m6.406 1.18L7.288 4.33m0 0a9.024 9.024 0 0 0-1.652 1.306A9.025 9.025 0 0 0 4.33 7.288" />
              </svg>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
                💰
              </div>
              <div className="relative z-10">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Total Transaksi Desa
                </p>
                <p className="text-4xl font-extrabold text-blue-600 mt-1">
                  {totalTransactions}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">transaksi tercatat</p>
              </div>
            </div>

          </div>
        </section>

        {/* ── TABEL UMKM ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              Daftar Potensi UMKM Desa Teras
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
              {stores.length} toko
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-8">#</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Usaha</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pemilik</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Jam Operasional</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <span className="text-3xl block mb-2">🏚️</span>
                      Belum ada UMKM yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  stores.map((store, idx) => (
                    <tr
                      key={store.id}
                      className="hover:bg-emerald-50/40 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4 text-gray-400 text-xs font-medium">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                            {store.nama_toko?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <span className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                            {store.nama_toko || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">Warga Desa</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md">
                          {store.kategori || 'Umum'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                        {formatJam(store.open_time, store.close_time)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {stores.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
                <span className="text-3xl block mb-2">🏚️</span>
                Belum ada UMKM yang terdaftar.
              </div>
            ) : (
              stores.map((store) => (
                <div
                  key={store.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-base font-bold text-emerald-700 shrink-0">
                    {store.nama_toko?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{store.nama_toko || '—'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-md">
                        {store.kategori || 'Umum'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        🕐 {formatJam(store.open_time, store.close_time)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Aktif
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="py-5 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        © 2026 KKN-PPM UGM Teras Selaras · Dasbor Perangkat Desa
      </footer>

    </div>
  );
}

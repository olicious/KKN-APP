import Link from "next/link";
import Image from "next/image";
import { UserGroupIcon, BuildingStorefrontIcon, MapIcon } from "@heroicons/react/24/outline";

export function DashboardHeroPortal() {
  return (
    <div className="bg-gradient-to-b from-emerald-50 to-white min-h-screen flex flex-col">

      {/* ── HERO ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-amber-100 rounded-full blur-3xl opacity-40 translate-x-1/3 pointer-events-none" />

        {/* Wave emoji + judul */}
        <div className="relative z-10 flex flex-col items-center gap-4 max-w-xl">
          <span className="text-5xl animate-bounce">🌾</span>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-emerald-800 leading-tight tracking-tight">
            Bantu UMKM Desa Kita<br />Naik Kelas! 🚀
          </h1>

          <p className="text-gray-600 mt-2 text-base sm:text-lg max-w-md leading-relaxed">
            Pesan jajanan, sembako, dan hasil kriya langsung dari tetangga sendiri dengan mudah.
          </p>

          {/* ── CTA BUTTONS ── */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full sm:w-auto">
            <Link
              href="/katalog"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all duration-200"
            >
              🛒 Mulai Belanja
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 active:scale-95 bg-white font-bold text-lg px-8 py-4 rounded-2xl shadow-sm transition-all duration-200"
            >
              🏪 Masuk Toko
            </Link>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="relative z-10 mt-16 w-full max-w-3xl">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
              Atau masuk sesuai peranmu
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>

        {/* ── ROLE CARDS ── */}
        <div className="relative z-10 mt-8 grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-3">

          {/* Kader */}
          <div className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fcf2ed] transition-transform duration-300 group-hover:-translate-y-1">
              <UserGroupIcon className="h-7 w-7 text-[#b05e45]" />
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-[#4a3f35]">Kader Desa</h3>
            <p className="flex-grow text-center text-xs leading-relaxed text-gray-500">
              Dashboard pantau UMKM, verifikasi usaha warga & rekapitulasi potensi lokal.
            </p>
            <Link
              href="/auth/login?role=kader"
              className="mt-5 w-full rounded-xl bg-[#b05e45] py-3 text-center text-sm font-semibold text-white hover:bg-[#8f4b36] transition-colors"
            >
              Masuk
            </Link>
          </div>

          {/* UMKM */}
          <div className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf0ec] transition-transform duration-300 group-hover:-translate-y-1">
              <BuildingStorefrontIcon className="h-7 w-7 text-[#4a6b5d]" />
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-[#4a3f35]">Pelaku UMKM</h3>
            <p className="flex-grow text-center text-xs leading-relaxed text-gray-500">
              Kelola etalase digital, fitur AI jualan unggul & branding lokal produkmu.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/auth/login?role=umkm"
                className="w-full rounded-xl bg-[#4a6b5d] py-3 text-center text-sm font-semibold text-white hover:bg-[#385348] transition-colors"
              >
                Kelola Bisnis
              </Link>
              <Link
                href="/auth/register?role=umkm"
                className="text-center text-xs font-medium text-[#4a6b5d] hover:underline"
              >
                Daftarkan UMKM Baru
              </Link>
            </div>
          </div>

          {/* Warga */}
          <div className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5ece1] transition-transform duration-300 group-hover:-translate-y-1">
              <MapIcon className="h-7 w-7 text-[#a67c52]" />
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-[#4a3f35]">Warga &amp; Publik</h3>
            <p className="flex-grow text-center text-xs leading-relaxed text-gray-500">
              Akses bebas tanpa login. Jelajahi katalog produk &amp; dukung ekonomi lokal.
            </p>
            <Link
              href="/katalog"
              className="mt-5 block w-full rounded-xl bg-[#a67c52] py-3 text-center text-sm font-semibold text-white hover:bg-[#866341] transition-colors"
            >
              Lihat Katalog UMKM
            </Link>
          </div>
        </div>
      </main>

      {/* ── FOOTER KKN ── */}
      <footer className="mt-auto">
        <div className="text-center text-sm text-gray-500 pb-6">
          <img src="/img_6054.jpg" alt="Logo KKN" className="h-10 w-auto rounded-md mx-auto mb-2" />
          <p>© 2026 KKN-PPM UGM Teras Selaras - Pemberdayaan Ekonomi Desa Teras.</p>
        </div>
      </footer>

    </div>
  );
}

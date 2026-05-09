'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const checkIsOpen = (openTime: string, closeTime: string) => {
  if (!openTime || !closeTime) return true; // Default buka
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  return currentTime >= openMinutes && currentTime <= closeMinutes;
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function DashboardPelanggan() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const gradients = [
    'from-emerald-400 to-teal-500',
    'from-orange-400 to-red-500',
    'from-blue-400 to-indigo-500',
    'from-pink-400 to-rose-500',
    'from-amber-400 to-orange-500'
  ];

  useEffect(() => {
    async function fetchStores() {
      setLoading(true);
      const { data, error } = await supabase
        .from('umkm_stores')
        .select('*');
      
      if (!error && data) {
        setStores(data);
      }
      setLoading(false);
    }
    
    fetchStores();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Izin ditolak atau error — biarkan userCoords tetap null
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7f6] pb-10">
      {/* 1. Header & Navigasi (Sticky Top) */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-[#2d4037] font-extrabold text-xl tracking-tight">
            Pujasera Desa Teras
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* 2. Hero Banner (Sapaan Hangat) */}
        <section className="bg-[#4a6b5d] text-white p-6 rounded-2xl mx-4 mt-6 flex flex-col gap-2 shadow-md relative overflow-hidden">
          {/* Dekorasi BG agar lebih menarik */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-[#e8dacd] opacity-20 rounded-full blur-lg"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Halo Tetangga! 👋
            </h2>
            <p className="text-sm text-white/90 font-medium leading-relaxed mt-1">
              Mau jajan apa hari ini? Dukung terus UMKM desa kita.
            </p>
          </div>
        </section>

        {/* 3. Grid Daftar Warung */}
        <section className="mt-8">
          <div className="px-4 mb-4 flex justify-between items-end">
            <h3 className="text-lg font-bold text-gray-900">Daftar Warung & UMKM</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4a6b5d]"></div>
              </div>
            ) : stores.length > 0 ? (
              stores.map((store, index) => {
                const isOpen = checkIsOpen(store.open_time, store.close_time);
                const hasCoords = store.latitude != null && store.longitude != null;
                const distance = (userCoords && hasCoords)
                  ? getDistance(userCoords.lat, userCoords.lng, store.latitude, store.longitude)
                  : null;
                
                return (
                  <div 
                    key={store.id} 
                    onClick={() => router.push(`/katalog/${store.id}`)} 
                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col border border-gray-100"
                  >
                    {/* Bagian Atas: Cover Banner Dinamis */}
                    <div className={`h-24 bg-gradient-to-r ${gradients[index % gradients.length]} relative`}>
                      {/* Mockup Status Buka */}
                      <div className={`absolute top-3 right-3 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm ${isOpen ? 'bg-white/90 text-gray-700' : 'bg-red-50 text-red-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {isOpen ? 'Buka' : 'Tutup'}
                      </div>
                    </div>

                  {/* Bagian Bawah: Konten & Info */}
                  <div className="p-4 relative pb-5">
                     {/* Avatar Melayang (Floating) */}
                     <div className="w-14 h-14 bg-white rounded-full p-1 absolute -top-7 left-4 shadow-md">
                        <div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center text-xl font-extrabold text-gray-700">
                           {store.nama_toko ? store.nama_toko.charAt(0).toUpperCase() : 'U'}
                        </div>
                     </div>

                     {/* Teks Informasi */}
                     <div className="mt-8">
                       <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#4a6b5d] transition-colors truncate">
                         {store.nama_toko}
                       </h3>
                       <div className="flex items-center gap-3 mt-1.5">
                         <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                           {store.kategori || 'UMKM'}
                         </span>
                       </div>
                       <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                         <span>📍</span>
                         <span>
                           {!hasCoords
                             ? 'Lokasi belum disetel'
                             : distance !== null
                             ? `${distance.toFixed(1)} km dari lokasimu`
                             : 'Menghitung jarak...'}
                         </span>
                       </div>
                       <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                         {store.deskripsi || 'Menyediakan berbagai produk pilihan terbaik dari desa kami.'}
                       </p>
                     </div>
                  </div>
                </div>
              );
            })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-10 text-gray-400">
                <span className="text-4xl mb-3">🏪</span>
                <p>Belum ada toko yang terdaftar.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

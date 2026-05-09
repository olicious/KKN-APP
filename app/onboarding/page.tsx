'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  function handleGetLocation() {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      alert("Geolokasi tidak didukung oleh browser Anda.");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationLoading(false);
      },
      (error) => {
        console.error(error);
        alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.");
        setLocationLoading(false);
      }
    );
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        alert("Gagal memverifikasi akun Anda. Silakan login kembali.");
        setLoading(false);
        return;
      }

      const payload = {
        owner_id: user.id,
        nama_toko: formData.get('nama_toko')?.toString().trim(),
        kategori: formData.get('kategori')?.toString(),
        deskripsi: formData.get('deskripsi')?.toString().trim() || null,
        alamat: formData.get('alamat')?.toString().trim() || null,
        latitude: latitude !== null ? latitude : null,
        longitude: longitude !== null ? longitude : null,
      };

      const { error: insertError } = await supabase
        .from('umkm_stores')
        .insert(payload);

      if (insertError) {
        alert("Gagal menyimpan profil: " + insertError.message);
        setLoading(false);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem. Silakan coba lagi.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center p-8 bg-[#fcfaf5] font-sans">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-[#4a6b5d] mb-2">Selamat Datang di Desa Teras!</h1>
        <p className="text-[#6b5c51] mb-6">Sebelum memulai, mari daftarkan profil usaha Anda agar pelanggan dapat mengenal Anda.</p>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <label className="text-sm font-medium text-[#6b5c51]">
            Nama Usaha / Toko
            <input
              name="nama_toko"
              type="text"
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
              placeholder="Contoh: Warung Maju Jaya"
            />
          </label>

          <label className="text-sm font-medium text-[#6b5c51]">
            Kategori
            <select
              name="kategori"
              required
              defaultValue=""
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
            >
              <option value="" disabled>
                Pilih kategori
              </option>
              <option value="Kuliner">Kuliner</option>
              <option value="Kriya">Kriya</option>
              <option value="Jasa">Jasa</option>
              <option value="Retail">Retail</option>
            </select>
          </label>

          <label className="text-sm font-medium text-[#6b5c51]">
            Deskripsi Singkat
            <textarea
              name="deskripsi"
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
              placeholder="Jelaskan secara singkat tentang produk atau jasa Anda"
            />
          </label>

          <label className="text-sm font-medium text-[#6b5c51]">
            Alamat Lengkap
            <textarea
              name="alamat"
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
              placeholder="Alamat lengkap toko atau tempat usaha"
            />
          </label>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-medium text-[#6b5c51]">Titik Lokasi Peta (Opsional/Dianjurkan)</label>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locationLoading}
              className="w-fit rounded-md bg-[#4a6b5d] text-white px-4 py-2 text-sm font-medium hover:bg-[#3a5448] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {locationLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Mencari lokasi...
                </>
              ) : (
                "📍 Deteksi Lokasi Toko Saat Ini"
              )}
            </button>
            {latitude !== null && longitude !== null && (
              <p className="text-xs text-[#4a6b5d] mt-1 font-medium">
                ✅ Lokasi berhasil dikunci: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 rounded-md bg-[#4a6b5d] text-white px-4 py-3 text-sm font-medium hover:bg-[#3a5448] transition-colors disabled:opacity-50"
          >
            {loading ? "Menyimpan Profil..." : "Simpan Profil & Lanjut ke Dasbor"}
          </button>
        </form>
      </div>
    </main>
  );
}

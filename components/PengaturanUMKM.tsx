'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase/client';

export default function PengaturanUMKM({ user, storeProfile }: { user: User, storeProfile: any }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const formData = new FormData(e.currentTarget);
    // Validasi sederhana nomor WA
    const wa = formData.get('whatsapp_number')?.toString() || '';
    if (wa && !wa.startsWith('62')) {
      setMessage('Nomor WhatsApp harus diawali dengan 62 (contoh: 62812...)');
      setLoading(false);
      return;
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Sesi login tidak valid. Silakan muat ulang halaman.');
      }

      const payload = {
        nama_toko: formData.get('nama_toko')?.toString().trim(),
        whatsapp_number: wa,
        kategori: formData.get('kategori')?.toString(),
        deskripsi: formData.get('deskripsi')?.toString().trim() || null,
        alamat: formData.get('alamat')?.toString().trim() || null,
        open_time: formData.get('open_time')?.toString() || null,
        close_time: formData.get('close_time')?.toString() || null
      };

      const { error: updateError } = await supabase
        .from('umkm_stores')
        .update(payload)
        .eq('owner_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setMessage('Pengaturan berhasil disimpan!');
    } catch (err: any) {
      setMessage('Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan Toko</h2>
        <p className="text-gray-500 text-sm mt-1">Perbarui informasi toko dan kontak agar pelanggan mudah menghubungi Anda.</p>
      </header>

      <section className="bg-white p-6 rounded-xl shadow-md border border-[#e8dacd] max-w-2xl">
        {message && (
          <div className={`p-4 mb-4 rounded-md text-sm ${message.includes('Gagal') || message.includes('harus diawali') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-sm font-medium text-[#6b5c51]">
            Nama Usaha / Toko
            <input name="nama_toko" type="text" required defaultValue={storeProfile?.nama_toko} className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]" />
          </label>

          <label className="text-sm font-medium text-[#6b5c51]">
            Nomor WhatsApp
            <input name="whatsapp_number" type="text" placeholder="6281234567890" defaultValue={storeProfile?.whatsapp_number} className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]" />
            <p className="text-xs text-gray-500 mt-1">Gunakan format 62 (bukan 0 atau +62). Contoh: 6281234567890</p>
          </label>

          <label className="text-sm font-medium text-[#6b5c51]">
            Kategori
            <select name="kategori" required defaultValue={storeProfile?.kategori} className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]">
              <option value="Kuliner">Kuliner</option>
              <option value="Kriya">Kriya</option>
              <option value="Jasa">Jasa</option>
              <option value="Retail">Retail</option>
            </select>
          </label>

          <label className="text-sm font-medium text-[#6b5c51]">
            Deskripsi Singkat
            <textarea name="deskripsi" rows={3} defaultValue={storeProfile?.deskripsi} className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"></textarea>
          </label>

          <label className="text-sm font-medium text-[#6b5c51]">
            Alamat Lengkap
            <textarea name="alamat" rows={2} defaultValue={storeProfile?.alamat} className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"></textarea>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium text-[#6b5c51] flex flex-col">
              Jam Buka
              <input name="open_time" type="time" defaultValue={storeProfile?.open_time} className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]" />
            </label>
            <label className="text-sm font-medium text-[#6b5c51] flex flex-col">
              Jam Tutup
              <input name="close_time" type="time" defaultValue={storeProfile?.close_time} className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]" />
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full mt-2 rounded-md bg-[#4a6b5d] text-white px-4 py-3 text-sm font-medium hover:bg-[#3a5448] transition-colors disabled:opacity-50">
            {loading ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </form>
      </section>
    </div>
  );
}

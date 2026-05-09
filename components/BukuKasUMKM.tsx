'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

type CashBookLog = {
  id: string;
  store_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
};

export default function BukuKasUMKM({ user }: { user: User }) {
  const [logs, setLogs] = useState<CashBookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  async function fetchLogs() {
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

    const { data, error } = await supabase
      .from('umkm_cash_book')
      .select('*')
      .eq('store_id', storeData.id)
      .order('transaction_date', { ascending: false });

    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  async function addLog(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
        alert("Sesi tidak valid, tidak dapat menyimpan catatan.");
        setSaving(false);
        return;
    }
    
    const { data: storeData, error: storeError } = await supabase
      .from('umkm_stores')
      .select('id')
      .eq('owner_id', authData.user.id)
      .single();

    if (storeError || !storeData?.id) {
      alert("Gagal menemukan profil toko Anda.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('umkm_cash_book')
      .insert({
        store_id: storeData.id,
        type,
        category,
        amount: parseFloat(amount),
        description,
        transaction_date: transactionDate
      });

    if (insertError) {
      alert("Gagal menambahkan catatan: " + insertError.message);
    } else {
      setType('expense');
      setCategory('');
      setAmount('');
      setDescription('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      fetchLogs();
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
    <div className="flex flex-col gap-8 bg-[#f4f1e8] min-h-full">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Buku Kas</h2>
        <p className="text-gray-500 text-sm mt-1">Catat dan pantau arus kas masuk dan keluar dari usaha Anda.</p>
      </header>

      {/* Form Input */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-[#4a6b5d] mb-4">Catat Transaksi</h3>
        <form onSubmit={addLog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-[#6b5c51] mb-2 block">Jenis Transaksi</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${type === 'expense' ? 'bg-red-50 border-red-200 text-red-700 font-semibold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <input type="radio" name="type" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} className="hidden" />
                <span className="text-lg">📉</span> Pengeluaran
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${type === 'income' ? 'bg-green-50 border-green-200 text-green-700 font-semibold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <input type="radio" name="type" value="income" checked={type === 'income'} onChange={() => setType('income')} className="hidden" />
                <span className="text-lg">📈</span> Pemasukan
              </label>
            </div>
          </div>

          <label className="text-sm font-medium text-[#6b5c51]">
            Tanggal Transaksi
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
            />
          </label>
          
          <label className="text-sm font-medium text-[#6b5c51]">
            Kategori
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
              placeholder={type === 'expense' ? "Contoh: Bahan Baku, Operasional" : "Contoh: Penjualan Harian"}
            />
          </label>

          <label className="text-sm font-medium text-[#6b5c51]">
            Nominal (Rp)
            <input
              type="number"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
              placeholder="Contoh: 50000"
            />
          </label>

          <label className="text-sm font-medium text-[#6b5c51]">
            Keterangan
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a6b5d]/50 focus:border-[#4a6b5d]"
              placeholder="Catatan tambahan (opsional)"
            />
          </label>

          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={saving}
              className={`w-full rounded-md text-white px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {saving ? "Menyimpan..." : "Simpan Catatan"}
            </button>
          </div>
        </form>
      </section>

      {/* Tabel Riwayat */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        <h3 className="text-lg font-bold text-[#4a6b5d] mb-4">Riwayat Buku Kas</h3>
        {loading ? (
          <div className="py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4a6b5d]"></div>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-[#f4f1e8] text-[#6b5c51] uppercase text-xs border-b border-[#e8dacd]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold">Keterangan</th>
                  <th className="px-4 py-3 font-semibold text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(log.transaction_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.category}</td>
                    <td className="px-4 py-3">{log.description || '-'}</td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${log.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {log.type === 'income' ? '+' : '-'} {formatRupiah(log.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            Belum ada catatan transaksi.
          </div>
        )}
      </section>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import DashboardKader from '@/components/DashboardKader';
import DashboardUMKM from '@/components/DashboardUMKM';

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkUserSession() {
      // 1. Cek sesi login di browser (LocalStorage aman terbaca di sini)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth/login');
        setSessionError(true);
        setLoading(false);
        return;
      }

      setUser(session.user);

      // 2. Jika sudah login, ambil peran dari tabel profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('peran')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setRole(profile.peran);
        if (profile.peran === 'umkm') {
          const { data: store } = await supabase
            .from('umkm_stores')
            .select('id')
            .eq('owner_id', session.user.id)
            .maybeSingle();

          if (!store) {
            setNeedsOnboarding(true);
            setLoading(false);
            return;
          }
        }
      } else {
        setRole('unknown');
      }

      console.log('--- DEBUG DASHBOARD ---');
      console.log('Data User:', session.user?.id);
      console.log('Data Peran:', profile?.peran);

      setLoading(false);
    }

    checkUserSession();
  }, [router]);

  useEffect(() => {
    if (needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [needsOnboarding, router]);

  // Tampilkan layar loading saat sistem sedang mengecek LocalStorage
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfaf5] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4a6b5d] mb-4"></div>
        <p className="text-[#6b5c51] font-medium">Menyiapkan Ruang Kerja...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-emerald-800 mb-2">Akses Terkunci</h2>
          <p className="text-gray-600 mb-6">
            Anda harus masuk terlebih dahulu untuk mengakses halaman dasbor dan mengelola bisnis Anda.
          </p>
          <a
            href="/auth/login"
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors inline-block w-full"
          >
            Ke Halaman Masuk
          </a>
          <a
            href="/"
            className="mt-4 text-emerald-600 text-sm font-medium hover:underline inline-block w-full"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-[#fcfaf5] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4a6b5d] mb-4"></div>
        <p className="text-[#6b5c51] font-medium">Mengarahkan ke halaman pendaftaran profil...</p>
      </div>
    );
  }

  // Pengatur lalu lintas rute Dasbor
  if (role === 'kader' && user) return <DashboardKader user={user} />;
  if (role === 'umkm' && user) return <DashboardUMKM user={user} />;

  // Jika role tidak ditemukan / tidak valid
  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-emerald-800 mb-2">Akses Terkunci</h2>
        <p className="text-gray-600 mb-6">
          Anda harus masuk terlebih dahulu untuk mengakses halaman dasbor dan mengelola bisnis Anda.
        </p>
        <a
          href="/auth/login"
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors inline-block w-full"
        >
          Ke Halaman Masuk
        </a>
        <a
          href="/"
          className="mt-4 text-emerald-600 text-sm font-medium hover:underline inline-block w-full"
        >
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}
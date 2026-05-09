"use client";

import { FormEvent, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleLabel = useMemo(() => {
    if (role === "kader") return "Kader Desa";
    if (role === "umkm") return "Pelaku UMKM";
    return "Pengguna";
  }, [role]);

  const title = `Login ${roleLabel}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.refresh();
    router.push('/dashboard');
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fcfaf5] p-6 sm:p-10">
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#e8eedf] opacity-70 blur-3xl" />
      <div className="absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-[#f4e6d4] opacity-70 blur-3xl" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-[#f0e8df] bg-white p-6 shadow-md sm:p-8">
        <p className="text-sm font-medium text-[#b05e45]">Portal Digital Desa Teras</p>
        <h1 className="mt-2 text-2xl font-bold text-[#4a3f35]">{title}</h1>
        <p className="mt-2 text-sm text-[#6b5c51]">
          Masuk menggunakan email dan password untuk melanjutkan ke dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-[#4a3f35]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[#d9d2c8] px-3 py-2 text-zinc-900 outline-none ring-[#4a6b5d] placeholder:text-zinc-400 focus:ring-2"
              placeholder="nama@email.com"
            />
          </label>

          <label className="block text-sm text-[#4a3f35]">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[#d9d2c8] px-3 py-2 text-zinc-900 outline-none ring-[#4a6b5d] placeholder:text-zinc-400 focus:ring-2"
              placeholder="Masukkan password"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#4a6b5d] py-3 font-semibold text-white transition-colors hover:bg-[#385348] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Memproses..." : "Submit"}
          </button>
        </form>

        {role !== "kader" && (
          <p className="mt-4 text-center text-sm text-[#6b5c51]">
            Belum punya akun?{" "}
            <Link
              href={`/auth/register${role ? `?role=${role}` : ""}`}
              className="font-medium text-[#b05e45] hover:underline"
            >
              Daftar di sini
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

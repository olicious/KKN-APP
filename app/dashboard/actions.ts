"use server";

import Groq from "groq-sdk";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type AIEvaluationState = {
  answer: string | null;
  error?: string | null;
};

export async function saveStoreProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  const nama_toko = formData.get("nama_toko")?.toString().trim();
  const kategori = formData.get("kategori")?.toString();
  const deskripsiInput = formData.get("deskripsi")?.toString().trim();
  const alamatInput = formData.get("alamat")?.toString().trim();
  const whatsappNumber = formData.get("whatsapp_number")?.toString().trim();

  const latInput = formData.get("latitude")?.toString();
  const lngInput = formData.get("longitude")?.toString();
  const latitude = latInput ? parseFloat(latInput) : null;
  const longitude = lngInput ? parseFloat(lngInput) : null;

  const allowedKategori = ["Kuliner", "Kriya", "Jasa", "Retail"] as const;
  const isValidKategori = allowedKategori.includes(
    kategori as (typeof allowedKategori)[number],
  );

  if (!nama_toko || !isValidKategori) {
    return { error: "Nama toko dan kategori wajib diisi" };
  }

  const payload = {
    owner_id: user.id,
    nama_toko,
    kategori: kategori as (typeof allowedKategori)[number],
    deskripsi: deskripsiInput || null,
    alamat: alamatInput || null,
    whatsapp_number: whatsappNumber || null,
    latitude: isNaN(latitude as number) ? null : latitude,
    longitude: isNaN(longitude as number) ? null : longitude,
  };

  const { data: existingStore, error: checkError } = await supabase
    .from("umkm_stores")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle<{ id: string }>();

  if (checkError) {
    return { error: checkError.message };
  }

  const { error: saveError } = existingStore
    ? await supabase.from("umkm_stores").update(payload).eq("owner_id", user.id)
    : await supabase.from("umkm_stores").insert(payload);

  if (saveError) {
    return { error: saveError.message };
  }

  return { success: true };
}

export async function addProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nama_produk = formData.get("nama_produk")?.toString().trim();
  const harga = Number(formData.get("harga"));
  const stok = Number(formData.get("stok"));

  if (!nama_produk || !Number.isFinite(harga) || !Number.isFinite(stok)) {
    redirect("/dashboard?productError=Field%20produk%20tidak%20valid");
  }

  if (harga < 0 || stok < 0) {
    redirect("/dashboard?productError=Harga%20dan%20stok%20tidak%20boleh%20negatif");
  }

  const { data: store, error: storeError } = await supabase
    .from("umkm_stores")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle<{ id: string }>();

  if (storeError) {
    redirect(`/dashboard?productError=${encodeURIComponent(storeError.message)}`);
  }

  if (!store) {
    redirect("/dashboard?productError=Simpan%20profil%20toko%20terlebih%20dahulu");
  }

  const { error: insertError } = await supabase.from("products").insert({
    store_id: store.id,
    nama_produk,
    harga,
    stok,
  });

  if (insertError) {
    redirect(`/dashboard?productError=${encodeURIComponent(insertError.message)}`);
  }

  redirect("/dashboard?productMessage=Produk%20berhasil%20ditambahkan");
}

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tipe = formData.get("tipe")?.toString();
  const jumlah = Number(formData.get("jumlah"));
  const keterangan = formData.get("keterangan")?.toString().trim();
  const tanggal = formData.get("tanggal")?.toString();

  const allowedTipe = ["Pemasukan", "Pengeluaran"] as const;
  const isValidTipe = allowedTipe.includes(tipe as (typeof allowedTipe)[number]);

  if (!isValidTipe || !Number.isFinite(jumlah) || jumlah <= 0 || !tanggal) {
    redirect("/dashboard?transactionError=Data%20transaksi%20tidak%20valid");
  }

  const { data: store, error: storeError } = await supabase
    .from("umkm_stores")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle<{ id: string }>();

  if (storeError) {
    redirect(`/dashboard?transactionError=${encodeURIComponent(storeError.message)}`);
  }

  if (!store) {
    redirect("/dashboard?transactionError=Simpan%20profil%20toko%20terlebih%20dahulu");
  }

  const { error: insertError } = await supabase.from("transactions").insert({
    store_id: store.id,
    tipe,
    jumlah,
    keterangan: keterangan || null,
    tanggal,
  });

  if (insertError) {
    redirect(`/dashboard?transactionError=${encodeURIComponent(insertError.message)}`);
  }

  redirect("/dashboard?transactionMessage=Transaksi%20berhasil%20ditambahkan");
}

export async function getAIEvaluation(userId: string, stats?: { revenue: number, orders: number, productsSold: number }): Promise<AIEvaluationState> {
  const supabase = await createClient();

  if (!userId) {
    return {
      answer: null,
      error: "Anda belum login.",
    };
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return {
      answer: null,
      error: "GROQ_API_KEY belum diatur di environment variable.",
    };
  }

  const { data: store, error: storeError } = await supabase
    .from("umkm_stores")
    .select("id, nama_toko, kategori, deskripsi")
    .eq("owner_id", userId)
    .maybeSingle<{
      id: string;
      nama_toko: string;
      kategori: string;
      deskripsi: string | null;
    }>();

  if (storeError) {
    return {
      answer: null,
      error: `Gagal mengambil data toko: ${storeError.message}`,
    };
  }

  if (!store) {
    return {
      answer: null,
      error: "Profil toko belum tersedia.",
    };
  }

  const [{ data: products, error: productsError }, { data: transactions, error: transactionsError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("nama_produk, harga, stok")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("transactions")
        .select("tipe, jumlah, keterangan, tanggal")
        .eq("store_id", store.id)
        .order("tanggal", { ascending: false })
        .limit(60),
    ]);

  if (productsError) {
    return {
      answer: null,
      error: `Gagal mengambil data produk: ${productsError.message}`,
    };
  }

  if (transactionsError) {
    return {
      answer: null,
      error: `Gagal mengambil data transaksi: ${transactionsError.message}`,
    };
  }

  const productsText =
    products && products.length > 0
      ? products
        .map(
          (product, index) =>
            `${index + 1}. ${product.nama_produk} (harga: ${product.harga}, stok: ${product.stok})`,
        )
        .join("\n")
      : "Tidak ada data produk.";

  const transactionsText =
    transactions && transactions.length > 0
      ? transactions
        .map(
          (trx, index) =>
            `${index + 1}. ${trx.tanggal} | ${trx.tipe} | ${trx.jumlah} | ${trx.keterangan ?? "-"}`,
        )
        .join("\n")
      : "Tidak ada data transaksi.";

  const prompt = `Anda adalah konsultan bisnis UMKM profesional. Analisis data hari ini:

Total Pendapatan: Rp ${stats?.revenue ?? 0}

Total Pesanan: ${stats?.orders ?? 0} transaksi

Produk Terjual: ${stats?.productsSold ?? 0} item

Berikan 3 poin evaluasi singkat, tajam, dan dapat ditindaklanjuti berdasarkan angka tersebut. Hindari saran generik seperti 'mulai mencatat'. Pisahkan setiap poin utama dengan enter (\\n) agar mudah di-parsing menjadi array. PENTING: Jangan gunakan markdown format seperti ** atau ### sama sekali, cukup teks biasa.`;

  try {
    const groq = new Groq({ apiKey: groqApiKey });
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const answer = completion.choices[0]?.message?.content?.trim() ?? null;
    if (!answer) {
      return {
        answer: null,
        error: "AI tidak mengembalikan jawaban.",
      };
    }

    return { answer, error: null };
  } catch (error) {
    return {
      answer: null,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat memanggil Groq AI.",
    };
  }
}

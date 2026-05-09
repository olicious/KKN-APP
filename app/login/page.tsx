import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  async function login(formData: FormData) {
    "use server";

    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      redirect("/login?error=Email%20dan%20password%20wajib%20diisi");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/dashboard");
  }

  async function signUp(formData: FormData) {
    "use server";

    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      redirect("/login?error=Email%20dan%20password%20wajib%20diisi");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <h1 className="text-2xl font-semibold">Login Pemilik UMKM</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Masuk dengan email dan password menggunakan Supabase Auth.
      </p>

      {params?.error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}

      {params?.message ? (
        <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {params.message}
        </p>
      ) : null}

      <form className="mt-6 flex flex-col gap-4">
        <label className="text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 p-2"
            placeholder="owner@umkm.com"
          />
        </label>

        <label className="text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 p-2"
            placeholder="minimal 6 karakter"
          />
        </label>

        <div className="mt-2 flex gap-2">
          <button
            formAction={login}
            className="rounded-md border border-zinc-900 px-4 py-2 text-sm"
          >
            Login
          </button>
          <button
            formAction={signUp}
            className="rounded-md border border-zinc-500 px-4 py-2 text-sm"
          >
            Sign Up
          </button>
        </div>
      </form>
    </main>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpRequired, setTotpRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/login")
      .then((res) => res.json())
      .then((data: { totpRequired?: boolean; adminConfigured?: boolean }) => {
        setTotpRequired(Boolean(data.totpRequired));
        if (data.adminConfigured === false) {
          setError("Admin girişi yapılandırılmamış. ADMIN_PASSWORD tanımlayın.");
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        password,
        totpCode: totpCode || undefined,
      }),
    });

    const data = (await res.json()) as {
      error?: string;
      needsTotp?: boolean;
    };

    if (!res.ok) {
      if (data.needsTotp) setTotpRequired(true);
      setError(data.error ?? "Giriş başarısız.");
      setLoading(false);
      return;
    }

    const from = searchParams.get("from") ?? "/admin";
    router.push(from);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c] px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/8 bg-white/[0.02] p-8"
      >
        <p className="text-xs font-medium tracking-[0.25em] text-amber-400 uppercase">
          Admin
        </p>
        <h1 className="mt-2 text-xl font-semibold text-white">Giriş yap</h1>
        <p className="mt-2 text-xs text-zinc-500">
          3D lentiküler poster yönetim paneli
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre"
          required
          autoComplete="current-password"
          className="mt-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
        />

        {(totpRequired || totpCode.length > 0) && (
          <div className="mt-4">
            <label
              htmlFor="totpCode"
              className="text-xs font-medium tracking-[0.18em] text-zinc-500 uppercase"
            >
              Authenticator kodu
            </label>
            <input
              id="totpCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={totpCode}
              onChange={(e) =>
                setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              required={totpRequired}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-white outline-none focus:border-amber-400/40"
            />
            <p className="mt-2 text-[11px] text-zinc-600">
              Google Authenticator veya benzeri uygulamadaki 6 haneli kod.
            </p>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || (totpRequired && totpCode.length !== 6)}
          className="mt-6 w-full rounded-lg bg-amber-400 py-3 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
        >
          {loading ? "Giriş…" : "Giriş Yap"}
        </button>

        <p className="mt-4 text-center text-[11px] leading-5 text-zinc-600">
          İlk kurulumda yalnızca şifre yeterlidir. Giriş yaptıktan sonra{" "}
          <span className="text-zinc-500">Güvenlik</span> sayfasından 2FA
          etkinleştirebilirsiniz.
        </p>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useState } from "react";

type SetupPayload = {
  secret: string;
  uri: string;
  qrDataUrl: string;
};

type TotpSetupProps = {
  onEnabled: () => void;
};

export function TotpSetup({ onEnabled }: TotpSetupProps) {
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startSetup = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/totp", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Kurulum başlatılamadı.");
      setSetup(data as SetupPayload);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!setup) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/totp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: setup.secret, code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Doğrulama başarısız.");
      onEnabled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!setup) {
    return (
      <div className="rounded-[8px] border border-white/10 bg-white/[0.025] p-5">
        <h2 className="text-sm font-semibold text-white">2FA henüz etkin değil</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Google Authenticator, 1Password veya benzeri bir uygulama ile girişe ek doğrulama
          katmanı ekleyin.
        </p>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={startSetup}
          disabled={loading}
          className="mt-4 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
        >
          {loading ? "Hazırlanıyor…" : "2FA Kurulumunu Başlat"}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={confirmSetup}
      className="rounded-[8px] border border-white/10 bg-white/[0.025] p-5"
    >
      <h2 className="text-sm font-semibold text-white">Authenticator uygulamasına ekleyin</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        QR kodu tarayın veya secret anahtarını manuel girin. Ardından uygulamadaki 6 haneli
        kodu yazın.
      </p>

      <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={setup.qrDataUrl}
          alt="2FA QR kodu"
          className="rounded-lg border border-white/10 bg-white p-2"
          width={240}
          height={240}
        />
        <div className="w-full">
          <p className="text-xs font-medium tracking-[0.18em] text-zinc-500 uppercase">
            Secret anahtar
          </p>
          <p className="mt-2 break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-zinc-300">
            {setup.secret}
          </p>
        </div>
      </div>

      <label className="mt-5 block text-xs font-medium tracking-[0.18em] text-zinc-500 uppercase">
        Doğrulama kodu
      </label>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        required
        className="mt-1.5 w-full max-w-xs rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center font-mono text-lg tracking-[0.3em] text-white outline-none focus:border-amber-200/40"
      />

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
        >
          {loading ? "Doğrulanıyor…" : "2FA'yı Etkinleştir"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSetup(null);
            setCode("");
            setError("");
          }}
          className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300"
        >
          İptal
        </button>
      </div>
    </form>
  );
}

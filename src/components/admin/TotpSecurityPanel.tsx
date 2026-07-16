"use client";

import { useState } from "react";
import { TotpSetup } from "@/components/admin/TotpSetup";

type TotpStatus = {
  enabled: boolean;
  source: "env" | "stored" | null;
  enabledAt: string | null;
};

type TotpSecurityPanelProps = {
  initialStatus: TotpStatus;
  lockedByEnv: boolean;
};

export function TotpSecurityPanel({
  initialStatus,
  lockedByEnv,
}: TotpSecurityPanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshStatus = async () => {
    const response = await fetch("/api/admin/totp");
    if (!response.ok) return;
    const data = (await response.json()) as TotpStatus;
    setStatus(data);
    setShowDisableForm(false);
    setDisableCode("");
  };

  const disableTotp = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/totp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "2FA kapatılamadı.");
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (lockedByEnv) {
    return (
      <div className="rounded-[8px] border border-emerald-400/20 bg-emerald-400/10 p-5">
        <p className="text-sm font-semibold text-emerald-100">2FA etkin (ortam değişkeni)</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          <code className="text-zinc-300">ADMIN_TOTP_SECRET</code> tanımlı. Girişte şifre ile
          birlikte authenticator kodu istenir. Secret panelden değiştirilemez; Vercel env
          üzerinden yönetilir.
        </p>
      </div>
    );
  }

  if (status.enabled && status.source === "stored") {
    return (
      <div className="space-y-4">
        <div className="rounded-[8px] border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="text-sm font-semibold text-emerald-100">2FA etkin</p>
          <p className="mt-2 text-sm text-zinc-400">
            Admin girişinde authenticator kodu zorunlu.
            {status.enabledAt && (
              <>
                {" "}
                Etkinleştirme:{" "}
                {new Date(status.enabledAt).toLocaleString("tr-TR")}
              </>
            )}
          </p>
        </div>

        {!showDisableForm ? (
          <button
            type="button"
            onClick={() => {
              setShowDisableForm(true);
              setError("");
            }}
            className="rounded-lg border border-red-400/30 px-4 py-2.5 text-sm text-red-300 hover:bg-red-400/10"
          >
            2FA&apos;yı Kapat
          </button>
        ) : (
          <form
            onSubmit={disableTotp}
            className="rounded-[8px] border border-white/10 bg-white/[0.025] p-5"
          >
            <p className="text-sm font-semibold text-white">2FA&apos;yı kapat</p>
            <p className="mt-2 text-sm text-zinc-500">
              Devam etmek için authenticator uygulamanızdaki güncel 6 haneli kodu girin.
            </p>

            <label
              htmlFor="disableTotpCode"
              className="mt-4 block text-xs font-medium tracking-[0.18em] text-zinc-500 uppercase"
            >
              Doğrulama kodu
            </label>
            <input
              id="disableTotpCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={disableCode}
              onChange={(event) =>
                setDisableCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              required
              autoFocus
              className="mt-1.5 w-full max-w-xs rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center font-mono text-lg tracking-[0.3em] text-white outline-none focus:border-amber-200/40"
            />

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading || disableCode.length !== 6}
                className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm font-medium text-red-200 hover:bg-red-400/20 disabled:opacity-50"
              >
                {loading ? "Doğrulanıyor…" : "2FA'yı Kapat"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDisableForm(false);
                  setDisableCode("");
                  setError("");
                }}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300"
              >
                İptal
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TotpSetup onEnabled={refreshStatus} />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

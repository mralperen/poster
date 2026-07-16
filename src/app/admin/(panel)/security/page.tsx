import { TotpSecurityPanel } from "@/components/admin/TotpSecurityPanel";
import { getTotpStatus, isTotpLockedByEnv } from "@/lib/admin-totp";

export default async function AdminSecurityPage() {
  const status = await getTotpStatus();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Güvenlik</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Admin girişi için iki faktörlü doğrulama (2FA) ayarları.
      </p>

      <div className="mt-8 max-w-2xl">
        <TotpSecurityPanel
          initialStatus={status}
          lockedByEnv={isTotpLockedByEnv()}
        />
      </div>
    </div>
  );
}

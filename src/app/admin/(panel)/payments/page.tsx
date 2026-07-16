import { listPaytrCallbacks } from "@/lib/db/orders-store";
import { isRemoteStorage } from "@/lib/db/storage";
import { getOrderEmailConfigSummary } from "@/lib/order-email";
import { getSiteBaseUrl, isPaytrConfigured } from "@/lib/paytr";

type StatusItem = {
  label: string;
  ok: boolean;
  detail: string;
};

export default async function AdminPaymentsPage() {
  const paytrConfigured = isPaytrConfigured();
  const siteUrl = getSiteBaseUrl();
  const publicUrlConfigured = Boolean(
    siteUrl && !siteUrl.includes("localhost") && !siteUrl.includes("example.com"),
  );
  const testMode = process.env.PAYTR_TEST_MODE === "1";
  const callbacks = await listPaytrCallbacks();
  const blobConfigured = isRemoteStorage();
  const emailConfig = getOrderEmailConfigSummary();

  const items: StatusItem[] = [
    {
      label: "Vercel Blob depolama",
      ok: blobConfigured || !process.env.VERCEL,
      detail: blobConfigured
        ? "Admin kayıtları ve yüklemeler kalıcı depoya yazılıyor."
        : process.env.VERCEL
          ? "Storage → Blob'u projeye bağlayın, sonra vercel --prod ile yeniden deploy edin."
          : "Yerel geliştirmede dosya sistemi kullanılıyor.",
    },
    {
      label: "PayTR mağaza bilgileri",
      ok: paytrConfigured,
      detail: paytrConfigured
        ? `Mağaza no: ${process.env.PAYTR_MERCHANT_ID}`
        : "PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY ve PAYTR_MERCHANT_SALT tanımlayın.",
    },
    {
      label: "Test modu",
      ok: true,
      detail: testMode
        ? "PAYTR_TEST_MODE=1 — test işlemleri açık."
        : "Canlı mod — gerçek tahsilat yapılır.",
    },
    {
      label: "Canlı domain",
      ok: publicUrlConfigured,
      detail: publicUrlConfigured
        ? siteUrl
        : "NEXT_PUBLIC_SITE_URL canlı HTTPS domain olmalı.",
    },
    {
      label: "Sipariş e-postaları",
      ok: emailConfig.configured,
      detail: emailConfig.configured
        ? `Müşteri + admin bildirimi aktif. Gönderen: ${emailConfig.fromEmail}`
        : "RESEND_API_KEY tanımlayın. Ödeme sonrası onay e-postası için gerekli.",
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-white">Ödeme ve PayTR</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kart bilgileri The Posterist tarafında işlenmez. Müşteri PayTR güvenli ödeme
          ekranında ödeme yapar.
        </p>
      </div>

      <div className="mt-8 rounded-[8px] border border-white/10 bg-white/[0.025] p-5">
        <p className="text-xs font-medium tracking-[0.18em] text-amber-300 uppercase">
          Bağlantı durumu
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">
          {paytrConfigured ? "PayTR yapılandırıldı" : "PayTR yapılandırması eksik"}
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.label}
              className="rounded-[8px] border border-white/10 bg-black/20 p-4"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  item.ok
                    ? "bg-emerald-300/10 text-emerald-200"
                    : "bg-amber-300/10 text-amber-200"
                }`}
              >
                {item.ok ? "Hazır" : "Eksik"}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-white">{item.label}</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[8px] border border-white/10 bg-white/[0.025] p-5">
        <h2 className="text-sm font-semibold text-white">Sipariş e-posta ayarları</h2>
        <p className="mt-2 text-xs leading-6 text-zinc-500">
          Ödeme onaylandığında müşteriye ve size otomatik e-posta gider. Vercel ortam
          değişkenlerinden yapılandırılır:
        </p>
        <ul className="mt-3 space-y-1 font-mono text-xs text-zinc-400">
          <li>RESEND_API_KEY — resend.com API anahtarı</li>
          <li>ORDER_FROM_EMAIL — gönderen (ör. siparis@theposterist.com)</li>
          <li>ORDER_NOTIFY_EMAIL — admin bildirimi (varsayılan: destek e-postası)</li>
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          Admin bildirimi: {emailConfig.notifyEmail} ·{" "}
          <a href="/admin/emails" className="text-amber-200 hover:underline">
            E-postalar
          </a>
        </p>
      </div>

      <div className="mt-6 rounded-[8px] border border-amber-200/20 bg-amber-300/10 p-5">
        <h2 className="text-sm font-semibold text-amber-100">
          PayTR panelinde tanımlanacak bildirim URL&apos;si
        </h2>
        <p className="mt-2 break-all font-mono text-xs text-amber-50">
          {publicUrlConfigured
            ? `${siteUrl}/api/paytr/callback`
            : "https://alan-adiniz.com/api/paytr/callback"}
        </p>
        <p className="mt-3 text-xs leading-5 text-zinc-400">
          PayTR Mağaza Paneli → Destek &amp; Kurulum → Ayarlar bölümünde Bildirim URL
          alanına bu adresi girin. Ödeme sonucu bu adrese POST edilir; sipariş durumu
          buradan güncellenir.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-500 uppercase">
          Son PayTR bildirimleri
        </h2>
        <div className="mt-3 space-y-2">
          {callbacks.length === 0 ? (
            <div className="rounded-[8px] border border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-500">
              Henüz bildirim alınmadı.
            </div>
          ) : (
            callbacks.slice(0, 5).map((callback) => (
              <div
                key={callback.id}
                className="rounded-[8px] border border-white/10 bg-white/[0.025] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{callback.status}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      callback.signatureVerified
                        ? "bg-emerald-300/10 text-emerald-200"
                        : "bg-red-300/10 text-red-200"
                    }`}
                  >
                    {callback.signatureVerified ? "İmza geçerli" : "İmza hatalı"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-zinc-600">
                  {callback.merchantOid}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {new Date(callback.receivedAt).toLocaleString("tr-TR")}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

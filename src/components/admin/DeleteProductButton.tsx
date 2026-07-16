"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!confirm(`"${name}" silinsin mi? Bu işlem geri alınamaz.`)) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Ürün silinemedi.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ürün silinemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded px-3 py-1.5 text-xs text-zinc-600 hover:text-red-400 disabled:opacity-50"
      >
        {loading ? "…" : "Sil"}
      </button>
      {error ? <p className="max-w-[140px] text-right text-[10px] text-red-400">{error}</p> : null}
    </div>
  );
}

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

  const handleDelete = async () => {
    if (!confirm(`"${name}" silinsin mi?`)) return;
    setLoading(true);
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded px-3 py-1.5 text-xs text-zinc-600 hover:text-red-400 disabled:opacity-50"
    >
      {loading ? "…" : "Sil"}
    </button>
  );
}

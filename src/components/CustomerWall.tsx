import Image from "next/image";
import Link from "next/link";
import type { CustomerPhoto } from "@/lib/homepage-reviews";
import { isUploadImageSrc } from "@/lib/image-version";

type CustomerWallProps = {
  photos: CustomerPhoto[];
};

function PhotoTile({ photo }: { photo: CustomerPhoto }) {
  return (
    <figure className="group relative aspect-[4/5] overflow-hidden rounded-[10px] border border-white/10 bg-zinc-950">
      <Image
        src={photo.src}
        alt={
          photo.productName
            ? `${photo.authorName} — ${photo.productName}`
            : `${photo.authorName} müşteri fotoğrafı`
        }
        fill
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        unoptimized={isUploadImageSrc(photo.src)}
      />

      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-3 pt-8 pb-2.5">
        <p className="truncate text-xs font-medium text-white">{photo.authorName}</p>
        {photo.productName ? (
          <p className="truncate text-[11px] text-zinc-400">{photo.productName}</p>
        ) : null}
      </figcaption>
    </figure>
  );
}

export function CustomerWall({ photos }: CustomerWallProps) {
  if (photos.length === 0) return null;

  // Az fotoğrafta 4'lü ızgara yarım kalıyor; başlığı yana alıp şeride çeviriyoruz.
  const compact = photos.length < 4;

  const tiles = photos.map((photo) => {
    const wrapperClass = compact
      ? "block w-[9.5rem] shrink-0 sm:w-[11.5rem]"
      : "block";

    return photo.productSlug ? (
      <Link key={photo.id} href={`/product/${photo.productSlug}`} className={wrapperClass}>
        <PhotoTile photo={photo} />
      </Link>
    ) : (
      <div key={photo.id} className={wrapperClass}>
        <PhotoTile photo={photo} />
      </div>
    );
  });

  return (
    <section className="border-t border-white/10 bg-[#0b0b0c] px-4 py-14 sm:px-6 sm:py-16">
      <div
        className={`mx-auto max-w-6xl ${
          compact
            ? "grid gap-7 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-center lg:gap-12"
            : ""
        }`}
      >
        <div
          className={
            compact ? "" : "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
          }
        >
          <div>
            <p className="text-xs font-medium tracking-[0.24em] text-amber-300 uppercase">
              Duvarda nasıl görünüyor?
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Müşterilerimizin paylaştığı kareler
            </h2>
          </div>
          <p
            className={`text-sm leading-6 text-zinc-500 ${compact ? "mt-3 max-w-sm" : ""}`}
          >
            Posterlerin gerçek duvarlardaki hali — hepsi yorumlarla birlikte
            paylaşıldı.
          </p>
        </div>

        <div
          className={
            compact
              ? "-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
              : "mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          }
        >
          {tiles}
        </div>
      </div>
    </section>
  );
}

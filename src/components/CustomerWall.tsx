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
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        unoptimized={isUploadImageSrc(photo.src)}
      />

      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent px-3 pb-2.5 pt-8">
        <p className="truncate text-xs font-medium text-white">
          {photo.authorName}
        </p>
        {photo.productName ? (
          <p className="truncate text-[11px] text-zinc-400">{photo.productName}</p>
        ) : null}
      </figcaption>
    </figure>
  );
}

export function CustomerWall({ photos }: CustomerWallProps) {
  if (photos.length === 0) return null;

  return (
    <section className="border-t border-white/10 bg-[#0b0b0c] px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.24em] text-amber-300 uppercase">
              Duvarda nasıl görünüyor?
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Müşterilerimizin paylaştığı kareler
            </h2>
          </div>
          <p className="text-sm text-zinc-500">
            Fotoğraflar yorumlarla birlikte paylaşıldı.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) =>
            photo.productSlug ? (
              <Link
                key={photo.id}
                href={`/product/${photo.productSlug}`}
                className="block"
              >
                <PhotoTile photo={photo} />
              </Link>
            ) : (
              <div key={photo.id}>
                <PhotoTile photo={photo} />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

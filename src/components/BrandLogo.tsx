import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";

type BrandLogoProps = {
  href?: string;
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "header";
};

const sizeClasses = {
  sm: "h-8 w-auto max-w-[140px]",
  md: "h-10 w-auto max-w-[180px]",
  header:
    "h-10 w-auto max-w-[min(72vw,260px)] sm:h-11 sm:max-w-[300px] md:h-12 md:max-w-[340px]",
};

export function BrandLogo({
  href = "/",
  className = "",
  showTagline = false,
  size = "header",
}: BrandLogoProps) {
  const content = (
    <div className={`brand-logo-wrap ${className}`}>
      <span className="brand-logo-glow" aria-hidden />
      <Image
        src={brand.logoSrc}
        alt={brand.logoAlt}
        width={360}
        height={80}
        className={`brand-logo-img relative z-[1] object-contain ${sizeClasses[size]}`}
        priority
      />
      {showTagline && (
        <p className="mt-0.5 truncate text-center text-[11px] text-zinc-500 sm:text-xs">
          {brand.tagline}
        </p>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="brand-logo-link group inline-flex items-center">
      {content}
    </Link>
  );
}

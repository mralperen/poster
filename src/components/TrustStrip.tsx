const items = [
  { label: "PayTR ile güvenli ödeme", icon: "lock" },
  { label: "Korumalı kargo paketi", icon: "box" },
  { label: "3 al 2 öde", icon: "tag" },
  { label: "Kolay iade desteği", icon: "return" },
] as const;

type IconName = (typeof items)[number]["icon"];

function TrustIcon({ name }: { name: IconName }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "shrink-0 text-amber-300/80",
  };

  if (name === "lock") {
    return (
      <svg {...common}>
        <rect x="4" y="10.5" width="16" height="10" rx="2" />
        <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  if (name === "box") {
    return (
      <svg {...common}>
        <path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z" />
        <path d="M3 7.5 12 12l9-4.5M12 12v9" />
      </svg>
    );
  }

  if (name === "tag") {
    return (
      <svg {...common}>
        <path d="M20.5 12.5 12 21l-9-9 8.5-8.5H20a.5.5 0 0 1 .5.5v8.5Z" />
        <circle cx="16" cy="8" r="1.4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

export function TrustStrip() {
  return (
    <section className="border-t border-white/10 bg-[#0b0b0c] px-4 py-5 sm:px-6">
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-3 sm:justify-between">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-2 text-xs text-zinc-400 sm:text-[13px]"
          >
            <TrustIcon name={item.icon} />
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

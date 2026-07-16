import Link from "next/link";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function InfoPage({ eyebrow, title, description, children }: InfoPageProps) {
  return (
    <main className="bg-[#09090a] text-white">
      <section className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            ← Ana sayfa
          </Link>
          <p className="mt-8 text-xs font-semibold tracking-[0.24em] text-amber-300 uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
            {description}
          </p>
        </div>
      </section>
      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl">{children}</div>
      </section>
    </main>
  );
}

export function InfoGrid({
  items,
}: {
  items: Array<{ title: string; text: string }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.title}
          className="rounded-[8px] border border-white/10 bg-white/[0.025] p-5"
        >
          <h2 className="text-lg font-semibold text-white">{item.title}</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{item.text}</p>
        </article>
      ))}
    </div>
  );
}

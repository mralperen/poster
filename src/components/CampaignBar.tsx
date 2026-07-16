"use client";

type CampaignBarProps = {
  text: string;
};

const ITEMS_PER_HALF = 4;

function MarqueeHalf({
  text,
  hidden,
}: {
  text: string;
  hidden?: boolean;
}) {
  return (
    <span
      className="campaign-marquee-half flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
    >
      {Array.from({ length: ITEMS_PER_HALF }, (_, index) => (
        <span key={index} className="flex shrink-0 items-center">
          <span className="whitespace-nowrap px-8">{text}</span>
          <span className="shrink-0 px-3 text-black/35" aria-hidden>
            ·
          </span>
        </span>
      ))}
    </span>
  );
}

export function CampaignBar({ text }: CampaignBarProps) {
  return (
    <div
      className="campaign-bar border-b border-amber-400/30 bg-amber-300 py-1.5"
      aria-label={text}
    >
      <div className="campaign-marquee-viewport overflow-hidden">
        <div className="campaign-marquee-track flex w-max items-center text-[11px] font-semibold tracking-wide text-black">
          <MarqueeHalf text={text} />
          <MarqueeHalf text={text} hidden />
        </div>
      </div>
    </div>
  );
}

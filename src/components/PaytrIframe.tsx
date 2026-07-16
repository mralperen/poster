"use client";

import Script from "next/script";

type PaytrIframeProps = {
  token: string;
};

declare global {
  interface Window {
    iFrameResize?: (
      options: Record<string, unknown>,
      target: string | HTMLElement,
    ) => void;
  }
}

export function PaytrIframe({ token }: PaytrIframeProps) {
  const initResize = () => {
    window.iFrameResize?.({}, "#paytriframe");
  };

  return (
    <div className="overflow-hidden rounded-[10px] border border-white/10 bg-white">
      <iframe
        id="paytriframe"
        src={`https://www.paytr.com/odeme/guvenli/${token}`}
        title="PayTR güvenli ödeme"
        className="block w-full"
        style={{ minHeight: 520 }}
        scrolling="no"
      />
      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js"
        strategy="afterInteractive"
        onLoad={initResize}
      />
    </div>
  );
}

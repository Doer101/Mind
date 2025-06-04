"use client";

import Script from "next/script";

export function TempoScript() {
  return (
    <Script
      src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js"
      strategy="afterInteractive"
    />
  );
}

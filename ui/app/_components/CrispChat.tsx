"use client";

import Script from "next/script";

const CRISP_WEBSITE_ID = "6d61b7c2-9d92-48dd-b4b9-5c8317f44099";

export function CrispChat() {
  return (
    <Script
      id="crisp-widget"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          window.$crisp=[];
          window.CRISP_WEBSITE_ID="${CRISP_WEBSITE_ID}";
          (function(){
            var d=document;
            var s=d.createElement("script");
            s.src="https://client.crisp.chat/l.js";
            s.async=1;
            d.getElementsByTagName("head")[0].appendChild(s);
          })();
        `,
      }}
    />
  );
}

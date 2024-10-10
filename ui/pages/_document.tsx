import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
        <Script
          id="crisp-chat"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
                window.$crisp = [];
                window.CRISP_WEBSITE_ID = "6d61b7c2-9d92-48dd-b4b9-5c8317f44099";
                (function() {
                  var d = document;
                  var s = d.createElement("script");
                  s.src = "https://client.crisp.chat/l.js";
                  s.async = 1;
                  d.getElementsByTagName("head")[0].appendChild(s);
                })();
              `,
          }}
        />
      </body>
    </Html>
  );
}

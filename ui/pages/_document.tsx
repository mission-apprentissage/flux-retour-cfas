import { Html, Head, Main, NextScript } from "next/document";

import { marianne } from "@/theme/fonts";

export default function Document() {
  return (
    <Html lang="fr" className={marianne.className}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Tableau de bord de l’apprentissage – Opérateurs publics" />
        <meta name="author" content="Mission Apprentissage – MNA" />
        <meta name="theme-color" content="#000091" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta property="og:title" content="Tableau de bord de l’apprentissage" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:image" content="/images/og-default.jpg" />
        <meta property="og:description" content="Pilotez l’apprentissage dans votre territoire." />
        <meta property="og:url" content="https://cfas.apprentissage.beta.gouv.fr" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

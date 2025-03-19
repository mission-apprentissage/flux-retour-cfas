import path from "path";
import { fileURLToPath } from "url";

import { withSentryConfig } from "@sentry/nextjs";
import { withPlausibleProxy } from "next-plausible";

function inline(value) {
  return value.replace(/\s{2,}/g, " ").trim();
}

const contentSecurityPolicy = `
      default-src 'self' https://plausible.io;
      base-uri 'self' https://stats.beta.gouv.fr;
      block-all-mixed-content;
      font-src 'self' https: data:;
      frame-ancestors 'self' https://cfas.apprentissage.beta.gouv.fr;
      frame-src 'self' https://plausible.io https://cfas.apprentissage.beta.gouv.fr https://cfas-recette.apprentissage.beta.gouv.fr https://tableau-de-bord-preprod.apprentissage.beta.gouv.fr https://plugins.crisp.chat;
      img-src 'self' https://files.tableau-de-bord.apprentissage.beta.gouv.fr https://www.notion.so https://mission-apprentissage.notion.site https://stats.beta.gouv.fr data:;
      object-src 'none';
      script-src 'self' 'unsafe-inline' https://plausible.io https://stats.beta.gouv.fr https://client.crisp.chat  ${process.env.NEXT_PUBLIC_ENV === "local" ? "'unsafe-eval' " : ""};
      script-src-attr 'none';
      style-src 'self' https: *.plausible.io 'unsafe-inline';
      connect-src 'self' https://plausible.io https://stats.beta.gouv.fr https://client.crisp.chat https://plugins.crisp.chat https://sentry.apprentissage.beta.gouv.fr ${
        process.env.NEXT_PUBLIC_ENV === "local" ? "http://localhost:5001/" : ""
      };
      upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["shared"],
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
  experimental: {
    outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), "../"),
    typedRoutes: true,
    instrumentationHook: true,
  },
  output: "standalone",
  sentry: {
    hideSourceMaps: false,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: "asset/resource",
    });
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: inline(contentSecurityPolicy),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/cfa/:path*",
        destination: "/reinscription",
        permanent: true,
      },
      // {
      //   source: "/mission-locale",
      //   destination: "/",
      //   permanent: true,
      // },
      {
        source: "/politique-confidentialite",
        destination: "/politique-de-confidentialite",
        permanent: true,
      },
      {
        source: "/protection-des-donnees",
        destination: "/politique-de-confidentialite",
        permanent: true,
      },
      {
        source: "/mention-information",
        destination: "/politique-de-confidentialite",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(
  withPlausibleProxy()(nextConfig),
  { silent: true, dryRun: !process.env.NEXT_PUBLIC_SENTRY_DSN },
  { hideSourcemaps: true }
);

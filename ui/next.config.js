const { withSentryConfig } = require("@sentry/nextjs");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const { withPlausibleProxy } = require("next-plausible");

function inline(value) {
  return value.replace(/\s{2,}/g, " ").trim();
}

const contentSecurityPolicy = `
      default-src 'self' https://plausible.io;
      base-uri 'self';
      block-all-mixed-content;
      font-src 'self' https: data:;
      frame-ancestors 'self' https://cfas.apprentissage.beta.gouv.fr;
      frame-src 'self' https://plausible.io https://cfas.apprentissage.beta.gouv.fr https://cfas-recette.apprentissage.beta.gouv.fr;
      img-src 'self' https://files.tableau-de-bord.apprentissage.beta.gouv.fr https://www.notion.so https://mission-apprentissage.notion.site data:;
      object-src 'none';
      script-src 'self' https://plausible.io ${process.env.NEXT_PUBLIC_ENV === "local" ? "'unsafe-eval'" : ""};
      script-src-attr 'none';
      style-src 'self' https: *.plausible.io 'unsafe-inline';
      connect-src 'self' https://plausible.io  https://sentry.apprentissage.beta.gouv.fr ${
        process.env.NEXT_PUBLIC_ENV === "local" ? "http://localhost:5001/" : ""
      };
      upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["shared"],
  poweredByHeader: false,
  swcMinify: true,
  experimental: {
    appDir: false,
    typedRoutes: true,
  },
  output: "standalone",
  eslint: {
    dirs: ["."],
  },
  sentry: {
    hideSourceMaps: false,
    widenClientFileUpload: true,
  },
  webpack: (config) => {
    config.plugins.push(new CaseSensitivePathsPlugin());
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
      {
        source: "/politique-confidentialite",
        destination: "/mention-information",
        permanent: true,
      },
      {
        source: "/protection-des-donnees",
        destination: "/mention-information",
        permanent: true,
      },
      {
        source: "/mentions-legales",
        destination:
          "https://mission-apprentissage.notion.site/Mentions-l-gales-002a2868ea2f46cdb2d73207d12b6075?pvs=4",
        permanent: true,
      },
      {
        source: "/mention-information",
        destination:
          "https://mission-apprentissage.notion.site/Mention-d-information-7b1c32f4c2214e0c9523686b18ada6fa?pvs=4",
        permanent: true,
      },
    ];
  },
};

module.exports = withSentryConfig(
  withPlausibleProxy()(nextConfig),
  { silent: true, dryRun: !process.env.NEXT_PUBLIC_SENTRY_DSN },
  { hideSourcemaps: true }
);

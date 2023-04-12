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
      frame-src 'self'  https://plausible.io https://cfas.apprentissage.beta.gouv.fr;
      img-src 'self' https://files.tableau-de-bord.apprentissage.beta.gouv.fr https://www.notion.so data: ${
        process.env.NEXT_PUBLIC_ENV !== "production" ? "" : ""
      };
      object-src 'none';
      script-src 'self' https://plausible.io ${process.env.NEXT_PUBLIC_ENV === "dev" ? "'unsafe-eval'" : ""};
      script-src-attr 'none';
      style-src 'self' https: *.plausible.io 'unsafe-inline';
      connect-src 'self' https://plausible.io;
      upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  experimental: {
    appDir: false,
    typedRoutes: true,
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
    ];
  },
};

module.exports = withSentryConfig(
  withPlausibleProxy()(nextConfig),
  { silent: true, dryRun: !process.env.NEXT_PUBLIC_SENTRY_DSN },
  { hideSourcemaps: true }
);

const { withSentryConfig } = require('@sentry/nextjs');

function inline(value) {
  return value.replace(/\s{2,}/g, " ").trim();
}

const contentSecurityPolicy = `
      default-src 'self' https://plausible.io;
      base-uri 'self';
      block-all-mixed-content;
      font-src 'self' https://client.crisp.chat https: data:;
      media-src https://client.crisp.chat;
      frame-ancestors 'self' https://cfas.apprentissage.beta.gouv.fr;
      frame-src 'self' https://game.crisp.chat https://plausible.io https://cfas.apprentissage.beta.gouv.fr;
      img-src 'self' https://files.tableau-de-bord.apprentissage.beta.gouv.fr https://client.crisp.chat https://image.crisp.chat https://www.notion.so data: ${
        process.env.NEXT_PUBLIC_ENV !== "production" ? "" : ""
      };
      object-src 'none';
      script-src 'self' https://plausible.io https://client.crisp.chat https://settings.crisp.chat ${
        process.env.NEXT_PUBLIC_ENV === "dev" ? "'unsafe-eval'" : ""
      };
      script-src-attr 'none';
      style-src 'self' https: https://client.crisp.chat https: *.plausible.io 'unsafe-inline';
      connect-src 'self' https://geo.api.gouv.fr/ https://client.crisp.chat https://storage.crisp.chat wss://client.relay.crisp.chat wss://stream.relay.crisp.chat https://plausible.io;
      upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
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

module.exports = nextConfig;

module.exports = withSentryConfig(
  module.exports,
  { silent: true },
  { hideSourcemaps: true },
);

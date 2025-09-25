interface PublicConfig {
  sentry_dsn: string;
  baseUrl: string;
  host: string;
  env: "local" | "recette" | "production" | "preview" | "preprod" | "demo";
  version: string;
  matomo: {
    url: string;
    siteId: string;
    jsTrackerFile: string;
    disableCookies: boolean;
  };
}

const SENTRY_DSN = "https://77feecd94eb54b3491f81e3c5aaa026c@sentry.apprentissage.beta.gouv.fr/6";

function getProductionPublicConfig(): PublicConfig {
  const host = "cfas.apprentissage.beta.gouv.fr";

  return {
    sentry_dsn: SENTRY_DSN,
    env: "production",
    host,
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "94",
      jsTrackerFile: "js/container_s4n03ZE1.js",
      disableCookies: true,
    },
    version: getVersion(),
  };
}

function getRecettePublicConfig(): PublicConfig {
  const host = "cfas-recette.apprentissage.beta.gouv.fr";

  return {
    sentry_dsn: SENTRY_DSN,
    env: "recette",
    host,
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "",
      jsTrackerFile: "",
      disableCookies: true,
    },
    version: getVersion(),
  };
}

function getPreprodPublicConfig(): PublicConfig {
  const host = "tableau-de-bord-preprod.apprentissage.beta.gouv.fr";

  return {
    sentry_dsn: SENTRY_DSN,
    env: "preprod",
    host,
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "",
      jsTrackerFile: "",
      disableCookies: true,
    },
    version: getVersion(),
  };
}

function getPreviewPublicConfig(): PublicConfig {
  const version = getVersion();
  const matches = version.match(/^0\.0\.0-(\d+)$/);

  if (!matches) {
    throw new Error(`getPreviewPublicConfig: invalid preview version ${version}`);
  }

  const host = `${matches[1]}.tdb-preview.apprentissage.beta.gouv.fr`;

  return {
    sentry_dsn: SENTRY_DSN,
    env: "preview",
    host,
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "",
      jsTrackerFile: "",
      disableCookies: true,
    },
    version: getVersion(),
  };
}

function getLocalPublicConfig(): PublicConfig {
  const host = "localhost";

  return {
    sentry_dsn: SENTRY_DSN,
    env: "local",
    host,
    baseUrl: `http://${host}:${process.env.NEXT_PUBLIC_API_PORT}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "",
      jsTrackerFile: "",
      disableCookies: true,
    },
    version: getVersion(),
  };
}

function getDemoPublicConfig(): PublicConfig {
  const host = "tableau-de-bord-demo.apprentissage.beta.gouv.fr";

  return {
    sentry_dsn: SENTRY_DSN,
    env: "demo",
    host,
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "",
      jsTrackerFile: "",
      disableCookies: true,
    },
    version: getVersion(),
  };
}

function getVersion(): string {
  const version = process.env.NEXT_PUBLIC_VERSION;

  if (!version) {
    throw new Error("missing NEXT_PUBLIC_VERSION env-vars");
  }

  return version;
}

function getEnv(): PublicConfig["env"] {
  const env = process.env.NEXT_PUBLIC_ENV;
  switch (env) {
    case "production":
    case "recette":
    case "preprod":
    case "preview":
    case "local":
    case "demo":
      return env;
    default:
      throw new Error(`Invalid NEXT_PUBLIC_ENV env-vars ${env}`);
  }
}

function getPublicConfig(): PublicConfig {
  switch (getEnv()) {
    case "production":
      return getProductionPublicConfig();
    case "recette":
      return getRecettePublicConfig();
    case "preprod":
      return getPreprodPublicConfig();
    case "preview":
      return getPreviewPublicConfig();
    case "local":
      return getLocalPublicConfig();
    case "demo":
      return getDemoPublicConfig();
  }
}

export const publicConfig: PublicConfig = getPublicConfig();

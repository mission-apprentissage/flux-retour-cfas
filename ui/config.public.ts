export interface PublicConfig {
  sentry_dsn: string;
  baseUrl: string;
  host: string;
  env: "local" | "recette" | "production" | "preview";
  version: string;
}

const SENTRY_DSN = "https://362c29c6acbe4a599640109d87e77beb@o4504570758561792.ingest.sentry.io/4504570760265728";

function getProductionPublicConfig(): PublicConfig {
  const host = "cfas.apprentissage.beta.gouv.fr";

  return {
    sentry_dsn: SENTRY_DSN,
    env: "production",
    host,
    baseUrl: `https://${host}`,
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
    case "preview":
    case "local":
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
    case "preview":
      return getPreviewPublicConfig();
    case "local":
      return getLocalPublicConfig();
  }
}

export const publicConfig: PublicConfig = getPublicConfig();

export interface PublicConfig {
  baseUrl: string;
  host: string;
  env: "local" | "dev" | "recette" | "production";
}

function getProductionPublicConfig(): PublicConfig {
  const host = "cfas.apprentissage.beta.gouv.fr";

  return {
    env: "production",
    host,
    baseUrl: `https://${host}`,
  };
}

function getRecettePublicConfig(): PublicConfig {
  const host = "cfas-recette.apprentissage.beta.gouv.fr";

  return {
    env: "recette",
    host,
    baseUrl: `https://${host}`,
  };
}

function getDevPublicConfig(): PublicConfig {
  const host = "cfas-dev.apprentissage.beta.gouv.fr";

  return {
    env: "dev",
    host,
    baseUrl: `https://${host}`,
  };
}

function getLocalPublicConfig(): PublicConfig {
  const host = "localhost";

  return {
    env: "local",
    host,
    baseUrl: `http://${host}`,
  };
}

function getEnv(): PublicConfig["env"] {
  const env = process.env.NEXT_PUBLIC_ENV;
  switch (env) {
    case "production":
    case "recette":
    case "dev":
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
    case "dev":
      return getDevPublicConfig();
    case "local":
      return getLocalPublicConfig();
  }
}

export const publicConfig: PublicConfig = getPublicConfig();

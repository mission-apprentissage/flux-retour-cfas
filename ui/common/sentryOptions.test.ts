import type { Event } from "@sentry/nextjs";
import { describe, expect, it, vi } from "vitest";

import { buildUiSentryOptions } from "./sentryOptions";

vi.mock("@/config.public", () => ({
  publicConfig: { env: "production", baseUrl: "https://example.test", version: "test", sentry_dsn: "" },
}));

const withException = (type: string, value: string): Event => ({ exception: { values: [{ type, value }] } });

describe("buildUiSentryOptions", () => {
  it.each(["next-server", "next-edge"] as const)("rejette un 401 de l'API rendu en %s", (runtime) => {
    const { beforeSend } = buildUiSentryOptions(runtime);

    expect(beforeSend(withException("AuthError", "Request rejected with status code 401"))).toBeNull();
  });

  it("conserve une vraie erreur de rendu serveur", () => {
    const { beforeSend } = buildUiSentryOptions("next-server");

    expect(beforeSend(withException("TypeError", "Cannot read properties of undefined"))).not.toBeNull();
  });

  it("ne rejette pas le réseau coupé côté serveur, qui y signale une panne d'API", () => {
    const { beforeSend } = buildUiSentryOptions("next-server");

    expect(beforeSend(withException("TypeError", "Failed to fetch"))).not.toBeNull();
  });
});

import Boom from "@hapi/boom";
import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { serializers } from "./logger";

describe("sérialiseur error du logger", () => {
  it("réduit une vraie erreur à son message et sa pile, sans la configuration axios", () => {
    const erreur = new AxiosError("Request failed", "ERR_BAD_REQUEST", {
      headers: { Authorization: "Bearer SECRET" },
    } as never);

    const serialisee = serializers.error(erreur);

    expect(serialisee).toMatchObject({ message: "Request failed", code: "ERR_BAD_REQUEST" });
    expect(JSON.stringify(serialisee)).not.toContain("SECRET");
  });

  it("garde tel quel le détail que logMiddleware journalise sous error", () => {
    const boom = Boom.badRequest("Paramètre invalide", { champ: "siret" });
    const detail = { ...boom, message: boom.message, stack: boom.stack };

    expect(serializers.error(detail)).toBe(detail);
  });

  it("laisse passer une valeur qui n'est pas une erreur", () => {
    expect(serializers.error("texte")).toBe("texte");
    expect(serializers.error(null)).toBeNull();
  });
});

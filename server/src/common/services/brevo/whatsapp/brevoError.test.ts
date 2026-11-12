import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { captureTiered } from "@/common/services/sentry/alertContract";

import { describeBrevoError, reportBrevoError, resetBrevoErrorReports, sanitizeBrevoText } from "./brevoError";

vi.mock("@/common/services/sentry/alertContract", () => ({ captureTiered: vi.fn() }));

const axiosError = (status: number | undefined, data?: unknown, code?: string): AxiosError => {
  const config = {
    headers: new AxiosHeaders({ "api-key": "secret-key" }),
    data: JSON.stringify({ contactNumbers: ["33612345678"], attributes: { PRENOM: "Jean" } }),
  };
  const response =
    status === undefined ? undefined : { status, data, statusText: "", headers: {}, config: config as never };
  return new AxiosError("Request failed", code, config as never, undefined, response);
};

describe("sanitizeBrevoText", () => {
  it("masque numéros, e-mails et valeurs entre guillemets", () => {
    const text = sanitizeBrevoText(
      `Invalid number +33 6 12 34 56 78 for jean.dupont@exemple.fr, attribute "Jean" refused`
    );
    expect(text).not.toMatch(/33|12 34|jean|Jean|exemple/);
    expect(text).toContain("<tel>");
    expect(text).toContain("<email>");
    expect(text).toContain("<valeur>");
  });

  it("conserve les noms de champs entre guillemets et masque les valeurs", () => {
    const text = sanitizeBrevoText(`Attribute "TBA_EFFECTIF_PRENOM_WHATSAPP" invalid: "Jean" and "templateId" missing`);
    expect(text).toBe(`Attribute "TBA_EFFECTIF_PRENOM_WHATSAPP" invalid: <valeur> and "templateId" missing`);
  });

  it("ne masque pas un identifiant court mais masque un numéro de 9 chiffres", () => {
    expect(sanitizeBrevoText("template 42 not found")).toBe("template 42 not found");
    expect(sanitizeBrevoText("number 612345678 invalid")).toBe("number <tel> invalid");
  });

  it("masque les valeurs transmises à Brevo même citées sans guillemets", () => {
    const text = sanitizeBrevoText("Contact Jean Dupont already exists, jean refused", ["Jean", "ML Paris"]);
    expect(text).not.toMatch(/jean/i);
    expect(text).toContain("Dupont");
  });

  it("ignore les valeurs trop courtes pour ne pas hacher le message", () => {
    expect(sanitizeBrevoText("an error occurred", ["an", ""])).toBe("an error occurred");
  });

  it("conserve les apostrophes françaises et borne la longueur", () => {
    expect(sanitizeBrevoText("l'attribut n'existe pas")).toBe("l'attribut n'existe pas");
    expect(sanitizeBrevoText("x".repeat(500))).toHaveLength(200);
  });
});

describe("describeBrevoError", () => {
  it("expose statut, code et message de la réponse sans rien de la requête", () => {
    const details = describeBrevoError(
      axiosError(400, { code: "invalid_parameter", message: "Invalid phone 33612345678" })
    );
    expect(details).toEqual({
      status: 400,
      code: "invalid_parameter",
      message: "Invalid phone <tel>",
      retryable: false,
      safeToRetry: false,
    });
    expect(JSON.stringify(details)).not.toMatch(/secret-key|Jean/);
  });

  it.each([404, 400, 401])("%s est terminal", (status) => {
    expect(describeBrevoError(axiosError(status, { message: "nope" })).retryable).toBe(false);
  });

  it.each([429, 500, 503, 408])("%s est transitoire", (status) => {
    expect(describeBrevoError(axiosError(status, { message: "later" })).retryable).toBe(true);
  });

  it("une erreur sans réponse (timeout) est transitoire", () => {
    const details = describeBrevoError(axiosError(undefined, undefined, "ECONNABORTED"));
    expect(details.retryable).toBe(true);
    expect(details.status).toBeUndefined();
    expect(details.code).toBe("ECONNABORTED");
  });

  it("passe les valeurs sensibles à l'assainissement du message de réponse", () => {
    const details = describeBrevoError(axiosError(400, { message: "Invalid value Jean for attribute" }), ["Jean"]);
    expect(details.message).toBe("Invalid value <valeur> for attribute");
  });

  it("une erreur applicative n'est pas rejouée", () => {
    expect(describeBrevoError(new Error("bug"))).toEqual({ message: "bug", retryable: false, safeToRetry: false });
  });
});

describe("safeToRetry : rejouer ne peut pas doubler le message", () => {
  it.each([429, 503])("%s : Brevo n'a rien traité", (status) => {
    expect(describeBrevoError(axiosError(status, { message: "later" })).safeToRetry).toBe(true);
  });

  it.each(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"])("%s : la requête n'est jamais partie", (code) => {
    expect(describeBrevoError(axiosError(undefined, undefined, code)).safeToRetry).toBe(true);
  });

  it.each([500, 502, 504, 408, 400, 404])("%s : traitement possible ou refus, pas rejouable sans risque", (status) => {
    expect(describeBrevoError(axiosError(status, { message: "x" })).safeToRetry).toBe(false);
  });

  it.each(["ECONNABORTED", "ETIMEDOUT", "ECONNRESET"])("%s : Brevo a pu envoyer", (code) => {
    const details = describeBrevoError(axiosError(undefined, undefined, code));
    expect(details.retryable).toBe(true);
    expect(details.safeToRetry).toBe(false);
  });
});

describe("reportBrevoError", () => {
  beforeEach(() => {
    resetBrevoErrorReports();
    vi.mocked(captureTiered).mockClear();
  });

  it("capture le corps assaini avec une empreinte stable", () => {
    reportBrevoError("send_template", {
      status: 400,
      code: "invalid_parameter",
      message: "Invalid",
      retryable: false,
      safeToRetry: false,
    });

    expect(captureTiered).toHaveBeenCalledOnce();
    expect(captureTiered).toHaveBeenCalledWith(
      expect.objectContaining({ name: "BrevoApiError" }),
      expect.objectContaining({
        errorKind: "upstream",
        upstream: "brevo",
        fingerprintKey: "brevo-whatsapp:send_template:400",
        extra: {
          operation: "send_template",
          status: 400,
          brevoCode: "invalid_parameter",
          brevoMessage: "Invalid",
          suppressedSinceLastReport: 0,
        },
      })
    );
  });

  it("ne pose aucun palier : le contrat d'alerte décide", () => {
    reportBrevoError("send_template", { status: 400, message: "Invalid", retryable: false, safeToRetry: false });
    expect(vi.mocked(captureTiered).mock.calls[0][1]).not.toHaveProperty("tier");
  });

  it("classe en bug une erreur sans statut ni code, avec sa propre empreinte", () => {
    reportBrevoError("send_template", { message: "x is not a function", retryable: false, safeToRetry: false });
    expect(captureTiered).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ errorKind: "bug", fingerprintKey: "brevo-whatsapp:send_template:erreur-interne" })
    );
  });

  it("compte les occurrences écartées dans la capture suivante", () => {
    vi.useFakeTimers();
    try {
      const details = { status: 400, message: "Invalid", retryable: false, safeToRetry: false };
      reportBrevoError("send_template", details);
      reportBrevoError("send_template", details);
      reportBrevoError("send_template", details);
      vi.advanceTimersByTime(61 * 60_000);
      reportBrevoError("send_template", details);

      expect(captureTiered).toHaveBeenCalledTimes(2);
      expect(vi.mocked(captureTiered).mock.calls[1][1].extra).toMatchObject({ suppressedSinceLastReport: 2 });
    } finally {
      vi.useRealTimers();
    }
  });

  it("ne capture qu'une fois par type d'échec dans l'heure", () => {
    const details = { status: 400, message: "Invalid", retryable: false, safeToRetry: false };
    reportBrevoError("upsert_contact", details);
    reportBrevoError("upsert_contact", details);
    reportBrevoError("send_template", details);
    expect(captureTiered).toHaveBeenCalledTimes(2);
  });
});

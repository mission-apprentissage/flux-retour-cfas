import { captureException } from "@sentry/node";
import { ApiError, type IRechercheOrganismeResponse } from "api-alternance-sdk";
import Boom from "boom";
import type { IOrganisme } from "shared/models";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { describe, it, vi, beforeEach, expect } from "vitest";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { organismesDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { fiabilisationUaiSiret, updateOrganismesFiabilisationStatut } from "./updateFiabilisation";

vi.mock("@/common/apis/apiAlternance/client", () => {
  return {
    apiAlternanceClient: {
      organisme: {
        recherche: vi.fn(),
      },
    },
  };
});
vi.mock("@sentry/node", () => {
  return {
    captureException: vi.fn(),
  };
});

describe("fiabilisationUaiSiret", () => {
  const uai = "0596776V";
  const siret = "77562556900014";

  describe("when couple is valid", () => {
    it("should return fiable result", async () => {
      const response: IRechercheOrganismeResponse = {
        metadata: {
          uai: { status: "ok" },
          siret: { status: "ok" },
        },
        candidats: [],
        resultat: {
          status: { ouvert: true, declaration_catalogue: true, validation_uai: true },
          correspondances: {
            uai: { lui_meme: true, son_lieu: false },
            siret: { lui_meme: true, son_formateur: false, son_responsable: false },
          },
          organisme: { identifiant: { uai, siret } },
        },
      };

      vi.mocked(apiAlternanceClient.organisme.recherche).mockResolvedValue(response);

      await expect(fiabilisationUaiSiret({ uai, siret })).resolves.toEqual({
        uai,
        siret,
        statut: "FIABLE",
        api_response: response,
      });
      expect(apiAlternanceClient.organisme.recherche).toHaveBeenCalledWith({ uai, siret });
    });
  });

  describe("when couple can resolve to a fiable couple", () => {
    it("should return the fiable couple", async () => {
      const uai2 = "0594899E";
      const response: IRechercheOrganismeResponse = {
        metadata: {
          uai: { status: "ok" },
          siret: { status: "ok" },
        },
        candidats: [],
        resultat: {
          status: { ouvert: true, declaration_catalogue: true, validation_uai: true },
          correspondances: {
            uai: { lui_meme: false, son_lieu: true },
            siret: { lui_meme: true, son_formateur: false, son_responsable: false },
          },
          organisme: { identifiant: { uai: uai2, siret } },
        },
      };

      vi.mocked(apiAlternanceClient.organisme.recherche).mockResolvedValue(response);

      await expect(fiabilisationUaiSiret({ uai, siret })).resolves.toEqual({
        uai: uai2,
        siret,
        statut: "FIABLE",
        api_response: response,
      });
      expect(apiAlternanceClient.organisme.recherche).toHaveBeenCalledWith({ uai, siret });
    });
  });

  describe("when couple cannot be resolved", () => {
    it("should return the couple as non fiable", async () => {
      const uai2 = "0594899E";
      const response: IRechercheOrganismeResponse = {
        metadata: {
          uai: { status: "ok" },
          siret: { status: "ok" },
        },
        candidats: [
          {
            status: { ouvert: true, declaration_catalogue: true, validation_uai: true },
            correspondances: {
              uai: { lui_meme: false, son_lieu: true },
              siret: { lui_meme: true, son_formateur: false, son_responsable: false },
            },
            organisme: { identifiant: { uai: uai2, siret } },
          },
        ],
        resultat: null,
      };

      vi.mocked(apiAlternanceClient.organisme.recherche).mockResolvedValue(response);

      await expect(fiabilisationUaiSiret({ uai, siret })).resolves.toEqual({
        uai,
        siret,
        statut: "NON_FIABLE",
        api_response: response,
      });
      expect(apiAlternanceClient.organisme.recherche).toHaveBeenCalledWith({ uai, siret });
    });
  });

  describe("when provided siret is invalid", () => {
    it("should return the couple as non fiable", async () => {
      vi.mocked(apiAlternanceClient.organisme.recherche).mockRejectedValueOnce(
        new ApiError({
          path: "",
          params: {},
          querystring: {},
          requestHeaders: {},
          statusCode: 400,
          message: "",
          name: "",
          responseHeaders: {},
          errorData: {
            validationError: {
              _errors: [],
              siret: {
                _errors: ["SIRET does not match the format /^\\d{14}$/", "SIRET does not pass the Luhn algorithm"],
              },
            },
          },
        })
      );

      await expect(fiabilisationUaiSiret({ uai, siret })).resolves.toEqual({
        uai,
        siret,
        statut: "NON_FIABLE",
        api_response: null,
      });
      expect(apiAlternanceClient.organisme.recherche).toHaveBeenCalledWith({ uai, siret });
      expect(captureException).not.toHaveBeenCalled();
    });
  });

  describe("when provided uai is invalid", () => {
    it("should return the couple as non fiable", async () => {
      vi.mocked(apiAlternanceClient.organisme.recherche).mockRejectedValueOnce(
        new ApiError({
          path: "",
          params: {},
          querystring: {},
          requestHeaders: {},
          statusCode: 400,
          message: "",
          name: "",
          responseHeaders: {},
          errorData: {
            validationError: {
              _errors: [],
              uai: {
                _errors: ["UAI checksum is invalid"],
              },
            },
          },
        })
      );

      await expect(fiabilisationUaiSiret({ uai, siret })).resolves.toEqual({
        uai,
        siret,
        statut: "NON_FIABLE",
        api_response: null,
      });
      expect(apiAlternanceClient.organisme.recherche).toHaveBeenCalledWith({ uai, siret });
      expect(captureException).not.toHaveBeenCalled();
    });
  });

  describe("when unexpected ApiError", () => {
    it("should return Inconnu", async () => {
      vi.mocked(apiAlternanceClient.organisme.recherche).mockRejectedValueOnce(
        new ApiError({
          path: "",
          params: {},
          querystring: {},
          requestHeaders: {},
          statusCode: 404,
          message: "",
          name: "",
          responseHeaders: {},
          errorData: null,
        })
      );

      await expect(fiabilisationUaiSiret({ uai, siret })).resolves.toEqual({
        uai,
        siret,
        statut: "INCONNU",
        api_response: null,
      });
      expect(apiAlternanceClient.organisme.recherche).toHaveBeenCalledWith({ uai, siret });
      expect(captureException).toHaveBeenCalledWith(
        Boom.internal("Échec de l'appel API pour la fiabilisation des organismes", { uai, siret })
      );
    });
  });

  describe("when unexpected Error", () => {
    it("should return Inconnu", async () => {
      vi.mocked(apiAlternanceClient.organisme.recherche).mockRejectedValueOnce(new Error("Unexpected error"));

      await expect(fiabilisationUaiSiret({ uai, siret })).resolves.toEqual({
        uai,
        siret,
        statut: "INCONNU",
        api_response: null,
      });
      expect(apiAlternanceClient.organisme.recherche).toHaveBeenCalledWith({ uai, siret });
      expect(captureException).toHaveBeenCalledWith(
        Boom.internal("Échec de l'appel API pour la fiabilisation des organismes", { uai, siret })
      );
    });
  });
});

describe("updateOrganismesFiabilisationStatut", () => {
  useMongo();

  const uai1 = "1133672E";
  const siret1_0 = "19921204400119";
  const siret1_1 = "19921204400150";

  const siret2 = "77562556900014";
  const uai2 = "8844672E";

  const organisme1_0: IOrganisme = generateOrganismeFixture({
    uai: uai1,
    siret: siret1_0,
    nature: "responsable",
    fiabilisation_statut: "FIABLE",
  });

  const organisme1_1: IOrganisme = generateOrganismeFixture({
    uai: uai1,
    siret: siret1_1,
    nature: "responsable",
    fiabilisation_statut: "NON_FIABLE",
  });

  const organisme2: IOrganisme = generateOrganismeFixture({
    uai: uai2,
    siret: siret2,
    nature: "responsable",
    fiabilisation_statut: "NON_FIABLE",
  });

  const organisme3: IOrganisme = generateOrganismeFixture({
    uai: uai2,
    siret: siret1_0,
    nature: "responsable",
    fiabilisation_statut: "FIABLE",
  });

  const response1_0: IRechercheOrganismeResponse = {
    metadata: {
      uai: { status: "ok" },
      siret: { status: "fermé" },
    },
    candidats: [],
    resultat: {
      status: { ouvert: true, declaration_catalogue: true, validation_uai: true },
      correspondances: {
        uai: { lui_meme: true, son_lieu: false },
        siret: { lui_meme: true, son_formateur: false, son_responsable: false },
      },
      organisme: { identifiant: { uai: uai1, siret: siret1_1 } },
    },
  };

  const response1_1: IRechercheOrganismeResponse = {
    metadata: {
      uai: { status: "ok" },
      siret: { status: "ok" },
    },
    candidats: [],
    resultat: {
      status: { ouvert: true, declaration_catalogue: true, validation_uai: true },
      correspondances: {
        uai: { lui_meme: true, son_lieu: false },
        siret: { lui_meme: true, son_formateur: false, son_responsable: false },
      },
      organisme: { identifiant: { uai: uai1, siret: siret1_1 } },
    },
  };

  const response2: IRechercheOrganismeResponse = {
    metadata: {
      uai: { status: "ok" },
      siret: { status: "ok" },
    },
    candidats: [],
    resultat: {
      status: { ouvert: true, declaration_catalogue: true, validation_uai: true },
      correspondances: {
        uai: { lui_meme: false, son_lieu: true },
        siret: { lui_meme: true, son_formateur: false, son_responsable: false },
      },
      organisme: { identifiant: { uai: uai2, siret: siret2 } },
    },
  };

  beforeEach(async () => {
    await organismesDb().insertMany([organisme1_0, organisme1_1, organisme2, organisme3]);

    return () => {
      return organismesDb().deleteMany({});
    };
  });

  it("should update organismes fiabilisation statut", async () => {
    vi.mocked(apiAlternanceClient.organisme.recherche).mockImplementation(async ({ siret, uai }) => {
      if (organisme1_0.siret === siret && organisme1_0.uai === uai) {
        return response1_0;
      }
      if (organisme1_1.siret === siret && organisme1_1.uai === uai) {
        return response1_1;
      }
      if (organisme2.siret === siret && organisme2.uai === uai) {
        return response2;
      }
      if (organisme3.siret === siret && organisme3.uai === uai) {
        throw new Error("Unexpected Api Error");
      }
      expect.unreachable();
    });

    await expect(updateOrganismesFiabilisationStatut()).resolves.toBeUndefined();
    expect(apiAlternanceClient.organisme.recherche).toHaveBeenCalledTimes(4);
    const updatedOrganisme1_0 = await organismesDb().findOne({ _id: organisme1_0._id });
    expect(updatedOrganisme1_0?.fiabilisation_statut).toBe("FIABLE");
    expect(updatedOrganisme1_0?.fiabilisation_api_response).toEqual(response1_0);
    const updatedOrganisme1_1 = await organismesDb().findOne({ _id: organisme1_1._id });
    expect(updatedOrganisme1_1?.fiabilisation_statut).toBe("FIABLE");
    expect(updatedOrganisme1_1?.fiabilisation_api_response).toEqual(response1_1);
    const updatedOrganisme2 = await organismesDb().findOne({ _id: organisme2._id });
    expect(updatedOrganisme2?.fiabilisation_statut).toBe("FIABLE");
    expect(updatedOrganisme2?.fiabilisation_api_response).toEqual(response2);
    const updatedOrganisme3 = await organismesDb().findOne({ _id: organisme3._id });
    // Should not reset the fiabilisation_statut if an error occurs
    expect(updatedOrganisme3?.fiabilisation_statut).toBe("FIABLE");
  });
});

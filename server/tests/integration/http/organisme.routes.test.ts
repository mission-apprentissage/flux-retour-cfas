import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { WithId } from "mongodb";

import { Organisme } from "@/common/model/@types";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { MapObjectIdToString } from "@/common/utils/mongoUtils";
import {
  historySequenceApprenti,
  historySequenceApprentiToAbandon,
  historySequenceApprentiToInscrit,
  historySequenceInscrit,
} from "@tests/data/historySequenceSamples";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { commonEffectifsAttributes, organismes, testPermissions } from "@tests/utils/permissions";
import {
  RequestAsOrganisationFunc,
  expectForbiddenError,
  expectUnauthorizedError,
  generate,
  id,
  initTestApp,
} from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("Routes /organismes/:id", () => {
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });
  beforeEach(async () => {
    await organismesDb().insertMany(organismes);
  });

  describe("GET /organismes/:id - détail d'un organisme", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organismes/${id(1)}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      const commonExpectedOrganismeAttributes: Partial<MapObjectIdToString<WithId<Organisme>>> = {
        _id: id(1),
        adresse: {
          departement: "56", // morbihan
          region: "53", // bretagne
          academie: "14", // rennes
          bassinEmploi: "5315", // rennes
        },
        reseaux: ["CCI"],
        // erps: ["YMAG"],
        nature: "responsable_formateur",
        raison_sociale: "ADEN Formations (Caen)",
        // fiabilisation_statut: "FIABLE",
        ferme: false,
        // metiers: [],
        // relatedFormations: [],
        // created_at: new Date("2023-04-12T18:00:00.000Z"),
        // updated_at: new Date("2023-04-12T18:00:00.000Z"),
        // est_dans_le_referentiel: true,
        // last_transmission_date: new Date("2023-04-15T18:00:00.000Z"),
        uai: "0000000A",
        siret: "00000000000018",
        organismesFormateurs: [
          {
            _id: id(2),
          },
        ],
        organismesResponsables: [
          {
            _id: id(3),
          },
        ],
      };

      const infoTransmissionEffectifsAttributes = {
        erps: ["YMAG"],
        last_transmission_date: "2023-04-15T18:00:00.000Z",
      };

      testPermissions<any>(
        {
          "OF cible": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: true,
              indicateursEffectifs: true,
              infoTransmissionEffectifs: true,
              manageEffectifs: true,
              viewContacts: true,
            },
          },
          "OF responsable": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: true,
              indicateursEffectifs: true,
              infoTransmissionEffectifs: true,
              manageEffectifs: true,
              viewContacts: true,
            },
          },
          "OF formateur": {
            ...commonExpectedOrganismeAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: false,
              infoTransmissionEffectifs: false,
              manageEffectifs: false,
              viewContacts: false,
            },
          },
          "OF non lié": {
            ...commonExpectedOrganismeAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: false,
              infoTransmissionEffectifs: false,
              manageEffectifs: false,
              viewContacts: false,
            },
          },
          "Tête de réseau même réseau": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: true,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          "Tête de réseau autre réseau": {
            ...commonExpectedOrganismeAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: false,
              infoTransmissionEffectifs: false,
              manageEffectifs: false,
              viewContacts: false,
            },
          },
          "DREETS même région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: ["inscritSansContrat", "rupturant", "abandon"],
              indicateursEffectifs: true,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          "DREETS autre région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: false,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          "DRAAF même région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: ["inscritSansContrat", "rupturant", "abandon"],
              indicateursEffectifs: true,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          "DRAAF autre région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: false,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          "Conseil Régional même région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: true,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          "Conseil Régional autre région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: false,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          "DDETS même département": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: ["inscritSansContrat", "rupturant", "abandon"],
              indicateursEffectifs: true,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          "DDETS autre département": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: false,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          "Académie même académie": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: true,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          "Académie autre académie": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: false,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          "Opérateur public national": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: false,
              indicateursEffectifs: true,
              infoTransmissionEffectifs: true,
              manageEffectifs: false,
              viewContacts: true,
            },
          },
          Administrateur: {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
            permissions: {
              effectifsNominatifs: true,
              indicateursEffectifs: true,
              infoTransmissionEffectifs: true,
              manageEffectifs: true,
              viewContacts: true,
            },
          },
        },
        async (organisation, expectedBody) => {
          const response = await requestAsOrganisation(organisation, "get", `/api/v1/organismes/${id(1)}`);
          expect(response.status).toStrictEqual(200);
          expect(response.data).toStrictEqual(expectedBody);
        }
      );
    });
  });

  describe("GET /organismes/:id/indicateurs/effectifs - indicateurs effectifs d'un organisme", () => {
    const date = "2023-04-13T10:00:00.000Z";
    const anneeScolaire = "2022-2023";

    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organisme/${id(1)}/indicateurs/effectifs?date=${date}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      beforeEach(async () => {
        // FIXME revoir les statuts
        await effectifsDb().insertMany([
          // 5 apprentis
          ...generate(5, () =>
            createSampleEffectif({
              ...commonEffectifsAttributes,
              annee_scolaire: anneeScolaire,
              apprenant: {
                historique_statut: historySequenceApprenti,
              },
            })
          ),

          // 10 Inscrit
          ...generate(10, () =>
            createSampleEffectif({
              ...commonEffectifsAttributes,
              annee_scolaire: anneeScolaire,
              apprenant: {
                historique_statut: historySequenceInscrit,
              },
            })
          ),

          // 15 ApprentiToAbandon
          ...generate(15, () =>
            createSampleEffectif({
              ...commonEffectifsAttributes,
              annee_scolaire: anneeScolaire,
              apprenant: {
                historique_statut: historySequenceApprentiToAbandon,
              },
            })
          ),

          // 20 ApprentiToInscrit
          ...generate(20, () =>
            createSampleEffectif({
              ...commonEffectifsAttributes,
              annee_scolaire: anneeScolaire,
              apprenant: {
                historique_statut: historySequenceApprentiToInscrit,
              },
            })
          ),
        ]);
      });
      testPermissions(
        {
          "OF cible": true,
          "OF responsable": true,
          "OF formateur": false,
          "OF non lié": false,
          "Tête de réseau même réseau": true,
          "Tête de réseau autre réseau": false,
          "DREETS même région": true,
          "DREETS autre région": false,
          "DRAAF même région": true,
          "DRAAF autre région": false,
          "Conseil Régional même région": true,
          "Conseil Régional autre région": false,
          "DDETS même département": true,
          "DDETS autre département": false,
          "Académie même académie": true,
          "Académie autre académie": false,
          "Opérateur public national": true,
          Administrateur: true,
        },
        async (organisation, allowed) => {
          const response = await requestAsOrganisation(
            organisation,
            "get",
            `/api/v1/organismes/${id(1)}/indicateurs/effectifs?date=${date}`
          );

          if (allowed) {
            expect(response.status).toStrictEqual(200);
            expect(response.data).toStrictEqual({
              apprenants: 35,
              apprentis: 5,
              inscritsSansContrat: 10,
              abandons: 15,
              rupturants: 20,
            });
          } else {
            expectForbiddenError(response);
          }
        }
      );
    });
  });

  describe("GET /organismes/:id/indicateurs/organismes - indicateurs organismes d'un organisme", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organisme/${id(3)}/indicateurs/organismes`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      testPermissions(
        {
          "OF cible": true,
          "OF responsable": true,
          "OF formateur": true,
          "OF non lié": true,
          "Tête de réseau même réseau": true,
          "Tête de réseau autre réseau": true,
          "DREETS même région": true,
          "DREETS autre région": true,
          "DRAAF même région": true,
          "DRAAF autre région": true,
          "Conseil Régional même région": true,
          "Conseil Régional autre région": true,
          "DDETS même département": true,
          "DDETS autre département": true,
          "Académie même académie": true,
          "Académie autre académie": true,
          "Opérateur public national": true,
          Administrateur: true,
        },
        async (organisation, allowed) => {
          const response = await requestAsOrganisation(
            organisation,
            "get",
            `/api/v1/organismes/${id(1)}/indicateurs/organismes`
          );

          if (allowed) {
            expect(response.status).toStrictEqual(200);
            expect(response.data).toStrictEqual({
              tauxCouverture: 100,
              totalOrganismes: 1,
              organismesTransmetteurs: 1,
              organismesNonTransmetteurs: 0,
            });
          } else {
            expectForbiddenError(response);
          }
        }
      );
    });
  });

  describe("PUT /organismes/:id/configure-erp - configuration de l'ERP d'un organisme", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.put(`/api/v1/organismes/${id(1)}/configure-erp`, {
        mode_de_transmission: "MANUEL",
        setup_step_courante: "COMPLETE",
      });

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      testPermissions(
        {
          "OF cible": true,
          "OF non lié": false,
          "OF formateur": false,
          "OF responsable": true,
          "Tête de réseau même réseau": false,
          "Tête de réseau autre réseau": false,
          "DREETS même région": false,
          "DREETS autre région": false,
          "DRAAF même région": false,
          "DRAAF autre région": false,
          "Conseil Régional même région": false,
          "Conseil Régional autre région": false,
          "DDETS même département": false,
          "DDETS autre département": false,
          "Académie même académie": false,
          "Académie autre académie": false,
          "Opérateur public national": false,
          Administrateur: true,
        },
        async (organisation, allowed) => {
          const response = await requestAsOrganisation(
            organisation,
            "put",
            `/api/v1/organismes/${id(1)}/configure-erp`,
            {
              mode_de_transmission: "MANUEL",
              setup_step_courante: "COMPLETE",
            }
          );

          if (allowed) {
            assert.strictEqual(response.status, 200);
            assert.deepStrictEqual(response.data, {
              message: "success",
            });
          } else {
            expectForbiddenError(response);
          }
        }
      );
    });
  });
});

import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { startOfDay, subMonths } from "date-fns";
import { ObjectId, WithId } from "mongodb";

import { PermissionsOrganisme } from "@/common/actions/helpers/permissions-organisme";
import { IndicateursEffectifsAvecFormation } from "@/common/actions/indicateurs/indicateurs";
import { Organisme } from "@/common/model/@types";
import { Rncp } from "@/common/model/@types/Rncp";
import { effectifsDb, organisationsDb, organismesDb, rncpDb, usersMigrationDb } from "@/common/model/collections";
import { MapObjectIdToString } from "@/common/utils/mongoUtils";
import { getCurrentTime } from "@/common/utils/timeUtils";
import {
  historySequenceApprenti,
  historySequenceApprentiToAbandon,
  historySequenceApprentiToInscrit,
  historySequenceInscrit,
  historySequenceInscritToApprenti,
} from "@tests/data/historySequenceSamples";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import {
  PermissionsTestConfig,
  commonEffectifsAttributes,
  organismes,
  testPermissions,
  userOrganisme,
} from "@tests/utils/permissions";
import {
  RequestAsOrganisationFunc,
  expectForbiddenError,
  expectUnauthorizedError,
  generate,
  id,
  initTestApp,
  testPasswordHash,
} from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

const permissionsByOrganisation: PermissionsTestConfig<PermissionsOrganisme> = {
  "OF cible": {
    effectifsNominatifs: true,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: true,
    viewContacts: true,
  },
  "OF responsable": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: true,
    viewContacts: true,
  },
  "OF formateur": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: false,
    manageEffectifs: false,
    viewContacts: false,
  },
  "OF non lié": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: false,
    manageEffectifs: false,
    viewContacts: false,
  },
  "Tête de réseau même réseau": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "Tête de réseau autre réseau": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: false,
    manageEffectifs: false,
    viewContacts: false,
  },
  "DREETS même région": {
    effectifsNominatifs: ["inscritSansContrat", "rupturant", "abandon"],
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "DREETS autre région": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "DRAAF même région": {
    effectifsNominatifs: ["inscritSansContrat", "rupturant", "abandon"],
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "DRAAF autre région": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "Conseil Régional même région": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "Conseil Régional autre région": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "CARIF OREF régional même région": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "CARIF OREF régional autre région": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "DDETS même département": {
    effectifsNominatifs: ["inscritSansContrat", "rupturant", "abandon"],
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "DDETS autre département": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "Académie même académie": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "Académie autre académie": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "Opérateur public national": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  "CARIF OREF national": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
  },
  Administrateur: {
    effectifsNominatifs: true,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: true,
    viewContacts: true,
  },
};

describe("Routes /organismes/:id", () => {
  useMongo();
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
        nature: "responsable_formateur",
        raison_sociale: "ADEN Formations (Caen)",
        fiabilisation_statut: "FIABLE",
        ferme: false,
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
        last_transmission_date: startOfDay(subMonths(new Date(), 1)).toISOString(),
      };

      testPermissions<any>(
        {
          "OF cible": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "OF responsable": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "OF formateur": {
            ...commonExpectedOrganismeAttributes,
          },
          "OF non lié": {
            ...commonExpectedOrganismeAttributes,
          },
          "Tête de réseau même réseau": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "Tête de réseau autre réseau": {
            ...commonExpectedOrganismeAttributes,
          },
          "DREETS même région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "DREETS autre région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "DRAAF même région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "DRAAF autre région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "Conseil Régional même région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "Conseil Régional autre région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "CARIF OREF régional même région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "CARIF OREF régional autre région": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "DDETS même département": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "DDETS autre département": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "Académie même académie": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "Académie autre académie": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "Opérateur public national": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          "CARIF OREF national": {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
          Administrateur: {
            ...commonExpectedOrganismeAttributes,
            ...infoTransmissionEffectifsAttributes,
          },
        },
        async (organisation, expectedBody, organisationLabel) => {
          const response = await requestAsOrganisation(organisation, "get", `/api/v1/organismes/${id(1)}`);
          expect(response.status).toStrictEqual(200);
          expect(response.data).toStrictEqual({
            ...expectedBody,
            permissions: permissionsByOrganisation[organisationLabel as string],
          });
        }
      );
    });
  });

  describe("GET /organismes/:id/contacts - liste des contacts d'un organisme", () => {
    beforeEach(async () => {
      await Promise.all([
        organisationsDb().insertOne({
          _id: new ObjectId(id(1)),
          type: "ORGANISME_FORMATION",
          uai: userOrganisme.uai as string,
          siret: userOrganisme.siret,
          created_at: getCurrentTime(),
        }),
        usersMigrationDb().insertMany([
          {
            account_status: "CONFIRMED",
            invalided_token: false,
            password_updated_at: new Date(),
            connection_history: [],
            emails: [],
            created_at: new Date(),
            civility: "Madame",
            nom: "Boucher",
            prenom: "Alice",
            fonction: "Directrice",
            email: "alice@tdb.local",
            telephone: "0102030405",
            password: testPasswordHash,
            has_accept_cgu_version: "v0.1",
            organisation_id: new ObjectId(id(1)),
          },
          {
            account_status: "CONFIRMED",
            invalided_token: false,
            password_updated_at: new Date(),
            connection_history: [],
            emails: [],
            created_at: new Date(),
            civility: "Madame",
            nom: "Jean",
            prenom: "Corinne",
            fonction: "Service administratif",
            email: "corinne@tdb.local",
            telephone: "0102030406",
            password: testPasswordHash,
            has_accept_cgu_version: "v0.1",
            organisation_id: new ObjectId(id(1)),
          },
        ]),
      ]);
    });

    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organismes/${id(1)}/contacts`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      testPermissions(
        {
          "OF cible": true,
          "OF responsable": true,
          "OF formateur": false,
          "OF non lié": false,
          "Tête de réseau même réseau": true,
          "Tête de réseau autre réseau": false,
          "DREETS même région": true,
          "DREETS autre région": true,
          "DRAAF même région": true,
          "DRAAF autre région": true,
          "Conseil Régional même région": true,
          "Conseil Régional autre région": true,
          "CARIF OREF régional même région": true,
          "CARIF OREF régional autre région": true,
          "DDETS même département": true,
          "DDETS autre département": true,
          "Académie même académie": true,
          "Académie autre académie": true,
          "Opérateur public national": true,
          "CARIF OREF national": true,
          Administrateur: true,
        },
        async (organisation, allowed, organisationLabel) => {
          const response = await requestAsOrganisation(organisation, "get", `/api/v1/organismes/${id(1)}/contacts`);
          if (allowed) {
            expect(response.status).toStrictEqual(200);
            expect(response.data).toStrictEqual([
              {
                _id: expect.any(String),
                created_at: expect.any(String),
                email: "alice@tdb.local",
                fonction: "Directrice",
                nom: "Boucher",
                prenom: "Alice",
                telephone: "0102030405",
              },
              {
                _id: expect.any(String),
                created_at: expect.any(String),
                email: "corinne@tdb.local",
                fonction: "Service administratif",
                nom: "Jean",
                prenom: "Corinne",
                telephone: "0102030406",
              },

              // cas spécial quand on a créé l'utilisateur de test dans l'organisation cible
              ...(organisationLabel === "OF cible"
                ? [
                    {
                      _id: expect.any(String),
                      created_at: expect.any(String),
                      email: "OFA UAI : 0000000A - SIRET : 00000000000018@tdb.local",
                      fonction: "Responsable administratif",
                      nom: "Dupont",
                      prenom: "Jean",
                      telephone: "",
                    },
                  ]
                : []),
            ]);
          } else {
            expectForbiddenError(response);
          }
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
          "CARIF OREF régional même région": true,
          "CARIF OREF régional autre région": false,
          "DDETS même département": true,
          "DDETS autre département": false,
          "Académie même académie": true,
          "Académie autre académie": false,
          "Opérateur public national": true,
          "CARIF OREF national": true,
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
          "CARIF OREF régional même région": true,
          "CARIF OREF régional autre région": true,
          "DDETS même département": true,
          "DDETS autre département": true,
          "Académie même académie": true,
          "Académie autre académie": true,
          "Opérateur public national": true,
          "CARIF OREF national": true,
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

  describe("GET /organismes/:id/indicateurs/effectifs/par-formation - indicateurs effectifs d'un organisme par formation", () => {
    const date = "2022-10-10T00:00:00.000Z";
    const anneeScolaire = "2022-2023";

    const ficheRNCP: Rncp = {
      rncp: "RNCP34956",
      actif: true,
      etat_fiche: "Publiée",
      intitule: "Arts de la cuisine",
      niveau: 4,
      romes: ["G1602"],
    };

    beforeEach(async () => {
      await Promise.all([
        effectifsDb().insertOne(
          createSampleEffectif({
            ...commonEffectifsAttributes,
            annee_scolaire: anneeScolaire,
            apprenant: {
              historique_statut: historySequenceInscritToApprenti,
            },
            formation: {
              rncp: ficheRNCP.rncp,
            },
          })
        ),
        rncpDb().insertOne({ ...ficheRNCP }), // la copie par destructuring évite à insertOne d'ajouter _id à l'objet
      ]);
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get(
        `/api/v1/organismes/${id(1)}/indicateurs/effectifs/par-formation?date=${date}`
      );

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
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
          "CARIF OREF régional même région": true,
          "CARIF OREF régional autre région": false,
          "DDETS même département": true,
          "DDETS autre département": false,
          "Académie même académie": true,
          "Académie autre académie": false,
          "Opérateur public national": true,
          "CARIF OREF national": true,
          Administrateur: true,
        },
        async (organisation, allowed) => {
          const response = await requestAsOrganisation(
            organisation,
            "get",
            `/api/v1/organismes/${id(1)}/indicateurs/effectifs/par-formation?date=${date}`
          );

          if (allowed) {
            expect(response.status).toStrictEqual(200);
            expect(response.data).toStrictEqual([
              {
                rncp_code: ficheRNCP.rncp,
                rncp: ficheRNCP,
                apprenants: 1,
                apprentis: 1,
                inscritsSansContrat: 0,
                rupturants: 0,
                abandons: 0,
              } satisfies IndicateursEffectifsAvecFormation,
            ]);
          } else {
            expectForbiddenError(response);
          }
        }
      );
    });

    // TODO vérifier chaque filtre
  });

  describe("PUT /organismes/:id/configure-erp - configuration du mode de transmission d'un organisme", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.put(`/api/v1/organismes/${id(1)}/configure-erp`, {
        mode_de_transmission: "MANUEL",
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
          "CARIF OREF régional même région": false,
          "CARIF OREF régional autre région": false,
          "DDETS même département": false,
          "DDETS autre département": false,
          "Académie même académie": false,
          "Académie autre académie": false,
          "Opérateur public national": false,
          "CARIF OREF national": false,
          Administrateur: true,
        },
        async (organisation, allowed) => {
          const response = await requestAsOrganisation(
            organisation,
            "put",
            `/api/v1/organismes/${id(1)}/configure-erp`,
            {
              mode_de_transmission: "MANUEL",
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

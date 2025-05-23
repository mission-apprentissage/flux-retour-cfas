import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { addDays } from "date-fns";
import { ObjectId } from "mongodb";
import { IndicateursEffectifsAvecFormation } from "shared";
import { PermissionsOrganisme } from "shared/constants/permissions";
import { IOrganisme } from "shared/models/data/organismes.model";
import { it, expect, describe, beforeEach } from "vitest";

import { createComputedStatutObject } from "@/common/actions/effectifs.statut.actions";
import { effectifsDb, organisationsDb, organismesDb, reseauxDb, usersMigrationDb } from "@/common/model/collections";
import { createSampleEffectif, createRandomFormation } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";
import {
  PermissionsTestConfig,
  commonEffectifsAttributes,
  organismes,
  testPermissions,
  organismesByLabel,
  organismeCibleId,
  profilsPermissionByLabel,
  reseaux,
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
    configurerModeTransmission: true,
  },
  "OF responsable": {
    effectifsNominatifs: true,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: true,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  "OF formateur": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: false,
    manageEffectifs: false,
    viewContacts: false,
    configurerModeTransmission: false,
  },
  "OF non lié": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: false,
    manageEffectifs: false,
    viewContacts: false,
    configurerModeTransmission: false,
  },
  "Tête de réseau même réseau": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  "Tête de réseau Responsable": {
    effectifsNominatifs: true,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: true,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  "Tête de réseau autre réseau": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: false,
    manageEffectifs: false,
    viewContacts: false,
    configurerModeTransmission: false,
  },
  "DREETS même région": {
    effectifsNominatifs: ["inscritSansContrat", "rupturant", "abandon"],
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  "DREETS autre région": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: false,
    configurerModeTransmission: false,
  },
  "DRAFPIC régional même région": {
    effectifsNominatifs: ["inscritSansContrat", "rupturant", "abandon"],
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  "DRAFPIC régional autre région": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: false,
    configurerModeTransmission: false,
  },
  "DRAAF même région": {
    effectifsNominatifs: ["inscritSansContrat", "rupturant", "abandon"],
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  "DRAAF autre région": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: false,
    configurerModeTransmission: false,
  },
  "Conseil Régional même région": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  "Conseil Régional autre région": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: false,
    configurerModeTransmission: false,
  },
  "CARIF OREF régional même région": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  "CARIF OREF régional autre région": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: false,
    configurerModeTransmission: false,
  },
  "DDETS même département": {
    effectifsNominatifs: ["inscritSansContrat", "rupturant", "abandon"],
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  "DDETS autre département": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: false,
    configurerModeTransmission: false,
  },
  "Académie même académie": {
    effectifsNominatifs: ["inscritSansContrat", "rupturant", "abandon"],
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  "Académie autre académie": {
    effectifsNominatifs: false,
    indicateursEffectifs: false,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: false,
    configurerModeTransmission: false,
  },
  "Opérateur public national": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  "CARIF OREF national": {
    effectifsNominatifs: false,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: false,
    viewContacts: true,
    configurerModeTransmission: false,
  },
  Administrateur: {
    effectifsNominatifs: true,
    indicateursEffectifs: true,
    infoTransmissionEffectifs: true,
    manageEffectifs: true,
    viewContacts: true,
    configurerModeTransmission: true,
  },
};

describe("Routes /organismes/:id", () => {
  useNock();
  useMongo();
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });
  beforeEach(async () => {
    await organismesDb().insertMany(organismes);
    await reseauxDb().insertMany(reseaux);
  });

  describe("GET /organismes/:id - détail d'un organisme", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organismes/${id(1)}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      const publicKeys: (keyof IOrganisme)[] = [
        "_id",
        "siret",
        "uai",
        "ferme",
        "nature",
        "qualiopi",
        "enseigne",
        "raison_sociale",
        "reseaux",
        "adresse",
        "organismesResponsables",
        "organismesFormateurs",
        "fiabilisation_statut",
      ];
      const infoTransmissionEffectifsKeys: (keyof IOrganisme)[] = [
        ...publicKeys,
        "erps",
        "erp_unsupported",
        "first_transmission_date",
        "last_transmission_date",
        "mode_de_transmission",
        "mode_de_transmission_configuration_date",
        "mode_de_transmission_configuration_author_fullname",
      ];
      const manageEffectifsKeys: (keyof IOrganisme)[] = [
        ...infoTransmissionEffectifsKeys,
        "api_key",
        "api_configuration_date",
        "api_siret",
        "api_uai",
      ];

      testPermissions<(keyof IOrganisme)[]>(
        {
          "OF cible": manageEffectifsKeys,
          "OF responsable": manageEffectifsKeys,
          "OF formateur": publicKeys,
          "OF non lié": publicKeys,
          "Tête de réseau même réseau": infoTransmissionEffectifsKeys,
          "Tête de réseau Responsable": manageEffectifsKeys,
          "Tête de réseau autre réseau": publicKeys,
          "DREETS même région": infoTransmissionEffectifsKeys,
          "DREETS autre région": infoTransmissionEffectifsKeys,
          "DRAFPIC régional même région": infoTransmissionEffectifsKeys,
          "DRAFPIC régional autre région": infoTransmissionEffectifsKeys,
          "DRAAF même région": infoTransmissionEffectifsKeys,
          "DRAAF autre région": infoTransmissionEffectifsKeys,
          "Conseil Régional même région": infoTransmissionEffectifsKeys,
          "Conseil Régional autre région": infoTransmissionEffectifsKeys,
          "CARIF OREF régional même région": infoTransmissionEffectifsKeys,
          "CARIF OREF régional autre région": infoTransmissionEffectifsKeys,
          "DDETS même département": infoTransmissionEffectifsKeys,
          "DDETS autre département": infoTransmissionEffectifsKeys,
          "Académie même académie": infoTransmissionEffectifsKeys,
          "Académie autre académie": infoTransmissionEffectifsKeys,
          "Opérateur public national": infoTransmissionEffectifsKeys,
          "CARIF OREF national": infoTransmissionEffectifsKeys,
          Administrateur: manageEffectifsKeys,
        },
        async (organisation, keys, organisationLabel) => {
          const response = await requestAsOrganisation(organisation, "get", `/api/v1/organismes/${organismeCibleId}`);
          if (keys.length === 0) {
            expect(response.status).toStrictEqual(403);
          } else {
            expect(response.status).toStrictEqual(200);
            const expected = keys.reduce(
              (acc, key) => {
                if (organismesByLabel["OF cible"][key] !== undefined) {
                  acc[key] = organismesByLabel["OF cible"][key];
                }

                return acc;
              },
              {
                permissions: permissionsByOrganisation[organisationLabel as string],
              }
            );

            expect(response.data).toMatchObject(JSON.parse(JSON.stringify(expected)));
          }
        }
      );
    });
  });

  describe("GET /organismes/:id/contacts - liste des contacts d'un organisme", () => {
    beforeEach(async () => {
      await Promise.all([
        organisationsDb().insertMany(Object.values(profilsPermissionByLabel)),
        usersMigrationDb().insertMany([
          {
            _id: new ObjectId(),
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
            organisation_id: profilsPermissionByLabel["OF cible"]._id,
          },
          {
            _id: new ObjectId(),
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
            organisation_id: profilsPermissionByLabel["OF cible"]._id,
          },
        ]),
      ]);
    });

    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organismes/${id(1)}/contacts`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      testPermissions<boolean>(
        {
          "OF cible": true,
          "OF responsable": true,
          "OF formateur": false,
          "OF non lié": false,
          "Tête de réseau même réseau": true,
          "Tête de réseau Responsable": true,
          "Tête de réseau autre réseau": false,
          "DREETS même région": true,
          "DREETS autre région": false,
          "DRAFPIC régional même région": true,
          "DRAFPIC régional autre région": false,
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
        async (organisation, allowed, organisationLabel) => {
          const response = await requestAsOrganisation(
            organisation,
            "get",
            `/api/v1/organismes/${organismeCibleId}/contacts`
          );
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
    const ANNEE_SCOLAIRE = "2022-2023";
    const date = "2023-04-13T10:00:00.000Z";

    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organisme/${id(1)}/indicateurs/effectifs?date=${date}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      beforeEach(async () => {
        effectifsDb().insertMany([
          // 5 apprentis
          ...(await generate(5, async () => {
            const effectif = {
              _id: new ObjectId(),
              ...(await createSampleEffectif({
                ...(await commonEffectifsAttributes()),
                formation: createRandomFormation(ANNEE_SCOLAIRE, new Date(date)),
                annee_scolaire: ANNEE_SCOLAIRE,
                contrats: [
                  {
                    date_debut: new Date(date),
                  },
                ],
              })),
            };

            const effectifGenerated = {
              ...effectif,
              _computed: {
                ...effectif._computed,
                statut: createComputedStatutObject(effectif, new Date(date)),
              },
            };

            return effectifGenerated;
          })),

          // 10 Inscrit
          ...(await generate(10, async () => {
            const moinsDe90Jours = new Date(new Date(date).getTime());
            moinsDe90Jours.setDate(moinsDe90Jours.getDate() + 89);

            return {
              _id: new ObjectId(),
              ...(await createSampleEffectif({
                ...(await commonEffectifsAttributes()),
                formation: createRandomFormation(ANNEE_SCOLAIRE, new Date(date)),
                annee_scolaire: ANNEE_SCOLAIRE,
              })),
            };
          })),

          // // 15 ApprentiToAbandon
          ...(await generate(15, async () => {
            const plusDe180Jours = new Date(new Date(date).getTime());
            plusDe180Jours.setDate(plusDe180Jours.getDate() - 191);

            const effectif = {
              _id: new ObjectId(),
              ...(await createSampleEffectif({
                ...(await commonEffectifsAttributes()),
                formation: createRandomFormation(ANNEE_SCOLAIRE, plusDe180Jours),
                annee_scolaire: ANNEE_SCOLAIRE,
                contrats: [
                  {
                    date_debut: plusDe180Jours,
                    date_fin: plusDe180Jours,
                    date_rupture: plusDe180Jours,
                  },
                ],
              })),
            };

            const effectifGenerated = {
              ...effectif,
              _computed: {
                ...effectif._computed,
                statut: createComputedStatutObject(effectif, new Date(date)),
              },
            };

            return effectifGenerated;
          })),

          // 20 ApprentiToInscrit
          ...(await generate(20, async () => {
            const effectif = {
              _id: new ObjectId(),
              ...(await createSampleEffectif({
                ...(await commonEffectifsAttributes()),
                formation: createRandomFormation(ANNEE_SCOLAIRE, new Date(date)),
                annee_scolaire: ANNEE_SCOLAIRE,
                contrats: [
                  {
                    date_debut: addDays(new Date(date), -100),
                    date_fin: addDays(new Date(date), 50),
                    date_rupture: new Date(date),
                  },
                ],
              })),
            };

            const effectifGenerated = {
              ...effectif,
              _computed: {
                ...effectif._computed,
                statut: createComputedStatutObject(effectif, new Date(date)),
              },
            };

            return effectifGenerated;
          })),
        ]);
      });

      // "Tête de réseau Responsable" is difficult to test using current test case fixtures & structure
      testPermissions<boolean, "Tête de réseau Responsable">(
        {
          "OF cible": true,
          "OF responsable": true,
          "OF formateur": false,
          "OF non lié": false,
          "Tête de réseau même réseau": true,
          // "Tête de réseau Responsable": true,
          "Tête de réseau autre réseau": false,
          "DREETS même région": true,
          "DREETS autre région": false,
          "DRAFPIC régional même région": true,
          "DRAFPIC régional autre région": false,
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
              inscrits: 10,
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
          "Tête de réseau Responsable": true,
          "Tête de réseau autre réseau": true,
          "DREETS même région": true,
          "DREETS autre région": true,
          "DRAFPIC régional même région": true,
          "DRAFPIC régional autre région": true,
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

    beforeEach(async () => {
      await Promise.all([
        effectifsDb().insertOne({
          _id: new ObjectId(),
          ...(await createSampleEffectif({
            ...(await commonEffectifsAttributes()),
            formation: {
              ...createRandomFormation(anneeScolaire, new Date(date)),
              rncp: "RNCP37682",
              cfd: "36T32603",
              libelle_long: "TECHNICIEN SUPERIEUR SYSTEMES ET RESEAUX (TP)",
              niveau: "5",
            },
            annee_scolaire: anneeScolaire,
            contrats: [
              {
                date_debut: new Date(date),
              },
            ],
          })),
        }),
      ]);
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get(
        `/api/v1/organismes/${id(1)}/indicateurs/effectifs/par-formation?date=${date}`
      );

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      // "Tête de réseau Responsable" is difficult to test using current test case fixtures & structure
      testPermissions<boolean, "Tête de réseau Responsable">(
        {
          "OF cible": true,
          "OF responsable": true,
          "OF formateur": false,
          "OF non lié": false,
          "Tête de réseau même réseau": true,
          // "Tête de réseau Responsable": true,
          "Tête de réseau autre réseau": false,
          "DREETS même région": true,
          "DREETS autre région": false,
          "DRAFPIC régional même région": true,
          "DRAFPIC régional autre région": false,
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
                rncp_code: "RNCP37682",
                cfd_code: "36T32603",
                intitule: "TECHNICIEN SUPERIEUR SYSTEMES ET RESEAUX (TP)",
                niveau_europeen: "5",
                apprenants: 1,
                apprentis: 1,
                inscrits: 0,
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
          "OF responsable": false,
          "Tête de réseau même réseau": false,
          "Tête de réseau Responsable": false,
          "Tête de réseau autre réseau": false,
          "DREETS même région": false,
          "DREETS autre région": false,
          "DRAFPIC régional même région": false,
          "DRAFPIC régional autre région": false,
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

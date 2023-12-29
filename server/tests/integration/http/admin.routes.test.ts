import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { addDays } from "date-fns";
import { ObjectId } from "mongodb";

import { createOrganisme } from "@/common/actions/organismes/organismes.actions";
import { getUsersLinkedToOrganismeId } from "@/common/actions/users.actions";
import { auditLogsDb, effectifsDb, organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { getCurrentTime } from "@/common/utils/timeUtils";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { PermissionsTestConfig, testPermissions } from "@tests/utils/permissions";
import {
  RequestAsOrganisationFunc,
  expectUnauthorizedError,
  generate,
  id,
  initTestApp,
  testPasswordHash,
} from "@tests/utils/testUtils";

import { sampleOrganismeWithUAI, sampleOrganismeWithoutUai } from "../common/actions/organismes.actions.test";

let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("Routes administrateur", () => {
  useMongo();
  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });

  describe("GET / - organismes-duplicates", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.post("/api/v1/admin/organismes-duplicates");
      expectUnauthorizedError(response);
    });

    it("Vérifie qu'on renvoie un tableau vide si aucun organisme en base", async () => {
      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/organismes-duplicates"
      );

      expect(response.status).toBe(200);

      assert.deepStrictEqual(response.data, []);
    });

    it("Vérifie qu'on renvoie 2 organismes si 2 organismes en base : un avec UAI et un sans", async () => {
      const createdWithUai = await createOrganisme(sampleOrganismeWithUAI);
      const createdWithoutUai = await createOrganisme(sampleOrganismeWithoutUai);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/organismes-duplicates"
      );

      expect(response.status).toBe(200);

      expect(response.data[0]._id).toEqual({ siret: createdWithUai.siret });
      expect(response.data[0].count).toEqual(2);
      expect(new Set(response.data[0].duplicates)).toEqual(
        new Set([
          {
            id: createdWithoutUai._id.toString(),
            siret: createdWithoutUai.siret,
            nom: createdWithoutUai.nom,
            ferme: createdWithoutUai.ferme,
            nature: createdWithoutUai.nature,
            nbUsers: 0,
            created_at: createdWithoutUai.created_at.toISOString(),
            updated_at: createdWithoutUai.updated_at.toISOString(),
          },
          {
            id: createdWithUai._id.toString(),
            uai: createdWithUai.uai,
            siret: createdWithUai.siret,
            nom: createdWithUai.nom,
            ferme: createdWithUai.ferme,
            nature: createdWithUai.nature,
            nbUsers: 0,
            created_at: createdWithUai.created_at.toISOString(),
            updated_at: createdWithUai.updated_at.toISOString(),
          },
        ])
      );
    });

    it("Vérifie qu'on renvoie 2 organismes et 2 utilisateurs liés sur l'organisme fiable", async () => {
      const createdWithUai = await createOrganisme(sampleOrganismeWithUAI);
      const createdWithoutUai = await createOrganisme(sampleOrganismeWithoutUai);

      await Promise.all([
        organisationsDb().insertOne({
          _id: new ObjectId(id(1)),
          type: "ORGANISME_FORMATION",
          uai: createdWithUai.uai as string,
          siret: createdWithUai.siret,
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

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/organismes-duplicates"
      );

      expect(response.status).toBe(200);

      expect(response.data[0]._id).toEqual({ siret: createdWithUai.siret });
      expect(response.data[0].count).toEqual(2);
      expect(new Set(response.data[0].duplicates)).toEqual(
        new Set([
          {
            id: createdWithoutUai._id.toString(),
            siret: createdWithoutUai.siret,
            nom: createdWithoutUai.nom,
            ferme: createdWithoutUai.ferme,
            nature: createdWithoutUai.nature,
            nbUsers: 0,
            created_at: createdWithoutUai.created_at.toISOString(),
            updated_at: createdWithoutUai.updated_at.toISOString(),
          },
          {
            id: createdWithUai._id.toString(),
            uai: createdWithUai.uai,
            siret: createdWithUai.siret,
            nom: createdWithUai.nom,
            ferme: createdWithUai.ferme,
            nature: createdWithUai.nature,
            // nbUsers: 2,
            nbUsers: 0,
            created_at: createdWithUai.created_at.toISOString(),
            updated_at: createdWithUai.updated_at.toISOString(),
          },
        ])
      );
    });
  });

  describe("POST / - fusion-organismes", () => {
    beforeEach(async () => {
      await Promise.all([
        () => organismesDb().deleteMany({}),
        () => organisationsDb().deleteMany({}),
        () => effectifsDb().deleteMany({}),
      ]);
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.post("/api/v1/admin/fusion-organismes");
      expectUnauthorizedError(response);
    });

    it("Vérifie la fusion de 2 organismes sans effectifs ni comptes utilisateurs", async () => {
      const createdWithUai = await createOrganisme(sampleOrganismeWithUAI);
      const createdWithoutUai = await createOrganisme(sampleOrganismeWithoutUai);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/fusion-organismes",
        { organismeFiableId: createdWithUai._id, organismeSansUaiId: createdWithoutUai._id }
      );

      expect(response.status).toBe(200);

      expect(await organismesDb().countDocuments({ _id: createdWithoutUai._id })).toBe(0);
      expect(await organismesDb().countDocuments({ _id: createdWithUai._id })).toBe(1);
    });

    it("Vérifie la fusion de 2 organismes avec effectifs sur le non fiable et avec comptes utilisateurs", async () => {
      const createdWithUai = await createOrganisme(sampleOrganismeWithUAI);
      const createdWithoutUai = await createOrganisme(sampleOrganismeWithoutUai);

      await Promise.all([
        organisationsDb().insertOne({
          _id: new ObjectId(id(1)),
          type: "ORGANISME_FORMATION",
          uai: null,
          siret: createdWithUai.siret,
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
        effectifsDb().insertMany([
          // effectifs sur le non fiable
          ...generate(5, () => createSampleEffectif({ organisme_id: createdWithoutUai._id })),
        ]),
      ]);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/fusion-organismes",
        { organismeFiableId: createdWithUai._id, organismeSansUaiId: createdWithoutUai._id }
      );

      expect(response.status).toBe(200);

      expect(await organismesDb().countDocuments({ _id: createdWithoutUai._id })).toBe(0);
      expect(await organismesDb().countDocuments({ _id: createdWithUai._id })).toBe(1);
      expect((await getUsersLinkedToOrganismeId(createdWithUai._id)).map(({ _id, ...user }) => user)).toStrictEqual([
        {
          civility: "Madame",
          nom: "Boucher",
          prenom: "Alice",
          email: "alice@tdb.local",
          telephone: "0102030405",
        },
        {
          civility: "Madame",
          nom: "Jean",
          prenom: "Corinne",
          email: "corinne@tdb.local",
          telephone: "0102030406",
        },
      ]);
      expect(await effectifsDb().countDocuments({ organisme_id: createdWithUai._id })).toBe(5);
      expect(await effectifsDb().countDocuments({ organisme_id: createdWithoutUai._id })).toBe(0);
      expect(await auditLogsDb().countDocuments({ action: "mergeOrganismeSansUaiDansOrganismeFiable-init" })).toBe(1);
      expect(await auditLogsDb().countDocuments({ action: "mergeOrganismeSansUaiDansOrganismeFiable-end" })).toBe(1);
    });

    it("Vérifie la fusion de 2 organismes avec effectifs sur le non fiable et le fiable et avec comptes utilisateurs", async () => {
      const createdWithUai = await createOrganisme(sampleOrganismeWithUAI);
      const createdWithoutUai = await createOrganisme(sampleOrganismeWithoutUai);
      const anneeScolaire = "2022-2023";

      await Promise.all([
        organisationsDb().insertOne({
          _id: new ObjectId(id(1)),
          type: "ORGANISME_FORMATION",
          uai: null,
          siret: createdWithUai.siret,
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
        effectifsDb().insertMany([
          // 5 apprentis sur le non fiable
          ...generate(5, () =>
            createSampleEffectif({
              organisme_id: createdWithoutUai._id,
              annee_scolaire: anneeScolaire,
            })
          ),

          // 10 Inscrit sur le fiable
          ...generate(10, () =>
            createSampleEffectif({
              organisme_id: createdWithUai._id,
              annee_scolaire: anneeScolaire,
            })
          ),
        ]),
      ]);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/fusion-organismes",
        { organismeFiableId: createdWithUai._id, organismeSansUaiId: createdWithoutUai._id }
      );

      expect(response.status).toBe(200);

      expect(await organismesDb().countDocuments({ _id: createdWithoutUai._id })).toBe(0);
      expect(await organismesDb().countDocuments({ _id: createdWithUai._id })).toBe(1);
      expect((await getUsersLinkedToOrganismeId(createdWithUai._id)).map(({ _id, ...user }) => user)).toStrictEqual([
        {
          civility: "Madame",
          nom: "Boucher",
          prenom: "Alice",
          email: "alice@tdb.local",
          telephone: "0102030405",
        },
        {
          civility: "Madame",
          nom: "Jean",
          prenom: "Corinne",
          email: "corinne@tdb.local",
          telephone: "0102030406",
        },
      ]);
      expect(await effectifsDb().countDocuments({ organisme_id: createdWithUai._id })).toBe(15);
      expect(await effectifsDb().countDocuments({ organisme_id: createdWithoutUai._id })).toBe(0);
      expect(await auditLogsDb().countDocuments({ action: "mergeOrganismeSansUaiDansOrganismeFiable-init" })).toBe(1);
      expect(await auditLogsDb().countDocuments({ action: "mergeOrganismeSansUaiDansOrganismeFiable-end" })).toBe(1);
    });

    it("Vérifie la fusion de 2 organismes avec effectifs en doublons", async () => {
      const createdWithUai = await createOrganisme(sampleOrganismeWithUAI);
      const createdWithoutUai = await createOrganisme(sampleOrganismeWithoutUai);
      const anneeScolaire = "2022-2023";
      const commonEffectifs = [
        ...generate(3, () => createSampleEffectif({ annee_scolaire: anneeScolaire, source: "testDoublons" })),
      ];
      const duplicateRecentDate = addDays(new Date(), -1);
      const duplicateOldDate = addDays(new Date(), -20);

      await Promise.all([
        organisationsDb().insertOne({
          _id: new ObjectId(id(1)),
          type: "ORGANISME_FORMATION",
          uai: null,
          siret: createdWithUai.siret,
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
        // Insertion des effectifs en doublon sur les 2 organismes avec les plus récents sur l'organisme sans UAI
        effectifsDb().insertMany(
          [
            ...commonEffectifs.map((item) => ({
              ...item,
              organisme_id: createdWithUai._id,
              created_at: duplicateOldDate,
            })),
            ...commonEffectifs.map((item) => ({
              ...item,
              organisme_id: createdWithoutUai._id,
              created_at: duplicateRecentDate,
            })),
          ],
          { bypassDocumentValidation: true }
        ),
        // Insertion d'effectifs distincts sur les 2 organismes
        effectifsDb().insertMany([
          ...generate(6, () =>
            createSampleEffectif({
              annee_scolaire: anneeScolaire,
              organisme_id: createdWithUai._id,
              created_at: new Date(),
            })
          ),
          ...generate(4, () =>
            createSampleEffectif({
              annee_scolaire: anneeScolaire,
              organisme_id: createdWithoutUai._id,
              created_at: new Date(),
            })
          ),
        ]),
      ]);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/fusion-organismes",
        { organismeFiableId: createdWithUai._id, organismeSansUaiId: createdWithoutUai._id }
      );

      expect(response.status).toBe(200);

      // Vérification des organismes
      expect(await organismesDb().countDocuments({ _id: createdWithoutUai._id })).toBe(0);
      expect(await organismesDb().countDocuments({ _id: createdWithUai._id })).toBe(1);

      // Vérification des utilisateurs liés
      expect((await getUsersLinkedToOrganismeId(createdWithUai._id)).map(({ _id, ...user }) => user)).toStrictEqual([
        {
          civility: "Madame",
          nom: "Boucher",
          prenom: "Alice",
          email: "alice@tdb.local",
          telephone: "0102030405",
        },
        {
          civility: "Madame",
          nom: "Jean",
          prenom: "Corinne",
          email: "corinne@tdb.local",
          telephone: "0102030406",
        },
      ]);

      // Vérification du nombre d'effectifs
      expect(await effectifsDb().countDocuments({ organisme_id: createdWithUai._id })).toBe(9);
      expect(await effectifsDb().countDocuments({ organisme_id: createdWithoutUai._id })).toBe(0);

      // Vérification du nombre d'effectifs avec la date la plus récente
      const effectifsExDoublons = await effectifsDb()
        .find({ organisme_id: createdWithUai._id, source: "testDoublons" })
        .toArray();
      expect(effectifsExDoublons.length).toBe(3);
      effectifsExDoublons
        .map((item) => item.created_at)
        .forEach((created_at) => expect(created_at?.getTime()).toEqual(duplicateRecentDate.getTime()));

      expect(await auditLogsDb().countDocuments({ action: "mergeOrganismeSansUaiDansOrganismeFiable-init" })).toBe(1);
      expect(await auditLogsDb().countDocuments({ action: "mergeOrganismeSansUaiDansOrganismeFiable-end" })).toBe(1);
    });
  });

  describe("GET / - organismes/id/parametrage-transmission", () => {
    describe("Vérification des droits d'accès", () => {
      let organismeTest;

      beforeEach(async () => {
        organismeTest = await createOrganisme(sampleOrganismeWithUAI);
      });

      it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
        const response = await httpClient.post(
          `/api/v1/admin/organismes/${organismeTest?._id}/parametrage-transmission`
        );
        expectUnauthorizedError(response);
      });

      describe("Vérifie qu'on ne peut pas accéder à la route sans être administrateur", () => {
        const accesOrganisme: PermissionsTestConfig<boolean> = {
          "OF cible": false,
          "OF responsable": false,
          Administrateur: true,
          "OF non lié": false,
          "OF formateur": false,
          "Tête de réseau même réseau": false,
          "Tête de réseau Responsable": false,
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
        };

        testPermissions(accesOrganisme, async (organisation, allowed) => {
          const response = await requestAsOrganisation(
            organisation,
            "get",
            `/api/v1/admin/organismes/${organismeTest?._id}/parametrage-transmission`
          );
          expect(response.status).toStrictEqual(allowed ? 200 : 403);
        });
      });
    });

    it("Vérifie qu'on renvoie une exception si aucun organisme en base", async () => {
      const response = await httpClient.post(`/api/v1/admin/organismes/${new ObjectId(18)}/parametrage-transmission`);
      expect(response.status).toBe(401);
    });

    it("Vérifie qu'on renvoie des informations de transmissions sur un organisme transmettant avec l'API si on est authentifié en administrateur", async () => {
      const sampleTransmissionDate = addDays(new Date(), -10);
      const sampleConfigurationDate = addDays(new Date(), -15);

      const organismeTransmissionApiTest = await createOrganisme({
        ...sampleOrganismeWithUAI,
        erps: ["ERP_TEST"],
        last_transmission_date: sampleTransmissionDate,
        mode_de_transmission: "API",
        api_version: "V2",
        mode_de_transmission_configuration_date: sampleConfigurationDate,
        api_key: "SAMPLE_API_KEY",
      });

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        `/api/v1/admin/organismes/${organismeTransmissionApiTest?._id}/parametrage-transmission`
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        transmission_date: sampleTransmissionDate.toISOString(),
        transmission_api_active: true,
        transmission_api_version: "V2",
        transmission_manuelle_active: false,
        api_key_active: true,
        parametrage_erp_active: true,
        parametrage_erp_date: sampleConfigurationDate.toISOString(),
        erps: ["ERP_TEST"],
      });
    });

    it("Vérifie qu'on renvoie des informations de transmissions sur un organisme transmettant manuellement si on est authentifié en administrateur", async () => {
      const sampleTransmissionDate = addDays(new Date(), -10);
      const sampleConfigurationDate = addDays(new Date(), -15);

      const organismeTransmissionManuelleTest = await createOrganisme({
        ...sampleOrganismeWithUAI,
        erps: ["ERP_TEST2"],
        last_transmission_date: sampleTransmissionDate,
        mode_de_transmission: "MANUEL",
        mode_de_transmission_configuration_date: sampleConfigurationDate,
        api_key: "SAMPLE_API_KEY",
      });

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        `/api/v1/admin/organismes/${organismeTransmissionManuelleTest?._id}/parametrage-transmission`
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        transmission_date: sampleTransmissionDate.toISOString(),
        transmission_api_active: false,
        transmission_manuelle_active: true,
        api_key_active: true,
        parametrage_erp_active: true,
        parametrage_erp_date: sampleConfigurationDate.toISOString(),
        erps: ["ERP_TEST2"],
      });
    });
  });
});

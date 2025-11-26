import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { addDays } from "date-fns";
import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import type { IOrganisme } from "shared/models";
import { it, expect, describe, beforeEach } from "vitest";

import {
  auditLogsDb,
  effectifsDb,
  missionLocaleEffectifsDb,
  missionLocaleStatsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
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

import {
  sampleOrganismeWithUAIOutput,
  sampleOrganismeWithoutUAIOutput,
} from "../common/actions/organismes.actions.test";

let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

const getUsersLinkedToOrganismeId = async (organismeId: ObjectId) => {
  return await usersMigrationDb()
    .aggregate([
      {
        $lookup: {
          from: "organisations",
          localField: "organisation_id",
          foreignField: "_id",
          as: "organisation",
          pipeline: [
            {
              $lookup: {
                from: "organismes",
                as: "organisme",
                let: {
                  uai: "$uai",
                  siret: "$siret",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          { $and: [{ $eq: ["$siret", "$$siret"] }, { $eq: ["$uai", "$$uai"] }] },
                          { $and: [{ $eq: ["$siret", "$$siret"] }, { $eq: [null, "$$uai"] }] },
                        ],
                      },
                    },
                  },
                ],
              },
            },
            { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },
          ],
        },
      },
      { $unwind: { path: "$organisation", preserveNullAndEmptyArrays: true } },
      { $match: { "organisation.organisme._id": organismeId } },
      {
        $project: {
          civility: 1,
          nom: 1,
          prenom: 1,
          email: 1,
          telephone: 1,
        },
      },
    ])
    .toArray();
};

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
      await organismesDb().insertMany([sampleOrganismeWithUAIOutput, sampleOrganismeWithoutUAIOutput]);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/organismes-duplicates"
      );

      expect(response.status).toBe(200);

      expect(response.data[0]._id).toEqual({ siret: sampleOrganismeWithUAIOutput.siret });
      expect(response.data[0].count).toEqual(2);
      expect(new Set(response.data[0].duplicates)).toEqual(
        new Set([
          {
            id: sampleOrganismeWithoutUAIOutput._id.toString(),
            siret: sampleOrganismeWithoutUAIOutput.siret,
            nom: sampleOrganismeWithoutUAIOutput.nom,
            ferme: sampleOrganismeWithoutUAIOutput.ferme,
            nature: sampleOrganismeWithoutUAIOutput.nature,
            nbUsers: 0,
            created_at: sampleOrganismeWithoutUAIOutput.created_at.toISOString(),
            updated_at: sampleOrganismeWithoutUAIOutput.updated_at.toISOString(),
          },
          {
            id: sampleOrganismeWithUAIOutput._id.toString(),
            uai: sampleOrganismeWithUAIOutput.uai,
            siret: sampleOrganismeWithUAIOutput.siret,
            nom: sampleOrganismeWithUAIOutput.nom,
            ferme: sampleOrganismeWithUAIOutput.ferme,
            nature: sampleOrganismeWithUAIOutput.nature,
            nbUsers: 0,
            created_at: sampleOrganismeWithUAIOutput.created_at.toISOString(),
            updated_at: sampleOrganismeWithUAIOutput.updated_at.toISOString(),
          },
        ])
      );
    });

    it("Vérifie qu'on renvoie 2 organismes et 2 utilisateurs liés sur l'organisme fiable", async () => {
      await organismesDb().insertMany([sampleOrganismeWithUAIOutput, sampleOrganismeWithoutUAIOutput]);

      await Promise.all([
        organisationsDb().insertOne({
          _id: new ObjectId(id(1)),
          type: "ORGANISME_FORMATION",
          uai: sampleOrganismeWithUAIOutput.uai as string,
          siret: sampleOrganismeWithUAIOutput.siret,
          created_at: getCurrentTime(),
        }),
        usersMigrationDb().insertMany([
          {
            _id: new ObjectId(),
            account_status: "CONFIRMED",
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
            _id: new ObjectId(),
            account_status: "CONFIRMED",
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

      expect(response.data[0]._id).toEqual({ siret: sampleOrganismeWithUAIOutput.siret });
      expect(response.data[0].count).toEqual(2);
      expect(new Set(response.data[0].duplicates)).toEqual(
        new Set([
          {
            id: sampleOrganismeWithoutUAIOutput._id.toString(),
            siret: sampleOrganismeWithoutUAIOutput.siret,
            nom: sampleOrganismeWithoutUAIOutput.nom,
            ferme: sampleOrganismeWithoutUAIOutput.ferme,
            nature: sampleOrganismeWithoutUAIOutput.nature,
            nbUsers: 0,
            created_at: sampleOrganismeWithoutUAIOutput.created_at.toISOString(),
            updated_at: sampleOrganismeWithoutUAIOutput.updated_at.toISOString(),
          },
          {
            id: sampleOrganismeWithUAIOutput._id.toString(),
            uai: sampleOrganismeWithUAIOutput.uai,
            siret: sampleOrganismeWithUAIOutput.siret,
            nom: sampleOrganismeWithUAIOutput.nom,
            ferme: sampleOrganismeWithUAIOutput.ferme,
            nature: sampleOrganismeWithUAIOutput.nature,
            // nbUsers: 2,
            nbUsers: 0,
            created_at: sampleOrganismeWithUAIOutput.created_at.toISOString(),
            updated_at: sampleOrganismeWithUAIOutput.updated_at.toISOString(),
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
      await organismesDb().insertMany([sampleOrganismeWithUAIOutput, sampleOrganismeWithoutUAIOutput]);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/fusion-organismes",
        { organismeFiableId: sampleOrganismeWithUAIOutput._id, organismeSansUaiId: sampleOrganismeWithoutUAIOutput._id }
      );

      expect(response.status).toBe(200);

      expect(await organismesDb().countDocuments({ _id: sampleOrganismeWithoutUAIOutput._id })).toBe(0);
      expect(await organismesDb().countDocuments({ _id: sampleOrganismeWithUAIOutput._id })).toBe(1);
    });

    it("Vérifie la fusion de 2 organismes avec effectifs sur le non fiable et avec comptes utilisateurs", async () => {
      await organismesDb().insertMany([sampleOrganismeWithUAIOutput, sampleOrganismeWithoutUAIOutput]);

      await Promise.all([
        organisationsDb().insertOne({
          _id: new ObjectId(id(1)),
          type: "ORGANISME_FORMATION",
          uai: null,
          siret: sampleOrganismeWithUAIOutput.siret,
          created_at: getCurrentTime(),
        }),
        usersMigrationDb().insertMany([
          {
            _id: new ObjectId(),
            account_status: "CONFIRMED",
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
            _id: new ObjectId(),
            account_status: "CONFIRMED",
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
          ...(await generate(5, async () => ({
            _id: new ObjectId(),
            ...(await createSampleEffectif({ organisme_id: sampleOrganismeWithoutUAIOutput._id })),
          }))),
        ]),
      ]);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/fusion-organismes",
        { organismeFiableId: sampleOrganismeWithUAIOutput._id, organismeSansUaiId: sampleOrganismeWithoutUAIOutput._id }
      );

      expect(response.status).toBe(200);

      expect(await organismesDb().countDocuments({ _id: sampleOrganismeWithoutUAIOutput._id })).toBe(0);
      expect(await organismesDb().countDocuments({ _id: sampleOrganismeWithUAIOutput._id })).toBe(1);
      expect(
        (await getUsersLinkedToOrganismeId(sampleOrganismeWithUAIOutput._id)).map(({ _id, ...user }) => user)
      ).toStrictEqual([
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
      expect(await effectifsDb().countDocuments({ organisme_id: sampleOrganismeWithUAIOutput._id })).toBe(5);
      expect(await effectifsDb().countDocuments({ organisme_id: sampleOrganismeWithoutUAIOutput._id })).toBe(0);
      expect(await auditLogsDb().countDocuments({ action: "mergeOrganismeSansUaiDansOrganismeFiable-init" })).toBe(1);
      expect(await auditLogsDb().countDocuments({ action: "mergeOrganismeSansUaiDansOrganismeFiable-end" })).toBe(1);
    });

    it("Vérifie la fusion de 2 organismes avec effectifs sur le non fiable et le fiable et avec comptes utilisateurs", async () => {
      await organismesDb().insertMany([sampleOrganismeWithUAIOutput, sampleOrganismeWithoutUAIOutput]);

      const anneeScolaire = "2022-2023";

      await Promise.all([
        organisationsDb().insertOne({
          _id: new ObjectId(id(1)),
          type: "ORGANISME_FORMATION",
          uai: null,
          siret: sampleOrganismeWithUAIOutput.siret,
          created_at: getCurrentTime(),
        }),
        usersMigrationDb().insertMany([
          {
            _id: new ObjectId(),
            account_status: "CONFIRMED",
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
            _id: new ObjectId(),
            account_status: "CONFIRMED",
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
          ...(await generate(5, async () => ({
            _id: new ObjectId(),
            ...(await createSampleEffectif({
              organisme_id: sampleOrganismeWithoutUAIOutput._id,
              annee_scolaire: anneeScolaire,
            })),
          }))),

          // 10 Inscrit sur le fiable
          ...(await generate(10, async () => ({
            _id: new ObjectId(),
            ...(await createSampleEffectif({
              organisme_id: sampleOrganismeWithUAIOutput._id,
              annee_scolaire: anneeScolaire,
            })),
          }))),
        ]),
      ]);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/fusion-organismes",
        { organismeFiableId: sampleOrganismeWithUAIOutput._id, organismeSansUaiId: sampleOrganismeWithoutUAIOutput._id }
      );

      expect(response.status).toBe(200);

      expect(await organismesDb().countDocuments({ _id: sampleOrganismeWithoutUAIOutput._id })).toBe(0);
      expect(await organismesDb().countDocuments({ _id: sampleOrganismeWithUAIOutput._id })).toBe(1);
      expect(
        (await getUsersLinkedToOrganismeId(sampleOrganismeWithUAIOutput._id)).map(({ _id, ...user }) => user)
      ).toStrictEqual([
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
      expect(await effectifsDb().countDocuments({ organisme_id: sampleOrganismeWithUAIOutput._id })).toBe(15);
      expect(await effectifsDb().countDocuments({ organisme_id: sampleOrganismeWithoutUAIOutput._id })).toBe(0);
      expect(await auditLogsDb().countDocuments({ action: "mergeOrganismeSansUaiDansOrganismeFiable-init" })).toBe(1);
      expect(await auditLogsDb().countDocuments({ action: "mergeOrganismeSansUaiDansOrganismeFiable-end" })).toBe(1);
    });

    it("Vérifie la fusion de 2 organismes avec effectifs en doublons", async () => {
      await organismesDb().insertMany([sampleOrganismeWithUAIOutput, sampleOrganismeWithoutUAIOutput]);

      const anneeScolaire = "2022-2023";
      const commonEffectifs = [
        ...(await generate(
          3,
          async () => await createSampleEffectif({ annee_scolaire: anneeScolaire, source: SOURCE_APPRENANT.ERP })
        )),
      ];
      const duplicateRecentDate = addDays(new Date(), -1);
      const duplicateOldDate = addDays(new Date(), -20);

      await Promise.all([
        organisationsDb().insertOne({
          _id: new ObjectId(id(1)),
          type: "ORGANISME_FORMATION",
          uai: null,
          siret: sampleOrganismeWithUAIOutput.siret,
          created_at: getCurrentTime(),
        }),
        usersMigrationDb().insertMany([
          {
            _id: new ObjectId(),
            account_status: "CONFIRMED",
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
            _id: new ObjectId(),
            account_status: "CONFIRMED",
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
              _id: new ObjectId(),
              organisme_id: sampleOrganismeWithUAIOutput._id,
              created_at: duplicateOldDate,
            })),
            ...commonEffectifs.map((item) => ({
              ...item,
              _id: new ObjectId(),
              organisme_id: sampleOrganismeWithoutUAIOutput._id,
              created_at: duplicateRecentDate,
            })),
          ],
          { bypassDocumentValidation: true }
        ),
        // Insertion d'effectifs distincts sur les 2 organismes
        effectifsDb().insertMany([
          ...(await generate(6, async () => ({
            _id: new ObjectId(),
            ...(await createSampleEffectif({
              annee_scolaire: anneeScolaire,
              organisme_id: sampleOrganismeWithUAIOutput._id,
              created_at: new Date(),
            })),
          }))),
          ...(await generate(4, async () => ({
            _id: new ObjectId(),
            ...(await createSampleEffectif({
              annee_scolaire: anneeScolaire,
              organisme_id: sampleOrganismeWithoutUAIOutput._id,
              created_at: new Date(),
            })),
          }))),
        ]),
      ]);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/fusion-organismes",
        { organismeFiableId: sampleOrganismeWithUAIOutput._id, organismeSansUaiId: sampleOrganismeWithoutUAIOutput._id }
      );

      expect(response.status).toBe(200);

      // Vérification des organismes
      expect(await organismesDb().countDocuments({ _id: sampleOrganismeWithoutUAIOutput._id })).toBe(0);
      expect(await organismesDb().countDocuments({ _id: sampleOrganismeWithUAIOutput._id })).toBe(1);

      // Vérification des utilisateurs liés
      expect(
        (await getUsersLinkedToOrganismeId(sampleOrganismeWithUAIOutput._id)).map(({ _id, ...user }) => user)
      ).toStrictEqual([
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
      expect(await effectifsDb().countDocuments({ organisme_id: sampleOrganismeWithUAIOutput._id })).toBe(9);
      expect(await effectifsDb().countDocuments({ organisme_id: sampleOrganismeWithoutUAIOutput._id })).toBe(0);

      // Vérification du nombre d'effectifs avec la date la plus récente
      const effectifsExDoublons = await effectifsDb()
        .find({ organisme_id: sampleOrganismeWithUAIOutput._id, source: SOURCE_APPRENANT.ERP })
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
      beforeEach(async () => {
        await organismesDb().insertMany([sampleOrganismeWithUAIOutput]);
      });

      it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
        const response = await httpClient.post(
          `/api/v1/admin/organismes/${sampleOrganismeWithUAIOutput._id}/parametrage-transmission`
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
        };

        testPermissions(accesOrganisme, async (organisation, allowed) => {
          const response = await requestAsOrganisation(
            organisation,
            "get",
            `/api/v1/admin/organismes/${sampleOrganismeWithUAIOutput._id}/parametrage-transmission`
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

      const organismeTransmissionApiTest: IOrganisme = {
        ...sampleOrganismeWithUAIOutput,
        erps: ["ERP_TEST"],
        last_transmission_date: sampleTransmissionDate,
        mode_de_transmission: "API",
        api_version: "V2",
        mode_de_transmission_configuration_date: sampleConfigurationDate,
        api_key: "SAMPLE_API_KEY",
      };
      await organismesDb().insertOne(organismeTransmissionApiTest);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        `/api/v1/admin/organismes/${organismeTransmissionApiTest?._id}/parametrage-transmission`
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        transmission_api_active: true,
        transmission_api_version: "V2",
        transmission_manuelle_active: false,
        api_key: "SAMPLE_API_KEY",
        api_key_active: true,
        parametrage_erp_active: true,
        parametrage_erp_date: sampleConfigurationDate.toISOString(),
        erps: ["ERP_TEST"],
      });
    });

    it("Vérifie qu'on renvoie des informations de transmissions sur un organisme transmettant manuellement si on est authentifié en administrateur", async () => {
      const sampleTransmissionDate = addDays(new Date(), -10);
      const sampleConfigurationDate = addDays(new Date(), -15);

      const organismeTransmissionManuelleTest: IOrganisme = {
        ...sampleOrganismeWithUAIOutput,
        erps: ["ERP_TEST2"],
        last_transmission_date: sampleTransmissionDate,
        mode_de_transmission: "MANUEL",
        mode_de_transmission_configuration_date: sampleConfigurationDate,
        api_key: "SAMPLE_API_KEY",
      };
      await organismesDb().insertOne(organismeTransmissionManuelleTest);

      let response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        `/api/v1/admin/organismes/${organismeTransmissionManuelleTest?._id}/parametrage-transmission`
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        transmission_api_active: false,
        transmission_manuelle_active: true,
        api_key_active: true,
        parametrage_erp_active: true,
        parametrage_erp_date: sampleConfigurationDate.toISOString(),
        erps: ["ERP_TEST2"],
      });
    });
  });

  describe("GET /api/v1/admin/mission-locale/stats/national", () => {
    function createMockStats(overrides: Record<string, number> = {}) {
      return {
        total: 100,
        a_traiter: 30,
        traite: 70,
        rdv_pris: 20,
        nouveau_projet: 15,
        deja_accompagne: 10,
        contacte_sans_retour: 25,
        injoignables: 0,
        coordonnees_incorrectes: 5,
        autre: 5,
        autre_avec_contact: 0,
        deja_connu: 10,
        mineur: 0,
        mineur_a_traiter: 0,
        mineur_traite: 0,
        mineur_rdv_pris: 0,
        mineur_nouveau_projet: 0,
        mineur_deja_accompagne: 0,
        mineur_contacte_sans_retour: 0,
        mineur_injoignables: 0,
        mineur_coordonnees_incorrectes: 0,
        mineur_autre: 0,
        mineur_autre_avec_contact: 0,
        rqth: 0,
        rqth_a_traiter: 0,
        rqth_traite: 0,
        rqth_rdv_pris: 0,
        rqth_nouveau_projet: 0,
        rqth_deja_accompagne: 0,
        rqth_contacte_sans_retour: 0,
        rqth_injoignables: 0,
        rqth_coordonnees_incorrectes: 0,
        rqth_autre: 0,
        rqth_autre_avec_contact: 0,
        abandon: 0,
        ...overrides,
      };
    }

    beforeEach(async () => {
      await missionLocaleStatsDb().deleteMany({});
      await organisationsDb().deleteMany({});
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get("/api/v1/admin/mission-locale/stats/national");
      expectUnauthorizedError(response);
    });

    it("Doit retourner les statistiques nationales pour la période par défaut (30days)", async () => {
      const currentDate = new Date("2025-03-15");
      currentDate.setUTCHours(0, 0, 0, 0);

      const ml1Id = new ObjectId();

      await organisationsDb().insertOne({
        _id: ml1Id,
        nom: "ML Paris",
        ml_id: 1,
        type: "MISSION_LOCALE",
        created_at: new Date("2025-01-01"),
        activated_at: new Date("2025-02-01"),
        adresse: {
          region: "11",
        },
      });

      await missionLocaleStatsDb().insertOne({
        _id: new ObjectId(),
        mission_locale_id: ml1Id,
        computed_day: currentDate,
        created_at: new Date(),
        stats: createMockStats({ deja_connu: 8 }),
      });

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national"
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("rupturantsTimeSeries");
      expect(response.data).toHaveProperty("rupturantsSummary");
      expect(response.data).toHaveProperty("detailsTraites");
      expect(response.data).toHaveProperty("period");

      expect(response.data.rupturantsTimeSeries).toHaveLength(6);

      expect(response.data.rupturantsSummary).toHaveProperty("a_traiter");
      expect(response.data.rupturantsSummary.a_traiter).toHaveProperty("current");
      expect(response.data.rupturantsSummary.a_traiter).toHaveProperty("variation");
      expect(response.data.rupturantsSummary).toHaveProperty("traites");
      expect(response.data.rupturantsSummary).toHaveProperty("total");

      expect(response.data.detailsTraites).toHaveProperty("rdv_pris");
      expect(response.data.detailsTraites).toHaveProperty("nouveau_projet");
      expect(response.data.detailsTraites).toHaveProperty("contacte_sans_retour");
      expect(response.data.detailsTraites).toHaveProperty("deja_accompagne");
      expect(response.data.detailsTraites).toHaveProperty("injoignables");
      expect(response.data.detailsTraites).toHaveProperty("coordonnees_incorrectes");
      expect(response.data.detailsTraites).toHaveProperty("autre");
      expect(response.data.detailsTraites).toHaveProperty("deja_connu");
      expect(response.data.detailsTraites).toHaveProperty("total");

      expect(response.data.regional).toHaveProperty("regions");
      expect(Array.isArray(response.data.regional.regions)).toBe(true);

      expect(response.data).toHaveProperty("traitement");
      expect(response.data.traitement).toHaveProperty("latest");
      expect(response.data.traitement).toHaveProperty("first");
      expect(response.data.traitement.latest).toHaveProperty("total");
      expect(response.data.traitement.latest).toHaveProperty("total_contacte");
      expect(response.data.traitement.latest).toHaveProperty("total_repondu");
      expect(response.data.traitement.latest).toHaveProperty("total_accompagne");
    });

    it("Doit accepter les différentes périodes", async () => {
      const response30d = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national?period=30days"
      );
      expect(response30d.status).toBe(200);
      expect(response30d.data.period).toBe("30days");

      const response3m = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national?period=3months"
      );
      expect(response3m.status).toBe(200);
      expect(response3m.data.period).toBe("3months");

      const responseAll = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national?period=all"
      );
      expect(responseAll.status).toBe(200);
      expect(responseAll.data.period).toBe("all");
    });

    it("Doit valider le paramètre period", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national?period=invalid"
      );

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/admin/mission-locale/stats/accompagnement-conjoint", () => {
    beforeEach(async () => {
      await missionLocaleEffectifsDb().deleteMany({});
      await organisationsDb().deleteMany({});
      await organismesDb().deleteMany({});
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get("/api/v1/admin/mission-locale/stats/accompagnement-conjoint");
      expectUnauthorizedError(response);
    });

    it("Doit retourner les statistiques d'accompagnement conjoint vides quand pas de données", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/accompagnement-conjoint"
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("cfaPartenaires");
      expect(response.data).toHaveProperty("mlConcernees");
      expect(response.data).toHaveProperty("regionsActives");
      expect(response.data).toHaveProperty("totalJeunesRupturants");
      expect(response.data).toHaveProperty("totalDossiersPartages");
      expect(response.data).toHaveProperty("totalDossiersTraites");
      expect(response.data).toHaveProperty("pourcentageTraites");
      expect(response.data).toHaveProperty("motifs");
      expect(response.data).toHaveProperty("statutsTraitement");
      expect(response.data).toHaveProperty("dejaConnu");
      expect(response.data).toHaveProperty("totalPourDejaConnu");
      expect(response.data).toHaveProperty("evaluationDate");

      expect(response.data.cfaPartenaires).toBe(0);
      expect(response.data.mlConcernees).toBe(0);
      expect(response.data.regionsActives).toEqual([]);
    });

    it("Doit retourner la structure correcte des motifs", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/accompagnement-conjoint"
      );

      expect(response.status).toBe(200);
      expect(response.data.motifs).toHaveProperty("mobilite");
      expect(response.data.motifs).toHaveProperty("logement");
      expect(response.data.motifs).toHaveProperty("sante");
      expect(response.data.motifs).toHaveProperty("finance");
      expect(response.data.motifs).toHaveProperty("administratif");
      expect(response.data.motifs).toHaveProperty("reorientation");
      expect(response.data.motifs).toHaveProperty("recherche_emploi");
      expect(response.data.motifs).toHaveProperty("autre");
    });

    it("Doit retourner la structure correcte des statuts de traitement", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/accompagnement-conjoint"
      );

      expect(response.status).toBe(200);
      expect(response.data.statutsTraitement).toHaveProperty("rdv_pris");
      expect(response.data.statutsTraitement).toHaveProperty("nouveau_projet");
      expect(response.data.statutsTraitement).toHaveProperty("deja_accompagne");
      expect(response.data.statutsTraitement).toHaveProperty("contacte_sans_retour");
      expect(response.data.statutsTraitement).toHaveProperty("injoignables");
      expect(response.data.statutsTraitement).toHaveProperty("coordonnees_incorrectes");
      expect(response.data.statutsTraitement).toHaveProperty("autre");
    });
  });
});

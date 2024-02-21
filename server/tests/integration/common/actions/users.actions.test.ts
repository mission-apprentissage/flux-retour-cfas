import { ObjectId } from "mongodb";

import { getUsersLinkedToOrganismeId } from "@/common/actions/users.actions";
import { organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { getCurrentTime } from "@/common/utils/timeUtils";
import { useMongo } from "@tests/jest/setupMongo";
import { organismes, commonOrganismeAttributes } from "@tests/utils/permissions";
import { id, testPasswordHash } from "@tests/utils/testUtils";

describe("Components Users Test", () => {
  useMongo();

  beforeEach(async () => {
    await organismesDb().insertMany(organismes);
  });

  describe("getUsersLinkedToOrganismeId", () => {
    it("Returns empty when given organisme id is null", async () => {
      await expect(getUsersLinkedToOrganismeId(null as any)).resolves.toEqual([]);
    });

    it("Vérifie qu'on renvoi une liste vide si aucun utilisateur n'est lié à l'organisme", async () => {
      const usersLinked = await getUsersLinkedToOrganismeId(organismes[0]._id);
      expect(usersLinked).toStrictEqual([]);
    });

    it("Vérifie qu'on renvoi la liste des utilisateurs rattachés à une organisation d'un organisme", async () => {
      // Création d'une organisation lié au couple UAI - SIRET du premier organisme de test + création d'utilisateurs liés
      await Promise.all([
        organisationsDb().insertOne({
          _id: new ObjectId(id(1)),
          type: "ORGANISME_FORMATION",
          uai: organismes[0].uai as string,
          siret: organismes[0].siret,
          created_at: getCurrentTime(),
        }),
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
            organisation_id: new ObjectId(id(1)),
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
            organisation_id: new ObjectId(id(1)),
          },
        ]),
      ]);

      const usersLinked = await getUsersLinkedToOrganismeId(organismes[0]._id);
      expect(usersLinked.map((user) => user)).toStrictEqual([
        {
          _id: expect.any(ObjectId),
          civility: "Madame",
          nom: "Boucher",
          prenom: "Alice",
          email: "alice@tdb.local",
          telephone: "0102030405",
        },
        {
          _id: expect.any(ObjectId),
          civility: "Madame",
          nom: "Jean",
          prenom: "Corinne",
          email: "corinne@tdb.local",
          telephone: "0102030406",
        },
      ]);
    });

    it("Vérifie qu'on renvoi la liste des utilisateurs rattachés à une organisation d'un organisme sans uai", async () => {
      const organismeWithoutUai = {
        ...commonOrganismeAttributes,
        _id: new ObjectId(id(8)),
        siret: "00000000000026",
        organismesResponsables: [{ _id: new ObjectId(id(1)), responsabilitePartielle: false }],
      };

      // Création d'une organisation lié au couple UAI - SIRET du premier organisme de test + création d'utilisateurs liés
      await Promise.all([
        organismesDb().insertOne(organismeWithoutUai),
        organisationsDb().insertOne({
          _id: new ObjectId(id(8)),
          type: "ORGANISME_FORMATION",
          uai: null,
          siret: organismeWithoutUai.siret,
          created_at: getCurrentTime(),
        }),
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
            organisation_id: new ObjectId(id(8)),
          },
        ]),
      ]);

      const usersLinked = await getUsersLinkedToOrganismeId(organismeWithoutUai._id);
      expect(usersLinked.map((item) => item)).toStrictEqual([
        {
          _id: expect.any(ObjectId),
          civility: "Madame",
          nom: "Boucher",
          prenom: "Alice",
          email: "alice@tdb.local",
          telephone: "0102030405",
        },
      ]);
    });
  });
});

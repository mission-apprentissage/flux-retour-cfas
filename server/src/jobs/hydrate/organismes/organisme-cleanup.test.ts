import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_PRESENCE_REFERENTIEL } from "shared/constants";
import type { IOrganisation } from "shared/models";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { describe, it, expect, beforeEach } from "vitest";

import {
  effectifsDb,
  effectifsDECADb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { cleanupOrganismes } from "./organisme-cleanup";

useMongo();

const organismes = {
  empty: generateOrganismeFixture({
    nom: "empty",
    siret: "13002975400020",
    uai: "0597114M",
    effectifs_count: 0,
    est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
  }),
  withEffectifsDeca: generateOrganismeFixture({
    nom: "withEffectifsDeca",
    uai: null,
    siret: "19240007500011",
    effectifs_count: 1,
    est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
  }),
  withUsers: generateOrganismeFixture({
    nom: "withUsers",
    siret: "19590065900028",
    uai: null,
    effectifs_count: 0,
    est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
  }),
  inReferentiel: generateOrganismeFixture({
    nom: "inReferentiel",
    siret: "26220009000278",
    uai: "0932751K",
    effectifs_count: 0,
    est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.PRESENT,
  }),
  withApiKey: generateOrganismeFixture({
    nom: "withApiKey",
    siret: "42334912500066",
    uai: "0133336F",
    effectifs_count: 0,
    est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
    api_key: "*****",
  }),
  withEffectifsTdb: generateOrganismeFixture({
    nom: "withEffectifsTdb",
    siret: "81171016900012",
    uai: "0802230P",
    effectifs_count: 1,
    est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
  }),
  invalidComputeEffectifCount: generateOrganismeFixture({
    nom: "invalidComputeEffectifCount",
    siret: "88951250500013",
    uai: null,
    effectifs_count: 0,
    est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
  }),
};
const orgWithUser: IOrganisation = {
  _id: new ObjectId(),
  type: "ORGANISME_FORMATION",
  created_at: new Date(),
  siret: organismes.withUsers.siret,
  uai: organismes.withUsers.uai ?? null,
  organisme_id: organismes.withUsers._id.toString(),
};
const orgEmpty: IOrganisation = {
  _id: new ObjectId(),
  type: "ORGANISME_FORMATION",
  created_at: new Date(),
  siret: organismes.empty.siret,
  uai: organismes.empty.uai ?? null,
  organisme_id: organismes.empty._id.toString(),
};

describe("cleanupOrganismes", () => {
  beforeEach(async () => {
    await organismesDb().insertMany(Object.values(organismes));
    await effectifsDECADb().insertMany([
      {
        _id: new ObjectId(),
        organisme_id: organismes.withEffectifsDeca._id,
        id_erp_apprenant: "123456",
        source: SOURCE_APPRENANT.DECA,
        annee_scolaire: "2024-2025",
        deca_raw_id: new ObjectId(),
        apprenant: {
          nom: "Doe",
          prenom: "John",
          historique_statut: [],
        },
      },
    ]);
    await effectifsDb().insertMany([
      {
        _id: new ObjectId(),
        organisme_id: organismes.withEffectifsTdb._id,
        id_erp_apprenant: "123456",
        source: SOURCE_APPRENANT.ERP,
        annee_scolaire: "2024-2025",
        apprenant: {
          nom: "Doe",
          prenom: "John",
          historique_statut: [],
        },
      },
      {
        _id: new ObjectId(),
        organisme_id: organismes.invalidComputeEffectifCount._id,
        id_erp_apprenant: "95628",
        source: SOURCE_APPRENANT.ERP,
        annee_scolaire: "2024-2025",
        apprenant: {
          nom: "Dupont",
          prenom: "Jean",
          historique_statut: [],
        },
      },
    ]);
    await organisationsDb().insertMany([orgWithUser, orgEmpty]);
    await usersMigrationDb().insertOne({
      _id: new ObjectId(),
      email: "mail@mail.fr",
      password: "####",
      nom: "Doe",
      prenom: "John",
      civility: "Monsieur",
      organisation_id: orgWithUser._id,
      account_status: "CONFIRMED",
      auth_method: "password",
    });
  });

  it("should delete organismes with no users, effectifs, or deca effectifs", async () => {
    await cleanupOrganismes();

    const remainingOrganismes = await organismesDb().find({}).toArray();
    expect(remainingOrganismes).toHaveLength(6);
    expect(remainingOrganismes).toEqual([
      organismes.withEffectifsDeca,
      organismes.withUsers,
      organismes.inReferentiel,
      organismes.withApiKey,
      organismes.withEffectifsTdb,
      organismes.invalidComputeEffectifCount,
    ]);

    const organisations = await organisationsDb().find({}).toArray();
    expect(organisations).toHaveLength(1);
    expect(organisations).toEqual([orgWithUser]);
  });
});

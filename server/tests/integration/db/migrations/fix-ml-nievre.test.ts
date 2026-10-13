import { ObjectId } from "bson";
import { STATUT_APPRENANT } from "shared";
import type { IMissionLocaleEffectif, IOrganisationMissionLocale } from "shared/models";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { beforeEach, describe, expect, it } from "vitest";

import {
  invitationsDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { up } from "@/db/migrations/20261013150000-fix-ml-nievre";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const MORVAN_ID = new ObjectId();
const NEVERS_ID = new ObjectId();
const BOURGOGNE_NIVERNAISE_ID = new ObjectId();
const COMPTE_NEVERS_ID = new ObjectId("6a1e96761a3c2363663d6e09");
const ACTIVATION_MORVAN = new Date("2026-07-10T15:12:38.121Z");
const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];

const insertOrganisation = async (organisation: Partial<IOrganisationMissionLocale>) => {
  await organisationsDb().insertOne(
    { type: "MISSION_LOCALE", created_at: new Date("2025-02-20"), ...organisation } as IOrganisation,
    { bypassDocumentValidation: true }
  );
};

const insertCompte = async (_id: ObjectId, organisationId: ObjectId, accountStatus = "CONFIRMED") => {
  await usersMigrationDb().insertOne(
    {
      _id,
      email: `${_id.toString()}@milobfc.fr`,
      password: "hash",
      nom: "AGENT",
      prenom: "Test",
      organisation_id: organisationId,
      account_status: accountStatus,
      created_at: new Date("2026-06-02"),
    } as never,
    { bypassDocumentValidation: true }
  );
};

const insertDossiers = async (missionLocaleId: ObjectId, count: number, activatedAt?: Date) => {
  const organisme = { _id: new ObjectId(), ...createRandomOrganisme({ siret: "19040492100016" }) };
  await organismesDb().insertOne(organisme);
  for (let i = 0; i < count; i++) {
    const effectifId = new ObjectId();
    const snapshot = await createSampleEffectif({
      organisme,
      annee_scolaire: ANNEE_SCOLAIRE,
      apprenant: { date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1) },
    });
    await missionLocaleEffectifsDb().insertOne({
      _id: new ObjectId(),
      mission_locale_id: missionLocaleId,
      effectif_id: effectifId,
      effectif_snapshot: { ...snapshot, _id: effectifId, organisme_id: organisme._id },
      effectif_snapshot_date: new Date(),
      date_rupture: new Date("2026-08-15"),
      current_status: { value: STATUT_APPRENANT.RUPTURANT, date: new Date("2026-08-15") },
      created_at: new Date("2026-08-16"),
      ...(activatedAt ? { computed: { mission_locale: { activated_at: activatedAt } } } : {}),
    } as IMissionLocaleEffectif);
  }
};

const insertEtatErrone = async () => {
  await insertOrganisation({
    _id: MORVAN_ID,
    ml_id: 376,
    nom: "NEVERS SUD NIVERNAIS",
    siret: "32596361900037",
    email: "accueil.nevers@milobfc.fr",
    telephone: "03 58 07 81 70",
    site_web: "",
    adresse: { commune: "Challuy", code_insee: "58051", code_postal: "58000", departement: "58", region: "27" },
    activated_at: ACTIVATION_MORVAN,
  });
  await insertOrganisation({
    _id: NEVERS_ID,
    ml_id: 58194,
    nom: "58-ML NEVERS",
    siret: "32596361900045",
    email: null,
    telephone: null,
    site_web: null,
    adresse: { commune: "Challuy", code_insee: "58051", code_postal: "58000", departement: "58", region: "27" },
  });
  await insertOrganisation({
    _id: BOURGOGNE_NIVERNAISE_ID,
    ml_id: 152,
    nom: "BOURGOGNE NIVERNAISE",
    siret: "49363449700017",
    activated_at: new Date("2026-09-16"),
  });
  await insertCompte(COMPTE_NEVERS_ID, MORVAN_ID);
  await insertDossiers(MORVAN_ID, 2, ACTIVATION_MORVAN);
  await insertDossiers(NEVERS_ID, 3);
};

const getOrganisation = (_id: ObjectId) =>
  organisationsDb().findOne({ _id }) as Promise<IOrganisationMissionLocale | null>;

describe("migration fix-ml-nievre", () => {
  beforeEach(async () => {
    await insertEtatErrone();
  });

  it("renomme les deux fiches, rattache le compte à Nevers, active Nevers et désactive le Morvan", async () => {
    const debut = new Date();

    await up();

    const morvan = await getOrganisation(MORVAN_ID);
    expect(morvan).toMatchObject({
      ml_id: 376,
      nom: "NIVERNAIS MORVAN",
      siret: "38804605400036",
      email: "milonivernaismorvan@milobfc.fr",
      telephone: "03 86 85 10 77",
      adresse: { commune: "Château-Chinon (Ville)", code_insee: "58062", code_postal: "58120" },
    });
    expect(morvan).not.toHaveProperty("activated_at");

    const nevers = await getOrganisation(NEVERS_ID);
    expect(nevers).toMatchObject({
      ml_id: 58194,
      nom: "NEVERS SUD NIVERNAIS",
      siret: "32596361900045",
      email: "accueil.nevers@milobfc.fr",
      telephone: "03 58 07 81 70",
      adresse: { commune: "Nevers", code_insee: "58194", code_postal: "58000" },
    });
    expect(nevers?.activated_at?.getTime()).toBeGreaterThanOrEqual(debut.getTime());

    const compte = await usersMigrationDb().findOne({ _id: COMPTE_NEVERS_ID });
    expect(compte?.organisation_id).toEqual(NEVERS_ID);

    const dossiersMorvan = await missionLocaleEffectifsDb().find({ mission_locale_id: MORVAN_ID }).toArray();
    expect(dossiersMorvan).toHaveLength(2);
    for (const dossier of dossiersMorvan) {
      expect(dossier.computed?.mission_locale).not.toHaveProperty("activated_at");
    }

    const dossiersNevers = await missionLocaleEffectifsDb().find({ mission_locale_id: NEVERS_ID }).toArray();
    expect(dossiersNevers).toHaveLength(3);
    for (const dossier of dossiersNevers) {
      expect(dossier.computed?.mission_locale?.activated_at).toEqual(nevers?.activated_at);
    }

    const bourgogneNivernaise = await getOrganisation(BOURGOGNE_NIVERNAISE_ID);
    expect(bourgogneNivernaise).toMatchObject({ nom: "BOURGOGNE NIVERNAISE", activated_at: new Date("2026-09-16") });
  });

  it("est sans effet au second passage", async () => {
    await up();
    const apresPremierPassage = await Promise.all([
      getOrganisation(MORVAN_ID),
      getOrganisation(NEVERS_ID),
      usersMigrationDb().findOne({ _id: COMPTE_NEVERS_ID }),
    ]);

    await up();

    const apresSecondPassage = await Promise.all([
      getOrganisation(MORVAN_ID),
      getOrganisation(NEVERS_ID),
      usersMigrationDb().findOne({ _id: COMPTE_NEVERS_ID }),
    ]);
    expect(apresSecondPassage).toEqual(apresPremierPassage);
  });

  it("ne renomme pas une fiche du Morvan déjà corrigée à la main", async () => {
    await organisationsDb().updateOne(
      { _id: MORVAN_ID },
      { $set: { nom: "MISSION LOCALE NIVERNAIS MORVAN", siret: "38804605400036" } }
    );

    await up();

    const morvan = await getOrganisation(MORVAN_ID);
    expect(morvan?.nom).toBe("MISSION LOCALE NIVERNAIS MORVAN");
  });

  it("ne déplace pas un compte qui a déjà quitté la fiche du Morvan et n'active pas Nevers sans agent", async () => {
    await usersMigrationDb().updateOne(
      { _id: COMPTE_NEVERS_ID },
      { $set: { organisation_id: BOURGOGNE_NIVERNAISE_ID } }
    );

    await up();

    const compte = await usersMigrationDb().findOne({ _id: COMPTE_NEVERS_ID });
    expect(compte?.organisation_id).toEqual(BOURGOGNE_NIVERNAISE_ID);
    const nevers = await getOrganisation(NEVERS_ID);
    expect(nevers).not.toHaveProperty("activated_at");
  });

  it("laisse un autre compte, même en attente, sur la fiche du Morvan et la garde activée", async () => {
    const autreCompteId = new ObjectId();
    await insertCompte(autreCompteId, MORVAN_ID, "PENDING_ADMIN_VALIDATION");

    await up();

    const autreCompte = await usersMigrationDb().findOne({ _id: autreCompteId });
    expect(autreCompte?.organisation_id).toEqual(MORVAN_ID);
    const compte = await usersMigrationDb().findOne({ _id: COMPTE_NEVERS_ID });
    expect(compte?.organisation_id).toEqual(NEVERS_ID);
    const morvan = await getOrganisation(MORVAN_ID);
    expect(morvan?.activated_at).toEqual(ACTIVATION_MORVAN);
  });

  it("garde la fiche du Morvan activée si une invitation y est en attente", async () => {
    await invitationsDb().insertOne({
      _id: new ObjectId(),
      token: "jeton",
      email: "invite@milobfc.fr",
      organisation_id: MORVAN_ID,
      author_id: new ObjectId(),
      created_at: new Date(),
    });

    await up();

    const morvan = await getOrganisation(MORVAN_ID);
    expect(morvan?.activated_at).toEqual(ACTIVATION_MORVAN);
  });
});

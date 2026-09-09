import { randomUUID } from "node:crypto";

import { ObjectId } from "mongodb";
import { ACC_CONJOINT_MOTIF_ENUM, STATUT_APPRENANT } from "shared";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { describe, it, beforeEach, expect } from "vitest";

import {
  setEffectifMissionLocaleDataFromOrganisme,
  markEffectifNotificationAsRead,
} from "@/common/actions/organismes/mission-locale.actions";
import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";
import { createSampleEffectif, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];
const organismeId = new ObjectId(id(1));
const mlOrganisationId = new ObjectId(id(2));
const userId = new ObjectId(id(3));
const effectifId = new ObjectId(id(4));

const sampleOrganisme = {
  _id: organismeId,
  ...createRandomOrganisme({ siret: "19040492100016" }),
};

async function insertErpEffectif(apprenant: Record<string, any> = { mission_locale_id: 42 }) {
  const effectif = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: {
      nom: "COLLAB",
      prenom: "Test",
      date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
      adresse: apprenant.adresse ?? { mission_locale_id: 42 },
    },
  });
  await effectifsDb().insertOne({ ...effectif, _id: effectifId, organisme_id: organismeId } as any);
  return effectif;
}

async function insertDecaEffectif() {
  const effectif = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    source: "DECA" as any,
    apprenant: {
      nom: "COLLABDECA",
      prenom: "Test",
      date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
      adresse: { mission_locale_id: 42 },
    },
  });
  await effectifsDECADb().insertOne({
    ...effectif,
    _id: effectifId,
    deca_raw_id: new ObjectId(),
    organisme_id: organismeId,
    is_deca_compatible: true,
  } as any);
  return effectif;
}

async function createMlEffectifDoc(overrides: Record<string, any> = {}) {
  const now = new Date();
  const snapshot = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: {
      date_de_naissance: new Date(now.getFullYear() - 20, 0, 1),
    },
  });

  return {
    _id: new ObjectId(),
    mission_locale_id: mlOrganisationId,
    effectif_id: effectifId,
    effectif_snapshot: {
      ...snapshot,
      _id: effectifId,
      organisme_id: organismeId,
      _computed: {
        ...snapshot._computed,
        statut: { ...snapshot._computed?.statut, en_cours: STATUT_APPRENANT.RUPTURANT },
      },
    },
    effectif_snapshot_date: now,
    date_rupture: new Date("2026-01-15"),
    current_status: { value: STATUT_APPRENANT.RUPTURANT, date: new Date("2026-01-15") },
    created_at: now,
    brevo: { token: randomUUID(), token_created_at: now },
    ...overrides,
  };
}

describe("setEffectifMissionLocaleDataFromOrganisme", () => {
  useMongo();

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
    await organisationsDb().insertOne({
      _id: mlOrganisationId,
      type: "MISSION_LOCALE",
      ml_id: 42,
      nom: "ML Test",
      created_at: new Date(),
    } as any);
  });

  it("met à jour organisme_data avec les champs de base", async () => {
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);

    await setEffectifMissionLocaleDataFromOrganisme(
      organismeId,
      effectifId,
      { rupture: true, acc_conjoint: true },
      userId
    );

    const updated = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    expect(updated?.organisme_data?.rupture).toBe(true);
    expect(updated?.organisme_data?.acc_conjoint).toBe(true);
    expect(updated?.organisme_data?.has_unread_notification).toBe(false);
    expect(updated?.organisme_data?.acc_conjoint_by).toEqual(userId);
    expect(updated?.organisme_data?.reponse_at).toBeInstanceOf(Date);
  });

  it("met à jour les champs optionnels (motif, commentaires, etc.)", async () => {
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);

    await setEffectifMissionLocaleDataFromOrganisme(
      organismeId,
      effectifId,
      {
        rupture: true,
        acc_conjoint: true,
        motif: [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT, ACC_CONJOINT_MOTIF_ENUM.SANTE],
        still_at_cfa: false,
        cause_rupture: "Raison de la rupture",
        referent_type: "me",
        referent_coordonnees: "M. Jean DUPONT\n0612345678\njean@test.fr",
        note_complementaire: "Note libre",
        verified_info: {
          telephone: "0612345678",
          courriel: "test@test.fr",
          adresse_rue: "12 rue de Paris",
          adresse_code_postal: "75001",
          adresse_commune: "Paris",
          formation_libelle: "BTS Info",
          date_fin_formation: "31/12/2026",
        },
        commentaires_par_motif: {
          [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT]: "Pas de logement stable",
          [ACC_CONJOINT_MOTIF_ENUM.SANTE]: "Problème de santé",
        },
      },
      userId
    );

    const updated = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    const od = updated?.organisme_data;
    expect(od?.motif).toEqual([ACC_CONJOINT_MOTIF_ENUM.LOGEMENT, ACC_CONJOINT_MOTIF_ENUM.SANTE]);
    expect(od?.still_at_cfa).toBe(false);
    expect(od?.cause_rupture).toBe("Raison de la rupture");
    expect(od?.referent_type).toBe("me");
    expect(od?.referent_coordonnees).toBe("M. Jean DUPONT\n0612345678\njean@test.fr");
    expect(od?.note_complementaire).toBe("Note libre");
    expect(od?.verified_info?.telephone).toBe("0612345678");
    expect(od?.verified_info?.formation_libelle).toBe("BTS Info");
    expect(od?.commentaires_par_motif?.[ACC_CONJOINT_MOTIF_ENUM.LOGEMENT]).toBe("Pas de logement stable");
  });

  it("ne remplace pas les champs existants non envoyés (merge partiel)", async () => {
    await missionLocaleEffectifsDb().insertOne(
      (await createMlEffectifDoc({
        organisme_data: {
          rupture: true,
          acc_conjoint: true,
          note_complementaire: "Note existante",
          cause_rupture: "Ancienne raison",
          reponse_at: new Date("2026-01-01"),
        },
      })) as any
    );

    await setEffectifMissionLocaleDataFromOrganisme(
      organismeId,
      effectifId,
      { rupture: true, cause_rupture: "Nouvelle raison" },
      userId
    );

    const updated = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    const od = updated?.organisme_data;
    expect(od?.cause_rupture).toBe("Nouvelle raison");
    expect(od?.note_complementaire).toBe("Note existante");
  });

  it("n'inclut pas les champs optionnels undefined", async () => {
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);

    await setEffectifMissionLocaleDataFromOrganisme(
      organismeId,
      effectifId,
      { rupture: true, acc_conjoint: false },
      userId
    );

    const updated = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    expect(updated?.organisme_data).not.toHaveProperty("motif");
    expect(updated?.organisme_data).not.toHaveProperty("still_at_cfa");
    expect(updated?.organisme_data).not.toHaveProperty("cause_rupture");
  });

  it("throw si l'effectif n'existe ni en ERP ni en DECA", async () => {
    await expect(
      setEffectifMissionLocaleDataFromOrganisme(organismeId, new ObjectId(), { rupture: true })
    ).rejects.toThrow("Effectif non trouvé");
  });

  it("rejette un second envoi sur un dossier déjà en collaboration (RG2)", async () => {
    await missionLocaleEffectifsDb().insertOne(
      (await createMlEffectifDoc({
        organisme_data: { rupture: true, acc_conjoint: true, acc_conjoint_by: userId },
      })) as any
    );

    await expect(
      setEffectifMissionLocaleDataFromOrganisme(organismeId, effectifId, { rupture: true, acc_conjoint: true }, userId)
    ).rejects.toThrow("Un dossier de collaboration a déjà été envoyé pour cet effectif");
  });

  describe("création du dossier à la volée", () => {
    beforeEach(async () => {
      await effectifsDb().deleteMany({});
      await effectifsDECADb().deleteMany({});
    });

    it("crée le dossier pour un effectif sans document mission locale", async () => {
      await insertErpEffectif();

      const result = await setEffectifMissionLocaleDataFromOrganisme(
        organismeId,
        effectifId,
        { rupture: false, acc_conjoint: true, note_complementaire: "Jeune en contrat, risque de rupture" },
        userId
      );

      expect(result?.mission_locale_id).toEqual(mlOrganisationId);

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(created?.organisme_data?.acc_conjoint).toBe(true);
      expect(created?.organisme_data?.acc_conjoint_by).toEqual(userId);
      expect(created?.organisme_data?.note_complementaire).toBe("Jeune en contrat, risque de rupture");
      expect(created?.date_rupture).toBeNull();
      expect(created?.cfa_rupture_declaration).toBeUndefined();
      expect(created?.effectif_snapshot?.organisme_id).toEqual(organismeId);
    });

    it("crée le dossier avec la déclaration de rupture quand une date est transmise", async () => {
      await insertErpEffectif();
      const dateRupture = new Date("2026-05-04");

      await setEffectifMissionLocaleDataFromOrganisme(
        organismeId,
        effectifId,
        { rupture: true, acc_conjoint: true, still_at_cfa: false, date_rupture: dateRupture } as any,
        userId
      );

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(created?.date_rupture).toEqual(dateRupture);
      expect(created?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);
      expect(created?.cfa_rupture_declaration?.declared_by).toEqual(userId);
    });

    it("crée le dossier depuis DECA si l'organisme y a accès", async () => {
      await organismesDb().updateOne({ _id: organismeId }, { $set: { is_allowed_deca: true } });
      await insertDecaEffectif();

      await setEffectifMissionLocaleDataFromOrganisme(
        organismeId,
        effectifId,
        { rupture: false, acc_conjoint: true },
        userId
      );

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(created?.organisme_data?.acc_conjoint).toBe(true);
    });

    it("refuse de créer depuis DECA si l'organisme n'y a pas accès", async () => {
      await insertDecaEffectif();

      await expect(
        setEffectifMissionLocaleDataFromOrganisme(
          organismeId,
          effectifId,
          { rupture: false, acc_conjoint: true },
          userId
        )
      ).rejects.toThrow("Effectif non trouvé");
    });

    it("throw si la zone mission locale de l'apprenant est inconnue", async () => {
      await insertErpEffectif({ adresse: {} });

      await expect(
        setEffectifMissionLocaleDataFromOrganisme(
          organismeId,
          effectifId,
          { rupture: false, acc_conjoint: true },
          userId
        )
      ).rejects.toThrow("zone Mission Locale non identifiée");
    });

    it("throw si l'organisation mission locale est introuvable", async () => {
      await organisationsDb().deleteMany({ type: "MISSION_LOCALE" });
      await insertErpEffectif();

      await expect(
        setEffectifMissionLocaleDataFromOrganisme(
          organismeId,
          effectifId,
          { rupture: false, acc_conjoint: true },
          userId
        )
      ).rejects.toThrow("organisation Mission Locale non trouvée");
    });

    it("ressuscite un dossier soft-deleted au lieu d'échouer", async () => {
      await insertErpEffectif();
      const softDeleted = await createMlEffectifDoc({ soft_deleted: true });
      await missionLocaleEffectifsDb().insertOne(softDeleted as any);

      await setEffectifMissionLocaleDataFromOrganisme(
        organismeId,
        effectifId,
        { rupture: false, acc_conjoint: true },
        userId
      );

      const revived = await missionLocaleEffectifsDb().findOne({ _id: softDeleted._id });
      expect(revived?.soft_deleted).toBe(false);
      expect(revived?.organisme_data?.acc_conjoint).toBe(true);
      expect(await missionLocaleEffectifsDb().countDocuments({ effectif_id: effectifId })).toBe(1);
    });
  });
});

describe("markEffectifNotificationAsRead", () => {
  useMongo();

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await missionLocaleEffectifsLogDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
  });

  it("marque les notifications comme lues", async () => {
    const mlEffectifId = new ObjectId();
    await missionLocaleEffectifsDb().insertOne(
      (await createMlEffectifDoc({
        _id: mlEffectifId,
        organisme_data: {
          acc_conjoint: true,
          acc_conjoint_by: userId,
          has_unread_notification: true,
        },
      })) as any
    );

    await missionLocaleEffectifsLogDb().insertOne({
      _id: new ObjectId(),
      mission_locale_effectif_id: mlEffectifId,
      read_by: [],
      created_at: new Date(),
    } as any);

    await markEffectifNotificationAsRead(organismeId, effectifId, userId);

    const updated = await missionLocaleEffectifsDb().findOne({ _id: mlEffectifId });
    expect(updated?.organisme_data?.has_unread_notification).toBe(false);

    const log = await missionLocaleEffectifsLogDb().findOne({ mission_locale_effectif_id: mlEffectifId });
    expect(log?.read_by).toContainEqual(userId);
  });

  it("retourne null si effectif non trouvé", async () => {
    const result = await markEffectifNotificationAsRead(organismeId, effectifId, userId);
    expect(result).toBeNull();
  });
});

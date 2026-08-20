import { ObjectId } from "mongodb";
import { ACC_CONJOINT_MOTIF_ENUM } from "shared";
import {
  CFA_RISQUE_RUPTURE_ENUM,
  CFA_SITUATION_TYPE_ENUM,
  RQTH_DECLARE_ENUM,
} from "shared/models/data/missionLocaleEffectif.model";
import { zUpdateMissionLocaleEffectifOrganisme } from "shared/models/routes/organismes/mission-locale/missions-locale.api";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { describe, it, beforeEach, expect } from "vitest";

import { setEffectifMissionLocaleDataFromOrganisme } from "@/common/actions/organismes/mission-locale.actions";
import { effectifsDb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
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

const verifiedInfo = {
  telephone: "0612345678",
  courriel: "jeune@test.fr",
  adresse_rue: "12 rue de Paris",
  adresse_code_postal: "75001",
  adresse_commune: "Paris",
};

const baseObjectifs = {
  motif: [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI],
  commentaires_par_motif: { [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]: "CV à retravailler" },
  referent_type: "me" as const,
  verified_info: verifiedInfo,
};

const brancheA = {
  rupture: false,
  acc_conjoint: true,
  situation_type: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
  risque_rupture: CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE,
  ...baseObjectifs,
};

const brancheB = {
  rupture: true,
  acc_conjoint: true,
  situation_type: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
  still_at_cfa: true,
  date_rupture: new Date("2026-05-04"),
  cause_rupture: "Désaccord avec l'employeur",
  ...baseObjectifs,
};

const brancheC = {
  rupture: false,
  acc_conjoint: true,
  situation_type: CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT,
  date_debut_formation: new Date("2026-01-06"),
  recherche_entreprise: "12 candidatures envoyées, aucune réponse",
  ...baseObjectifs,
};

const parse = (payload: Record<string, unknown>) => zUpdateMissionLocaleEffectifOrganisme.parseAsync(payload);

async function insertEffectif(apprenantOverrides: Record<string, any> = {}) {
  const effectif = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: {
      nom: "TUNNEL",
      prenom: "Test",
      date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
      adresse: { mission_locale_id: 42 },
      ...apprenantOverrides,
    },
  });
  await effectifsDb().insertOne({ ...effectif, _id: effectifId, organisme_id: organismeId } as any);
  return effectif;
}

const send = (payload: Record<string, unknown>) =>
  setEffectifMissionLocaleDataFromOrganisme(organismeId, effectifId, payload as any, userId);

describe("Tunnel de collaboration CFA", () => {
  useMongo();

  beforeEach(async () => {
    await effectifsDb().deleteMany({});
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

  describe("envoi par branche", () => {
    it("branche A : dossier créé sans date de rupture ni déclaration", async () => {
      await insertEffectif();

      await send(await parse(brancheA));

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(created?.organisme_data?.situation_type).toBe(CFA_SITUATION_TYPE_ENUM.EN_CONTRAT);
      expect(created?.organisme_data?.risque_rupture).toBe(CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE);
      expect(created?.organisme_data?.acc_conjoint).toBe(true);
      expect(created?.date_rupture).toBeNull();
      expect(created?.cfa_rupture_declaration).toBeUndefined();
    });

    it("branche B : dossier créé avec la déclaration de rupture", async () => {
      await insertEffectif();

      await send(await parse(brancheB));

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(created?.organisme_data?.situation_type).toBe(CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE);
      expect(created?.date_rupture).toEqual(new Date("2026-05-04"));
      expect(created?.cfa_rupture_declaration?.date_rupture).toEqual(new Date("2026-05-04"));
    });

    it("branche C : dossier créé avec la recherche d'entreprise", async () => {
      await insertEffectif();

      await send(await parse(brancheC));

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(created?.organisme_data?.situation_type).toBe(CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT);
      expect(created?.organisme_data?.date_debut_formation).toEqual(new Date("2026-01-06"));
      expect(created?.organisme_data?.recherche_entreprise).toBe("12 candidatures envoyées, aucune réponse");
      expect(created?.date_rupture).toBeNull();
      expect(created?.cfa_rupture_declaration).toBeUndefined();
    });
  });

  describe("validation du payload", () => {
    it("R1 : branche A sans risque de rupture", async () => {
      await expect(parse({ ...brancheA, risque_rupture: undefined })).rejects.toThrow();
    });

    it("R1 : branche A avec une date de rupture", async () => {
      await expect(parse({ ...brancheA, date_rupture: new Date("2026-05-04") })).rejects.toThrow();
    });

    it("R2 : branche B sans date de rupture", async () => {
      await expect(parse({ ...brancheB, date_rupture: undefined })).rejects.toThrow();
    });

    it("R2 : branche B sans cause de rupture", async () => {
      await expect(parse({ ...brancheB, cause_rupture: "   " })).rejects.toThrow();
    });

    it("R3 : sortie du CFA sans date d'abandon", async () => {
      await expect(parse({ ...brancheB, still_at_cfa: false })).rejects.toThrow();
    });

    it("R4 : maintien en formation avec une date d'abandon", async () => {
      await expect(parse({ ...brancheB, date_abandon: new Date("2026-05-06") })).rejects.toThrow();
    });

    it("R5 : branche C sans recherche d'entreprise", async () => {
      await expect(parse({ ...brancheC, recherche_entreprise: "" })).rejects.toThrow();
    });

    it("R5 : branche C avec une cause de rupture", async () => {
      await expect(parse({ ...brancheC, cause_rupture: "Peu importe" })).rejects.toThrow();
    });

    it("R6 : aucun objectif d'accompagnement", async () => {
      await expect(parse({ ...brancheA, motif: [] })).rejects.toThrow();
    });

    it("R7 : recherche d'emploi sans commentaire", async () => {
      await expect(parse({ ...brancheA, commentaires_par_motif: {} })).rejects.toThrow();
    });

    it("R8 : frein périphérique sans commentaire", async () => {
      await expect(
        parse({ ...brancheA, motif: [...brancheA.motif, ACC_CONJOINT_MOTIF_ENUM.LOGEMENT] })
      ).rejects.toThrow();
    });

    it("R9 : réorientation sans commentaire est acceptée", async () => {
      await expect(
        parse({ ...brancheA, motif: [...brancheA.motif, ACC_CONJOINT_MOTIF_ENUM.REORIENTATION] })
      ).resolves.toBeTruthy();
    });

    it("R10 : référent autre sans coordonnées", async () => {
      await expect(parse({ ...brancheA, referent_type: "other" })).rejects.toThrow();
    });

    it("R11 : date de rupture dans le futur", async () => {
      const demain = new Date();
      demain.setDate(demain.getDate() + 1);
      await expect(parse({ ...brancheB, date_rupture: demain })).rejects.toThrow();
    });

    it("R11 : date d'abandon antérieure à la date de rupture", async () => {
      await expect(parse({ ...brancheB, still_at_cfa: false, date_abandon: new Date("2026-05-01") })).rejects.toThrow();
    });

    it("RG15 : adresse incomplète", async () => {
      await expect(parse({ ...brancheA, verified_info: { ...verifiedInfo, adresse_commune: "" } })).rejects.toThrow();
    });

    it("accepte un payload du formulaire mono-page, sans situation_type", async () => {
      await expect(
        parse({
          rupture: true,
          acc_conjoint: true,
          motif: [ACC_CONJOINT_MOTIF_ENUM.REORIENTATION],
          still_at_cfa: false,
          cause_rupture: "Rupture",
          referent_type: "me",
          verified_info: { telephone: "0612345678" },
        })
      ).resolves.toBeTruthy();
    });
  });

  describe("règles serveur", () => {
    it("RG2 : un second envoi est rejeté", async () => {
      await insertEffectif();
      await send(await parse(brancheA));

      await expect(send(await parse(brancheA))).rejects.toThrow(
        "Un dossier de collaboration a déjà été envoyé pour cet effectif"
      );
    });

    it("R12 : le responsable légal d'un majeur est ignoré", async () => {
      await insertEffectif();

      await send(
        await parse({
          ...brancheA,
          verified_info: { ...verifiedInfo, responsable_legal: { nom: "Parent", telephone: "0612345678" } },
        })
      );

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(created?.organisme_data?.verified_info?.responsable_legal).toBeUndefined();
    });

    it("R12 : le responsable légal d'un mineur est conservé", async () => {
      await insertEffectif({ date_de_naissance: new Date(new Date().getFullYear() - 17, 0, 1) });

      await send(
        await parse({
          ...brancheA,
          verified_info: { ...verifiedInfo, responsable_legal: { nom: "Parent", telephone: "0612345678" } },
        })
      );

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(created?.organisme_data?.verified_info?.responsable_legal?.nom).toBe("Parent");
    });

    it("Q4 : rqth_declare OUI écrase le snapshot", async () => {
      await insertEffectif({ rqth: false });

      await send(await parse({ ...brancheA, verified_info: { ...verifiedInfo, rqth_declare: RQTH_DECLARE_ENUM.OUI } }));

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(created?.effectif_snapshot?.apprenant?.rqth).toBe(true);
      expect(created?.organisme_data?.verified_info?.rqth_declare).toBe(RQTH_DECLARE_ENUM.OUI);
    });

    it("Q4 : rqth_declare NON écrase le snapshot", async () => {
      await insertEffectif({ rqth: true });

      await send(await parse({ ...brancheA, verified_info: { ...verifiedInfo, rqth_declare: RQTH_DECLARE_ENUM.NON } }));

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(created?.effectif_snapshot?.apprenant?.rqth).toBe(false);
    });

    it("Q4 : rqth_declare NON_RENSEIGNE ne touche à rien", async () => {
      await insertEffectif({ rqth: true });

      await send(
        await parse({ ...brancheA, verified_info: { ...verifiedInfo, rqth_declare: RQTH_DECLARE_ENUM.NON_RENSEIGNE } })
      );

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(created?.effectif_snapshot?.apprenant?.rqth).toBe(true);
    });
  });
});

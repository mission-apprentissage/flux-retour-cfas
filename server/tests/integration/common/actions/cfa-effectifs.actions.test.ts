import { ObjectId } from "mongodb";
import { IOrganisationOrganismeFormation } from "shared/models";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { describe, it, beforeEach, expect } from "vitest";

import {
  getCfaEffectifs,
  getCfaEffectifDetail,
  declareCfaEffectifRupture,
} from "@/common/actions/cfa/cfa-effectifs.actions";
import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
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

const sampleOrganisme = {
  _id: organismeId,
  ...createRandomOrganisme({ siret: "19040492100016" }),
};

const organisation: IOrganisationOrganismeFormation = {
  _id: new ObjectId(id(10)),
  type: "ORGANISME_FORMATION",
  siret: "19040492100016",
  uai: null,
  organisme_id: organismeId.toString(),
  created_at: new Date(),
};

const defaultParams = {
  page: 1,
  limit: 20,
  sort: "nom",
  order: "asc" as const,
};

async function insertEffectif(params: Record<string, any> = {}) {
  const effectifId = new ObjectId();
  const effectif = {
    _id: effectifId,
    ...(await createSampleEffectif({
      organisme: sampleOrganisme,
      annee_scolaire: ANNEE_SCOLAIRE,
      apprenant: {
        date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
        ...params.apprenant,
      },
      ...Object.fromEntries(Object.entries(params).filter(([k]) => k !== "apprenant")),
    })),
  };
  await effectifsDb().insertOne(effectif);
  return effectif;
}

function createMlEffectifDoc(effectif: any, overrides: Record<string, any> = {}) {
  return {
    _id: new ObjectId(),
    mission_locale_id: mlOrganisationId,
    effectif_id: effectif._id,
    effectif_snapshot: { ...effectif, organisme_id: organismeId },
    effectif_snapshot_date: new Date(),
    date_rupture: null,
    created_at: new Date(),
    current_status: { value: null, date: null },
    brevo: { token: null, token_created_at: null },
    ...overrides,
  };
}

describe("CFA Effectifs Actions", () => {
  useMongo();

  beforeEach(async () => {
    await effectifsDb().deleteMany({});
    await effectifsDECADb().deleteMany({});
    await missionLocaleEffectifsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
  });

  describe("getCfaEffectifs", () => {
    it("retourne les effectifs paginés", async () => {
      await insertEffectif({ apprenant: { nom: "DUPONT", prenom: "Jean" } });
      await insertEffectif({ apprenant: { nom: "MARTIN", prenom: "Pierre" } });
      await insertEffectif({ apprenant: { nom: "DURAND", prenom: "Marie" } });

      const result = await getCfaEffectifs(organisation, false, { ...defaultParams, limit: 2 });

      expect(result.pagination.total).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.effectifs).toHaveLength(2);
    });

    it("filtre par recherche sur le nom", async () => {
      await insertEffectif({ apprenant: { nom: "DUPONT", prenom: "Jean" } });
      await insertEffectif({ apprenant: { nom: "MARTIN", prenom: "Pierre" } });

      const result = await getCfaEffectifs(organisation, false, { ...defaultParams, search: "DUPONT" });

      expect(result.pagination.total).toBe(1);
      expect(result.effectifs[0].nom).toBe("DUPONT");
    });

    it("filtre par recherche multi-mots (prénom + nom)", async () => {
      await insertEffectif({ apprenant: { nom: "DUPONT", prenom: "Jean" } });
      await insertEffectif({ apprenant: { nom: "MARTIN", prenom: "Pierre" } });

      const result = await getCfaEffectifs(organisation, false, { ...defaultParams, search: "Jean DUPONT" });

      expect(result.pagination.total).toBe(1);
      expect(result.effectifs[0].nom).toBe("DUPONT");
      expect(result.effectifs[0].prenom).toBe("Jean");
    });

    it("filtre par recherche multi-mots dans l'ordre inverse (nom + prénom)", async () => {
      await insertEffectif({ apprenant: { nom: "DUPONT", prenom: "Jean" } });
      await insertEffectif({ apprenant: { nom: "MARTIN", prenom: "Pierre" } });

      const result = await getCfaEffectifs(organisation, false, { ...defaultParams, search: "DUPONT Jean" });

      expect(result.pagination.total).toBe(1);
      expect(result.effectifs[0].nom).toBe("DUPONT");
    });

    it("filtre par recherche partielle multi-mots", async () => {
      await insertEffectif({ apprenant: { nom: "DUPONT", prenom: "Jean" } });
      await insertEffectif({ apprenant: { nom: "MARTIN", prenom: "Pierre" } });

      const result = await getCfaEffectifs(organisation, false, { ...defaultParams, search: "Jea DUP" });

      expect(result.pagination.total).toBe(1);
      expect(result.effectifs[0].nom).toBe("DUPONT");
    });

    it("filtre par en_rupture=oui", async () => {
      const ruptureEffectif = await insertEffectif({ apprenant: { nom: "RUPTURE", prenom: "Test" } });
      await insertEffectif({ apprenant: { nom: "NORMAL", prenom: "Test" } });

      await missionLocaleEffectifsDb().insertOne(
        createMlEffectifDoc(ruptureEffectif, {
          cfa_rupture_declaration: {
            date_rupture: new Date(),
            declared_at: new Date(),
            declared_by: userId,
          },
        }) as any
      );

      const result = await getCfaEffectifs(organisation, false, { ...defaultParams, en_rupture: "oui" });

      expect(result.pagination.total).toBe(1);
      expect(result.effectifs[0].nom).toBe("RUPTURE");
      expect(result.effectifs[0].en_rupture).toBe(true);
    });

    it("filtre par formation", async () => {
      await insertEffectif({
        apprenant: { nom: "A", prenom: "Test" },
        formation: { libelle_long: "BTS Informatique" },
      });
      await insertEffectif({
        apprenant: { nom: "B", prenom: "Test" },
        formation: { libelle_long: "CAP Boulangerie" },
      });

      const result = await getCfaEffectifs(organisation, false, { ...defaultParams, formation: "BTS Informatique" });

      expect(result.pagination.total).toBe(1);
      expect(result.effectifs[0].libelle_formation).toBe("BTS Informatique");
    });

    it("retourne la liste des formations dans les filtres", async () => {
      await insertEffectif({
        apprenant: { nom: "A", prenom: "Test" },
        formation: { libelle_long: "BTS Informatique" },
      });
      await insertEffectif({
        apprenant: { nom: "B", prenom: "Test" },
        formation: { libelle_long: "CAP Boulangerie" },
      });

      const result = await getCfaEffectifs(organisation, false, defaultParams);

      expect(result.filters.formations).toContain("BTS Informatique");
      expect(result.filters.formations).toContain("CAP Boulangerie");
    });

    it("exclut les effectifs de moins de 16 ans", async () => {
      await insertEffectif({
        apprenant: { nom: "JEUNE", prenom: "Test", date_de_naissance: new Date(new Date().getFullYear() - 14, 0, 1) },
      });
      await insertEffectif({
        apprenant: { nom: "ADULTE", prenom: "Test" },
      });

      const result = await getCfaEffectifs(organisation, false, defaultParams);

      expect(result.pagination.total).toBe(1);
      expect(result.effectifs[0].nom).toBe("ADULTE");
    });

    it("déduplique ERP/DECA en priorité ERP", async () => {
      const ddn = new Date(2000, 5, 15);
      await insertEffectif({
        apprenant: { nom: "DUPONT", prenom: "Jean", date_de_naissance: ddn },
        source: "ERP",
      });
      const decaEffectif = {
        _id: new ObjectId(),
        deca_raw_id: new ObjectId(),
        ...(await createSampleEffectif({
          organisme: sampleOrganisme,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: { nom: "DUPONT", prenom: "Jean", date_de_naissance: ddn },
          source: "DECA" as any,
        })),
      };
      await effectifsDECADb().insertOne(decaEffectif as any);

      const result = await getCfaEffectifs(organisation, true, defaultParams);

      expect(result.pagination.total).toBe(1);
      expect(result.effectifs[0].source).toBe("effectifs");
    });
  });

  describe("getCfaEffectifDetail", () => {
    it("retourne depuis missionLocaleEffectif si présent", async () => {
      const effectif = await insertEffectif();
      await missionLocaleEffectifsDb().insertOne(createMlEffectifDoc(effectif) as any);

      const result = await getCfaEffectifDetail(organismeId, effectif._id.toString());

      expect(result.source).toBe("missionLocaleEffectif");
    });

    it("retourne depuis effectifs si pas de missionLocaleEffectif", async () => {
      const effectif = await insertEffectif();

      const result = await getCfaEffectifDetail(organismeId, effectif._id.toString());

      expect(result.source).toBe("effectifs");
      expect(result.data._id).toEqual(effectif._id);
    });

    it("retourne depuis effectifsDECA si source spécifiée", async () => {
      const decaEffectif = {
        _id: new ObjectId(),
        deca_raw_id: new ObjectId(),
        ...(await createSampleEffectif({
          organisme: sampleOrganisme,
          annee_scolaire: ANNEE_SCOLAIRE,
        })),
        organisme_id: organismeId,
      };
      await effectifsDECADb().insertOne(decaEffectif as any);

      const result = await getCfaEffectifDetail(organismeId, decaEffectif._id.toString(), "effectifsDECA");

      expect(result.source).toBe("effectifsDECA");
    });

    it("throw 404 si effectif non trouvé", async () => {
      await expect(getCfaEffectifDetail(organismeId, new ObjectId().toString())).rejects.toThrow("Effectif not found");
    });
  });

  describe("declareCfaEffectifRupture", () => {
    it("throw 404 si effectif non trouvé", async () => {
      await expect(
        declareCfaEffectifRupture(organismeId, new ObjectId().toString(), "effectifs", new Date(), userId)
      ).rejects.toThrow("Effectif non trouvé");
    });

    it("met à jour un missionLocaleEffectif existant", async () => {
      const effectif = await insertEffectif();
      await missionLocaleEffectifsDb().insertOne(createMlEffectifDoc(effectif) as any);

      const dateRupture = new Date("2026-01-15");
      const result = await declareCfaEffectifRupture(
        organismeId,
        effectif._id.toString(),
        "effectifs",
        dateRupture,
        userId
      );

      expect(result).toEqual({ created: false, updated: true });

      const updated = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
      expect(updated?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);
    });

    it("crée un nouveau missionLocaleEffectif", async () => {
      const mlNumericId = 42;
      const effectif = await insertEffectif({
        apprenant: {
          nom: "TEST",
          prenom: "User",
          adresse: { mission_locale_id: mlNumericId },
        },
      });

      await organisationsDb().insertOne({
        _id: mlOrganisationId,
        type: "MISSION_LOCALE",
        ml_id: mlNumericId,
        nom: "ML Test",
        created_at: new Date(),
      } as any);

      await organisationsDb().insertOne(organisation as any);

      const dateRupture = new Date("2026-01-15");
      const result = await declareCfaEffectifRupture(
        organismeId,
        effectif._id.toString(),
        "effectifs",
        dateRupture,
        userId
      );

      expect(result).toEqual({ created: true, updated: false });

      const created = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
      expect(created).toBeTruthy();
      expect(created?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);
      expect(created?.mission_locale_id).toEqual(mlOrganisationId);
    });

    it("throw badData si pas de mission_locale_id", async () => {
      const effectif = await insertEffectif({
        apprenant: {
          nom: "TEST",
          prenom: "User",
          adresse: {},
        },
      });

      await expect(
        declareCfaEffectifRupture(organismeId, effectif._id.toString(), "effectifs", new Date(), userId)
      ).rejects.toThrow("zone Mission Locale non identifiée");
    });
  });
});

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
    it("retourne les données depuis missionLocaleEffectif si présent", async () => {
      const effectif = await insertEffectif({ apprenant: { nom: "DUPONT", prenom: "Jean" } });
      await missionLocaleEffectifsDb().insertOne(createMlEffectifDoc(effectif) as any);

      const result = await getCfaEffectifDetail(organismeId, effectif._id.toString());

      expect(result.effectif.id).toEqual(effectif._id);
      expect(result.effectif.nom).toBe("DUPONT");
      expect(result.effectif.prenom).toBe("Jean");
      expect(result.currentIndex).toBe(0);
      expect(result.total).toBe(1);
    });

    it("retourne les données depuis effectifs si pas de missionLocaleEffectif", async () => {
      const effectif = await insertEffectif({ apprenant: { nom: "MARTIN", prenom: "Pierre" } });

      const result = await getCfaEffectifDetail(organismeId, effectif._id.toString());

      expect(result.effectif.id).toEqual(effectif._id);
      expect(result.effectif.nom).toBe("MARTIN");
      expect(result.effectif.date_rupture).toBeNull();
    });

    it("retourne les données depuis effectifsDECA si absent des autres collections", async () => {
      const decaEffectif = {
        _id: new ObjectId(),
        deca_raw_id: new ObjectId(),
        ...(await createSampleEffectif({
          organisme: sampleOrganisme,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: { nom: "DURAND", prenom: "Marie" },
        })),
        organisme_id: organismeId,
      };
      await effectifsDECADb().insertOne(decaEffectif as any);

      const result = await getCfaEffectifDetail(organismeId, decaEffectif._id.toString());

      expect(result.effectif.id).toEqual(decaEffectif._id);
      expect(result.effectif.nom).toBe("DURAND");
      expect(result.effectif.date_rupture).toBeNull();
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

    it("migre un ml record orphelin lié à un effectif jumeau (DECA → ERP)", async () => {
      const ddn = new Date("2005-06-15T00:00:00Z");
      const apprenantBase = {
        nom: "VILLENEUVE",
        prenom: "Téo",
        date_de_naissance: ddn,
        adresse: { mission_locale_id: 337 },
      };

      const decaEffectif = {
        _id: new ObjectId(),
        deca_raw_id: new ObjectId(),
        ...(await createSampleEffectif({
          organisme: sampleOrganisme,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: apprenantBase,
          source: "DECA" as any,
        })),
        organisme_id: organismeId,
        is_deca_compatible: true,
      };
      await effectifsDECADb().insertOne(decaEffectif as any);

      const mlRecord = createMlEffectifDoc(decaEffectif, {
        identifiant_normalise: { nom: "VILLENEUVE", prenom: "Téo", date_de_naissance: ddn },
        soft_deleted: false,
      });
      await missionLocaleEffectifsDb().insertOne(mlRecord as any);

      await organisationsDb().insertOne({
        _id: mlOrganisationId,
        type: "MISSION_LOCALE",
        ml_id: 337,
        nom: "ML Test",
        created_at: new Date(),
      } as any);
      await organisationsDb().insertOne(organisation as any);

      const erpEffectif = await insertEffectif({ apprenant: apprenantBase });

      const dateRupture = new Date("2026-01-10");
      const result = await declareCfaEffectifRupture(
        organismeId,
        erpEffectif._id.toString(),
        "effectifs",
        dateRupture,
        userId
      );

      expect(result).toEqual({ created: false, updated: true });

      const migrated = await missionLocaleEffectifsDb().findOne({ _id: mlRecord._id });
      expect(migrated?.effectif_id).toEqual(erpEffectif._id);
      expect(migrated?.effectif_snapshot?._id).toEqual(erpEffectif._id);
      expect(migrated?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);

      const detail = await getCfaEffectifDetail(organismeId, erpEffectif._id.toString());
      expect((detail.effectif as any).cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);
    });

    it("squatter ERP soft-deleted bloquant la migration : ressuscite + applique la rupture", async () => {
      const ddn = new Date("2005-06-15T00:00:00Z");
      const apprenantBase = {
        nom: "MOREAU",
        prenom: "Élise",
        date_de_naissance: ddn,
        adresse: { mission_locale_id: 337 },
      };

      const decaEffectif = {
        _id: new ObjectId(),
        deca_raw_id: new ObjectId(),
        ...(await createSampleEffectif({
          organisme: sampleOrganisme,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: apprenantBase,
          source: "DECA" as any,
        })),
        organisme_id: organismeId,
        is_deca_compatible: true,
      };
      await effectifsDECADb().insertOne(decaEffectif as any);

      // Orphan DECA actif avec identifiant_normalise.
      const orphanMlRecord = createMlEffectifDoc(decaEffectif, {
        identifiant_normalise: { nom: "MOREAU", prenom: "Élise", date_de_naissance: ddn },
        soft_deleted: false,
      });
      await missionLocaleEffectifsDb().insertOne(orphanMlRecord as any);

      await organisationsDb().insertOne({
        _id: mlOrganisationId,
        type: "MISSION_LOCALE",
        ml_id: 337,
        nom: "ML Test",
        created_at: new Date(),
      } as any);
      await organisationsDb().insertOne(organisation as any);

      const erpEffectif = await insertEffectif({ apprenant: apprenantBase });

      // Squatter ERP soft-deleted occupant déjà (ml, erpEffectif._id).
      const squatterMlRecord = createMlEffectifDoc(erpEffectif, {
        soft_deleted: true,
        situation: "RDV_PRIS",
      });
      await missionLocaleEffectifsDb().insertOne(squatterMlRecord as any);

      const dateRupture = new Date("2026-01-10");
      const result = await declareCfaEffectifRupture(
        organismeId,
        erpEffectif._id.toString(),
        "effectifs",
        dateRupture,
        userId
      );

      expect(result).toEqual({ created: false, updated: true });

      // Squatter ressuscité, rupture appliquée.
      const squatterAfter = await missionLocaleEffectifsDb().findOne({ _id: squatterMlRecord._id });
      expect(squatterAfter?.soft_deleted).toBe(false);
      expect(squatterAfter?.effectif_id).toEqual(erpEffectif._id);
      expect(squatterAfter?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);
      expect(squatterAfter?.organisme_data?.rupture).toBe(true);
      // Situation préexistante du squatter conservée.
      expect(squatterAfter?.situation).toBe("RDV_PRIS");

      // Orphan soft-deleted.
      const orphanAfter = await missionLocaleEffectifsDb().findOne({ _id: orphanMlRecord._id });
      expect(orphanAfter?.soft_deleted).toBe(true);
    });

    it("migre un ml record bound à un autre effectif du MÊME CFA (re-ingest multi-année)", async () => {
      // Apprenant ré-ingéré : plusieurs effectifs sur le même CFA, record ML lié à
      // l'ancien. Sans migration, le toggle resterait OFF au refresh.
      const ddn = new Date("2005-06-15T00:00:00Z");
      const apprenantBase = {
        nom: "VERGEZ",
        prenom: "Mathys",
        date_de_naissance: ddn,
        adresse: { mission_locale_id: 337 },
      };

      // Effectif "ancien" (année précédente) auquel le record ML est lié.
      const oldEffectif = await insertEffectif({ apprenant: apprenantBase });

      const oldMlRecord = createMlEffectifDoc(oldEffectif, {
        identifiant_normalise: { nom: "VERGEZ", prenom: "Mathys", date_de_naissance: ddn },
        soft_deleted: false,
      });
      await missionLocaleEffectifsDb().insertOne(oldMlRecord as any);

      await organisationsDb().insertOne({
        _id: mlOrganisationId,
        type: "MISSION_LOCALE",
        ml_id: 337,
        nom: "ML Test",
        created_at: new Date(),
      } as any);
      await organisationsDb().insertOne(organisation as any);

      // Effectif "courant" — celui sur lequel le user déclare la rupture.
      const newEffectif = await insertEffectif({ apprenant: apprenantBase });

      const dateRupture = new Date("2026-02-10");
      const result = await declareCfaEffectifRupture(
        organismeId,
        newEffectif._id.toString(),
        "effectifs",
        dateRupture,
        userId
      );

      expect(result).toEqual({ created: false, updated: true });

      // Le record ML a bien été repointé vers le nouvel effectif.
      const migrated = await missionLocaleEffectifsDb().findOne({ _id: oldMlRecord._id });
      expect(migrated?.effectif_id).toEqual(newEffectif._id);
      expect((migrated?.effectif_snapshot as any)?._id).toEqual(newEffectif._id);
      expect(migrated?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);
      expect(migrated?.organisme_data?.rupture).toBe(true);

      // Le pipeline UI joint sur effectif_id — on vérifie la même clé.
      const lookup = await missionLocaleEffectifsDb().findOne({
        effectif_id: newEffectif._id,
        soft_deleted: { $ne: true },
      });
      expect(lookup?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);

      // Pas de duplicat actif.
      const allActive = await missionLocaleEffectifsDb()
        .find({
          "identifiant_normalise.nom": "VERGEZ",
          mission_locale_id: mlOrganisationId,
          soft_deleted: { $ne: true },
        })
        .toArray();
      expect(allActive).toHaveLength(1);
    });

    it("migre un ml record orphelin lié à un autre CFA (cross-organisme, même ML cible)", async () => {
      // Même apprenant remonté par deux établissements (ex. deux sites d'une CMA).
      // Record orphelin sur l'autre CFA, même ML cible — sans migration, E11000 puis
      // patch du squatter sans repointer effectif_id.
      const ddn = new Date("2005-06-15T00:00:00Z");
      const apprenantBase = {
        nom: "VANDENBOSSCHE",
        prenom: "Margaux",
        date_de_naissance: ddn,
        adresse: { mission_locale_id: 337 },
      };

      const otherOrganismeId = new ObjectId(id(11));
      const otherOrganisme = {
        _id: otherOrganismeId,
        ...createRandomOrganisme(),
      };
      await organismesDb().insertOne(otherOrganisme);

      const otherEffectifId = new ObjectId();
      const otherEffectif = {
        _id: otherEffectifId,
        ...(await createSampleEffectif({
          organisme: otherOrganisme,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: apprenantBase,
        })),
        organisme_id: otherOrganismeId,
      };
      await effectifsDb().insertOne(otherEffectif as any);

      const orphanMlRecord = createMlEffectifDoc(otherEffectif, {
        effectif_snapshot: { ...otherEffectif, organisme_id: otherOrganismeId },
        identifiant_normalise: { nom: "VANDENBOSSCHE", prenom: "Margaux", date_de_naissance: ddn },
        soft_deleted: false,
      });
      await missionLocaleEffectifsDb().insertOne(orphanMlRecord as any);

      await organisationsDb().insertOne({
        _id: mlOrganisationId,
        type: "MISSION_LOCALE",
        ml_id: 337,
        nom: "ML Test",
        created_at: new Date(),
      } as any);
      await organisationsDb().insertOne(organisation as any);

      const erpEffectif = await insertEffectif({ apprenant: apprenantBase });

      const dateRupture = new Date("2026-02-10");
      const result = await declareCfaEffectifRupture(
        organismeId,
        erpEffectif._id.toString(),
        "effectifs",
        dateRupture,
        userId
      );

      expect(result).toEqual({ created: false, updated: true });

      const migrated = await missionLocaleEffectifsDb().findOne({ _id: orphanMlRecord._id });
      expect(migrated?.effectif_id).toEqual(erpEffectif._id);
      expect((migrated?.effectif_snapshot as any)?.organisme_id).toEqual(organismeId);
      expect(migrated?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);
      expect(migrated?.organisme_data?.rupture).toBe(true);

      const allActive = await missionLocaleEffectifsDb()
        .find({
          "identifiant_normalise.nom": "VANDENBOSSCHE",
          mission_locale_id: mlOrganisationId,
          soft_deleted: { $ne: true },
        })
        .toArray();
      expect(allActive).toHaveLength(1);
    });

    it("crée un nouveau record si l'apprenant est rattaché à une ML cible différente", async () => {
      // Pas de conflit d'index : (identifiant, ML A) et (identifiant, ML B) cohabitent.
      const ddn = new Date("2005-06-15T00:00:00Z");
      const apprenantBase = {
        nom: "DESCAMPS",
        prenom: "Lucie",
        date_de_naissance: ddn,
        adresse: { mission_locale_id: 337 },
      };

      const otherMlId = new ObjectId(id(12));
      const otherOrganismeId = new ObjectId(id(13));
      const otherOrganisme = {
        _id: otherOrganismeId,
        ...createRandomOrganisme(),
      };
      await organismesDb().insertOne(otherOrganisme);

      const otherEffectifId = new ObjectId();
      const otherEffectif = {
        _id: otherEffectifId,
        ...(await createSampleEffectif({
          organisme: otherOrganisme,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: { ...apprenantBase, adresse: { mission_locale_id: 999 } },
        })),
        organisme_id: otherOrganismeId,
      };
      await effectifsDb().insertOne(otherEffectif as any);

      const existingMlRecord = createMlEffectifDoc(otherEffectif, {
        mission_locale_id: otherMlId,
        effectif_snapshot: { ...otherEffectif, organisme_id: otherOrganismeId },
        identifiant_normalise: { nom: "DESCAMPS", prenom: "Lucie", date_de_naissance: ddn },
        soft_deleted: false,
      });
      await missionLocaleEffectifsDb().insertOne(existingMlRecord as any);

      await organisationsDb().insertOne({
        _id: mlOrganisationId,
        type: "MISSION_LOCALE",
        ml_id: 337,
        nom: "ML Test (cible)",
        created_at: new Date(),
      } as any);
      await organisationsDb().insertOne(organisation as any);

      const erpEffectif = await insertEffectif({ apprenant: apprenantBase });

      const dateRupture = new Date("2026-02-10");
      const result = await declareCfaEffectifRupture(
        organismeId,
        erpEffectif._id.toString(),
        "effectifs",
        dateRupture,
        userId
      );

      expect(result).toEqual({ created: true, updated: false });

      const created = await missionLocaleEffectifsDb().findOne({
        effectif_id: erpEffectif._id,
        mission_locale_id: mlOrganisationId,
      });
      expect(created?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);

      const oldRecord = await missionLocaleEffectifsDb().findOne({ _id: existingMlRecord._id });
      expect(oldRecord?.effectif_id).toEqual(otherEffectifId);
      expect(oldRecord?.cfa_rupture_declaration).toBeFalsy();
    });

    it("ne migre PAS un orphelin ERP cross-organisme vers un effectif DECA (priorité ERP > DECA)", async () => {
      // Orphelin cross-org bound à un ERP. CFA déclare la rupture via DECA pour le
      // même apprenant — patch en place sans repointer effectif_id (priorité ERP).
      const ddn = new Date("2005-06-15T00:00:00Z");
      const apprenantBase = {
        nom: "BERNARD",
        prenom: "Camille",
        date_de_naissance: ddn,
        adresse: { mission_locale_id: 337 },
      };

      const otherOrganismeId = new ObjectId(id(14));
      const otherOrganisme = {
        _id: otherOrganismeId,
        ...createRandomOrganisme(),
      };
      await organismesDb().insertOne(otherOrganisme);

      const otherErpEffectifId = new ObjectId();
      const otherErpEffectif = {
        _id: otherErpEffectifId,
        ...(await createSampleEffectif({
          organisme: otherOrganisme,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: apprenantBase,
        })),
        organisme_id: otherOrganismeId,
      };
      await effectifsDb().insertOne(otherErpEffectif as any);

      const orphanMlRecord = createMlEffectifDoc(otherErpEffectif, {
        effectif_snapshot: { ...otherErpEffectif, organisme_id: otherOrganismeId },
        identifiant_normalise: { nom: "BERNARD", prenom: "Camille", date_de_naissance: ddn },
        soft_deleted: false,
      });
      await missionLocaleEffectifsDb().insertOne(orphanMlRecord as any);

      const decaEffectif = {
        _id: new ObjectId(),
        deca_raw_id: new ObjectId(),
        ...(await createSampleEffectif({
          organisme: sampleOrganisme,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: apprenantBase,
          source: "DECA" as any,
        })),
        organisme_id: organismeId,
      };
      await effectifsDECADb().insertOne(decaEffectif as any);

      await organisationsDb().insertOne({
        _id: mlOrganisationId,
        type: "MISSION_LOCALE",
        ml_id: 337,
        nom: "ML Test",
        created_at: new Date(),
      } as any);
      await organisationsDb().insertOne(organisation as any);

      const dateRupture = new Date("2026-02-10");
      const result = await declareCfaEffectifRupture(
        organismeId,
        decaEffectif._id.toString(),
        "effectifsDECA",
        dateRupture,
        userId
      );

      expect(result).toEqual({ created: false, updated: true });

      const after = await missionLocaleEffectifsDb().findOne({ _id: orphanMlRecord._id });
      expect(after?.effectif_id).toEqual(otherErpEffectifId);
      expect((after?.effectif_snapshot as any)?.organisme_id).toEqual(otherOrganismeId);
      expect(after?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);
      expect(after?.organisme_data?.rupture).toBe(true);
    });

    it("ne migre PAS dans le sens ERP → DECA quand un ml record est déjà bound à un ERP", async () => {
      const ddn = new Date("2005-06-15T00:00:00Z");
      const apprenantBase = {
        nom: "DURAND",
        prenom: "Léa",
        date_de_naissance: ddn,
        adresse: { mission_locale_id: 337 },
      };

      const erpEffectif = await insertEffectif({ apprenant: apprenantBase });
      const mlRecord = createMlEffectifDoc(erpEffectif, {
        identifiant_normalise: { nom: "DURAND", prenom: "Léa", date_de_naissance: ddn },
        soft_deleted: false,
      });
      await missionLocaleEffectifsDb().insertOne(mlRecord as any);

      const decaEffectif = {
        _id: new ObjectId(),
        deca_raw_id: new ObjectId(),
        ...(await createSampleEffectif({
          organisme: sampleOrganisme,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: apprenantBase,
          source: "DECA" as any,
        })),
        organisme_id: organismeId,
      };
      await effectifsDECADb().insertOne(decaEffectif as any);

      await organisationsDb().insertOne({
        _id: mlOrganisationId,
        type: "MISSION_LOCALE",
        ml_id: 337,
        nom: "ML Test",
        created_at: new Date(),
      } as any);
      await organisationsDb().insertOne(organisation as any);

      const dateRupture = new Date("2026-01-10");
      const result = await declareCfaEffectifRupture(
        organismeId,
        decaEffectif._id.toString(),
        "effectifsDECA",
        dateRupture,
        userId
      );

      expect(result).toEqual({ created: false, updated: true });

      const after = await missionLocaleEffectifsDb().findOne({ _id: mlRecord._id });
      expect(after?.effectif_id).toEqual(erpEffectif._id);
      expect(after?.effectif_snapshot?._id).toEqual(erpEffectif._id);
      expect(after?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);
    });
  });
});

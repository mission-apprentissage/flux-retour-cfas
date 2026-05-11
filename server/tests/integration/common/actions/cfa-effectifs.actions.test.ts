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

    it("date_rupture remontée pour un effectif ABANDON avec contrat rupturé", async () => {
      // Avant fix : pipeline ne remontait date_rupture que si en_cours = RUPTURANT.
      // Cas Ines HALAILI : ABANDON (rupture > 180j) mais contrat a une date_rupture.
      const ruptureDate = new Date("2025-09-01");
      const effectif = await insertEffectif({
        apprenant: { nom: "HALAILI_TEST", prenom: "Ines" },
        contrats: [{ date_rupture: ruptureDate, date_debut: new Date("2024-09-01"), date_fin: new Date("2026-08-31") }],
        _computed: { statut: { en_cours: "ABANDON", parcours: [] } },
      });

      const result = await getCfaEffectifs(organisation, false, defaultParams);

      const match = result.effectifs.find((e) => (e as any).id?.toString() === effectif._id.toString());
      expect(match).toBeDefined();
      expect((match as any).date_rupture?.toISOString()).toBe(ruptureDate.toISOString());
    });

    it("date_rupture fallback sur ml_doc.date_rupture si effectif live n'a pas de rupture", async () => {
      // Cas Denovan JACCOB : effectif re-ingéré sans rupture (contrat sans date_rupture),
      // mais ml_doc.date_rupture garde la trace de la rupture précédente.
      const ruptureSnapshot = new Date("2025-09-02");
      const effectif = await insertEffectif({
        apprenant: { nom: "JACCOB_TEST", prenom: "Denovan" },
        contrats: [{ date_debut: new Date("2024-09-01"), date_fin: new Date("2026-08-31") }],
        _computed: { statut: { en_cours: "ABANDON", parcours: [] } },
      });
      await missionLocaleEffectifsDb().insertOne(
        createMlEffectifDoc(effectif, {
          date_rupture: ruptureSnapshot,
          situation: "NE_VEUT_PAS_ACCOMPAGNEMENT",
        }) as any
      );

      const result = await getCfaEffectifs(organisation, false, defaultParams);

      const match = result.effectifs.find((e) => (e as any).id?.toString() === effectif._id.toString());
      expect(match).toBeDefined();
      expect((match as any).date_rupture?.toISOString()).toBe(ruptureSnapshot.toISOString());
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

    it("fallback identifiant scopé famille : remonte un ml record d'un organisme apparenté", async () => {
      const rOrgId = new ObjectId(id(40));
      const rOrgSiret = "13002374000439";
      const rOrg = {
        _id: rOrgId,
        ...createRandomOrganisme(),
        organismesFormateurs: [{ _id: organismeId, siret: sampleOrganisme.siret }],
      };
      rOrg.siret = rOrgSiret;
      await organismesDb().insertOne(rOrg as any);
      await organismesDb().updateOne(
        { _id: organismeId },
        { $set: { organismesResponsables: [{ _id: rOrgId, siret: rOrgSiret }] } }
      );

      const ddn = new Date(2005, 5, 15);
      const apprenantBase = { nom: "TESTNOM_A", prenom: "Prenoma", date_de_naissance: ddn };

      const otherEffectifId = new ObjectId();
      const otherEffectif = {
        _id: otherEffectifId,
        ...(await createSampleEffectif({
          organisme: rOrg as any,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: apprenantBase,
        })),
        organisme_id: rOrgId,
      };
      await effectifsDb().insertOne(otherEffectif as any);

      const mlRecord = createMlEffectifDoc(otherEffectif, {
        effectif_snapshot: { ...otherEffectif, organisme_id: rOrgId },
        identifiant_normalise: apprenantBase,
        situation: "INJOIGNABLE_APRES_RELANCES",
        soft_deleted: false,
      });
      await missionLocaleEffectifsDb().insertOne(mlRecord as any);

      const ownEffectif = await insertEffectif({ apprenant: apprenantBase });

      const result = await getCfaEffectifs(organisation, false, defaultParams);

      const match = result.effectifs.find((e) => (e as any).id?.toString() === ownEffectif._id.toString());
      expect(match).toBeDefined();
      // traite_par_ml prouve que le fallback a matché (sinon default demarrer_collab).
      expect((match as any).collab_status).toBe("traite_par_ml");
    });

    it("fallback identifiant : ne matche PAS un ml record hors famille", async () => {
      const strangerOrgId = new ObjectId(id(45));
      const strangerOrg = {
        _id: strangerOrgId,
        ...createRandomOrganisme(),
      };
      await organismesDb().insertOne(strangerOrg as any);

      const ddn = new Date(2005, 5, 15);
      const apprenantBase = { nom: "TESTNOM_B", prenom: "Prenomb", date_de_naissance: ddn };

      const strangerEffectifId = new ObjectId();
      const strangerEffectif = {
        _id: strangerEffectifId,
        ...(await createSampleEffectif({
          organisme: strangerOrg as any,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: apprenantBase,
        })),
        organisme_id: strangerOrgId,
      };
      await effectifsDb().insertOne(strangerEffectif as any);

      const mlRecord = createMlEffectifDoc(strangerEffectif, {
        effectif_snapshot: { ...strangerEffectif, organisme_id: strangerOrgId },
        identifiant_normalise: apprenantBase,
        situation: "CHERCHE_CONTRAT",
        soft_deleted: false,
      });
      await missionLocaleEffectifsDb().insertOne(mlRecord as any);

      const ownEffectif = await insertEffectif({ apprenant: apprenantBase });

      const result = await getCfaEffectifs(organisation, false, defaultParams);

      const match = result.effectifs.find((e) => (e as any).id?.toString() === ownEffectif._id.toString());
      expect(match).toBeDefined();
      expect((match as any).collab_status).toBe("demarrer_collab");
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

    it("fallback identifiant + famille : remonte un ml record d'un organisme apparenté", async () => {
      const rOrgId = new ObjectId(id(40));
      const rOrgSiret = "13002374000439";
      const rOrg = {
        _id: rOrgId,
        ...createRandomOrganisme(),
        organismesFormateurs: [{ _id: organismeId, siret: sampleOrganisme.siret }],
      };
      rOrg.siret = rOrgSiret;
      await organismesDb().insertOne(rOrg as any);
      await organismesDb().updateOne(
        { _id: organismeId },
        { $set: { organismesResponsables: [{ _id: rOrgId, siret: rOrgSiret }] } }
      );

      // UTC midnight requis : normalisePersonIdentifiant (côté detail) sinon décale la date.
      const ddn = new Date("2005-06-15T00:00:00.000Z");
      const apprenantBase = { nom: "TESTNOM_A", prenom: "Prenoma", date_de_naissance: ddn };

      const otherEffectifId = new ObjectId();
      const otherEffectif = {
        _id: otherEffectifId,
        ...(await createSampleEffectif({
          organisme: rOrg as any,
          annee_scolaire: ANNEE_SCOLAIRE,
          apprenant: apprenantBase,
        })),
        organisme_id: rOrgId,
      };
      await effectifsDb().insertOne(otherEffectif as any);

      const mlRecord = createMlEffectifDoc(otherEffectif, {
        effectif_snapshot: { ...otherEffectif, organisme_id: rOrgId },
        identifiant_normalise: apprenantBase,
        situation: "INJOIGNABLE_APRES_RELANCES",
        commentaires: "déjà traité par la ML",
        soft_deleted: false,
      });
      await missionLocaleEffectifsDb().insertOne(mlRecord as any);

      const ownEffectif = await insertEffectif({ apprenant: apprenantBase });

      const result = await getCfaEffectifDetail(organismeId, ownEffectif._id.toString());

      expect((result.effectif as any).situation?.situation).toBe("INJOIGNABLE_APRES_RELANCES");
      expect((result.effectif as any).situation?.commentaires).toBe("déjà traité par la ML");
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
        nom: "TESTNOM_C",
        prenom: "Prenomc",
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
        identifiant_normalise: { nom: "TESTNOM_C", prenom: "Prenomc", date_de_naissance: ddn },
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
        nom: "TESTNOM_D",
        prenom: "Prenomd",
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
        identifiant_normalise: { nom: "TESTNOM_D", prenom: "Prenomd", date_de_naissance: ddn },
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
        nom: "TESTNOM_E",
        prenom: "Prenome",
        date_de_naissance: ddn,
        adresse: { mission_locale_id: 337 },
      };

      // Effectif "ancien" (année précédente) auquel le record ML est lié.
      const oldEffectif = await insertEffectif({ apprenant: apprenantBase });

      const oldMlRecord = createMlEffectifDoc(oldEffectif, {
        identifiant_normalise: { nom: "TESTNOM_E", prenom: "Prenome", date_de_naissance: ddn },
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
          "identifiant_normalise.nom": "TESTNOM_E",
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
        nom: "TESTNOM_F",
        prenom: "Prenomf",
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
        identifiant_normalise: { nom: "TESTNOM_F", prenom: "Prenomf", date_de_naissance: ddn },
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
          "identifiant_normalise.nom": "TESTNOM_F",
          mission_locale_id: mlOrganisationId,
          soft_deleted: { $ne: true },
        })
        .toArray();
      expect(allActive).toHaveLength(1);
    });

    it("cross-ML : repointe effectif_id et snapshot, préserve ML d'origine et historique", async () => {
      // Apprenant a un record sur ML A, l'effectif Arras a ML B. L'index unique global
      // sur (identifiant_normalise) bloque l'INSERT — on repointe seulement effectif_id
      // et snapshot vers le CFA appelant (toggle UI), en préservant la ML d'origine et
      // l'historique de traitement (la ML qui suit reste celle qui a déjà commencé).
      const ddn = new Date("2005-06-15T00:00:00Z");
      const apprenantBase = {
        nom: "TESTNOM_A",
        prenom: "Prenoma",
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
        identifiant_normalise: { nom: "TESTNOM_A", prenom: "Prenoma", date_de_naissance: ddn },
        soft_deleted: false,
        situation: "INJOIGNABLE_APRES_RELANCES",
        commentaires: "déjà appelé par l'ancienne ML",
        current_status: { value: "RUPTURANT", date: new Date("2025-11-20") },
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

      expect(result).toEqual({ created: false, updated: true });

      const migrated = await missionLocaleEffectifsDb().findOne({ _id: existingMlRecord._id });

      // Repointé vers le CFA appelant : toggle UI fonctionne.
      expect(migrated?.effectif_id).toEqual(erpEffectif._id);
      expect((migrated?.effectif_snapshot as any)?._id).toEqual(erpEffectif._id);
      expect((migrated?.effectif_snapshot as any)?.organisme_id).toEqual(organismeId);
      expect(migrated?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);
      expect(migrated?.organisme_data?.rupture).toBe(true);

      // ML d'origine préservée : continuité du suivi côté ML qui a déjà traité.
      expect(migrated?.mission_locale_id).toEqual(otherMlId);
      expect(migrated?.situation).toBe("INJOIGNABLE_APRES_RELANCES");
      expect(migrated?.commentaires).toBe("déjà appelé par l'ancienne ML");
      expect(migrated?.current_status?.value).toBe("RUPTURANT");

      // Pas de duplicat actif.
      const allActive = await missionLocaleEffectifsDb()
        .find({
          "identifiant_normalise.nom": "TESTNOM_A",
          soft_deleted: { $ne: true },
        })
        .toArray();
      expect(allActive).toHaveLength(1);
    });

    it("ne migre PAS un orphelin ERP cross-organisme vers un effectif DECA (priorité ERP > DECA)", async () => {
      // Orphelin cross-org bound à un ERP. CFA déclare la rupture via DECA pour le
      // même apprenant — patch en place sans repointer effectif_id (priorité ERP).
      const ddn = new Date("2005-06-15T00:00:00Z");
      const apprenantBase = {
        nom: "TESTNOM_G",
        prenom: "Prenomg",
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
        identifiant_normalise: { nom: "TESTNOM_G", prenom: "Prenomg", date_de_naissance: ddn },
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
        nom: "TESTNOM_H",
        prenom: "Prenomh",
        date_de_naissance: ddn,
        adresse: { mission_locale_id: 337 },
      };

      const erpEffectif = await insertEffectif({ apprenant: apprenantBase });
      const mlRecord = createMlEffectifDoc(erpEffectif, {
        identifiant_normalise: { nom: "TESTNOM_H", prenom: "Prenomh", date_de_naissance: ddn },
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

    it("cross-ML : ne migre PAS dans le sens ERP → DECA (priorité ERP > DECA, patch en place)", async () => {
      const ddn = new Date("2005-06-15T00:00:00Z");
      const apprenantBase = {
        nom: "TESTNOM_I",
        prenom: "Prenomi",
        date_de_naissance: ddn,
        adresse: { mission_locale_id: 337 },
      };

      const otherMlId = new ObjectId(id(15));
      const otherOrganismeId = new ObjectId(id(16));
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
          apprenant: { ...apprenantBase, adresse: { mission_locale_id: 999 } },
        })),
        organisme_id: otherOrganismeId,
      };
      await effectifsDb().insertOne(otherErpEffectif as any);

      const existingMlRecord = createMlEffectifDoc(otherErpEffectif, {
        mission_locale_id: otherMlId,
        effectif_snapshot: { ...otherErpEffectif, organisme_id: otherOrganismeId },
        identifiant_normalise: { nom: "TESTNOM_I", prenom: "Prenomi", date_de_naissance: ddn },
        soft_deleted: false,
        situation: "INJOIGNABLE_APRES_RELANCES",
      });
      await missionLocaleEffectifsDb().insertOne(existingMlRecord as any);

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

      const after = await missionLocaleEffectifsDb().findOne({ _id: existingMlRecord._id });
      expect(after?.effectif_id).toEqual(otherErpEffectifId);
      expect((after?.effectif_snapshot as any)?.organisme_id).toEqual(otherOrganismeId);
      expect(after?.cfa_rupture_declaration?.date_rupture).toEqual(dateRupture);
      expect(after?.organisme_data?.rupture).toBe(true);
      expect(after?.mission_locale_id).toEqual(otherMlId);
      expect(after?.situation).toBe("INJOIGNABLE_APRES_RELANCES");
    });
  });
});

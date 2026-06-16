import { ObjectId } from "bson";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import { IOrganisme } from "shared/models/data/organismes.model";
import { generateFormationCatalogueFixture } from "shared/models/fixtures/formationsCatalogue.fixture";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";
import { describe, expect, it } from "vitest";

import { checkCollabV2Eligibility } from "@/common/actions/organismes/collab-v2-eligibility";
import { effectifsDb, effectifsDECADb, formationsCatalogueDb, organismesDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const SIRET_SELF = "13002792300049";
const UAI_SELF = "0161230A";
const SIRET_TIERS = "13002792300056";
const UAI_TIERS = "0161229Z";

const [currentAnnee, previousAnnee] = getActiveAnneesScolaires(new Date());

async function insertOrganisme(overrides: Partial<IOrganisme> = {}) {
  const base = generateOrganismeFixture({
    siret: SIRET_SELF,
    uai: UAI_SELF,
    nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
  });
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete (base as any)[key];
    } else {
      (base as any)[key] = value;
    }
  }
  await organismesDb().insertOne(base, { bypassDocumentValidation: true });
  return base;
}

async function insertEffectif(organisme_id: ObjectId, annee_scolaire: string) {
  await effectifsDb().insertOne({ _id: new ObjectId(), organisme_id, annee_scolaire } as any, {
    bypassDocumentValidation: true,
  });
}

async function insertEffectifDECA(organisme_id: ObjectId, annee_scolaire: string) {
  await effectifsDECADb().insertOne({ _id: new ObjectId(), organisme_id, annee_scolaire } as any, {
    bypassDocumentValidation: true,
  });
}

async function insertFormationCatalogue(overrides: Partial<ReturnType<typeof generateFormationCatalogueFixture>>) {
  await formationsCatalogueDb().insertOne(
    generateFormationCatalogueFixture({
      etablissement_gestionnaire_siret: SIRET_SELF,
      etablissement_gestionnaire_uai: UAI_SELF,
      etablissement_formateur_siret: SIRET_SELF,
      etablissement_formateur_uai: UAI_SELF,
      published: true,
      ...overrides,
    })
  );
}

describe("checkCollabV2Eligibility", () => {
  describe("exists_with_siret_uai", () => {
    it("fails when organisme does not exist", async () => {
      const result = await checkCollabV2Eligibility(new ObjectId().toHexString());
      expect(result.organisme).toBeNull();
      expect(result.checks.exists_with_siret_uai.passed).toBe(false);
      expect(result.eligible).toBe(false);
    });

    it("fails when organisme id is not a valid ObjectId", async () => {
      const result = await checkCollabV2Eligibility("not-an-objectid");
      expect(result.organisme).toBeNull();
      expect(result.checks.exists_with_siret_uai.passed).toBe(false);
      expect(result.eligible).toBe(false);
    });

    it("fails when uai is missing (uai requis)", async () => {
      const organisme = await insertOrganisme({ uai: undefined });
      await insertEffectif(organisme._id as ObjectId, currentAnnee);
      const result = await checkCollabV2Eligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.exists_with_siret_uai.passed).toBe(false);
      expect(result.eligible).toBe(false);
    });
  });

  describe("nature", () => {
    const cases = [
      { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE, expected: false },
      { nature: NATURE_ORGANISME_DE_FORMATION.INCONNUE, expected: false },
      { nature: undefined, expected: false },
      { nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR, expected: true },
      { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR, expected: true },
    ] as const;

    cases.forEach(({ nature, expected }) => {
      it(`returns nature.passed=${expected} for nature=${nature ?? "undefined"}`, async () => {
        const organisme = await insertOrganisme({ nature });
        const result = await checkCollabV2Eligibility((organisme._id as ObjectId).toHexString());
        expect(result.checks.nature.passed).toBe(expected);
        expect(result.checks.nature.details?.natureActuelle).toBe(nature ?? null);
      });
    });
  });

  describe("has_effectifs_erp (ERP uniquement)", () => {
    it("fails when no effectifs at all", async () => {
      const organisme = await insertOrganisme();
      const result = await checkCollabV2Eligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.has_effectifs_erp.passed).toBe(false);
      expect(result.checks.has_effectifs_erp.details?.effectifsErpCount).toBe(0);
    });

    it("passes with ERP effectifs on current annee", async () => {
      const organisme = await insertOrganisme();
      await insertEffectif(organisme._id as ObjectId, currentAnnee);
      const result = await checkCollabV2Eligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.has_effectifs_erp.passed).toBe(true);
      expect(result.checks.has_effectifs_erp.details?.effectifsErpCount).toBe(1);
    });

    it("fails with DECA effectifs only (DECA not counted)", async () => {
      const organisme = await insertOrganisme();
      await insertEffectifDECA(organisme._id as ObjectId, currentAnnee);
      await insertEffectifDECA(organisme._id as ObjectId, previousAnnee);
      const result = await checkCollabV2Eligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.has_effectifs_erp.passed).toBe(false);
      expect(result.eligible).toBe(false);
    });

    it("fails when ERP effectifs are only on inactive annees", async () => {
      const organisme = await insertOrganisme();
      await insertEffectif(organisme._id as ObjectId, "2010-2011");
      const result = await checkCollabV2Eligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.has_effectifs_erp.passed).toBe(false);
    });
  });

  describe("not_already_active", () => {
    it("is false and alreadyActive=true when is_allowed_collab is true", async () => {
      const organisme = await insertOrganisme({ is_allowed_collab: true });
      const result = await checkCollabV2Eligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.not_already_active.passed).toBe(false);
      expect(result.alreadyActive).toBe(true);
      expect(result.eligible).toBe(false);
    });
  });

  describe("formateur tiers ignoré (différence vs DECA-CFA)", () => {
    it("returns eligible=true even with a published gestionnaire=self / formateur=tiers formation", async () => {
      const organisme = await insertOrganisme({ nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR });
      await insertEffectif(organisme._id as ObjectId, currentAnnee);
      await insertFormationCatalogue({
        etablissement_formateur_siret: SIRET_TIERS,
        etablissement_formateur_uai: UAI_TIERS,
      });
      const result = await checkCollabV2Eligibility((organisme._id as ObjectId).toHexString());
      expect(result.eligible).toBe(true);
      expect(result.alreadyActive).toBe(false);
    });
  });

  describe("eligible (all checks passing)", () => {
    it("returns eligible=true for nature=formateur with ERP effectif on current annee", async () => {
      const organisme = await insertOrganisme({ nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR });
      await insertEffectif(organisme._id as ObjectId, currentAnnee);
      const result = await checkCollabV2Eligibility((organisme._id as ObjectId).toHexString());
      expect(result.eligible).toBe(true);
      expect(result.alreadyActive).toBe(false);
    });
  });
});

import { ObjectId } from "bson";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import { IOrganisme } from "shared/models/data/organismes.model";
import { generateFormationCatalogueFixture } from "shared/models/fixtures/formationsCatalogue.fixture";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";
import { describe, expect, it } from "vitest";

import { checkActivationEligibility, findEligibleOrganismes } from "@/common/actions/organismes/deca-cfa-eligibility";
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
  // explicit `undefined` in overrides would be persisted by spread; we drop those keys.
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

describe("checkActivationEligibility", () => {
  describe("exists_with_siret_uai", () => {
    it("fails when organisme does not exist", async () => {
      const result = await checkActivationEligibility(new ObjectId().toHexString());
      expect(result.organisme).toBeNull();
      expect(result.checks.exists_with_siret_uai.passed).toBe(false);
      expect(result.checks.nature.passed).toBe(false);
      expect(result.checks.no_formateurs_tiers.passed).toBe(false);
      expect(result.checks.has_effectifs.passed).toBe(false);
      expect(result.eligible).toBe(false);
    });

    it("fails when organisme id is not a valid ObjectId", async () => {
      const result = await checkActivationEligibility("not-an-objectid");
      expect(result.organisme).toBeNull();
      expect(result.checks.exists_with_siret_uai.passed).toBe(false);
      expect(result.eligible).toBe(false);
    });

    it("fails when uai is missing", async () => {
      const organisme = await insertOrganisme({ uai: undefined });
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
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
        const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
        expect(result.checks.nature.passed).toBe(expected);
        expect(result.checks.nature.details?.natureActuelle).toBe(nature ?? null);
      });
    });
  });

  describe("no_formateurs_tiers", () => {
    it("fails when catalogue contains a published doc gestionnaire=self / formateur=tiers", async () => {
      const organisme = await insertOrganisme();
      await insertFormationCatalogue({
        etablissement_formateur_siret: SIRET_TIERS,
        etablissement_formateur_uai: UAI_TIERS,
      });
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.no_formateurs_tiers.passed).toBe(false);
      expect(result.checks.no_formateurs_tiers.details?.formateursTiersCount).toBe(1);
    });

    it("passes when catalogue contains only self-referencing formations", async () => {
      const organisme = await insertOrganisme();
      await insertFormationCatalogue({});
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.no_formateurs_tiers.passed).toBe(true);
      expect(result.checks.no_formateurs_tiers.details?.formateursTiersCount).toBe(0);
    });

    it("ignores unpublished tier formations", async () => {
      const organisme = await insertOrganisme();
      await insertFormationCatalogue({
        etablissement_formateur_siret: SIRET_TIERS,
        etablissement_formateur_uai: UAI_TIERS,
        published: false,
      });
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.no_formateurs_tiers.passed).toBe(true);
    });
  });

  describe("has_effectifs", () => {
    it("fails when no effectifs at all", async () => {
      const organisme = await insertOrganisme();
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.has_effectifs.passed).toBe(false);
      expect(result.checks.has_effectifs.details?.effectifsErpCount).toBe(0);
      expect(result.checks.has_effectifs.details?.effectifsDecaCount).toBe(0);
    });

    it("passes with ERP effectifs only on current annee", async () => {
      const organisme = await insertOrganisme();
      await insertEffectif(organisme._id as ObjectId, currentAnnee);
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.has_effectifs.passed).toBe(true);
      expect(result.checks.has_effectifs.details?.effectifsErpCount).toBe(1);
      expect(result.checks.has_effectifs.details?.effectifsDecaCount).toBe(0);
    });

    it("passes with DECA effectifs only on previous annee", async () => {
      const organisme = await insertOrganisme();
      await insertEffectifDECA(organisme._id as ObjectId, previousAnnee);
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.has_effectifs.passed).toBe(true);
      expect(result.checks.has_effectifs.details?.effectifsErpCount).toBe(0);
      expect(result.checks.has_effectifs.details?.effectifsDecaCount).toBe(1);
    });

    it("fails when effectifs are only on inactive annees", async () => {
      const organisme = await insertOrganisme();
      await insertEffectif(organisme._id as ObjectId, "2010-2011");
      await insertEffectifDECA(organisme._id as ObjectId, "2010-2011");
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.has_effectifs.passed).toBe(false);
    });
  });

  describe("not_already_active", () => {
    it("is false and alreadyActive=true when is_allowed_deca is true", async () => {
      const organisme = await insertOrganisme({ is_allowed_deca: true });
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.not_already_active.passed).toBe(false);
      expect(result.alreadyActive).toBe(true);
      expect(result.eligible).toBe(false);
    });
  });

  describe("eligible (all checks passing)", () => {
    it("returns eligible=true for nature=formateur with no catalogue and ERP effectif on current annee", async () => {
      const organisme = await insertOrganisme({
        nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
      });
      await insertEffectif(organisme._id as ObjectId, currentAnnee);
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
      expect(result.eligible).toBe(true);
      expect(result.alreadyActive).toBe(false);
    });

    it("returns eligible=true for nature=responsable_formateur with only self-referencing catalogue", async () => {
      const organisme = await insertOrganisme({
        nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR,
      });
      await insertFormationCatalogue({});
      await insertEffectif(organisme._id as ObjectId, currentAnnee);
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
      expect(result.eligible).toBe(true);
    });

    it("returns eligible=false for nature=responsable_formateur chapeautant un formateur tiers", async () => {
      const organisme = await insertOrganisme({
        nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR,
      });
      await insertFormationCatalogue({
        etablissement_formateur_siret: SIRET_TIERS,
        etablissement_formateur_uai: UAI_TIERS,
      });
      await insertEffectif(organisme._id as ObjectId, currentAnnee);
      const result = await checkActivationEligibility((organisme._id as ObjectId).toHexString());
      expect(result.checks.no_formateurs_tiers.passed).toBe(false);
      expect(result.eligible).toBe(false);
    });
  });
});

describe("findEligibleOrganismes", () => {
  let uaiCounter = 0;
  const nextUai = () => `020000${(uaiCounter++).toString().padStart(2, "0")}A`;
  const nextSiret = () => `1234567890${(uaiCounter * 7).toString().padStart(4, "0")}`;

  async function insertOrg(overrides: Partial<IOrganisme> = {}) {
    const org = generateOrganismeFixture({
      siret: nextSiret(),
      uai: nextUai(),
      nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
      ...overrides,
    });
    await organismesDb().insertOne(org, { bypassDocumentValidation: true });
    return org;
  }

  it("returns an empty array when no organisme is eligible", async () => {
    await insertOrg({ ferme: true });
    await insertOrg({ nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE });
    const eligibleWithoutEffectif = await insertOrg();
    await insertFormationCatalogue({
      etablissement_gestionnaire_siret: eligibleWithoutEffectif.siret,
      etablissement_gestionnaire_uai: eligibleWithoutEffectif.uai!,
      etablissement_formateur_siret: eligibleWithoutEffectif.siret,
      etablissement_formateur_uai: eligibleWithoutEffectif.uai!,
    });

    const rows = await findEligibleOrganismes();
    expect(rows).toEqual([]);
  });

  it("excludes organismes where catalogue publishes a gestionnaire=self / formateur=tiers formation", async () => {
    const withTiers = await insertOrg();
    await insertEffectif(withTiers._id as ObjectId, currentAnnee);
    await insertFormationCatalogue({
      etablissement_gestionnaire_siret: withTiers.siret,
      etablissement_gestionnaire_uai: withTiers.uai!,
      etablissement_formateur_siret: SIRET_TIERS,
      etablissement_formateur_uai: UAI_TIERS,
    });

    const cleanOrg = await insertOrg();
    await insertEffectifDECA(cleanOrg._id as ObjectId, currentAnnee);

    const rows = await findEligibleOrganismes();

    const ids = rows.map((r) => r._id.toString());
    expect(ids).toContain((cleanOrg._id as ObjectId).toString());
    expect(ids).not.toContain((withTiers._id as ObjectId).toString());

    const cleanRow = rows.find((r) => r._id.toString() === (cleanOrg._id as ObjectId).toString())!;
    expect(cleanRow.has_effectifs_erp).toBe(false);
    expect(cleanRow.has_effectifs_deca).toBe(true);
  });
});

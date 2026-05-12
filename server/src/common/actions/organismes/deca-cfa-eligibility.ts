import { ObjectId } from "bson";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import { IOrganisme } from "shared/models/data/organismes.model";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";

import { effectifsDb, effectifsDECADb, formationsCatalogueDb, organismesDb } from "@/common/model/collections";

export type EligibilityCheck = {
  passed: boolean;
  details?: {
    effectifsErpCount?: number;
    effectifsDecaCount?: number;
    formateursTiersCount?: number;
    natureActuelle?: string | null;
  };
};

export type EligibilityResult = {
  eligible: boolean;
  alreadyActive: boolean;
  checks: {
    exists_with_siret_uai: EligibilityCheck;
    nature: EligibilityCheck;
    no_formateurs_tiers: EligibilityCheck;
    has_effectifs: EligibilityCheck;
    not_already_active: EligibilityCheck;
  };
  organisme: {
    _id: ObjectId;
    siret: string;
    uai: string | null | undefined;
    nature: IOrganisme["nature"];
    is_allowed_deca: boolean | null | undefined;
    nom?: string;
    raison_sociale?: string;
    enseigne?: string | null;
  } | null;
};

const NATURES_ELIGIBLES: ReadonlyArray<string> = [
  NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
  NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR,
];

function notEvaluated(): EligibilityCheck {
  return { passed: false };
}

export async function checkEligibilityForLoaded(
  organisme: Pick<
    IOrganisme,
    "_id" | "siret" | "uai" | "nature" | "is_allowed_deca" | "nom" | "raison_sociale" | "enseigne"
  >
): Promise<EligibilityResult> {
  const { _id, siret, uai, nature, is_allowed_deca, nom, raison_sociale, enseigne } = organisme;

  const exists_with_siret_uai: EligibilityCheck = {
    passed: Boolean(siret && uai),
  };

  if (!exists_with_siret_uai.passed) {
    return {
      eligible: false,
      alreadyActive: is_allowed_deca === true,
      checks: {
        exists_with_siret_uai,
        nature: notEvaluated(),
        no_formateurs_tiers: notEvaluated(),
        has_effectifs: notEvaluated(),
        not_already_active: { passed: is_allowed_deca !== true },
      },
      organisme: {
        _id: _id as ObjectId,
        siret: siret ?? "",
        uai,
        nature,
        is_allowed_deca,
        nom,
        raison_sociale,
        enseigne,
      },
    };
  }

  const natureCheck: EligibilityCheck = {
    passed: nature !== undefined && NATURES_ELIGIBLES.includes(nature),
    details: { natureActuelle: nature ?? null },
  };

  const activeAnnees = getActiveAnneesScolaires(new Date());

  const [effectifsErpCount, effectifsDecaCount, formateursTiersCount] = await Promise.all([
    effectifsDb().countDocuments({
      organisme_id: _id as ObjectId,
      annee_scolaire: { $in: activeAnnees },
    }),
    effectifsDECADb().countDocuments({
      organisme_id: _id as ObjectId,
      annee_scolaire: { $in: activeAnnees },
    }),
    formationsCatalogueDb().countDocuments({
      published: true,
      etablissement_gestionnaire_siret: siret,
      etablissement_gestionnaire_uai: uai,
      $or: [{ etablissement_formateur_siret: { $ne: siret } }, { etablissement_formateur_uai: { $ne: uai } }],
    }),
  ]);

  const has_effectifs: EligibilityCheck = {
    passed: effectifsErpCount + effectifsDecaCount > 0,
    details: { effectifsErpCount, effectifsDecaCount },
  };

  const no_formateurs_tiers: EligibilityCheck = {
    passed: formateursTiersCount === 0,
    details: { formateursTiersCount },
  };

  const alreadyActive = is_allowed_deca === true;
  const not_already_active: EligibilityCheck = { passed: !alreadyActive };

  const eligible =
    exists_with_siret_uai.passed &&
    natureCheck.passed &&
    no_formateurs_tiers.passed &&
    has_effectifs.passed &&
    not_already_active.passed;

  return {
    eligible,
    alreadyActive,
    checks: {
      exists_with_siret_uai,
      nature: natureCheck,
      no_formateurs_tiers,
      has_effectifs,
      not_already_active,
    },
    organisme: {
      _id: _id as ObjectId,
      siret: siret ?? "",
      uai,
      nature,
      is_allowed_deca,
    },
  };
}

export async function checkActivationEligibility(organismeId: string): Promise<EligibilityResult> {
  let _id: ObjectId;
  try {
    _id = new ObjectId(organismeId);
  } catch {
    return {
      eligible: false,
      alreadyActive: false,
      checks: {
        exists_with_siret_uai: { passed: false },
        nature: notEvaluated(),
        no_formateurs_tiers: notEvaluated(),
        has_effectifs: notEvaluated(),
        not_already_active: { passed: true },
      },
      organisme: null,
    };
  }

  const organisme = await organismesDb().findOne(
    { _id },
    {
      projection: {
        _id: 1,
        siret: 1,
        uai: 1,
        nature: 1,
        is_allowed_deca: 1,
        nom: 1,
        raison_sociale: 1,
        enseigne: 1,
      },
    }
  );

  if (!organisme) {
    return {
      eligible: false,
      alreadyActive: false,
      checks: {
        exists_with_siret_uai: { passed: false },
        nature: notEvaluated(),
        no_formateurs_tiers: notEvaluated(),
        has_effectifs: notEvaluated(),
        not_already_active: { passed: true },
      },
      organisme: null,
    };
  }

  return checkEligibilityForLoaded(organisme);
}

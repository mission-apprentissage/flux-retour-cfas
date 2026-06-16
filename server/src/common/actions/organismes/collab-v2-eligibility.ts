import { ObjectId } from "bson";
import { IOrganisme } from "shared/models/data/organismes.model";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";

import { effectifsDb, organismesDb } from "@/common/model/collections";

import { NATURES_ELIGIBLES } from "./deca-cfa-eligibility";

export type CollabV2EligibilityCheck = {
  passed: boolean;
  details?: {
    effectifsErpCount?: number;
    natureActuelle?: string | null;
  };
};

export type CollabV2EligibilityResult = {
  eligible: boolean;
  alreadyActive: boolean;
  checks: {
    exists_with_siret_uai: CollabV2EligibilityCheck;
    nature: CollabV2EligibilityCheck;
    has_effectifs_erp: CollabV2EligibilityCheck;
    not_already_active: CollabV2EligibilityCheck;
  };
  organisme: {
    _id: ObjectId;
    siret: string;
    uai: string | null | undefined;
    nature: IOrganisme["nature"];
    is_allowed_collab: boolean | null | undefined;
    nom?: string;
    raison_sociale?: string;
    enseigne?: string | null;
  } | null;
};

function notEvaluated(): CollabV2EligibilityCheck {
  return { passed: false };
}

/**
 * Éligibilité à l'activation « collaboration v2 » (interface v2/collaboration ERP-only).
 *
 * Critères :
 *   - siret AND uai non vides
 *   - nature ∈ {FORMATEUR, RESPONSABLE_FORMATEUR}
 *   - au moins un effectif ERP (collection `effectifs`) sur les années scolaires actives
 *   - pas déjà activé (is_allowed_collab !== true)
 *
 * ⚠️ Contrairement au pilote DECA-CFA : pas de check « aucun formateur tiers dans le
 * catalogue publié », et on ne compte QUE les effectifs ERP (pas DECA).
 */
export async function checkCollabV2EligibilityForLoaded(
  organisme: Pick<
    IOrganisme,
    "_id" | "siret" | "uai" | "nature" | "is_allowed_collab" | "nom" | "raison_sociale" | "enseigne"
  >
): Promise<CollabV2EligibilityResult> {
  const { _id, siret, uai, nature, is_allowed_collab, nom, raison_sociale, enseigne } = organisme;

  const exists_with_siret_uai: CollabV2EligibilityCheck = {
    passed: Boolean(siret && uai),
  };

  if (!exists_with_siret_uai.passed) {
    return {
      eligible: false,
      alreadyActive: is_allowed_collab === true,
      checks: {
        exists_with_siret_uai,
        nature: notEvaluated(),
        has_effectifs_erp: notEvaluated(),
        not_already_active: { passed: is_allowed_collab !== true },
      },
      organisme: {
        _id: _id as ObjectId,
        siret: siret ?? "",
        uai,
        nature,
        is_allowed_collab,
        nom,
        raison_sociale,
        enseigne,
      },
    };
  }

  const natureCheck: CollabV2EligibilityCheck = {
    passed: nature !== undefined && NATURES_ELIGIBLES.includes(nature),
    details: { natureActuelle: nature ?? null },
  };

  const activeAnnees = getActiveAnneesScolaires(new Date());

  const effectifsErpCount = await effectifsDb().countDocuments({
    organisme_id: _id as ObjectId,
    annee_scolaire: { $in: activeAnnees },
  });

  const has_effectifs_erp: CollabV2EligibilityCheck = {
    passed: effectifsErpCount > 0,
    details: { effectifsErpCount },
  };

  const alreadyActive = is_allowed_collab === true;
  const not_already_active: CollabV2EligibilityCheck = { passed: !alreadyActive };

  const eligible =
    exists_with_siret_uai.passed && natureCheck.passed && has_effectifs_erp.passed && not_already_active.passed;

  return {
    eligible,
    alreadyActive,
    checks: {
      exists_with_siret_uai,
      nature: natureCheck,
      has_effectifs_erp,
      not_already_active,
    },
    organisme: {
      _id: _id as ObjectId,
      siret: siret ?? "",
      uai,
      nature,
      is_allowed_collab,
      nom,
      raison_sociale,
      enseigne,
    },
  };
}

export async function checkCollabV2Eligibility(organismeId: string): Promise<CollabV2EligibilityResult> {
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
        has_effectifs_erp: notEvaluated(),
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
        is_allowed_collab: 1,
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
        has_effectifs_erp: notEvaluated(),
        not_already_active: { passed: true },
      },
      organisme: null,
    };
  }

  return checkCollabV2EligibilityForLoaded(organisme);
}

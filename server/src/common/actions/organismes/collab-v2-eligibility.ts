import { ObjectId } from "bson";
import { IOrganisme } from "shared/models/data/organismes.model";

import { organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";

import { countEffectifsAnneesActives, NATURES_ELIGIBLES } from "./deca-cfa-eligibility";

export type CollabV2EligibilityCheck = {
  passed: boolean;
  details?: {
    effectifsErpCount?: number;
    effectifsDecaCount?: number;
    decaActif?: boolean;
    comptesConfirmes?: number;
    natureActuelle?: string | null;
  };
};

export type CollabV2EligibilityResult = {
  eligible: boolean;
  alreadyActive: boolean;
  checks: {
    exists_with_siret_uai: CollabV2EligibilityCheck;
    nature: CollabV2EligibilityCheck;
    not_closed: CollabV2EligibilityCheck;
    has_effectifs: CollabV2EligibilityCheck;
    deca_visible: CollabV2EligibilityCheck;
    has_compte_confirme: CollabV2EligibilityCheck;
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
    collab_suspended_at?: Date | null;
    collab_inactivity_email_sent_at?: Date | null;
  } | null;
};

export const collabV2EligibilityProjection = {
  _id: 1,
  siret: 1,
  uai: 1,
  nature: 1,
  ferme: 1,
  is_allowed_deca: 1,
  is_allowed_collab: 1,
  nom: 1,
  raison_sociale: 1,
  enseigne: 1,
  collab_suspended_at: 1,
  collab_inactivity_email_sent_at: 1,
} as const;

function notEvaluated(): CollabV2EligibilityCheck {
  return { passed: false };
}

function resultatSansOrganisme(): CollabV2EligibilityResult {
  return {
    eligible: false,
    alreadyActive: false,
    checks: {
      exists_with_siret_uai: { passed: false },
      nature: notEvaluated(),
      not_closed: notEvaluated(),
      has_effectifs: notEvaluated(),
      deca_visible: notEvaluated(),
      has_compte_confirme: notEvaluated(),
      not_already_active: { passed: true },
    },
    organisme: null,
  };
}

async function countComptesConfirmes(organismeId: ObjectId): Promise<number> {
  const organisations = await organisationsDb()
    .find({ type: "ORGANISME_FORMATION", organisme_id: organismeId.toString() }, { projection: { _id: 1 } })
    .toArray();
  if (organisations.length === 0) {
    return 0;
  }
  return usersMigrationDb().countDocuments({
    organisation_id: { $in: organisations.map((organisation) => organisation._id) },
    account_status: "CONFIRMED",
  });
}

/**
 * Éligibilité à l'activation « collaboration v2 ».
 *
 * Critères :
 *   - siret AND uai non vides
 *   - nature ∈ {FORMATEUR, RESPONSABLE_FORMATEUR}
 *   - établissement ouvert
 *   - au moins un effectif ERP ou DECA sur les années scolaires actives
 *   - programme DECA-CFA actif dès qu'il y a un effectif DECA
 *   - au moins un compte CFA confirmé
 *   - pas déjà activé (is_allowed_collab !== true)
 *
 * ⚠️ Contrairement au pilote DECA-CFA : pas de check « aucun formateur tiers dans le
 * catalogue publié ».
 */
export async function checkCollabV2EligibilityForLoaded(
  organisme: Pick<
    IOrganisme,
    | "_id"
    | "siret"
    | "uai"
    | "nature"
    | "ferme"
    | "is_allowed_deca"
    | "is_allowed_collab"
    | "nom"
    | "raison_sociale"
    | "enseigne"
    | "collab_suspended_at"
    | "collab_inactivity_email_sent_at"
  >
): Promise<CollabV2EligibilityResult> {
  const {
    _id,
    siret,
    uai,
    nature,
    ferme,
    is_allowed_deca,
    is_allowed_collab,
    nom,
    raison_sociale,
    enseigne,
    collab_suspended_at,
    collab_inactivity_email_sent_at,
  } = organisme;

  const exists_with_siret_uai: CollabV2EligibilityCheck = {
    passed: Boolean(siret && uai),
  };
  const not_closed: CollabV2EligibilityCheck = { passed: ferme !== true };

  if (!exists_with_siret_uai.passed) {
    return {
      eligible: false,
      alreadyActive: is_allowed_collab === true,
      checks: {
        exists_with_siret_uai,
        nature: notEvaluated(),
        not_closed,
        has_effectifs: notEvaluated(),
        deca_visible: notEvaluated(),
        has_compte_confirme: notEvaluated(),
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
        collab_suspended_at,
        collab_inactivity_email_sent_at,
      },
    };
  }

  const natureCheck: CollabV2EligibilityCheck = {
    passed: nature !== undefined && NATURES_ELIGIBLES.includes(nature),
    details: { natureActuelle: nature ?? null },
  };

  const [{ effectifsErpCount, effectifsDecaPropres: effectifsDecaCount }, comptesConfirmes] = await Promise.all([
    countEffectifsAnneesActives(_id as ObjectId),
    countComptesConfirmes(_id as ObjectId),
  ]);

  const has_effectifs: CollabV2EligibilityCheck = {
    passed: effectifsErpCount + effectifsDecaCount > 0,
    details: { effectifsErpCount, effectifsDecaCount },
  };

  const decaActif = is_allowed_deca === true;
  const deca_visible: CollabV2EligibilityCheck = {
    passed: effectifsDecaCount === 0 || decaActif,
    details: { decaActif },
  };

  const has_compte_confirme: CollabV2EligibilityCheck = {
    passed: comptesConfirmes > 0,
    details: { comptesConfirmes },
  };

  const alreadyActive = is_allowed_collab === true;
  const not_already_active: CollabV2EligibilityCheck = { passed: !alreadyActive };

  const eligible =
    exists_with_siret_uai.passed &&
    natureCheck.passed &&
    not_closed.passed &&
    has_effectifs.passed &&
    deca_visible.passed &&
    has_compte_confirme.passed &&
    not_already_active.passed;

  return {
    eligible,
    alreadyActive,
    checks: {
      exists_with_siret_uai,
      nature: natureCheck,
      not_closed,
      has_effectifs,
      deca_visible,
      has_compte_confirme,
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
      collab_suspended_at,
      collab_inactivity_email_sent_at,
    },
  };
}

export async function checkCollabV2Eligibility(organismeId: string): Promise<CollabV2EligibilityResult> {
  let _id: ObjectId;
  try {
    _id = new ObjectId(organismeId);
  } catch {
    return resultatSansOrganisme();
  }

  const organisme = await organismesDb().findOne({ _id }, { projection: collabV2EligibilityProjection });
  if (!organisme) {
    return resultatSansOrganisme();
  }

  return checkCollabV2EligibilityForLoaded(organisme);
}

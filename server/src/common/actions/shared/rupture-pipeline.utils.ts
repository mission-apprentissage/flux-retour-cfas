import { STATUT_APPRENANT } from "shared/constants";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { USER_RESPONSE_TYPE } from "shared/models/data/whatsappContact.model";
import { CFA_COLLAB_STATUS } from "shared/models/routes/organismes/cfa";
import { getAnneeScolaireListFromDateRange } from "shared/utils";

import { escapeRegex, parseStringToArray } from "@/common/utils/usersFiltersUtils";

export const DATE_START_RUPTURES = new Date("2025-01-01");

/** Délai au-delà duquel un dossier d'un CFA en collab part automatiquement à la ML. */
export const CFA_COLLAB_AUTO_SEND_DELAI_DAYS = 45;

/**
 * Statuts courants traduisant une sortie de rupture : retour en contrat ou arrivée au terme
 * de la formation. Un dossier dans l'un de ces statuts n'est plus à traiter.
 */
export const STATUTS_SORTIE_RUPTURE = [STATUT_APPRENANT.APPRENTI, STATUT_APPRENANT.FIN_DE_FORMATION];

/**
 * Fenêtre de visibilité d'un dossier ML/CFA : millésime d'année scolaire, date de rupture, ou
 * date de rupture déclarée par le CFA (la déclaration précède parfois la transmission ERP).
 */
export const buildVisibilityWindowMatch = (now: Date = new Date()) => ({
  $or: [
    { "effectif_snapshot.annee_scolaire": { $in: getAnneeScolaireListFromDateRange(DATE_START_RUPTURES, now) } },
    { date_rupture: { $gte: DATE_START_RUPTURES } },
    { "cfa_rupture_declaration.date_rupture": { $gte: DATE_START_RUPTURES } },
  ],
});

/**
 * Dossier « en rupture » : rupture déclarée par le CFA, ou statut courant hors sortie de rupture.
 * `keepQualifiedByMl` conserve en plus les dossiers déjà qualifiés par un conseiller ML — comme
 * côté ML, on ne masque que ce sur quoi personne n'a agi. Sans lui, un jeune requalifié en fin de
 * formation et marqué injoignable sort à la fois de la liste ruptures et de l'onglet Suivi ML
 * (`buildContactedByMlExpr` exclut les situations « non joint ») : il disparaît de toute vue CFA.
 * Laissé à false pour le ciblage e-mail, qui compte des ruptures et non des dossiers suivis.
 */
export const buildRuptureStatusMatch = ({ keepQualifiedByMl = false }: { keepQualifiedByMl?: boolean } = {}) => ({
  $or: [
    { cfa_rupture_declaration: { $exists: true } },
    { "current_status.value": { $nin: STATUTS_SORTIE_RUPTURE } },
    ...(keepQualifiedByMl ? [{ situation: { $exists: true, $ne: null } }] : []),
  ],
});

/**
 * Statut courant d'un parcours : dernière étape déjà atteinte. Si aucune ne l'est (parcours
 * entièrement à venir), on retombe sur la première — jamais sur la dernière, qui vaut
 * FIN_DE_FORMATION et masquerait un jeune dont la formation n'a pas commencé.
 */
export const getCurrentStatutFromParcours = <T extends { date: Date }>(
  parcours: T[] | null | undefined,
  now: Date = new Date()
): T | undefined => {
  if (!parcours || parcours.length === 0) {
    return undefined;
  }
  return parcours.filter((statut) => new Date(statut.date) <= now).slice(-1)[0] ?? parcours[0];
};

export const buildEffRuptureAgeFilter = () => {
  const now = new Date();
  return [
    {
      $match: {
        $or: [
          {
            "effectif_snapshot.apprenant.date_de_naissance": {
              $gte: new Date(new Date(now).setFullYear(now.getFullYear() - 26)),
            },
          },
          { "effectif_snapshot.apprenant.rqth": true },
        ],
        soft_deleted: { $ne: true },
        "effectif_snapshot.apprenant.date_de_naissance": {
          $lte: new Date(new Date(now).setFullYear(now.getFullYear() - 16)),
        },
      },
    },
  ];
};

// Situations ML traduisant un jeune NON joint (contacté = non).
const SITUATION_NON_JOINT: SITUATION_ENUM[] = [
  SITUATION_ENUM.CONTACTE_SANS_RETOUR,
  SITUATION_ENUM.COORDONNEES_INCORRECT,
  SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES,
];

/**
 * Expression MongoDB : le jeune a réellement été contacté par la Mission Locale.
 * = situation renseignée traduisant un contact abouti (hors situations "non joint")
 *   OU préqualif WhatsApp positive (whatsapp_contact.user_response = "prequalif_yes").
 * @param docPrefix - préfixe d'accès aux champs (ex "$ml_doc" pour un lookup). Omis pour un accès direct.
 */
export function buildContactedByMlExpr(docPrefix?: string) {
  const f = (field: string) => (docPrefix ? `${docPrefix}.${field}` : `$${field}`);
  return {
    $or: [
      {
        $and: [
          { $ne: [{ $ifNull: [f("situation"), null] }, null] },
          { $not: [{ $in: [f("situation"), SITUATION_NON_JOINT] }] },
        ],
      },
      { $eq: [f("whatsapp_contact.user_response"), USER_RESPONSE_TYPE.PREQUALIF_YES] },
    ],
  };
}

/**
 * Build a MongoDB $switch expression for CFA collaboration status.
 * @param docPrefix - prefix for field access (e.g. "$ml_doc" for a lookup result). Omit for direct fields.
 */
export function buildCollabStatusSwitch(docPrefix?: string) {
  const f = (field: string) => (docPrefix ? `${docPrefix}.${field}` : `$${field}`);
  const situationSet = { $ne: [{ $ifNull: [f("situation"), null] }, null] };
  const situationTraitee = {
    $and: [situationSet, { $ne: [f("situation"), "CONTACTE_SANS_RETOUR"] }],
  };
  const isCollab = { $eq: [f("organisme_data.acc_conjoint"), true] };

  return {
    $switch: {
      branches: [
        // Dossier collab (CFA a initié) traité par la ML → "Traité par la ML"
        {
          case: { $and: [isCollab, situationTraitee] },
          then: CFA_COLLAB_STATUS.TRAITE_PAR_ML,
        },
        // Dossier collab non encore traité (situation null OU "contacté sans retour") → "Demande collab envoyée".
        // Le badge "Contacté par la ML" n'est plus utilisé pour les dossiers collab.
        {
          case: isCollab,
          then: CFA_COLLAB_STATUS.COLLAB_DEMANDEE,
        },
        // Dossier hors-collab où le jeune a réellement été contacté (joint OU préqualif WhatsApp) →
        // badge "Contacté par la ML — Hors collab". Les non-joints retombent en "Démarrer une collab".
        {
          case: buildContactedByMlExpr(docPrefix),
          then: CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB,
        },
      ],
      default: CFA_COLLAB_STATUS.DEMARRER_COLLAB,
    },
  };
}

/**
 * Expression MongoDB renvoyant un ordinal métier pour trier la colonne "Collaboration avec la ML".
 * Ordre : Démarrer une collab (0) < Demande envoyée (1) < Contacté hors collab (2) < Traité (3).
 * Aligné sur COLLAB_STATUS_ORDER côté UI.
 */
export function buildCollabStatusOrderField(statusFieldRef = "$collab_status") {
  return {
    $switch: {
      branches: [
        { case: { $eq: [statusFieldRef, CFA_COLLAB_STATUS.COLLAB_DEMANDEE] }, then: 1 },
        { case: { $eq: [statusFieldRef, CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB] }, then: 2 },
        { case: { $eq: [statusFieldRef, CFA_COLLAB_STATUS.TRAITE_PAR_ML] }, then: 3 },
      ],
      default: 0,
    },
  };
}

/**
 * Conditions de recherche multi-mots : chaque mot doit matcher le nom OU le prénom
 * (regex insensible à la casse, métacaractères échappés). Retourne [] si `search` est vide.
 */
export function buildNameSearchConditions(
  search: string | undefined,
  nomField: string,
  prenomField: string
): Record<string, unknown>[] {
  if (!search) return [];
  return search
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((word) => {
      const escaped = escapeRegex(word);
      return {
        $or: [
          { [nomField]: { $regex: escaped, $options: "i" } },
          { [prenomField]: { $regex: escaped, $options: "i" } },
        ],
      };
    });
}

/** Condition `$in` à partir d'une valeur CSV ("a,b,c"). Retourne [] si vide. */
export function buildCsvInConditions(field: string, csv?: string): Record<string, unknown>[] {
  const values = parseStringToArray(csv);
  return values.length > 0 ? [{ [field]: { $in: values } }] : [];
}

/** Facet MongoDB : liste distincte triée des valeurs d'un champ (alimente un dropdown de filtre). */
export function buildDistinctFacet(field: string): Record<string, unknown>[] {
  return [
    { $match: { [field]: { $exists: true, $ne: null } } },
    { $group: { _id: `$${field}` } },
    { $sort: { _id: 1 } },
  ];
}

export const createDernierStatutFieldPipeline = () => [
  {
    $addFields: {
      dernierStatutDureeInDay: {
        $dateDiff: { startDate: "$date_rupture", endDate: "$$NOW", unit: "day" },
      },
    },
  },
];

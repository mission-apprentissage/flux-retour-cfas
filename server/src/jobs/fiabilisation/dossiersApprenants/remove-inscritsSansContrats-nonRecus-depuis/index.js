import { addWeeks } from "date-fns";

import { CODES_STATUT_APPRENANT } from "@/common/constants/dossierApprenant";
import logger from "@/common/logger";
import { effectifsDb } from "@/common/model/collections";

const DATE_MOINS_3SEMAINES = addWeeks(new Date(), -3);
const CURRENT_ANNEES_SCOLAIRES = ["2022-2022", "2022-2023", "2023-2023"];
const SOURCE_FILTER = { $ne: "scform" }; // TODO Gestion spécifique SC FORM à valider coté métier

/**
 * Méthode de suppression des effectifs inscrits sans contrats pour les années scolaires courantes, qui n'ont pas été envoyé au TDB
 * depuis la date fournie en paramètre (il y a 3 semaines par défaut)
 * On filtre sur un historique ayant un seul élément = INSCRIT
 * On ne prends pas en compte les effectifs fournis par SCFORM car ils ont une gestion spécifique (à valider coté métier)
 */
export const removeInscritsSansContratsNonRecusDepuis = async (dateDerniereReception = DATE_MOINS_3SEMAINES) => {
  const inscritsSansContratsNonRecusDepuisQuery = {
    annee_scolaire: { $in: CURRENT_ANNEES_SCOLAIRES },
    updated_at: { $lte: dateDerniereReception },
    "apprenant.historique_statut": { $size: 1 },
    "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
    source: SOURCE_FILTER,
  };

  const { deletedCount } = await effectifsDb().deleteMany(inscritsSansContratsNonRecusDepuisQuery);
  logger.info(`Suppression de ${deletedCount} effectifs non recus depuis le ${dateDerniereReception.toISOString()}...`);
};

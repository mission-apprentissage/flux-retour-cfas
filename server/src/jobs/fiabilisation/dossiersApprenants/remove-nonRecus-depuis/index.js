import { inscritsSansContratsIndicator } from "@/common/actions/effectifs/indicators";
import logger from "@/common/logger";
import { effectifsDb } from "@/common/model/collections";

const CURRENT_ANNEES_SCOLAIRES = ["2022-2023", "2023-2023"];

/**
 * Méthode de suppression des effectifs inscrits sans contrats pour les années scolaires courantes,
 * qui n'ont pas été envoyé au TDB depuis la date fournie en paramètre
 */
export const removeInscritsSansContratsNonRecusDepuis = async (dateDerniereReception) => {
  const filterStages = [{ $match: { annee_scolaire: { $in: CURRENT_ANNEES_SCOLAIRES } } }];
  const inscritsSansContratsIdsToRemove = (
    await inscritsSansContratsIndicator.getListAtDate(dateDerniereReception, filterStages)
  ).map((item) => item._id);

  const { deletedCount } = await effectifsDb().deleteMany({ _id: { $in: inscritsSansContratsIdsToRemove } });
  logger.info(
    `Suppression de ${deletedCount} effectifs inscrits non recus depuis le ${dateDerniereReception.toISOString()} !`
  );
};

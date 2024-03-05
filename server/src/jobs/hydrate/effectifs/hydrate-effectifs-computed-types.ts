import { captureException } from "@sentry/node";
import { endOfMonth } from "date-fns";
import { MongoServerError } from "mongodb";
import { STATUT_APPRENANT, StatutApprenant } from "shared/constants";
import { IEffectif } from "shared/models/data/effectifs.model";

import logger from "@/common/logger";
import { effectifsDb } from "@/common/model/collections";

export async function hydrateEffectifsComputedTypes(evaluationDate = new Date()) {
  const effectifsToUpdate = await effectifsDb().find().toArray();

  let nbEffectifsMisAJour = 0;
  let nbEffectifsNonMisAJour = 0;

  for (const effectif of effectifsToUpdate) {
    if (!effectif.formation || !effectif.formation.date_entree) continue;

    try {
      const newStatut = determineNewStatut(effectif, evaluationDate);
      const historiqueStatut = genererHistoriqueStatut(effectif, evaluationDate);

      const updateObj = {
        $set: {
          "_computed.statut.en_cours": newStatut,
          "_computed.statut.historique": historiqueStatut,
        },
      };

      const { modifiedCount } = await effectifsDb().updateOne({ _id: effectif._id }, updateObj);

      modifiedCount > 0 ? nbEffectifsMisAJour++ : nbEffectifsNonMisAJour++;
    } catch (err) {
      gererErreurMiseAJour(err, effectif);
    }
  }
  logger.info(`${nbEffectifsMisAJour} effectifs mis à jour, ${nbEffectifsNonMisAJour} effectifs non mis à jour.`);
}

export function genererHistoriqueStatut(effectif: IEffectif, endDate: Date) {
  if (!effectif?.formation?.date_entree) {
    return [];
  }

  const dateEntree = new Date(effectif.formation.date_entree);
  const historiqueStatut: { mois: string; annee: string; valeur: StatutApprenant | null }[] = [];

  for (let date = new Date(dateEntree); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    const dernierJourDuMois = endOfMonth(date);
    const mois = (dernierJourDuMois.getMonth() + 1).toString().padStart(2, "0");
    const annee = dernierJourDuMois.getFullYear().toString();
    const statutPourLeMois = determineNewStatut(effectif, dernierJourDuMois);

    historiqueStatut.push({ mois, annee, valeur: statutPourLeMois });
  }

  return historiqueStatut;
}

function gererErreurMiseAJour(err: unknown, effectif: IEffectif) {
  console.error("Erreur lors de la mise à jour de l'effectif :", err);

  if (
    err instanceof MongoServerError &&
    err.errInfo &&
    err.errInfo.details &&
    Array.isArray(err.errInfo.details.schemaRulesNotSatisfied)
  ) {
    console.error(
      "Erreurs de validation de schéma détaillées :",
      JSON.stringify(err.errInfo.details.schemaRulesNotSatisfied, null, 2)
    );
  }

  logger.error(
    `Erreur lors de la mise à jour de l'effectif ${effectif._id}: ${
      err instanceof Error ? err.message : JSON.stringify(err)
    }`
  );
  captureException(err);
}

export function determineNewStatut(effectif: IEffectif, evaluationDate?: Date): StatutApprenant | null {
  const currentDate = evaluationDate || new Date();
  const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000; // 90 jours en millisecondes
  const oneEightyDaysInMs = 180 * 24 * 60 * 60 * 1000; // 180 jours en millisecondes

  // Si la date de fin de la formation est passée et que le diplôme a été obtenu
  if (
    effectif.formation?.date_fin &&
    new Date(effectif.formation.date_fin) < currentDate &&
    effectif.formation.obtention_diplome
  ) {
    return STATUT_APPRENANT.DIPLOME;
  }

  // Si dans les 90 jours suivant la date d'entrée, considérer comme INSCRIT
  const dateEntree = effectif.formation?.date_entree ? new Date(effectif.formation.date_entree) : null;
  if (dateEntree && currentDate.getTime() - dateEntree.getTime() <= ninetyDaysInMs) {
    return STATUT_APPRENANT.INSCRIT;
  }

  // Vérifie les conditions des contrats pour APPRENTI et RUPTURANT
  let hasCurrentContract = false;
  let hasRecentRupture = false;

  effectif.contrats?.forEach((contract) => {
    const dateDebut = new Date(contract.date_debut);
    const dateFin = contract.date_fin ? new Date(contract.date_fin) : Infinity;
    const dateRupture = contract.date_rupture ? new Date(contract.date_rupture) : null;

    if (dateDebut <= currentDate && currentDate <= dateFin && (!dateRupture || currentDate < dateRupture)) {
      hasCurrentContract = true;
    }

    if (dateRupture && currentDate.getTime() - dateRupture.getTime() <= oneEightyDaysInMs) {
      hasRecentRupture = true;
    }
  });

  if (hasCurrentContract) return STATUT_APPRENANT.APPRENTI;
  if (hasRecentRupture) return STATUT_APPRENANT.RUPTURANT;

  // Si la date d'entrée est dépassée de plus de 90 jours et qu'aucune autre condition n'est remplie, considérer comme ABANDON
  if (dateEntree && currentDate.getTime() - dateEntree.getTime() > ninetyDaysInMs) {
    return STATUT_APPRENANT.ABANDON;
  }

  return null;
}

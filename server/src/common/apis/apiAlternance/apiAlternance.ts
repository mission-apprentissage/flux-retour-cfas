import { captureException } from "@sentry/node";
import type { ICommune, IMissionLocale } from "api-alternance-sdk";
import Boom from "boom";
import CfdInfo from "shared/models/apis/@types/CfdInfo";

import logger from "@/common/logger";
import config from "@/config";

import { apiAlternanceClient } from "./client";

export const getCfdInfo = async (cfd: string): Promise<CfdInfo | null> => {
  try {
    const certifications = await apiAlternanceClient.certification.index({ identifiant: { cfd } });

    if (certifications.length === 0) {
      return null;
    }

    // All certifications have CFD, so each `.cfd` property is not null (that's just a type refinement issue).
    const data: CfdInfo = {
      date_fermeture: certifications[0].periode_validite.cfd!.fermeture,
      date_ouverture: certifications[0].periode_validite.cfd!.ouverture,
      niveau: certifications[0].intitule.niveau.cfd!.europeen,
      intitule_long: certifications[0].intitule.cfd!.long,
      rncps: [],
    };

    for (const certification of certifications) {
      if (certification.identifiant.rncp === null) {
        continue;
      }

      data.rncps.push({
        code_rncp: certification.identifiant.rncp,
        intitule_diplome: certification.intitule.rncp!,
        date_fin_validite_enregistrement: certification.periode_validite.rncp!.fin_enregistrement,
        active_inactive: certification.periode_validite.rncp!.actif ? "ACTIVE" : "INACTIVE",
        eligible_apprentissage: certification.type.voie_acces.rncp!.apprentissage,
        eligible_professionnalisation: certification.type.voie_acces.rncp!.contrat_professionnalisation,
      });
    }

    return data;
  } catch (error: any) {
    logger.error(
      `getCfdInfo: something went wrong while requesting CFD "${cfd}"`,
      error.response?.data || error.message
    );
    captureException(new Error(`getCfdInfo: something went wrong while requesting CFD "${cfd}"`, { cause: error }));
    return null;
  }
};

export const getCommune = async (codePostal: string | null | undefined): Promise<ICommune | null> => {
  if (!codePostal) return null;

  const result = await apiAlternanceClient.geographie.rechercheCommune({ code: codePostal }).catch((error) => {
    if (config.env === "test") throw error;

    logger.error(`getCommune: something went wrong while requesting code postal "${codePostal}": ${error.message}`, {
      error,
      codePostal,
    });

    const err = Boom.internal("Échec de l'appel API pour la recherche de code postal", { codePostal });
    err.cause = error;
    captureException(err);

    return [];
  });

  // Returns the first commune
  return result[0] ?? null;
};

export const getMissionsLocales = async (): Promise<IMissionLocale[] | null> => {
  try {
    const result = await apiAlternanceClient.geographie.listMissionLocales();
    return result;
  } catch (error: any) {
    captureException(new Error(`getMissionsLocales: something went wrong while requesting ML `, { cause: error }));
    return null;
  }
};

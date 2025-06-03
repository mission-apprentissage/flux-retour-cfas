import { captureException } from "@sentry/node";
import type { ICommune, IMissionLocale } from "api-alternance-sdk";
import { zCfd } from "api-alternance-sdk/internal";
import Boom from "boom";
import type { CfdInfo, RncpInfo } from "shared/models/apis/@types/ApiAlternance";

import logger from "@/common/logger";
import config from "@/config";

import { apiAlternanceClient } from "./client";

export const getCfdInfo = async (cfd: string): Promise<CfdInfo | null> => {
  try {
    if (!zCfd.safeParse(cfd).success) {
      logger.warn(`getCfdInfo: invalid CFD "${cfd}"`);
      return null;
    }

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

export const getRncpInfo = async (rncp: string): Promise<RncpInfo | null> => {
  try {
    const certifications = await apiAlternanceClient.certification.index({ identifiant: { rncp } });

    if (certifications.length === 0) {
      return null;
    }

    // All certifications have RNCP, so each `.rncp` property is not null (that's just a type refinement issue).
    const data: RncpInfo = {
      code_rncp: certifications[0].identifiant.rncp!,
      intitule: certifications[0].intitule.rncp!,
      niveau: certifications[0].intitule.niveau.rncp!.europeen,
      date_fin_validite_enregistrement: certifications[0].periode_validite.rncp!.fin_enregistrement,
      actif: certifications[0].periode_validite.rncp!.actif,
      eligible_apprentissage: certifications[0].type.voie_acces.rncp!.apprentissage,
      eligible_professionnalisation: certifications[0].type.voie_acces.rncp!.contrat_professionnalisation,
      romes: certifications[0].domaines.rome.rncp!,
    };

    return data;
  } catch (error: any) {
    logger.error(
      `getRncpInfo: something went wrong while requesting RNCP "${rncp}"`,
      error.response?.data || error.message
    );
    captureException(new Error(`getRncpInfo: something went wrong while requesting RNCP "${rncp}"`, { cause: error }));
    return null;
  }
};

export const getCommune = async ({
  codePostal,
  codeInsee,
}: {
  codePostal?: string | null;
  codeInsee?: string | null;
}): Promise<ICommune | null> => {
  const code = codePostal || codeInsee;

  if (!code) return null;

  const communeList = await apiAlternanceClient.geographie.rechercheCommune({ code }).catch((error) => {
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

  if (!communeList || communeList.length === 0) {
    return null;
  }

  // Full match
  if (codePostal && codeInsee) {
    const commune = communeList.find(({ code }) => code.postaux.includes(codePostal) && code.insee === codeInsee);
    if (commune) {
      return commune;
    }
  }

  // Partial match code insee
  if (codeInsee) {
    const communeByInsee = communeList.find(({ code }) => code.insee === codeInsee);

    if (communeByInsee) {
      return communeByInsee;
    }

    return null;
  }

  // Partial match code postal
  if (codePostal) {
    const communeByPostal = communeList.find(({ code }) => code.postaux.includes(codePostal));

    if (communeByPostal) {
      return communeByPostal;
    }

    return null;
  }

  return null;
};

export const getMissionsLocales = async (): Promise<IMissionLocale[] | null> => {
  try {
    const result = await apiAlternanceClient.geographie.listMissionLocales({});
    return result;
  } catch (error: any) {
    captureException(new Error(`getMissionsLocales: something went wrong while requesting ML `, { cause: error }));
    return null;
  }
};

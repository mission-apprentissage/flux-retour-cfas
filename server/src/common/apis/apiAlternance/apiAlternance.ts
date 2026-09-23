import type { ICommune, IMissionLocale } from "api-alternance-sdk";
import { zCfd } from "api-alternance-sdk/internal";
import type { CfdInfo, RncpInfo } from "shared/models/apis/@types/ApiAlternance";

import logger from "@/common/logger";
import { reportDependencyHealth } from "@/common/services/sentry/reportOnce";
import { getErrorMessage } from "@/common/utils/errorUtils";

import { apiAlternanceClient } from "./client";

/**
 * `null` ne signifie plus que « cette certification ou cette commune n'existe
 * pas » : un échec technique lève. Sans cette distinction, une panne de l'API
 * faisait ingérer des effectifs sans commune ni niveau, silencieusement, et
 * répondre 200 avec un corps vide sur quatre routes.
 *
 * Le signalement passe par la santé de la dépendance, qui ne capture qu'à la
 * transition : sur le chemin d'ingestion, une capture par appel produirait un
 * événement par effectif.
 */
const failed = (operation: string, error: unknown): Error => {
  reportDependencyHealth(`api-alternance:${operation}`, false, error, {
    tier: "jour",
    errorKind: "upstream",
    upstream: "api-alternance",
  });
  return new Error(`api-alternance: échec de ${operation}`, { cause: error });
};

const succeeded = (operation: string): void => {
  reportDependencyHealth(`api-alternance:${operation}`, true);
};

const describeApiError = (error: unknown) => {
  const { response } = error as { response?: { data?: unknown } };
  return response?.data || getErrorMessage(error);
};

export const getCfdInfo = async (cfd: string): Promise<CfdInfo | null> => {
  try {
    if (!zCfd.safeParse(cfd).success) {
      logger.warn(`getCfdInfo: invalid CFD "${cfd}"`);
      return null;
    }

    const certifications = await apiAlternanceClient.certification.index({ identifiant: { cfd } });
    succeeded("getCfdInfo");

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
  } catch (error) {
    logger.error(`getCfdInfo: something went wrong while requesting CFD "${cfd}"`, describeApiError(error));
    throw failed("getCfdInfo", error);
  }
};

export const getRncpInfo = async (rncp: string): Promise<RncpInfo | null> => {
  try {
    const certifications = await apiAlternanceClient.certification.index({ identifiant: { rncp } });
    succeeded("getRncpInfo");

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
  } catch (error) {
    logger.error(`getRncpInfo: something went wrong while requesting RNCP "${rncp}"`, describeApiError(error));
    throw failed("getRncpInfo", error);
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
    logger.error(`getCommune: something went wrong while requesting code postal "${codePostal}": ${error.message}`, {
      error,
      codePostal,
    });

    throw failed("rechercheCommune", error);
  });
  succeeded("rechercheCommune");

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

export const getMissionsLocales = async (): Promise<IMissionLocale[]> => {
  try {
    const result = await apiAlternanceClient.geographie.listMissionLocales({});
    succeeded("getMissionsLocales");
    return result;
  } catch (error) {
    throw failed("getMissionsLocales", error);
  }
};

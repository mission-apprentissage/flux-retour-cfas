import { captureException } from "@sentry/node";
import TabCoCfdInfo from "shared/models/apis/@types/TabCoCfdInfo";
import TabCoCodePostalInfo from "shared/models/apis/@types/TabCoCodePostalInfo";

import logger from "@/common/logger";
import config from "@/config";

import { tryCachedExecution } from "../utils/cacheUtils";

import { apiAlternanceClient } from "./apiAlternance";
import getApiClient from "./client";

export const API_ENDPOINT = config.tablesCorrespondances.endpoint;

const client = getApiClient({ baseURL: API_ENDPOINT });

export const getCfdInfo = async (cfd: string): Promise<TabCoCfdInfo | null> => {
  try {
    const certifications = await apiAlternanceClient.certification.index({ identifiant: { cfd } });

    if (certifications.length === 0) {
      return null;
    }

    // All certifications have CFD, so each `.cfd` property is not null (that's just a type refinement issue).
    const data: TabCoCfdInfo = {
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

export const getCodePostalInfo = async (codePostal: string | null | undefined): Promise<TabCoCodePostalInfo | null> => {
  if (!codePostal) return null;

  const serviceFunc = async () => {
    try {
      const { data } = await client.post("/code-postal", { codePostal }, { cache: { methods: ["post"] } });
      return data;
    } catch (error: any) {
      logger.error(
        `getCodePostalInfo: something went wrong while requesting code postal "${codePostal}": ${error.message}`,
        error.code || error.response?.status
      );
      captureException(
        new Error(`getCodePostalInfo: something went wrong while requesting code postal "${codePostal}"`, {
          cause: error,
        })
      );
      return null;
    }
  };

  return tryCachedExecution(`codePostalInfo-${codePostal}`, 3600_000, serviceFunc);
};

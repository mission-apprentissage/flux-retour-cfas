import { captureException } from "@sentry/node";
import CatalogueFormation from "shared/models/apis/@types/CatalogueFormation";

import parentLogger from "@/common/logger";
import config from "@/config";

import getApiClient from "./client";

// Cf Documentation : https://catalogue.apprentissage.beta.gouv.fr/api/v1/docs

const logger = parentLogger.child({
  module: "api-catalogue",
});

const axiosClient = getApiClient({
  baseURL: config.mnaCatalogApi.endpoint,
});

/**
 * Méthode de récupération depuis l'API Catalogue des formations liées à un UAI d'organisme
 */
export const getCatalogFormationsForOrganisme = async (uai: string, page = 1): Promise<CatalogueFormation[]> => {
  try {
    // On cherche parmi les formations publiées ayant soit l'UAI formateur soit l'UAI gestionnaire
    const response = await axiosClient.get("/entity/formations", {
      params: {
        page,
        limit: 1050,
        query: {
          published: true,
          catalogue_published: true,
          $or: [{ etablissement_formateur_uai: uai }, { etablissement_gestionnaire_uai: uai }],
        },
      },
    });

    const { formations, pagination } = response.data;

    if (page < pagination.nombre_de_page) {
      formations.push(...(await getCatalogFormationsForOrganisme(uai, page + 1)));
    } else {
      // only log on page 1
      logger.debug({ uai, nbFormations: pagination.total }, "getCatalogFormationsForOrganisme");
    }
    return formations;
  } catch (err: any) {
    logger.error("getFormationsForOrganisme error", err.response?.data || err.message);
    captureException(new Error("getFormationsForOrganisme error", { cause: err }));
    return [];
  }
};

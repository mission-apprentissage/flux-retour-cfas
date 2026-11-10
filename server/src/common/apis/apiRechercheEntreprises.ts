import { ApiError, apiRateLimiter } from "@/common/utils/apiUtils";
import { getErrorMessage } from "@/common/utils/errorUtils";

import getApiClient from "./client";

const axiosClient = getApiClient({
  baseURL: "https://recherche-entreprises.api.gouv.fr",
});

const executeWithRateLimiting = apiRateLimiter("apiRechercheEntreprises", {
  nbRequests: 5,
  durationInSeconds: 1,
  client: axiosClient,
});

export type IEtablissementRechercheEntreprises = {
  siret: string;
  adresse: string | null;
  code_postal: string | null;
  commune: string | null;
  libelle_commune: string | null;
  statut_diffusion_etablissement: string | null;
};

type IRechercheEntreprisesResponse = {
  results: {
    siege: IEtablissementRechercheEntreprises | null;
    matching_etablissements: IEtablissementRechercheEntreprises[];
  }[];
};

export const getEtablissementRechercheEntreprises = async (
  siret: string
): Promise<IEtablissementRechercheEntreprises | null> => {
  return executeWithRateLimiting(async (client) => {
    try {
      const { data } = await client.get<IRechercheEntreprisesResponse>("/search", {
        params: { q: siret, page: 1, per_page: 1 },
      });
      return (
        data.results
          .flatMap(({ siege, matching_etablissements }) => [...matching_etablissements, siege])
          .find((etablissement) => etablissement?.siret === siret) ?? null
      );
    } catch (e) {
      const { code, response } = e as { code?: string; response?: { status?: number } };
      throw new ApiError("API Recherche d'entreprises", getErrorMessage(e), code || response?.status);
    }
  });
};

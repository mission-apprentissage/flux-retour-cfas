import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { _get, _post, _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { normalize } from "@/common/utils/stringUtils";
import { OrganismeNormalized } from "@/modules/organismes/ListeOrganismesPage";
import {
  OrganismesFiltersQuery,
  filterOrganismesArrayFromOrganismesFilters,
  parseOrganismesFiltersFromQuery,
} from "@/modules/organismes/models/organismes-filters";

// récupère un organisme
export function useOrganisme(organismeId: string | undefined | null) {
  const {
    data: organisme,
    isLoading,
    error,
    refetch,
  } = useQuery<Organisme, any>(["organisme", organismeId], () => _get(`/api/v1/organismes/${organismeId}`), {
    enabled: !!organismeId,
  });

  const endpoint = `/api/v1/organismes/${organismeId}`;

  const { mutateAsync: generateApiKey, isLoading: isGeneratingApiKey } = useMutation(async () => {
    const { apiKey } = await _post(`${endpoint}/api-key`);
    await refetch();
    return apiKey;
  });

  const { mutateAsync: configureERP, isLoading: isConfiguringERP } = useMutation(
    async (dataToUpdate: { erps: string[]; mode_de_transmission?: string; setup_step_courante?: string }) => {
      const response = await _put(`${endpoint}/configure-erp`, dataToUpdate);
      await refetch();
      return response;
    }
  );

  return {
    organisme,
    isLoading,
    error,
    generateApiKey,
    isGeneratingApiKey,
    configureERP,
    isConfiguringERP,
  };
}

// récupère l'organisme lié à l'organisation pour un OF
export function useOrganisationOrganisme(enabled?: boolean) {
  const {
    data: organisme,
    isLoading,
    refetch,
    error,
  } = useQuery<Organisme, any>(["organisation/organisme"], () => _get("/api/v1/organisation/organisme"), {
    enabled: enabled ?? true,
  });

  return {
    organisme,
    isLoading,
    refetch,
    error,
  };
}

// récupère les organismes accessibles (OF, opérateur public, etc)
export function useOrganisationOrganismes() {
  const router = useRouter();

  const {
    data: organismes,
    isLoading,
    error,
  } = useQuery<Organisme[], any>(["organisation/organismes"], () => _get("/api/v1/organisation/organismes"), {
    enabled: router.isReady,
  });

  return {
    organismes,
    isLoading,
    error,
  };
}

export function useOrganismesFiltered(organismes: OrganismeNormalized[]) {
  const router = useRouter();

  const organismesFiltered = useMemo(() => {
    return organismes
      ? filterOrganismesArrayFromOrganismesFilters(
          organismes,
          parseOrganismesFiltersFromQuery(router.query as unknown as OrganismesFiltersQuery)
        )
      : undefined;
  }, [organismes, router.query]);

  return {
    organismesFiltered,
  };
}

export function useOrganismesNormalizedLists(organismes: Organisme[]) {
  const { organismesFiables, organismesACompleter, nbOrganismesFermes } = useMemo(() => {
    const organismesFiables: OrganismeNormalized[] = [];
    const organismesACompleter: OrganismeNormalized[] = [];
    let nbOrganismesFermes = 0;
    (organismes || []).forEach((organisme: OrganismeNormalized) => {
      // We need to memorize organismes with normalized names to be avoid running the normalization on each keystroke.
      organisme.normalizedName = normalize(organisme.enseigne ?? organisme.raison_sociale ?? "");
      organisme.normalizedUai = normalize(organisme.uai ?? "");
      organisme.normalizedCommune = normalize(organisme.adresse?.commune ?? "");

      if (organisme.fiabilisation_statut === "FIABLE" && !organisme.ferme && organisme.nature !== "inconnue") {
        organismesFiables.push(organisme);
      } else if (
        // Organismes à masquer :
        // organismes fermés et ne transmettant pas
        // organismes inconnus (sans raison sociale ni enseigne) et absents du référentiel ou fermé
        (organisme.ferme && !organisme.last_transmission_date) ||
        (!organisme.enseigne &&
          !organisme.raison_sociale &&
          (organisme.est_dans_le_referentiel === "absent" || organisme.ferme))
      ) {
        nbOrganismesFermes++;
      } else {
        organismesACompleter.push(organisme);
        if (organisme.ferme) {
          nbOrganismesFermes++;
        }
      }
    });

    return {
      organismesFiables,
      organismesACompleter,
      nbOrganismesFermes,
    };
  }, [organismes]);

  return {
    organismesFiables,
    organismesACompleter,
    nbOrganismesFermes,
  };
}

export function useOrganismesDuplicatsLists() {
  const router = useRouter();

  const { data: organismesDuplicats } = useQuery<Organisme[], any>(
    ["admin/organismes-duplicats"],
    () => _get("/api/v1/admin/organismes-duplicates"),
    { enabled: router.isReady }
  );

  return { organismesDuplicats };
}

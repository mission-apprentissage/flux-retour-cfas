import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { IOrganisationIndicateursOrganismes, IOrganismesCount, normalize } from "shared";

import { _get, _post, _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
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
  } = useQuery<Organisme & { organismesCount: IOrganismesCount }, any>(
    ["organisation/organisme"],
    () => _get("/api/v1/organisation/organisme"),
    {
      enabled: enabled ?? true,
    }
  );

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

export function useOrganisationIndicateursOrganismes() {
  const router = useRouter();

  const { data, isLoading, error } = useQuery<IOrganisationIndicateursOrganismes, any>(
    ["organisation/organismes/indicateurs"],
    () => _get("/api/v1/organisation/organismes/indicateurs"),
    {
      enabled: router.isReady,
    }
  );

  return {
    data,
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
  const { organismesFiables, organismesACompleter, organismesNonRetenus, allOrganismes } = useMemo(() => {
    const organismesFiables: OrganismeNormalized[] = [];
    const organismesACompleter: OrganismeNormalized[] = [];
    const organismesNonRetenus: OrganismeNormalized[] = [];
    const allOrganismes: OrganismeNormalized[] = (organismes || []).map((organisme: Organisme) => {
      // We need to memorize organismes with normalized names to be avoid running the normalization on each keystroke.
      const normalizedName = normalize(organisme.enseigne ?? organisme.raison_sociale ?? "");
      const normalizedUai = normalize(organisme.uai ?? "");
      const normalizedCommune = normalize(organisme.adresse?.commune ?? "");

      const normaliszed: OrganismeNormalized = {
        ...organisme,
        normalizedName,
        normalizedUai,
        normalizedCommune,
      };

      if (organisme.fiabilisation_statut === "FIABLE" && !organisme.ferme && organisme.nature !== "inconnue") {
        organismesFiables.push(normaliszed);
      } else if (
        // Organismes à masquer :
        // organismes fermés et ne transmettant pas
        // organismes inconnus (sans raison sociale ni enseigne)
        (organisme.ferme && !organisme.last_transmission_date) ||
        (!organisme.enseigne && !organisme.raison_sociale)
      ) {
        organismesNonRetenus.push(normaliszed);
      } else {
        organismesACompleter.push(normaliszed);
      }

      return normaliszed;
    });

    return {
      organismesFiables,
      organismesACompleter,
      organismesNonRetenus,
      allOrganismes,
    };
  }, [organismes]);

  return {
    allOrganismes,
    organismesFiables,
    organismesACompleter,
    organismesNonRetenus,
  };
}

export function useOrganismesDuplicatsLists() {
  const router = useRouter();

  const { data: organismesDuplicats, isLoading } = useQuery<Organisme[], any>(
    ["admin/organismes-duplicates"],
    () => _get("/api/v1/admin/organismes-duplicates"),
    { enabled: router.isReady }
  );

  return { organismesDuplicats, isLoading };
}

export function useAffelnetCount(affelnetYear: Date, organisme_departements?: string | string[] | undefined) {
  const normalizedDepartements = useMemo(() => {
    if (typeof organisme_departements === "string") {
      return organisme_departements
        .split(",")
        .map((dept) => dept.trim())
        .filter((dept) => dept !== "");
    }
    return organisme_departements?.filter((dept) => dept.trim() !== "") ?? [];
  }, [organisme_departements]);

  const queryKey = useMemo(
    () => [
      "affelnet/national/count",
      { organisme_departements: normalizedDepartements, year: affelnetYear.getFullYear() },
    ],
    [normalizedDepartements, affelnetYear]
  );

  const queryFn = () => {
    let url = `/api/v1/affelnet/national/count`;

    url += `?year=${affelnetYear.getFullYear()}`;

    if (normalizedDepartements.length > 0) {
      url += `&organisme_departements=${normalizedDepartements.join(",")}`;
    }
    return _get(url);
  };

  const {
    data: affelnetCount,
    isLoading,
    error,
    refetch,
  } = useQuery<
    {
      voeuxFormules: number;
      apprenantVoeuxFormules: number;
      apprenantsNonContretise: number;
      apprenantsRetrouves: number;
    },
    any
  >(queryKey, queryFn, {
    enabled: true,
  });

  return {
    affelnetCount,
    isLoading,
    error,
    refetch,
  };
}

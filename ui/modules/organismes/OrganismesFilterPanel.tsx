import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { OrganisationType } from "@/common/internal/Organisation";
import useAuth from "@/hooks/useAuth";

import {
  PaginationInfosQuery,
  parsePaginationInfosFromQuery,
  convertPaginationInfosToQuery,
} from "../models/pagination";

import FiltreOrganismeDepartements from "./filters/FiltreOrganismeDepartements";
import FiltreOrganismesEtat from "./filters/FiltreOrganismeEtat";
import FiltreOrganismesNature from "./filters/FiltreOrganismeNature";
import FiltreOrganismeRegions from "./filters/FiltreOrganismeRegions";
import FiltreOrganismeTransmission from "./filters/FiltreOrganismeTransmission";
import FiltreYesNo from "./filters/FiltreYesNo";
import {
  OrganismesFilters,
  OrganismesFiltersQuery,
  parseOrganismesFiltersFromQuery,
  convertOrganismesFiltersToQuery,
} from "./models/organismes-filters";

export interface OrganismeFiltersListVisibilityProps {
  showFilterNature?: boolean;
  showFilterTransmission?: boolean;
  showFilterQualiopi?: boolean;
  showFilterPrepaApprentissage?: boolean;
  showFilterLocalisation?: boolean;
  showFilterEtat?: boolean;
}

const OrganismesFilterPanel = (props: OrganismeFiltersListVisibilityProps) => {
  const router = useRouter();
  const { auth } = useAuth();

  const { organismesFilters, sort } = useMemo(() => {
    const { pagination, sort } = parsePaginationInfosFromQuery(router.query as unknown as PaginationInfosQuery);
    return {
      organismesFilters: parseOrganismesFiltersFromQuery(router.query as unknown as OrganismesFiltersQuery),
      pagination: pagination,
      sort: sort ?? [{ desc: false, id: "nom" }],
    };
  }, [JSON.stringify(router.query)]);

  const updateState = (newParams: Partial<{ [key in keyof OrganismesFilters]: any }>) => {
    void router.push(
      {
        pathname: router.pathname,
        query: {
          ...convertOrganismesFiltersToQuery({ ...organismesFilters, ...newParams }),
          ...convertPaginationInfosToQuery({ sort, ...newParams }),
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const resetFilters = () => {
    void router.push(
      {
        pathname: router.pathname,
        query: {},
      },
      undefined,
      { shallow: true }
    );
  };

  const isAllowedToShowFilterDepartement = (type: OrganisationType) => {
    switch (type) {
      case "TETE_DE_RESEAU":
      case "DREETS":
      case "DRAAF":
      case "CONSEIL_REGIONAL":
      case "CARIF_OREF_REGIONAL":
      case "ACADEMIE":
      case "OPERATEUR_PUBLIC_NATIONAL":
      case "CARIF_OREF_NATIONAL":
      case "ADMINISTRATEUR":
        return true;

      default:
        return false;
    }
  };

  const isAllowedToShowFilterRegions = (type: OrganisationType) => {
    switch (type) {
      case "TETE_DE_RESEAU":
      case "OPERATEUR_PUBLIC_NATIONAL":
      case "CARIF_OREF_NATIONAL":
      case "ADMINISTRATEUR":
        return true;

      default:
        return false;
    }
  };

  return (
    <Stack spacing="0.5">
      <Text fontSize="zeta" fontWeight="extrabold">
        FILTRER PAR
      </Text>
      <HStack>
        {/* FILTRE DEPARTEMENT */}
        {props?.showFilterLocalisation && isAllowedToShowFilterDepartement(auth?.organisation?.type) && (
          <FiltreOrganismeDepartements
            value={organismesFilters.departements}
            onChange={(departements) => updateState({ departements })}
          />
        )}

        {/* FILTRE REGION */}
        {props?.showFilterLocalisation && isAllowedToShowFilterRegions(auth?.organisation?.type) && (
          <FiltreOrganismeRegions value={organismesFilters.regions} onChange={(regions) => updateState({ regions })} />
        )}

        {/* FILTRE NATURE */}
        {props?.showFilterNature && (
          <FiltreOrganismesNature value={organismesFilters.nature} onChange={(nature) => updateState({ nature })} />
        )}

        {/* FILTRE TRANSMISSION */}
        {props?.showFilterTransmission && (
          <FiltreOrganismeTransmission
            fieldName="transmission"
            value={organismesFilters.transmission}
            onChange={(transmission) => updateState({ transmission })}
          />
        )}

        {/* FILTRE QUALIOPI */}
        {props?.showFilterQualiopi && (
          <FiltreYesNo
            fieldName="qualiopi"
            filterLabel="Certification qualiopi"
            value={organismesFilters.qualiopi}
            onChange={(qualiopi) => updateState({ qualiopi })}
          />
        )}

        {/* FILTRE PREPA APPRENTISSAGE */}
        {props?.showFilterPrepaApprentissage && (
          <FiltreYesNo
            fieldName="prepa_apprentissage"
            filterLabel="Prépa-apprentissage"
            value={organismesFilters.prepa_apprentissage}
            onChange={(prepa_apprentissage) => updateState({ prepa_apprentissage })}
          />
        )}

        {/* FILTRE ETAT */}
        {props?.showFilterEtat && (
          <FiltreOrganismesEtat value={organismesFilters.ferme} onChange={(ferme) => updateState({ ferme })} />
        )}

        {/* REINITIALISER */}
        <Button
          variant="secondary"
          onClick={resetFilters}
          color="action-high-blue-france"
          borderBottom="1px"
          fontSize="omega"
          _hover={{ textDecoration: "none" }}
        >
          réinitialiser
        </Button>
      </HStack>
    </Stack>
  );
};

export default OrganismesFilterPanel;
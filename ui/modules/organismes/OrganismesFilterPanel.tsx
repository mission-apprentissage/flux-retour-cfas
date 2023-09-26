import { HStack, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useMemo } from "react";

import Link from "@/components/Links/Link";
import useAuth from "@/hooks/useAuth";

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

  const { organismesFilters } = useMemo(() => {
    return {
      organismesFilters: parseOrganismesFiltersFromQuery(router.query as unknown as OrganismesFiltersQuery),
    };
  }, [JSON.stringify(router.query)]);

  const updateState = (newParams: Partial<{ [key in keyof OrganismesFilters]: any }>) => {
    void router.push(
      {
        pathname: router.pathname,
        query: { ...convertOrganismesFiltersToQuery({ ...organismesFilters, ...newParams }) },
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

  console.log("orga :>> ", auth.organisation);

  const allowedShowFilterDepartement = [
    "TETE_DE_RESEAU",
    "DREETS",
    "DRAAF",
    "CONSEIL_REGIONAL",
    "CARIF_OREF_REGIONAL",
    "ACADEMIE",
    "OPERATEUR_PUBLIC_NATIONAL",
    "CARIF_OREF_NATIONAL",
    "ADMINISTRATEUR",
  ].includes(auth?.organisation?.type);

  const allowedShowFilterRegions = [
    "TETE_DE_RESEAU",
    "OPERATEUR_PUBLIC_NATIONAL",
    "CARIF_OREF_NATIONAL",
    "ADMINISTRATEUR",
  ].includes(auth?.organisation?.type);

  return (
    <Stack spacing="0.5">
      <Text fontSize="zeta" fontWeight="extrabold">
        FILTRER PAR
      </Text>
      <HStack>
        {/* FILTRE DEPARTEMENT */}
        {props?.showFilterLocalisation && allowedShowFilterDepartement && (
          <FiltreOrganismeDepartements
            value={organismesFilters.departements}
            onChange={(departements) => updateState({ departements })}
          />
        )}

        {/* FILTRE REGION */}
        {props?.showFilterLocalisation && allowedShowFilterRegions && (
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
        <Link
          href=""
          onClick={resetFilters}
          color="action-high-blue-france"
          borderBottom="1px"
          fontSize="omega"
          _hover={{ textDecoration: "none" }}
        >
          réinitialiser
        </Link>
      </HStack>
    </Stack>
  );
};

export default OrganismesFilterPanel;

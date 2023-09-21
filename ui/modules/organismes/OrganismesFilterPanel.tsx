import { HStack, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useMemo } from "react";

import Link from "@/components/Links/Link";

import FiltreOrganismesEtat from "./filters/FiltreOrganismeEtat";
import FiltreOrganismesNature from "./filters/FiltreOrganismeNature";
import FiltreYesNo from "./filters/FiltreYesNo";
import OrganismesFilterSelect from "./filters/OrganismesFilterSelect";
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

  return (
    <Stack spacing="0.5">
      <Text fontSize="zeta" fontWeight="extrabold">
        FILTRER PAR
      </Text>
      <HStack>
        {/* FILTRE NATURE */}
        {props?.showFilterNature && (
          <OrganismesFilterSelect label="Nature" badge={organismesFilters.nature?.length}>
            <FiltreOrganismesNature value={organismesFilters.nature} onChange={(nature) => updateState({ nature })} />
          </OrganismesFilterSelect>
        )}

        {/* FILTRE TRANSMISSION */}
        {props?.showFilterTransmission && (
          <OrganismesFilterSelect
            label="Transmission au tableau de bord"
            badge={organismesFilters.transmission?.length}
          >
            <FiltreYesNo
              fieldName="transmission"
              value={organismesFilters.transmission}
              onChange={(transmission) => updateState({ transmission })}
            />
          </OrganismesFilterSelect>
        )}

        {/* FILTRE QUALIOPI */}
        {props?.showFilterQualiopi && (
          <OrganismesFilterSelect label="Certification qualiopi" badge={organismesFilters.qualiopi?.length}>
            <FiltreYesNo
              fieldName="qualiopi"
              value={organismesFilters.qualiopi}
              onChange={(qualiopi) => updateState({ qualiopi })}
            />
          </OrganismesFilterSelect>
        )}

        {/* FILTRE PREPA APPRENTISSAGE */}
        {props?.showFilterPrepaApprentissage && (
          <OrganismesFilterSelect label="Prépa-apprentissage" badge={organismesFilters.prepa_apprentissage?.length}>
            <FiltreYesNo
              fieldName="prepa_apprentissage"
              value={organismesFilters.prepa_apprentissage}
              onChange={(prepa_apprentissage) => updateState({ prepa_apprentissage })}
            />
          </OrganismesFilterSelect>
        )}

        {/* FILTRE LOCALISATION */}
        {props?.showFilterLocalisation && (
          <OrganismesFilterSelect label="Localisation" badge={50}>
            EN COURS
          </OrganismesFilterSelect>
        )}

        {/* FILTRE ETAT */}
        {props?.showFilterEtat && (
          <OrganismesFilterSelect label="Etat" badge={organismesFilters.ferme?.length}>
            <FiltreOrganismesEtat value={organismesFilters.ferme} onChange={(ferme) => updateState({ ferme })} />
          </OrganismesFilterSelect>
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

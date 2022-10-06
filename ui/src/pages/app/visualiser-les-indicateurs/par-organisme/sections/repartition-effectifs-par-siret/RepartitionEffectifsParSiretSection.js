import { Heading, HStack, Stack, Text, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsDataListCsvExport } from "../../../../../../common/api/tableauDeBord";
import { hasUserRoles, roles } from "../../../../../../common/auth/roles";
import { MonthSelect, Section } from "../../../../../../common/components";
import DownloadBlock from "../../../../../../common/components/DownloadBlock/DownloadBlock";
import RepartitionEffectifsParSiret from "../../../../../../common/components/tables/RepartitionEffectifsParSiretAndDepartement";
import useAuth from "../../../../../../common/hooks/useAuth";
import useFetchEffectifsParSiret from "../../../../../../common/hooks/useFetchEffectifsParSiret";
import { mapFiltersToApiFormat } from "../../../../../../common/utils/mapFiltersToApiFormat";
import { InfoLine } from "../../../../../../theme/components/icons";
import { filtersPropTypes, useFiltersContext } from "../../../../../app/visualiser-les-indicateurs/FiltersContext";

const RepartitionEffectifsParSiretSection = ({ filters, namedDataDownloadMode = false }) => {
  const { data, loading, error } = useFetchEffectifsParSiret(filters);
  const filtersContext = useFiltersContext();
  const exportFilename = `tdb-données-cfa-${filters.cfa?.uai_etablissement}-${new Date().toLocaleDateString()}.csv`;

  const { auth } = useAuth();
  const allowDownloadNamedData = hasUserRoles(auth, roles.administrator) || namedDataDownloadMode === true;

  // enable namedDataMode if needed
  const fetchEffectifsDataListQueryParams =
    allowDownloadNamedData === true
      ? { ...mapFiltersToApiFormat(filters), namedDataMode: true }
      : mapFiltersToApiFormat(filters);

  return (
    <Section paddingY="4w">
      <HStack marginBottom="2w">
        <Heading as="h2" variant="h2">
          Répartition des effectifs par SIRET
        </Heading>

        <MonthSelect value={filtersContext.state.date} onChange={filtersContext.setters.setDate} />
        <Tooltip
          label={
            <Text>
              La sélection du mois permet d&apos;afficher les effectifs au dernier jour du mois. <br />
              <br /> A noter : la période de référence pour l&apos;année scolaire court du 1er août au 31 juillet
            </Text>
          }
          aria-label="A tooltip"
          background="bluefrance"
          color="white"
          padding={5}
        >
          <Text as="span">
            <InfoLine h="14px" w="14px" color="grey.500" ml={1} mb={1} />
          </Text>
        </Tooltip>
      </HStack>
      <Stack spacing="4w">
        <RepartitionEffectifsParSiret effectifs={data} loading={loading} error={error} />
        <DownloadBlock
          title="Télécharger les données de l’organisme sélectionné"
          description={`Le fichier est généré à date du jour, en fonction de l’organisme sélectionnée et comprend la liste ${
            allowDownloadNamedData === false ? "anonymisée" : ""
          } des apprenants par organisme et formation.`}
          fileName={exportFilename}
          getFile={() => fetchEffectifsDataListCsvExport(fetchEffectifsDataListQueryParams)}
        />
      </Stack>
    </Section>
  );
};

RepartitionEffectifsParSiretSection.propTypes = {
  filters: filtersPropTypes.state,
  namedDataDownloadMode: PropTypes.bool,
};

export default RepartitionEffectifsParSiretSection;

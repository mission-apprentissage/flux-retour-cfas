import { Heading, HStack, Stack, Text, Tooltip } from "@chakra-ui/react";
import React from "react";

import { fetchEffectifsDataListCsvExport } from "@/common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import DownloadBlock from "@/components/DownloadBlock/DownloadBlock";
import MonthSelect from "@/components/MonthSelect/MonthSelect";
import Section from "@/components/Section/Section";
import RepartitionEffectifsParSiret from "@/components/tables/RepartitionEffectifsParSiretAndDepartement";
import useFetchEffectifsParSiret from "@/hooks/useFetchEffectifsParSiret";
import {
  filtersPropTypes,
  useFiltersContext,
} from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import { InfoLine } from "@/theme/components/icons";

const RepartitionEffectifsParSiretSection = ({ filters }) => {
  const { data, loading, error } = useFetchEffectifsParSiret(filters);
  const filtersContext = useFiltersContext();
  const exportFilename = `tdb-données-cfa-${filters.cfa?.uai_etablissement}-${new Date().toLocaleDateString()}.csv`;

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
          description="Le fichier est généré à date du jour, en fonction de l’organisme sélectionnée et comprend la liste anonymisée des apprenants par organisme et formation."
          fileName={exportFilename}
          getFile={() => fetchEffectifsDataListCsvExport(mapFiltersToApiFormat(filters))}
        />
      </Stack>
    </Section>
  );
};

RepartitionEffectifsParSiretSection.propTypes = {
  filters: filtersPropTypes.state,
};

export default RepartitionEffectifsParSiretSection;

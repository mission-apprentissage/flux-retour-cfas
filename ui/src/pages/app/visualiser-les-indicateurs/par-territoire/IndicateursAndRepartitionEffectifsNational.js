import { Stack } from "@chakra-ui/react";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsDataListCsvExport } from "../../../../common/api/tableauDeBord";
import { Section } from "../../../../common/components";
import DownloadBlock from "../../../../common/components/DownloadBlock/DownloadBlock";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { useFiltersContext } from "../FiltersContext";
import IndicateursGridStack from "../IndicateursGridStack";

const IndicateursAndRepartitionEffectifsNational = ({ effectifs, loading, showOrganismesCount = true }) => {
  const { state: filters } = useFiltersContext();
  const exportFilename = `tdb-données-territoire-national-${new Date().toLocaleDateString()}.csv`;

  return (
    <Section paddingY="4w">
      <Tabs isLazy lazyBehavior="keepMounted">
        <TabList>
          <Tab fontWeight="bold" fontSize="delta">
            Vue globale
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel paddingTop="4w">
            <Stack spacing="4w">
              <IndicateursGridStack effectifs={effectifs} loading={loading} showOrganismesCount={showOrganismesCount} />
              <DownloadBlock
                title="Télécharger les données du territoire sélectionné"
                description="Le fichier est généré à date du jour, en fonction du territoire sélectionné et comprend la liste anonymisée des apprenants par organisme et formation."
                fileName={exportFilename}
                getFile={() => fetchEffectifsDataListCsvExport(mapFiltersToApiFormat(filters))}
              />
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Section>
  );
};

IndicateursAndRepartitionEffectifsNational.propTypes = {
  loading: PropTypes.bool.isRequired,
  showOrganismesCount: PropTypes.bool,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    inscritsSansContrat: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    abandons: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    rupturants: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
  }),
};

export default IndicateursAndRepartitionEffectifsNational;

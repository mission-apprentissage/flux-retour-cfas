import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/tabs";
import React from "react";

import { PageSectionSubtitle } from "../../../../../common/components";
import RepartitionEffectifsParCfa from "../../../../../common/components/tables/RepartitionEffectifsParCfa";
import RepartitionEffectifsParNiveauEtAnneeFormation from "../../../../../common/components/tables/RepartitionEffectifsParNiveauEtAnneeFormation";
import { filtersPropTypes } from "../../../FiltersContext";
import withRepartitionEffectifsReseauParCfa from "./withRepartitionEffectifsReseauParCfaData";
import withRepartitionEffectifsReseauParNiveauEtAnneeFormation from "./withRepartitionEffectifsReseauParNiveauEtAnneeFormation";

const RepartitionEffectifsReseauParCfa = withRepartitionEffectifsReseauParCfa(RepartitionEffectifsParCfa);
const RepartitionEffectifsReseauParNiveauEtAnneeFormation = withRepartitionEffectifsReseauParNiveauEtAnneeFormation(
  RepartitionEffectifsParNiveauEtAnneeFormation
);

const RepartitionEffectifsReseau = ({ filters }) => {
  return (
    <section>
      <PageSectionSubtitle>Répartition des effectifs</PageSectionSubtitle>
      <Tabs
        variant="unstyled"
        marginTop="1w"
        _selected={{ borderBottom: "3px solid", borderBottomColor: "bluefrance", color: "grey.800" }}
      >
        <TabList color="gray.600">
          <Tab
            padding="0"
            paddingY="1rem"
            marginRight="1rem"
            _selected={{ borderBottom: "3px solid", borderBottomColor: "bluefrance", color: "grey.800" }}
          >
            formations
          </Tab>
          <Tab
            padding="0"
            paddingY="1rem"
            marginRight="1rem"
            _selected={{ borderBottom: "3px solid", borderBottomColor: "bluefrance", color: "grey.800" }}
          >
            organismes de formation
          </Tab>
        </TabList>
        <TabPanels padding="0">
          <TabPanel padding="0">
            <RepartitionEffectifsReseauParNiveauEtAnneeFormation filters={filters} />
          </TabPanel>
          <TabPanel padding="0">
            <RepartitionEffectifsReseauParCfa filters={filters} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </section>
  );
};

RepartitionEffectifsReseau.propTypes = {
  filters: filtersPropTypes,
};

export default RepartitionEffectifsReseau;

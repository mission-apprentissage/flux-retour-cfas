import { Box, Flex } from "@chakra-ui/react";
import { Tab, TabList, TabPanels, Tabs } from "@chakra-ui/tabs";
import PropTypes from "prop-types";
import React, { useState } from "react";

import ExportRepartitionByFormationButton from "../ExportRepartitionByFormationButton/ExportRepartitionByFormationButton";
import ExportRepartitionByOrganismeButton from "../ExportRepartitionByOrganismeButton/ExportRepartitionByOrganismeButton";

const RepartitionEffectifsTabs = ({ children }) => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Tabs isLazy lazyBehavior="keepMounted" onChange={setTabIndex}>
      <TabList>
        <Tab>
          <Box as="i" className="ri-community-fill" marginRight="1v" paddingTop="2px" verticalAlign="middle" />
          Organismes de formation
        </Tab>
        <Tab>
          <Box as="i" className="ri-book-mark-fill" marginRight="1v" paddingTop="2px" verticalAlign="middle" />
          Niveaux de formation
        </Tab>
        <Flex justifyContent="flex-end" flex="1">
          {tabIndex === 0 ? <ExportRepartitionByOrganismeButton /> : <ExportRepartitionByFormationButton />}
        </Flex>
      </TabList>
      <TabPanels>{children}</TabPanels>
    </Tabs>
  );
};

RepartitionEffectifsTabs.propTypes = {
  children: PropTypes.arrayOf(PropTypes.node.isRequired).isRequired,
};

export default RepartitionEffectifsTabs;

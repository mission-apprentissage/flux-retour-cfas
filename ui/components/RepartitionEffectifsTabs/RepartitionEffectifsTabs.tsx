import { Tab, TabList, TabPanels, Tabs } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const RepartitionEffectifsTabs = ({ children }) => {
  return (
    <Tabs isLazy lazyBehavior="keepMounted">
      <TabList>
        <Tab fontWeight="bold" fontSize="delta">
          Vue globale
        </Tab>
        <Tab fontWeight="bold" fontSize="delta">
          Effectifs par organismes
        </Tab>
        <Tab fontWeight="bold" fontSize="delta">
          Effectifs par niveau
        </Tab>
      </TabList>
      <TabPanels>{children}</TabPanels>
    </Tabs>
  );
};

RepartitionEffectifsTabs.propTypes = {
  children: PropTypes.arrayOf(PropTypes.node.isRequired).isRequired,
};

export default RepartitionEffectifsTabs;

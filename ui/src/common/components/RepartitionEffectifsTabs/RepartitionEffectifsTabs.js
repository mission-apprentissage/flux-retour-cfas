import { Box } from "@chakra-ui/react";
import { Tab, TabList, TabPanels, Tabs } from "@chakra-ui/tabs";
import PropTypes from "prop-types";
import React from "react";

const RepartitionEffectifsTabs = ({ children }) => {
  return (
    <Tabs isLazy lazyBehavior="keepMounted">
      <TabList>
        <Tab>
          <Box as="i" className="ri-community-fill" marginRight="1v" paddingTop="2px" verticalAlign="middle" />
          Répartition par organismes de formation
        </Tab>
        <Tab>
          <Box as="i" className="ri-book-mark-fill" marginRight="1v" paddingTop="2px" verticalAlign="middle" />
          Répartition par formations
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

import { Box, HStack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

const TabName = ({ isSelected = false, onClick, children }) => {
  return (
    <Box
      cursor="pointer"
      _hover={{ borderBottom: "4px solid" }}
      onClick={onClick}
      color={isSelected ? "bluefrance" : "grey.600"}
      borderBottom={isSelected ? "4px solid" : "none"}
      paddingBottom="1w"
      role="button"
    >
      {children}
    </Box>
  );
};

TabName.propTypes = {
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

const MenuTabs = ({ children, tabNames }) => {
  const [selectedTabIndex, setSelectedTab] = useState(0);

  const tabPanelSelected = React.Children.toArray(children)[selectedTabIndex];

  return (
    <>
      <HStack
        spacing="4w"
        marginBottom="2w"
        borderBottom="1px solid"
        borderBottomColor="gray.300"
        role="tablist"
        as="ul"
      >
        {tabNames.map((name, index) => (
          <TabName
            key={name}
            onClick={() => {
              setSelectedTab(index);
            }}
            isSelected={selectedTabIndex === index}
          >
            {name}
          </TabName>
        ))}
      </HStack>
      {tabPanelSelected ? <div role="tabpanel">{tabPanelSelected}</div> : null}
    </>
  );
};

MenuTabs.propTypes = {
  tabNames: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  children: PropTypes.arrayOf(PropTypes.node.isRequired).isRequired,
};

export default MenuTabs;

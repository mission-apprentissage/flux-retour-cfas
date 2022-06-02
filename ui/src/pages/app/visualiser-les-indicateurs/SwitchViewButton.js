import { Box, Button, List } from "@chakra-ui/react";
import React, { useState } from "react";
import { NavLink } from "react-router-dom";

import { FilterOption, OverlayMenu } from "../../../common/components";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";

const SwitchViewButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button
        variant="select-primary"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        fontSize="zeta"
      >
        <Box as="span" fontWeight="normal">
          changer de vue
        </Box>
        <Box
          fontSize="zeta"
          marginLeft="1v"
          marginTop="3px"
          as="i"
          className={isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
          textDecoration="none"
        />
      </Button>
      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <List spacing="2w" marginTop="1w" textAlign="left">
            <NavLink to={NAVIGATION_PAGES.VisualiserLesIndicateursParTerritoire.path}>
              <FilterOption>Vue par territoire</FilterOption>
            </NavLink>
            <NavLink to={NAVIGATION_PAGES.VisualiserLesIndicateursParReseau.path}>
              <FilterOption>Vue par réseau</FilterOption>
            </NavLink>
            <NavLink to={NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme.path}>
              <FilterOption>Vue par organisme de formation</FilterOption>
            </NavLink>
            <NavLink to={NAVIGATION_PAGES.VisualiserLesIndicateursParFormation.path}>
              <FilterOption>Vue par formation</FilterOption>
            </NavLink>
          </List>
        </OverlayMenu>
      )}
    </div>
  );
};

export default SwitchViewButton;

import { Box, Button, List } from "@chakra-ui/react";
import React, { useState } from "react";
import NavLink from "next/link";

import { FilterOption, OverlayMenu } from "../../components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";

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
        <OverlayMenu width="558px" fixedHorizon={true} onClose={() => setIsOpen(false)}>
          <List spacing="2w" marginTop="1w" textAlign="left">
            <NavLink href={NAVIGATION_PAGES.VisualiserLesIndicateursParTerritoire.path}>
              <FilterOption onClick={() => setIsOpen(false)}>Vue par territoire</FilterOption>
            </NavLink>
            <NavLink href={NAVIGATION_PAGES.VisualiserLesIndicateursParReseau.path}>
              <FilterOption onClick={() => setIsOpen(false)}>Vue par réseau</FilterOption>
            </NavLink>
            <NavLink href={NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme.path}>
              <FilterOption onClick={() => setIsOpen(false)}>Vue par organisme de formation</FilterOption>
            </NavLink>
            <NavLink href={NAVIGATION_PAGES.VisualiserLesIndicateursParFormation.path}>
              <FilterOption onClick={() => setIsOpen(false)}>Vue par formation</FilterOption>
            </NavLink>
          </List>
        </OverlayMenu>
      )}
    </div>
  );
};

export default SwitchViewButton;

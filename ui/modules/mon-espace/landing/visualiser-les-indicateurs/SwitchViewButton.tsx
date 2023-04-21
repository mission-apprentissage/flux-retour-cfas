import { Box, Button, List } from "@chakra-ui/react";
import NavLink from "next/link";
import React, { useState } from "react";

import FilterOption from "@/components/FilterOption/FilterOption";
import OverlayMenu from "@/components/OverlayMenu/OverlayMenu";

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
            <NavLink href="/par-territoire" onClick={() => setIsOpen(false)}>
              <FilterOption>Vue par territoire</FilterOption>
            </NavLink>
            <NavLink href="/par-reseau" onClick={() => setIsOpen(false)}>
              <FilterOption>Vue par réseau</FilterOption>
            </NavLink>
            <NavLink href="/par-organisme" onClick={() => setIsOpen(false)}>
              <FilterOption>Vue par organisme de formation</FilterOption>
            </NavLink>
            <NavLink href="/par-formation" onClick={() => setIsOpen(false)}>
              <FilterOption>Vue par formation</FilterOption>
            </NavLink>
          </List>
        </OverlayMenu>
      )}
    </div>
  );
};

export default SwitchViewButton;

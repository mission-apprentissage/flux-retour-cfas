import { Box, Heading, List, ListItem } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import OverlayMenu from "@/components/OverlayMenu/OverlayMenu";
import PrimarySelectButton from "@/components/SelectButton/PrimarySelectButton";
import { useFiltersContext } from "../../../FiltersContext";

const MultiSiretFilter = ({ onSiretClick, sirets }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filtersContext = useFiltersContext();
  const buttonLabel = filtersContext.state.sousEtablissement?.siret_etablissement || "";

  return (
    <Heading as="h2" variant="h2">
      Répartition des effectifs pour le{" "}
      <PrimarySelectButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        SIRET {buttonLabel}
      </PrimarySelectButton>
      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
            {sirets.map((siret) => {
              const isSelected = filtersContext.state.sousEtablissement?.siret_etablissement === siret;
              return (
                <ListItem
                  key={siret}
                  cursor="pointer"
                  onClick={() => {
                    onSiretClick(siret), setIsOpen(false);
                  }}
                  color={isSelected ? "bluefrance" : "grey.800"}
                  fontSize="zeta"
                  fontWeight={isSelected ? "700" : "400"}
                  role="button"
                  paddingY="1w"
                  display="flex"
                  _hover={{ color: "bluefrance", backgroundColor: "grey.100" }}
                >
                  <Box as="span" borderLeft={isSelected ? "solid 2px" : "none"} borderColor="bluefrance" paddingX="1w">
                    {siret}
                  </Box>
                </ListItem>
              );
            })}
          </List>
        </OverlayMenu>
      )}
    </Heading>
  );
};

MultiSiretFilter.propTypes = {
  onSiretClick: PropTypes.func.isRequired,
  sirets: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default MultiSiretFilter;

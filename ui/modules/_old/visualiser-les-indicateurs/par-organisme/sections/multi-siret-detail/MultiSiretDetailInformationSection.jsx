import { Box, HStack, Link } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../../../../common/components";
import { useFiltersContext } from "../../../FiltersContext";
import MultiSiretFilter from "./MultiSiretFilter";

const MultiSiretDetailInformationSection = ({ sirets }) => {
  const filtersContext = useFiltersContext();
  const onSiretClick = (siret) => {
    filtersContext.setters.setSousEtablissement({
      uai_etablissement: filtersContext.state.sousEtablissement?.uai_etablissement,
      siret_etablissement: siret,
    });
  };

  return (
    <Section paddingY="2w">
      <HStack marginBottom="2w">
        <Box as="i" className="ri-arrow-left-line" marginRight="1w"></Box>
        <Link
          onClick={() => {
            filtersContext.setters.setSousEtablissement(null);
            window.scrollTo(0, 0);
          }}
        >
          Retour à la liste
        </Link>
      </HStack>
      {sirets && sirets.length > 0 && <MultiSiretFilter onSiretClick={onSiretClick} sirets={sirets} />}
    </Section>
  );
};
MultiSiretDetailInformationSection.propTypes = {
  sirets: PropTypes.arrayOf(PropTypes.string),
};

export default MultiSiretDetailInformationSection;

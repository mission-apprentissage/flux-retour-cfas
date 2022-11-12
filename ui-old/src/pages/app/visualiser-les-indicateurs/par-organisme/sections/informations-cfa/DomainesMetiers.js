import { Button, useBoolean, Wrap } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Tag } from "../../../../../../common/components";
import { MAX_DISPLAYED_DOMAINE_METIERS } from "../../../../../../common/constants/domainesMetiers";

const DomainesMetiers = ({ domainesMetiers }) => {
  const [showAllDomainesMetiers, setShowAllDomainesMetiers] = useBoolean(false);
  const domainesMetierToDisplay = showAllDomainesMetiers
    ? domainesMetiers
    : [...domainesMetiers.slice(0, MAX_DISPLAYED_DOMAINE_METIERS)];

  const displayShowMoreButton = domainesMetiers.length > MAX_DISPLAYED_DOMAINE_METIERS;

  return (
    <Wrap marginTop="2w" marginBottom="2w" spacing="1w">
      {domainesMetierToDisplay.map((item) => (
        <Tag backgroundColor="#EEEEEE" textColor="#161616" key={item}>
          {item}
        </Tag>
      ))}
      {displayShowMoreButton && (
        <Button
          size="sm"
          fontSize="omega"
          onClick={setShowAllDomainesMetiers.toggle}
          marginTop="1w"
          marginLeft="2w"
          color="bluefrance"
          textDecoration="underline"
        >
          {showAllDomainesMetiers ? "masquer les domaines" : "afficher tous les domaines"}
        </Button>
      )}
    </Wrap>
  );
};

DomainesMetiers.propTypes = {
  domainesMetiers: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default DomainesMetiers;

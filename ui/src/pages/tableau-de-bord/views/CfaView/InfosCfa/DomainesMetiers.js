import { Button, HStack, Tag, useBoolean } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { MAX_DISPLAYED_DOMAINE_METIERS } from "../../../../../common/constants/domainesMetiers";

const DomainesMetiers = ({ domainesMetiers }) => {
  const [hideDomainesMetiers, setHideDomainesMetiers] = useBoolean(true);
  const hideComponent = domainesMetiers.length != 0;
  const domainesMetierToDisplay = hideDomainesMetiers
    ? [...domainesMetiers.slice(0, MAX_DISPLAYED_DOMAINE_METIERS)]
    : domainesMetiers;

  return (
    <>
      {hideComponent && (
        <HStack marginTop="1w" flexWrap="wrap">
          {domainesMetierToDisplay.map((item, i) => (
            <>
              <br />
              <br />
              <Tag
                key={i}
                fontSize="omega"
                paddingX="2w"
                paddingY="1w"
                borderRadius="20px"
                color="white"
                background="rgba(255, 255, 255, 0.24)"
              >
                {item}
              </Tag>
            </>
          ))}
          <Button size="sm" onClick={setHideDomainesMetiers.toggle} mt="1rem" color="white">
            {hideDomainesMetiers ? "afficher les domaines" : "masquer les domaines"}
          </Button>
        </HStack>
      )}
    </>
  );
};

DomainesMetiers.propTypes = {
  domainesMetiers: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default DomainesMetiers;

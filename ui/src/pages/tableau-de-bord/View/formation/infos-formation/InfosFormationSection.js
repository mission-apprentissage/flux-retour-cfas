import { Box, Heading, Skeleton, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Highlight } from "../../../../../common/components";
import withInfoFormationData from "./withInfoFormationData";

const InfosFormationSection = ({ infosFormation, loading, error }) => {
  let content = null;

  if (loading) {
    content = (
      <>
        <Skeleton height="1rem" width="100px" startColor="whiteAlpha.900" endColor="whiteAlpha.100" marginBottom="1w" />
        <Skeleton height="2rem" width="600px" startColor="whiteAlpha.900" endColor="whiteAlpha.100" />
      </>
    );
  }

  if (error) {
    content = (
      <Text fontSize="epsilon" color="white">
        <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
        <Box as="span" verticalAlign="middle">
          Erreur lors de la récupération des informations de la formation
        </Box>
      </Text>
    );
  }

  if (infosFormation) {
    content = (
      <>
        <Text color="white" fontSize="omega">
          CFD&nbsp;:&nbsp;{infosFormation.cfd}
        </Text>
        <Heading color="white" fontSize="gamma" marginTop="1w">
          {infosFormation.libelle}
        </Heading>
      </>
    );
  }

  return <Highlight>{content}</Highlight>;
};

InfosFormationSection.propTypes = {
  infosFormation: PropTypes.shape({
    libelle: PropTypes.string.isRequired,
    cfd: PropTypes.string.isRequired,
  }),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default withInfoFormationData(InfosFormationSection);

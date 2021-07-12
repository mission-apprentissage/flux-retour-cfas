import { Box, Heading, HStack, Skeleton, Tag, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Highlight } from "../../../../../common/components";
import { MAX_DISPLAYED_DOMAINE_METIERS } from "../../../../../common/constants/domainesMetiers";
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
    const domainesMetierToDisplay = infosFormation.metiers
      ? infosFormation.metiers.length > MAX_DISPLAYED_DOMAINE_METIERS
        ? [...infosFormation.metiers.slice(0, MAX_DISPLAYED_DOMAINE_METIERS), "..."]
        : infosFormation.metiers
      : [];

    content = (
      <>
        <Text color="white" fontSize="omega">
          CFD&nbsp;:&nbsp;{infosFormation.cfd}
        </Text>
        <Heading color="white" fontSize="gamma" marginTop="1w">
          {infosFormation.libelle}
        </Heading>
        <HStack marginTop="1w">
          {domainesMetierToDisplay.map((item, i) => (
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
          ))}
        </HStack>
      </>
    );
  }

  return <Highlight>{content}</Highlight>;
};

InfosFormationSection.propTypes = {
  infosFormation: PropTypes.shape({
    libelle: PropTypes.string.isRequired,
    cfd: PropTypes.string.isRequired,
    metiers: PropTypes.arrayOf(PropTypes.string).isRequired,
  }),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default withInfoFormationData(InfosFormationSection);

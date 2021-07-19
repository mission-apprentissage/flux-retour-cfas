import { Box, Heading, HStack, Skeleton, Tag, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Highlight } from "../../../../../common/components";
import { MAX_DISPLAYED_DOMAINE_METIERS } from "../../../../../common/constants/domainesMetiers";
import { pluralize } from "../../../../../common/utils/stringUtils";
import { filtersPropTypes } from "../../../FiltersContext";

const CfaDetail = ({ infosCfa, loading, error }) => {
  let content = null;

  if (loading) {
    content = (
      <Highlight>
        <Skeleton height="1rem" width="250px" marginBottom="1w" />
        <Skeleton height="2rem" width="600px" marginBottom="1w" />
        <Skeleton height="1rem" width="800px" marginBottom="1w" />
        <Skeleton height="1rem" width="150px" marginBottom="1w" />
        <HStack marginTop="1w">
          <Skeleton height="2rem" width="300px" marginBottom="1w" />
          <Skeleton height="2rem" width="300px" marginBottom="1w" />
          <Skeleton height="2rem" width="300px" marginBottom="1w" />
          <Skeleton height="2rem" width="300px" marginBottom="1w" />
        </HStack>
      </Highlight>
    );
  }

  if (error) {
    content = (
      <Text fontSize="epsilon" color="white">
        <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
        <Box as="span" verticalAlign="middle">
          Erreur lors de la récupération des informations de l&apos;organisme de formation
        </Box>
      </Text>
    );
  }

  if (infosCfa) {
    const domainesMetierToDisplay =
      infosCfa.domainesMetiers.length > MAX_DISPLAYED_DOMAINE_METIERS
        ? [...infosCfa.domainesMetiers.slice(0, MAX_DISPLAYED_DOMAINE_METIERS), "..."]
        : infosCfa.domainesMetiers;

    const displaySirets = (sirets) =>
      `- ${sirets.length} ${pluralize("SIRET", sirets.length, "S")} pour cet organisme `;

    content = (
      <Highlight>
        <Text color="white" fontSize="omega">
          UAI&nbsp;:&nbsp;{infosCfa.uai} {infosCfa.sirets && displaySirets(infosCfa.sirets)}
        </Text>
        <Heading color="white" fontSize="gamma" marginTop="1w">
          {infosCfa.libelleLong}
        </Heading>
        <Text color="white" marginTop="1w">
          {infosCfa.adresse}
        </Text>
        {infosCfa.reseaux?.length > 0 && (
          <Text color="white">
            Réseau(x)&nbsp;:&nbsp;
            {infosCfa.reseaux.join(", ")}
          </Text>
        )}
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
      </Highlight>
    );
  }

  return content;
};

CfaDetail.propTypes = {
  filters: filtersPropTypes.state,
  infosCfa: PropTypes.shape({
    sirets: PropTypes.arrayOf(PropTypes.string).isRequired,
    libelleLong: PropTypes.string.isRequired,
    reseaux: PropTypes.arrayOf(PropTypes.string).isRequired,
    domainesMetiers: PropTypes.arrayOf(PropTypes.string).isRequired,
    uai: PropTypes.string.isRequired,
    adresse: PropTypes.string.isRequired,
  }),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default CfaDetail;

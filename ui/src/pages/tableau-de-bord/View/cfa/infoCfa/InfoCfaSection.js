import { Box, Heading, HStack, Skeleton, Tag, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Highlight } from "../../../../../common/components";
import withInfoCfaData from "./withInfoCfaData";

const InfoCfaSection = ({ infosCfa, loading, error }) => {
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
          Erreur lors de la récupération des informations de l&apos;organisme de formation
        </Box>
      </Text>
    );
  }

  if (infosCfa) {
    content = (
      <>
        <Text color="white" fontSize="omega">
          UAI&nbsp;:&nbsp;{infosCfa.uai} - SIRET&nbsp;:&nbsp;{infosCfa.siret}
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
          {infosCfa.domainesMetiers.map((item, i) => (
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

InfoCfaSection.propTypes = {
  infosCfa: PropTypes.shape({
    siret: PropTypes.string.isRequired,
    libelleLong: PropTypes.string.isRequired,
    reseaux: PropTypes.arrayOf(PropTypes.string).isRequired,
    domainesMetiers: PropTypes.arrayOf(PropTypes.string).isRequired,
    uai: PropTypes.string.isRequired,
    adresse: PropTypes.string.isRequired,
  }),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default withInfoCfaData(InfoCfaSection);

import { Badge, Box, HStack, Skeleton, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../../common/components";
import useFetchInfoFormation from "../../../../common/hooks/useFetchInfoFormation";

const InfosFormationSection = ({ infosFormation }) => {
  const { data: formation, loading, error } = useFetchInfoFormation(infosFormation);

  if (loading) {
    return (
      <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
        <Skeleton height="2rem" width="600px" />
      </Section>
    );
  }

  if (error) {
    return (
      <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
        <Text fontSize="epsilon">
          <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
          <Box as="span" verticalAlign="middle">
            Erreur lors de la récupération des informations de la formation
          </Box>
        </Text>
      </Section>
    );
  }

  if (formation) {
    return (
      <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
        <HStack fontSize="epsilon" textColor="grey.800" spacing="2w">
          <Text marginBottom="2px">CFD :</Text>
          <Badge fontSize="epsilon" textColor="grey.800" paddingX="1v" paddingY="2px" backgroundColor="#ECEAE3">
            {formation.cfd}
          </Badge>
        </HStack>
      </Section>
    );
  }

  return null;
};

InfosFormationSection.propTypes = {
  infosFormation: PropTypes.shape({
    cfd: PropTypes.string.isRequired,
  }),
};

export default InfosFormationSection;

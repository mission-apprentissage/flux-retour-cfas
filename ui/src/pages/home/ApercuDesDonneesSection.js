import { Box, Divider, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Badge, Section } from "../../common/components";
import { ERP_STATE_COLOR, ERPS } from "../../common/constants/erps";

const Count = ({ count, label }) => {
  return (
    <article>
      <Text as="strong" fontSize="beta">
        {count}
      </Text>
      <Text fontSize="gamma">{label}</Text>
    </article>
  );
};

Count.propTypes = {
  count: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

const ApercuDesDonneesSection = () => {
  return (
    <Section background="galt" paddingY="4w">
      <Heading as="h2">Aperçu des données</Heading>
      <HStack marginTop="3w" spacing="8w" fontSize="gamma" color="grey.800">
        <Count count="228 062" label="Apprentis" />
        <Count count="10 027" label="Jeunes sans contrat" />
        <Count count="5 856" label="Rupturants" />
        <Count count="10 238" label="Abandons" />
        <Count count="1 834" label="Organismes de formation" />
      </HStack>

      <Divider marginY="3w" />

      <Text fontWeight="700" color="grey.800" fontSize="gamma">
        Aujourd&apos;hui, le tableau de bord est interfaçable avec :
      </Text>
      <Flex justifyContent="space-between">
        <HStack spacing="3w" paddingY="3v">
          {ERPS.map(({ name, state }) => {
            return (
              <Flex key={name} fontSize="epsilon" color="grey.800" alignItems="center">
                <Box
                  background={ERP_STATE_COLOR[state]}
                  height="12px"
                  width="12px"
                  borderRadius="50%"
                  marginRight="1w"
                />
                <strong>{name}</strong>
              </Flex>
            );
          })}
        </HStack>
        <HStack spacing="2w">
          <Badge backgroundColor={ERP_STATE_COLOR.ready}>opérationnel</Badge>
          <Badge backgroundColor={ERP_STATE_COLOR.ongoing}>en cours</Badge>
          <Badge backgroundColor={ERP_STATE_COLOR.coming}>à venir</Badge>
        </HStack>
      </Flex>
    </Section>
  );
};

export default ApercuDesDonneesSection;

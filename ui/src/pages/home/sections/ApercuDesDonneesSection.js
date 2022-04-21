import { Box, Divider, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../common/components";
import { ERPS } from "../../../common/constants/erps";
import { Checkbox } from "../../../theme/components/icons";

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
      <Box>
        <Heading as="h2">Aperçu des données</Heading>
        <Text fontStyle="italic" color="grey.800">
          Au national le 12 décembre 2021
        </Text>
        <HStack marginTop="3w" spacing="10w" fontSize="gamma" color="grey.800">
          <Count count="2 039" label="Organisme de formation" />
          <Count count="270 314" label="Apprentis" />
          <Count count="10 250" label="Jeunes sans contrat" />
          <Count count="7 183" label="Rupturants" />
          <Count count="17 177" label="Abandons" />
        </HStack>

        <Divider marginY="3w" />

        <Text fontWeight="700" color="grey.800" fontSize="gamma">
          Aujourd&apos;hui, le tableau de bord est interfaçable avec :
        </Text>
        <HStack spacing="1w" paddingY="3v">
          {ERPS.map(({ name, state }) => {
            return (
              <Box key={name}>
                {state != "coming" && (
                  <Box fontSize="epsilon" color="grey.800" alignItems="center">
                    <Checkbox color="#03053D" />
                    <Text marginLeft="1w" as="span">
                      <strong>
                        {name}
                        {state === "ongoing" && <Text as="span"> (en cours)</Text>}
                      </strong>
                    </Text>
                  </Box>
                )}
              </Box>
            );
          })}
          <Flex>
            <Text color="grey.600" fontWeight={700}>
              À venir :
            </Text>
            {ERPS.map(({ name, state }) => {
              return (
                <Box key={name}>
                  {state === "coming" && (
                    <Box fontSize="epsilon" color="grey.800" marginTop="-2px" marginLeft="1w">
                      <Checkbox
                        marginLeft="1v"
                        color="white"
                        bg="white"
                        border="2px solid"
                        borderColor="#03053D"
                        borderRadius="20px"
                      />
                      <Text as="span" marginLeft="1w">
                        <strong>{name}</strong>
                      </Text>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Flex>
        </HStack>
      </Box>
    </Section>
  );
};

export default ApercuDesDonneesSection;

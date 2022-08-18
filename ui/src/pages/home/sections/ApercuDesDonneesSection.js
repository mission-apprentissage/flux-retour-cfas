import { Box, Divider, Flex, Heading, HStack, Spinner, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../common/components";
import { ERPS } from "../../../common/constants/erps";
import useFetchEffectifsNational from "../../../common/hooks/useFetchEffectifsNational";
import { formatDateDayMonthYear } from "../../../common/utils/dateUtils";
import { Checkbox } from "../../../theme/components/icons";

const Count = ({ count, label }) => {
  return (
    <article>
      <Text as="strong" fontSize="beta">
        {count.toLocaleString()}
      </Text>
      <Text fontSize="gamma">{label}</Text>
    </article>
  );
};

Count.propTypes = {
  count: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
};

const ApercuDesDonneesSection = () => {
  const { data: effectifsNational, loading: isEffectifsNationalLoading } = useFetchEffectifsNational();
  if (isEffectifsNationalLoading) return <Spinner />;
  const { date, totalOrganismes, apprentis, inscritsSansContrat, rupturants, abandons } = effectifsNational;
  return (
    <Section background="galt" paddingY="4w">
      <Box>
        <Heading as="h2">Aperçu des données</Heading>
        <Text fontStyle="italic" color="grey.800">
          Au national le {formatDateDayMonthYear(date)}. <br />
          Ces chiffres ne reflètent pas la réalité des effectifs de l’apprentissage. <br />
          En période estivale les organismes de formation constituent les effectifs pour la rentrée suivante.
        </Text>
        <HStack marginTop="3w" spacing="10w" fontSize="gamma" color="grey.800">
          <Count count={totalOrganismes} label="Organismes de formation" />
          <Count count={apprentis} label="Apprentis" />
          <Count count={inscritsSansContrat} label="Jeunes sans contrat" />
          <Count count={rupturants} label="Rupturants" />
          <Count count={abandons} label="Abandons" />
        </HStack>

        <Divider marginY="3w" />

        <Text fontWeight="700" color="grey.800" fontSize="gamma">
          Aujourd&apos;hui, le tableau de bord est interfaçable avec :
        </Text>
        <HStack marginTop="3v">
          {ERPS.filter((erp) => erp.state !== "coming").map(({ name, state }) => {
            return (
              <Box key={name}>
                <Box fontSize="epsilon" color="grey.800" alignItems="center">
                  <Checkbox color="#03053D" />
                  <Text marginLeft="1w" as="span">
                    <strong>
                      {name}
                      {state === "ongoing" && <Text as="span"> (en cours)</Text>}
                    </strong>
                  </Text>
                </Box>
              </Box>
            );
          })}
        </HStack>
        <Flex marginTop="3v">
          <Text color="grey.600" fontWeight={700}>
            À venir :
          </Text>
          <HStack spacing="1w" marginLeft="2w">
            {ERPS.filter((erp) => erp.state === "coming").map(({ name }) => {
              return (
                <Box key={name}>
                  <Box fontSize="epsilon" color="grey.800" marginTop="-2px">
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
                </Box>
              );
            })}
          </HStack>
        </Flex>
      </Box>
    </Section>
  );
};

export default ApercuDesDonneesSection;

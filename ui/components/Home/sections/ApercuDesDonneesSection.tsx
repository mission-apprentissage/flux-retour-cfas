import { Box, Container, Divider, Flex, Heading, HStack, Skeleton, Text } from "@chakra-ui/react";
import { startOfHour } from "date-fns";
import PropTypes from "prop-types";
import React from "react";

import { ERPS } from "@/common/constants/erps";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import useFetchIndicateursNational from "@/hooks/useFetchIndicateursNational";
import { Checkbox } from "@/theme/components/icons";

const Count = ({ count = 0, label }) => {
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
  const date = startOfHour(new Date());
  const { data: effectifsNational, loading: isEffectifsNationalLoading, error } = useFetchIndicateursNational(date);

  return (
    <Box w="100%" pt={[4, 8]} px={[1, 1, 6, 8]} background="galt" paddingY="4w">
      <Container maxW="xl">
        <Box>
          <Heading as="h2">Aperçu des données</Heading>
          <Text fontStyle="italic" color="grey.800">
            Au national le {formatDateDayMonthYear(date)}. <br />
            Ces chiffres reflètent partiellement les effectifs de l’apprentissage : une partie des organismes de
            formation ne transmettent pas encore leurs données au tableau de bord.
          </Text>

          {isEffectifsNationalLoading && (
            <Skeleton marginTop="3w" width="100%" height="4rem" startColor="grey.300" endColor="galt" />
          )}
          {effectifsNational && (
            <HStack
              marginTop="3w"
              fontSize="gamma"
              color="grey.800"
              alignItems={["normal", "normal", "normal", "center"]}
              spacing={["0", "0", "5w"]}
              flexDirection={["column", "column", "row"]}
            >
              <Count count={effectifsNational.totalOrganismes} label="Organismes de formation" />
              <Count count={effectifsNational.apprentis} label="Apprentis" />
              <Count count={effectifsNational.inscritsSansContrat} label="Jeunes sans contrat" />
              <Count count={effectifsNational.rupturants} label="Rupturants" />
              <Count count={effectifsNational.abandons} label="Abandons" />
            </HStack>
          )}
          {error && (
            <Text color="error" marginTop="3w">
              Impossible de charger les effectifs au national
            </Text>
          )}

          <Divider marginY="3w" />

          <Text fontWeight="700" color="grey.800" fontSize="gamma">
            Aujourd&apos;hui, le tableau de bord est interfaçable avec :
          </Text>
          <HStack
            marginTop="3v"
            spacing={["0", "0", "1w"]}
            flexDirection={["column", "column", "row"]}
            alignItems={["normal", "normal", "center"]}
          >
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
            <HStack
              marginLeft="2w"
              spacing={["0", "0", "1w"]}
              flexDirection={["column", "column", "row"]}
              alignItems={["normal", "normal", "center"]}
            >
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
      </Container>
    </Box>
  );
};

export default ApercuDesDonneesSection;

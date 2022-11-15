import { Box, Divider, Flex, Heading, HStack, Skeleton, Text } from "@chakra-ui/react";
import { startOfHour } from "date-fns";
import PropTypes from "prop-types";
import React from "react";

import { ERPS } from "../../../../common/constants/erps";
import useFetchEffectifsNational from "../../../../common/hooks/useFetchEffectifsNational";
import { formatDateDayMonthYear } from "../../../../common/utils/dateUtils";
import { Checkbox, CheckBoxWhite } from "../../../../theme/components/icons";

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

const ApercuDesDonneesHomePage = () => {
  const date = startOfHour(new Date());
  const { data: effectifsNational, loading: isEffectifsNationalLoading, error } = useFetchEffectifsNational(date);

  return (
    <Box paddingY="2w">
      <Heading as="h2">Aperçu des données</Heading>
      <Text fontStyle="italic" color="grey.800">
        Au national le {formatDateDayMonthYear(date)}. <br />
        Ces chiffres ne reflètent pas la réalité des effectifs de l’apprentissage. <br />
        En période estivale les organismes de formation constituent les effectifs pour la rentrée suivante.
      </Text>

      {isEffectifsNationalLoading && (
        <Skeleton marginTop="3w" width="100%" height="4rem" startColor="grey.300" endColor="galt" />
      )}
      {effectifsNational && (
        <HStack marginTop="3w" spacing="10w" fontSize="gamma" color="grey.800">
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

      <Flex flexDirection="row" spacing="3w">
        <Flex flexDirection="column">
          <HStack marginTop="3v">
            {ERPS.filter((erp) => erp.state !== "coming").map(({ name, state }) => {
              return (
                <Box key={name}>
                  <Box alignItems="center" background="#E3E3FD" borderRadius="24px" paddingX="2w" paddingY="1w">
                    <Checkbox marginBottom="5px" />
                    <Text marginLeft="1v" as="span">
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
          <Text fontSize="18px" marginTop="2w">
            Outils de gestion bientôt connectés :
          </Text>
          <HStack spacing="1w" marginTop="1w">
            {ERPS.filter((erp) => erp.state === "coming").map(({ name }) => {
              return (
                <Box key={name}>
                  <Box color="#666666" background="#E5E5E5" borderRadius="24px" paddingX="2w" paddingY="1w">
                    <CheckBoxWhite marginBottom="5px" />
                    <Text marginLeft="1v" as="span">
                      <strong>{name}</strong>
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </HStack>
        </Flex>
        <Box flex="1" marginLeft="8w">
          <Box borderLeft="4px solid" borderColor="#6A6AF4">
            <Text color="#666666" marginLeft="4w">
              <strong>Partage Simplifié</strong>
              <br />
              pour les organismes de formation n’utilisant pas d’outil de gestion, une fonctionnalité de partage de vos
              données sera bientôt accessible sur le tableau de bord
            </Text>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default ApercuDesDonneesHomePage;

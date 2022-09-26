import { Box, Divider, Flex, Heading, HStack, Link, Text } from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";

import { Section } from "../../../common/components";
import { ERPS } from "../../../common/constants/erps";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import { Checkbox, CheckBoxWhite } from "../../../theme/components/icons";

const VosDonneesNourrissentLeTableauDeBord = () => {
  return (
    <Section paddingY="4w" color="grey.800">
      <Heading as="h2" fontSize="28px">
        Vos données nourrissent le Tableau de bord
      </Heading>
      <Flex flexDirection="row" marginTop="4w" spacing="3w">
        <Flex flexDirection="column">
          <Text color="grey.800" marginTop="4w">
            Si vous utilisez l&apos;un de ces logiciels, effectuez le paramétrage pour transmettre
            <br /> automatiquement vos effectifs et donner de la visibilité aux pouvoirs publics :
          </Text>
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
              La plateforme Partage Simplifié vous permettra bientôt de transmettre vos effectifs sans logiciel
              supplémentaire. Actuellement en développement, elle sera disponible fin Septembre.
            </Text>
          </Box>
        </Box>
      </Flex>
      <Divider marginTop="4w" />
      <HStack marginTop="2w" spacing="10w">
        <Box>
          <Text marginBottom="2w">Vous utilisez un autre outil ?</Text>
          <Link
            as={NavLink}
            to={NAVIGATION_PAGES.DonneesPersonnelles.path}
            color="bluefrance"
            borderBottom="1px solid"
            variant="underline"
          >
            <Box as="i" className="ri-arrow-right-line" marginRight="1w" />
            Laissez-vous guider
          </Link>
        </Box>
        <Box>
          <Text marginBottom="2w">Vous souhaitez plus d’informations ?</Text>
          <Link
            as={NavLink}
            to={NAVIGATION_PAGES.QuestionsReponses.path}
            color="bluefrance"
            borderBottom="1px solid"
            variant="underline"
          >
            <Box as="i" className="ri-arrow-right-line" marginRight="1w" />
            Consultez la page d’aide
          </Link>
        </Box>
      </HStack>
    </Section>
  );
};

export default VosDonneesNourrissentLeTableauDeBord;

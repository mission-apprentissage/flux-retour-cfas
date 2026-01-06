import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Heading, Text, Link as ChakraLink, VStack, Icon, HStack, Flex } from "@chakra-ui/react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { InfoCircle } from "@/theme/components/icons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEnqueteSIFADeMonOrganisme = () => {
  return (
    <SimplePage title="Mon enquête SIFA">
      <Flex direction="column" align="center" py={8}>
        <Box bg="#f5f5fe" p={{ base: 6, md: 10 }} maxW="815px" w="100%" textAlign="center" borderRadius="md">
          <VStack spacing={6}>
            <Icon as={InfoCircle} boxSize={10} color="bluefrance" />

            <Heading as="h1" size="lg" color="#161616" fontWeight="bold">
              Arrêt du module
              <br />
              &quot;Mon enquête SIFA&quot;
            </Heading>

            <VStack spacing={4} maxW="700px">
              <Text color="#3a3a3a" lineHeight="1.6">
                Afin de se recentrer sur de nouvelles fonctionnalités de repérage et accompagnement des apprentis en
                rupture, destinées aux CFA et aux Missions Locales, le Tableau de bord de l&apos;apprentissage arrête
                son module &quot;Mon enquête SIFA&quot;.
              </Text>

              <Text color="#3a3a3a" lineHeight="1.6">
                Toutefois, l&apos;enquête SIFA reste obligatoire pour tous les CFA-OFA en janvier 2026.
              </Text>
            </VStack>

            <Box borderTop="1px solid #dddddd" pt={6} w="100%" mt={2}>
              <Text fontWeight="bold" color="#161616" mb={4}>
                Pour plus d&apos;informations
              </Text>

              <VStack spacing={3}>
                <ChakraLink
                  href="https://aide.cfas.apprentissage.beta.gouv.fr/fr/article/arret-du-module-mon-enquete-sifa-jc1y7j/"
                  isExternal
                  color="bluefrance"
                  fontWeight="medium"
                >
                  <HStack>
                    <Text>Consultez l&apos;article explicatif</Text>
                    <ExternalLinkIcon />
                  </HStack>
                </ChakraLink>

                <ChakraLink href="https://sifa.depp.education.fr" isExternal color="bluefrance" fontWeight="medium">
                  <HStack>
                    <Text>Accéder à la plateforme officielle SIFA</Text>
                    <ExternalLinkIcon />
                  </HStack>
                </ChakraLink>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Flex>
    </SimplePage>
  );
};

export default withAuth(PageEnqueteSIFADeMonOrganisme, ["ORGANISME_FORMATION"]);

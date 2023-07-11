import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Badge, Box, Button, Container, Divider, Flex, HStack, Heading, Text, Tooltip, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";

import { ERPS_BY_ID } from "@/common/constants/erps";
import { TETE_DE_RESEAUX_BY_ID } from "@/common/constants/networks";
import { _get } from "@/common/httpClient";
import { formatSiretSplitted } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import { Checkbox } from "@/theme/components/icons";
import { CloseCircle } from "@/theme/components/icons/CloseCircle";
import { DashboardWelcome } from "@/theme/components/icons/DashboardWelcome";

import { IndicateursEffectifs } from "../models/indicateurs";

import IndicateursGrid from "./IndicateursGrid";
import { natureOrganismeDeFormationLabel, natureOrganismeDeFormationTooltip } from "./OrganismeInfo";

const DashboardOrganisme = () => {
  const router = useRouter();
  const { auth } = useAuth();
  const { organisme } = useOrganisationOrganisme();

  const { data: indicateurs, isLoading: indicateursLoading } = useQuery<IndicateursEffectifs>(
    ["organismes", organisme?._id, "indicateurs"],
    () =>
      _get(`/api/v1/organismes/${organisme!._id}/indicateurs`, {
        params: {
          date: new Date(),
        },
      }),
    {
      enabled: !!organisme?._id,
    }
  );

  if (!organisme) {
    return <></>;
  }

  // FIXME valider condition
  const aucunEffectifTransmis = !(organisme.first_transmission_date || organisme.mode_de_transmission);

  return (
    <Box>
      <Box
        borderTop="solid 1px"
        borderTopColor="grey.300"
        borderBottom="solid 1px"
        borderBottomColor="grey.300"
        backgroundColor="galt"
        py="4"
        px="8"
      >
        <Container maxW="xl" p="8">
          <Heading textStyle="h2" color="grey.800" size="md">
            <DashboardWelcome mr="2" />
            Bienvenue sur votre tableau de bord, {auth.civility} {auth.prenom} {auth.nom}
          </Heading>

          <Text color="bluefrance" fontWeight={700} mt="4" textTransform="uppercase">
            {organisme.enseigne || organisme.raison_sociale}
          </Text>

          <VStack gap={1} rowGap="1em" alignItems={"baseline"} mt="6">
            <HStack fontSize="epsilon" textColor="grey.800" spacing="2w">
              <HStack>
                <Text>Code UAI&nbsp;:</Text>
                <Badge fontSize="epsilon" textColor="grey.800" paddingX="1w" paddingY="2px" backgroundColor="#ECEAE3">
                  {organisme.uai || "UAI INCONNUE"}
                </Badge>
              </HStack>

              <HStack>
                <Text>SIRET&nbsp;:</Text>
                <Badge
                  fontSize="epsilon"
                  textColor="grey.800"
                  paddingX="1w"
                  paddingY="2px"
                  backgroundColor="#ECEAE3"
                  textTransform="none"
                >
                  {formatSiretSplitted(organisme.siret)} ({organisme.ferme ? "fermé" : "en activité"})
                </Badge>
              </HStack>

              <HStack>
                <Text>Nature&nbsp;:</Text>
                <Badge
                  fontSize="epsilon"
                  textTransform="none"
                  textColor="grey.800"
                  paddingX="1w"
                  paddingY="2px"
                  backgroundColor="#ECEAE3"
                >
                  {natureOrganismeDeFormationLabel[organisme.nature] || "Inconnue"}
                  {natureOrganismeDeFormationTooltip[organisme.nature] && (
                    <Tooltip
                      background="bluefrance"
                      color="white"
                      label={<Box padding="2w">{natureOrganismeDeFormationTooltip[organisme.nature]}</Box>}
                      aria-label={natureOrganismeDeFormationTooltip[organisme.nature]}
                    >
                      <Box
                        as="i"
                        className="ri-information-line"
                        fontSize="epsilon"
                        color="grey.500"
                        marginLeft="1w"
                        verticalAlign="middle"
                      />
                    </Tooltip>
                  )}
                </Badge>
              </HStack>

              <HStack>
                <Text>Certifié Qualiopi&nbsp;:</Text>
                <Badge
                  fontSize="epsilon"
                  textColor="grey.800"
                  paddingX="1w"
                  paddingY="2px"
                  backgroundColor="#ECEAE3"
                  textTransform="none"
                >
                  {organisme.qualiopi ? "Oui" : "Non"}

                  <Tooltip
                    background="bluefrance"
                    color="white"
                    label={
                      <Box padding="2w">
                        La donnée Certifié qualiopi provient de la Liste Publique des Organismes de Formations. Si cette
                        information est erronée, merci de leur signaler.
                      </Box>
                    }
                  >
                    <Box
                      as="i"
                      className="ri-information-line"
                      fontSize="epsilon"
                      color="grey.500"
                      marginLeft="1w"
                      verticalAlign="middle"
                    />
                  </Tooltip>
                </Badge>
              </HStack>

              {/* FIXME TODO dans quel cas afficher ce bloc ? si configuration faite ou si au moins une transmission ? */}
              {organisme.erps?.[0] ? (
                <HStack
                  paddingX="1w"
                  paddingY="2px"
                  borderRadius={6}
                  fontWeight="bold"
                  color="#22967e"
                  backgroundColor="#E5F7F4"
                >
                  <Checkbox />
                  {/* On ne traite pas le cas de multi-erp */}
                  <Text>Données transmises via {ERPS_BY_ID[organisme.erps?.[0]?.toUpperCase() ?? ""]?.name}</Text>
                </HStack>
              ) : (
                <HStack
                  paddingX="1w"
                  paddingY="2px"
                  borderRadius={6}
                  fontWeight="bold"
                  backgroundColor="#E1000F30"
                  color="#B60000"
                >
                  <CloseCircle />
                  <Text>Données non transmises</Text>
                </HStack>
              )}
            </HStack>

            {organisme.reseaux && organisme.reseaux?.length > 0 && (
              <HStack>
                <Text>
                  Cet organisme fait partie {organisme.reseaux?.length === 1 ? "du réseau" : "des réseaux"}&nbsp;:
                </Text>
                {organisme.reseaux.map((reseau) => (
                  <Badge
                    fontSize="epsilon"
                    textColor="grey.800"
                    paddingX="1w"
                    paddingY="2px"
                    backgroundColor="#ECEAE3"
                    textTransform="none"
                    key={reseau}
                  >
                    {TETE_DE_RESEAUX_BY_ID[reseau]?.nom}
                  </Badge>
                ))}
              </HStack>
            )}

            <HStack>
              <Text>Raison sociale&nbsp;:</Text>
              <Text fontWeight="bold">{organisme.raison_sociale || "Inconnue"}</Text>
            </HStack>

            <HStack>
              <Text>Sa domiciliation est&nbsp;:</Text>
              <Text fontWeight="bold">{organisme.adresse?.complete || "Inconnue"}</Text>
            </HStack>
          </VStack>
        </Container>
      </Box>

      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
          Aperçu de vos effectifs
        </Heading>

        {aucunEffectifTransmis && (
          <Ribbons variant="warning" mt="0.5rem">
            <Text color="grey.800">
              Les indicateurs sont nuls car votre établissement ne transmet pas encore ses effectifs. Veuillez cliquer
              dans l’onglet <em>Mes effectifs</em> pour démarrer l’interfaçage ERP ou transmettre manuellement vos
              effectifs.
            </Text>
          </Ribbons>
        )}

        {indicateurs && <IndicateursGrid indicateursEffectifs={indicateurs} loading={indicateursLoading} />}

        {aucunEffectifTransmis ? (
          <Button
            size="md"
            variant="secondary"
            display="block"
            ml="auto"
            onClick={() => {
              router.push(`/effectifs/televersement`);
            }}
          >
            Transmettre mes effectifs
          </Button>
        ) : (
          <Button
            size="md"
            variant="secondary"
            display="block"
            ml="auto"
            onClick={() => {
              router.push(`/indicateurs`);
            }}
          >
            Voir mes indicateurs
          </Button>
        )}

        {aucunEffectifTransmis && (
          <>
            <Divider size="md" my={8} />

            <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
              En transmettant les données de votre organisme au tableau de bord...
            </Heading>

            <Flex backgroundColor="galt" p="8" gap="6">
              <Box
                minW={12}
                h={12}
                border="1px solid #3558A2"
                borderRadius="50%"
                textAlign="center"
                color="#3558A2"
                fontSize="beta"
                fontWeight="bold"
                backgroundColor="white"
              >
                1
              </Box>
              <Box>
                <Text color="#3A3A3A">
                  Vous permettez aux acteurs publics de piloter les politiques publiques en ayant une meilleure vision
                  de la situation de l’apprentissage au national et sur les territoires.
                </Text>

                <Link
                  href="https://mission-apprentissage.notion.site/Page-d-Aide-FAQ-dbb1eddc954441eaa0ba7f5c6404bdc0"
                  target="_blank"
                  rel="noopener noreferrer"
                  borderBottom="1px"
                  color="action-high-blue-france"
                  _hover={{ textDecoration: "none" }}
                  display="inline-flex"
                  alignItems="center"
                  mt="3"
                >
                  <ArrowForwardIcon mr="2" />
                  Consultez la FAQ du tableau de bord
                </Link>
              </Box>
            </Flex>

            <Flex backgroundColor="galt" p="8" gap="6">
              <Box
                minW={12}
                h={12}
                border="1px solid #3558A2"
                borderRadius="50%"
                textAlign="center"
                color="#3558A2"
                fontSize="beta"
                fontWeight="bold"
                backgroundColor="white"
              >
                2
              </Box>
              <Box>
                <Text color="#3A3A3A">
                  Vous contribuez à l’identification des jeunes en difficulté afin qu’ils soient accompagnés au meilleur
                  moment.
                </Text>

                <Link
                  href="/protection-des-donnees"
                  borderBottom="1px"
                  color="action-high-blue-france"
                  _hover={{ textDecoration: "none" }}
                  display="inline-flex"
                  alignItems="center"
                  mt="3"
                >
                  <ArrowForwardIcon mr="2" />
                  Consultez la liste des données collectées
                </Link>
              </Box>
            </Flex>

            <Flex backgroundColor="galt" p="8" gap="6">
              <Box
                minW={12}
                h={12}
                border="1px solid #3558A2"
                borderRadius="50%"
                textAlign="center"
                color="#3558A2"
                fontSize="beta"
                fontWeight="bold"
                backgroundColor="white"
              >
                3
              </Box>
              <Box>
                <Text color="#3A3A3A">
                  Vous pouvez produire facilement des statistiques afin de répondre à des enquêtes (comme SIFA). Vos
                  données peuvent être consultées <strong>exclusivement</strong> par votre organisme et les
                  administrations publiques dans le cadre de la{" "}
                  <Link
                    href="/protection-des-donnees"
                    borderBottom="1px"
                    _hover={{ textDecoration: "none" }}
                    display="inline-flex"
                    alignItems="center"
                    mt="3"
                  >
                    politique de l’apprentissage (TODO LIEN à mettre)
                  </Link>
                  .
                </Text>
              </Box>
            </Flex>
          </>
        )}
      </Container>
    </Box>
  );
};

export default withAuth(DashboardOrganisme);

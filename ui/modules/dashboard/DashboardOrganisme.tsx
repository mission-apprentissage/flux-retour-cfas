import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Badge, Box, Button, Container, Divider, Flex, HStack, Heading, Text, Tooltip, VStack } from "@chakra-ui/react";
import { PieCustomLayerProps, ResponsivePie } from "@nivo/pie";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { ERPS_BY_ID } from "@/common/constants/erps";
import { TETE_DE_RESEAUX_BY_ID } from "@/common/constants/networks";
import { _get } from "@/common/httpClient";
import { sleep } from "@/common/utils/misc";
import { formatCivility, formatSiretSplitted } from "@/common/utils/stringUtils";
import DownloadLinkButton from "@/components/buttons/DownloadLink";
import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import { Checkbox } from "@/theme/components/icons";
import { CloseCircle } from "@/theme/components/icons/CloseCircle";
import { DashboardWelcome } from "@/theme/components/icons/DashboardWelcome";

import { IndicateursEffectifs, IndicateursOrganismes } from "../models/indicateurs";

import IndicateursGrid from "./IndicateursGrid";
import { natureOrganismeDeFormationLabel, natureOrganismeDeFormationTooltip } from "./OrganismeInfo";

interface Props {
  modePublique: boolean; // permet d'afficher plus d'informations, notamment les responsables, qualiopi
}
const DashboardOrganisme = ({ modePublique = false }: Props) => {
  const router = useRouter();
  const { auth } = useAuth();
  const { organisme } = useOrganisationOrganisme();

  const { data: indicateursEffectifs, isLoading: indicateursEffectifsLoading } = useQuery<IndicateursEffectifs>(
    ["organismes", organisme?._id, "indicateurs/effectifs"],
    () =>
      _get(`/api/v1/organismes/${organisme!._id}/indicateurs/effectifs`, {
        params: {
          date: new Date(),
        },
      }),
    {
      enabled: !!organisme?._id,
    }
  );

  const { data: indicateursOrganismes } = useQuery<IndicateursOrganismes>(
    ["organismes", organisme?._id, "indicateurs/organismes"],
    () => _get(`/api/v1/organismes/${organisme!._id}/indicateurs/organismes`),
    {
      enabled: !!organisme?._id,
    }
  );

  const indicateursOrganismesPieData = useMemo<any[]>(() => {
    if (!indicateursOrganismes) {
      return [];
    }
    return [
      {
        id: "Transmet",
        value: indicateursOrganismes.organismesTransmetteurs,
        color: "#00ac8c",
      },
      {
        id: "Ne transmet pas",
        value: indicateursOrganismes.organismesNonTransmetteurs,
        color: "#ef5800",
      },
    ];
  }, [indicateursOrganismes]);

  if (!organisme) {
    return <></>;
  }

  const aucunEffectifTransmis = !organisme.first_transmission_date;

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
            Bienvenue sur{" "}
            {modePublique
              ? "le tableau de bord de"
              : `votre tableau de bord, ${formatCivility(auth.civility)} ${auth.prenom} ${auth.nom}`}
          </Heading>

          <Text color="bluefrance" fontWeight={700} mt="4" textTransform="uppercase">
            {organisme.enseigne || organisme.raison_sociale}
          </Text>

          <VStack gap={1} rowGap="1em" alignItems={"baseline"} mt="6">
            <HStack fontSize="epsilon" textColor="grey.800" spacing="2w">
              <HStack>
                <Text>UAI&nbsp;:</Text>
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

              {modePublique && (
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
                          La donnée Certifié qualiopi provient de la Liste Publique des Organismes de Formations. Si
                          cette information est erronée, merci de leur signaler.
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
              )}

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
              <Text>Domiciliation&nbsp;:</Text>
              <Text fontWeight="bold">{organisme.adresse?.complete || "Inconnue"}</Text>
            </HStack>

            {modePublique && (
              <>
                {modePublique && (
                  <HStack>
                    <Text>Responsable identifié de l’établissement&nbsp;:</Text>
                    <Text fontWeight="bold">{"Inconnu - Compte tableau de bord non créé à ce jour"}</Text>
                  </HStack>
                )}
                {modePublique && (
                  <HStack>
                    <Text>Organisme responsable identifié&nbsp;:</Text>
                    <Text fontWeight="bold">{"TODO"}</Text>
                  </HStack>
                )}
              </>
            )}
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

        {indicateursEffectifs && (
          <IndicateursGrid indicateursEffectifs={indicateursEffectifs} loading={indicateursEffectifsLoading} />
        )}

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

        <Box bg="galt" py="8" px="12" mt="8">
          <Heading as="h3" color="#3558A2" fontSize="delta" fontWeight="700" mb={3}>
            Nombre d’organismes de formation rattachés à votre établissement
          </Heading>

          <Text fontSize="zeta">
            Taux de couverture des organismes transmetteurs / non-transmetteurs
            <Tooltip
              background="bluefrance"
              color="white"
              label={
                <Box padding="1w">
                  Ce taux traduit le nombre d’organismes dispensant une formation en apprentissage (sauf responsables)
                  qui transmettent au tableau de bord. Les organismes qui transmettent mais ne font pas partie du
                  référentiel ne rentrent pas en compte dans ce taux. Il est conseillé d’avoir un minimum de 80%
                  d’établissements transmetteurs afin de garantir la viabilité des enquêtes menées auprès de ces
                  derniers.
                </Box>
              }
              aria-label="Informations sur le taux de couverture des organismes"
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
          </Text>

          <Divider size="md" my={4} borderBottomWidth="2px" opacity="1" />

          {/* TODO OFR uniquement */}
          <Flex justifyContent="space-between">
            <VStack gap="2" justifyContent="center" alignItems="start">
              <HStack>
                <Box bg="#00ac8c" w={4} h={4} borderRadius={10} />
                <Text color="mgalt" fontSize="zeta" fontWeight="bold">
                  Transmettent les effectifs au tableau de bord
                </Text>
              </HStack>

              <HStack>
                <Box bg="#ef5800" w={4} h={4} borderRadius={10} />
                <Text color="mgalt" fontSize="zeta" fontWeight="bold">
                  Ne transmettent pas les effectifs au tableau de bord
                </Text>
              </HStack>

              <DownloadLinkButton
                action={async () => {
                  await sleep(2000);
                }}
              >
                Télécharger la liste des organismes qui ne transmettent pas
              </DownloadLinkButton>
            </VStack>

            <Box flex="1" minH="250px">
              <ResponsivePie
                margin={{ top: 32, right: 32, bottom: 32, left: 32 }}
                data={indicateursOrganismesPieData}
                innerRadius={0.6}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                enableArcLinkLabels={false}
                colors={{ datum: "data.color" }}
                enableArcLabels={false}
                layers={["arcs", CenteredMetric]}
              />
            </Box>
          </Flex>
        </Box>

        <Button
          size="md"
          variant="secondary"
          display="block"
          ml="auto"
          onClick={() => {
            router.push(`/organismes`);
          }}
        >
          Voir la liste complète
        </Button>

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
                  Consultez la liste des données collectées (TODO lien à mettre)
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
                    politique de l’apprentissage
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

function CenteredMetric({ dataWithArc, centerX, centerY }: PieCustomLayerProps<any>) {
  const total = dataWithArc.reduce((acc, datum) => acc + datum.value, 0);
  return (
    <>
      <text
        x={centerX}
        y={centerY - 10}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fill: "#3A3A3A", fontSize: "28px", fontWeight: "bold" }}
      >
        {`${total}`}
      </text>
      <text
        x={centerX}
        y={centerY + 15}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fill: "#666666", fontSize: "14px" }}
      >
        OFA
      </text>
    </>
  );
}

export default withAuth(DashboardOrganisme);

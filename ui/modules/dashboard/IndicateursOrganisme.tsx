import {
  Box,
  Center,
  Flex,
  Grid,
  GridItem,
  HStack,
  ListItem,
  Skeleton,
  Text,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { IOrganismesCount, ORGANISME_INDICATEURS_TYPE, PlausibleGoalType, TypeOrganismesIndicateurs } from "shared";

import { convertOrganismeToExport, organismesExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import { formatNumber } from "@/common/utils/stringUtils";
import DownloadButton from "@/components/buttons/DownloadButton";
import Link from "@/components/Links/Link";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { useOrganisationIndicateursOrganismes, useOrganisme } from "@/hooks/organismes";
import { usePlausibleTracking } from "@/hooks/plausible";

import { BlueBuilding, GreenCheck, RedFlashingLight } from "./icons";

interface CardProps {
  label: string;
  count: number;
  tooltipHeader?: ReactNode | string;
  tooltipLabel?: ReactNode | string;
  icon: ReactNode;
  big?: boolean;
  children?: ReactNode;
}

interface CardWithSubProps {
  label: string;
  count: number;
  tooltipHeader?: ReactNode | string;
  tooltipLabel?: ReactNode | string;
  icon: ReactNode;
  big?: boolean;
  children?: ReactNode;
  subCount: number;
  subLabel: string;
  subIcon: ReactNode;
  subTooltipHeader?: ReactNode | string;
  subTooltipLabel?: ReactNode | string;
}

function CardWithSubCard({
  label,
  count,
  tooltipHeader,
  tooltipLabel,
  icon,
  big = false,
  subCount,
  subLabel,
  subIcon,
  subTooltipHeader,
  subTooltipLabel,
}: CardWithSubProps) {
  return (
    <Center h="100%" justifyContent={big ? "center" : "start"} py="6" px="14">
      <VStack gap={3}>
        <Flex alignSelf={"start"}>
          <Box alignSelf={"center"} pt="3">
            {icon}
          </Box>
          <Text fontSize={big ? "40px" : "28px"} fontWeight="700">
            {formatNumber(count)}
          </Text>
        </Flex>
        <Box>
          <Text fontSize={"16px"} fontWeight="400" color="#3A3A3A">
            {label}
            {tooltipHeader && tooltipLabel ? (
              <InfoTooltip headerComponent={() => tooltipHeader} contentComponent={() => <Box>{tooltipLabel}</Box>} />
            ) : null}
          </Text>
        </Box>
        <Flex border="1px solid #DDDDDD" h="1px" w="100%"></Flex>
        <HStack justify={"start"} w="100%" alignItems="center" gap={3}>
          <Box alignSelf={"center"} pt="3">
            {subIcon}
          </Box>
          <Box>
            <Flex justify={"start"} alignItems={"center"} gap={2}>
              <Text fontSize={12}>dont</Text>
              <Text fontSize="28px" fontWeight="700">
                {formatNumber(subCount)}
              </Text>
            </Flex>

            <Text fontSize={"16px"} fontWeight="400" color="#3A3A3A">
              {subLabel}
              {subTooltipHeader && subTooltipLabel ? (
                <InfoTooltip
                  headerComponent={() => subTooltipHeader}
                  contentComponent={() => <Box>{subTooltipLabel}</Box>}
                />
              ) : null}
            </Text>
          </Box>
        </HStack>
      </VStack>
    </Center>
  );
}

function Card({ label, count, tooltipHeader, tooltipLabel, icon, big = false, children }: CardProps) {
  return (
    <Center h="100%" justifyContent={big ? "center" : "start"} py="6" px="10">
      <HStack gap={3}>
        <Box alignSelf="center" pt="3">
          {icon}
        </Box>
        <Box>
          <Flex justify="start" alignItems="center" gap={2}>
            <Text fontSize={12}>dont</Text>
            <Text fontSize={big ? "40px" : "28px"} fontWeight="700">
              {formatNumber(count)}
            </Text>
          </Flex>

          <Text fontSize="16px" fontWeight="400" color="#3A3A3A">
            {label}
            {tooltipHeader && tooltipLabel ? (
              <InfoTooltip headerComponent={() => tooltipHeader} contentComponent={() => <Box>{tooltipLabel}</Box>} />
            ) : null}
          </Text>
          {children}
        </Box>
      </HStack>
    </Center>
  );
}

const typeToGoalPlausible: { [key: string]: PlausibleGoalType } = {
  [ORGANISME_INDICATEURS_TYPE.SANS_EFFECTIFS]: "telechargement_liste_organismes_sans_effectifs",
  [ORGANISME_INDICATEURS_TYPE.NATURE_INCONNUE]: "telechargement_liste_organismes_nature_inconnue",
  [ORGANISME_INDICATEURS_TYPE.SIRET_FERME]: "telechargement_liste_organismes_siret_ferme",
  [ORGANISME_INDICATEURS_TYPE.UAI_NON_DETERMINE]: "telechargement_liste_organismes_uai_non_determine",
};

export const IndicateursOrganisationsOrganismes = () => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const organisationData = useOrganisationIndicateursOrganismes();

  const data = organisationData.data || {};
  const isLoading = organisationData.isLoading;
  const error = organisationData.error;

  const downloadOrganismesIndicateurs = async (type: TypeOrganismesIndicateurs) => {
    trackPlausibleEvent(typeToGoalPlausible[type]);
    const organismes = await _get(`/api/v1/organisation/organismes/indicateurs/${type}`);
    exportDataAsXlsx(
      `tdb-organismes-${type}.xlsx`,
      organismes.map((organisme) => convertOrganismeToExport(organisme)),
      organismesExportColumns
    );
  };

  return (
    <Indicateurs
      data={data}
      isLoading={isLoading}
      error={error}
      downloadOrganismesIndicateurs={downloadOrganismesIndicateurs}
    />
  );
};

export const IndicateursOrganisme = ({ organismeId }: { organismeId: string }) => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const organismeData = useOrganisme(organismeId);

  const data = (organismeData.organisme as Organisme & { organismesCount?: IOrganismesCount })?.organismesCount || {};
  const isLoading = organismeData.isLoading;
  const error = organismeData.error;

  const downloadOrganismesIndicateurs = async (type: TypeOrganismesIndicateurs) => {
    trackPlausibleEvent(typeToGoalPlausible[type]);
    const organismes = await _get(`/api/v1/organismes/${organismeId}/indicateurs/organismes/${type}`);
    exportDataAsXlsx(
      `tdb-organismes-${type}.xlsx`,
      organismes.map((organisme) => convertOrganismeToExport(organisme)),
      organismesExportColumns
    );
  };

  return (
    <Indicateurs
      data={data}
      isLoading={isLoading}
      error={error}
      downloadOrganismesIndicateurs={downloadOrganismesIndicateurs}
    />
  );
};

function Indicateurs({
  data,
  isLoading,
  error,
  downloadOrganismesIndicateurs,
}: {
  data: any;
  isLoading: boolean;
  error: any;
  downloadOrganismesIndicateurs: (type: TypeOrganismesIndicateurs) => Promise<void>;
}) {
  const getIcon = (count?: number) => {
    return count ? <RedFlashingLight /> : <GreenCheck />;
  };

  if (error) {
    return (
      <Flex justifyContent="center" alignItems="center">
        <Text fontSize="zeta" color="redfrance">
          Une erreur est survenue
        </Text>
      </Flex>
    );
  }

  if (isLoading) {
    return (
      <Grid minH="240px" templateRows="repeat(2, 1fr)" templateColumns="repeat(6, 1fr)" gap={4} my={8}>
        <GridItem colSpan={2} rowSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
      </Grid>
    );
  }

  const countSiretFerme = data?.siretFerme || 0;
  const countNatureInconnue = data?.natureInconnue || 0;
  const countSansTransmissions = data?.sansTransmissions || 0;
  const countUaiNonDetermine = data?.uaiNonDeterminee || 0;

  return (
    <Grid minH="240px" templateRows="repeat(2, 1fr)" templateColumns="repeat(6, 1fr)" gap={4} my={8}>
      <GridItem bg="galt" colSpan={2} rowSpan={2}>
        <CardWithSubCard
          label="organismes de formation en apprentissage"
          count={data?.organismes ?? 0}
          icon={<BlueBuilding />}
          big={true}
          subLabel="organismes fiables"
          subCount={data?.fiables ?? 0}
          subIcon={<GreenCheck />}
          subTooltipHeader="Organisme fiable"
          subTooltipLabel={
            <>
              <Text>Est considéré comme fiable un organisme (OFA) :</Text>
              <UnorderedList mt={6} mb={6}>
                <ListItem>qui correspond à un couple UAI-SIRET validé dans le Référentiel UAI-SIRET (ONISEP).</ListItem>
                <ListItem>
                  dont l’état administratif du SIRET de l&apos;établissement, tel qu&apos;il est renseigné sur l’INSEE,
                  est en activité.
                </ListItem>
              </UnorderedList>
            </>
          }
        ></CardWithSubCard>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="sans effectifs transmis (ou arrêt)"
          count={countSansTransmissions}
          icon={getIcon(countSansTransmissions)}
        >
          {countSansTransmissions > 0 && (
            <DownloadButton
              variant="link"
              p={0}
              pb={1}
              mt={2}
              action={() => {
                downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.SANS_EFFECTIFS as "sans_effectifs");
              }}
            >
              Télécharger la liste
            </DownloadButton>
          )}
        </Card>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="avec une nature “inconnue”"
          count={countNatureInconnue}
          tooltipHeader="Nature de l’organisme de formation"
          tooltipLabel={
            <Box>
              <Text as="p">
                La donnée «&nbsp;Nature&nbsp;» est déduite des relations entre les organismes (base des Carif-Oref). Le{" "}
                <Link
                  isExternal
                  href="https://catalogue-apprentissage.intercariforef.org/"
                  textDecoration="underLine"
                  display="inline"
                >
                  Catalogue des offres de formations en apprentissage
                </Link>{" "}
                identifie trois natures :
              </Text>
              <UnorderedList my={3}>
                <ListItem>Les organismes responsables</ListItem>
                <ListItem>Les organismes responsables et formateur</ListItem>
                <ListItem>Les organismes formateurs</ListItem>
              </UnorderedList>
              <Text as="p">
                Une nature “inconnue” signifie que l’organisme n’a pas déclaré (ou de manière incomplète) son offre de
                formation dans la base de son Carif-Oref : l’organisme doit référencer ses formations en apprentissage
                auprès du{" "}
                <Link
                  isExternal
                  href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                  textDecoration="underLine"
                  display="inline"
                >
                  Carif-Oref régional{" "}
                </Link>{" "}
                ou se rapprocher du{" "}
                <Link isExternal href="/pdf/Carif-Oref-contacts.pdf" textDecoration="underLine" display="inline">
                  service dédié aux formations
                </Link>
                .
              </Text>
            </Box>
          }
          icon={getIcon(countNatureInconnue)}
        >
          {countNatureInconnue > 0 && (
            <DownloadButton
              variant="link"
              p={0}
              pb={1}
              mt={2}
              action={async () => {
                downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.NATURE_INCONNUE as "nature_inconnue");
              }}
            >
              Télécharger la liste
            </DownloadButton>
          )}
        </Card>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="avec un Siret fermé"
          count={countSiretFerme}
          tooltipHeader="État du Siret de l’établissement"
          tooltipLabel={
            <>
              <Text>
                Cette information est tirée de la base INSEE. Indication de l’état administratif (en activité ou fermé)
                du Siret de l’établissement, tel qu’il est renseigné sur l’INSEE. Un établissement est affiché
                &quot;Fermé&quot; suite à une cessation d&apos;activité ou un déménagement.
              </Text>
              <Text>
                En cas de déménagement, une demande d’un nouveau Siret (via le{" "}
                <Link isExternal href="https://procedures.inpi.fr/?/" textDecoration="underLine" display="inline">
                  Guichet Unique
                </Link>
                ) doit être réalisée et ce dernier doit être communiqué aux différents acteurs publics.
              </Text>
              <Text>
                En savoir plus sur les démarches à suivre sur la{" "}
                <Link
                  isExternal
                  href="https://tableau-de-bord-preprod.apprentissage.beta.gouv.fr/referencement-organismez"
                  textDecoration="underLine"
                  display="inline"
                >
                  page de Référencement
                </Link>
                .
              </Text>
            </>
          }
          icon={getIcon(countSiretFerme)}
        >
          {countSiretFerme > 0 && (
            <DownloadButton
              variant="link"
              p={0}
              pb={1}
              mt={2}
              action={async () => {
                downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.SIRET_FERME as "siret_ferme");
              }}
            >
              Télécharger la liste
            </DownloadButton>
          )}
        </Card>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="avec une UAI “non déterminée”"
          count={countUaiNonDetermine}
          tooltipHeader="UAI non déterminée"
          tooltipLabel={
            <UnorderedList mt={6} mb={6}>
              <ListItem>
                Si l&apos;Unité Administrative Immatriculée (UAI) est répertoriée comme « Non déterminée » alors que
                l&apos;organisme en possède une, veuillez la communiquer en écrivant à{" "}
                <Link
                  href="mailto:referentiel-uai-siret@onisep.fr"
                  target="_blank"
                  textDecoration="underline"
                  isExternal
                  whiteSpace="nowrap"
                >
                  referentiel-uai-siret@onisep.fr
                </Link>{" "}
                avec la fiche UAI, afin qu&apos;elle soit mise à jour. L&apos;absence de ce numéro bloque
                l&apos;enregistrement des contrats d&apos;apprentissage. L&apos;UAI est recommandée pour être reconnu
                OFA
              </ListItem>
              <ListItem>
                Si l&apos;organisme ne possède pas encore d&apos;UAI, il doit s&apos;adresser aux services du rectorat
                de l&apos;académie où se situe le CFA. Plus d&apos;informations dans la{" "}
                <Link
                  href="https://tableau-de-bord-preprod.apprentissage.beta.gouv.fr/referencement-organisme"
                  target="_blank"
                  textDecoration="underline"
                  isExternal
                  whiteSpace="nowrap"
                >
                  page de Référencement
                </Link>
                .
              </ListItem>
            </UnorderedList>
          }
          icon={getIcon(countUaiNonDetermine)}
        >
          {countUaiNonDetermine > 0 && (
            <DownloadButton
              variant="link"
              p={0}
              pb={1}
              mt={2}
              action={async () => {
                downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.UAI_NON_DETERMINE as "uai_non_determine");
              }}
            >
              Télécharger la liste
            </DownloadButton>
          )}
        </Card>
      </GridItem>
    </Grid>
  );
}

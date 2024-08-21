import { Box, Container, Flex, Heading, ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { IOrganisationType } from "shared";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import Accordion from "@/components/Accordion/Accordion";
import DownloadLink from "@/components/Links/DownloadLink";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import TextHighlight from "@/components/Text/Highlight";
import { useOrganisationOrganisme, useOrganismesNormalizedLists } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import { ExternalLinkLine } from "@/theme/components/icons";

import IndicateursOrganisme from "../dashboard/IndicateursOrganisme";

import OrganismesTable from "./OrganismesTable";

export type OrganismeNormalized = Organisme & {
  normalizedName: string;
  normalizedUai: string;
  normalizedCommune: string;
};

interface ListeOrganismesPageProps {
  organismes: Organisme[];
  modePublique: boolean;
}

function ListeOrganismesPage(props: ListeOrganismesPageProps) {
  const { organisationType } = useAuth();
  const { organisme } = useOrganisationOrganisme();

  const title = `${props.modePublique ? "Ses" : "Mes"} organismes`;

  const { allOrganismes } = useOrganismesNormalizedLists(props.organismes);

  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          {props.modePublique ? "Ses organismes" : getHeaderTitleFromOrganisationType(organisationType)}
        </Heading>

        <Text>
          Retrouvez ci-dessous les {allOrganismes.length} établissements sous votre gestion et la nature de chacun.
        </Text>

        <Text fontStyle="italic" mb={8}>
          Sources :{" "}
          <Link href="https://catalogue-apprentissage.intercariforef.org/" isExternal color="action-high-blue-france">
            Catalogue
            <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} mr={1} />
          </Link>{" "}
          et{" "}
          <Link href="https://referentiel.apprentissage.onisep.fr/" isExternal color="action-high-blue-france" ml={1}>
            Référentiel de l’apprentissage
            <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
          </Link>
        </Text>
        <Text>Cliquez sur un organisme pour voir en détails les formations dont vous avez la gestion.</Text>
        <Text>Si des informations vous semblent erronées, veuillez suivre les démarches ci-dessous.</Text>

        <IndicateursOrganisme
          organismeId={organisme?._id}
          organismesCount={organisme?.organismesCount}
          loading={false} // TODO add loader
        ></IndicateursOrganisme>
        {/* Si pas d&apos;organismes non fiables alors on affiche pas les onglets et juste une seule liste */}
        <Stack spacing="4w">
          <OrganismesTable
            organismes={allOrganismes || []}
            showFilterNature
            showFilterTransmission
            showFilterQualiopi
            showFilterPrepaApprentissage
            showFilterLocalisation
            withFormations={true}
          />
        </Stack>
        <Flex gap={12}>
          <Box flex="3">
            <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mt={16} mb={6}>
              Des anomalies ? Voici les démarches à suivre.
            </Heading>
            <Flex>
              <Box flex="2">
                <Text>
                  Certains organismes de la liste ci-dessus peuvent présenter une ou plusieurs anomalies à corriger.
                </Text>
              </Box>
              <Box flex="1"></Box>
            </Flex>
            <Accordion defaultIndex={0} useCustomIcons={true}>
              <Accordion.Item title='Si des établissements ont une UAI "non déterminée", que cela signifie-t-il et que faire ?'>
                <Text>
                  Si l&apos;UAI est répertoriée comme &quot;Non déterminée&quot; alors que l&apos;organisme en possède
                  une, il doit la communiquer en écrivant à{" "}
                  <Link
                    href={`mailto:referentiel-uai-siret@onisep.fr`}
                    target="_blank"
                    textDecoration="underline"
                    isExternal
                    whiteSpace="nowrap"
                  >
                    referentiel-uai-siret@onisep.fr
                  </Link>{" "}
                  avec la fiche descriptive UAI, pour mise à jour. L&apos;absence de ce numéro bloque
                  l&apos;enregistrement des contrats d&apos;apprentissage. La mise à jour sur le Référentiel entraîne
                  automatiquement la mise à jour sur le Tableau de bord.
                </Text>
                <TextHighlight>
                  L&apos;UAI (Unité Administrative Immatriculée) est un code attribué par le Ministère de
                  l&apos;éducation nationale, dans le répertoire académique et ministériel sur les établissements du
                  système éducatif (RAMSESE) aux établissements du système éducatif (écoles, collèges, lycées, CFA,
                  établissements d&apos;enseignement supérieur, public ou privé). Il est utilisé pour les identifier
                  dans différentes bases de données et systèmes administratifs. L&apos;UAI s&apos;obtient auprès des
                  services du rectorat de l&apos;académie où se situe le CFA.
                </TextHighlight>
                <Text>
                  En cas de questions, contactez le service RAMSESE de votre Rectorat en leur communiquant les
                  informations nécessaires à l&apos;expertise de votre problématique (raison sociale, Siret, UAI, etc.).
                </Text>
                <DownloadLink href="/pdf/Contact-Rectorat-UAI-RAMSESE.pdf" fileType="PDF" fileSize="81 Ko" isExternal>
                  Liste des contacts des services académiques
                </DownloadLink>
              </Accordion.Item>

              <Accordion.Item title='Des établissements ont une nature "inconnue". Que cela signifie-t-il et que faire ?'>
                <Text>
                  Si un organisme a pour nature &quot;Inconnue&quot;, cela signifie que l&apos;offre de formation en
                  apprentissage n&apos;est pas correctement ou mal référencée par le Carif-Oref. L&apos;organisme doit
                  s&apos;adresser auprès de son{" "}
                  <Link
                    href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                    target="_blank"
                    textDecoration="underline"
                    isExternal
                    whiteSpace="nowrap"
                  >
                    Carif-Oref régional
                  </Link>{" "}
                  pour référencer ses offres et obtenir un ID formation, que l&apos;on retrouve notamment dans le
                  <Link
                    href="https://catalogue-apprentissage.intercariforef.org/recherche/etablissements"
                    target="_blank"
                    textDecoration="underline"
                    isExternal
                    whiteSpace="nowrap"
                  >
                    Catalogue des formations en apprentissage
                  </Link>
                  . Veuillez noter que la modification de la nature d&apos;un organisme impacte ses relations avec les
                  autres organismes.
                </Text>
                <Text mt={2}>
                  En cas de questions, contactez votre Carif-Oref régional ou connectez-vous sur sa plateforme.
                </Text>
                <DownloadLink
                  href="https://drive.google.com/file/d/1xjshlQqxl3UKhoU7xrEhziCUqVsPAxCU/view?usp=drive_link"
                  fileType="PDF"
                  fileSize="417 Ko"
                  isExternal
                >
                  Liste de contacts Carif-Oref
                </DownloadLink>
              </Accordion.Item>

              <Accordion.Item title='Des établissements ont un Siret "fermé". Que cela signifie-t-il et que faire ?'>
                <Text>
                  Cette information est tirée de la base INSEE. Un établissement est affiché &quot;Fermé&quot; suite à
                  une cessation d&apos;activité ou un déménagement. Si un changement d&apos;adresse a été déclaré (via
                  <Link
                    href="https://procedures.inpi.fr/?/"
                    target="_blank"
                    textDecoration="underline"
                    isExternal
                    whiteSpace="nowrap"
                  >
                    Guichet unique des entreprises
                  </Link>
                  ), un nouveau Siret a été délivré par l&apos;INSEE. L&apos;ancien Siret est alors fermé.
                </Text>
                <Text mt={2}>
                  Pour garantir la mise à jour correcte des informations administratives et légales, il faut signaler le
                  nouveau Siret à :
                </Text>
                <UnorderedList pl={2}>
                  <ListItem>au Carif-Oref régional,</ListItem>
                  <ListItem>
                    à la DREETS (Direction Régionale de l&apos;Économie, de l&apos;Emploi, du Travail et des
                    Solidarités),
                  </ListItem>
                  <ListItem>
                    au Rectorat de votre Académie (voir les contacts dans l&apos;onglet dédié à l&apos;UAI),
                  </ListItem>
                  <ListItem>à l&apos;OPCO (Opérateur de Compétences) concerné(s),</ListItem>
                  <ListItem>
                    au contact national ou régional, si le CFA appartient à un réseau (ex : Chambre de Commerce et
                    d&apos;Industrie (CCI), Chambre de Métiers et de l&apos;Artisanat (CMA), MFR, etc...),
                  </ListItem>
                  <ListItem>
                    et le mettre à jour sur{" "}
                    <Link
                      href="https://info.monactiviteformation.emploi.gouv.fr/"
                      target="_blank"
                      textDecoration="underline"
                      isExternal
                      whiteSpace="nowrap"
                    >
                      Mon Activité Formation
                    </Link>
                    .
                  </ListItem>
                </UnorderedList>
              </Accordion.Item>

              <Accordion.Item title="Si des organismes de la liste ne doivent pas apparaître ou certains sont manquants ou si des erreurs apparaissent sur les formations, que faire ?">
                <Text>
                  Si des relations entre organismes ne devraient pas avoir lieu ou sont manquantes, vous devez vous
                  rapprocher de votre Carif-Oref régional afin de modifier les informations collectées (par ex :
                  suppression du formateur rattaché au responsable). Connectez-vous sur la plateforme dédiée propre à
                  chaque Carif-Oref.
                </Text>
                <Text mt={2}>
                  Concernant les formations, chaque offre de chaque établissement devrait figurer dans le catalogue. Si
                  ce n&apos;est pas le cas, merci de signaler la situation par mail :
                  <Link
                    href={`mailto:pole-apprentissage@intercariforef.org`}
                    target="_blank"
                    textDecoration="underline"
                    isExternal
                    whiteSpace="nowrap"
                  >
                    pole-apprentissage@intercariforef.org
                  </Link>{" "}
                  avec les informations suivantes :
                </Text>
                <UnorderedList pl={2}>
                  <ListItem>SIRET ;</ListItem>
                  <ListItem>RNCP et/ou le code diplôme ;</ListItem>
                  <ListItem>
                    la période d&apos;inscription telle que mentionnée dans le catalogue Carif-Oref (exprimée en
                    AAAA-MM) ;
                  </ListItem>
                  <ListItem>le lieu de la formation (code commune INSEE ou à défaut code postal) ;</ListItem>
                  <ListItem>mail de la personne signalant l&apos;erreur.</ListItem>
                </UnorderedList>
                <Text mt={2}>
                  Une investigation sera menée par le Réseau des Carif-Oref pour le traitement de cette anomalie. Il
                  reviendra vers vous dès la résolution de ce dysfonctionnement via le mail que vous avez indiqué.
                </Text>
                <DownloadLink
                  href="https://drive.google.com/file/d/1xjshlQqxl3UKhoU7xrEhziCUqVsPAxCU/view?usp=drive_link"
                  fileType="PDF"
                  fileSize="417 Ko"
                  isExternal
                >
                  Liste de contacts Carif-Oref
                </DownloadLink>
              </Accordion.Item>

              <Accordion.Item title="Comment déclarer un organisme afin qu'il apparaisse dans la liste ci-dessus ?">
                <Text>
                  Si un organisme, dont la gestion de ses formations est confiée à votre CFA, n&apos;apparaît pas dans
                  la liste, veuillez vous rapprocher de votre Carif-Oref afin de déclarer ou modifier la collecte. Cela
                  doit se faire en concertation avec l&apos;organisme concerné.
                </Text>
                <DownloadLink
                  href="https://drive.google.com/file/d/1xjshlQqxl3UKhoU7xrEhziCUqVsPAxCU/view?usp=drive_link"
                  fileType="PDF"
                  fileSize="417 Ko"
                  isExternal
                >
                  Liste de contacts Carif-Oref
                </DownloadLink>
              </Accordion.Item>
            </Accordion>
          </Box>
          <Box flex="1"></Box>
        </Flex>
      </Container>
    </SimplePage>
  );
}

export default ListeOrganismesPage;

function getHeaderTitleFromOrganisationType(type: IOrganisationType) {
  switch (type) {
    case "ORGANISME_FORMATION":
      return "Mes organismes";

    case "TETE_DE_RESEAU":
      return "Les organismes de mon réseau";

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DRAFPIC":
    case "DDETS":
    case "ACADEMIE":
      return "Les organismes de mon territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return "Tous les organismes";

    default:
      throw new Error(`Type ’${type}’ inconnu`);
  }
}

// function getTextContextFromOrganisationType(type: IOrganisationType) {
//   switch (type) {
//     case "ORGANISME_FORMATION":
//       return "rattachés à votre organisme";

//     case "TETE_DE_RESEAU":
//       return "de votre réseau";

//     case "DREETS":
//     case "DRAAF":
//     case "CONSEIL_REGIONAL":
//     case "CARIF_OREF_REGIONAL":
//     case "DRAFPIC":
//     case "DDETS":
//     case "ACADEMIE":
//       return "de votre territoire";

//     case "OPERATEUR_PUBLIC_NATIONAL":
//     case "CARIF_OREF_NATIONAL":
//     case "ADMINISTRATEUR":
//       return "de l&apos;ensemble du territoire";

//     default:
//       throw new Error(`Type ’${type}’ inconnu`);
//   }
// }

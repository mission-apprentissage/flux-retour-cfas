import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Image,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { CRISP_FAQ, IOrganisationType, SUPPORT_PAGE_ACCUEIL } from "shared";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import Accordion from "@/components/Accordion/Accordion";
import InformationMessage from "@/components/InformationMessage/InformationMessage";
import DownloadLink from "@/components/Links/DownloadLink";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import TextHighlight from "@/components/Text/Highlight";
import { useOrganismesFiltered, useOrganismesNormalizedLists } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import { BonusAvatar } from "@/theme/components/icons";

import { IndicateursOrganisme, IndicateursOrganisationsOrganismes } from "../dashboard/IndicateursOrganisme";

import OrganismesTable from "./OrganismesTable";

export type OrganismeNormalized = Organisme & {
  normalizedName: string;
  normalizedUai: string;
  normalizedCommune: string;
};

interface ListeOrganismesPageProps {
  organismes: Organisme[];
  modePublique?: boolean;
  organismeId?: string;
}

function ListeOrganismesPage(props: ListeOrganismesPageProps) {
  const { organisationType } = useAuth();
  const organismesNormalized = useOrganismesNormalizedLists(props.organismes);
  const { organismesFiltered } = useOrganismesFiltered(organismesNormalized.allOrganismes);

  const title = `${props.modePublique ? "Ses" : "Mes"} organismes`;

  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          {props.modePublique ? "Ses organismes" : getHeaderTitleFromOrganisationType(organisationType)}
        </Heading>
        <Text>
          Retrouvez ci-dessous les <b>{organismesNormalized.allOrganismes.length}</b> établissements{" "}
          {organisationType === "ORGANISME_FORMATION" ? (
            <>sous votre gestion et la nature de chacun.</>
          ) : organisationType === "TETE_DE_RESEAU" ? (
            <>de votre réseau, ainsi que le nombre de formations dispensées par chacun.</>
          ) : (
            <>de votre territoire.</>
          )}
        </Text>
        <Text fontStyle="italic" mb={8}>
          Sources :{" "}
          <Link
            href="https://catalogue-apprentissage.intercariforef.org/"
            isExternal
            isUnderlined
            color="action-high-blue-france"
          >
            Catalogue des offres de formations en apprentissage
          </Link>{" "}
          et{" "}
          <Link
            href="https://referentiel.apprentissage.onisep.fr/"
            isExternal
            isUnderlined
            color="action-high-blue-france"
            ml={1}
          >
            Référentiel UAI-SIRET des OFA-CFA
          </Link>
        </Text>
        {organisationType === "ORGANISME_FORMATION" && (
          <>
            <Text>Cliquez sur un organisme pour voir en détails les formations dont vous avez la gestion.</Text>
            <Text>Si des informations vous semblent erronées, veuillez suivre les démarches ci-dessous.</Text>
          </>
        )}
        {organisationType === "TETE_DE_RESEAU" && (
          <>
            <Text>Cliquez sur un organisme pour voir en détails les formations dont il a la gestion.</Text>
            <Text>Si des informations vous semblent erronées, veuillez suivre les démarches ci-dessous.</Text>
          </>
        )}

        {props.organismeId ? (
          <IndicateursOrganisme organismeId={props.organismeId} />
        ) : (
          <IndicateursOrganisationsOrganismes />
        )}

        <Stack spacing="4w">
          <OrganismesTable
            organismes={organismesFiltered || []}
            showFilterNature
            showFilterTransmission
            showFilterQualiopi
            showFilterLocalisation
            showFilterEtat
            showFilterUai
            withFormations={true}
          />
        </Stack>
        <Flex gap={12} mt={16} mb={6}>
          <Box flex="3">
            <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
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
            {organisationType === "ORGANISME_FORMATION" && (
              <Accordion defaultIndex={0} useCustomIcons={true}>
                <Accordion.Item title='Si des établissements ont une UAI "non déterminée", que cela signifie-t-il et que faire ?'>
                  <Text>
                    Si l&apos;UAI est répertoriée comme &quot;Non déterminée&quot; alors que l&apos;organisme en possède
                    une, il doit la communiquer en écrivant à{" "}
                    <Link href={`mailto:referentiel-uai-siret@onisep.fr`} isExternal isUnderlined whiteSpace="nowrap">
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
                    informations nécessaires à l&apos;expertise de votre problématique (raison sociale, Siret, UAI,
                    etc.).
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
                      isExternal
                      isUnderlined
                      whiteSpace="nowrap"
                    >
                      Carif-Oref régional
                    </Link>{" "}
                    pour référencer ses offres et obtenir un ID formation, que l&apos;on retrouve notamment dans le{" "}
                    <Link
                      href="https://catalogue-apprentissage.intercariforef.org/recherche/etablissements"
                      isExternal
                      isUnderlined
                      whiteSpace="nowrap"
                    >
                      Catalogue des offres de formations en apprentissage
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
                    <Link href="https://procedures.inpi.fr/?/" isExternal isUnderlined whiteSpace="nowrap">
                      Guichet unique des entreprises
                    </Link>
                    ), un nouveau Siret a été délivré par l&apos;INSEE. L&apos;ancien Siret est alors fermé.
                  </Text>
                  <Text mt={2}>
                    Pour garantir la mise à jour correcte des informations administratives et légales, il faut signaler
                    le nouveau Siret à :
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
                        isExternal
                        isUnderlined
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
                    Concernant les formations, chaque offre de chaque établissement devrait figurer dans le Catalogue
                    des offres de formations en apprentissage. Si ce n&apos;est pas le cas, merci de signaler la
                    situation par mail :
                    <Link
                      href={`mailto:pole-apprentissage@intercariforef.org`}
                      isExternal
                      isUnderlined
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

                <Accordion.Item title="Si des établissements sont manquants, que faire ?">
                  <p>
                    Si un organisme, dont la gestion de ses formations en apprentissage est confiée à votre CFA,
                    n’apparaît pas dans la liste :
                  </p>
                  <UnorderedList pl={2}>
                    <ListItem>
                      soit il n’est pas référencé sur le{" "}
                      <Link
                        href="https://referentiel.apprentissage.onisep.fr/"
                        isExternal
                        isUnderlined
                        whiteSpace="nowrap"
                      >
                        Référentiel UAI-SIRET des OFA-CFA
                      </Link>
                    </ListItem>
                    <ListItem>
                      soit ses formations déclarées auprès de son Carif-Oref régional ne sont pas référencées ou
                      n’indiquent pas le bon établissement responsable sur le{" "}
                      <Link
                        href="https://catalogue-apprentissage.intercariforef.org/"
                        isExternal
                        isUnderlined
                        whiteSpace="nowrap"
                      >
                        Catalogue des offres de formations en apprentissage
                      </Link>
                    </ListItem>
                  </UnorderedList>
                  <TextHighlight highlightText={<b>Démarche :</b>}>
                    <UnorderedList pl={2} mb={6}>
                      <ListItem>
                        Si l’organisme en apprentissage est absent du Référentiel UAI-SIRET des OFA-CFA : il doit se
                        référencer via son compte{" "}
                        <Link
                          href="https://info.monactiviteformation.emploi.gouv.fr/"
                          isExternal
                          isUnderlined
                          whiteSpace="nowrap"
                        >
                          MAF
                        </Link>
                        .
                      </ListItem>
                      <ListItem>
                        Si l’organisme est absent du Catalogue des offres de formations en apprentissage : ses
                        formations doivent être référencées sur la plateforme de son Carif Oref (voir document
                        téléchargeable ci-dessous).
                      </ListItem>
                      <ListItem>
                        Si l’organisme est présent sur le Catalogue des offres de formations en apprentissage : vérifiez
                        que ses formations indiquent bien comme “Responsable” l’établissement gestionnaire des contrats
                        sur votre
                        <Link
                          href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                          isExternal
                          isUnderlined
                          whiteSpace="nowrap"
                        >
                          plateforme Carif Oref
                        </Link>
                        .
                      </ListItem>
                    </UnorderedList>
                    <Box mb={4}>Ces démarches doivent s’effectuer en concertation avec l’organisme concerné.</Box>
                    <DownloadLink
                      href="https://drive.google.com/file/d/1xjshlQqxl3UKhoU7xrEhziCUqVsPAxCU/view?usp=drive_link"
                      fileType="PDF"
                      fileSize="417 Ko"
                      isExternal
                    >
                      Liste de contacts Carif-Oref
                    </DownloadLink>
                  </TextHighlight>
                </Accordion.Item>
              </Accordion>
            )}

            {organisationType === "TETE_DE_RESEAU" && (
              <Accordion defaultIndex={0} useCustomIcons={true}>
                <Accordion.Item title="Il manque un ou plusieurs établissements, ou certains ne font plus partie de mon réseau. Comment mettre à jour la liste ?">
                  <p>
                    L&apos;onglet ”Mon réseau” affiche tous les établissements identifiés de votre réseau. Nous les
                    mettons à jour manuellement et régulièrement sur le Tableau de bord.
                  </p>
                  <p>
                    Si la liste des organismes de votre réseau ci-dessus est incomplète ou erronée ,{" "}
                    <Link href={SUPPORT_PAGE_ACCUEIL} isExternal isUnderlined whiteSpace="nowrap">
                      contactez-nous
                    </Link>{" "}
                    en indiquant la liste des établissements à rattacher à votre réseau, et en précisant pour chacun sa
                    raison sociale, UAI, SIRET, domiciliation.
                  </p>
                  <p>
                    L&apos;idéal est de nous envoyer un tableau Excel complet de votre réseau avec ces informations.
                  </p>
                </Accordion.Item>

                <Accordion.Item title="Si des établissements ont une UAI “non déterminée”, que cela signifie-t-il et que faire ?">
                  <p>
                    L’UAI (Unité Administrative Immatriculée) est un code attribué par le Ministère de l’Éducation
                    nationale, dans le répertoire académique et ministériel sur les établissements du système éducatif
                    (RAMSESE) aux établissements du système éducatif (écoles, collèges, lycées, CFA, établissements
                    d’enseignement supérieur, public ou privé). Il est utilisé pour les identifier dans différentes
                    bases de données et systèmes administratifs. L’UAI s’obtient auprès des services du rectorat de
                    l’académie où se situe le CFA.
                  </p>
                  <p>
                    Si l&apos;UAI est répertoriée comme « Non déterminée » alors que l’organisme en possède une, il doit
                    la communiquer en écrivant à{" "}
                    <Link href="mailto:referentiel-uai-siret@onisep.fr" isExternal isUnderlined whiteSpace="nowrap">
                      referentiel-uai-siret@onisep.fr
                    </Link>{" "}
                    avec la fiche descriptive UAI, pour mise à jour. L&apos;absence de ce numéro bloque
                    l&apos;enregistrement des contrats d&apos;apprentissage.
                  </p>
                  <p>
                    Si l’UAI est répertoriée comme « Non déterminée » alors que l’organisme en possède un, il doit la
                    communiquer en écrivant à referentiel-uai-siret@onisep.fr avec la fiche UAI, pour mise à jour.
                    L&apos;absence de ce numéro bloque l’enregistrement des contrats d’apprentissage.
                  </p>
                  <p>
                    En cas de questions, contactez le service RAMSESE de votre Rectorat en leur communiquant les
                    informations nécessaires à l’expertise de votre problématique (raison sociale, Siret, UAI, etc...).
                  </p>
                  <DownloadLink href="/pdf/Contact-Rectorat-UAI-RAMSESE.pdf" fileType="PDF" fileSize="81 Ko" isExternal>
                    Liste des contacts des services académiques
                  </DownloadLink>
                </Accordion.Item>

                <Accordion.Item title="Si des établissements ont une nature 'inconnue', que cela signifie-t-il et que faire ?">
                  <p>
                    Si un organisme a pour nature « Inconnue », cela signifie que l’offre de formation en apprentissage
                    n&apos;est pas collectée ou mal référencée par le Carif-Oref. L’organisme doit s’adresser auprès de
                    son{" "}
                    <Link
                      href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                      isExternal
                      isUnderlined
                      whiteSpace="nowrap"
                    >
                      Carif-Oref régional
                    </Link>{" "}
                    pour référencer ses offres et obtenir un ID formation, que l’on retrouve notamment dans le
                    <Link
                      href="https://catalogue-apprentissage.intercariforef.org/"
                      isExternal
                      isUnderlined
                      whiteSpace="nowrap"
                    >
                      {" "}
                      Catalogue des offres de formations en apprentissage
                    </Link>
                    . Veuillez noter que la modification de la nature d’un organisme impacte ses relations avec les
                    autres organismes.
                  </p>
                  <p>En cas de questions, contactez votre Carif-Oref régional ou connectez-vous à votre espace.</p>
                  <DownloadLink
                    href="https://drive.google.com/file/d/1xjshlQqxl3UKhoU7xrEhziCUqVsPAxCU/view?usp=drive_link"
                    fileType="PDF"
                    fileSize="417 Ko"
                    isExternal
                  >
                    Liste de contacts Carif-Oref
                  </DownloadLink>
                </Accordion.Item>

                <Accordion.Item title="Si des établissements ont un Siret 'fermé', que cela signifie-t-il et que faire ?">
                  <p>
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
                    ), un nouveau Siret a été délivré par l’INSEE. L&apos;ancien Siret est alors fermé.
                  </p>
                  <p>
                    Pour garantir la mise à jour correcte des informations administratives et légales, il faut signaler
                    le nouveau Siret :
                  </p>
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
                      d&apos;Industrie (CCI), Chambre de Métiers et de l&apos;Artisanat (CMA), MFR, etc.),
                    </ListItem>
                    <ListItem>
                      et le mettre à jour sur{" "}
                      <Link
                        href="https://mesdemarches.emploi.gouv.fr/identification/login?TARGET=https://www.monactiviteformation.emploi.gouv.fr/mon-activite-formation/"
                        isExternal
                        isUnderlined
                        whiteSpace="nowrap"
                      >
                        Mon Activité Formation
                      </Link>
                      .
                    </ListItem>
                  </UnorderedList>
                </Accordion.Item>
              </Accordion>
            )}

            {organisationType !== "ORGANISME_FORMATION" && organisationType !== "TETE_DE_RESEAU" && (
              <Accordion defaultIndex={0} useCustomIcons={true}>
                <Accordion.Item title="Si des établissements dans la liste ne transmettent pas (ou plus), que faire ?">
                  <p>
                    Si des établissements n&apos;affichent pas d’effectifs transmis (ou ont arrêté la transmission), il
                    faut les encourager à :
                  </p>
                  <UnorderedList pl={2}>
                    <ListItem>
                      se créer un compte sur le Tableau de bord de l&apos;apprentissage et transmettre les effectifs.
                    </ListItem>
                    <ListItem>mettre à jour leurs effectifs si la transmission s’est arrêtée.</ListItem>
                  </UnorderedList>
                  <TextHighlight highlightText={<b>Démarche :</b>}>
                    Téléchargez la liste et contactez les CFA concernés pour leur demander de transmettre leurs
                    effectifs. Notre équipe vous accompagne dans cette démarche sous la forme que vous souhaitez
                    (emailing, webinaire, etc.).
                  </TextHighlight>
                </Accordion.Item>

                <Accordion.Item title="Si des établissements ont une UAI 'non déterminée'. Que cela signifie-t-il et que faire ?">
                  <p>
                    Si l&apos;UAI est répertoriée comme « Non déterminée » alors que l’organisme en possède une, il doit
                    la communiquer en écrivant à{" "}
                    <Link href="mailto:referentiel-uai-siret@onisep.fr" isExternal isUnderlined whiteSpace="nowrap">
                      referentiel-uai-siret@onisep.fr
                    </Link>{" "}
                    avec la fiche descriptive UAI, pour mise à jour. L&apos;absence de ce numéro bloque
                    l&apos;enregistrement des contrats d&apos;apprentissage.
                  </p>
                  <TextHighlight highlightText={<b>Démarche :</b>}>
                    Téléchargez la liste et contactez les CFA concernés pour les encourager à transmettre leur UAI.
                    Notre équipe vous accompagne dans cette démarche.
                  </TextHighlight>
                </Accordion.Item>

                <Accordion.Item title="Si des établissements ont une nature 'inconnue', que cela signifie-t-il et que faire ?">
                  <p>
                    Si un organisme a pour nature « Inconnue », cela signifie que l’offre de formation en apprentissage
                    n&apos;est pas collectée ou mal référencée par le Carif-Oref. L’organisme doit s’adresser auprès de
                    son{" "}
                    <Link
                      href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                      isExternal
                      isUnderlined
                      whiteSpace="nowrap"
                    >
                      Carif-Oref régional
                    </Link>{" "}
                    pour référencer ses offres et obtenir un ID formation, que l’on retrouve notamment dans le
                    <Link
                      href="https://catalogue-apprentissage.intercariforef.org/"
                      isExternal
                      isUnderlined
                      whiteSpace="nowrap"
                    >
                      {" "}
                      Catalogue des offres de formations en apprentissage
                    </Link>
                    . Veuillez noter que la modification de la nature d’un organisme impacte ses relations avec les
                    autres organismes.
                  </p>
                  <TextHighlight highlightText={<b>Démarche :</b>}>
                    Téléchargez la liste et contactez les CFA concernés pour les encourager à déclarer (ou mettre à
                    jour) leur offre de formation. Notre équipe vous accompagne dans cette démarche.
                  </TextHighlight>
                </Accordion.Item>

                <Accordion.Item title="Si des établissements ont un Siret 'fermé', que cela signifie-t-il et que faire ?">
                  <p>
                    Cette information est tirée de la base INSEE. Un établissement est affiché &quot;Fermé&quot; suite à
                    une cessation d&apos;activité ou un déménagement. Si un changement d&apos;adresse a été déclaré (via
                    <Link href="https://procedures.inpi.fr/?/" isExternal isUnderlined whiteSpace="nowrap">
                      Guichet unique des entreprises
                    </Link>
                    ), un nouveau Siret a été délivré par l’INSEE. L&apos;ancien Siret est alors fermé.
                  </p>
                  <p>
                    Pour garantir la mise à jour correcte des informations administratives et légales, il faut signaler
                    le nouveau Siret :
                  </p>
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
                      d&apos;Industrie (CCI), Chambre de Métiers et de l&apos;Artisanat (CMA), MFR, etc.),
                    </ListItem>
                    <ListItem>
                      et le mettre à jour sur{" "}
                      <Link
                        href="https://mesdemarches.emploi.gouv.fr/identification/login?TARGET=https://www.monactiviteformation.emploi.gouv.fr/mon-activite-formation/"
                        isExternal
                        isUnderlined
                        whiteSpace="nowrap"
                      >
                        Mon Activité Formation
                      </Link>
                      .
                    </ListItem>
                  </UnorderedList>
                  <TextHighlight highlightText={<b>Démarche :</b>}>
                    Téléchargez la liste et contactez les CFA concernés pour leur demander de mettre à jour leur nouveau
                    Siret si c’est le cas. Notre équipe vous accompagne dans cette démarche.
                  </TextHighlight>
                </Accordion.Item>
              </Accordion>
            )}
            <Grid templateColumns="repeat(3, 1fr)" gap={3} bg="galt" mt={6} p={12} borderRadius="md">
              <GridItem>
                <Box display="flex" justifyContent="center" alignItems="center">
                  <Image src="/images/contact.svg" alt="France relance" width="100%" userSelect="none" />
                </Box>
              </GridItem>
              <GridItem colSpan={2}>
                <Flex flexDirection="column" justifyContent="center" height="100%" px={12} gap={4}>
                  <Text color="#2F4077" fontSize="beta" fontWeight="700" lineHeight={1.4}>
                    Vous ne trouvez pas la réponse à vos questions ?
                  </Text>
                  <Flex gap={6}>
                    <Link display="inline-flex" href={CRISP_FAQ} isExternal isUnderlined width={"fit-content"}>
                      Aide
                    </Link>
                    <Link display="inline-flex" href="/referencement-organisme" isUnderlined width={"fit-content"}>
                      Voir la page de référencement
                      <Box className="ri-arrow-right-line" ml={1} />
                    </Link>
                  </Flex>
                </Flex>
              </GridItem>
            </Grid>
          </Box>
          <Box flex="1">
            {organisationType !== "ORGANISME_FORMATION" && (
              <InformationMessage
                title="Le saviez-vous ?"
                titleColor="#6E445A"
                backgroundColor="#FEE7FC"
                icon={<BonusAvatar width={10} height={10} />}
              >
                <Text>
                  Notre équipe vous accompagne dans le déploiement du Tableau de bord de l’apprentissage. Nous
                  organisons des webinaires réguliers avec les CFA de votre{" "}
                  {organisationType === "TETE_DE_RESEAU" ? <>réseau</> : <>territoire</>}.{" "}
                  <Link
                    href={SUPPORT_PAGE_ACCUEIL}
                    target="_blank"
                    textDecoration="underline"
                    isExternal
                    isUnderlined
                    whiteSpace="nowrap"
                  >
                    Contactez-nous
                  </Link>{" "}
                  !
                </Text>
              </InformationMessage>
            )}
          </Box>
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

    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DRAFPIC":
    case "ACADEMIE":
      return "Les organismes de mon territoire";

    case "ADMINISTRATEUR":
      return "Tous les organismes";

    default:
      throw new Error(`Type ’${type}’ inconnu`);
  }
}

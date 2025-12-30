import {
  ArrowForwardIcon,
  ViewIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  WarningTwoIcon,
  CheckCircleIcon,
} from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  HStack,
  Heading,
  ListItem,
  Text,
  UnorderedList,
  VStack,
  Wrap,
  Link,
  Collapse,
  Icon,
} from "@chakra-ui/react";
import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import {
  natureOrganismeDeFormationLabel,
  IOrganisationCreate,
  REFERENTIEL_ONISEP,
  CARIF_OREF,
  CATALOGUE_APPRENTISSAGE,
  ANNUAIRE_ENTREPRISE,
  STATUT_FIABILISATION_ORGANISME,
  LIST_PUBIC_ORGANISMES_DE_FORMATIONS,
  FAQ_REFERENCER_ETABLISSEMENT,
  UAI_INCONNUE_TAG_FORMAT,
  UAI_INCONNUE,
  UAI_INCONNUE_CAPITALIZE,
  CRISP_FAQ,
} from "shared";

import { convertOrganismeToExport, organismesExportColumns } from "@/common/exports";
import { _get, _post } from "@/common/httpClient";
import { AuthContext } from "@/common/internal/AuthContext";
import { Organisme } from "@/common/internal/Organisme";
import { formatDate } from "@/common/utils/dateUtils";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import { formatCivility, formatSiretSplittedWithDefaultValue } from "@/common/utils/stringUtils";
import DownloadButton from "@/components/buttons/DownloadButton";
import CerfaLink from "@/components/Cerfa/CerfaLink";
import CustomLink from "@/components/Links/Link";
import { BasicModal } from "@/components/Modals/BasicModal";
import NotificationTransmissionError from "@/components/Notifications/TransmissionErrors";
import Ribbons from "@/components/Ribbons/Ribbons";
import SuggestFeature from "@/components/SuggestFeature/SuggestFeature";
import Tag from "@/components/Tag/Tag";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import { InfoCircle } from "@/theme/components/icons";
import { DashboardWelcome } from "@/theme/components/icons/DashboardWelcome";
import Eye from "@/theme/components/icons/Eye";

import InfosTransmissionEtParametrageOFA from "../admin/InfosTransmissionEtParametrageOFA";
import { ExternalLinks } from "../admin/OrganismeDetail";
import BandeauDuplicatsEffectifs from "../effectifs/BandeauDuplicatsEffectifs";
import AlertDuplicatsEffectifs from "../organismes/AlertDuplicatsEffectifs";
import BandeauTransmission from "../organismes/BandeauTransmission";
import IndicateursEffectifsParFormationTable from "../organismes/IndicateursEffectifsParFormationTable";
import InfoFiabilisationOrganisme from "../organismes/InfoFiabilisationOrganisme";
import InfoTransmissionDeca from "../organismes/InfoTransmissionDeca";
import InfoTransmissionDonnees from "../organismes/InfoTransmissionDonnees";

import ContactsModal from "./ContactsModal";
import { FileDownloadIcon } from "./icons";
import IndicateursGrid from "./IndicateursGrid";
import { Pie } from "./Pie";

const FiabilisationInfo = () => {
  const [show, setShow] = useState(false);
  const handleToggle = () => setShow(!show);

  const linkStyle = {
    color: "#000091",
    textDecoration: "underline",
    textUnderlineOffset: "4px",
    cursor: "pointer",
  };

  return (
    <Ribbons variant="warning" w="full" mt={3}>
      <Box color="black">
        <Text fontWeight="bold" mb={2}>
          Votre organisme nécessite des actions de votre part pour être considéré comme fiable et ainsi mieux
          transmettre vos effectifs.
        </Text>
        <Text style={linkStyle} onClick={handleToggle}>
          {" "}
          {show ? <ChevronDownIcon /> : <ChevronUpIcon />} Voir le détail des actions
        </Text>
        <Collapse in={show}>
          <UnorderedList>
            <ListItem mt={2}>
              {" "}
              Si votre UAI est affiché comme “{UAI_INCONNUE_CAPITALIZE}”, veuillez signaler votre numéro et sa fiche en
              adressant un courriel à{" "}
              <Link
                href={`mailto:referentiel-uai-siret@onisep.fr`}
                target="_blank"
                textDecoration="underline"
                isExternal
                whiteSpace="nowrap"
              >
                referentiel-uai-siret@onisep.fr
              </Link>{" "}
              pour qu’elle soit mise à jour sur le{" "}
              <Link isExternal href={REFERENTIEL_ONISEP} textDecoration="underline">
                Référentiel de l’apprentissage
              </Link>
              .
            </ListItem>
            <ListItem mt={2}>
              La nature de votre organisme est “Inconnue” ou les relations affichées sont incorrectes, veuillez la
              déclarer ou les corriger auprès du{" "}
              <Link isExternal href={CARIF_OREF} textDecoration="underline">
                Carif-Oref régional
              </Link>
              . (voir également{" "}
              <Link isExternal href={CATALOGUE_APPRENTISSAGE} textDecoration="underline">
                Catalogue des offres de formations en apprentissage
              </Link>
              )
            </ListItem>
            <ListItem mt={2}>
              Si d’autres informations affichées (SIRET, adresse, raison sociale...) sont erronées, veuillez consulter{" "}
              <Link isExternal href={ANNUAIRE_ENTREPRISE} textDecoration="underline">
                l’Annuaire des entreprises
              </Link>
              .
            </ListItem>
          </UnorderedList>
        </Collapse>
      </Box>
    </Ribbons>
  );
};
const natureOrganismeDeFormationTooltip = {
  responsable: (
    <Box>
      <Text>
        <strong>Organisme responsable</strong>
      </Text>
      <Text mt="2w">
        Ne dispense pas de formation mais délègue à des organismes responsable et formateur ou uniquement formateur.
      </Text>
      <Text mt="2w">Est signataire de la convention de formation. Demande et reçoit les financements de l’OPCO.</Text>
      <Text mt="2w">Est responsable auprès de l’administration du respect de ses missions et obligations. </Text>
      <Text mt="2w">
        Est titulaire de la certification qualité en tant que CFA et est garant du respect des critères qualité au sein
        de l’UFA.
      </Text>
    </Box>
  ),
  formateur: (
    <Box>
      <Text>
        <strong>Organisme formateur</strong>
      </Text>
      <Text mt="2w">
        Dispense des actions de formation par apprentissage déclaré auprès des services de l’Etat (n° de déclaration
        d’activité (NDA)).
      </Text>
      <Text mt="2w">Est signataire de la convention de formation. Demande et reçoit les financements de l’OPCO.</Text>
      <Text mt="2w">Est responsable auprès de l’administration du respect de ses missions et obligations.</Text>
      <Text mt="2w">
        Est titulaire de la certification qualité en tant que CFA et est garant du respect des critères qualité au sein
        de l’UFA.
      </Text>
    </Box>
  ),
  responsable_formateur: (
    <Box>
      <Text>
        <strong>Organisme responsable et formateur</strong>
      </Text>
      <Text mt="2w">
        Dispense des actions de formation par apprentissage déclaré auprès des services de l’Etat (n° de déclaration
        d’activité (NDA)).
      </Text>
      <Text mt="2w">Est signataire de la convention de formation. Demande et reçoit les financements de l’OPCO.</Text>
      <Text mt="2w">Demande et reçoit les financements de l’OPCO.</Text>
      <Text mt="2w">Est responsable auprès de l’administration du respect de ses missions et obligations.</Text>
      <Text mt="2w">
        Est titulaire de la certification qualité en tant que CFA et est garant du respect des critères qualité au sein
        de l’UFA.
      </Text>
    </Box>
  ),
};

const useOrganismeData = (organismeId: string, permissions: Organisme["permissions"], modePublique: boolean) => {
  const queries = [
    {
      queryKey: ["organismes", organismeId, "contacts"],
      queryFn: () => _get(`/api/v1/organismes/${organismeId}/contacts`),
      enabled: !!organismeId && modePublique,
    },
    {
      queryKey: ["organismes", organismeId, "indicateurs/effectifs"],
      queryFn: () =>
        _get(`/api/v1/organismes/${organismeId}/indicateurs/effectifs`, {
          params: { date: new Date() },
        }),
      enabled: !!organismeId && permissions?.indicateursEffectifs,
    },
    {
      queryKey: ["organismes", organismeId, "indicateurs/organismes"],
      queryFn: () => _get(`/api/v1/organismes/${organismeId}/indicateurs/organismes`),
      enabled: !!organismeId,
    },
    {
      queryKey: ["organismes", organismeId, "indicateurs/effectifs/par-formation"],
      queryFn: () =>
        _get(`/api/v1/organismes/${organismeId}/indicateurs/effectifs/par-formation`, {
          params: { date: new Date() },
        }),
      enabled: !!organismeId && permissions?.indicateursEffectifs,
    },
    {
      queryKey: ["organismes", organismeId, "duplicates"],
      queryFn: () => _get(`/api/v1/organismes/${organismeId}/duplicates`),
      enabled: !!organismeId,
    },
  ];

  return useQueries({ queries });
};

interface Props {
  organisme: Organisme;
  modePublique: boolean; // permet d'afficher plus d'informations, notamment les responsables, qualiopi
}

const DashboardOrganisme = ({ organisme, modePublique }: Props) => {
  const router = useRouter();
  const { auth, organisationType } = useAuth();

  const { organisme: ownOrganisme } = useOrganisationOrganisme(
    modePublique && organisationType === "ORGANISME_FORMATION"
  );
  const isOFviewingItsPublicPage = modePublique && organisme?._id === ownOrganisme?._id;

  const [
    contactsQuery,
    indicateursEffectifsQuery,
    indicateursOrganismesQuery,
    formationsAvecIndicateursQuery,
    duplicatesQuery,
  ] = useOrganismeData(organisme?._id, organisme?.permissions, modePublique);

  const contacts = contactsQuery.data;
  const indicateursEffectifs = indicateursEffectifsQuery.data;
  const indicateursEffectifsLoading = indicateursEffectifsQuery.isLoading;
  const indicateursOrganismes = indicateursOrganismesQuery.data;
  const formationsAvecIndicateurs = formationsAvecIndicateursQuery.data;
  const duplicates = duplicatesQuery.data;

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

  const hasOrganismesFormateurs = organisme.organismesFormateurs && organisme.organismesFormateurs?.length > 0;
  const indicateursEffectifsPartielsMessage =
    organisme.permissions?.indicateursEffectifs && getIndicateursEffectifsPartielsMessage(auth, organisme);

  const isFiable = organisme.fiabilisation_statut === STATUT_FIABILISATION_ORGANISME.FIABLE;
  const missionLocale = organisme.missionLocale;

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
          <HStack>
            <Box flex={3} maxW="xl" p="8">
              {isOFviewingItsPublicPage && (
                <HStack
                  paddingX="1w"
                  paddingY="2px"
                  display="inline-flex"
                  borderRadius={6}
                  backgroundColor="#0000911A"
                  color="bluefrance"
                  mb="6"
                >
                  <ViewIcon boxSize="6" />
                  <Box>
                    <Text fontSize="epsilon" fontWeight="bold">
                      Ceci est votre établissement
                    </Text>
                    <Text fontSize="small">Vue en page publique</Text>
                  </Box>
                </HStack>
              )}

              <Heading textStyle="h2" color="grey.800" size="md">
                <DashboardWelcome mr="2" />
                Vous êtes sur{" "}
                {modePublique
                  ? "le tableau de bord de"
                  : `votre espace, ${formatCivility(auth.civility)} ${auth.prenom} ${auth.nom}`}
              </Heading>

              <HStack mt="4" gap="4" alignItems="center">
                <Text color="bluefrance" fontWeight={700} textTransform="uppercase">
                  {organisme.enseigne || organisme.raison_sociale || "Organisme inconnu"}
                </Text>
              </HStack>
              <HStack mt="4" gap="4" alignItems="center">
                {organisme.permissions?.infoTransmissionEffectifs && (
                  <InfoTransmissionDonnees
                    modeBadge={true}
                    lastTransmissionDate={organisme.last_transmission_date}
                    permissionInfoTransmissionEffectifs={organisme.permissions?.infoTransmissionEffectifs}
                  />
                )}
                {!organisme.is_transmission_target && (
                  <InfoTransmissionDeca
                    date={
                      organisme.last_effectifs_deca_update ? new Date(organisme.last_effectifs_deca_update) : undefined
                    }
                    indicateursEffectifs={indicateursEffectifs}
                  />
                )}
                {organisme.fiabilisation_statut && (
                  <InfoFiabilisationOrganisme fiabilisationStatut={organisme.fiabilisation_statut} />
                )}
                {duplicates && duplicates?.totalItems > 0 && <AlertDuplicatsEffectifs />}
                {organisationType === "ADMINISTRATEUR" && (
                  <>
                    <Button
                      variant="outline"
                      borderColor="#B60000"
                      color="#B60000"
                      size="xs"
                      ml={4}
                      onClick={async () => {
                        await _post<IOrganisationCreate>("/api/v1/admin/impersonate", {
                          type: "ORGANISME_FORMATION",
                          siret: organisme.siret,
                          uai: organisme.uai ?? null, // peut être absent si non présent dans le référentiel
                        });
                        location.href = "/";
                      }}
                    >
                      Imposture
                    </Button>
                  </>
                )}
              </HStack>

              <VStack gap={2} alignItems={"baseline"} mt="6">
                <Wrap fontSize="epsilon" textColor="grey.800">
                  <HStack>
                    <Text>UAI&nbsp;:</Text>
                    <Tag
                      leftIcon={!organisme.uai ? WarningTwoIcon : undefined}
                      leftIconColor="#FF732C"
                      primaryText={organisme.uai || UAI_INCONNUE_TAG_FORMAT}
                      variant="badge"
                      colorScheme="grey_tag"
                      size="lg"
                      fontSize="epsilon"
                      borderRadius="0"
                      rightIcon={() =>
                        !organisme.uai ? (
                          <InfoTooltip
                            contentComponent={() => (
                              <Box>
                                <Text>
                                  <strong>Votre UAI est {UAI_INCONNUE}</strong>
                                </Text>
                                <UnorderedList mt={4}>
                                  <ListItem>
                                    Si votre Unité Administrative Immatriculée (UAI) est répertoriée comme «{" "}
                                    {UAI_INCONNUE_TAG_FORMAT} » alors que votre organisme en possède une, veuillez la
                                    communiquer en écrivant à{" "}
                                    <Link
                                      isExternal
                                      href="mailto:referentiel-uai-siret@onisep.fr"
                                      textDecoration="underline"
                                      display="inline"
                                    >
                                      referentiel-uai-siret@onisep.fr
                                    </Link>{" "}
                                    avec la fiche UAI, afin qu’elle soit mise à jour. L&apos;absence de ce numéro bloque
                                    l’enregistrement des contrats d’apprentissage. L&apos;UAI est recommandée pour être
                                    reconnu OFA.
                                  </ListItem>
                                  <ListItem>
                                    Si votre organisme ne possède pas encore d’UAI, veuillez vous adresser auprès des
                                    services du rectorat de l’académie où se situe votre CFA. Plus d’informations dans
                                    l’article{" "}
                                    <Link
                                      isExternal
                                      href={FAQ_REFERENCER_ETABLISSEMENT}
                                      textDecoration="underline"
                                      display="inline"
                                    >
                                      “Comment bien référencer un établissement ?”
                                    </Link>
                                    .
                                  </ListItem>
                                </UnorderedList>
                              </Box>
                            )}
                          />
                        ) : null
                      }
                    />
                  </HStack>

                  <HStack>
                    <Text>SIRET&nbsp;:</Text>
                    <Tag
                      primaryText={`${formatSiretSplittedWithDefaultValue(organisme.siret)} (${organisme.ferme ? "fermé" : "en activité"})`}
                      variant="badge"
                      colorScheme="grey_tag"
                      size="lg"
                      fontSize="epsilon"
                      borderRadius="0"
                      rightIcon={() =>
                        organisme.ferme ? (
                          <InfoTooltip
                            contentComponent={() => (
                              <Box>
                                <Text>
                                  <strong>État du SIRET “fermé”</strong>
                                </Text>
                                <Text my={2}>
                                  Un établissement est affiché “fermé” suite à une cessation d’activité ou un
                                  déménagement. Aucun effectif en apprentissage ne devrait être transmis sur un
                                  établissement considéré “Fermé”. Si votre établissement a déménagé et possède un
                                  nouveau SIRET, veuillez le signaler aux acteurs publics de l’apprentissage.
                                </Text>
                                <Link
                                  isExternal
                                  href={FAQ_REFERENCER_ETABLISSEMENT}
                                  textDecoration="underline"
                                  display="inline"
                                  mt={6}
                                >
                                  En savoir plus sur la démarche à suivre
                                </Link>
                              </Box>
                            )}
                          />
                        ) : null
                      }
                    />
                  </HStack>

                  <HStack>
                    <Text>Nature&nbsp;:</Text>
                    <Tag
                      primaryText={natureOrganismeDeFormationLabel[organisme.nature] || "Inconnue"}
                      variant="badge"
                      colorScheme="grey_tag"
                      size="lg"
                      fontSize="epsilon"
                      borderRadius="0"
                      rightIcon={() =>
                        natureOrganismeDeFormationLabel[organisme.nature] === "Inconnue" ? (
                          <InfoTooltip
                            contentComponent={() => (
                              <Box>
                                <Text>
                                  <strong>Votre Nature est inconnue</strong>
                                </Text>
                                <Text mt="2w">
                                  Si votre organisme a pour nature «&nbsp;Inconnue&nbsp;», cela signifie que l’offre de
                                  formation n’est pas collectée ou mal référencée par le Carif-Oref. Adressez-vous
                                  auprès de votre Carif-Oref régional pour renseigner cette donnée. Veuillez noter que
                                  la modification de la nature d’un organisme impacte ses relations avec les autres
                                  organismes.
                                </Text>
                                <Link
                                  isExternal
                                  textDecoration="underline"
                                  display="inline"
                                  href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                                >
                                  En savoir plus sur la démarche.
                                </Link>
                              </Box>
                            )}
                          />
                        ) : (
                          natureOrganismeDeFormationTooltip[organisme.nature] && (
                            <InfoTooltip
                              contentComponent={() => <Box>{natureOrganismeDeFormationTooltip[organisme.nature]}</Box>}
                            />
                          )
                        )
                      }
                    />
                  </HStack>

                  {modePublique && (
                    <HStack>
                      <Text>Certifié Qualiopi&nbsp;:</Text>
                      <Tag
                        primaryText={organisme.qualiopi ? "Oui" : "Non"}
                        variant="badge"
                        colorScheme="grey_tag"
                        size="lg"
                        fontSize="epsilon"
                        borderRadius="0"
                        rightIcon={() => (
                          <InfoTooltip
                            contentComponent={() => (
                              <Box>
                                La donnée Certifié qualiopi provient de la{" "}
                                <Link
                                  isExternal
                                  href={LIST_PUBIC_ORGANISMES_DE_FORMATIONS}
                                  textDecoration="underline"
                                  display="inline"
                                >
                                  Liste Publique des Organismes de Formations
                                </Link>
                                . Si cette information est erronée, merci de leur signaler.
                              </Box>
                            )}
                          />
                        )}
                      />
                    </HStack>
                  )}
                </Wrap>

                {organisme.reseaux && organisme.reseaux?.length > 0 && (
                  <HStack>
                    <Text>
                      Cet organisme fait partie {organisme.reseaux?.length === 1 ? "du réseau" : "des réseaux"}&nbsp;:
                    </Text>
                    {organisme.reseaux.map((reseau) => (
                      <Tag
                        key={reseau}
                        primaryText={reseau}
                        variant="badge"
                        colorScheme="grey_tag"
                        size="lg"
                        fontSize="epsilon"
                        borderRadius="0"
                      />
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

                {modePublique && organisme.permissions?.viewContacts && (
                  <>
                    <Box>
                      <Text display="inline-block">Responsable identifié de l’établissement&nbsp;:</Text>
                      {contacts &&
                        (contacts.length > 0 ? (
                          <>
                            <Text display="inline-block" ml={2} fontWeight="bold">
                              {contacts[0].prenom}{" "}
                              <Text as="span" textTransform="uppercase">
                                {contacts[0].nom}
                              </Text>
                              , {contacts[0].fonction} - {contacts[0].telephone}
                            </Text>
                            <Link
                              href={`mailto:${contacts[0].email}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              borderBottom="1px"
                              _hover={{ textDecoration: "none" }}
                              color="action-high-blue-france"
                              display="inline-flex"
                              alignItems="center"
                              ml={6}
                            >
                              <ArrowForwardIcon mr={2} />
                              Envoyer un courriel
                            </Link>
                            {contacts.length >= 2 && <ContactsModal contacts={contacts.slice(1)} ml={6} />}
                          </>
                        ) : (
                          <Text display="inline-block" ml={2} fontWeight="bold">
                            Inconnu - Compte tableau de bord non créé à ce jour
                          </Text>
                        ))}
                    </Box>
                    {contacts && contacts.length > 0 && (
                      <HStack>
                        <Text>Compte créé le&nbsp;:</Text>
                        <Text fontWeight="bold">{formatDate(new Date(contacts[0].created_at), "dd/MM/yyyy")}</Text>
                      </HStack>
                    )}
                  </>
                )}

                {missionLocale && (
                  <HStack alignItems="flex-start">
                    <Text whiteSpace="nowrap">Mission Locale près de chez vous&nbsp;:</Text>

                    <Flex gap={2}>
                      <Text fontWeight="bold">ML {missionLocale.nom}</Text>

                      <BasicModal
                        renderTrigger={(onOpen) => (
                          <Button
                            variant="link"
                            fontSize="md"
                            borderBottom="1px"
                            borderRadius="0"
                            p="0"
                            width="fit-content"
                            onClick={onOpen}
                          >
                            <Eye mr={1} />
                            Voir le contact
                          </Button>
                        )}
                        title={`Mission Locale ${missionLocale.nom}`}
                        size="4xl"
                      >
                        <Flex gap={3}>
                          <InfoCircle color="plaininfo" w={4} h={4} mt={1} />
                          <Text color="plaininfo" size="zeta">
                            Les Missions Locales peuvent avoir accès au Tableau de bord de l’apprentissage et aux
                            données nominatives des jeunes sans contrat, en rupture de contrat ou en abandon. Dans le
                            cadre de leur mission d’accompagnement des jeunes, elles peuvent être amenées à contacter
                            votre CFA.
                          </Text>
                        </Flex>

                        <Flex direction="column" gap={4}>
                          {missionLocale.localisation && (
                            <Flex
                              direction="column"
                              flexGrow={1}
                              borderLeft="4px solid"
                              borderColor="bluefrance"
                              pl={6}
                              ml={6}
                              my={3}
                            >
                              <Text fontSize="lg">
                                {missionLocale.localisation.adresse}, {missionLocale.localisation.cp}{" "}
                                {missionLocale.localisation.ville}
                              </Text>
                              {missionLocale.contact?.telephone && <Text>{missionLocale.contact.telephone}</Text>}
                              {missionLocale.contact?.email && (
                                <CustomLink href={`mailto:${missionLocale.contact.email}`} isExternal isUnderlined>
                                  {missionLocale.contact.email}
                                </CustomLink>
                              )}
                              {missionLocale.contact?.siteWeb && (
                                <CustomLink href={missionLocale.contact.siteWeb} isExternal isUnderlined>
                                  {missionLocale.contact.siteWeb}
                                </CustomLink>
                              )}
                            </Flex>
                          )}

                          {missionLocale.contactsTDB && missionLocale.contactsTDB.length > 0 && (
                            <>
                              <Text>
                                Les contacts ci-dessous ont créé un compte sur le Tableau de bord de l’apprentissage :
                              </Text>

                              <UnorderedList spacing={3} my={3}>
                                {missionLocale.contactsTDB.map((contactTDB) => (
                                  <ListItem key={contactTDB._id}>
                                    <Flex align="center" gap={2} mb={1}>
                                      <Text fontWeight="bold">
                                        {contactTDB.prenom} {contactTDB.nom}
                                      </Text>

                                      {contactTDB.created_at && (
                                        <Badge variant="purple" borderRadius="full" px={3} py={1} fontSize="sm">
                                          <Flex align="center" gap={1}>
                                            <Icon as={CheckCircleIcon} mr={1} />
                                            Compte créé le {format(new Date(contactTDB.created_at), "dd/MM/yyyy")}
                                          </Flex>
                                        </Badge>
                                      )}
                                    </Flex>
                                    {contactTDB.fonction && <Text>{contactTDB.fonction}</Text>}
                                    {contactTDB.email && (
                                      <CustomLink href={`mailto:${contactTDB.email}`} isExternal isUnderlined>
                                        {contactTDB.email}
                                      </CustomLink>
                                    )}
                                    {contactTDB.telephone && <Text>{contactTDB.telephone}</Text>}
                                  </ListItem>
                                ))}
                              </UnorderedList>
                            </>
                          )}

                          <CustomLink
                            href="https://www.unml.info/le-reseau/annuaire/?type=&nom=&region=&affichage=liste&hp_v=&hp_r=1"
                            isUnderlined
                            isExternal
                            color="blueFrance"
                            w="fit-content"
                          >
                            Annuaire complet des Missions Locales
                          </CustomLink>
                        </Flex>
                      </BasicModal>
                    </Flex>
                  </HStack>
                )}

                {organisme.organismesResponsables && organisme.organismesResponsables.length > 0 && (
                  <HStack alignItems="flex-start">
                    <Text whiteSpace="nowrap">Votre organisme dispense des formations pour&nbsp;:</Text>
                    <VStack alignItems="start">
                      {organisme.organismesResponsables.map((organisme) => (
                        <Link
                          key={organisme._id}
                          href={`https://catalogue-apprentissage.intercariforef.org/etablissement/${organisme?.siret || ""}`}
                          borderBottom="1px"
                          color="action-high-blue-france"
                          _hover={{ textDecoration: "none" }}
                          isExternal
                        >
                          {organisme.enseigne ?? organisme.raison_sociale ?? "Organisme inconnu"}
                        </Link>
                      ))}
                    </VStack>
                  </HStack>
                )}
              </VStack>
              <HStack mt={3}>
                <Text>Voir l&apos;établissement sur :</Text>
                <ExternalLinks
                  search={organisme.siret}
                  siret={organisme.siret}
                  fontSize={"omega"}
                  display="inline-block"
                  isAdmin={organisationType === "ADMINISTRATEUR"}
                />
              </HStack>
              {!isFiable && <FiabilisationInfo />}
              {/* Infos Transmission / Paramétrage pour les administrateurs */}
              {organisationType === "ADMINISTRATEUR" && (
                <InfosTransmissionEtParametrageOFA mt="2w" organisme={organisme} />
              )}
            </Box>
            {!modePublique && (
              <Box flex={1}>
                <CerfaLink organisme={organisme} />
              </Box>
            )}
          </HStack>
        </Container>
      </Box>

      <Container maxW="xl" p="8">
        {organisme.permissions?.indicateursEffectifs ? (
          <>
            <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
              Aperçu de {modePublique ? "ses" : "vos"} indicateurs
              {hasOrganismesFormateurs && " et établissements"}
              <Text fontSize="gamma" as="span" ml="2">
                (année scolaire 2024-2025)
              </Text>
            </Heading>
            {!modePublique && duplicates && duplicates?.totalItems > 0 && (
              <BandeauDuplicatsEffectifs totalItems={duplicates?.totalItems} />
            )}

            <NotificationTransmissionError organisme={organisme} />

            {indicateursEffectifsPartielsMessage && (
              <Ribbons variant="warning" mt="0.5rem">
                <Text color="grey.800">
                  Veuillez noter que certaines formations gérées par cet organisme se situent en dehors de votre{" "}
                  {indicateursEffectifsPartielsMessage}, ce qui peut expliquer l’affichage partiel de données.
                </Text>
              </Ribbons>
            )}

            {!modePublique && !organisme.is_transmission_target && (
              <Ribbons variant="warning" mt="0.5rem">
                <Text color="grey.800">
                  Votre établissement ne transmet pas encore ses effectifs. Les indicateurs ci-dessous sont issus de
                  DECA (DEpôts des Contrats d’Alternance) et peuvent ne pas refléter la réalité actuelle. Pour afficher
                  des effectifs à jour, veuillez{" "}
                  <Link as={NextLink} href="/parametres" variant="link" ml="auto">
                    paramétrer
                  </Link>{" "}
                  votre moyen de transmission. Lire la FAQ{" "}
                  <Link href={CRISP_FAQ} variant="link" ml="auto" isExternal>
                    “Comment transmettre ?”
                  </Link>
                </Text>
              </Ribbons>
            )}

            {aucunEffectifTransmis &&
              indicateursEffectifs &&
              Object.values(indicateursEffectifs).every((value) => value === 0) && (
                <BandeauTransmission organisme={organisme} modePublique={modePublique} modeIndicateurs />
              )}

            {indicateursEffectifs && (
              <IndicateursGrid indicateursEffectifs={indicateursEffectifs} loading={indicateursEffectifsLoading} />
            )}

            {aucunEffectifTransmis ? (
              !modePublique &&
              (!organisme.mode_de_transmission ? (
                <Link href="/parametres" variant="whiteBg" display="block" ml="auto" width="fit-content">
                  Paramétrer un moyen de transmission
                </Link>
              ) : (
                organisme.mode_de_transmission === "MANUEL" && (
                  <Link href="/effectifs/televersement" variant="whiteBg" display="block" ml="auto" width="fit-content">
                    Ajouter via fichier Excel
                  </Link>
                )
              ))
            ) : (
              <Link
                href={`${modePublique ? `/organismes/${organisme._id}` : ""}/indicateurs`}
                variant="whiteBg"
                display="block"
                ml="auto"
                width="fit-content"
              >
                Voir les indicateurs
              </Link>
            )}

            {organisme.organismesFormateurs && organisme.organismesFormateurs.length > 0 && (
              <>
                <Box bg="galt" py="8" px="12" mt="8">
                  <Heading as="h3" color="#3558A2" fontSize="delta" fontWeight="700" mb={3}>
                    Nombre d’organismes de formation rattachés à {modePublique ? "cet" : "votre"} établissement
                  </Heading>

                  <Text fontSize="zeta">
                    Répartition des OFA par statut de transmission des effectifs au tableau de bord
                  </Text>

                  <Divider size="md" my={4} borderBottomWidth="2px" opacity="1" />

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

                      <DownloadButton
                        variant="secondary"
                        action={async () => {
                          const organismes = await _get<Organisme[]>(`/api/v1/organismes/${organisme._id}/organismes`);
                          exportDataAsXlsx(
                            `tdb-organismes-non-transmetteurs-${formatDate(new Date(), "dd-MM-yy")}.xlsx`,
                            organismes
                              .filter((organisme) => !organisme.last_transmission_date)
                              .map((organisme) => convertOrganismeToExport(organisme)),
                            organismesExportColumns
                          );
                        }}
                      >
                        Télécharger la liste des organismes qui ne transmettent pas
                      </DownloadButton>
                    </VStack>

                    <Box flex="1" minH="250px">
                      <Pie data={indicateursOrganismesPieData} />
                    </Box>
                  </Flex>
                </Box>

                <Button
                  size="md"
                  variant="secondary"
                  display="block"
                  ml="auto"
                  mt="8"
                  onClick={() => {
                    router.push(`${modePublique ? `/organismes/${organisme._id}` : ""}/organismes`);
                  }}
                >
                  Voir la liste complète
                </Button>
              </>
            )}

            {!modePublique && aucunEffectifTransmis && (
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
                      Vous permettez aux acteurs publics de piloter les politiques publiques en ayant une meilleure
                      vision de la situation de l’apprentissage au national et sur les territoires.
                    </Text>

                    <Link
                      href={CRISP_FAQ}
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
                      Vous contribuez à l’identification des jeunes en difficulté afin qu’ils soient accompagnés au
                      meilleur moment.
                    </Text>

                    <Link
                      href="https://mission-apprentissage.notion.site/Guide-des-donn-es-57bc2515bac34cee9359e517a504df20"
                      isExternal
                      borderBottom="1px"
                      color="action-high-blue-france"
                      _hover={{ textDecoration: "none" }}
                      display="inline-flex"
                      alignItems="center"
                      mt="3"
                    >
                      <FileDownloadIcon mr="2" />
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
                        href="/politique-de-confidentialite"
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

            {organisme?.permissions?.indicateursEffectifs &&
              formationsAvecIndicateurs &&
              formationsAvecIndicateurs.length > 0 && (
                <>
                  <Divider size="md" my={8} />
                  <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
                    Répartition des effectifs par niveau et formations
                  </Heading>
                  <IndicateursEffectifsParFormationTable formations={formationsAvecIndicateurs} />
                </>
              )}

            <SuggestFeature />
          </>
        ) : (
          <Ribbons variant="warning" mt="0.5rem">
            <Text color="grey.800">{getForbiddenErrorText(auth)}</Text>
          </Ribbons>
        )}
      </Container>
    </Box>
  );
};

export default withAuth(DashboardOrganisme);

function getForbiddenErrorText(ctx: AuthContext): string {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION":
      return "Vous n’avez pas accès aux données de cet organisme.";

    case "TETE_DE_RESEAU":
      return "Vous n’avez pas accès aux données de cet organisme car il n’est pas dans votre réseau.";

    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DRAFPIC":
      return "Vous n'avez pas accès aux données de cet organisme car il n'est pas dans votre région.";
    case "ACADEMIE":
      return "Vous n’avez pas accès aux données de cet organisme car il n’est pas dans votre académie.";
  }
  return "";
}

/**
 * Retourne le type de restriction sous forme de label si l'organisme contient au moins un organisme formateur en dehors du territoire / réseau
 * de l'utilisateur authentifié.
 */
function getIndicateursEffectifsPartielsMessage(ctx: AuthContext, organisme: Organisme): false | string {
  if (!organisme || !organisme.organismesFormateurs || organisme.organismesFormateurs.length === 0) {
    return false;
  }

  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      return false;
    }

    case "TETE_DE_RESEAU":
      return (
        organisme.organismesFormateurs.some((organisme) => !organisme.reseaux?.includes(organisation.reseau)) &&
        "réseau"
      );

    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DRAFPIC":
      return (
        organisme.organismesFormateurs.some((organisme) => !organisme.region?.includes(organisation.code_region)) &&
        "région"
      );
    case "ACADEMIE":
      return (
        organisme.organismesFormateurs.some((organisme) => !organisme.academie?.includes(organisation.code_academie)) &&
        "académie"
      );

    case "ADMINISTRATEUR":
      return false;
    default:
      return false;
  }
}

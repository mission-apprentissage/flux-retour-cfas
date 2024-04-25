import { ArrowForwardIcon, ViewIcon, ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
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
  Tooltip,
  UnorderedList,
  VStack,
  Wrap,
  Link,
  Collapse,
} from "@chakra-ui/react";
import { PieCustomLayerProps, ResponsivePie } from "@nivo/pie";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import {
  natureOrganismeDeFormationLabel,
  TETE_DE_RESEAUX_BY_ID,
  IndicateursEffectifs,
  IndicateursEffectifsAvecFormation,
  IndicateursOrganismes,
  IOrganisationCreate,
  REFERENTIEL_ONISEP,
  CARIF_OREF,
  CATALOGUE_APPRENTISSAGE,
  ANNUAIRE_ENTREPRISE,
  STATUT_FIABILISATION_ORGANISME,
} from "shared";

import { convertOrganismeToExport, organismesExportColumns } from "@/common/exports";
import { _get, _post } from "@/common/httpClient";
import { AuthContext } from "@/common/internal/AuthContext";
import { Organisme } from "@/common/internal/Organisme";
import { User } from "@/common/internal/User";
import { formatDate } from "@/common/utils/dateUtils";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import { formatCivility, formatSiretSplitted } from "@/common/utils/stringUtils";
import DownloadButton from "@/components/buttons/DownloadButton";
import CerfaLink from "@/components/Cerfa/CerfaLink";
import Ribbons from "@/components/Ribbons/Ribbons";
import SuggestFeature from "@/components/SuggestFeature/SuggestFeature";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import { DashboardWelcome } from "@/theme/components/icons/DashboardWelcome";

import InfosTransmissionEtParametrageOFA from "../admin/InfosTransmissionEtParametrageOFA";
import { ExternalLinks } from "../admin/OrganismeDetail";
import BandeauTransmission from "../organismes/BandeauTransmission";
import IndicateursEffectifsParFormationTable from "../organismes/IndicateursEffectifsParFormationTable";
import InfoFiabilisationOrganisme from "../organismes/InfoFiabilisationOrganisme";
import InfoTransmissionDonnees from "../organismes/InfoTransmissionDonnees";

import ContactsModal from "./ContactsModal";
import { FileDownloadIcon } from "./icons";
import IndicateursGrid from "./IndicateursGrid";

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
              Si votre UAI est affiché comme “Inconnu”, veuillez signaler votre numéro et sa fiche en adressant un
              courriel à{" "}
              <Link
                href={`mailto:referentiel-uai-siret@onisep.fr`}
                target="_blank"
                textDecoration="underline"
                isExternal
                whiteSpace="nowrap"
              >
                referentiel-uai-siret@onisep.fr
              </Link>{" "}
              pour qu’il soit mis à jour sur le{" "}
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
                Catalogue de l’apprentissage
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
    <>
      <Text>Organismes responsables</Text>
      <UnorderedList mt={4}>
        <ListItem>
          Ne dispense pas de formation mais délègue à des organismes responsable et formateur ou uniquement formateur ;
        </ListItem>
        <ListItem>
          Est signataire de la convention de formation ; Demande et reçoit les financements de l’OPCO ;
        </ListItem>
        <ListItem>Est responsable auprès de l’administration du respect de ses missions et obligations ;</ListItem>
        <ListItem>
          Est titulaire de la certification qualité en tant que CFA et est garant du respect des critères qualité au
          sein de l’UFA.
        </ListItem>
      </UnorderedList>
    </>
  ),
  formateur: (
    <>
      <Text>Organismes formateurs</Text>
      <UnorderedList mt={4}>
        <ListItem>
          Dispense des actions de formation par apprentissage déclaré auprès des services de l’Etat (n° de déclaration
          d’activité (NDA))
        </ListItem>
      </UnorderedList>
    </>
  ),
  responsable_formateur: (
    <>
      <Text>Organismes responsables et formateurs</Text>
      <UnorderedList mt={4}>
        <ListItem>
          Dispense des actions de formation par apprentissage déclaré auprès des services de l’Etat (n° de déclaration
          d’activité (NDA)) ;
        </ListItem>
        <ListItem>Est signataire de la convention de formation ;</ListItem>
        <ListItem>Demande et reçoit les financements de l’OPCO ;</ListItem>
        <ListItem>Est responsable auprès de l’administration du respect de ses missions et obligations ;</ListItem>
        <ListItem>
          Est titulaire de la certification qualité en tant que CFA et est garant du respect des critères qualité au
          sein de l’UFA.
        </ListItem>
      </UnorderedList>
    </>
  ),
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

  const { data: contacts } = useQuery<User[]>(
    ["organismes", organisme?._id, "contacts"],
    () => _get(`/api/v1/organismes/${organisme._id}/contacts`),
    {
      enabled: !!organisme?._id && modePublique,
    }
  );

  const { data: indicateursEffectifs, isLoading: indicateursEffectifsLoading } = useQuery<IndicateursEffectifs>(
    ["organismes", organisme?._id, "indicateurs/effectifs"],
    () =>
      _get(`/api/v1/organismes/${organisme._id}/indicateurs/effectifs`, {
        params: {
          date: new Date(),
        },
      }),
    {
      enabled: !!organisme?._id && organisme?.permissions?.indicateursEffectifs,
    }
  );

  const { data: indicateursOrganismes } = useQuery<IndicateursOrganismes>(
    ["organismes", organisme?._id, "indicateurs/organismes"],
    () => _get(`/api/v1/organismes/${organisme._id}/indicateurs/organismes`),
    {
      enabled: !!organisme?._id,
    }
  );

  const { data: formationsAvecIndicateurs } = useQuery<IndicateursEffectifsAvecFormation[]>(
    ["organismes", organisme?._id, "indicateurs/effectifs/par-formation"],
    async () =>
      _get(`/api/v1/organismes/${organisme._id}/indicateurs/effectifs/par-formation`, {
        params: {
          date: new Date(),
        },
      }),
    {
      enabled: !!organisme?._id && organisme?.permissions?.indicateursEffectifs,
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

  const hasOrganismesFormateurs = organisme.organismesFormateurs && organisme.organismesFormateurs?.length > 0;
  const hasResponsabilitePartielle =
    organisationType === "ORGANISME_FORMATION" &&
    organisme.organismesResponsables?.some((o) => o.responsabilitePartielle);
  const indicateursEffectifsPartielsMessage =
    organisme.permissions?.indicateursEffectifs && getIndicateursEffectifsPartielsMessage(auth, organisme);

  const isFiable = organisme.fiabilisation_statut === STATUT_FIABILISATION_ORGANISME.FIABLE;

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
        {/* Fix temporaire https://www.notion.so/mission-apprentissage/Permission-CNAM-PACA-305ab62fb1bf46e4907180597f6a57ef */}
        {hasResponsabilitePartielle && (
          <Container maxW="xl" p="8">
            <Ribbons variant="warning">
              <Text color="grey.800">
                Nous fiabilisons les effectifs rattachés aux organismes avec lesquels vous êtes en relation en tant que
                responsable ou responsable formateur. A cette fin nous sommes entrain de rattacher les effectifs aux
                formations telles qu’elles sont déclarées au niveau du{" "}
                <Link
                  href="https://catalogue-apprentissage.intercariforef.org/"
                  target="_blank"
                  borderBottom="1px"
                  _hover={{ textDecoration: "none" }}
                >
                  catalogue des formations en apprentissage
                </Link>
                .
                <br />
                <Link
                  href="https://tableaudebord-apprentissage.atlassian.net/servicedesk/customer/portal/3/group/8/create/64"
                  target="_blank"
                  borderBottom="1px"
                  _hover={{ textDecoration: "none" }}
                >
                  Lien vers le support
                </Link>
              </Text>
            </Ribbons>
          </Container>
        )}
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
                Bienvenue sur{" "}
                {modePublique
                  ? "le tableau de bord de"
                  : `votre espace, ${formatCivility(auth.civility)} ${auth.prenom} ${auth.nom}`}
              </Heading>

              <HStack mt="4" gap="4" alignItems="center">
                <Text color="bluefrance" fontWeight={700} textTransform="uppercase">
                  {organisme.enseigne || organisme.raison_sociale || "Organisme inconnu"}
                </Text>
                {organisme.permissions?.infoTransmissionEffectifs && (
                  <InfoTransmissionDonnees
                    modeBadge={true}
                    lastTransmissionDate={organisme.last_transmission_date}
                    permissionInfoTransmissionEffectifs={organisme.permissions?.infoTransmissionEffectifs}
                  />
                )}
                {organisme.fiabilisation_statut && (
                  <InfoFiabilisationOrganisme fiabilisationStatut={organisme.fiabilisation_statut} />
                )}
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
                    <Badge
                      fontSize="epsilon"
                      textColor="grey.800"
                      textTransform="none"
                      paddingX="1w"
                      paddingY="2px"
                      backgroundColor="#ECEAE3"
                    >
                      {organisme.uai || "Inconnue"}
                      {!organisme.uai && (
                        <Tooltip
                          background="bluefrance"
                          color="white"
                          label={
                            <Box padding="2w">
                              <Text>
                                <strong>Votre UAI est inconnue</strong>
                              </Text>
                              <UnorderedList mt={4}>
                                <ListItem>
                                  Si votre Unité Administrative Immatriculée (UAI) est répertoriée comme
                                  «&nbsp;Inconnue&nbsp;» alors que votre organisme en possède une, veuillez nous la
                                  communiquer en cliquant sur le lien <i>«&nbsp;Signaler une anomalie&nbsp;»</i>{" "}
                                  ci-dessous. L’absence de ce numéro bloque l’enregistrement des contrats
                                  d’apprentissage. L’UAI est recommandée pour être reconnu OFA.
                                </ListItem>
                                <ListItem>
                                  Si votre organisme ne possède pas encore d’UAI, veuillez vous adresser auprès des
                                  services du rectorat de l’académie où se situe votre CFA. Plus d’informations dans la
                                  page d’Aide et FAQ.
                                </ListItem>
                              </UnorderedList>
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
                      )}
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
                      {natureOrganismeDeFormationLabel[organisme.nature] === "Inconnue" && (
                        <Tooltip
                          background="bluefrance"
                          color="white"
                          label={
                            <Box padding="2w">
                              <Text>
                                <strong>Votre Nature est inconnue</strong>
                              </Text>
                              <Text mt="2w">
                                Si votre organisme a pour nature «&nbsp;Inconnue&nbsp;», cela signifie que l’offre de
                                formation n’est pas collectée ou mal référencée par le Carif-Oref. Adressez-vous auprès
                                de votre Carif-Oref régional pour renseigner cette donnée. Veuillez noter que la
                                modification de la nature d’un organisme impacte ses relations avec les autres
                                organismes.
                              </Text>
                              <Link
                                textDecoration={"underline"}
                                isExternal
                                href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                              >
                                En savoir plus sur la démarche.
                              </Link>
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
                      )}
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
                      <Text>Prépa-apprentissage&nbsp;:</Text>
                      <Badge
                        fontSize="epsilon"
                        textColor="grey.800"
                        paddingX="1w"
                        paddingY="2px"
                        backgroundColor="#ECEAE3"
                        textTransform="none"
                      >
                        {organisme.prepa_apprentissage ? "Oui" : "Non"}
                        <Tooltip
                          background="bluefrance"
                          color="white"
                          label={
                            <Box padding="2w">
                              La prépa-apprentissage, proposée (ou non) par un organisme de formation, est un parcours
                              d’accompagnement, pouvant aller de quelques jours à plusieurs mois. Il aide le jeune
                              bénéficiaire à définir son projet d’apprentissage.
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
                </Wrap>

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

                {organisme.organismesResponsables && organisme.organismesResponsables.length > 0 && (
                  <HStack alignItems="flex-start">
                    <Text whiteSpace="nowrap">
                      Organisme{organisme.organismesResponsables.length > 1 ? "s" : ""} responsable
                      {organisme.organismesResponsables.length > 1 ? "s" : ""} identifié
                      {organisme.organismesResponsables.length > 1 ? "s" : ""}&nbsp;:
                    </Text>
                    <VStack alignItems="start">
                      {organisme.organismesResponsables.map((organisme) => (
                        <Link
                          key={organisme._id}
                          href={`/organismes/${organisme._id}`}
                          borderBottom="1px"
                          color="action-high-blue-france"
                          _hover={{ textDecoration: "none" }}
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
              Aperçu de {modePublique ? "ses" : "vos"} effectifs
              {hasOrganismesFormateurs && " et établissements"}
              <Text fontSize="gamma" as="span" ml="2">
                (année scolaire 2023-2024)
              </Text>
            </Heading>
            {indicateursEffectifsPartielsMessage && (
              <Ribbons variant="warning" mt="0.5rem">
                <Text color="grey.800">
                  <>
                    Veuillez noter que certaines formations gérées par cet organisme se situent en dehors de votre{" "}
                    {indicateursEffectifsPartielsMessage}, ce qui peut expliquer l’affichage partiel de données.
                  </>
                </Text>
              </Ribbons>
            )}

            {aucunEffectifTransmis && (
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

export function getForbiddenErrorText(ctx: AuthContext): string {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION":
      return "Vous n’avez pas accès aux données de cet organisme.";

    case "TETE_DE_RESEAU":
      return "Vous n’avez pas accès aux données de cet organisme car il n’est pas dans votre réseau.";

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DRAFPIC":
      return "Vous n’avez pas accès aux données de cet organisme car il n’est pas dans votre région.";
    case "DDETS":
      return "Vous n’avez pas accès aux données de cet organisme car il n’est pas dans votre département.";
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

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DRAFPIC":
      return (
        organisme.organismesFormateurs.some((organisme) => !organisme.region?.includes(organisation.code_region)) &&
        "région"
      );
    case "DDETS":
      return (
        organisme.organismesFormateurs.some(
          (organisme) => !organisme.departement?.includes(organisation.code_departement)
        ) && "département"
      );
    case "ACADEMIE":
      return (
        organisme.organismesFormateurs.some((organisme) => !organisme.academie?.includes(organisation.code_academie)) &&
        "académie"
      );

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
      return false;
    case "ADMINISTRATEUR":
      return false;
  }
}

import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import {
  Center,
  Heading,
  Spinner,
  Box,
  Flex,
  Text,
  HStack,
  Switch,
  Container,
  FormControl,
  FormLabel,
  UnorderedList,
  ListItem,
  Grid,
  Image,
  Collapse,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import groupBy from "lodash.groupby";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { DuplicateEffectifGroupPagination, getSIFADate, SIFA_GROUP } from "shared";

import { _get, _getBlob } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { downloadObject } from "@/common/utils/browser";
import ButtonTeleversement from "@/components/buttons/ButtonTeleversement";
import DownloadButton from "@/components/buttons/DownloadButton";
import Link from "@/components/Links/Link";
import SupportLink from "@/components/Links/SupportLink";
import { BasicModal } from "@/components/Modals/BasicModal";
import Ribbons from "@/components/Ribbons/Ribbons";
import { organismeAtom } from "@/hooks/organismeAtoms";
import { usePlausibleTracking } from "@/hooks/plausible";
import useToaster from "@/hooks/useToaster";
import BandeauDuplicatsEffectifs from "@/modules/effectifs/BandeauDuplicatsEffectifs";
import { effectifsStateAtom, effectifFromDecaAtom } from "@/modules/mon-espace/effectifs/engine/atoms";
import EffectifTableContainer from "@/modules/mon-espace/effectifs/engine/EffectifTableContainer";
import { Input } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";
import InfoTeleversementSIFA from "@/modules/organismes/InfoTeleversementSIFA";
import { DownloadLine, ExternalLinkLine } from "@/theme/components/icons";
import Eye from "@/theme/components/icons/Eye";

function useOrganismesEffectifs(organismeId: string) {
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);
  const queryClient = useQueryClient();
  const prevOrganismeId = useRef<string | null>(null);
  const setEffectifFromDecaState = useSetRecoilState(effectifFromDecaAtom);

  useEffect(() => {
    if (prevOrganismeId.current !== organismeId) {
      prevOrganismeId.current = organismeId;
      // FIX ME: reset toutes les queries ?! Cet effect est probablement à supprimer car inutile
      // queryClient.resetQueries("organismesEffectifs", { exact: true });
    }
  }, [queryClient, organismeId]);

  const {
    data: organismesEffectifs,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<any, any>(["organismesEffectifs", organismeId], async () => {
    const { fromDECA, organismesEffectifs } = await _get(`/api/v1/organismes/${organismeId}/effectifs?sifa=true`);
    const newEffectifsState = new Map();
    for (const { id, validation_errors, requiredSifa } of organismesEffectifs as any) {
      newEffectifsState.set(id, { validation_errors, requiredSifa });
    }
    setCurrentEffectifsState(newEffectifsState);
    setEffectifFromDecaState(fromDECA);

    return organismesEffectifs;
  });

  return { isLoading: isFetching || isLoading, organismesEffectifs: organismesEffectifs || [], refetch };
}

interface SIFAPageProps {
  organisme: Organisme;
  modePublique: boolean;
}

const SIFAPage = (props: SIFAPageProps) => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { toastWarning, toastSuccess } = useToaster();
  const organisme = useRecoilValue<any>(organismeAtom);
  const { isLoading, organismesEffectifs, refetch } = useOrganismesEffectifs(organisme._id);
  const [show, setShow] = useState(false);
  const handleToggle = () => {
    setShow(!show);
  };

  const [searchValue, setSearchValue] = useState("");

  const organismesEffectifsGroupedBySco: any = useMemo(
    () => groupBy(organismesEffectifs, "annee_scolaire"),
    [organismesEffectifs]
  );
  const [showOnlyMissingSifa, setShowOnlyMissingSifa] = useState(false);
  const [hasTrackedMissingSifa, setHasTrackedMissingSifa] = useState(false);

  const { data: duplicates } = useQuery(["organismes", props.organisme._id, "duplicates"], () =>
    _get<DuplicateEffectifGroupPagination>(`/api/v1/organismes/${props.organisme?._id}/duplicates`)
  );

  const handleToggleMissingSifaChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!hasTrackedMissingSifa) {
      trackPlausibleEvent("clic_toggle_sifa_données_manquantes");
      setHasTrackedMissingSifa(true);
    }
    setShowOnlyMissingSifa(e.target.checked);
  };

  const handleToastOnSifaDownload = () => {
    const nbEffectifsInvalides = organismesEffectifs.filter((effectif) => effectif.requiredSifa.length > 0).length;

    nbEffectifsInvalides > 0
      ? toastWarning(
          `Parmi les ${organismesEffectifs.length} effectifs que vous avez déclarés, ${nbEffectifsInvalides} d'entre eux ne comportent pas l'ensemble des informations requises pour l'enquête SIFA. Si vous ne les corrigez/complétez pas, votre fichier risque d'être rejeté. Vous pouvez soit les éditer directement sur la plateforme soit modifier votre fichier sur votre ordinateur.`,
          {
            isClosable: true,
            duration: 20000,
          }
        )
      : toastSuccess(
          `Avant de téléverser votre fichier SIFA sur la plateforme dédiée, veuillez supprimer la première ligne d'en-tête.`,
          {
            isClosable: true,
            duration: 20000,
          }
        );
  };

  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner />
      </Center>
    );
  }

  return (
    <Container maxW="xl" p="8">
      <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" alignItems="flex-start">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
          {props.modePublique ? "Son" : "Mon"} Enquête SIFA
        </Heading>

        <HStack gap={4}>
          <SupportLink href={SIFA_GROUP}></SupportLink>
          <DownloadButton
            variant="primary"
            action={async () => {
              trackPlausibleEvent("telechargement_sifa");
              downloadObject(
                await _getBlob(`/api/v1/organismes/${organisme._id}/sifa-export`),
                `tdb-données-sifa-${
                  organisme.enseigne ?? organisme.raison_sociale ?? "Organisme inconnu"
                }-${new Date().toLocaleDateString()}.csv`,
                "text/plain"
              );
              handleToastOnSifaDownload();
            }}
          >
            Télécharger le fichier SIFA
          </DownloadButton>
        </HStack>
      </Flex>

      <Box mt={10} px={14} py={10} bg="galt">
        <Grid templateColumns="1fr" gap={6}>
          <Box>
            <UnorderedList styleType="disc" spacing={3} pl={5}>
              <ListItem>
                <Text>
                  Pour <strong>faciliter</strong> la remontée d’information avec les données demandées par l’enquête
                  SIFA, le Tableau de Bord vous permet de réaliser les contrôles, compléter d’éventuelles données
                  manquantes de vos effectifs et générer un fichier compatible à déposer sur la{" "}
                  <Link
                    variant="link"
                    href="https://sifa.depp.education.fr/login"
                    isExternal
                    aria-label="Plateforme SIFA (nouvelle fenêtre)"
                    plausibleGoal="clic_depot_plateforme_sifa"
                  >
                    plateforme SIFA
                    <ExternalLinkLine w=".7rem" h=".7rem" ml={1} />
                  </Link>
                  .
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  Transmettre vos effectifs au Tableau de bord <strong>ne vous dispense pas</strong> de répondre à
                  l’enquête annuelle SIFA.
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  La date d’observation est fixée au <strong>31 décembre de l’année N</strong> et le portail SIFA
                  permettant la collecte est ouvert début janvier.
                </Text>
              </ListItem>
            </UnorderedList>
            <Flex mt={4} gap={6}>
              <Link
                variant="link"
                href="/InstructionsSIFA_31122024.pdf"
                isExternal
                aria-label="Télécharger le fichier d'instruction SIFA pour 2024 (PDF, 1.5 Mo)"
                plausibleGoal="telechargement_fichier_instruction_sifa"
              >
                Fichier d’instruction SIFA (2024)
                <DownloadLine mb={1} ml={2} fontSize="xs" />
              </Link>
              <BasicModal
                renderTrigger={(onOpen) => (
                  <ButtonTeleversement
                    onClick={(e) => {
                      e.preventDefault();
                      trackPlausibleEvent("televersement_clic_modale_donnees_obligatoires");
                      onOpen();
                    }}
                  >
                    <Eye mr={2} />
                    Les données obligatoires
                  </ButtonTeleversement>
                )}
                title="SIFA : les données obligatoires à renseigner"
                size="4xl"
              >
                <InfoTeleversementSIFA />
              </BasicModal>
            </Flex>
            <Text fontSize="xs" color="mgalt">
              PDF – 1.5 Mo
            </Text>
          </Box>
          <Ribbons variant="info" w="full">
            <Text color="#3A3A3A" fontSize="gamma" fontWeight="bold" mb={4}>
              Quelques conseils sur le fichier SIFA et sa manipulation :
            </Text>
            <Text
              style={{
                color: "#000091",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
                cursor: "pointer",
              }}
              onClick={handleToggle}
              mb={2}
            >
              {" "}
              {!show ? <ChevronDownIcon /> : <ChevronUpIcon />} Voir les détails
            </Text>
            <Collapse in={show}>
              <Text color="grey.800">
                <UnorderedList spacing={2} px={6}>
                  <ListItem>
                    Vérifiez que tous vos apprentis soient bien présents dans le fichier. Si non, téléchargez le fichier
                    et complétez à la main avec vos effectifs manquants.
                  </ListItem>
                  <ListItem>
                    Avant de téléverser votre fichier SIFA sur le portail de la DEPP, veuillez{" "}
                    <strong>supprimer la première ligne</strong> d‘en-tête de colonnes.
                  </ListItem>
                  <ListItem>
                    <strong>Attention ! Si vous ouvrez le fichier avec Excel</strong>, veuillez le sauvegarder (Fichier
                    &gt; Enregistrer sous) au format{" "}
                    <BasicModal
                      triggerType="link"
                      button="CSV (délimiteur point-virgule)"
                      title="Format CSV (délimiteur point-virgule)"
                      size="6xl"
                    >
                      <Image
                        src="/images/CSV-delimiter.png"
                        alt="CSV Delimiter"
                        width="100%"
                        maxWidth="100%"
                        objectFit="cover"
                      />
                    </BasicModal>{" "}
                    après suppression de la première ligne pour assurer la compatibilité avec l‘enquête SIFA.
                  </ListItem>
                  <ListItem>
                    L’enquête SIFA sera terminée dès lors que le fichier est accepté par la plateforme SIFA.
                  </ListItem>
                  <ListItem>
                    En cas de difficultés ou questions, veuillez lire la{" "}
                    <Link
                      href={
                        "https://aide.cfas.apprentissage.beta.gouv.fr/fr/category/organisme-de-formation-cfa-fhh03f/"
                      }
                      textDecoration={"underline"}
                      isExternal
                      plausibleGoal="clic_sifa_faq"
                    >
                      FAQ dédiée
                    </Link>
                    .
                  </ListItem>
                </UnorderedList>
              </Text>
            </Collapse>
          </Ribbons>
        </Grid>
      </Box>

      <Box mt={10}>
        <Text fontWeight="bold">
          Vous avez {organismesEffectifs.length} effectifs au total, en contrat au 31 décembre{" "}
          {getSIFADate(new Date()).getUTCFullYear()}.
        </Text>
        <HStack justifyContent="space-between" mt={6}>
          <Input
            name="search_effectifs"
            placeholder="Rechercher un apprenant..."
            fieldType="text"
            mask="C"
            maskBlocks={[
              {
                name: "C",
                mask: "Pattern",
                pattern: "^.*$",
              },
            ]}
            onSubmit={(value) => setSearchValue(value.trim())}
            value={searchValue}
            w="35%"
            mb={0}
          />

          <FormControl w="auto" display="flex" alignItems="center">
            <Switch
              id="show-only-incomplete-toggle"
              variant="icon"
              isChecked={showOnlyMissingSifa}
              onChange={handleToggleMissingSifaChange}
              mr={2}
            />
            <FormLabel htmlFor="show-only-incomplete-toggle" mb="0" mr="0" cursor="pointer">
              Afficher uniquement les données manquantes pour SIFA
            </FormLabel>
          </FormControl>
        </HStack>
      </Box>

      {!props.modePublique && duplicates && duplicates?.totalItems > 0 && (
        <Box mt={10}>
          <BandeauDuplicatsEffectifs totalItems={duplicates?.totalItems} />
        </Box>
      )}

      <Box mt={10} mb={16}>
        {Object.entries(organismesEffectifsGroupedBySco).map(([anneSco, orgaE]: [string, any]) => {
          const orgaEffectifs = showOnlyMissingSifa ? orgaE.filter((ef) => ef.requiredSifa.length) : orgaE;
          const effectifsByCfd = groupBy(orgaEffectifs, "formation.cfd");
          return (
            <Box key={anneSco} mb={5}>
              <Text>
                {anneSco} {!searchValue ? `- ${orgaEffectifs.length} apprenant(es) total` : ""}
              </Text>
              <Box p={4} style={{ borderColor: "dgalt", borderWidth: 1 }}>
                {Object.entries(effectifsByCfd).map(([cfd, effectifs]: [string, any[]]) => {
                  const { formation } = effectifs[0];
                  return (
                    <EffectifTableContainer
                      key={anneSco + cfd}
                      tableId={anneSco + cfd}
                      canEdit={true}
                      effectifs={effectifs}
                      formation={formation}
                      searchValue={searchValue}
                      modeSifa={true}
                      refetch={refetch}
                    />
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Container>
  );
};

export default SIFAPage;

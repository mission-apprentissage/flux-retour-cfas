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
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import groupBy from "lodash.groupby";
import router from "next/router";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { getSIFADate } from "shared";

import { _get, _getBlob } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { downloadObject } from "@/common/utils/browser";
import DownloadButton from "@/components/buttons/DownloadButton";
import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";
import { organismeAtom } from "@/hooks/organismeAtoms";
import { usePlausibleTracking } from "@/hooks/plausible";
import useToaster from "@/hooks/useToaster";
import { effectifsStateAtom } from "@/modules/mon-espace/effectifs/engine/atoms";
import EffectifsTable from "@/modules/mon-espace/effectifs/engine/EffectifsTable";
import { Input } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";
import { DownloadLine, ExternalLinkLine } from "@/theme/components/icons";
import { DoubleChevrons } from "@/theme/components/icons/DoubleChevrons";

function useOrganismesEffectifs(organismeId: string) {
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);
  const queryClient = useQueryClient();
  const prevOrganismeId = useRef<string | null>(null);

  useEffect(() => {
    if (prevOrganismeId.current !== organismeId) {
      prevOrganismeId.current = organismeId;
      // FIX ME: reset toutes les queries ?! Cet effect est probablement à supprimer car inutile
      // queryClient.resetQueries("organismesEffectifs", { exact: true });
    }
  }, [queryClient, organismeId]);

  const { data, isLoading, isFetching } = useQuery<any, any>(["organismesEffectifs", organismeId], async () => {
    const organismesEffectifs = await _get(`/api/v1/organismes/${organismeId}/effectifs?sifa=true`);
    const newEffectifsState = new Map();
    for (const { id, validation_errors, requiredSifa } of organismesEffectifs as any) {
      newEffectifsState.set(id, { validation_errors, requiredSifa });
    }
    setCurrentEffectifsState(newEffectifsState);
    return organismesEffectifs;
  });

  return { isLoading: isFetching || isLoading, organismesEffectifs: data || [] };
}

const EffectifsTableContainer = ({ effectifs, formation, canEdit, searchValue, ...props }) => {
  const [count, setCount] = useState(effectifs.length);
  return (
    <Box {...props}>
      {count !== 0 && (
        <HStack>
          <DoubleChevrons />
          <Text fontWeight="bold" textDecoration="underline">
            {formation.libelle_long}
          </Text>
          <Text>
            [Code diplôme {formation.cfd}] - [Code RNCP {formation.rncp}]
          </Text>
        </HStack>
      )}
      <EffectifsTable
        canEdit={canEdit}
        organismesEffectifs={effectifs}
        searchValue={searchValue}
        onCountItemsChange={(count) => setCount(count)}
        modeSifa
      />
    </Box>
  );
};

interface SIFAPageProps {
  organisme: Organisme;
  modePublique: boolean;
}

const SIFAPage = (props: SIFAPageProps) => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { toastWarning, toastSuccess } = useToaster();
  const organisme = useRecoilValue<any>(organismeAtom);
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs(organisme._id);

  const [searchValue, setSearchValue] = useState("");

  const organismesEffectifsGroupedBySco: any = useMemo(
    () => groupBy(organismesEffectifs, "annee_scolaire"),
    [organismesEffectifs]
  );
  const [showOnlyMissingSifa, setShowOnlyMissingSifa] = useState(false);
  const [hasTrackedMissingSifa, setHasTrackedMissingSifa] = useState(false);

  const { data: duplicates } = useQuery(["organismes", props.organisme._id, "duplicates"], () =>
    _get<Organisme[]>(`/api/v1/organismes/${props.organisme?._id}/duplicates`)
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
        <DownloadButton
          variant="secondary"
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
      </Flex>

      <Box mt={10} px={14} py={10} bg="galt">
        <HStack gap={10}>
          <Box flex="7">
            <Text>
              <UnorderedList>
                <ListItem>
                  Pour <strong>faciliter</strong> la remontée d’information avec les données demandées par l’enquête
                  SIFA, le tableau de bord vous permet de réaliser les contrôles, compléter les éventuelles données
                  manquantes et générer un fichier compatible à déposer sur la{" "}
                  <Link
                    variant="link"
                    href="https://sifa.depp.education.fr/login"
                    isExternal
                    plausibleGoal="clic_depot_plateforme_sifa"
                  >
                    plateforme SIFA
                    <ExternalLinkLine w=".7rem" h=".7rem" ml={1} />
                  </Link>
                  .
                </ListItem>
                <ListItem>
                  La remontée SIFA est <strong>annuelle</strong>. La date d’observation est fixée au{" "}
                  <strong>31 décembre de l’année N</strong> et l’ouverture de l’application permettant la collecte est
                  prévue début janvier.
                </ListItem>
              </UnorderedList>
            </Text>
            <Link
              variant="link"
              href="/InstructionsSIFA_31122023.pdf"
              mt={4}
              isExternal
              plausibleGoal="telechargement_fichier_instruction_sifa"
            >
              Fichier d’instruction SIFA (2023)
              <DownloadLine mb={1} ml={2} fontSize="xs" />
            </Link>
            <Text fontSize="xs" color="mgalt">
              PDF – 1.5 Mo
            </Text>
          </Box>

          <Ribbons variant="info" flex="3">
            <Text color="#3A3A3A" fontSize="gamma" fontWeight="bold">
              Attention
            </Text>
            <Text color="grey.800">
              Avant de téléverser votre fichier SIFA sur le portail dédié de la DEPP, veuillez supprimer la première
              ligne d’en-tête.
            </Text>
          </Ribbons>
        </HStack>
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

      {duplicates && duplicates?.length > 0 && (
        <Ribbons variant="alert" my={6}>
          <Box ml={3}>
            <Text color="grey.800" fontSize="1.1rem" fontWeight="bold" mr={6} mb={4}>
              Nous avons détecté {duplicates?.length} duplicat{duplicates?.length > 1 ? "s" : ""} pour l’année scolaire
              en cours.
            </Text>

            <Link
              variant="whiteBg"
              href={`${router.asPath.replace("enquete-sifa", "effectifs")}/doublons`}
              plausibleGoal="clic_verifier_doublons_effectifs"
            >
              Vérifier
            </Link>
          </Box>
        </Ribbons>
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
                {Object.entries(effectifsByCfd).map(([cfd, effectifs]: [string, any[]], i) => {
                  const { formation } = effectifs[0];
                  return (
                    <EffectifsTableContainer
                      key={anneSco + cfd}
                      canEdit={true}
                      effectifs={effectifs}
                      formation={formation}
                      searchValue={searchValue}
                      {...(i === 0 ? {} : { mt: 14 })}
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

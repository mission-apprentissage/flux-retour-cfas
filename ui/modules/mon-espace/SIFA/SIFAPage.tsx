import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import {
  Box,
  Collapse,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  ListItem,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { DuplicateEffectifGroupPagination, SIFA_GROUP } from "shared";

import { _get, _getBlob } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { downloadObject } from "@/common/utils/browser";
import ButtonTeleversement from "@/components/buttons/ButtonTeleversement";
import DownloadButton from "@/components/buttons/DownloadButton";
import Link from "@/components/Links/Link";
import SupportLink from "@/components/Links/SupportLink";
import { BasicModal } from "@/components/Modals/BasicModal";
import Ribbons from "@/components/Ribbons/Ribbons";
import { usePlausibleTracking } from "@/hooks/plausible";
import useToaster from "@/hooks/useToaster";
import BandeauDuplicatsEffectifs from "@/modules/effectifs/BandeauDuplicatsEffectifs";
import InfoTeleversementSIFA from "@/modules/organismes/InfoTeleversementSIFA";
import { ExternalLinkLine, DownloadLine } from "@/theme/components/icons";
import Eye from "@/theme/components/icons/Eye";

import { effectifsStateAtom, effectifFromDecaAtom } from "../effectifs/engine/atoms";

import { SIFAFilterType } from "./SIFATable/SIFAEffectifsFilterPanel";
import SIFAEffectifsTable from "./SIFATable/SIFAEffectifsTable";

interface SIFAPageProps {
  organisme: Organisme;
  modePublique: boolean;
}

function SIFAPage(props: SIFAPageProps) {
  const router = useRouter();
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { toastWarning, toastSuccess } = useToaster();
  const setEffectifFromDecaState = useSetRecoilState(effectifFromDecaAtom);
  const [currentEffectifsState, setCurrentEffectifsState] = useRecoilState(effectifsStateAtom);
  const [sifaInvalidCount, setSifaInvalidCount] = useState<number>(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<SIFAFilterType>({});
  const [sort, setSort] = useState<SortingState>([{ desc: true, id: "annee_scolaire" }]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const defaultFilterParser = (value) => {
      if (value) {
        const values = Array.isArray(value) ? value : [value];
        try {
          return values.map((v) => {
            const decodedValue = decodeURIComponent(v);
            return decodedValue.startsWith("[") && decodedValue.endsWith("]")
              ? JSON.parse(decodedValue)
              : [decodedValue];
          });
        } catch {
          return values.map((v) => decodeURIComponent(v));
        }
      }
    };
    const parseFilter = (key: string, value: string | string[] | undefined) => {
      switch (key) {
        case "onlySifaMissingFields":
          return value === "true" ? "true" : undefined;
        case "source":
        case "formation_libelle_long":
          return defaultFilterParser(value)?.flat();
        default:
          return undefined;
      }
    };

    const filters: Record<string, string[] | string> = {};

    const filterKeys = ["formation_libelle_long", "source", "onlySifaMissingFields"];

    filterKeys.forEach((key) => {
      const parsedFilter = parseFilter(key, router.query[key]);
      if (parsedFilter) {
        filters[key] = parsedFilter;
      }
    });

    setFilters(filters);
  }, [router.query]);

  const { data, isFetching, refetch } = useQuery(
    ["organismes", props.organisme._id, "effectifs", pagination, search, filters, sort],
    async () => {
      const response = await _get(`/api/v1/organismes/${props.organisme._id}/effectifs`, {
        params: {
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          search,
          sortField: sort[0]?.id,
          sortOrder: sort[0]?.desc ? "desc" : "asc",
          annee_scolaire: ["2024-2025"],
          sifa: true,
          ...filters,
        },
      });

      const { fromDECA, total, filters: returnedFilters, organismesEffectifs } = response;

      setCurrentEffectifsState(
        organismesEffectifs.reduce((acc, { id, validation_errors, requiredSifa }) => {
          acc.set(id, { validation_errors, requiredSifa });
          return acc;
        }, new Map())
      );

      setEffectifFromDecaState(fromDECA);

      return { total, filters: returnedFilters, organismesEffectifs };
    },
    { keepPreviousData: true }
  );

  useEffect(() => {
    const invalidCount = Array.from(currentEffectifsState.values()).filter(
      (effectif) => effectif.requiredSifa.length > 0
    ).length;
    setSifaInvalidCount(invalidCount);
  }, [currentEffectifsState]);

  const { data: duplicates } = useQuery(["organismes", props.organisme._id, "duplicates"], () =>
    _get<DuplicateEffectifGroupPagination>(`/api/v1/organismes/${props.organisme?._id}/duplicates`)
  );

  const handleToggle = () => {
    setShow(!show);
  };

  const handlePaginationChange = (newPagination) => {
    setPagination(newPagination);

    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          pageIndex: newPagination.pageIndex,
          pageSize: newPagination.pageSize,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);

    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, search: value },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleMissingSifaChange = (checked: boolean) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, onlySifaMissingFields: checked },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleFilterChange = (newFilters: SIFAFilterType) => {
    setPagination({ ...pagination, pageIndex: 0 });

    const mergedFilters = {
      ...(newFilters.source && newFilters.source.length && { source: newFilters.source }),
      ...(newFilters.formation_libelle_long &&
        newFilters.formation_libelle_long.length && { formation_libelle_long: newFilters.formation_libelle_long }),
      ...(newFilters.onlySifaMissingFields && { onlySifaMissingFields: newFilters.onlySifaMissingFields }),
    };
    const queryFilters = Object.entries(mergedFilters).reduce(
      (acc, [key, values]) => {
        acc[key] = JSON.stringify(values);
        return acc;
      },
      {} as Record<string, string>
    );

    const updatedQuery = { ...router.query, ...queryFilters };

    if (!updatedQuery.organismeId) {
      updatedQuery.organismeId = router.query.organismeId as string;
    }

    Object.keys(router.query).forEach((key) => {
      if (!queryFilters[key] && key !== "organismeId") {
        delete updatedQuery[key];
      }
    });

    setFilters(mergedFilters);

    router.push(
      {
        pathname: router.pathname,
        query: updatedQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleSortChange = (newSort: SortingState) => {
    setPagination({ ...pagination, pageIndex: 0 });
    setSort(newSort);

    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          sortField: newSort[0]?.id,
          sortOrder: newSort[0]?.desc ? "desc" : "asc",
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const resetFilters = () => {
    setFilters({});
    setSearch("");

    const updatedQuery = {
      organismeId: router.query.organismeId,
    };

    router.push(
      {
        pathname: router.pathname,
        query: updatedQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleToastOnSifaDownload = () => {
    const organismesEffectifs = data?.organismesEffectifs || [];

    sifaInvalidCount > 0
      ? toastWarning(
          `Parmi les ${organismesEffectifs.length} effectifs que vous avez déclarés, ${sifaInvalidCount} d'entre eux ne comportent pas l'ensemble des informations requises pour l'enquête SIFA. Si vous ne les corrigez/complétez pas, votre fichier risque d'être rejeté. Vous pouvez soit les éditer directement sur la plateforme soit modifier votre fichier sur votre ordinateur.`,
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
                await _getBlob(`/api/v1/organismes/${props.organisme._id}/sifa-export`),
                `tdb-données-sifa-${
                  props.organisme.enseigne ?? props.organisme.raison_sociale ?? "Organisme inconnu"
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

      {!props.modePublique && duplicates && duplicates?.totalItems > 0 && (
        <Box mt={10}>
          <BandeauDuplicatsEffectifs totalItems={duplicates?.totalItems} />
        </Box>
      )}

      <Box mt={10} mb={16}>
        <SIFAEffectifsTable
          organisme={props.organisme}
          organismesEffectifs={data?.organismesEffectifs || []}
          filters={filters}
          pagination={pagination}
          search={search}
          sort={sort}
          onPaginationChange={handlePaginationChange}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onSifaMissingFilterChange={handleMissingSifaChange}
          onSortChange={handleSortChange}
          total={data?.total || 0}
          availableFilters={data?.filters || {}}
          resetFilters={resetFilters}
          isFetching={isFetching}
          modeSifa={true}
          canEdit={true}
          refetch={refetch}
        />
      </Box>
    </Container>
  );
}

export default SIFAPage;

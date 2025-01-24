import { Box, Container, Heading, HStack, VStack, Text, Link, Flex, ListItem, UnorderedList } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { IEffectifsFiltersMissionLocale } from "shared/models/routes/mission-locale/missionLocale.api";
import { IPaginationFilters, paginationFiltersSchema } from "shared/models/routes/pagination";
import { z } from "zod";

import { _get } from "@/common/httpClient";
import Accordion from "@/components/Accordion/Accordion";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import ApprenantsTable from "@/modules/mon-espace/apprenants/apprenantsTable/ApprenantsTable";

const DEFAULT_PAGINATION: IPaginationFilters = {
  page: 0,
  limit: 10,
  sort: "statut",
  order: "desc",
};

function EffectifsPage() {
  const router = useRouter();
  const [pagination, setPagination] = useState<IPaginationFilters>(DEFAULT_PAGINATION);
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<IEffectifsFiltersMissionLocale>({
    statut: [],
  });

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
        case "rqth":
        case "mineur":
        case "last_update_value":
        case "last_update_order":
        case "a_risque":
          return value;
        case "statut":
        case "niveaux":
        case "code_insee":
        case "situation":
          return defaultFilterParser(value)?.flat();
        default:
          return undefined;
      }
    };

    const filters: IEffectifsFiltersMissionLocale = {};
    const mergedPagination = { ...pagination };

    const filterKeys = [
      "statut",
      "rqth",
      "mineur",
      "niveaux",
      "code_insee",
      "last_update_value",
      "last_update_order",
      "situation",
      "a_risque",
    ];
    const paginationKeys = ["limit", "page", "order", "sort"];
    const searchFilter = router.query.search;

    filterKeys.forEach((key) => {
      const parsedFilter = parseFilter(key, router.query[key]);
      if (parsedFilter) {
        filters[key] = parsedFilter;
      }
    });

    paginationKeys.forEach((key) => {
      const parsedValue = router.query[key];
      if (parsedValue) {
        mergedPagination[key] = parsedValue;
      }
    });

    if (searchFilter) {
      setSearch(searchFilter as string);
    }

    setFilters(filters);
    const zodPagination = z.object(paginationFiltersSchema).parse(mergedPagination);

    setPagination(zodPagination);
  }, [router.query]);

  const { data: apprenants, isFetching } = useQuery(
    ["apprenants", pagination, search, filters],
    async () => {
      const response = await _get(`/api/v1/organisation/mission-locale/effectifs`, {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          sort: pagination.sort,
          order: pagination.order,
          search,
          ...filters,
        },
      });
      return response;
    },
    { keepPreviousData: true }
  );

  const handleTableChange = (newPagination: IPaginationFilters) => {
    setPagination(newPagination);
    router.push({ pathname: router.pathname, query: { ...router.query, ...newPagination } }, undefined, {
      shallow: true,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    router.push({ pathname: router.pathname, query: { ...router.query, search: value } }, undefined, { shallow: true });
  };

  const handleFilterChange = (newFilters: Record<string, string[]>) => {
    setPagination({ ...pagination, page: 0 });
    setFilters(newFilters);
    router.push({ pathname: router.pathname, query: { ...router.query, ...newFilters } }, undefined, { shallow: true });
  };

  const resetFilters = () => {
    setFilters({});
    setSearch("");
    router.push({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
  };

  return (
    <SimplePage title="Apprenants">
      <Container maxW="xl" p="8">
        <HStack justifyContent="space-between" mb={8}>
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            Apprenants
          </Heading>
        </HStack>
        <VStack spacing={4} alignItems="flex-start" w={2 / 3}>
          <Text>
            Retrouvez ci-dessous les <strong>{apprenants?.pagination.total}</strong> jeunes (identifiés comme inscrit
            sans contrat, en rupture de contrat ou en abandon/sortie d’apprentissage) et leurs coordonnées, susceptibles
            d&apos;être intéressés par une mise en relation et accompagnement avec une Mission Locale. Cliquez sur
            chaque jeune pour plus d’informations sur son parcours.
          </Text>
          <Text fontStyle="italic">
            Sources : CFA et{" "}
            <Link
              isExternal
              textDecoration="underLine"
              color="bluefrance"
              href="https://efpconnect.emploi.gouv.fr/auth/realms/efp/protocol/cas/login?TARGET=https%3A%2F%2Fdeca.alternance.emploi.gouv.fr%3A443%2Fdeca-app%2F"
            >
              DECA
            </Link>
            <InfoTooltip
              popoverWidth="lg"
              headerComponent={() => "Source des effectifs en apprentissage"}
              contentComponent={() => (
                <Box>
                  <Text>Les données affichées sur votre espace proviennent :</Text>
                  <UnorderedList mt={4}>
                    <ListItem>
                      soit des CFA qui partagent leurs effectifs au Tableau de bord (via API ou partage de fichier
                      Excel)
                    </ListItem>
                    <ListItem>
                      soit de la plateforme DECA (DEpôt des Contrats en Alternance) : concerne les effectifs en rupture
                      de contrat ou sèche (abandons).
                    </ListItem>
                  </UnorderedList>
                </Box>
              )}
            />
          </Text>
          <Ribbons variant="alert" showClose>
            <Flex direction="column" ml={3} gap={2} justifyContent="flexstart">
              <Text color="grey.800">
                Nous vous mettons à disposition les contacts des jeunes et leur CFA : vous êtes encouragé à les
                contacter. Ne partagez pas ces listes.
              </Text>
            </Flex>
          </Ribbons>
        </VStack>

        <Box mt={10} mb={16}>
          <ApprenantsTable
            apprenants={apprenants?.data}
            communes={apprenants?.filter}
            filters={filters}
            pagination={pagination}
            search={search}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            onTableChange={handleTableChange}
            total={apprenants?.pagination.total || 0}
            availableFilters={apprenants?.filters || {}}
            resetFilters={resetFilters}
            isFetching={isFetching}
          />
        </Box>
        <Flex gap={12} mt={16} mb={6}>
          <Box flex="3">
            <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
              Informations sur les données exposées ci-dessus
            </Heading>

            <Accordion defaultIndex={undefined} useCustomIcons={true} w={2 / 3}>
              <Accordion.Item title="Qu’est-il attendu des Missions Locales concernant cette mise à disposition des listes ?">
                <Text>
                  L’objectif du Tableau de bord de l’apprentissage est l’accompagnement des jeunes apprenants en
                  difficulté par différents acteurs, dont les Missions Locales. En contactant directement les jeunes,
                  vous qualifiez leur situation, et identifiez potentiellement un accompagnement à mettre en place. Vos
                  remontées sur le Tableau de bord permettent à notre équipe de mesurer l’impact de la plateforme et
                  d’améliorer la qualité des données exposées.
                </Text>
              </Accordion.Item>
              <Accordion.Item title="D’où viennent les données exposées ci-dessus ?">
                <Text>
                  Le Tableau de bord expose les données issues des CFA, qui nous partagent les informations sur leurs
                  apprenants, leur formation et leur statut. Ces données sont envoyées soit par ERP (outil de gestion
                  des effectifs, comme Ypareo), soit téléversement d’un fichier Excel rempli par leurs soins. Nous
                  travaillons chaque jour à récolter plus de données fraîches en connectant les CFA à la plateforme.
                </Text>
              </Accordion.Item>
              <Accordion.Item title="Puis-je partager la liste à des collaborateurs ?">
                <Text>
                  L’accès à cette liste est strictement personnel et ne peut en aucun cas être partagé. Un compte
                  utilisateur unique et nominatif doit être créé sur le Tableau de bord de l’apprentissage pour accéder
                  aux données.
                </Text>
              </Accordion.Item>
            </Accordion>

            {/* <Grid templateColumns="repeat(3, 1fr)" gap={3} bg="galt" mt={6} p={12} borderRadius="md">
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
                    <Link variant="link" display="inline-flex" href={CRISP_FAQ} isExternal width={"fit-content"}>
                      Aide
                      <Box className="ri-arrow-right-line" />
                    </Link>
                    <Link
                      variant="link"
                      display="inline-flex"
                      href="/referencement-organisme"
                      isExternal
                      width={"fit-content"}
                    >
                      Voir la page de référencement
                      <Box className="ri-arrow-right-line" />
                    </Link>
                  </Flex>
                </Flex>
              </GridItem>
            </Grid> */}
          </Box>
        </Flex>
      </Container>
    </SimplePage>
  );
}

export default EffectifsPage;

import { Box, Container, Heading, HStack, VStack, Text, Flex, ListItem, UnorderedList } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { IEffectifsFiltersMissionLocale } from "shared/models/routes/mission-locale/missionLocale.api";
import { IPaginationFilters, paginationFiltersSchema } from "shared/models/routes/pagination";
import { z } from "zod";

import { _get } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Accordion from "@/components/Accordion/Accordion";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import withAuth from "@/components/withAuth";
import ApprenantsTable from "@/modules/mon-espace/apprenants/apprenantsTable/ApprenantsTable";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const DEFAULT_PAGINATION: IPaginationFilters = {
  page: 0,
  limit: 10,
  sort: "statut",
  order: "desc",
};

function EffectifsPage() {
  const router = useRouter();

  const [state, setState] = useState({
    pagination: DEFAULT_PAGINATION,
    search: "",
    filters: { statut: [] } as IEffectifsFiltersMissionLocale,
  });

  useEffect(() => {
    const defaultFilterParser = (value) => {
      if (!value) return;
      const values = Array.isArray(value) ? value : [value];
      try {
        return values
          .map((v) => {
            const decodedValue = decodeURIComponent(v);
            return decodedValue.startsWith("[") && decodedValue.endsWith("]")
              ? JSON.parse(decodedValue)
              : [decodedValue];
          })
          .flat();
      } catch {
        return values.map((v) => decodeURIComponent(v));
      }
    };

    const parseFilter = (key: string, value: string | string[] | undefined) => {
      const directFilters = ["rqth", "mineur", "last_update_value", "last_update_order", "a_risque"];
      const parsedFilters = ["statut", "niveaux", "code_adresse", "situation"];

      if (directFilters.includes(key)) return value;
      if (parsedFilters.includes(key)) return defaultFilterParser(value);
      return undefined;
    };

    const filterKeys = [
      "statut",
      "rqth",
      "mineur",
      "niveaux",
      "code_adresse",
      "last_update_value",
      "last_update_order",
      "situation",
      "a_risque",
    ];
    const paginationKeys = ["limit", "page", "order", "sort"];
    const searchFilter = router.query.search;

    const filters: IEffectifsFiltersMissionLocale = {};
    const updatedPagination = { ...state.pagination };

    filterKeys.forEach((key) => {
      const parsedFilter = parseFilter(key, router.query[key]);
      if (parsedFilter) {
        filters[key] = parsedFilter;
      }
    });

    paginationKeys.forEach((key) => {
      if (router.query[key]) updatedPagination[key] = router.query[key];
    });

    setState((prev) => ({
      ...prev,
      filters,
      search: searchFilter ? (searchFilter as string) : prev.search,
      pagination: z.object(paginationFiltersSchema).parse(updatedPagination),
    }));
  }, [router.query]);

  const { data: apprenants, isFetching } = useQuery(
    ["apprenants", state.pagination, state.search, state.filters],
    async () => {
      return await _get(`/api/v1/organisation/mission-locale/effectifs`, {
        params: {
          page: state.pagination.page,
          limit: state.pagination.limit,
          sort: state.pagination.sort,
          order: state.pagination.order,
          search: state.search,
          ...state.filters,
        },
      });
    },
    { keepPreviousData: true }
  );
  console.log("CONSOLE LOG ~ EffectifsPage ~ apprenants:", apprenants);

  const updateState = (key: string, value: any) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleTableChange = (newPagination: IPaginationFilters) => {
    updateState("pagination", newPagination);
    router.push({ pathname: router.pathname, query: { ...router.query, ...newPagination } }, undefined, {
      shallow: true,
    });
  };

  const handleSearchChange = (value: string) => {
    updateState("search", value);
    router.push({ pathname: router.pathname, query: { ...router.query, search: value } }, undefined, { shallow: true });
  };

  const handleFilterChange = (newFilters: Record<string, string[]>) => {
    setState((prev) => ({ ...prev, pagination: { ...prev.pagination, page: 0 }, filters: newFilters }));
    router.push({ pathname: router.pathname, query: { ...router.query, ...newFilters, page: 0 } }, undefined, {
      shallow: true,
    });
  };

  const resetFilters = () => {
    setState({ pagination: DEFAULT_PAGINATION, search: "", filters: {} });
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
            Retrouvez ci-dessous les <strong>{apprenants?.totalApprenants}</strong> jeunes (identifiés comme inscrit
            sans contrat, en rupture de contrat ou en abandon/sortie d’apprentissage) et leurs coordonnées, susceptibles
            d&apos;être intéressés par une mise en relation et accompagnement avec une Mission Locale. Cliquez sur
            chaque jeune pour plus d’informations sur son parcours.
          </Text>
          <Text fontStyle="italic">
            Sources : CFA et{" "}
            <Link
              isExternal
              isUnderlined
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
            <Flex direction="column" ml={3} gap={2} justifyContent="flex-start">
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
            filters={state.filters}
            pagination={state.pagination}
            search={state.search}
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
              <Accordion.Item title="Quels sont les critères de sélection pour figurer sur la liste des jeunes ?">
                <Text>La sélection des jeunes repose sur les critères suivants :</Text>
                <Text>Critères géographiques et d&apos;âge :</Text>
                <UnorderedList pb={2} pl={3}>
                  <ListItem>
                    Être domicilié dans l&apos;un des codes postaux relevant du périmètre de la Mission Locale.
                  </ListItem>
                  <ListItem>Avoir moins de 26 ans (ou plus de 26 ans avec une RQTH).</ListItem>
                </UnorderedList>
                <Text>Situation scolaire :</Text>
                <UnorderedList pb={2} pl={3}>
                  <ListItem>Être inscrit sans contrat d’apprentissage.</ListItem>
                  <ListItem>Être en rupture de contrat ou en abandon (après 6 mois sans contrat).</ListItem>
                  <ListItem>Être inscrit sur l’année scolaire en cours.</ListItem>
                </UnorderedList>
                <Text>
                  Les informations peuvent provenir soit du CFA (transmission directe), soit via la plateforme DECA
                  (Dépôt des Contrats d’Alternance).
                </Text>
                <Text>
                  Veuillez noter que certains jeunes peuvent être enlevés de la liste si leur statut est modifié dans
                  l&apos;ERP du CFA. Par exemple, un jeune est indiqué comme “sans contrat” à la date du jour mais peut
                  démarrer un contrat demain et être en statut “apprenti” : il n’apparaîtra alors plus dans la liste.
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
          </Box>
        </Flex>
      </Container>
    </SimplePage>
  );
}

export default withAuth(EffectifsPage, ["MISSION_LOCALE"]);

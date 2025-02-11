import { Container, Heading, HStack, VStack, Text, Box, ListItem, UnorderedList } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useState } from "react";
import { IPaginationFilters } from "shared/models/routes/pagination";

import { _get } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import OrganismesTable from "@/modules/mon-espace/organismes/organismesTable/OrganismesTable";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const DEFAULT_PAGINATION: IPaginationFilters = {
  page: 0,
  limit: 10,
  sort: "nom",
  order: "asc",
};

function CfaPage() {
  const router = useRouter();
  const [state, setState] = useState({
    pagination: DEFAULT_PAGINATION,
  });

  const { data: organismes, isFetching } = useQuery(
    ["organismes", state.pagination],
    async () => {
      return await _get(`/api/v1/organisation/mission-locale/organismes`, {
        params: {
          page: state.pagination.page,
          limit: state.pagination.limit,
          sort: state.pagination.sort,
          order: state.pagination.order,
        },
      });
    },
    { keepPreviousData: true }
  );

  const handleTableChange = (newPagination: IPaginationFilters) => {
    setState({ pagination: newPagination });
    router.push({ pathname: router.pathname, query: { ...router.query, ...newPagination } }, undefined, {
      shallow: true,
    });
  };

  return (
    <SimplePage title="Apprenants">
      <Container maxW="xl" p="8">
        <HStack justifyContent="space-between" mb={8}>
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            Centres de formation en apprentissage
          </Heading>
        </HStack>
        <VStack spacing={4} alignItems="flex-start" w={2 / 3}>
          <Text>
            Retrouvez ci-dessous les <strong>{organismes?.pagination?.total}</strong> établissements formant (ou ayant
            formé) des jeunes identifiés comme :
          </Text>
          <UnorderedList pl={6}>
            <ListItem>
              <Text>en difficulté (sans contrat d’apprentissage, en rupture de contrat, abandons)</Text>
            </ListItem>
            <ListItem>
              <Text>domiciliés sur l’une des communes de votre périmètre géographique.</Text>
            </ListItem>
          </UnorderedList>
          <Text fontStyle="italic">Cliquez sur un organisme pour voir ses contacts.</Text>
        </VStack>
        <Box mt={10} mb={16}>
          <OrganismesTable
            organismes={organismes?.data ?? []}
            pagination={state.pagination}
            onTableChange={handleTableChange}
            total={organismes?.pagination?.total ?? 0}
            totalFormations={organismes?.totalFormations ?? 0}
            isFetching={isFetching ?? false}
          />
        </Box>
      </Container>
    </SimplePage>
  );
}

export default withAuth(CfaPage, ["MISSION_LOCALE"]);

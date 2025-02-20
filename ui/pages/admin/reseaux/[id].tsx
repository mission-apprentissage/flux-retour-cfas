import { Center, Container, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { IReseau } from "shared";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import ListeOrganismesReseauPage from "@/modules/organismes/ListeOrganismesReseauxPage";

export const getServerSideProps = async (context) => {
  const { id } = context.params;
  const authProps = await getAuthServerSideProps(context);

  return {
    props: {
      ...authProps,
      id,
    },
  };
};

const ReseauOrganismesPage = ({ id }) => {
  const { data: reseau, refetch } = useQuery<
    IReseau & {
      organismes: Organisme[];
    }
  >(["reseau"], () => _get(`/api/v1/admin/reseaux/${id}`), {});

  if (!reseau?.organismes) {
    return (
      <SimplePage title="">
        <Container maxW="xl" p="8">
          <Center>
            <Spinner />
          </Center>
        </Container>
      </SimplePage>
    );
  }

  const { organismes, ...rest } = reseau;

  return <ListeOrganismesReseauPage reseau={rest} organismes={organismes} refetch={refetch} />;
};

export default withAuth(ReseauOrganismesPage, ["ADMINISTRATEUR"]);

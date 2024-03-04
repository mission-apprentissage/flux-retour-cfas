import { Container, Text } from "@chakra-ui/react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";

import ListeTransmissionsPage from "../modules/transmissions/ListeTransmissionsPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageTransmissionsDeMonOrganismes = () => {
  const { organisme, isLoading, error } = useOrganisationOrganisme();

  if (isLoading) {
    return <></>;
  }

  if (!organisme || error) {
    return (
      <SimplePage>
        <Container maxW="xl" p="8">
          <Text mb={16}>Vous ne disposez pas des droits nécessaires pour visualiser cette page.</Text>
        </Container>
      </SimplePage>
    );
  }

  return <ListeTransmissionsPage organisme={organisme} />;
};

export default withAuth(PageTransmissionsDeMonOrganismes);

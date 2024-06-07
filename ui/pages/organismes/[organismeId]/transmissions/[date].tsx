import { Container, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { useOrganisme } from "@/hooks/organismes";

import ListeTransmissionsDetails from "../../../../modules/transmissions/ListeTransmissionsDetails";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageTransmissionsDeMonOrganismes = () => {
  const router = useRouter();
  const { organisme } = useOrganisme(router.query.organismeId as string);

  const date = router.query.date as string;

  if (!organisme) {
    return (
      <SimplePage>
        <Container maxW="xl" p="8">
          <Text mb={16}>Vous ne disposez pas des droits nécessaires pour visualiser cette page.</Text>
        </Container>
      </SimplePage>
    );
  }

  return <ListeTransmissionsDetails organisme={organisme} date={date} />;
};

export default withAuth(PageTransmissionsDeMonOrganismes);

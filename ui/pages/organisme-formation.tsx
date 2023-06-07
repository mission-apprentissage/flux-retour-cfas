import { Container } from "@chakra-ui/react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const OrganismeFormationPage = () => {
  return (
    <SimplePage title="Organisme de formation - Tableau de bord de l’apprentissage">
      <Container>TODO</Container>
    </SimplePage>
  );
};

export default OrganismeFormationPage;

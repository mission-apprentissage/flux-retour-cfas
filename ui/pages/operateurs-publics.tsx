import { Container } from "@chakra-ui/react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const OperateursPublicsPage = () => {
  return (
    <SimplePage title="Opérateurs publics - Tableau de bord de l’apprentissage">
      <Container>TODO</Container>
    </SimplePage>
  );
};

export default OperateursPublicsPage;

import { Container } from "@chakra-ui/react";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { useOrganismesDuplicatsLists } from "@/hooks/organismes";
import OrganismesDoublonsPage from "@/modules/admin/fusion-organismes/OrganismesDoublonsPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEffectifsDeSonOrganisme = () => {
  const { organismesDuplicats, isLoading } = useOrganismesDuplicatsLists();

  return (
    <SimplePage title="Vérifier les duplicats d'organisme">
      <Container maxW="xl" p="8">
        {organismesDuplicats && (
          <OrganismesDoublonsPage isLoading={isLoading} organismesDuplicats={organismesDuplicats} />
        )}
      </Container>
    </SimplePage>
  );
};

export default withAuth(PageEffectifsDeSonOrganisme);

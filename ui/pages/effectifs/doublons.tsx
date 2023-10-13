import { Container } from "@chakra-ui/react";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import EffectifsDoublonsPage from "@/modules/mon-espace/effectifs/doublons/EffectifsDoublonsPage";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageDoublonsDeSonOrganisme = () => {
  const { organisme } = useEffectifsOrganismeOrganisation();

  return (
    <SimplePage title="Doublons">
      <Container maxW="xl" p="8">
        {organisme && <EffectifsDoublonsPage isMine={true} />}
      </Container>
    </SimplePage>
  );
};

export default withAuth(PageDoublonsDeSonOrganisme);

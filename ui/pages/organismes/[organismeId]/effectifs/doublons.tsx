import { Container } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import EffectifsDoublonsPage from "@/modules/mon-espace/effectifs/doublons/EffectifsDoublonsPage";
import { useEffectifsOrganisme } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEffectifsDeSonOrganisme = () => {
  const router = useRouter();
  const { organisme } = useEffectifsOrganisme(router.query.organismeId as string);

  return (
    <SimplePage title="Doublons">
      <Container maxW="xl" p="8">
        {organisme && <EffectifsDoublonsPage isMine={false} />}
      </Container>
    </SimplePage>
  );
};

export default withAuth(PageEffectifsDeSonOrganisme);

import { useRouter } from "next/router";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import withAuth from "@/components/withAuth";
import { useOrganisme } from "@/hooks/organismes";
import EffectifsPage from "@/modules/effectifs/EffectifsPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEffectifsDeSonOrganisme = () => {
  const router = useRouter();
  const { organisme } = useOrganisme(router.query.organismeId as string);

  if (!organisme) {
    return <></>;
  }

  return <EffectifsPage organisme={organisme} modePublique={true} />;
};

export default withAuth(PageEffectifsDeSonOrganisme);

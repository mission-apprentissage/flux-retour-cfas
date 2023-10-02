import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import withAuth from "@/components/withAuth";
import EffectifsPage from "@/modules/effectifs/EffectifsPage";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEffectifsDeMonOrganisme = () => {
  const { organisme } = useEffectifsOrganismeOrganisation();

  if (!organisme) {
    return <></>;
  }

  return <EffectifsPage organisme={organisme} modePublique={false} />;
};

export default withAuth(PageEffectifsDeMonOrganisme);

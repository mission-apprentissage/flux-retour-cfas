import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import SIFAPage from "@/modules/mon-espace/SIFA/SIFAPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEnqueteSIFADeMonOrganisme = () => {
  const { organisme } = useEffectifsOrganismeOrganisation();

  return (
    <SimplePage title="Mon enquête SIFA">
      {organisme && <SIFAPage modePublique={false} organisme={organisme} />}
    </SimplePage>
  );
};

export default withAuth(PageEnqueteSIFADeMonOrganisme, ["ORGANISME_FORMATION"]);

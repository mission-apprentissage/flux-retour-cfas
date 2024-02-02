import { useRouter } from "next/router";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { useEffectifsOrganisme } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import SIFAPage from "@/modules/mon-espace/SIFA/SIFAPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEnqueteSIFADeSonOrganisme = () => {
  const router = useRouter();
  const { organisme } = useEffectifsOrganisme(router.query.organismeId as string);

  return (
    <SimplePage title="Son enquête SIFA">
      {organisme && <SIFAPage modePublique={true} organisme={organisme} />}
    </SimplePage>
  );
};

export default withAuth(PageEnqueteSIFADeSonOrganisme, ["ORGANISME_FORMATION", "ADMINISTRATEUR", "TETE_DE_RESEAU"]);

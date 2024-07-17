import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import ReferencementOrganisme from "@/modules/referencement-organisme/ReferencementOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function ReferencementOrganismePage() {
  return (
    <SimplePage title="Tableau de bord de l’apprentissage">
      <ReferencementOrganisme />
    </SimplePage>
  );
}

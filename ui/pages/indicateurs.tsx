import withAuth from "@/components/withAuth";
import OngletsIndicateurs from "@/modules/indicateurs/OngletsIndicateurs";

function MesIndicateursPage() {
  return <OngletsIndicateurs activeTab="indicateurs" modePublique={false} />;
}

export default withAuth(MesIndicateursPage);

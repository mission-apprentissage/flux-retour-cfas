import withAuth from "@/components/withAuth";
import ListeOrganismesPage from "@/modules/organismes/ListeOrganismesPage";

function MesOrganismesNonFiables() {
  return <ListeOrganismesPage activeTab="non-fiables" />;
}

export default withAuth(MesOrganismesNonFiables);

import withAuth from "@/components/withAuth";
import ListeOrganismesPage from "@/modules/organismes/ListeOrganismesPage";

function MesOrganismesFiables() {
  return <ListeOrganismesPage activeTab="fiables" />;
}

export default withAuth(MesOrganismesFiables);

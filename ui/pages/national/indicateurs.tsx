import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import DashboardNational from "@/modules/dashboard/DashboardNational";

function IndicateursNationauxPage() {
  return (
    <SimplePage title="Tableau de bord de l’apprentissage">
      <DashboardNational />
    </SimplePage>
  );
}

export default withAuth(IndicateursNationauxPage);

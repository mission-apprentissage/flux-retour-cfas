import dashboardStyles from "@/app/_components/dashboard/dashboard.module.scss";
import { OrganismeNavTabs } from "@/app/_components/dashboard/OrganismeNavTabs";
import TransmissionsClient from "@/app/_components/transmissions/TransmissionsClient";
import { PAGES } from "@/app/_utils/routes.utils";

export async function generateMetadata({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;
  return PAGES.dynamic.organismeTransmissions({ organismeId }).getMetadata();
}

export default async function OrganismeTransmissionsPage({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;

  return (
    <OrganismeNavTabs organismeId={organismeId} activeTab="transmissions">
      <div className={dashboardStyles.ficheCard}>
        <TransmissionsClient modePublique organismeId={organismeId} />
      </div>
    </OrganismeNavTabs>
  );
}

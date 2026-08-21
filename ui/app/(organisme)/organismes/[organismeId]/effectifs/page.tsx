import dashboardStyles from "@/app/_components/dashboard/dashboard.module.scss";
import { OrganismeNavTabs } from "@/app/_components/dashboard/OrganismeNavTabs";
import { PAGES } from "@/app/_utils/routes.utils";

import OrganismeEffectifsPageClient from "./OrganismeEffectifsPageClient";

export async function generateMetadata({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;
  return PAGES.dynamic.organismeEffectifs({ organismeId }).getMetadata();
}

export default async function OrganismeEffectifsPage({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;

  return (
    <OrganismeNavTabs organismeId={organismeId} activeTab="effectifs">
      <div className={dashboardStyles.ficheCard}>
        <OrganismeEffectifsPageClient organismeId={organismeId} />
      </div>
    </OrganismeNavTabs>
  );
}

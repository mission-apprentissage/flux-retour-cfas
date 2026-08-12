import { IndicateursOrganismeClient } from "@/app/_components/indicateurs/IndicateursOrganismeClient";
import { PAGES } from "@/app/_utils/routes.utils";

export async function generateMetadata({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;
  return PAGES.dynamic.organismeIndicateurs({ organismeId }).getMetadata();
}

export default async function OrganismeIndicateursPage({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;

  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <IndicateursOrganismeClient organismeId={organismeId} />
    </div>
  );
}

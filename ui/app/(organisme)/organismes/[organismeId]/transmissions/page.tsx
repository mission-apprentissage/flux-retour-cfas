import TransmissionsClient from "@/app/_components/transmissions/TransmissionsClient";
import { PAGES } from "@/app/_utils/routes.utils";

export async function generateMetadata({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;
  return PAGES.dynamic.organismeTransmissions({ organismeId }).getMetadata();
}

export default async function OrganismeTransmissionsPage({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;

  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <TransmissionsClient modePublique organismeId={organismeId} />
    </div>
  );
}

import { PAGES } from "@/app/_utils/routes.utils";

import OrganismeTeleversementPageClient from "./OrganismeTeleversementPageClient";

export async function generateMetadata({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;
  return PAGES.dynamic.organismeEffectifsTeleversement({ organismeId }).getMetadata();
}

export default async function OrganismeTeleversementPage({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;

  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <OrganismeTeleversementPageClient organismeId={organismeId} />
    </div>
  );
}

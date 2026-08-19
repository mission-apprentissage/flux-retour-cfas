import { PAGES } from "@/app/_utils/routes.utils";

import OrganismeEffectifsPageClient from "./OrganismeEffectifsPageClient";

export async function generateMetadata({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;
  return PAGES.dynamic.organismeEffectifs({ organismeId }).getMetadata();
}

export default async function OrganismeEffectifsPage({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;

  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <OrganismeEffectifsPageClient organismeId={organismeId} />
    </div>
  );
}

import { PAGES } from "@/app/_utils/routes.utils";

import OrganismeTeleversementPageClient from "./OrganismeTeleversementPageClient";

export async function generateMetadata({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;
  return PAGES.dynamic.organismeEffectifsTeleversement({ organismeId }).getMetadata();
}

export default async function OrganismeTeleversementPage({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;

  return (
    <>
      <OrganismeTeleversementPageClient organismeId={organismeId} />
    </>
  );
}

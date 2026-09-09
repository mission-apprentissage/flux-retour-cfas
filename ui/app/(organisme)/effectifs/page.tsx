import { PAGES } from "@/app/_utils/routes.utils";

import EffectifsPageClient from "./EffectifsPageClient";

export const metadata = PAGES.static.effectifs.getMetadata();

export default function EffectifsPage() {
  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <EffectifsPageClient />
    </div>
  );
}

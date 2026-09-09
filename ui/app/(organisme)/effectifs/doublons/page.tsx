import { PAGES } from "@/app/_utils/routes.utils";

import DoublonsPageClient from "./DoublonsPageClient";

export const metadata = PAGES.static.effectifsDoublons.getMetadata();

export default function DoublonsPage() {
  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <DoublonsPageClient />
    </div>
  );
}

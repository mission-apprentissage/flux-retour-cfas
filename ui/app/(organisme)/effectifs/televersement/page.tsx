import { PAGES } from "@/app/_utils/routes.utils";

import TeleversementPageClient from "./TeleversementPageClient";

export const metadata = PAGES.static.effectifsTeleversement.getMetadata();

export default function TeleversementPage() {
  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <TeleversementPageClient />
    </div>
  );
}

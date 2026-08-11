import ParametresClient from "@/app/_components/parametres/ParametresClient";
import { PAGES } from "@/app/_utils/routes.utils";

export const metadata = PAGES.static.parametres.getMetadata();

export default function ParametresPage() {
  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <ParametresClient
        effectifsHref={PAGES.static.effectifs.getPath()}
        erpV3CleanupHref={PAGES.static.parametres.getPath()}
        redirectHomeWhenNoOrganisme
      />
    </div>
  );
}

import { PAGES } from "@/app/_utils/routes.utils";

import FusionOrganismesClient from "./FusionOrganismesClient";

export const metadata = PAGES.static.adminFusionOrganismes.getMetadata();

export default function Page() {
  return <FusionOrganismesClient />;
}

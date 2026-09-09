import { PAGES } from "@/app/_utils/routes.utils";

import GestionOrganismesClient from "./GestionOrganismesClient";

export const metadata = PAGES.static.adminOrganismesGestion.getMetadata();

export default function Page() {
  return <GestionOrganismesClient />;
}

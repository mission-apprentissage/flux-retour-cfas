import { Suspense } from "react";

import { PAGES } from "@/app/_utils/routes.utils";

import { ReferencementOrganismeClient } from "./ReferencementOrganismeClient";

export const metadata = PAGES.static.referencementOrganisme.getMetadata();

export default function ReferencementOrganismePage() {
  return (
    <Suspense>
      <ReferencementOrganismeClient />
    </Suspense>
  );
}

import { Suspense } from "react";

import { PAGES } from "@/app/_utils/routes.utils";

import ActivationClient from "../_components/ActivationClient";

export const metadata = PAGES.static.authFinalisation.getMetadata();

export default function Page() {
  return (
    <Suspense>
      <ActivationClient />
    </Suspense>
  );
}

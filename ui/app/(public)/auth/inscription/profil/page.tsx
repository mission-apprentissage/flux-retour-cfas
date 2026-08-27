import { Suspense } from "react";

import { PAGES } from "@/app/_utils/routes.utils";

import ProfilClient from "./ProfilClient";

export const metadata = PAGES.dynamic.authInscription().getMetadata();

export default function Page() {
  return (
    <Suspense>
      <ProfilClient />
    </Suspense>
  );
}

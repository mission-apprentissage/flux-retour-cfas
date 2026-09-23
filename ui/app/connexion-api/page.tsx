import { Suspense } from "react";

import { PAGES } from "@/app/_utils/routes.utils";

import ConnexionApiClient from "./ConnexionApiClient";

export const metadata = PAGES.static.connexionApi.getMetadata();

export default function Page() {
  return (
    <Suspense>
      <ConnexionApiClient />
    </Suspense>
  );
}

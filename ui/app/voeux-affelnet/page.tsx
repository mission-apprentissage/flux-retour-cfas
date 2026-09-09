import { Suspense } from "react";

import { PAGES } from "@/app/_utils/routes.utils";

import VoeuxAffelnetClient from "./VoeuxAffelnetClient";

export const metadata = PAGES.static.voeuxAffelnet.getMetadata();

export default function Page() {
  return (
    <Suspense>
      <VoeuxAffelnetClient />
    </Suspense>
  );
}

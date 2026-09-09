import { Suspense } from "react";

import { PAGES } from "@/app/_utils/routes.utils";

import ImposturesClient from "./ImposturesClient";

export const metadata = PAGES.static.adminImpostures.getMetadata();

export default function Page() {
  return (
    <Suspense>
      <ImposturesClient />
    </Suspense>
  );
}

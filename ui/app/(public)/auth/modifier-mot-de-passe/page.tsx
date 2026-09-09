import { Suspense } from "react";

import { PAGES } from "@/app/_utils/routes.utils";

import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = PAGES.static.authModifierMotDePasse.getMetadata();

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  );
}

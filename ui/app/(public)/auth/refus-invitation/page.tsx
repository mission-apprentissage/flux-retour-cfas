import { Suspense } from "react";

import { PAGES } from "@/app/_utils/routes.utils";

import RefusInvitationClient from "./RefusInvitationClient";

export const metadata = PAGES.static.authRefusInvitation.getMetadata();

export default function RefusInvitationPage() {
  return (
    <main>
      <Suspense>
        <RefusInvitationClient />
      </Suspense>
    </main>
  );
}

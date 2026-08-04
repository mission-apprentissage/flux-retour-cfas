import { PAGES } from "@/app/_utils/routes.utils";

import OrganismeInconnuClient from "./OrganismeInconnuClient";

export const metadata = PAGES.static.authInscriptionOrganismeInconnu.getMetadata();

export default function InscriptionOrganismeInconnuPage() {
  return (
    <main>
      <OrganismeInconnuClient />
    </main>
  );
}

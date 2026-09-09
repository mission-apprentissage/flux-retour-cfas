import { PAGES } from "@/app/_utils/routes.utils";

import InscriptionClient from "./InscriptionClient";

export const metadata = PAGES.dynamic.authInscription().getMetadata();

export default function Page() {
  return <InscriptionClient />;
}

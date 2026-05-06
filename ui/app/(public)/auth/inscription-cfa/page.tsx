import { PAGES } from "@/app/_utils/routes.utils";

import InscriptionCfaClient from "./InscriptionCfaClient";

export const metadata = PAGES.static.authInscriptionCfa.getMetadata();

export default function Page() {
  return <InscriptionCfaClient />;
}

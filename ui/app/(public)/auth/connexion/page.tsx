import { PAGES } from "@/app/_utils/routes.utils";

import ConnexionClient from "./ConnexionClient";

export const metadata = PAGES.static.authConnexion.getMetadata();

export default function Page() {
  return <ConnexionClient />;
}

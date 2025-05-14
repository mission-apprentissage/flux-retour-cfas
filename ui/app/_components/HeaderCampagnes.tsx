import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";

import { Impersonate } from "./Impersonate";
import { UserConnectedHeader } from "./UserConnectedHeader";

export function HeaderCampagnes() {
  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/mission-locale",
        title: "Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)",
      }}
      id="fr-header-simple-header-with-service-title-and-tagline"
      serviceTitle={<>Tableau de bord de l&apos;apprentissage</>}
      quickAccessItems={[<Impersonate key="impersonate" />, <UserConnectedHeader key="user-connected" />]}
    />
  );
}

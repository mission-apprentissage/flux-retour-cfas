import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";

import { Impersonate } from "./Impersonate";
import { UserConnectedHeader } from "./UserConnectedHeader";

interface ConnectedHeaderProps {
  navigation: Array<MainNavigationProps.Item>;
}

export function ConnectedHeader(props: ConnectedHeaderProps) {
  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/",
        title: "Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)",
      }}
      id="fr-header-simple-header-with-service-title-and-tagline"
      serviceTitle={<>Tableau de bord de l&apos;apprentissage</>}
      quickAccessItems={[<Impersonate key="impersonate" />, <UserConnectedHeader key="user-connected" />]}
      navigation={props.navigation}
    />
  );
}

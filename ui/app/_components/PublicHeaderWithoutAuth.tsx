import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";

import { PRODUCT_NAME_TITLE } from "@/common/constants/product";

export function PublicHeaderWithoutAuth() {
  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/",
        title: `Accueil - ${PRODUCT_NAME_TITLE}`,
      }}
      id="fr-header-simple-header-with-service-title-and-tagline"
      serviceTitle={PRODUCT_NAME_TITLE}
    />
  );
}

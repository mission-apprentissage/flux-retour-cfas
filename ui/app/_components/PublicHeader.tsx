import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { CRISP_FAQ } from "shared";

export function PublicHeader() {
  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/",
        title: "Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)",
      }}
      id="fr-header-simple-header-with-service-title-and-tagline"
      serviceTitle={<>Tableau de bord de l&apos;apprentissage</>}
      quickAccessItems={[
        {
          iconId: "fr-icon-add-circle-line",
          linkProps: {
            href: "/auth/inscription",
            target: "_self",
          },
          text: "S'inscrire",
        },
        {
          linkProps: {
            href: "/auth/connexion",
            target: "_self",
          },
          iconId: "ri-account-box-line",
          text: "Se connecter",
        },
      ]}
      navigation={[
        {
          text: "Accueil",
          isActive: true,
          linkProps: {
            href: "/",
            target: "_self",
          },
        },
        {
          text: "Aide et ressources",
          menuLinks: [
            {
              linkProps: {
                href: CRISP_FAQ,
                target: "_blank",
                rel: "noopener noreferrer",
              },

              text: "Centre d’aide",
            },
          ],
        },
      ]}
    />
  );
}

import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";

export function Header() {
  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/mission-locale",
        title: "Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)",
      }}
      id="fr-header-simple-header-with-service-title-and-tagline"
      serviceTitle={<>Tableau de bord de l&apos;apprentissage</>}
      navigation={[
        {
          text: "Mon tableau de bord",
          isActive: true,
          linkProps: {
            href: "/mission-locale",
            target: "_self",
          },
        },
        {
          text: "Aide et ressources",
          menuLinks: [
            {
              linkProps: {
                href: "#",
              },
              text: "Lien de navigation",
            },
            {
              linkProps: {
                href: "#",
              },
              text: "Lien de navigation",
            },
            {
              linkProps: {
                href: "#",
              },
              text: "Lien de navigation",
            },
            {
              linkProps: {
                href: "#",
              },
              text: "Lien de navigation",
            },
            {
              linkProps: {
                href: "#",
              },
              text: "Lien de navigation",
            },
            {
              linkProps: {
                href: "#",
              },
              text: "Lien de navigation",
            },
          ],
        },
      ]}
    />
  );
}

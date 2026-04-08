import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";

export function PublicHeaderWithoutAuth() {
  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/",
        title: "Accueil - Tableau de bord de l'apprentissage",
      }}
      id="fr-header-simple-header-with-service-title-and-tagline"
      serviceTitle={<>Tableau de bord de l&apos;apprentissage</>}
    />
  );
}

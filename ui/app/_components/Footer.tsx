import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer";

export function Footer() {
  return (
    <DsfrFooter
      accessibility="fully compliant"
      contentDescription="Le Tableau de bord de l’apprentissage vise à faciliter l’accompagnement des jeunes vers l’emploi."
      operatorLogo={{
        alt: "France relance",
        imgUrl: "/images/france_relance.svg",
        orientation: "vertical",
      }}
    />
  );
}

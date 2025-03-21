import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer";

export function Footer() {
  return (
    <DsfrFooter
      accessibility="fully compliant"
      contentDescription="La bonne alternance simplifie les mises en relation  entre les trois d’acteurs candidats, recruteurs et centres de formation, afin de faciliter les entrées en  alternance."
      operatorLogo={{
        alt: "France relance",
        imgUrl: "/images/france_relance.svg",
        orientation: "vertical",
      }}
    />
  );
}

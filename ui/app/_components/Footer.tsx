import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer";

export function Footer() {
  return (
    <DsfrFooter
      accessibility="fully compliant"
      contentDescription="Mandatée par le Ministère du Travail, de l'Emploi et de l'Insertion, le Ministère de la Transformation et de la Fonction publiques, le Ministère de l'Éducation Nationale, de la Jeunesse et des Sports, le Ministère de la Recherche, de l'Enseignement Supérieur et de l'Innovation, la Mission interministérielle pour l'apprentissage développe plusieurs services destinés à faciliter les entrées en apprentissage."
      operatorLogo={{
        alt: "France relance",
        imgUrl: "/images/france_relance.svg",
        orientation: "vertical",
      }}
    />
  );
}

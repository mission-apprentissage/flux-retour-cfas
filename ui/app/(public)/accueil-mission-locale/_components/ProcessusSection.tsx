import { BaseProcessusSection, type ProcessusCard } from "../../_components/shared/BaseProcessusSection";

const TITLE =
  "Un outil d’aller-vers un public souvent éloigné du service public à l’emploi et un levier de collaboration puissant avec les CFA de votre territoire";

const CARDS: Array<ProcessusCard> = [
  {
    image: "/images/home/mission-locale/avantage-ml-liste.png",
    title: "Une liste des jeunes en rupture actualisée quotidiennement sur le territoire de votre Mission Locale",
  },
  {
    image: "/images/home/mission-locale/avantage-ml-contact.png",
    title: "Retrouvez toutes les coordonnées pour contacter le jeune ou son établissement",
  },
  {
    image: "/images/home/mission-locale/avantage-ml-fiche-navette.png",
    title: "Une fiche navette par dossier pour collaborer plus simplement avec les CFA",
  },
  {
    image: "/images/home/mission-locale/avantage-ml-priorisation.png",
    title: "Priorisation automatique sur les dossiers à risque ou les + urgents",
  },
  {
    image: "/images/home/mission-locale/avantage-ml-relance.png",
    title: "Vous n’avez pas de réponse du jeune ? Nous prenons le relai avec une messagerie de rappel.",
  },
];

export function ProcessusSection() {
  return <BaseProcessusSection title={TITLE} cards={CARDS} linkInscription="missions_locales" />;
}

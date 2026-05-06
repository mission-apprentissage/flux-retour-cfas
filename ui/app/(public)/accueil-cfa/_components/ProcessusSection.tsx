import { BaseProcessusSection, type ProcessusCard } from "../../_components/shared/BaseProcessusSection";

const TITLE =
  "Centralisez et digitalisez votre relation avec les Missions Locales pour accompagner les jeunes en rupture de contrat";

const CARDS: Array<ProcessusCard> = [
  {
    image: "/images/home/cfa/avantage-cfa-rupture.png",
    title: "Détection automatique des rupturants",
  },
  {
    image: "/images/home/cfa/avantage-cfa-collab.png",
    title: "Collaboration avec la Mission Locale à votre initiative sur chaque dossier",
  },
  {
    image: "/images/home/cfa/avantage-cfa-ml.png",
    title: "Détection automatique de la Mission Locale de rattachement du jeune",
  },
  {
    image: "/images/home/cfa/avantage-cfa-fiche-navette.png",
    title: "Une fiche navette par dossier pour voir toutes les interactions réalisées",
  },
  {
    image: "/images/home/cfa/avantage-cfa-suivi.png",
    title: "Notification dès qu’une Mission Locale prend une action sur un dossier de jeune",
  },
];

export function ProcessusSection() {
  return <BaseProcessusSection title={TITLE} cards={CARDS} linkInscription="/organisme_formation" />;
}

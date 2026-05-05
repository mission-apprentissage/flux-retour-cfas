"use client";

import { FeaturesAccordionSection, type FeatureAccordionFeature } from "../../_components/FeaturesAccordionSection";

const FEATURES: readonly [FeatureAccordionFeature, ...FeatureAccordionFeature[]] = [
  {
    id: "liste-effectifs",
    label: "Accédez à la liste de vos effectifs en rupture de contrat",
    description: (
      <ul>
        <li>
          Grâce à <strong>la connexion de votre ERP</strong> (logiciel de gestion de vos effectifs) directement au
          Tableau de bord de l’apprentissage, consultez directement{" "}
          <strong>la liste filtrée de vos effectifs en rupture</strong> de contrat d’apprentissage{" "}
          <strong>classés par durée de rupture</strong> de contrat.
        </li>
        <li>
          Cette liste est <strong>actualisée tous les jours</strong> et{" "}
          <strong>prend en compte les informations que vous enregistrez sur votre ERP</strong>. Vous indiquez qu’un
          jeune a retrouvé un contrat dans votre ERP, le lendemain il disparaît de la liste des effectifs en rupture sur
          le Tableau de bord.
        </li>
      </ul>
    ),
  },
  {
    id: "decider-collaboration",
    label: "Pour chaque jeune, décidez si vous souhaitez démarrer une collaboration avec la Mission Locale",
    description:
      "Vous gardez la main sur la qualification de la situation : démarrez une collaboration uniquement quand l’accompagnement de la Mission Locale est pertinent pour le jeune.",
  },
  {
    id: "qualifier-dossier",
    label: "Qualifier le dossier à envoyer à la Mission Locale et précisez ce que vous attendez de l’accompagnement",
    description:
      "Renseignez les informations utiles sur la situation du jeune et indiquez les attentes de l’accompagnement, pour permettre à la Mission Locale d’adapter son intervention.",
  },
  {
    id: "fiche-navette",
    label: "Suivez l’ensemble des actions prises via une fiche navette numérique et valorisez votre engagement",
    description:
      "Consultez en temps réel l’avancement des accompagnements menés par la Mission Locale grâce à une fiche navette partagée, et valorisez votre engagement de lutte contre le décrochage.",
  },
  {
    id: "ml-relai",
    label: "La Mission Locale prend le relai et vous êtes notifiée dès qu’une action est prise",
    description:
      "Vous êtes notifié à chaque étape clé du parcours du jeune côté Mission Locale (premier contact, rendez-vous, suite donnée), sans avoir à relancer.",
  },
];
export function FeaturesSection() {
  return (
    <FeaturesAccordionSection
      title="Profitez d’une opportunité de collaborer avec une Mission Locale pour chaque jeune en rupture"
      features={FEATURES}
      imgAlt="Aperçu du Tableau de bord pour les CFA"
      imgPath="/images/home/cfa/carousel-feature-"
    />
  );
}

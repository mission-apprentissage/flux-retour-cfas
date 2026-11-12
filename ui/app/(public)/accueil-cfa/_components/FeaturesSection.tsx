"use client";

import {
  BaseFeaturesAccordionSection,
  type FeatureAccordionFeature,
} from "../../_components/shared/BaseFeaturesAccordionSection";

const FEATURES: readonly [FeatureAccordionFeature, ...FeatureAccordionFeature[]] = [
  {
    id: "liste-effectifs",
    label: "Accédez à la liste de vos effectifs",
    description: (
      <ul>
        <li>
          Grâce à la base de données DECA, accédez à la liste de vos effectifs avant même de connecter votre ERP et
          visualisez la liste de vos effectifs.
        </li>
        <li>
          Grâce à <strong>la connexion de votre ERP</strong> (logiciel de gestion de vos effectifs) directement au
          Tableau de bord de l’apprentissage, consultez directement <strong>la liste de vos effectifs.</strong>
        </li>
        <li>
          Cette liste est <strong>actualisée tous les jours</strong> et{" "}
          <strong>prend en compte les informations que vous enregistrez sur votre ERP</strong>.
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
    <BaseFeaturesAccordionSection
      title="Profitez d’une opportunité de collaborer avec une Mission Locale pour chaque jeune en difficulté"
      features={FEATURES}
      imgAlt="Aperçu du Tableau de bord pour les CFA"
      imgPath="/images/home/cfa/carousel-feature-"
    />
  );
}

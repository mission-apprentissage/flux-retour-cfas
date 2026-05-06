"use client";

import {
  BaseFeaturesAccordionSection,
  type FeatureAccordionFeature,
} from "../../_components/shared/BaseFeaturesAccordionSection";

const FEATURES: readonly [FeatureAccordionFeature, ...FeatureAccordionFeature[]] = [
  {
    id: "liste-jeunes",
    label: "Accédez à la liste des jeunes en rupture dépendant de votre Mission Locale",
    description: (
      <ul>
        <li>
          Une liste de jeunes en rupture de contrat <strong>mise à jour quotidiennement</strong> grâce au croisement des
          bases de données des <strong>CFA</strong> et de la base de données <strong>DECA</strong>.
        </li>
        <li>
          Accédez à une <strong>liste claire et actualisée</strong> des jeunes en rupture de contrat d’apprentissage.
        </li>
        <li>
          Un nouveau contrat est signé ? Dès que nous captons l’information, vous la retrouvez sous 24h sur le dossier
          du jeune.
        </li>
      </ul>
    ),
  },
  {
    id: "profils-prioritaires",
    label: "Identifiez et priorisez les profils prioritaires notamment les jeunes en obligation de formation",
    description: (
      <ul>
        <li>
          La liste complète s’affiche groupée par mois de rupture, mais nous vous indiquons les dossiers prioritaires :
        </li>
        <li style={{ marginLeft: "16px" }}>
          Les mineurs (16-18ans) en <strong>obligation de formation</strong>
        </li>
        <li style={{ marginLeft: "16px" }}>
          Les <strong>collaborations directes avec les CFA</strong>
        </li>
        <li style={{ marginLeft: "16px" }}>
          Les jeunes <strong>les + susceptibles de répondre</strong> et d’avoir besoin de votre aide
        </li>
      </ul>
    ),
  },
  {
    id: "coordonnees-jeunes",
    label: "Pour chaque jeune retrouvez l’ensemble des coordonnées pour les contacter",
    description: (
      <ul>
        <li>Pour chaque jeune vous retrouvez :</li>
        <li style={{ marginLeft: "16px" }}>
          <strong>Ses coordonnées :</strong> téléphone, email.
        </li>
        <li style={{ marginLeft: "16px" }}>
          <strong>Les coordonnées de son CFA :</strong> pour faciliter la prise de contact.
        </li>
        <li style={{ marginLeft: "16px" }}>
          <strong>Les détails du contrat :</strong> date de début, date de rupture, formation suivie.
        </li>
      </ul>
    ),
  },
  {
    id: "fiche-navette",
    label:
      "Collaborez directement avec les CFA sur une fiche navette centralisée, numérique et enrichie automatiquement",
    description: (
      <ul>
        <li>
          <strong>Le CFA qualifie le dossier du jeune :</strong> le besoin d’accompagnement, le statut administratif du
          maintien en formation, la cause et le contexte de la rupture et les informations nécessaires à la prise en
          charge.
        </li>
        <li>
          Collaborez directement sur <strong>une fiche navette partagée</strong> pour chaque jeune. Les interactions de
          chaque partie sont enregistrées et partagées automatiquement.
        </li>
      </ul>
    ),
  },
  {
    id: "compte-rendu",
    label:
      "Reportez sur le service le compte rendu de vos prises de contact avec les jeunes et participez la mission de lutte contre le décrochage de l’apprentissage",
    description: (
      <ul>
        <li>
          Vous avez tenté de contacter un jeune ? Qu’il ait répondu ou non, enregistrez et{" "}
          <strong>valorisez votre action d’aller-vers directement dans l’outil</strong>.
        </li>
        <li>
          Un formulaire intelligent vous permet d’enregistrer votre action prise en quelques questions et 3 clics.
        </li>
      </ul>
    ),
  },
];

export function FeaturesSection() {
  return (
    <BaseFeaturesAccordionSection
      title="Identifiez, contactez et accompagnez les jeunes en rupture en collaboration direct avec les CFA"
      features={FEATURES}
      imgAlt="Aperçu du Tableau de bord pour les Missions Locales"
      imgPath={"/images/home/mission-locale/carousel-feature-"}
    />
  );
}

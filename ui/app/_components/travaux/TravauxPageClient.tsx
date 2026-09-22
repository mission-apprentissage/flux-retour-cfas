"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import {
  BaseFeaturesAccordionSection,
  type FeatureAccordionFeature,
} from "@/app/(public)/_components/shared/BaseFeaturesAccordionSection";

import styles from "./TravauxPage.module.css";

const CONTACT_EMAIL = "tableau-de-bord@apprentissage.beta.gouv.fr";

const ETAPES: readonly [FeatureAccordionFeature, ...FeatureAccordionFeature[]] = [
  {
    id: "1-identification",
    label:
      "Le Tableau de bord identifie les jeunes en rupture et les Missions Locales prennent contact avec ces jeunes chaque jour",
    description: (
      <>
        <p>
          Nous présentons chaque jour aux 400 Missions Locales utilisatrices du service, la liste et les coordonnées des
          jeunes en situation de rupture de contrat d’apprentissage sur leur territoire.
        </p>
        <p>
          Les Missions Locales s’organisent chacune en autonomie pour contacter ces jeunes et leur proposer un
          accompagnement pour lutter contre le décrochage de l’apprentissage.
        </p>
      </>
    ),
  },
  {
    id: "2-sollicitation",
    label:
      "Les CFA accèdent au Tableau de bord et peuvent solliciter les Missions Locales pour collaborer sur le dossier d’un jeune",
    description: (
      <>
        <p>
          Depuis quelques mois les CFA aussi peuvent utiliser le service du Tableau de bord de l’apprentissage.
          L’objectif de l’outil pour eux est simple : le Tableau de bord leur permet d’initier, pour chaque jeune qui en
          aurait besoin, une collaboration avec sa Mission Locale de rattachement de manière automatisée.
        </p>
        <p>
          Pour prévenir une rupture ou un décrochage, le CFA se connecte au Tableau de bord, identifie le dossier d’un
          jeune, qualifie la situation, les besoins du jeune ainsi que l’objectif d’accompagnement souhaité avec la
          Mission Locale et sollicite ainsi une collaboration qui est envoyée directement à la Mission Locale de
          rattachement du jeune.
        </p>
      </>
    ),
  },
  {
    id: "3-fiche-navette",
    label:
      "Les CFA et les Missions Locales travaillent sur le même outil via une fiche navette numérique automatisée et interactive",
    description: (
      <>
        <p>
          Sur un territoire donné, tous les CFA ne connaissent pas toutes les Missions Locales et inversement. Pour
          autant nous savons aussi que de nombreuses démarches de collaboration existent entre des CFA et des Missions
          Locales.
        </p>
        <p>
          Le Tableau de bord permet d’optimiser, de simplifier et de généraliser la pratique de la collaboration entre
          les CFA et les Missions Locales avec un canal unifié, automatisé et interactif : la fiche navette d’un jeune.
        </p>
        <p>
          La Mission Locale accède à l’ensemble des informations qualifiées par le CFA et en retour le CFA reçoit la
          mise à jour et la synthèse de la prise de contact du jeune par la Mission Locale.
        </p>
        <p>
          Fini la recherche sans fin du bon interlocuteur dans chaque entité. Terminé les boucles de mails qui se
          perdent entre les collaborateurs pour suivre le dossier d’un jeune.
        </p>
      </>
    ),
  },
  {
    id: "4-suivi",
    label:
      "Vous pouvez suivre l’ensemble de l’activité des CFA et des Missions Locales de votre territoire sur le service du Tableau de bord",
    description: (
      <p>
        Votre accès au Tableau de bord de l’apprentissage vous permet maintenant de suivre des chiffres et des
        indicateurs vivants de l’usage du service, son adoption sur votre territoire et surtout de la collaboration
        entre les acteurs du terrain.
      </p>
    ),
  },
];

const ROLES = [
  {
    image: "/images/dreets-travaux/carte-cartographier.png",
    alt: "Des CFA et des Missions Locales répartis sur un territoire",
    titre: "Cartographier l’apprentissage sur votre territoire",
    description:
      "Accédez à la liste des CFA et des Missions Locales de votre territoire. Suivez leurs échanges et appréhendez leurs périmètres d’action sur votre territoire.",
  },
  {
    image: "/images/dreets-travaux/carte-coordination.png",
    alt: "Un agent DREETS/DDETS entre un CFA et une Mission Locale",
    titre: "Animer la coordination inter-réseaux",
    description:
      "Vous disposerez d’une vue d’ensemble des Missions Locales, des CFA et de leurs coordonnées. Grâce au Tableau de bord vous pouvez les outiller pour ouvrir, renforcer et animer le dialogue entre chacun.",
  },
  {
    image: "/images/dreets-travaux/carte-adoption-cfa.png",
    alt: "Des CFA marqués comme ayant rejoint le service",
    titre: "Accompagner l’adoption du TBA côté CFA",
    description:
      "Embarquer les CFA volontaires dans le partage de dossiers avec les ML et faciliter la mise en collaboration.",
  },
];

export function TravauxPageClient() {
  return (
    <div className={styles.page}>
      <div className={styles.titleBar}>
        <div className="fr-container">
          <h1 className={styles.title}>Aperçu des données de l’apprentissage de votre périmètre</h1>
        </div>
      </div>

      <div className="fr-container">
        <section className={styles.unavailable} aria-labelledby="travaux-indisponible">
          <i className={`ri-tools-fill ${styles.unavailableIcon}`} aria-hidden="true" />
          <h2 id="travaux-indisponible" className={styles.unavailableTitle}>
            Les fonctionnalités de cette page sont indisponibles pour le moment
          </h2>
          <p>
            Cette page et l’ensemble de ses fonctionnalités sont indisponibles pour le moment en raison des travaux
            menés sur le service du Tableau de bord de l’apprentissage pendant cette rentrée 2026.
          </p>
          <p>Ces travaux ont été annoncés lors du webinaire de rentrée du 11 septembre dernier.</p>
          <p>
            Nous vous tiendrons informé dès que la nouvelle version et l’ensemble de ses fonctionnalités seront
            complètement disponibles.
          </p>
          <p>
            L’ensemble de l’équipe du Tableau de bord de l’apprentissage vous présente ses excuses pour la gêne
            occasionnée durant cette période.
          </p>
          <p>
            Une question ? Contactez l’équipe du projet
            <br />
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </section>
      </div>

      <section className={styles.evolution}>
        <div className="fr-container">
          <h2 className={styles.sectionTitleCentered}>Le Tableau de bord évolue</h2>
          <Image
            src="/images/dreets-travaux/evolution-collaboration.png"
            alt="Une Mission Locale et un CFA échangent autour du dossier d’un jeune sur le Tableau de bord"
            width={868}
            height={301}
            className={styles.evolutionIllustration}
          />
        </div>

        <BaseFeaturesAccordionSection
          title="Le Tableau de bord devient l’outil de collaboration entre CFA et Missions Locales pour la prévention des ruptures et des décrochages."
          features={ETAPES}
          imgAlt="Illustration de l’étape sélectionnée dans le Tableau de bord"
          imgPath="/images/dreets-travaux/etape-"
        />
      </section>

      <section className={styles.roles}>
        <div className="fr-container">
          <h2 className={styles.rolesTitle}>
            À quoi sert le Tableau de bord pour
            <br />
            les DREETS et les DDETS ?
          </h2>
          <ul className={styles.rolesGrid}>
            {ROLES.map((role) => (
              <li key={role.titre} className={styles.roleCard}>
                <Image src={role.image} alt={role.alt} width={384} height={258} className={styles.roleImage} />
                <div className={styles.roleBody}>
                  <h3 className={styles.roleTitle}>{role.titre}</h3>
                  <p className={styles.roleDescription}>{role.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.split}>
        <div className={`fr-container ${styles.splitInner}`}>
          <Image
            src="/images/dreets-travaux/role-territorial.png"
            alt="Une Mission Locale et un CFA mis en relation sur le territoire"
            width={443}
            height={383}
            className={styles.splitIllustration}
          />
          <div>
            <h2 className={styles.splitTitle}>
              Pour lutter contre le décrochage et prévenir les ruptures, vous avez un rôle clé à jouer auprès des CFA de
              votre territoire.
            </h2>
            <p>
              Depuis sa construction, le Tableau de bord s’appuie sur les acteurs de terrain. Les ARML sont mobilisées
              pour embarquer les Missions Locales dans le service.
            </p>
            <p>
              Sur le volet CFA, ce rôle d’animation territoriale vous revient : vous êtes les mieux placés pour engager
              les CFA de votre périmètre et piloter leur collaboration avec les Missions Locales.
            </p>
            <Button
              linkProps={{ href: `mailto:${CONTACT_EMAIL}` }}
              iconId="fr-icon-arrow-right-line"
              iconPosition="right"
            >
              Contacter l’équipe
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.split}>
        <div className={`fr-container ${styles.splitInner} ${styles.splitReverse}`}>
          <div>
            <h2 className={styles.splitTitle}>
              Pendant les travaux, vous avez toujours accès aux indicateurs de suivi sur l’usage du Tableau de bord
            </h2>
            <p>
              Suivez le déploiement, l’adoption et l’usage du Tableau de bord par les CFA et les Missions Locales de
              votre territoire.
            </p>
            <Button
              linkProps={{ href: "/suivi-des-indicateurs" }}
              iconId="fr-icon-arrow-right-line"
              iconPosition="right"
            >
              Suivre les indicateurs
            </Button>
          </div>
          <Image
            src="/images/dreets-travaux/indicateurs-suivi.png"
            alt="Indicateurs de suivi régionaux affichés dans le Tableau de bord"
            width={760}
            height={514}
            className={styles.splitCapture}
          />
        </div>
      </section>

      <section className={styles.contact}>
        <div className={`fr-container ${styles.splitInner}`}>
          <Image
            src="/images/dreets-travaux/equipe-joignable.png"
            alt="Un utilisateur s’interroge devant son ordinateur"
            width={432}
            height={237}
            className={styles.contactIllustration}
          />
          <div>
            <h2 className={styles.splitTitle}>L’équipe reste joignable</h2>
            <p>
              Nous vous tenons informé dès que nous avons plus d’informations sur la nouvelle version. Si vous avez une
              question d’ici là, n’hésitez pas à nous contacter.
            </p>
            <Button
              linkProps={{ href: `mailto:${CONTACT_EMAIL}` }}
              iconId="fr-icon-arrow-right-line"
              iconPosition="right"
            >
              Contacter l’équipe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import Image from "next/image";
import { useEffect, useState } from "react";

import { PAGES } from "@/app/_utils/routes.utils";
import { COMPTE_SETTINGS_HREF } from "@/common/utils/compteSettings";

import styles from "./CfaAPropos.module.css";

const SECTIONS = [
  { id: "a-quoi-sert", label: "À quoi sert la nouvelle version ?" },
  { id: "comment-ca-marche", label: "Comment ça marche ?" },
  { id: "quels-jeunes", label: "Quels jeunes peut-on transmettre aux Missions Locales ?" },
  { id: "pourquoi-collaborer", label: "Pourquoi collaborer avec les Missions Locales ?" },
  { id: "source-des-donnees", label: "Quelle est la source des données de mes effectifs sur le Tableau de bord ?" },
  { id: "anciennes-fonctionnalites", label: "Où sont passées les anciennes fonctionnalités ?" },
  { id: "contact", label: "Une question ? Contactez l'équipe du Tableau de bord" },
] as const;

const ETAPES = [
  {
    src: "/images/cfa-nouvelle-version/etape-demarrer-collaboration.png",
    label: "Collaboration avec la Mission Locale à votre initiative sur chaque dossier",
  },
  {
    src: "/images/cfa-nouvelle-version/etape-detection-ml.png",
    label: "Détection automatique de la Mission Locale de rattachement du jeune",
  },
  {
    src: "/images/cfa-nouvelle-version/etape-fiche-navette.png",
    label: "Une fiche navette par dossier pour voir toutes les interactions réalisées",
  },
  {
    src: "/images/cfa-nouvelle-version/etape-notification.png",
    label: "Notification dès qu'une Mission Locale prend une action sur un dossier de jeune",
  },
];

const FREINS = [
  { icon: "fr-icon-community-line", label: "Aides au logement" },
  { icon: "fr-icon-stethoscope-line", label: "Aides à l'accès aux soins" },
  { icon: "fr-icon-file-text-line", label: "Aides aux démarches administratives" },
  { icon: "fr-icon-bike-line", label: "Aides à la mobilité" },
  { icon: "fr-icon-computer-line", label: "Accompagnement au numérique" },
  { icon: "fr-icon-money-euro-circle-line", label: "Aides financières" },
  { icon: "fr-icon-team-line", label: "Soutien dans la médiation sociale" },
];

function useActiveSection() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return active;
}

export function CfaAProposClient() {
  const activeSection = useActiveSection();

  return (
    <>
      <div className={styles.hero}>
        <div className={`fr-container ${styles.heroInner}`}>
          <h1 className={styles.heroTitle}>
            Nouvelle version du Tableau de bord de l&apos;apprentissage
            <span className={styles.heroSubtitle}>Ce qu&apos;il faut retenir.</span>
          </h1>
          <Image
            src="/images/cfa-nouvelle-version/bienvenue-illustration.png"
            alt=""
            width={486}
            height={431}
            className={styles.heroImage}
            priority
          />
        </div>
      </div>

      <div className={styles.page}>
        <div className={`fr-container ${styles.layout}`}>
          <nav className={styles.sidebar} aria-label="Sommaire">
            <SideMenu
              align="left"
              burgerMenuButtonText="Dans cette rubrique"
              sticky
              items={SECTIONS.map(({ id, label }) => ({
                text: label,
                linkProps: { href: `#${id}` },
                isActive: activeSection === id,
              }))}
              style={{ maxHeight: "none", overflow: "visible" }}
            />
          </nav>

          <div className={styles.content}>
            <section id="a-quoi-sert" className={styles.section}>
              <h2 className={styles.sectionTitle}>À quoi sert la nouvelle version ?</h2>
              <blockquote className={styles.quote}>
                La nouvelle version du Tableau de bord de l&apos;apprentissage c&apos;est : l&apos;outil national de
                collaboration entre les CFA et les Missions Locales pour créer des accompagnements sur-mesure pour les
                jeunes en difficulté lors de leur parcours d&apos;apprentissage.
              </blockquote>
              <p>
                Le Tableau de bord n&apos;est plus un outil de suivi de chiffres, que ce soient ceux de votre
                établissement ou les chiffres nationaux. Le Tableau de bord recentre sa vision sur un impact plus clair
                et plus concret directement ancré dans l&apos;opérationnel et votre quotidien d&apos;accompagnement des
                jeunes dans leurs parcours d&apos;apprentissage.
              </p>
              <p className={styles.emphasis}>
                Vous suivez les jeunes dans les bons comme dans les mauvais moments.
                <br />
                Le Tableau de bord doit devenir votre réflexe dans ces fameux mauvais moments.
              </p>
              <p>
                Dès qu&apos;un jeune se trouve dans une situation de difficulté, et que, malgré tous vos dispositifs et
                accompagnements pédagogiques, ses perspectives ne semblent pas s&apos;améliorer, vous pouvez compter sur
                les Missions Locales comme relais.
              </p>
              <div className={styles.callout}>
                <p className={styles.calloutTitle}>Le Tableau de bord est destiné à cet usage :</p>
                <p>Un ou une jeune a une difficulté ?</p>
                <p>Vos moyens, outils et accompagnements ne suffisent pas ?</p>
                <p>
                  Ouvrez une collaboration avec la Mission Locale de rattachement du jeune pour lui trouver une solution
                  d&apos;accompagnement global.
                </p>
              </div>
            </section>

            <section id="comment-ca-marche" className={styles.section}>
              <h2 className={styles.sectionTitle}>Comment ça marche ?</h2>
              <p>
                Le Tableau de bord vous présente dans l&apos;onglet{" "}
                <strong>« Effectifs de l&apos;établissement »</strong> la liste de tous vos apprenants. Cette liste
                provient de sources diverses en fonction de votre méthode de branchement actuelle au Tableau de bord de
                l&apos;apprentissage (voir la section dédiée{" "}
                <a href="#source-des-donnees">
                  Quelle est la source des données de mes effectifs sur le Tableau de bord ?
                </a>
                )
              </p>
              <ol className={styles.steps}>
                <li>
                  Dès que vous identifiez un jeune en difficulté dans votre établissement vous pouvez le retrouver sur
                  le Tableau de bord et cliquer sur le bouton <strong>« Démarrer une collaboration »</strong>.
                </li>
                <li>
                  Vous remplissez <strong>un formulaire en 3 étapes rapides</strong> pour qualifier la situation du
                  jeune telle que vous la connaissez pour donner un maximum de contexte à la Mission Locale qui recevra
                  le dossier du jeune.
                </li>
                <li>
                  Une fois le formulaire complété{" "}
                  <strong>votre dossier est envoyé directement à la Mission Locale</strong> de rattachement du jeune en
                  fonction de son adresse postale. Vous gardez une trace de votre demande dans votre onglet{" "}
                  <strong>« Collaboration et suivi Missions Locales »</strong>.
                </li>
                <li>
                  Dès que la Mission Locale contacte le jeune et lui propose un accompagnement,{" "}
                  <strong>vous êtes informé</strong> des prochaines étapes et de ce qui est prévu pour soutenir le
                  jeune.
                </li>
                <li>
                  À tout moment, vous pouvez revenir sur le dossier du jeune pour retrouver les échanges entre la
                  Mission Locale et vous qui sont{" "}
                  <strong>synthétisés dans une fiche navette dédiée, interactive et automatisée.</strong>
                </li>
              </ol>
              <ul className={styles.etapes}>
                {ETAPES.map(({ src, label }) => (
                  <li key={src} className={styles.etape}>
                    <Image src={src} alt="" width={220} height={130} className={styles.etapeImage} />
                    <span className={styles.etapeLabel}>{label}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="quels-jeunes" className={styles.section}>
              <h2 className={styles.sectionTitle}>Quels jeunes peut-on transmettre aux Missions Locales ?</h2>
              <p>
                Tous les jeunes qui ont besoin d&apos;un accompagnement global pour les aider dans leur parcours
                d&apos;apprentissage.
              </p>
              <p>
                Voici quelques exemples de situations de jeunes en difficultés pour lesquels une collaboration avec la
                Mission Locale peut être envisagée :
              </p>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Un jeune en rupture de contrat et maintenu en formation</strong> qui a toutefois besoin
                  d&apos;un coup de pouce extérieur
                </li>
                <li>
                  <strong>Un jeune qui a quitté le CFA ou qui a totalement décroché</strong>. La Mission Locale pourra
                  tenter de le recontacter pour l&apos;aider dans son projet pour rebondir professionnellement.
                </li>
                <li>
                  <strong>Un jeune qui présente des signaux de rupture</strong>. La Mission Locale pourra mettre à
                  disposition des solutions logistiques, matérielles ou financières par exemple pour maintenir le jeune
                  en contrat.
                </li>
                <li>
                  <strong>
                    Un jeune qui a un besoin d&apos;accompagnement en dehors du scope professionnel ou pédagogique
                    assuré par le CFA
                  </strong>
                  . Si le jeune vous évoque des difficultés administratives, sociales, familiales, linguistiques, pensez
                  à la Mission Locale directement.
                </li>
              </ul>
              <div className={styles.callout}>
                <p className={styles.calloutTitle}>
                  Les collaborations entre les CFA et les Missions Locales visent à lutter contre le décrochage et
                  prévenir les ruptures
                </p>
                <p>
                  Dès que la situation d&apos;un jeune vous y fait penser, ayez le réflexe de vous connecter sur le
                  Tableau de bord pour demander une collaboration avec la Mission Locale du jeune.
                </p>
              </div>
            </section>

            <section id="pourquoi-collaborer" className={styles.section}>
              <h2 className={styles.sectionTitle}>Pourquoi collaborer avec les Missions Locales ?</h2>
              <p>
                Dans la section précédente <strong>« Quels jeunes peut-on transmettre aux Missions Locales ? »</strong>,
                nous avons vu que le Tableau de bord vous permet d&apos;ouvrir des collaborations avec les Missions
                Locales pour tous vos apprenants : qu&apos;ils soient en contrat mais avec un risque de rupture
                identifié, en rupture de contrat, qu&apos;ils aient abandonné le CFA ou encore qu&apos;ils aient
                simplement besoin d&apos;un accompagnement global.
              </p>
              <p>
                La collaboration entre les CFA et les Missions Locales a toujours existé et le Tableau de bord ne croit
                pas l&apos;inventer mais la rendre plus opérable, automatisable et optimisée pour un suivi plus clair
                que des échanges de mail dispersés ou encore qu&apos;une fiche navette physique.
              </p>
              <p>
                Nous croyons que les accompagnements que proposent les CFA et les Missions Locales se complètent pour
                proposer à chaque jeune un parcours sans couture pendant son apprentissage. Le CFA est fort de son suivi
                pédagogique, de son expertise professionnelle et de son réseau d&apos;entreprises et de professionnels
                qu&apos;il met à la disposition de chaque apprenant.
              </p>
              <figure className={styles.figure}>
                <Image
                  src="/images/cfa-nouvelle-version/infographie-cfa-ml.png"
                  alt="CFA et Missions Locales, des accompagnements complémentaires : le CFA apporte une expertise pédagogique et professionnelle (réseau d'entreprises, CV et lettre de motivation, conseils entretiens, soutien pédagogique, maintien en formation), la Mission Locale une expertise sociale, globale et de proximité (aides financières, aides à la mobilité, soutien administratif, aides au logement, soutien médiation sociale, aides à la santé)."
                  width={1274}
                  height={635}
                  className={styles.figureImage}
                />
              </figure>
              <p>
                Dans le cadre d&apos;une collaboration, la Mission Locale met, elle, au service du parcours du jeune
                tout son accompagnement périphérique à l&apos;emploi en appui à ce que votre établissement met déjà en
                place.
              </p>
              <p>
                La Mission Locale peut par exemple mobiliser des aides logistiques, matérielles ou financières pour
                aider le jeune (aides au permis, aides au logement, appui sur des démarches administratives…)
              </p>
              <div className={styles.freinsBlock}>
                <p className={styles.freinsTitle}>Les freins périphériques pour lesquels la Mission Locale agit</p>
                <ul className={styles.freins}>
                  {FREINS.map(({ icon, label }) => (
                    <li key={label} className={styles.frein}>
                      <span className={styles.freinIcon} aria-hidden="true">
                        <i className={`${icon} fr-icon--lg`} />
                      </span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p>
                En introduction de cette page d&apos;information nous parlions des bons et mauvais moments du parcours
                d&apos;apprentissage d&apos;un jeune.
              </p>
              <p>
                La collaboration avec des acteurs externes comme le réseau des Missions Locales fait partie des attendus
                du référentiel <strong>Qualiopi</strong>.
              </p>
              <div className={styles.qualiopi}>
                <ul className={styles.qualiopiList}>
                  <li>
                    <i className="fr-icon-checkbox-circle-fill" aria-hidden="true" />
                    Formalisez vos actions de collaborations
                  </li>
                  <li>
                    <i className="fr-icon-checkbox-circle-fill" aria-hidden="true" />
                    Gardez une trace valorisable de cet engagement
                  </li>
                </ul>
                <Image
                  src="/images/cfa-nouvelle-version/qualiopi.png"
                  alt="Logo Qualiopi"
                  width={131}
                  height={109}
                  className={styles.qualiopiLogo}
                />
              </div>
            </section>

            <section id="source-des-donnees" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Quelle est la source des données de mes effectifs sur le Tableau de bord ?
              </h2>
              <p>
                Le Tableau de bord de l&apos;apprentissage est par défaut toujours alimenté par la base de données{" "}
                <strong>DECA</strong>.
              </p>
              <blockquote className={styles.quote}>
                <strong>DECA</strong> (Dépôt des contrats en alternance) : base de données qui stocke les contrats
                d&apos;apprentissage des secteurs privé et public déposés par les 11 opérateurs de compétences (OPCO) et
                les agents en DDETS/D(R)(I)EETS.
              </blockquote>
              <p>
                Cependant, vous pouvez également compléter cette source par défaut avec la source de données de votre
                choix.
              </p>
              <h3 className={styles.subTitle}>
                Nos 2 options pour ajouter votre propre source de données au Tableau de bord
              </h3>
              <ul className={styles.optionList}>
                <li className={styles.option}>
                  <span className={styles.optionIcon} aria-hidden="true">
                    <i className="fr-icon-server-line" />
                  </span>
                  <p>
                    <strong>1. Connectez directement votre ERP,</strong> le Tableau de bord de l&apos;apprentissage vous
                    permet de brancher directement l&apos;ERP de votre choix grâce à un système de connexion simple via
                    une clé API voire en un seul clic depuis votre ERP si vous utilisez YPAREO.
                  </p>
                </li>
                <li className={styles.option}>
                  <span className={styles.optionIcon} aria-hidden="true">
                    <i className="fr-icon-table-line" />
                  </span>
                  <p>
                    <strong>2. Téléversez votre liste d&apos;apprenants via un fichier tableau Excel ou .csv</strong>, à
                    la fréquence que vous choisirez, vous pouvez tout à fait compléter la source DECA via un import
                    manuel des données de vos apprenants.
                  </p>
                </li>
              </ul>
              <div className={styles.callout}>
                <p className={styles.calloutTitle}>
                  Comment savoir si mon établissement a déjà ajouté une source de données complémentaires ?
                </p>
                <p>C&apos;est indiqué dans la page paramètres de votre établissement.</p>
              </div>
              <div className={styles.callout}>
                <p className={styles.calloutTitle}>Je veux connecter mon ERP</p>
                <p>
                  Vous souhaitez connecter la base de données de votre ERP au Tableau de bord de l&apos;apprentissage
                  pour avoir une donnée encore plus fraîche ?
                </p>
                <p>Cliquez sur le lien ci-dessous pour accéder aux tutoriels</p>
                <Button
                  priority="primary"
                  iconId="fr-icon-arrow-right-line"
                  iconPosition="right"
                  linkProps={{ href: COMPTE_SETTINGS_HREF }}
                >
                  Connecter ou reconnecter mon ERP au Tableau de bord
                </Button>
              </div>
              <div className={styles.callout}>
                <p className={styles.calloutTitle}>
                  Je veux ajouter mes données manuellement avec un fichier tableur (type Excel ou .csv)
                </p>
                <p>
                  Vous souhaitez actualiser les listes disponibles dans le Tableau de bord en important vos propres
                  fichiers tableurs ?
                </p>
                <p>Cliquez sur le lien ci-dessous pour accéder aux tutoriels</p>
                <Button
                  priority="primary"
                  iconId="fr-icon-arrow-right-line"
                  iconPosition="right"
                  linkProps={{ href: PAGES.static.effectifsTeleversement.getPath() }}
                >
                  Ajouter mes données avec un fichier tableur
                </Button>
              </div>
            </section>

            <section id="anciennes-fonctionnalites" className={styles.section}>
              <h2 className={styles.sectionTitle}>Où sont passées les anciennes fonctionnalités ?</h2>
              <p>
                Le Tableau de bord de l&apos;apprentissage a changé son modèle pour apporter aux acteurs de
                l&apos;apprentissage une utilité plus directe.
              </p>
              <p>
                Le service propose maintenant un outil de collaboration à partir duquel les CFA peuvent identifier et
                initier des opportunités de collaborations pour aider les jeunes.
                <br />
                Cet outil a été entièrement repensé dans une démarche de co-construction à la fois avec des CFA et des
                Missions Locales.
              </p>
              <p>
                Nous pensons que l&apos;outil de collaboration mis à disposition des équipes qui s&apos;occupent des
                jeunes et de leur projet professionnel permet un impact plus grand, plus mesurable et plus concret pour
                favoriser l&apos;apprentissage et l&apos;insertion professionnelle des jeunes.
              </p>
              <p>
                Toute notre équipe est entièrement mobilisée sur ces fonctionnalités nouvelles et ne peut donc pas
                maintenir en parallèle l&apos;ensemble des fonctionnalités de suivi de chiffres et statistiques sur
                l&apos;apprentissage que ce soit à l&apos;échelle d&apos;un établissement ou à l&apos;échelle nationale.
              </p>
              <blockquote className={`${styles.quote} ${styles.quoteStrong}`}>
                Les anciennes fonctionnalités de suivi d&apos;indicateurs, et d&apos;affichage de données chiffrées ne
                sont plus disponibles dans cette nouvelle version du Tableau de bord de l&apos;apprentissage.
              </blockquote>
            </section>

            <section id="contact" className={styles.section}>
              <h2 className={styles.sectionTitle}>Une question ? Contactez l&apos;équipe du Tableau de bord</h2>
              <p>L&apos;équipe reste joignable pour répondre à toutes vos questions.</p>
              <p>
                Nous pouvons aussi convenir d&apos;un créneau pour vous présenter la nouvelle version du Tableau de bord
                et vous aider vous et vos équipes à la prise en main du service et des premières collaborations avec les
                Missions Locales sur le service.
              </p>
              <Button
                priority="primary"
                iconId="fr-icon-arrow-right-line"
                iconPosition="right"
                linkProps={{ href: "/contact" }}
              >
                Contacter l&apos;équipe
              </Button>
              <Image
                src="/images/cfa-nouvelle-version/contact-illustration.svg"
                alt=""
                width={220}
                height={180}
                className={styles.contactImage}
              />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

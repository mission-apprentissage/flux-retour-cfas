import { fr } from "@codegouvfr/react-dsfr";
import type { ReactNode } from "react";

import { PAGES } from "@/app/_utils/routes.utils";

import { CGU_ARTICLES, type CguArticleId } from "./articles";
import { CguSideMenu } from "./CguSideMenu";
import styles from "./page.module.scss";

export const metadata = PAGES.static.cgu.getMetadata();

const CONTACT_EMAIL = "tableau-de-bord@apprentissage.beta.gouv.fr";

const CGU_VERSION_AFFICHEE = "v0.4";
const DERNIERE_MISE_A_JOUR = "20 janvier 2025";

const ContactEmailLink = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className={styles.mailLink}>
    {CONTACT_EMAIL}
  </a>
);

const ARTICLE_BODIES: Record<CguArticleId, ReactNode> = {
  "champ-preambule": (
    <>
      <p>
        La Plateforme Tableau de bord de l’apprentissage (ci-après la « Plateforme ») est un système d’information ayant
        pour objet :
      </p>
      <ul>
        <li>La mise à disposition à différents acteurs de données clés concernant l’apprentissage en temps réel.</li>
      </ul>
      <p>
        La Plateforme est créée et administrée par la Délégation générale à l’Emploi et à la Formation professionnelle
        du ministère du Travail (ci-après « la DGEFP »).
      </p>
      <p>
        L’Utilisateur reconnaît que l’utilisation de la Plateforme nécessite le respect de l’ensemble des dispositions
        des présentes et adhère sans réserve aux présentes CGU.
      </p>
    </>
  ),
  "champ-definition": (
    <>
      <p>Les termes ci-dessous définis ont, entre les parties, la signification suivante :</p>
      <ul>
        <li>
          <strong>« DGEFP »</strong> : Délégation générale à l’emploi et à la formation professionnelle ;
        </li>
        <li>
          <strong>« Tableau de bord de l’apprentissage »</strong> : Service numérique destiné à mettre à disposition de
          différents acteurs les données clés concernant l’apprentissage en temps réel ;
        </li>
        <li>
          <strong>« Ministère »</strong> : Ministère du Travail, du plein Emploi et de l’Insertion ;
        </li>
        <li>
          <strong>« Utilisateur »</strong> : désigne toute personne qui utilise les services proposés par la «
          Plateforme » (CFA ou organisme de formation, opérateur public, réseau d’organismes de formation, membre du
          Réseau des Carif-Oref, missions locales).
        </li>
      </ul>
    </>
  ),
  "champ-objet": (
    <p>
      Les présentes CGU ont pour objet de définir les modalités d’utilisation de la Plateforme, les fonctionnalités de
      la Plateforme et les responsabilités de la DGEFP et des Utilisateurs.
    </p>
  ),
  "champ-acceptation": (
    <>
      <p>
        Les présentes CGU ont valeur contractuelle et sont opposables à l’Utilisateur dès leur acceptation par ce
        dernier.
      </p>
      <p>
        À défaut d’acceptation des présentes CGU, l’Utilisateur ne pourra pas bénéficier des services de la Plateforme.
      </p>
      <p>
        Les présentes CGU sont opposables pendant toute la durée d’utilisation de la Plateforme et l’utilisateur reste
        responsable de toute action effectuée durant l’utilisation de la Plateforme.
      </p>
    </>
  ),
  "champ-maj": (
    <>
      <p>
        Les termes des présentes CGU peuvent être amendés à tout moment, sans préavis, en fonction des modifications
        apportées à la Plateforme, de l’évolution de la législation ou pour tout autre motif jugé nécessaire. Chaque
        modification donne lieu à une nouvelle version qui est acceptée par l’Utilisateur.
      </p>
      <p>L’Utilisateur sera informé en cas de modification des CGU.</p>
      <p>
        Si l’Utilisateur s’oppose aux modifications apportées, il est libre de cesser d’utiliser à tout moment les
        services de la Plateforme.
      </p>
    </>
  ),
  "champ-vigueur": (
    <>
      <p>
        Les présentes conditions générales d’utilisation entrent en vigueur à compter de leur date de mise en ligne sur
        la Plateforme.
      </p>
      <p>
        Les anciennes conditions générales d’utilisation peuvent être consultées à tout moment grâce à un versionnage
        mis en place par la Plateforme.
      </p>
    </>
  ),
  "champ-creation": (
    <>
      <p>
        La procédure de création de compte permet aux Utilisateurs de se créer un compte associé à leur type de profil
        et d’accéder aux fonctionnalités de la Plateforme. L’Utilisateur est titulaire d’un compte personnel, accessible
        par son identifiant personnel et un mot de passe qui doit contenir au moins douze caractères, une lettre
        minuscule, une lettre majuscule, un caractère spécial, un chiffre. Un seul compte peut être attribué par
        Utilisateur.
      </p>
      <p>
        L’Utilisateur doit indiquer une adresse électronique valide, personnelle et professionnelle notamment des
        adresses génériques.
      </p>
      <p>Il incombe à l’Utilisateur de s’assurer qu’il a seul accès à son courrier électronique.</p>
      <p>
        Tout accès à, et toute utilisation de la Plateforme à partir de l’adresse électronique de l’Utilisateur est
        présumé comme émanant exclusivement de l’Utilisateur.
      </p>
      <p>
        L’Utilisateur est responsable de la sincérité des informations qu’il fournit et s’engage à mettre à jour les
        informations le concernant ou à aviser la DGEFP sans délai de toute modification affectant sa situation.
      </p>
      <p>
        En cas d’utilisation frauduleuse de son compte, l’Utilisateur s’engage à prévenir immédiatement la DGEFP. Cette
        notification devra être adressée à la DGEFP via l’adresse e-mail suivante : <ContactEmailLink />. La date de
        réception de cette notification fera foi entre les parties. En l’absence de cette notification, l’utilisation
        est présumée être celle de l’Utilisateur. Il lui reviendra de s’assurer de l’usurpation ou de la compromission
        éventuelle.
      </p>
    </>
  ),
  "champ-presentation": (
    <>
      <p>Le Tableau de bord de l’apprentissage permet :</p>
      <ul>
        <li>Le pilotage des dispositifs relatifs à la politique de l’apprentissage ;</li>
        <li>L’aide à ceux qui peuvent agir à accompagner les apprentis en situation de rupture ou sans contrat ;</li>
        <li>
          La simplification de la délivrance d’informations par les CFA, en utilisant la donnée pour préremplir les
          enquêtes nationales qui leur sont demandées ;
        </li>
        <li>Le remplissage de contrats CERFA.</li>
      </ul>
      <p>Chaque Utilisateur peut :</p>
      <ul>
        <li>Consulter des données de l’apprentissage à des fins de pilotage ;</li>
        <li>Exporter des fichiers sous format agrégat de données de l’apprentissage ;</li>
        <li>
          Consulter pour une partie des Utilisateurs habilités des listes nominatives d’apprentis en situation de
          rupture ou d’abandon à des fins d’accompagnement ;
        </li>
        <li>
          Permettre aux organismes de formation de déposer des fichiers de données pour alimenter les chiffres de la
          Plateforme ;
        </li>
        <li>Optimiser la création de ses contrats d’apprentissage via un formulaire CERFA assisté.</li>
      </ul>
      <p>
        Notamment, des conseillers habilités de certaines missions locales ont accès à une liste de jeunes identifiés
        par la Plateforme comme nécessitant un accompagnement prioritaire.
      </p>
    </>
  ),
  "champ-plateform": (
    <>
      <p>
        La DGEFP se réserve le droit, sans préavis, ni indemnité, de fermer temporairement l’accès à une ou plusieurs
        fonctionnalités de la Plateforme pour effectuer une mise à jour, des modifications ou changement sur les
        méthodes opérationnelles, les serveurs et les heures d’accessibilité. Cette liste n’est pas limitative. Dans ce
        cas, la DGEFP peut indiquer une date de réouverture du compte ou d’accessibilité à une ou plusieurs
        fonctionnalités.
      </p>
      <p>
        En cas d’impossibilité d’accéder et/ou d’utiliser la Plateforme, l’Utilisateur peut toujours s’adresser à la
        DGEFP pour obtenir des informations via l’adresse suivante : <ContactEmailLink />
      </p>
    </>
  ),
  "champ-confidentialite": (
    <p>
      La DGEFP met en place les moyens nécessaires pour assurer le bon fonctionnement de la Plateforme et pour assurer
      la sécurité et la confidentialité des données des Utilisateurs.
    </p>
  ),
  "champ-responsabilite": (
    <>
      <p>La DGEFP ne saurait être responsable :</p>
      <ul>
        <li>
          En raison d’une interruption du service quelle que soit la durée ou la fréquence de cette interruption et
          quelle qu’en soit la cause, notamment en raison d’une maintenance nécessaire au fonctionnement, de pannes
          éventuelles, d’aléas techniques liés à la nature du réseau Internet, d’actes de malveillance ou de toute
          atteinte portée au fonctionnement de la Plateforme ;
        </li>
        <li>
          Sauf faute ou négligence prouvée de la DGEFP, des atteintes à la confidentialité des données personnelles de
          l’Utilisateur résultant de l’utilisation de son identifiant ou de son mot de passe ;
        </li>
        <li>
          Des conséquences provoquées par le caractère erroné ou frauduleux des informations fournies par un Utilisateur
          ;
        </li>
        <li>
          Des dommages directs ou indirects résultant de l’attitude, de la conduite ou du comportement d’un autre
          Utilisateur ;
        </li>
        <li>
          Des atteintes à la sécurité du système d’information, ainsi qu’aux données, pouvant causer des dommages aux
          matériels informatiques des Utilisateurs et à leurs données dès lors que le fait ne lui est pas imputable.
        </li>
      </ul>
    </>
  ),
  "champ-utilisateur": (
    <>
      <p>Dans le cadre de l’utilisation de la Plateforme, l’Utilisateur s’engage à :</p>
      <ul>
        <li>
          Se conformer aux stipulations décrites dans les CGU et aux dispositions des lois et règlements en vigueur, et
          à respecter les droits des tiers ;
        </li>
        <li>
          Ne créer qu’un seul compte Utilisateur et ne communiquer que des informations, fichiers et autres contenus
          conformes à la réalité, honnêtes et loyaux ;
        </li>
        <li>
          Ne pas divulguer via la Plateforme des propos ou des contenus illicites, et notamment tous contenus
          contrefaits, diffamatoires, injurieux, insultants, obscènes, offensants, discriminatoires, violents,
          xénophobes, incitant à la haine raciale ou faisant l’apologie du terrorisme, ou tout autre contenu contraire à
          la législation et réglementation applicable ainsi qu’aux bonnes mœurs et aux règles de bienséance ;
        </li>
        <li>
          Ne pas intégrer et diffuser via la Plateforme du contenu qui serait contraire à la finalité de celle-ci ;
        </li>
        <li>
          Ne pas communiquer ou envoyer, par l’intermédiaire de la Plateforme, du contenu, quel qu’il soit, qui
          comprendrait des liens pointant vers des sites internet illicites, offensants ou incompatibles avec la
          finalité de la Plateforme.
        </li>
      </ul>
      <p>
        En outre, l’Utilisateur garantit expressément la véracité et la réalité des informations qu’il communique sur la
        Plateforme. Il est, par ailleurs, seul responsable de la préservation et de la confidentialité de son
        identifiant et mot de passe.
      </p>
      <p>
        En cas de manquement à une ou plusieurs de ces obligations, la DGEFP se réserve le droit de suspendre l’accès
        et/ou de supprimer le compte de l’Utilisateur responsable.
      </p>
      <p>
        Concernant les missions locales ayant accès à une liste de jeunes identifiés par la Plateforme comme nécessitant
        un accompagnement prioritaire, seuls les directeurs des missions locales sont habilités à désigner les
        conseillers autorisés à accéder à ces informations.
      </p>
    </>
  ),
  "champ-propriete": (
    <>
      <p>
        La Plateforme et tous les éléments qui le composent notamment les programmes, données, textes, images, sons,
        dessins, graphismes etc. sont la propriété de la DGEFP ou font l’objet d’une concession accordée à son profit.
        Toute copie, reproduction, représentation, adaptation, diffusion, intégrale ou partielle de la Plateforme, par
        quelque procédé que ce soit et sur quelque support que ce soit est soumise à l’accord préalable écrit de la
        DGEFP, sous réserve des exceptions prévues par le Code de propriété intellectuelle.
      </p>
      <p>
        Toute utilisation non autorisée des contenus ou informations de la Plateforme, notamment à des fins
        d’exploitation commerciale, pourra faire l’objet de poursuites sur la base d’une action en contrefaçon et/ou
        d’une action en concurrence déloyale et/ou parasitisme de la part de la DGEFP.
      </p>
    </>
  ),
  "champ-protection": (
    <>
      <p>
        Les données à caractère personnel sont traitées par la DGEFP et les Utilisateurs dans le respect des
        dispositions de la Loi n° 78-17 du 6 janvier 1978 relative à l’informatique, aux fichiers et aux libertés, dans
        sa version en vigueur, ainsi qu’au Règlement Général sur la Protection des Données (RGPD).
      </p>
      <p>
        Conformément à l’article L. 322-2 du code des relations entre le public et l’administration, la réutilisation
        éventuelle d’informations publiques comportant des données à caractère personnel est subordonnée au respect des
        dispositions de la loi n° 78-17 du 6 janvier 1978 relative à l’informatique, aux fichiers et aux libertés.
      </p>
    </>
  ),
  "champ-droit": (
    <p>
      Les Conditions Générales d’Utilisation sont régies par le droit français. Toute difficulté relative à la validité,
      l’application ou l’interprétation des Conditions Générales d’Utilisation seront soumises, à défaut d’accord
      amiable, à la compétence du Tribunal Administratif de Paris, auquel les parties attribuent compétence
      territoriale, quel que soit le lieu d’exécution de la Plateforme ou le domicile du défendeur. Cette attribution de
      compétence s’applique également en cas de procédure en référé, de pluralité de défendeurs ou d’appel en garantie.
    </p>
  ),
};

export default function CguPage() {
  return (
    <main className={fr.cx("fr-container", "fr-py-6w")}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
          <CguSideMenu className={styles.sideMenu} />
        </div>

        <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
          <h1 className={styles.title}>Conditions générales d’utilisation du Tableau de bord de l’apprentissage</h1>
          <p className={styles.version}>
            Dernière mise à jour le : {DERNIERE_MISE_A_JOUR} - {CGU_VERSION_AFFICHEE}
          </p>
          <p>
            Les présentes conditions générales d’utilisation (dites « CGU ») définissent les conditions d’accès et
            d’utilisation des Services par l’Utilisateur.
          </p>

          {CGU_ARTICLES.map(({ id, number, name }) => (
            <section key={id} id={id} className={styles.article}>
              <h2 className={styles.articleTitle}>
                {number} - {name}
              </h2>
              {ARTICLE_BODIES[id]}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

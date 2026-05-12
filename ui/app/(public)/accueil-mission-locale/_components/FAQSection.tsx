import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { PAGES } from "@/app/_utils/routes.utils";

import { BaseFAQSection, type Question } from "../../_components/shared/BaseFAQSection";

const QUESTIONS: Array<Question> = [
  {
    label: "Comment fonctionne le Tableau de bord ?",
    answer: (
      <>
        <p>
          Le Tableau de bord de l’apprentissage vous permet d’identifier et d’accompagner les jeunes en rupture sur
          votre territoire, en lien avec les CFA.
        </p>
        <p>Pour les Missions Locales :</p>
        <ul>
          <li>Vous accédez à une liste de jeunes en rupture sur votre territoire.</li>
          <li>
            Ces jeunes sont identifiés de deux manières :
            <ul>
              <li>via les dossiers transmis par les CFA dans le cadre des collaborations qu’ils sollicitent,</li>
              <li>et via les données DECA pour les CFA non connectés au service.</li>
            </ul>
          </li>
          <li>
            Vous disposez des informations essentielles pour comprendre la situation du jeune et le contacter
            rapidement.
          </li>
          <li>Vous renseignez les actions réalisées (contact, rendez-vous, suite donnée).</li>
          <li>
            Vos retours sont visibles par le CFA lorsque le dossier a été transmis dans le cadre d’une collaboration.
          </li>
          <li>Vous pouvez inviter les CFA de votre territoire à collaborer sur le même outil que vous.</li>
        </ul>
        <p>Pour les CFA :</p>
        <ul>
          <li>Ils visualisent leurs effectifs et identifient les jeunes en rupture.</li>
          <li>Ils peuvent vous transmettre un dossier avec le contexte de la situation.</li>
          <li>Ils suivent l’avancement et sont notifiés de vos actions.</li>
        </ul>
      </>
    ),
  },
  {
    label: "Qu’est-ce qui est attendu de la part des Missions Locales ?",
    answer: (
      <>
        <p>
          Le Tableau de bord vous permet d’identifier les jeunes en rupture ou en risque de rupture de contrat
          d’apprentissage sur votre territoire.
        </p>
        <p>Ces dossiers peuvent provenir :</p>
        <ul>
          <li>des données DECA, pour les CFA qui ne sont pas encore connectés au service ;</li>
          <li>
            directement des CFA, lorsqu’ils vous transmettent un dossier avec le contexte de la situation et leurs
            besoins d’accompagnement.
          </li>
        </ul>
        <p>Votre rôle est de prendre contact avec les jeunes pour leur proposer un accompagnement.</p>
        <p>Selon leur situation et leurs besoins, vous pouvez :</p>
        <ul>
          <li>les aider à retrouver une entreprise ;</li>
          <li>les accompagner dans leur réorientation ;</li>
          <li>
            les aider à lever des freins liés au logement, à la mobilité, à la santé, aux démarches administratives ou à
            la situation financière.
          </li>
        </ul>
        <p>
          Si le jeune souhaite être accompagné, vous l’invitez à prendre rendez-vous à la Mission Locale afin de mettre
          en place un accompagnement adapté à sa situation.
        </p>
        <p>
          Vous renseignez ensuite les actions réalisées dans le Tableau de bord pour assurer le suivi du dossier et,
          lorsqu’un CFA est impliqué, partager les informations utiles à la collaboration.
        </p>
      </>
    ),
  },
  {
    label: "Comment collaborer avec les CFA ?",
    answer: (
      <>
        <p>
          Les CFA peuvent vous transmettre les dossiers des jeunes de 16 à 25 ans pour lesquels ils souhaitent l’appui
          de la Mission Locale.
        </p>
        <p>
          Avant l’envoi du dossier, le CFA renseigne le contexte de la situation et précise l’objectif de la demande,
          par exemple :
        </p>
        <ul>
          <li>aider le jeune à retrouver une entreprise ;</li>
          <li>lever des freins liés au logement, à la mobilité, à la santé ou aux démarches administratives ;</li>
          <li>accompagner une réorientation.</li>
        </ul>
        <p>Lorsque vous recevez un dossier :</p>
        <ul>
          <li>vous accédez aux informations utiles pour comprendre la situation du jeune ;</li>
          <li>vous disposez des coordonnées du référent CFA ;</li>
          <li>une fiche de suivi partagée est créée pour faciliter les échanges.</li>
        </ul>
        <p>Vous prenez ensuite contact avec le jeune pour lui proposer un accompagnement.</p>
        <p>
          À chaque mise à jour du dossier (prise de contact, rendez-vous, actions engagées), vos retours sont
          automatiquement partagés avec le CFA afin qu’il puisse suivre l’avancement de l’accompagnement.
        </p>
        <p>
          La collaboration avec les CFA permet ainsi de coordonner les actions de chacun et d’assurer un meilleur suivi
          des jeunes en rupture.
        </p>
      </>
    ),
  },
  {
    label: "Qui sont les jeunes qui seront visibles et à contacter sur le Tableau de bord ?",
    answer: (
      <>
        <p>
          Le Tableau de bord de l’apprentissage affiche les jeunes de 16 à 25 ans en rupture de contrat d’apprentissage,
          ou en risque de rupture, domiciliés sur le territoire de votre Mission Locale.
        </p>
        <p>Ces jeunes peuvent apparaître de deux façons :</p>
        <ul>
          <li>automatiquement, à partir des données DECA transmises par les OPCO ;</li>
          <li>via les dossiers envoyés directement par les CFA lorsqu’ils sollicitent votre accompagnement.</li>
        </ul>
        <p>
          Pour chaque jeune, vous disposez des informations utiles pour le contacter et, lorsque le dossier a été
          transmis par un CFA, du contexte de la situation et de l’objectif de la demande.
        </p>
        <p>Vous ne voyez que les jeunes rattachés au territoire de votre Mission Locale.</p>
      </>
    ),
  },
  {
    label: "D’où vient la source de données des listes du Tableau de bord ? Est-elle à jour ?",
    answer: (
      <>
        <p>Les données du Tableau de bord proviennent de deux sources principales :</p>
        <ul>
          <li>
            La base DECA, alimentée par les OPCO, qui centralise les informations relatives aux contrats
            d’apprentissage.
          </li>
          <li>
            Les ERP des CFA, lorsque les établissements choisissent de connecter leur logiciel de gestion au service.
          </li>
        </ul>
        <p>Les données sont mises à jour automatiquement chaque jour.</p>
        <p>
          Il est toutefois possible qu’un changement récent (nouveau contrat, reprise de formation, modification des
          coordonnées, etc.) n’apparaisse pas immédiatement dans le Tableau de bord. La situation affichée peut donc
          présenter un léger décalage avec la situation réelle du jeune.
        </p>
      </>
    ),
  },
  {
    label: "Comment obtenir un accès au Tableau de bord en tant que Mission Locale ?",
    answer: (
      <p>
        Rendez-vous ici pour créer votre compte utilisateur en Mission Locale :{" "}
        <DsfrLink href={PAGES.dynamic.authInscription({ typeOrganisation: "missions_locales" }).getPath()}>
          Créer mon compte en Mission Locale
        </DsfrLink>
      </p>
    ),
  },
];

export function FAQSection() {
  return <BaseFAQSection questions={QUESTIONS} />;
}

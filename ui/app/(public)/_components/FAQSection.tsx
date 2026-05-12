import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { PAGES } from "@/app/_utils/routes.utils";

import { BaseFAQSection, type Question } from "./shared/BaseFAQSection";

const QUESTIONS: Array<Question> = [
  {
    label: "Comment fonctionne le Tableau de bord ?",
    answer: (
      <>
        <p>
          Le Tableau de bord de l’apprentissage est un outil partagé entre les CFA, les Missions Locales et les acteurs
          territoriaux pour faciliter l’accompagnement des jeunes en rupture.
        </p>
        <p>
          <strong>Pour les CFA :</strong>
        </p>
        <ul>
          <li>Ils identifient rapidement les jeunes en rupture parmi leurs effectifs.</li>
          <li>Ils peuvent identifier et solliciter la bonne Mission Locale pour chaque jeune.</li>
          <li>
            Ils suivent l’avancement et les actions réalisées par les Missions Locales via une fiche navette interactive
            partagée.
          </li>
        </ul>
        <p>
          <strong>Pour les Missions Locales :</strong>
        </p>
        <ul>
          <li>
            Elles accèdent à une liste de jeunes en rupture sur leur territoire :
            <ul>
              <li>via les dossiers transmis par les CFA,</li>
              <li>et via les données DECA pour les CFA non connectés.</li>
            </ul>
          </li>
          <li>
            Elles contactent les jeunes et renseignent les actions réalisées (contact, rendez-vous, suite donnée).
          </li>
        </ul>
        <p>Pour les acteurs territoriaux :</p>
        <ul>
          <li>
            Ils suivent l’activité sur leur territoire : jeunes en rupture, dossiers transmis, jeunes contactés,
            rendez-vous pris.
          </li>
          <li>Ils identifient les CFA engagés et accompagnent le déploiement du service.</li>
        </ul>
        <p>
          Notre mission : Accélérer et optimiser la collaboration entre les CFA et les Missions Locales pour assurer un
          accompagnement coordonné pour chaque jeune dans une situation à risque dans son parcours d’apprentissage.
        </p>
      </>
    ),
  },
  {
    label: "Comment les Missions Locales accompagnent les jeunes en rupture ?",
    answer: (
      <>
        <p>Les Missions Locales proposent un accompagnement global, complémentaire à celui assuré par les CFA.</p>
        <p>
          Lorsqu’un dossier leur est transmis, elles prennent contact avec le jeune pour faire le point sur sa situation
          et évaluer ses besoins.
        </p>
        <p>Selon les cas, elles peuvent notamment :</p>
        <ul>
          <li>accompagner le jeune dans sa recherche d’entreprise ;</li>
          <li>
            l’aider à lever des freins liés au logement, à la mobilité, à la santé, aux démarches administratives ou à
            la situation financière ;
          </li>
          <li>l’accompagner dans un projet de réorientation ;</li>
          <li>mobiliser les dispositifs et partenaires adaptés à sa situation.</li>
        </ul>
        <p>
          Les Missions Locales interviennent ainsi sur les problématiques qui dépassent le cadre de la formation, afin
          de sécuriser le parcours du jeune et de l’aider à construire une solution durable.
        </p>
      </>
    ),
  },
  {
    label: "Comment fonctionne une collaboration avec les Missions Locales ?",
    answer: (
      <>
        <p>
          Depuis le Tableau de bord, vous visualisez l’ensemble des jeunes en rupture dans votre établissement et pouvez
          solliciter une Mission Locale pour ceux qui nécessitent un accompagnement complémentaire.
        </p>
        <p>
          <strong>Pour démarrer une collaboration :</strong>
        </p>
        <ul>
          <li>vous sélectionnez le dossier du jeune ;</li>
          <li>
            vous répondez à quelques questions pour préciser sa situation et le type d’accompagnement souhaité
            (recherche d’entreprise, levée de freins périphériques, réorientation) ;
          </li>
          <li>le dossier est automatiquement transmis à la Mission Locale compétente.</li>
        </ul>
        <p>
          <strong>Une fois la collaboration initiée :</strong>
        </p>
        <ul>
          <li>une fiche de suivi partagée est créée entre votre établissement et la Mission Locale ;</li>
          <li>
            la Mission Locale vous informe des actions réalisées (prise de contact, rendez-vous, accompagnement mis en
            place) ;
          </li>
          <li>vous êtes notifié à chaque mise à jour pour suivre l’avancement du dossier.</li>
        </ul>
        <p>La collaboration avec les Missions Locales est disponible pour les jeunes âgés de 16 à 25 ans.</p>
      </>
    ),
  },
  {
    label: "Pourquoi les jeunes en rupture de contrat et pas tous les apprenants ?",
    answer: (
      <>
        <p>
          Lors du lancement du service, les demandes de collaboration entre les CFA et les Missions Locales sont
          réservées aux jeunes ayant rompu leur contrat d’apprentissage.
        </p>
        <p>
          Ce choix permet de concentrer les efforts sur les situations les plus urgentes, afin d’accompagner les jeunes
          qui risquent de décrocher après une rupture.
        </p>
        <p>
          L’ouverture de la collaboration à l’ensemble des apprenants est prévue prochainement. Les CFA pourront alors
          également transmettre les dossiers de jeunes présentant des signes de fragilité ou des risques de rupture.
        </p>
        <p>
          Cette évolution permettra de renforcer la collaboration entre les CFA et les Missions Locales, non seulement
          pour accompagner les jeunes après une rupture, mais aussi pour prévenir les ruptures avant qu’elles ne
          surviennent.
        </p>
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
    label: "Je veux bénéficier du Tableau de bord pour mon établissement (CFA) comment faire ?",
    answer: (
      <p>
        Rendez-vous ici pour créer votre compte utilisateur CFA :{" "}
        <DsfrLink href={PAGES.static.authInscriptionCfa.getPath()}>Créer mon compte CFA</DsfrLink>
      </p>
    ),
  },
  {
    label: "Je veux utiliser le Tableau de bord dans ma Mission Locale, comment faire ?",
    answer: (
      <p>
        Rendez-vous ici pour créer votre compte utilisateur en Mission Locale :{" "}
        <DsfrLink href={PAGES.dynamic.authInscription({ typeOrganisation: "missions_locales" }).getPath()}>
          Créer mon compte en Mission Locale
        </DsfrLink>
      </p>
    ),
  },
  {
    label:
      "Je veux accéder au suivi des activités de collaborations entre les CFA et les Missions Locales sur mon territoire",
    answer: (
      <p>
        Rendez-vous ici pour demander votre accès en tant que référent sur votre territoire :{" "}
        <DsfrLink href={PAGES.dynamic.authInscription({ typeOrganisation: "operateur_public" }).getPath()}>
          Demander mon accès en tant que référent
        </DsfrLink>
      </p>
    ),
  },
  {
    label: "Comment est mesuré l’impact du service du Tableau de bord ?",
    answer: (
      <>
        <p>
          L’indicateur principal du service est le nombre de rendez-vous pris par les Missions Locales avec des jeunes
          repérés grâce au Tableau de bord.
        </p>
        <p>
          Une attention particulière est portée aux jeunes qui n’étaient pas connus des services publics de l’emploi
          avant leur prise en charge. Cet indicateur permet de mesurer la capacité du service à repérer de nouveaux
          jeunes et à les orienter vers un accompagnement.
        </p>
        <p>Cet indicateur reflète concrètement l’impact du Tableau de bord :</p>
        <ul>
          <li>repérer des jeunes en rupture ;</li>
          <li>entrer en contact avec eux ;</li>
          <li>les amener à accepter un accompagnement ;</li>
          <li>déclencher un premier rendez-vous avec la Mission Locale.</li>
        </ul>
        <p>
          L’objectif du service est de faire en sorte qu’aucun jeune en rupture ne reste sans solution ni
          accompagnement.
        </p>
      </>
    ),
  },
];

export function FAQSection() {
  return <BaseFAQSection questions={QUESTIONS} />;
}

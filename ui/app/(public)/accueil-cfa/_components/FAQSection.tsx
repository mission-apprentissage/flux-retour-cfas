import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { PAGES } from "@/app/_utils/routes.utils";

import { BaseFAQSection, type Question } from "../../_components/shared/BaseFAQSection";

const QUESTIONS: Array<Question> = [
  {
    label: "Comment fonctionne le Tableau de bord ?",
    answer: (
      <>
        <p>
          Le Tableau de bord de l’apprentissage est un outil partagé entre les CFA et les Missions Locales pour
          faciliter l’accompagnement des jeunes en rupture.
        </p>
        <p>Pour les CFA :</p>
        <ul>
          <li>Vous visualisez l’ensemble de vos effectifs et identifiez rapidement les jeunes en rupture.</li>
          <li>Les données proviennent de la base DECA (OPCO) ou de votre ERP si vous choisissez de le connecter.</li>
          <li>Pour chaque jeune, vous pouvez solliciter une Mission Locale en quelques clics.</li>
          <li>Vous renseignez le contexte de la situation pour permettre une prise en charge adaptée.</li>
          <li>Le dossier est automatiquement transmis à la Mission Locale compétente.</li>
          <li>Vous suivez l’avancement et êtes notifié des actions réalisées.</li>
        </ul>
        <p>Pour les Missions Locales :</p>
        <ul>
          <li>
            Elles identifient les jeunes en rupture sur leur territoire :
            <ul>
              <li>
                via les dossiers transmis par les CFA connectés dans le cadre des collaborations qu’ils sollicitent,
              </li>
              <li>et via les données DECA pour les CFA non connectés.</li>
            </ul>
          </li>
          <li>Elles disposent des informations utiles pour contacter rapidement le jeune.</li>
          <li>
            Elles renseignent les actions menées (contact, rendez-vous, suite donnée), visibles dans le suivi du
            dossier.
          </li>
        </ul>
      </>
    ),
  },
  {
    label: "Que font les Missions Locales pour accompagner les jeunes ?",
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
        <p>Pour démarrer une collaboration :</p>
        <ul>
          <li>vous sélectionnez le dossier du jeune ;</li>
          <li>
            vous répondez à quelques questions pour préciser sa situation et le type d’accompagnement souhaité
            (recherche d’entreprise, levée de freins périphériques, réorientation) ;
          </li>
          <li>le dossier est automatiquement transmis à la Mission Locale compétente.</li>
        </ul>
        <p>Une fois la collaboration initiée :</p>
        <ul>
          <li>une fiche de suivi partagée est créée entre votre établissement et la Mission Locale ;</li>
          <li>
            la Mission Locale vous informe des actions réalisées (prise de contact, rendez-vous, accompagnement mis en
            place) ;
          </li>
          <li>vous êtes notifié à chaque mise à jour pour suivre l’avancement du dossier.</li>
        </ul>
        <p>
          La collaboration avec les Missions Locales est disponible uniquement pour les jeunes âgés de 16 à 25 ans
          (périmètre d’action de la Mission Locale).
        </p>
      </>
    ),
  },
  {
    label: "Quels jeunes devrais-je transmettre aux Missions Locales ?",
    answer: (
      <>
        <p>
          Vous pouvez transmettre les dossiers des jeunes pour lesquels vous estimez qu’un accompagnement complémentaire
          par la Mission Locale serait utile.
        </p>
        <p>Il s’agit notamment des jeunes :</p>
        <ul>
          <li>
            dont la reprise peut être ralentie par des difficultés liées au logement, à la mobilité, à la santé, aux
            démarches administratives ou à la situation financière ;
          </li>
          <li>qui s’absentent régulièrement ou semblent prendre de la distance avec leur formation ;</li>
          <li>qui rencontrent des difficultés à retrouver une entreprise ;</li>
          <li>qui envisagent une réorientation ;</li>
          <li>pour lesquels l’accompagnement du CFA seul peut ne pas suffire.</li>
        </ul>
        <p>Il n’est pas nécessaire de transmettre tous les jeunes en rupture.</p>
        <p>
          La collaboration avec la Mission Locale est particulièrement utile pour les situations nécessitant un
          accompagnement global, au-delà du seul cadre de la formation.
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
    label: "Je veux bénéficier du Tableau de bord pour mon établissement comment faire ?",
    answer: (
      <p>
        Rendez-vous ici pour créer votre compte utilisateur CFA :{" "}
        <DsfrLink href={PAGES.static.authInscriptionCfa.getPath()}>Créer mon compte CFA</DsfrLink>
      </p>
    ),
  },
];

export function FAQSection() {
  return <BaseFAQSection questions={QUESTIONS} />;
}

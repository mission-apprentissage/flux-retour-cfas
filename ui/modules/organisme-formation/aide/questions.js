import { Box, Img, Stack, Text } from "@chakra-ui/react";

import Link from "../../../components/Links/Link";

export const questions = [
  {
    question: "Est-ce que les données de votre organisme s'affichent sur le tableau de bord ?",
    answer: (
      <Text>
        Les données de votre organisme s&apos;affichent si vous avez autorisé votre ERP (ou logiciel de gestion) à
        transmettre vos données au tableau de bord de l&apos;apprentissage. Ceci concerne les clients de SC Form, Ymag,
        Gestibase ou FCA Manager.
      </Text>
    ),
  },
  {
    question: "Comment accéder votre page organisme de formation sur le tableau de bord ?",
    answer: (
      <Stack id="ConsulterDonneesCFA" spacing="2w">
        <Text>
          Si vous transmettez des données au tableau de bord de l&apos;apprentissage, vous pouvez les consulter et les
          vérifier directement sur le tableau de bord de l&apos;apprentissage. Le lien vous permettant d&apos;accéder à
          votre page organisme de formation, est disponible directement dans votre ERP.
        </Text>
        <Text as="em">
          Ce lien ne doit pas être partagé en dehors des personnes habilitées de votre organisme de formation, car vous
          pourrez y consulter des données personnelles.
        </Text>
        <Text>Si vous utilisez Ymag :</Text>
        <Img src="https://files.tableau-de-bord.apprentissage.beta.gouv.fr/liens-prives/Ypareo.png" />
        <Text>Si vous utilisez Gesti :</Text>
        <Img src="https://files.tableau-de-bord.apprentissage.beta.gouv.fr/liens-prives/Gesti.png" />
        <Text>En attente des visuels pour FCA Manager et SC Form.</Text>
      </Stack>
    ),
  },
  {
    question: "Qui peut consulter les données de votre organisme ?",
    answer: (
      <Stack>
        <Text>
          Les personnes autorisées à consulter les données de votre organisme dépendent du service public de
          l&apos;emploi (Conseil régional, Académie et DREETS), les organisations professionnelles (OPCO) et le Carif
          Oref de votre région. Si vous êtes membre d&apos;un réseau, la tête de votre réseau peut également consulter
          votre page.
        </Text>
        <Text>L&apos;analyse de l&apos;impact de la protection des données (AIPD) est disponible à la demande.</Text>
      </Stack>
    ),
  },
  {
    question: "Pourquoi transmettre les données de votre organisme au tableau de bord ?",
    answer: (
      <Stack>
        <Text>
          Différentes institutions (Conseil régional, DREETS, Opco, Carif Oref, Académie, DGEFP) consultent le tableau
          de bord de l&apos;apprentissage quotidiennement pour suivre l&apos;évolution des effectifs.&nbsp;
        </Text>
        <Text fontWeight="700">
          Ces données les éclairent notamment pour attribuer des subventions, pour mettre en place des plans
          d&apos;actions d&apos;accompagnement des jeunes sans contrat ou pour définir les politiques publiques
          d&apos;aide à l&apos;apprentissage.
        </Text>
      </Stack>
    ),
  },
  {
    question: "Comment consulter ces données sur le tableau de bord ?",
    answer: (
      <Stack>
        <Text>
          Vous pouvez y accéder via une URL unique pour votre organisme de formation.&nbsp;
          <strong>
            Cette URL est privée, ne la partagez qu&apos;avec les personnes gestionnaires de votre organisme de
            formation.
          </strong>
        </Text>
        <Text>
          <a href="#ConsulterDonneesCFA">
            <strong>Vous la trouverez directement dans votre ERP (ou logiciel de gestion).</strong>
          </a>
          Si toutefois, l&apos;URL n&apos;est pas encore intégrée dans votre interface de gestion, vous pouvez en faire
          la demande en&nbsp;
          <Link href="/organisme-formation/consulter" color="bluefrance">
            contactant l&apos;équipe du tableau de bord
          </Link>
          .
        </Text>
      </Stack>
    ),
  },
  {
    question: "Comment transmettre les données de mon organisme au tableau de bord de l'apprentissage ?",
    answer: (
      <Stack>
        <Text>
          Pour transmettre les données de votre ERP vers le tableau de bod, vous devez en effectuer le paramétrage. Ce
          paramétrage à faire une seule fois est estimé à 10 minutes.
        </Text>
        <Text>
          Pour ce faire,&nbsp;
          <Link href="/organisme-formation/transmettre" color="bluefrance">
            sélectionnez l&apos;ERP que vous utilisez
          </Link>
          , téléchargez le pas à pas correspondant et suivez les étapes une à une.
        </Text>
      </Stack>
    ),
  },
  {
    question:
      "Qu'est-ce qu'un UAI ? Comment retrouver l'UAI de votre organisme ? Vous avez plusieurs UAI, lequel devez-vous renseigner ?",
    answer: (
      <Stack>
        <Text>
          L&apos;UAI (unité administrative immatriculée) est le code d&apos;immatriculation qu&apos;utilise
          l&apos;Éducation Nationale pour enregistrer votre organisme dans le répertoire national des établissement
          (RNE). Elle est composée de sept chiffres et une lettre.
        </Text>
        <Text>
          Si vous êtes une Unité de Formation en Apprentissage (UFA) ou un organisme formateur, il se peut que vous ayez
          deux UAI, celle de votre organisme gestionnaire (ou responsable) et la votre. Pour que les effectifs soient
          affichés au niveau formateur, renseignez votre UAI plutôt que celle de votre organisme gestionnaire (ou
          responsable).
        </Text>
      </Stack>
    ),
  },
  {
    question: "Qu'est-ce qu'un ERP (ou logiciel de gestion) ?",
    answer: (
      <Stack>
        <Text>
          ERP signifie Enterprise Ressource Planning, en français on utilise le terme Progiciel de Gestion Intégré. Il
          s&apos;agit d&apos;un logiciel de gestion permettant de suivre au quotidien les aspects administratifs et les
          informations d&apos;une entreprise.
        </Text>
        <Text>
          La plupart des organismes de formation utilisent un ERP pour suivre leur apprenants et les contrats des
          apprentis.
        </Text>
      </Stack>
    ),
  },
  {
    question: "Je n'ai pas d'ERP (ou logiciel de gestion), comment puis-je transmettre ?",
    answer: (
      <Stack>
        <Text>
          A ce jour, si vous utilisez Ypaéro, Gesti, SC Form ou FCA Manager, vous pouvez transmettre vos données au
          tableau de bord (cf pas à pas) Si vous utilisez un autre ERP, n&apos;hésitez pas à les contacter pour les
          inviter à faire les développements nécessaires.
        </Text>
        <Text>
          Si vous n&apos;utilisez pas d&apos;ERP, vous ne pouvez pas transmettre vos données au tableau de bord.
          Cependant, l&apos;équipe projet travaille à une évolution qui vous permettra de communiquer vos données via
          des feuilles de calcul. Si vous souhaitez être informé lorsque cette fonctionnalité sera possible,&nbsp;
          <Link
            isExternal
            href="https://30b15af4.sibforms.com/serve/MUIEAPdRGlY3_RW2L95eKPy1m-ZyZnTQHduuGSP5M6XnSFAzXtPNG8Rxndhgp7Ei1SQ5NZYx58-TDM_p7V_NYKmy5TL83Re49JwWk5Y57BkmcjjXg49Ca0eIWAq3-injPPOz9s46qDzoyeX8MEP6QqZGFoDdMuuL7uSfkYYjrFf_PKZFqgO3jeQWTrGJHXiSbdzkPjAChU0vXb6q"
          >
            <Box as="span" color="bluefrance">
              transmettez-nous vos coordonnées
            </Box>
          </Link>
          .
        </Text>
      </Stack>
    ),
  },
  {
    question: "Quelles sont les données affichées ?",
    answer: (
      <Stack>
        <Text>
          Les données affichées sont celles transmises par votre établissement via votre ERP. Ces données ne sont pas
          transformées, elles sont juste agrégées afin d&apos;identifier le nombre d&apos;apprentis par niveau et code
          diplôme, les inscrits sans contrats, les rupturants et les abandons.
        </Text>
        <Text>Pour connaître la définition des différents statuts affichés, dépliez la question ci-dessous.</Text>
      </Stack>
    ),
  },
  {
    question: "Comment le tableau de bord définit un “inscrit sans contrat” ? et un apprenant en situation d'abandon ?",
    answer: (
      <Text>
        Les apprentis sont les apprenants avec un contrat d&apos;apprentissage, les inscrits sans contrat sont les
        apprenants qui n&apos;ont pas encore de contrat d&apos;apprentissage, les rupturants sont les apprentis qui
        n&apos;ont plus de contrat d&apos;apprentissage, les abandons correspondent à tous les apprenants ayant mis fin
        à leur formation avant la date de fin prévue.
      </Text>
    ),
  },
  {
    question: "Certaines données affichées ne sont pas bonnes. Comment puis-je les corriger ?",
    answer: (
      <Stack>
        <Text>
          Cela provient d&apos;un mauvais paramétrage dans votre ERP, vous pouvez&nbsp;
          <Link color="bluefrance" href="/organisme-formation/transmettre">
            consulter les pas à pas
          </Link>
          &nbsp;pour le modifier.
        </Text>
        <Text>Avez vous bien paramétré votre ERP ? Avez-vous renseigné toutes les informations dans votre ERP ? </Text>
        <Text>Si cela ne résoud pas le problème d&apos;affichage, contactez-nous.</Text>
      </Stack>
    ),
  },
  {
    question: "La transmission des données au tableau de bord est-elle obligatoire ?",
    answer: (
      <Stack>
        <Text>
          En tant qu&apos;opérateur d&apos;une mission de service public, c&apos;est une obligation légale au sens du
          premier article de la loi pour une République numérique.
        </Text>
        <Text>
          Le tableau de bord de l&apos;apprentissage va devenir l&apos;outil de référence des pouvoirs publics. À ce
          titre, certaines régions utilisent déjà cet outil pour attribuer les aides aux centres de formation. Il est
          porté par la DGEFP comme le futur outil de pilotage des politiques publiques de l&apos;apprentissage. En ne
          transmettant pas vos données, vous ne donnerez donc aucune visibilité sur votre réalité et sur vos besoins en
          tant qu&apos;organisme de formation.
        </Text>
      </Stack>
    ),
  },
  {
    question: "La transmission des données au tableau de bord remplace-t'elle l'enquête SIFA ?",
    answer: (
      <Stack>
        <Text>
          À ce jour, transmettre vos données au tableau de bord ne vous dispense pas de remplir l&apos;enquête SIFA.
        </Text>
        <Text>
          Une fois les objectifs d&apos;acquisition et de qualité des données seront atteints, de nouveaux usages des
          données collectées pourront être étudiés et si rien n&apos;est engagé, la DEPP qui administre SIFA,
          s&apos;intéresse à nos travaux.
        </Text>
      </Stack>
    ),
  },
];

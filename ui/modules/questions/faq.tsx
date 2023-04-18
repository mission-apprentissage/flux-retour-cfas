import { CONTACT_ADDRESS } from "@/common/constants/product";
import { AccordionItemProp, BaseAccordionGroup } from "@/components/BaseAccordionGroup/BaseAccordionGroup";
import Link from "@/components/Links/Link";
import { Box, Heading, ListItem, Text, UnorderedList } from "@chakra-ui/react";

const questionsFonctionnement: AccordionItemProp[] = [
  {
    title: "Qu’est-ce que l’outil tableau de bord de l’apprentissage ?",
    content: (
      <Box>
        <Text>
          Le tableau de bord de l’apprentissage est un produit créé par la Mission Interministérielle pour
          l’apprentissage. <br />
          Il permet de visualiser en temps réel les effectifs d’apprentis dans les centres de formation et les
          organismes de formation, permettant aux pouvoirs publics de piloter au mieux la politique de l’apprentissage
          nationalement et localement. <br />
          Il est hébergé sur{" "}
          <Link href="https://cfas.apprentissage.beta.gouv.fr" color="bluefrance" textDecoration="underLine">
            https://cfas.apprentissage.beta.gouv.fr <Box as="i" className="ri-links-line" />
          </Link>
        </Text>
      </Box>
    ),
  },
  {
    title: "Qu’est-ce que la Mission interministérielle pour l’apprentissage ?",
    content: (
      <Box>
        La mission pour l’apprentissage a pour but de :
        <UnorderedList marginLeft="3w">
          <ListItem>Rendre visibles les offres de formation et de contrats d’apprentissage ;</ListItem>
          <ListItem>Sécuriser et fluidifier les inscriptions en apprentissage ;</ListItem>
          <ListItem>Aider les jeunes à s’orienter ;</ListItem>
          <ListItem>Aider les jeunes et les entreprises à se comprendre ;</ListItem>
          <ListItem>Diminuer les ruptures des contrats d’apprentissage.</ListItem>
        </UnorderedList>
        <br />
        Pour en savoir plus et connaître les autres produits et services de la mission,{" "}
        <Link
          href="https://mission-apprentissage.gitbook.io/general/la-mission-apprentissage/les-services-attendus-de-la-mission-apprentissage"
          color="bluefrance"
          textDecoration="underLine"
        >
          consulter le Gitbook de la mission. <Box as="i" className="ri-links-line" />
        </Link>
      </Box>
    ),
  },
  {
    title: "Quel est l’objectif du tableau de bord ?",
    content: (
      <Box>
        <Text>
          Le tableau de bord doit permettre aux pouvoir publics locaux et nationaux de piloter la politique de
          l’apprentissage au plus juste de la réalité du terrain. Pour cela il doit fournir des chiffres-clés de
          l’apprentissage exhaustifs, fiables et en temps réel pour représenter au mieux la situation des organismes de
          formation, ainsi que celle des apprenantes et apprenants.
        </Text>
      </Box>
    ),
  },
  {
    title: "Pour quels usages et quels utilisateurs a été conçu le tableau de bord ?",
    content: (
      <Box>
        <Text>
          Le tableau de bord de l’apprentissage a été conçu pour répondre aux besoins du ministère du Travail et du
          ministère de l’Éducation Nationale, de l’Enseignement supérieur et de la Transformation publique, en terme de
          visibilité sur les chiffres clés de l’apprentissage. <br />
          Pour en savoir plus sur les utilisateurs du tableau de bord de l’apprentissage , <br />
          consultez{" "}
          <Link href="/organisme-formation/aide" color="bluefrance" textDecoration="underLine">
            Qui peut consulter les données de votre organisme ? <Box as="i" className="ri-links-line" />
          </Link>
        </Text>
      </Box>
    ),
  },
  {
    title: "Quelles institutions ont accès aux données du tableau de bord ?",
    content: (
      <Box>
        <Text>
          Des institutions qui pilotent l’apprentissage nationalement ou territorialement comme la DREETS, la DRAAF, le
          Conseil Régional, l’Académie et le Carif Oref par exemple.
        </Text>
      </Box>
    ),
  },
  {
    title: "Puis-je participer à l’amélioration du tableau de bord ?",
    content: (
      <Box>
        <Text>
          Nous avons actuellement plusieurs travaux et recherches en cours afin d’améliorer le tableau de bord et les
          fonctionnalités à disposition. Si vous souhaitez y participer ou nous faire un retour, vous pouvez nous écrire
          à{" "}
          <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
            {CONTACT_ADDRESS}
          </Link>
        </Text>
      </Box>
    ),
  },
];

const questionsCollecteDonnees: AccordionItemProp[] = [
  {
    title: "La transmission des données au tableau de bord est-elle obligatoire ?",
    content: (
      <Box>
        <Text>
          En tant qu’opérateur d’une mission de service public, c’est une obligation légale au sens du premier article
          de la loi pour une République numérique.
        </Text>
        <Text>
          Le tableau de bord de l’apprentissage va devenir l’outil de référence des pouvoirs publics. À ce titre,
          certaines régions utilisent déjà cet outil pour attribuer les aides aux centres de formation. Il est porté par
          la DGEFP comme le futur outil de pilotage des politiques publiques de l’apprentissage. En ne transmettant pas
          vos données, vous ne donnerez donc aucune visibilité sur votre réalité et sur vos besoins en tant qu’organisme
          de formation.
        </Text>
      </Box>
    ),
  },
  {
    title: "Quelles données sont collectées et affichées sur le tableau de bord ?",
    content: (
      <Box>
        <Text>
          Nous collectons les données permettant d’identifier une apprenante ou un apprenant, ces données personnelle ne
          sont pas restituées dans le tableau de bord.
          <br />
          <br />
          Les données collectées sont liées à l’organisme, à la formation, et au statut de l’apprenant (stagiaire de la
          formation professionnelle, apprentie ou apprenti, en rupture de contrat, en abandon) afin de donner une vision
          globale de l’apprentissage à un instant donné.
          <br />
          <br />
          Pour en savoir plus, consultez le détail sur la rubrique{" "}
          <Link href="/comprendre-les-donnees" color="bluefrance" textDecoration="underLine">
            Comprendre les données <Box as="i" className="ri-links-line" />
          </Link>
          <br />
          <br />
          L’AIPD (Analyse d’Impact Relative à la Protection des Données) est disponible sur simple demande à l’équipe du
          tableau de bord :{" "}
          <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
            {CONTACT_ADDRESS}
          </Link>
        </Text>
      </Box>
    ),
  },
  {
    title: "Comment sont collectées les données ?",
    content: (
      <Box>
        <Text>
          Pour simplifier les démarches de collecte de données, qui étaient auparavant effectuées par chacune des
          administrations (Académie, DREETS, DRAAF, Carif Oref, etc), le tableau de bord agrège les données depuis les
          ERP des établissements de formation. les données utiles directement via l’ERP de l’établissement.
          <br />
          <br />
          L’ERP est le logiciel utilisé par les établissements pour effectuer le suivi de leurs effectifs d’apprenties
          et d’apprentis.
          <br />
          <br />
          L’équipe du tableau de bord travaille à une solution pour que les établissements non équipés d’un ERP
          interfaçable, puissent déposer les données utiles. Cette solution sera disponible gratuitement sur le site du
          tableau de bord, au quatrième trimestre 2022.
          <br />
          <br />
          Pour en savoir plus, consultez{" "}
          <Link href="/organisme-formation/transmettre" color="bluefrance" textDecoration="underLine">
            Comment transmettre les données de mon organisme au tableau de bord de l’apprentissage ?
            <Box as="i" className="ri-links-line" />
          </Link>
        </Text>
      </Box>
    ),
  },
  {
    title: "Que recouvrent les chiffres clefs de l’apprentissage ?",
    content: (
      <Box>
        <Text>
          L’équipe du tableau de bord récolte des données permettant d’identifier, de fiabiliser et de contrôler les
          données concernant les apprenantes et apprenants, les formations, les contrats et les organismes de formation.
          <br />
          <br />
          Aucune donnée n’est modifiée ou retraitée. Elles permettent d’identifier le nombre d’ “apprentis” (avec
          formation et contrat), de stagiaires de la formation professionnelle ou “inscrits sans contrat” (inscrits en
          formation mais sans aucun contrat pour cette formation), de “rupturants” (inscrits en formation avec un
          contrat rompu en attente d’un nouveau contrat), “abandons” (ayant quitté la formation et l’employeur).
          <br />
          <br />
          Pour en savoir plus, consulter la rubrique{" "}
          <Link href="/comprendre-les-donnees" color="bluefrance" textDecoration="underLine">
            Comprendre les données <Box as="i" className="ri-links-line" />
          </Link>
        </Text>
      </Box>
    ),
  },
  {
    title: "Comment proposer aux organismes de formation de transmettre leurs données ?",
    // FIXME contenu à rédiger
    content: (
      <Box>
        <Text>...</Text>
      </Box>
    ),
  },
];
const questionsConsultationDonnees: AccordionItemProp[] = [
  {
    title: "Comment sont utilisées les données des apprenantes et apprenants ?",
    content: (
      <Box>
        <Text>
          Les données personnelles ne sont pas exploitées sauf dans le cadre d’une convention avec une administration
          publique locale pour mettre en place un accompagnement des jeunes en situation de décrochage.
        </Text>
      </Box>
    ),
  },
  {
    title:
      "J’ai constaté une erreur dans les chiffres affichés ou les informations concernant un établissement : que faire ?",
    content: (
      <Box>
        <Text>
          Si vous êtes un organisme de formation, vérifiez le paramétrage du logiciel de gestion que vous utilisez, si
          celui-ci est correct ou si vous avez un doute contactez nous par courriel :{" "}
          <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
            {CONTACT_ADDRESS}
          </Link>
        </Text>
      </Box>
    ),
  },
];
const questionsCreationCompte: AccordionItemProp[] = [
  {
    title: "Puis-je télécharger les données affichées pour les vérifier ?",
    content: (
      <Box>
        <Text>
          Toutes les données auxquelles vous avez accès sur le tableau de bord sont téléchargeables au format CSV afin
          d’en faciliter le traitement.
        </Text>
      </Box>
    ),
  },
];

export default function FAQ() {
  return (
    <>
      <Heading as="h2" color="#465F9D" fontSize="beta" fontWeight="700" mt={8}>
        Questions fréquemment posées
      </Heading>

      <Heading as="h2" fontSize="24px" mt={12} mb={0}>
        Sur le fonctionnement du tableau de bord
      </Heading>
      <Box width={["100%", "100%", "70%", "70%"]}>
        <BaseAccordionGroup items={questionsFonctionnement} />
      </Box>

      <Heading as="h2" fontSize="24px" mt={12} mb={0}>
        Sur la collecte des données
      </Heading>
      <Box width={["100%", "100%", "70%", "70%"]}>
        <BaseAccordionGroup items={questionsCollecteDonnees} />
      </Box>

      <Heading as="h2" fontSize="24px" mt={12} mb={0}>
        Sur la consultation des données et leur usage
      </Heading>
      <Box width={["100%", "100%", "70%", "70%"]}>
        <BaseAccordionGroup items={questionsConsultationDonnees} />
      </Box>

      <Heading as="h2" fontSize="24px" mt={12} mb={0}>
        Sur la création de votre compte
      </Heading>
      <Box width={["100%", "100%", "70%", "70%"]}>
        <BaseAccordionGroup items={questionsCreationCompte} />
      </Box>
    </>
  );
}

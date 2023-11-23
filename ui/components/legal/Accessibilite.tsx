import { Box, Heading, Link, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import React from "react";

import { ExternalLinkLine } from "@/theme/components/icons";

const Accessibilite = () => {
  return (
    <Box pt={4} pb={16} gap={4}>
      <Text mt={4}>
        Établie le <span>22 novembre 2023</span>.
      </Text>
      <Text mt={4}>
        <span>Ministère du Travail, du Plein emploi et de l’Insertion</span> s’engage à rendre son service accessible,
        conformément à l’article 47 de la loi n°2005-102 du 11 février 2005.
      </Text>
      <Text mt={4}>
        Cette déclaration d’accessibilité s’applique à <strong>Tableau de bord de l’apprentissage</strong>
        <span>
          {" "}
          (<span>https://cfas.apprentissage.beta.gouv.fr</span>)
        </span>
        .
      </Text>
      <Heading as={"h3"} size="lg" mt={8} mb={2}>
        État de conformité
      </Heading>
      <Text mt={4}>
        <strong>Tableau de bord de l’apprentissage</strong> est &nbsp;
        <strong>
          <span data-printfilter="lowercase">non conforme</span>
        </strong>{" "}
        avec le <abbr title="Référentiel général d’amélioration de l’accessibilité">RGAA</abbr>.{" "}
        <span>Le site n’a encore pas été audité.</span>
      </Text>
      <Heading as={"h3"} size="lg" mt={8} mb={2}>
        Contenus non accessibles
      </Heading>
      <Heading as={"h4"} size="lg" mt={8} mb={2}>
        Amélioration et contact
      </Heading>
      <Text mt={4}>
        Si vous n’arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le responsable de{" "}
        <span>Tableau de bord de l’apprentissage</span> pour être orienté vers une alternative accessible ou obtenir le
        contenu sous une autre forme.
      </Text>
      <UnorderedList className="basic-information feedback h-card" pl={8} pt={4}>
        <ListItem>
          E-mail&nbsp;:{" "}
          <a href="mailto:tableau-de-bord@apprentissage.beta.gouv.frtableau-de-bord@apprentissage.beta.gouv.fr">
            tableau-de-bord@apprentissage.beta.gouv.fr
          </a>
        </ListItem>

        <ListItem>linkedin : https://www.linkedin.com/company/mission-apprentissage/</ListItem>
      </UnorderedList>
      <Text mt={4}>
        Nous essayons de répondre dans les <span>2 jours ouvrés</span>.
      </Text>
      <Heading as={"h4"} size="lg" mt={8} mb={2}>
        Voie de recours
      </Heading>
      <Text mt={4}>
        Cette procédure est à utiliser dans le cas suivant&nbsp;: vous avez signalé au responsable du site internet un
        défaut d’accessibilité qui vous empêche d’accéder à un contenu ou à un des services du portail et vous n’avez
        pas obtenu de réponse satisfaisante.
      </Text>
      <Text mt={4}>Vous pouvez&nbsp;:</Text>
      <UnorderedList pl={8} pt={4}>
        <ListItem>
          Écrire un message au{" "}
          <Link href={"https://formulaire.defenseurdesdroits.fr/"} textDecoration={"underline"} isExternal>
            Défenseur des droits <ExternalLinkLine w={"0.75rem"} h={"0.75rem"} mb={"0.125rem"} ml={2} />
          </Link>
        </ListItem>
        <ListItem>
          Contacter{" "}
          <Link href={"https://www.defenseurdesdroits.fr/saisir/delegues"} textDecoration={"underline"} isExternal>
            le délégué du Défenseur des droits dans votre région{" "}
            <ExternalLinkLine w={"0.75rem"} h={"0.75rem"} mb={"0.125rem"} ml={2} />
          </Link>
        </ListItem>
        <ListItem>
          Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre)&nbsp;:
          <br />
          Défenseur des droits
          <br />
          Libre réponse 71120 75342 Paris CEDEX 07
        </ListItem>
      </UnorderedList>
      <Text mt={4}>
        Cette déclaration d’accessibilité a été créé le <span>22 novembre 2023</span> grâce au{" "}
        <a href="https://betagouv.github.io/a11y-generateur-declaration/#create">
          Générateur de Déclaration d’Accessibilité de BetaGouv
        </a>
        .
      </Text>
    </Box>
  );
};

export default Accessibilite;

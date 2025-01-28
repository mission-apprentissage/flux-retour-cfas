import { Box, HStack, Heading, Text, Link, Flex, UnorderedList, ListItem } from "@chakra-ui/react";
import React, { useEffect } from "react";

import Section from "@/components/Section/Section";
import Sommaire from "@/components/Sommaire/Sommaire";

export const CGU_VERSION = "v0.4";

const anchors = {
  ChampPreambule: "champ-preambule",
  ChampDefinition: "champ-definition",
  ChampObjet: "champ-objet",
  ChampAcceptation: "champ-acceptation",
  ChampMaj: "champ-maj",
  ChampVigueur: "champ-vigueur",
  ChampCreation: "champ-creation",
  ChampPresentation: "champ-presentation",
  ChampPlateforme: "champ-plateform",
  ChampConfidentialite: "champ-confidentialite",
  ChampResponsabilite: "champ-responsabilite",
  ChampUtilisateur: "champ-utilisateur",
  ChampPropiete: "champ-propriete",
  ChampProtectioon: "champ-protection",
  ChampDroit: "champ-droit",
};

const computeArticle = ({ anchorLink, anchorName, anchorTitle, anchorComponent }) => (
  <Section mt={4} id={anchorLink}>
    <Heading as={"h3"} textStyle="h6" mb={5}>
      {anchorTitle} - {anchorName}
    </Heading>
    {anchorComponent ? anchorComponent() : null}
  </Section>
);

const componentPreambule = () => (
  <Text>
    La Plateforme Tableau de bord de l’apprentissage (ci-après la « Plateforme ») est un système d’information ayant
    pour objet :
    <UnorderedList pl={10} pt={5}>
      <ListItem>
        La mise à disposition à différents acteurs de données clés concernant l’apprentissage en temps réel.
      </ListItem>
    </UnorderedList>
    <br />
    La Plateforme est créée et administrée par la Délégation générale à l&apos;Emploi et à la Formation professionnelle
    du ministère du Travail (ci-après « la DGEFP »).
    <br />
    <br />
    L’Utilisateur reconnaît que l’utilisation de la Plateforme nécessite le respect de l’ensemble des dispositions des
    présentes et adhère sans réserve aux présentes CGU.
  </Text>
);

const componentDefinition = () => (
  <Text>
    Les termes ci-dessous définis ont, entre les parties, la signification suivante :
    <UnorderedList pl={10} pt={5}>
      <ListItem mb={2}>
        <strong>« DGEFP »</strong> : Délégation générale à l’emploi et à la formation professionnelle ;
      </ListItem>
      <ListItem mb={2}>
        <strong>« Tableau de bord de l’apprentissage »</strong> : Service numérique destiné à mettre à disposition de
        différents acteurs les données clés concernant l’apprentissage en temps réel ;
      </ListItem>
      <ListItem mb={2}>
        <strong>« Ministère »</strong> : Ministère du Travail, du plein Emploi et de l’Insertion ;
      </ListItem>
      <ListItem mb={2}>
        <strong>« Utilisateur »</strong> : désigne toute personne qui utilise les services proposés par la « Plateforme
        » (CFA ou organisme de formation, opérateur public, réseau d’organismes de formation, membre du Réseau des
        Carif-Oref, missions locales).
      </ListItem>
    </UnorderedList>
  </Text>
);

const componentObjet = () => (
  <Text>
    Les présentes CGU ont pour objet de définir les modalités d’utilisation de la Plateforme, les fonctionnalités de la
    Plateforme et les responsabilités de la DGEFP et des Utilisateurs.
  </Text>
);

const componentAcceptation = () => (
  <Text>
    Les présentes CGU ont valeur contractuelle et sont opposables à l’Utilisateur dès leur acceptation par ce dernier.
    <br />
    <br />
    À défaut d’acceptation des présentes CGU, l’Utilisateur ne pourra pas bénéficier des services de la Plateforme.
    <br />
    <br />
    Les présentes CGU sont opposables pendant toute la durée d’utilisation de la Plateforme et l’utilisateur reste
    responsable de toute action effectuée durant l’utilisation de la Plateforme.
  </Text>
);

const componentMaj = () => (
  <Text>
    Les termes des présentes CGU peuvent être amendés à tout moment, sans préavis, en fonction des modifications
    apportées à la Plateforme, de l’évolution de la législation ou pour tout autre motif jugé nécessaire. Chaque
    modification donne lieu à une nouvelle version qui est acceptée par l’Utilisateur.
    <br />
    <br />
    L&apos;Utilisateur sera informé en cas de modification des CGU.
    <br />
    <br />
    Si l&apos;Utilisateur s&apos;oppose aux modifications apportées, il est libre de cesser d&apos;utiliser à tout
    moment les services de la Plateforme.
  </Text>
);

const componentVigueur = () => (
  <Text>
    Les présentes conditions générales d’utilisation entrent en vigueur à compter de leur date de mise en ligne sur la
    Plateforme.
    <br />
    <br />
    Les anciennes conditions générales d’utilisation peuvent être consultées à tout moment grâce à un versionnage mis en
    place par la Plateforme.
  </Text>
);

const componentCreation = () => (
  <Text>
    La procédure de création de compte permet aux Utilisateurs de se créer un compte associé à leur type de profil et
    d’accéder aux fonctionnalités de la Plateforme. L’Utilisateur est titulaire d&apos;un compte personnel, accessible
    par son identifiant personnel et un mot de passe qui doit contenir au moins douze caractères, une lettre minuscule,
    une lettre majuscule, un caractère spécial, un chiffre. Un seul compte peut être attribué par Utilisateur.
    <br />
    <br />
    L’Utilisateur doit indiquer une adresse électronique valide, personnelle et professionnelle notamment des adresses
    génériques.
    <br />
    <br />
    Il incombe à l’Utilisateur de s’assurer qu’il a seul accès à son courrier électronique.
    <br />
    <br />
    Tout accès à, et toute utilisation de la Plateforme à partir de l’adresse électronique de l’Utilisateur est présumé
    comme émanant exclusivement de l’Utilisateur.
    <br />
    <br />
    L’Utilisateur est responsable de la sincérité des informations qu’il fournit et s’engage à mettre à jour les
    informations le concernant ou à aviser la DGEFP sans délai de toute modification affectant sa situation.
    <br />
    <br />
    En cas d’utilisation frauduleuse de son compte, l’Utilisateur s’engage à prévenir immédiatement la DGEFP. Cette
    notification devra être adressée à la DGEFP via l’adresse e-mail suivante :
    <Link
      href={`mailto:tableau-de-bord@apprentissage.beta.gouv.fr`}
      target="_blank"
      textDecoration="underline"
      isExternal
      whiteSpace="nowrap"
      color="action-high-blue-france"
    >
      tableau-de-bord@apprentissage.beta.gouv.fr
    </Link>
    . La date de réception de cette notification fera foi entre les parties. En l’absence de cette notification,
    l’utilisation est présumée être celle de l’Utilisateur. Il lui reviendra de s’assurer de l’usurpation ou de la
    compromission éventuelle.
  </Text>
);

const componentPresentation = () => (
  <Text>
    Le Tableau de bord de l’apprentissage permet :
    <UnorderedList pl={10} pt={5}>
      <ListItem mb={2}>Le pilotage des dispositifs relatifs à la politique de l’apprentissage ;</ListItem>
      <ListItem mb={2}>
        L’aide à ceux qui peuvent agir à accompagner les apprentis en situation de rupture ou sans contrat ;
      </ListItem>
      <ListItem mb={2}>
        La simplification de la délivrance d’informations par les CFA, en utilisant la donnée pour préremplir les
        enquêtes nationales qui leur sont demandées ;
      </ListItem>
      <ListItem mb={2}>Le remplissage de contrats CERFA.</ListItem>
    </UnorderedList>
    <br />
    <br />
    Chaque Utilisateur peut :
    <UnorderedList pl={10} pt={5}>
      <ListItem mb={2}>Consulter des données de l’apprentissage à des fins de pilotage ;</ListItem>
      <ListItem mb={2}>Exporter des fichiers sous format agrégat de données de l’apprentissage ;</ListItem>
      <ListItem mb={2}>
        Consulter pour une partie des Utilisateurs habilités des listes nominatives d’apprentis en situation de rupture
        ou d’abandon à des fins d’accompagnement ;
      </ListItem>
      <ListItem mb={2}>
        Permettre aux organismes de formation de déposer des fichiers de données pour alimenter les chiffres de la
        Plateforme ;
      </ListItem>
      <ListItem mb={2}>Optimiser la création de ses contrats d’apprentissage via un formulaire CERFA assisté.</ListItem>
    </UnorderedList>
    <br />
    <br />
    Notamment, des conseillers habilités de certaines missions locales ont accès à une liste de jeunes identifiés par la
    Plateforme comme nécessitant un accompagnement prioritaire.
  </Text>
);

const componentPlatefome = () => (
  <Text>
    La DGEFP se réserve le droit, sans préavis, ni indemnité, de fermer temporairement l’accès à une ou plusieurs
    fonctionnalités de la Plateforme pour effectuer une mise à jour, des modifications ou changement sur les méthodes
    opérationnelles, les serveurs et les heures d’accessibilité. Cette liste n’est pas limitative. Dans ce cas, la DGEFP
    peut indiquer une date de réouverture du compte ou d’accessibilité à une ou plusieurs fonctionnalités.
    <br />
    <br />
    En cas d’impossibilité d’accéder et/ou d’utiliser la Plateforme, l’Utilisateur peut toujours s’adresser à la DGEFP
    pour obtenir des informations via l’adresse suivante :
    <Link
      href={`mailto:tableau-de-bord@apprentissage.beta.gouv.fr`}
      target="_blank"
      textDecoration="underline"
      isExternal
      whiteSpace="nowrap"
      color="action-high-blue-france"
    >
      tableau-de-bord@apprentissage.beta.gouv.fr
    </Link>
  </Text>
);

const componentConfidentialite = () => (
  <Text>
    La DGEFP met en place les moyens nécessaires pour assurer le bon fonctionnement de la Plateforme et pour assurer la
    sécurité et la confidentialité des données des Utilisateurs.
  </Text>
);

const componentResponsabilite = () => (
  <Text>
    La DGEFP ne saurait être responsable :
    <UnorderedList pl={10} pt={5}>
      <ListItem mb={2}>
        En raison d&apos;une interruption du service quelle que soit la durée ou la fréquence de cette interruption et
        quelle qu&apos;en soit la cause, notamment en raison d&apos;une maintenance nécessaire au fonctionnement, de
        pannes éventuelles, d&apos;aléas techniques liés à la nature du réseau Internet, d&apos;actes de malveillance ou
        de toute atteinte portée au fonctionnement de la Plateforme ;
      </ListItem>
      <ListItem mb={2}>
        Sauf faute ou négligence prouvée de la DGEFP, des atteintes à la confidentialité des données personnelles de
        l’Utilisateur résultant de l’utilisation de son identifiant ou de son mot de passe ;
      </ListItem>
      <ListItem mb={2}>
        Des conséquences provoquées par le caractère erroné ou frauduleux des informations fournies par un Utilisateur ;
      </ListItem>
      <ListItem mb={2}>
        Des dommages directs ou indirects résultant de l&apos;attitude, de la conduite ou du comportement d&apos;un
        autre Utilisateur ;
      </ListItem>
      <ListItem mb={2}>
        Des atteintes à la sécurité du système d’information, ainsi qu’aux données, pouvant causer des dommages aux
        matériels informatiques des Utilisateurs et à leurs données dès lors que le fait ne lui est pas imputable.
      </ListItem>
    </UnorderedList>
  </Text>
);

const componentUtilisateur = () => (
  <Text>
    Dans le cadre de l’utilisation de la Plateforme, l’Utilisateur s’engage à :
    <UnorderedList pl={10} pt={5}>
      <ListItem mb={2}>
        Se conformer aux stipulations décrites dans les CGU et aux dispositions des lois et règlements en vigueur, et à
        respecter les droits des tiers ;
      </ListItem>
      <ListItem mb={2}>
        Ne créer qu&apos;un seul compte Utilisateur et ne communiquer que des informations, fichiers et autres contenus
        conformes à la réalité, honnêtes et loyaux ;
      </ListItem>
      <ListItem mb={2}>
        Ne pas divulguer via la Plateforme des propos ou des contenus illicites, et notamment tous contenus contrefaits,
        diffamatoires, injurieux, insultants, obscènes, offensants, discriminatoires, violents, xénophobes, incitant à
        la haine raciale ou faisant l&apos;apologie du terrorisme, ou tout autre contenu contraire à la législation et
        réglementation applicable ainsi qu&apos;aux bonnes mœurs et aux règles de bienséance ;
      </ListItem>
      <ListItem mb={2}>
        Ne pas intégrer et diffuser via la Plateforme du contenu qui serait contraire à la finalité de celle-ci ;
      </ListItem>
      <ListItem mb={2}>
        Ne pas communiquer ou envoyer, par l&apos;intermédiaire de la Plateforme, du contenu, quel qu&apos;il soit, qui
        comprendrait des liens pointant vers des sites internet illicites, offensants ou incompatibles avec la finalité
        de la Plateforme.
      </ListItem>
    </UnorderedList>
    En outre, l&apos;Utilisateur garantit expressément la véracité et la réalité des informations qu&apos;il communique
    sur la Plateforme. Il est, par ailleurs, seul responsable de la préservation et de la confidentialité de son
    identifiant et mot de passe.
    <br />
    <br />
    En cas de manquement à une ou plusieurs de ces obligations, la DGEFP se réserve le droit de suspendre l’accès et/ou
    de supprimer le compte de l&apos;Utilisateur responsable.
    <br />
    <br />
    Concernant les missions locales ayant accès à une liste de jeunes identifiés par la Plateforme comme nécessitant un
    accompagnement prioritaire, seuls les directeurs des missions locales sont habilités à désigner les conseillers
    autorisés à accéder à ces informations.
  </Text>
);

const componentPropriete = () => (
  <Text>
    La Plateforme et tous les éléments qui le composent notamment les programmes, données, textes, images, sons,
    dessins, graphismes etc. sont la propriété de la DGEFP ou font l&apos;objet d&apos;une concession accordée à son
    profit. Toute copie, reproduction, représentation, adaptation, diffusion, intégrale ou partielle de la Plateforme,
    par quelque procédé que ce soit et sur quelque support que ce soit est soumise à l’accord préalable écrit de la
    DGEFP, sous réserve des exceptions prévues par le Code de propriété intellectuelle.
    <br />
    <br />
    Toute utilisation non autorisée des contenus ou informations de la Plateforme, notamment à des fins d’exploitation
    commerciale, pourra faire l’objet de poursuites sur la base d’une action en contrefaçon et/ou d’une action en
    concurrence déloyale et/ou parasitisme de la part de la DGEFP.
  </Text>
);

const componentProtection = () => (
  <Text>
    Les données à caractère personnel sont traitées par la DGEFP et les Utilisateurs dans le respect des dispositions de
    la Loi n° 78-17 du 6 janvier 1978 relative à l’informatique, aux fichiers et aux libertés, dans sa version en
    vigueur, ainsi qu’au Règlement Général sur la Protection des Données (RGPD).
    <br />
    <br />
    Conformément à l’article L. 322-2 du code des relations entre le public et l’administration, la réutilisation
    éventuelle d&apos;informations publiques comportant des données à caractère personnel est subordonnée au respect des
    dispositions de la loi n° 78-17 du 6 janvier 1978 relative à l&apos;informatique, aux fichiers et aux libertés.
  </Text>
);

const componentDroit = () => (
  <Text>
    Les Conditions Générales d&apos;Utilisation sont régies par le droit français. Toute difficulté relative à la
    validité, l&apos;application ou l&apos;interprétation des Conditions Générales d&apos;Utilisation seront soumises, à
    défaut d&apos;accord amiable, à la compétence du Tribunal Administratif de Paris, auquel les parties attribuent
    compétence territoriale, quel que soit le lieu d&apos;exécution de la Plateforme ou le domicile du défendeur. Cette
    attribution de compétence s&apos;applique également en cas de procédure en référé, de pluralité de défendeurs ou
    d&apos;appel en garantie.
  </Text>
);

const SommaireData = [
  {
    anchorTitle: "Article 1",
    anchorName: "Préambule",
    anchorLink: anchors.ChampPreambule,
    anchorComponent: componentPreambule,
  },
  {
    anchorTitle: "Article 2",
    anchorName: "Définitions",
    anchorLink: anchors.ChampDefinition,
    anchorComponent: componentDefinition,
  },
  { anchorTitle: "Article 3", anchorName: "Objet", anchorLink: anchors.ChampObjet, anchorComponent: componentObjet },
  {
    anchorTitle: "Article 4",
    anchorName: "Acceptation",
    anchorLink: anchors.ChampAcceptation,
    anchorComponent: componentAcceptation,
  },
  {
    anchorTitle: "Article 5",
    anchorName: "Mise à jour des CGU",
    anchorLink: anchors.ChampMaj,
    anchorComponent: componentMaj,
  },
  {
    anchorTitle: "Article 6",
    anchorName: "Entrée en vigueur",
    anchorLink: anchors.ChampVigueur,
    anchorComponent: componentVigueur,
  },
  {
    anchorTitle: "Article 7",
    anchorName: "Création du compte",
    anchorLink: anchors.ChampCreation,
    anchorComponent: componentCreation,
  },
  {
    anchorTitle: "Article 8",
    anchorName: "Présentation de la Plateforme",
    anchorLink: anchors.ChampPresentation,
    anchorComponent: componentPresentation,
  },
  {
    anchorTitle: "Article 9",
    anchorName: "Accès à la « Plateforme »",
    anchorLink: anchors.ChampPlateforme,
    anchorComponent: componentPlatefome,
  },
  {
    anchorTitle: "Article 10",
    anchorName: "Confidentialité/sécurité",
    anchorLink: anchors.ChampConfidentialite,
    anchorComponent: componentConfidentialite,
  },
  {
    anchorTitle: "Article 11",
    anchorName: "Responsabilité du Ministère",
    anchorLink: anchors.ChampResponsabilite,
    anchorComponent: componentResponsabilite,
  },
  {
    anchorTitle: "Article 12",
    anchorName: "Responsabilité des Utilisateurs",
    anchorLink: anchors.ChampUtilisateur,
    anchorComponent: componentUtilisateur,
  },
  {
    anchorTitle: "Article 13",
    anchorName: "Propriété intellectuelle",
    anchorLink: anchors.ChampPropiete,
    anchorComponent: componentPropriete,
  },
  {
    anchorTitle: "Article 14",
    anchorName: "Protection des données à caractère personnel",
    anchorLink: anchors.ChampProtectioon,
    anchorComponent: componentProtection,
  },
  {
    anchorTitle: "Article 15",
    anchorName: "Droit applicable et attribution de compétence",
    anchorLink: anchors.ChampDroit,
    anchorComponent: componentDroit,
  },
];

export const Cgu = ({ onLoad, isWrapped }: { onLoad?: () => void; isWrapped?: boolean }) => {
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return (
    <HStack
      mt="4w"
      spacing={["0", "0", "0", "6w"]}
      flexDirection={["column", "column", "column", "row"]}
      alignItems={["normal", "normal", "normal", "center"]}
    >
      <Sommaire isWrapped={isWrapped}>
        <Flex flexDirection="column" fontSize="zeta">
          {SommaireData.map((item) => (
            <Link
              key={item.anchorName}
              padding="1w"
              href={`#${item.anchorLink}`}
              _hover={{ textDecoration: "none", bg: "grey.200" }}
            >
              <Text>
                <Text as="span" fontWeight="700">
                  {item.anchorTitle}.
                </Text>{" "}
                {item.anchorName}
              </Text>
            </Link>
          ))}
        </Flex>
      </Sommaire>
      <Box>
        <Section pt="0">
          <Heading textStyle="h2" color="grey.800" mt={5}>
            CONDITIONS GÉNÉRALES D&apos;UTILISATION DU TABLEAU DE BORD DE L’APPRENTISSAGE
          </Heading>
          <Text>Dernière mise à jour le : 20 janvier 2025 - {CGU_VERSION} </Text>
          <Text mt={4}>
            Les présentes conditions générales d’utilisation (dites « CGU ») définissent les conditions d’accès et
            d’utilisation des Services par l’Utilisateur.
          </Text>
        </Section>
        {SommaireData.map(({ anchorLink, anchorName, anchorTitle, anchorComponent }) =>
          computeArticle({ anchorLink, anchorName, anchorTitle, anchorComponent })
        )}
      </Box>
    </HStack>
  );
};

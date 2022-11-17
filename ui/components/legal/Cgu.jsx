import React, { useEffect } from "react";
import { Box, Heading, Text, Link } from "@chakra-ui/react";

export const cguVersion = () => {
  return "v0.1";
};

export const Cgu = ({ onLoad = () => {} }) => {
  useEffect(() => {
    onLoad();
  }, [onLoad]);
  return (
    <Box>
      <Text>Dernière mise à jour le : 3 novembre 2022 - {cguVersion()} </Text>
      <Text mt={4}>
        Les présentes conditions générales d’utilisation (dites « CGU ») définissent les conditions d’accès et
        d’utilisation des Services par l’Utilisateur.
      </Text>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={5}>
          Article 1 – Champ d’application
        </Heading>
        <Text>
          Le Tableau de bord est d’accès libre et gratuit à tout Utilisateur. La simple visite du Tableau de bord
          suppose l’acceptation par tout Utilisateur des présentes conditions générales d’utilisation.
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={5}>
          Article 2 – Objet
        </Heading>
        <Text>
          Le Tableau de bord a pour objectif de mettre à disposition des différents acteurs les données clés de
          l’apprentissage en temps réel.
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={5}>
          Article 3 – Définitions
        </Heading>
        <Text>
          Les termes ci-dessous définis ont entre les parties la signification suivante :
          <br />
          <br />
          <strong>« Utilisateur »</strong> : toute personne ayant accès à aux services du Tableau de bord
          <br />
          <br />
          <strong>« Authentification » </strong> : fonctionnalité qui permet aux utilisateurs titulaires d&apos;un
          compte d&apos;accéder aux services proposés sur le Tableau de bord.
          <br />
          <br />
          <strong>« Services »</strong> : ensemble des prestations proposées sur le Tableau de bord. Elles sont les
          suivantes : création d&apos;un compte utilisateur, consultation des données, export des données, saisie de
          données, accès à la documentation.
          <br />
          <br />
          <strong>« Tableau de bord »</strong> : service en ligne permettant de consulter, exporter, saisir des données.
          <br />
          <br />
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={5}>
          Article 4 – Fonctionnalités liées aux comptes des utilisateurs
        </Heading>
        <Text>
          L&apos;accès à certaines données du Tableau de bord est restreint à une inscription à un compte :
          <Link color="primary" href="https://cfas.apprentissage.beta.gouv.fr/login">
            https://cfas.apprentissage.beta.gouv.fr/login
          </Link>
          . Les services proposés ne sont accessibles qu&apos;aux seuls utilisateurs munis d&apos;un identifiant
          d&apos;authentification et d&apos;un mot de passe.
          <br />
          <br />
          De la même façon, la connexion au compte permet d’accéder, de façon contextualisée selon le profil de
          l’utilisateur à tout ou partie des fonctionnalités.
          <br />
          <br />
          La procédure de création de compte permet aux utilisateurs de se créer un compte associé à leur type de profil
          et d&apos;accéder aux fonctionnalités de consultation de certaines données, d’export des données et de saisie
          de données.
          <br />
          <br />
          L&apos;utilisateur est titulaire d&apos;un compte personnel, accessible par son identifiant personnel et par
          un mot de passe dès lors que toutes les formalités nécessaires à son inscription sont accomplies.
          <br />
          <br />
          Un seul compte peut être attribué par utilisateur (même adresse électronique).
          <br />
          <br />
          Le mot de passe est strictement personnel et confidentiel. Il contient au moins 12 caractères comprenant
          majuscules, minuscules, chiffres, et caractères spéciaux.
          <br />
          <br />
          En cas d&apos;oubli de son mot de passe ou de compromission, l’utilisateur utilise la fonctionnalité « oubli
          de mot de passe » et suit les instructions fournies par le Tableau de bord.
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={5}>
          Article 5 – Présentation des services
        </Heading>
        <Text>
          Le Tableau de bord permet aux utilisateurs :
          <br />
          <br />
          - de consulter des données de l’apprentissage à des fins de pilotage ;
          <br />
          - d’exporter des fichiers de données de l’apprentissage ;
          <br />
          - de s’informer sur les données de l’apprentissage exposées sur le Tableau de bord ;
          <br />
          - de consulter des listes nominatives d’apprentis en situation de rupture ou d’abandon à des fins
          d’accompagnement ;
          <br />
          - de déposer des fichiers de données pour alimenter les chiffres du Tableau de bord ;
          <br />
          - d’exposer certaines données sur leurs interfaces à l’aide d’une API dont la documentation est mise à
          disposition par la Mission interministérielle de l’apprentissage ;
          <br />
          - d’exposer leurs données sur le Tableau de bord à l’aide d’une API dont la documentation est mise à
          disposition par la Mission interministérielle de l’apprentissage.
          <br />
          <br />
          Le Tableau de bord est, en principe, accessible en permanence.
          <br />
          <br />
          La Mission interministérielle de l’apprentissage se réserve le droit, sans préavis, ni indemnité, de fermer
          temporairement l&apos;accès à un ou plusieurs services du Tableau de bord pour effectuer une mise à jour, des
          modifications ou changements sur les méthodes opérationnelles, les serveurs et les heures
          d&apos;accessibilité. Cette liste n&apos;est pas limitative.
          <br />
          <br />
          Dans ce cas, la Mission interministérielle de l’apprentissage peut indiquer une date de réouverture du compte
          ou d&apos;accessibilité à un ou plusieurs services.
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={5}>
          Article 6 - Sécurité
        </Heading>
        <Text>
          Le Tableau de bord comporte un accès sécurisé qui permet de consulter certaines données. Tout accès frauduleux
          est interdit et sanctionné pénalement. Il en est de même pour toute entrave ou altération du fonctionnement de
          ce système, ou en cas d&apos;introduction, de suppression ou de modification des données qui y sont contenues.
          <br />
          <br />
          L&apos;utilisateur s&apos;engage à ne pas perturber le bon fonctionnement de ce système. Il veille notamment à
          ne pas introduire de virus ou toute autre technologie nuisible au Tableau de bord.
          <br />
          <br />
          La Mission interministérielle de l’apprentissage fait ses meilleurs efforts, conformément aux règles de
          l&apos;art, pour sécuriser le service eu égard à la complexité de l&apos;internet.
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={5}>
          Article 7 – Hyperliens
        </Heading>
        <Text>
          La Mission interministérielle de l’apprentissage se réserve la possibilité de mettre en place des hyperliens
          sur le Tableau de bord donnant accès à des pages internet autres que celles de son interface.
          <br />
          <br />
          Les utilisateurs sont formellement informés que les sites auxquels ils peuvent accéder par
          l&apos;intermédiaire des liens hypertextes n’appartiennent pas tous à la Mission interministérielle de
          l’apprentissage.
          <br />
          <br />
          La Mission interministérielle de l’apprentissage ne saurait être responsable de l&apos;accès par les
          utilisateurs par les liens hypertextes mis en place dans le cadre du Tableau de bord à d&apos;autres
          ressources présentes sur le réseau.
          <br />
          <br />
          La Mission interministérielle de l’apprentissage décline toute responsabilité quant au contenu des
          informations fournies sur ces ressources présentes sur le réseau au titre de l&apos;activation des liens
          hypertextes.
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={5}>
          Article 8 – Responsabilités
        </Heading>
        <Text as={"h4"} fontSize="20px" fontWeight="700" mb={5}>
          8.1. Limites de la responsabilité de la Mission interministérielle de l’apprentissage
        </Text>
        <Text>
          La Mission interministérielle de l’apprentissage ne saurait être tenue pour responsable des conséquences
          provoquées par le caractère erroné ou frauduleux des informations fournies par l&apos;utilisateur.
          <br />
          <br />
          L&apos;utilisateur reste en toutes circonstance responsable de l&apos;utilisation qu&apos;il fait des services
          du Tableau de bord. La Mission interministérielle de l’apprentissage ne saurait être responsable de
          l&apos;impossibilité d&apos;utiliser le Tableau de bord et les services.
          <br />
          <br />
          La Mission interministérielle de l’apprentissage ne saurait être responsable des atteintes à la sécurité
          informatique pouvant causer des dommages aux matériels informatiques des utilisateurs et à leurs données.
          <br />
          <br />
          La Mission interministérielle de l’apprentissage n&apos;est pas responsable des conditions d&apos;utilisation
          du service par les utilisateurs.
          <br />
          <br />
          La responsabilité de la Mission interministérielle de l’apprentissage ne saurait être recherchée en cas
          d&apos;usage frauduleux ou abusif ou, à la suite d&apos;une divulgation volontaire ou involontaire, à
          quiconque, des codes d&apos;accès confiés à l&apos;utilisateur.
          <br />
          <br />
          La responsabilité de la Mission interministérielle de l’apprentissage ne peut être engagée en cas de dommages
          directs ou indirects résultant de l&apos;utilisation du Tableau de bord.
          <br />
          <br />
          La responsabilité de la Mission interministérielle de l’apprentissage ne pourra être recherchée ni retenue en
          cas d&apos;indisponibilité temporaire ou totale de tout ou partie de l&apos;accès au Tableau de bord,
          d&apos;une difficulté liée au temps de réponse et d&apos;une manière générale, d&apos;un défaut de performance
          quelconque.
        </Text>
        <br />
        <Text as={"h4"} fontSize="20px" fontWeight="700" mt={4}>
          8.2. Responsabilité des utilisateurs
        </Text>
        <Text>
          <br />
          L&apos;utilisateur s&apos;engage à utiliser le Tableau de bord et les services, ainsi que l&apos;ensemble des
          informations auxquelles il pourra avoir accès en conformité avec les stipulations des présentes conditions
          générales d&apos;utilisation.
          <br />
          <br />
          L&apos;utilisateur est seul responsable de la préservation et de la confidentialité de son mot de passe et
          autres données confidentielles qui lui seraient éventuellement transmises par la Mission interministérielle de
          l’apprentissage.
          <br />
          <br />
          L&apos;utilisateur est responsable de la sincérité des informations qu&apos;il fournit et s&apos;engage à
          mettre à jour les informations le concernant ou à aviser la Mission interministérielle de l’apprentissage sans
          délai de toute modification affectant sa situation.
          <br />
          <br />
          En cas d&apos;utilisation frauduleuse de son compte ou vol de son mot de passe, l&apos;utilisateur
          s&apos;engage à prévenir immédiatement la Mission interministérielle de l’apprentissage et à modifier sans
          délai son mot de passe.
          <br />
          <br />
          Cette notification devra être adressée à la Mission interministérielle de l’apprentissage par courrier
          électronique à l&apos;adresse : tableau-de-bord@apprentissage.beta.gouv.fr. La date de réception de ce
          courrier électronique fera foi entre les parties.
          <br />
          <br />
          L&apos;utilisateur s&apos;engage à ne pas perturber l&apos;usage que pourraient faire les autres utilisateurs
          du Tableau de bord, de ne pas accéder aux comptes membres tiers et de ne pas accéder à des parties du Tableau
          de bord dont l&apos;accès est réservé.
          <br />
          <br />
          L&apos;utilisateur s&apos;engage à utiliser le service ainsi que l&apos;ensemble des informations auxquelles
          il pourra avoir accès, dans un but conforme à l&apos;ordre public, aux bonnes mœurs et aux droits des tiers.
          <br />
          <br />
          L&apos;utilisateur s&apos;engage à ne commettre aucun acte pouvant mettre en cause la sécurité informatique de
          la Mission interministérielle de l’apprentissage ou des autres utilisateurs.
          <br />
          <br />
          L&apos;utilisateur s&apos;engage à ne pas interférer ou interrompre le fonctionnement normal du Tableau de
          bord.
          <br />
          <br />
          L&apos;utilisateur s&apos;engage à ne pas collecter, utiliser, ou effectuer un traitement quelconque des
          données personnelles des autres utilisateurs.
          <br />
          <br />
          Toute autre utilisation donne droit à la Mission interministérielle de l’apprentissage de fermer l&apos;accès
          au service de l&apos;utilisateur, de supprimer les données et fichiers y figurant, de supprimer l&apos;accès à
          ses données ou fichiers, ou d&apos;interdire à l&apos;utilisateur l&apos;accès de tout ou partie du service,
          et ce sans préjudice de tous dommages-intérêts auxquels la Mission interministérielle de l’apprentissage
          pourrait prétendre.
          <br />
          <br />
          Toute utilisation des services susceptible d&apos;endommager, de désactiver, de surcharger
          l&apos;infrastructure du Tableau de bord ou encore d&apos;entraver la jouissance des services par les autres
          Utilisateurs est interdite.
          <br />
          <br />
          Toute tentative d&apos;accès non autorisé aux services, à d&apos;autres comptes, aux systèmes informatiques ou
          à d&apos;autres réseaux connectés ou à l&apos;un des services via le piratage ou toute autre méthode est
          interdite.
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={5}>
          Article 9 – Propriété intellectuelle
        </Heading>
        <Text>
          L&apos;utilisateur reconnaît et accepte que le contenu du Tableau de bord et notamment mais non exclusivement
          les textes, marques, photographies, vidéos, logiciels et programmes, sons, musiques, mise en page, charte
          graphique, logos, logiciels, les bases de données, design ou toute autre information ou support présenté par
          la Mission interministérielle de l’apprentissage, sont protégés par leurs droits d&apos;auteurs, marque,
          brevet et tout autre droit de propriété intellectuelle ou industrielle qui leur sont reconnus selon les lois
          en vigueur.
          <br />
          <br />
          Toute reproduction ou représentation, totale ou partielle d&apos;un de ces droits, sans l&apos;autorisation
          expresse de la Mission interministérielle de l’apprentissage est interdite et constituerait une contrefaçon.
          <br />
          <br />
          En conséquence, l&apos;utilisateur s&apos;interdit tout agissement et tout acte susceptible de porter atteinte
          directement ou non aux droits de propriété intellectuelle. L&apos;utilisateur ne peut en aucun cas utiliser,
          imprimer ou reformater le contenu du Tableau de bord, sinon, pour les informations disponibles en accès libre,
          à des fins autres que privées ou familiales.
          <br />
          <br />
          Il s&apos;engage notamment à ne pas télécharger, à l&apos;exception des documents pour lesquels le
          téléchargement est proposé, reproduire, transmettre, vendre ou distribuer, le contenu du Tableau de bord.
        </Text>
      </Box>
      <Box mt={4}>
        <Heading as={"h3"} textStyle="h6" mb={5}>
          Article 10 – Mise à jour des conditions d’utilisation
        </Heading>
        <Text>
          Les termes des CGU doivent être acceptés au moment de la connexion. Toute modification des CGU réalisée en
          fonction des modifications apportées au site, de l’évolution de la législation ou pour tout autre motif jugé
          nécessaire, nécessite votre consentement.
        </Text>
      </Box>
    </Box>
  );
};

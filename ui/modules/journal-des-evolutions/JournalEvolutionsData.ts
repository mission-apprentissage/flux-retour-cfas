export const JOURNAL_DES_EVOLUTIONS_TAGS = {
  Fonctionnalite: "Fonctionnalité",
  CalculDesIndices: "Calcul des indices",
  CollecteDesDonnees: "Collecte des données",
};

export const JOURNAL_DES_EVOLUTIONS_DATA = [
  {
    title: "Affichage de la nature d’un établissement",
    explication:
      "Les utilisateurs connectés en tant que pilotes du tableau de bord (DREETS, Administration centrale, DRAAF, Académie, Carif Oref, Conseil Régional), accèdent à l’information de la nature de l’établissement consulté : “formateur”, “responsable”, “responsable et formateur”, “inconnue”. Ces natures sont collectées via l’API référentiel de l’apprentissage.",
    correctif: "Oui",
    date: "2022/09/01",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Affichage des chiffres publics",
    explication:
      "Les données clefs globales de l’apprentissage sont mise à jour tous les 1er du mois sur la page publique du tableau de bord",
    correctif: "Oui",
    date: "2022/09/01",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Mise en ligne de la FAQ",
    explication: "Nouvelle page d’aide, avec plus d’informations et avec une navigation plus fluide",
    correctif: "Non",
    date: "2022/09/02",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Mise en ligne des Mentions Légales",
    explication: "Mentions Légales mise à jour et disponibles sur le site du tableau de bord de l’apprentissage",
    correctif: "Non",
    date: "2022/09/02",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Nouveau format du téléchargement",
    explication:
      "Possibilité pour les pilotes de télécharger un fichier complet et anonymisé par territoire, formation ou organisme de formation.",
    correctif: "Non",
    date: "2022/07/25",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Nouveaux onglets pour la navigation par vue",
    explication:
      "Navigation par onglets, permettant d’accéder via une vue précise (territoriale, par formation, par organisme) : au téléchargement, aux données agrégées, au détail",
    correctif: "Non",
    date: "2022/07/25",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Fichier en téléchargement",
    explication: "Modifications : exhaustivité des données non nominatives et simplification du bloc de téléchargement",
    correctif: "Oui",
    date: "2022/07/18",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Ajout des codes INSEE de la Corse",
    explication:
      "Afin de corriger les bug d’affichage et de localisation des organismes Corses : résolution de bug en lien avec l’API INSEE. A présent les organismes corses transmettant au tableau de bord sont visibles sur la itoriale.",
    correctif: "Oui",
    date: "2022/07/04",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Réflexion menée pour rapprocher notre schema de donnés avec celui de l’enquête SIFA",
    explication:
      "Réflexion sur la manière dont nous pourrions mettre à leur disposition des données du tableau de bord nécessaires à la complétude de SIFA, pour faciliter la déclaration des organismes de formation. Pour nous partager votre expérience : https://tally.so/r/3Ek0z4",
    correctif: "Non",
    date: "2022/06/27",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title:
      "Ateliers de recherche utilisateurs pour la solution de déclaration au tableau de bord des organismes n’utilisant pas d’ERP",
    explication:
      "Recherche préalable afin de développer une solution pour les organismes de formation n’utilisant pas un ERP sur le marché. Pour être informé de la suite de ces travaux, vous pouvez vous inscrire ici : https://cfas.apprentissage.beta.gouv.fr/organisme-formation/transmettre",
    correctif: "Non",
    date: "2022/06/20",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Recherche par RNCP",
    explication: "La recherche de formations peut s’effectuer par CFD ou RNCP.",
    correctif: "Non",
    date: "2022/05/17",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Déploiement en Corse",
    explication: "Présentation du tableau de bord au CREFOP et aux organismes du territoire.",
    correctif: "Non",
    date: "2022/05/18",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Vue multi SIRET",
    explication:
      "Possibilité de rechercher par SIRET ou de visualiser les différents SIRET liés à un UAI. Pour le cas où les établissements n’auraient pas transmis leur UAI mais l’UAI responsable uniquement.",
    correctif: "Non",
    date: "2022/06/13",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Évolution de la charte graphique : Pictogrammes + couleurs",
    explication: "Pour faciliter la compréhension : ajout de pictogramme et de couleur (travail sur l’accessibilité).",
    correctif: "Oui",
    date: "2022/05/17",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Nouvelles vues des indicateurs “Territoire, Réseau, par organisme, par formation”",
    explication:
      "Pour faciliter la navigation et la compréhension, la visualisation des indicateurs a été repensée après une phase de recherche auprès des utilisateurs pilotes.",
    correctif: "Oui",
    date: "2022/06/02",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Déploiement du tableau de bord en Martinique",
    explication: "Présentation au CREFOP puis au organismes de formation",
    correctif: "Non",
    date: "2022/07/11",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Avancée des travaux de collecte de données via Auriga",
    explication:
      "Les organismes de formation de l’apprentissage demandent le branchement d’Auriga avec le tableau de bord.",
    correctif: "Non",
    date: "2022/06/27",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Avancée des travaux de collecte de données via FCA Manager",
    explication:
      "Les organismes de formation de l’enseignement supérieur demandent région par région le branchement de FCA Manager avec le tableau de bord.",
    correctif: "Non",
    date: "2022/07/11",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Documentation API",
    explication:
      "Mise à jour de la documentation API pour les expérimentations de partage de données nominatives en vue de repérer et d’accompagner les apprenants en situation de rupture ou de décrochage.",
    correctif: "Non",
    date: "2022/05/30",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Création automatisée des réseaux",
    explication:
      "Dans le but de faciliter les usages des utilisateurs réseaux : création d’une fonctionnalité interne, afin de créer des accès et vue réseaux, création et modification des réseaux possibles par les membres de l’équipe du tableau de bord sans nécessité de nouveaux développement. ",
    correctif: "Non",
    date: "2022/04/25",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Aide à l’identification des décrocheurs en Pays de la Loire",
    explication:
      "Une expérimentation avec le Conseil Régional Pays de la Loire est lancée afin de permettre l’identification des décrocheurs et de les accompagner. Le tableau de bord, dans le strict respect des règles RGPD, met à disposition des référents départementaux en charge de l’aide aux décrocheurs, les informations utiles.",
    correctif: "Non",
    date: "2022/04/26",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title:
      "Pour répondre aux retours des utilisateurs organismes de formation, des ateliers ont été réalisés, afin de proposer une expérience de navigation plus fluide et compréhensible.",
    explication:
      "Pour répondre aux retours des utilisateurs organismes de formation, des ateliers ont été réalisés, afin de proposer une expérience de navigation plus fluide et compréhensible.",
    correctif: "Oui",
    date: "2022/04/25",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Mise en ligne d’une page d’aide",
    explication:
      "L’équipe du tableau de bord a listé  les questions récurrentes auxquelles vous trouverez plus facilement des réponses. ",
    correctif: "Non",
    date: "2022/04/25",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Newsletter à destination des utilisateurs pilotes",
    explication:
      "Pour accompagner et informer sur le déploiement et des nouvelles fonctionnalités du tableau de bord, mise en place d’une lettre d’information à destination des utilisateurs pilotes.",
    correctif: "Non",
    date: "2022/04/25",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Refonte des pages publiques",
    explication:
      "Pour faciliter la navigation l’équipe a modifier les pages publiques avec une harmonisation des header, mise en place de picto et de couleurs pour une meilleure identification. Travail de mise en accessibilité sur les couleurs et les contrastes.",
    correctif: "Oui",
    date: "2022/04/25",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Révision du workflow de contact",
    explication:
      "Modification du parcours pour contacter l’équipe du tableau de bord, en améliorant la qualification des demandes avec des formulaires, pour obtenir une réponse plus rapidement. ",
    correctif: "Non",
    date: "2022/04/25",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Inscription pour être informé de la transmission sans ERP",
    explication:
      "Afin de rendre la transmission des données au tableau de bord accessible à tous les organismes de formation, l’équipe du tableau de bord lance des ateliers de recherches des usages actuels. Mise en place d’un formulaire pour être informé lorsque la fonctionnalité sera mise en ligne et également pour participer aux ateliers préalables.",
    correctif: "Non",
    date: "2022/04/25",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Déploiement en Guadeloupe et à Mayotte",
    explication:
      "En coordination avec les référents apprentissages des DREETS ou DDETS, déploiement du tableau de bord sur les territoires : Guadeloupe, Mayotte. Webinaire Guadeloupe le 06/04/2022, Webinaire Mayotte le 22/04/2022.",
    correctif: "Non",
    date: "2022/04/18",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Déploiement en Corse",
    explication:
      "En coordination avec la référente apprentissage de la DREETS : accès aux pilote et déploiement du tableau de bord.",
    correctif: "Non",
    date: "2022/04/18",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Modification de l’API et de la documentation",
    explication:
      "Modification de l’API pour la transmission des données par un ERP ou un SI en propre, pour intégrer les évolutions du produit. Documentation disponible sur demande mail.",
    correctif: "Oui",
    date: "2022/04/18",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Déploiement auprès des directeurs de CFA de la FNADIR",
    explication:
      "Présentation du tableau de bord, de son usage et du paramétrage pour transmettre durant le webinaire organisé par la FNADIR à destination des membres de son réseau le 15 avril 2022.",
    correctif: "Non",
    date: "2022/04/15",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Mise en ligne de la page statistiques",
    explication:
      "En toute transparence l’équipe mesure l’impact du tableau de bord et restitue ces indicateurs sur les pages publiques du site. Ces indicateurs sont en cours de construction et d’évolution.",
    correctif: "Non",
    date: "2022/03/21",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Déploiement en région PACA",
    explication:
      "À l’initiative de la DREETS PACA, organisation d’un Webinaire à destination des centres de formation de la région, pour présenter le tableau de bord de l’apprentissage.",
    correctif: "Non",
    date: "2022/03/10",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "API transmission des données avec un SI en propre",
    explication:
      "Amélioration de l’API pour permettre la transmission avec un SI en propre : mise en place pour un réseau",
    correctif: "Non",
    date: "2022/02/25",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Champs Nom / Prénom insensible à la casse",
    explication:
      "Afin d’éviter les doublons, le champs de collecte de la donnée Nom et Prénom de l’apprenant a été rendu insensible à la casse.",
    correctif: "Oui",
    date: "2022/02/21",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Mise en place du support",
    explication:
      "Tous les vendredi, vous pouvez contacter l’équipe du tableau de bord, par chat ou réserver un créneau de visio afin d’échanger en direct.",
    correctif: "Non",
    date: "2022/02/18",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Suppression de champs collectés",
    explication:
      "Dans une démarche de simplification du code et d’économie de la donnée collectée, les champs position du statut et date de mise à jour du statut ne sont plus collectés.",
    correctif: "Oui",
    date: "2022/02/07",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Suppression des doublons d’UAI",
    explication: "",
    correctif: "Oui",
    date: "2022/02/07",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Déploiement en Bourgogne Franche Comté avec le Carif Oref et la DREETS",
    explication:
      "Webinaire organisé conjointement par la DREETS et le Carif Oref de Bourgogne Franche Comté pour présenter l’outil aux organismes de formation du territoire.",
    correctif: "Non",
    date: "2022/02/01",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Ajout d’un champ date de réception de la donnée",
    explication:
      "Afin de corriger les erreurs d’envoi des données et d’identifier les données obsolètes, un champs date de réception des données est collecté.",
    correctif: "Oui",
    date: "2022/01/20",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Correction des erreurs d’affichage pour les rupturants et abandons",
    explication: "Fiabilisation de la donnée.",
    correctif: "Oui",
    date: "2022/01/10",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Mise à jour Pas à Pas Yparéo",
    explication: "Mise à disposition d’un nouveau guide pour parémétrer facilement votree ERP Yparéo.",
    correctif: "Oui",
    date: "2022/01/10",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Collecte du RNCP",
    explication: "Pour mieux identifier les formations, collecte et utilisation du RNCP en plus du CFD.",
    correctif: "Oui",
    date: "2021/12/24",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Accès aux pages Organisme de formation à partir des tableaux régionaux",
    explication:
      "En accès Pilote, vous pouvez désormais accéder aux informations d’un centre de formation depuis tous les tableaux de visualisation, en cliquant sur son nom (raison sociale).",
    correctif: "Non",
    date: "2021/12/15",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Accès aux données des CFAs limités aux institutions",
    explication: "A partir de maintenant le tableau à une vision par profil",
    correctif: "Non",
    date: "2021/11/21",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Création d’une API RCO pour les rupturants et sans contrat",
    explication:
      "API pour identifier les apprentis sans contrats et rupturants, afin de nourrir la cartographie effectuée par le réseau des CARIF OREF",
    correctif: "Non",
    date: "2021/11/11",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CalculDesIndices,
  },
  {
    title: "Mise à disponibilité des effectifs des régions Occitanie, Grand Est et Nouvelle Aquitaine",
    explication: "Webinaire organisé avec la région Occitanie le 8 novembre.",
    correctif: "Non",
    date: "2021/11/08",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Démarrage de la collecte de l'âge de l'apprenant",
    explication: "Donnée qui permet de qualifier les effectifs et de proposer de nouvelles visualisations.",
    correctif: "Non",
    date: "2021/10/11",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Arrêt de la collecte du statut 'prospect'",
    explication: "Donnée peu qualifiée et très hétérogène en fonction des pratiques des organismes de formation.",
    correctif: "Non",
    date: "2021/10/11",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Période de consultation des effectifs étendue",
    explication: "Période étendue à plusieurs mois après le mois en cours (apprentis et inscrits sans contrat)",
    correctif: "Non",
    date: "2021/09/06",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Démarrage de la collecte de l'année scolaire à laquelle est rattachée l'apprenant",
    explication:
      "Donnée qui permet de différencier les statuts 2020-2021 vs les statuts 2021-2022. pour gérer l'historique et permettre la visualisation du parcours des apprenants",
    correctif: "Non",
    date: "2021/08/16",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Documentation de l’API",
    explication:
      "Création de la documentation de l’API pour la transmission des données par un ERP. Disponible sur demande mail.",
    correctif: "Non",
    date: "2021/08/12",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title:
      "[Vue CFA] Remplacement de la fonctionnalité 'valider les données' par un call-to-action permettant de 'signaler une anomalie'",
    explication:
      "Création de la documentation de l’API pour la transmission des données par un ERP. Disponible sur demande mail.",
    correctif: "Non",
    date: "2021/07/18",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Identifier un organisme de formation par son UAI plutôt que son SIRET",
    explication: "23% des SIRET collectés sont invalides",
    correctif: "Oui",
    date: "2021/07/18",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Report de la livraison des indices 'Nouveaux Contrats' et 'Ruptures'",
    explication: "Des données sont encore manquantes lors de la collecte pour fiabiliser le calcul de cet indice",
    correctif: "Non",
    date: "2021/07/11",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CalculDesIndices,
  },
  {
    title: "Arrêt de la collecte du représentant légal de l'apprenant",
    explication:
      "Donnée personnelle à ce jour non utilisée : application du principe de minimisation du traitement des données personnelles.",
    correctif: "Non",
    date: "2021/06/11",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Suppression des doublons SIRET dans la base de donnée",
    explication:
      "Donnée personnelle à ce jour non utilisée : application du principe de minimisation du traitement des données personnelles.",
    correctif: "Oui",
    date: "2021/05/16",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
];

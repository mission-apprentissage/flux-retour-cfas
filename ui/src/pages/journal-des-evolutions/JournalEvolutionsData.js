export const JOURNAL_DES_EVOLUTIONS_TAGS = {
  Fonctionnalite: "Fonctionnalité",
  CalculDesIndices: "Calcul des indices",
  CollecteDesDonnees: "Collecte des données",
};

export const JOURNAL_DES_EVOLUTIONS_DATA = [
  {
    title: "Déploiement en Guadeloupe et à Mayotte",
    explication:
      "En coordination avec les référents apprentissages des DREETS ou DDETS, déploiement du Tableau de bord sur les territoires : Guadeloupe, Mayotte. Webinaire Guadeloupe le 06/04/2022, Webinaire Mayotte le 22/04/2022.",
    correctif: "Non",
    date: "2022/04/18",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Déploiement en Corse",
    explication:
      "En coordination avec la référente apprentissage de la DREETS : accès aux pilote et déploiement du Tableau de bord.",
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
      "Présentation du Tableau de bord, de son usage et du paramétrage pour transmettre durant le webinaire organisé par la FNADIR à destination des membres de son réseau le 15 avril 2022.",
    correctif: "Non",
    date: "2022/04/15",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Mise en ligne de la page statistiques",
    explication:
      "En toute transparence l’équipe mesure l’impact du Tableau de bord et restitue ces indicateurs sur les pages publiques du site. Ces indicateurs sont en cours de construction et d’évolution.",
    correctif: "Non",
    date: "2022/03/21",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.Fonctionnalite,
  },
  {
    title: "Déploiement en région PACA",
    explication:
      "À l’initiative de la DREETS PACA, organisation d’un Webinaire à destination des centres de formation de la région, pour présenter le Tableau de bord de l’apprentissage.",
    correctif: "Non",
    date: "2022/03/10",
    type: JOURNAL_DES_EVOLUTIONS_TAGS.CollecteDesDonnees,
  },
  {
    title: "Déploiement en région PACA",
    explication:
      "À l’initiative de la DREETS PACA, organisation d’un Webinaire à destination des centres de formation de la région, pour présenter le Tableau de bord de l’apprentissage.",
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
      "Tous les vendredi, vous pouvez contacter l’équipe du Tableau de bord, par chat ou réserver un créneau de visio afin d’échanger en direct.",
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
      "API pour identifier les apprentis sans contrats et rupturants, afin de nourrir la cartographie effectuée par le réseau des Carif-Oref",
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

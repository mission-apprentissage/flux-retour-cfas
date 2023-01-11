export const NAVIGATION_PAGES = {
  Inscription: {
    path: "/auth/inscription",
    title: "Inscription",
  },
  Login: {
    path: "/auth/connexion",
    title: "Institution ou une organisation professionnelle",
  },
  Accueil: {
    path: "/",
    title: "Accueil",
  },
  NotFound404: {
    path: "/404",
    title: "Page non trouvée",
  },
  DemandeAcces: {
    path: "/demande-acces",
    title: "Demande d'acces",
  },
  ComprendreLesDonnees: {
    path: "/comprendre-les-donnees",
    title: "Comprendre les données",
  },
  ConsulterVosDonnees: {
    path: "/consulter-vos-donnees",
    title: "Consulter vos données",
  },
  JournalDesEvolutions: {
    path: "/journal-des-evolutions",
    title: "Journal des évolutions",
  },
  MentionsLegales: {
    path: "/mentions-legales",
    title: "Mentions légales",
    anchors: {
      EditeurDuSite: "editeur-du-site",
      DirecteurDeLaPublication: "directeur-de-la-publication",
      HebergementDuSite: "hebergement-du-site",
      Accessibilite: "accessibilite",
      SignalerUnDyfonctionnement: "signaler-un-dyfonctionnement",
    },
  },
  PolitiqueDeConfidentialite: {
    path: "/politique-confidentialite",
    title: "Politique de confidentialite",
    anchors: {
      Finalite: "finalite",
      DonneesACaracterePersonelTraitees: "donnees-a-caractere-personel-traitees",
      BaseJuridiqueDuTraitementDeDonnees: "base-juridique-du-traitement-de-donnees",
      DureeDeConservation: "duree-de-conservation",
      DroitDesPersonnesConcernees: "droit-des-personnes-concernees",
      DestinatairesDesDonnees: "destinataires-des-donnees",
      SecuriteEtConfidentialiteDesDonnees: "securite-et-confidentialite-des-donnees",
    },
  },
  QuestionsReponses: {
    path: "/questions-reponses",
    title: "Questions & réponses",
    QuestCeQueLeTdb: {
      path: "/questions-reponses/qu-est-ce-que-le-tableau-de-bord",
      title: "Qu'est-ce-que le tableau de bord ?",
    },
    CommentFonctionneLeTdb: {
      path: "/questions-reponses/comment-fonctionne-le-tableau-de-bord",
      title: "Comment fonctionne le tableau de bord ?",
    },
    ContacterLequipeDuTdb: {
      path: "/questions-reponses/contacter-l-equipe",
      title: "Contacter l'équipe du tableau de bord",
    },
  },
  OrganismeFormation: {
    path: "/organisme-formation",
    title: "Vous êtes un organisme de formation",
    transmettre: {
      path: "/organisme-formation/transmettre",
      title: "Comment transmettre les données de votre organisme ?",
    },
    consulter: {
      path: "/organisme-formation/consulter",
      title: "Comment vérifier les données que vous transmettez ?",
    },
    aide: {
      path: "/organisme-formation/aide",
      title: "Page d'aide",
    },
  },
  ExplorerLesIndicateurs: {
    path: "/explorer-les-indicateurs",
    title: "Visualiser les indicateurs en temps réel",
  },
  VisualiserLesIndicateurs: {
    path: "/mon-espace/mon-organisme/",
    title: "Visualiser les indicateurs en temps réel",
  },
  VisualiserLesIndicateursParTerritoire: {
    path: "/mon-espace/mon-organisme/par-territoire",
    title: "Vue territoriale",
  },
  VisualiserLesIndicateursParReseau: {
    path: "/mon-espace/mon-organisme/par-reseau",
    title: "Vue par réseau",
  },
  VisualiserLesIndicateursParOrganisme: {
    path: "/mon-espace/mon-organisme/par-organisme",
    title: "Vue par organisme de formation",
  },
  VisualiserLesIndicateursParFormation: {
    path: "/mon-espace/mon-organisme/par-formation",
    title: "Vue par formation",
  },
  Statistiques: {
    path: "/stats",
    title: "Statistiques",
  },
  DonneesPersonnelles: {
    path: "/donnees-personnelles",
    anchors: {
      missionInteretPublic: "mission-interet-public",
      faciliterPilotage: "faciliter-pilotage-operationnel",
      minimisationDonnees: "minimisation-donnees",
    },
    title: "Protection des données à caractère personnel",
  },
  CGU: {
    path: "/cgu",
    anchors: {
      ChampApplication: "champ-application",
      Objet: "objet",
      Definition: "definition",
      FonctionnaliteLieesAuxComptesDesUtilisateurs: "fonctionnalite-liees-aux-comptes-des-utilisateurs",
      PresentationDesServices: "presentation-des-services",
      Securite: "securite",
      Hyperliens: "hyperliens",
      Responsabilites: "responsabilites",
      MiseAjourDesConditionsUtilisation: "mise-a-jour-des-conditions-utilisation",
    },
    title: "CONDITIONS GÉNÉRALES D'UTILISATION DU TABLEAU DE BORD DE L’APPRENTISSAGE",
  },
  Cfa: {
    path: "/cfa",
    title: "Cfa",
  },
  ModifierMotDePasse: {
    path: "/modifier-mot-de-passe",
    title: "Modifiez votre mot de passe",
  },
  GestionUtilisateurs: {
    path: "/admin/gestion-utilisateurs",
    title: "Gestion des utilisateurs",
  },
  GestionReseauxCfas: {
    path: "/admin/gestion-reseaux-cfas",
    title: "Gestion des reseaux CFAS",
  },
};

export const plausibleGoals = [
  // Page Statistiques
  "clic_statistiques",
  "clic_stats_visites",
  "clic_stats_profils-utilisateur",
  "clic_stats_acquisition",
  "clic_stats_qualite",
  "clic_stats_couverture",

  // Header
  "clic_homepage_inscription_header",
  "clic_homepage_connexion_header",

  // Page d'accueil
  "clic_homepage_inscription_bandeau",
  "clic_homepage_connexion_bandeau",
  "clic_homepage_inscription_carto",
  "clic_homepage_connexion_carto",
  "clic_homepage_page_linkedin",

  // Menu
  "clic_homepage_questions",
  "clic_homepage_page_aide",
  "clic_homepage_referencement_organisme",
  "clic_homepage_envoi_message",
  "clic_homepage_voeux_affelnet",

  // Page SIFA
  "clic_depot_plateforme_sifa",
  "clic_toggle_sifa_données_manquantes",
  "clic_sifa_faq",

  // Téléchargements
  // - Page indicateurs
  "telechargement_liste_sans_contrats",
  "telechargement_liste_rupturants",
  "telechargement_liste_abandons",
  "telechargement_liste_apprentis",
  "telechargement_liste_apprenants",
  "telechargement_liste_repartition_effectifs",

  // - Page organismes
  "telechargement_liste_of_a_fiabiliser",
  "telechargement_liste_of_fiables",

  // - Page SIFA
  "telechargement_sifa",
  "telechargement_fichier_instruction_sifa",

  // - Page SIFA ou Page Effectifs
  "clic_verifier_doublons_effectifs",

  // - Page Effectifs Doublons
  "suppression_doublons_effectifs",
  "suppression_doublons_effectifs_en_lot",

  // - Cerfa
  "clic_redirection_cerfa",

  // - Page referencement-organisme
  "referencement_clic_onglet_siret",
  "referencement_clic_onglet_uai",
  "referencement_clic_onglet_nature",
  "referencement_clic_onglet_qualiopi",
  "referencement_clic_onglet_code_rncp",
  "referencement_telechargement_tuile_uai",
  "referencement_telechargement_tuile_nature",
  "referencement_telechargement_fichier",
  "referencement_clic_responsable_donnee",
  "referencement_clic_modification_donnee",

  // - Page téléversement
  "televersement_clic_telechargement_excel",
  "televersement_clic_modale_donnees_obligatoires",
  "televersement_clic_guide_donnees",
  "televersement_clic_tutoriel_video",
  "televersement_clic_excel_conseils",
  "televersement_clic_rapport_transmission",

  // Kit déploiement

  "clic_homepage_kit_deploiement",

  // Indicateurs organismes
  "telechargement_liste_organismes_sans_effectifs",
  "telechargement_liste_organismes_nature_inconnue",
  "telechargement_liste_organismes_siret_ferme",
  "telechargement_liste_organismes_uai_non_determine",

  // Mission locale
  "telechargement_mission_locale_liste",
  "reporting_mission_locale_effectif",
] as const;

export type PlausibleGoalType = (typeof plausibleGoals)[number];

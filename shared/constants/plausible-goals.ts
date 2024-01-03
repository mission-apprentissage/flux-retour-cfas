// référence : https://www.notion.so/mission-apprentissage/Tracking-Plausible-TDB-86c1845affea4d759fc022093af95837

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
  "clic_homepage_envoi_message",

  // Page SIFA
  "clic_depot_plateforme_sifa",
  "clic_toggle_sifa_données_manquantes",

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
] as const;

export type PlausibleGoalType = (typeof plausibleGoals)[number];

export const plausibleProperties = ["organisationType", "organisationNom"] as const;

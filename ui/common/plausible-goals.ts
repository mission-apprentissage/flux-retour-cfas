// identique au script server/src/jobs/seed/plausible/goals.ts
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
] as const;

type PlausibleGoalType = (typeof plausibleGoals)[number];

export type PlausibleGoalsEvents = { [key in PlausibleGoalType]: any };

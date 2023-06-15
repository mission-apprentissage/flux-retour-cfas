import axios from "axios";

const plausibleDomains = [
  "cfas.apprentissage.beta.gouv.fr",
  "cfas-recette.apprentissage.beta.gouv.fr",
  "cfas-dev.apprentissage.beta.gouv.fr",
];

// https://www.notion.so/mission-apprentissage/Tracking-Plausible-TDB-86c1845affea4d759fc022093af95837
// identique à la liste côté UI ui/common/plausible-goals.ts
const goals = [
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
];

const PLAUSIBLE_TOKEN = process.env.PLAUSIBLE_TOKEN;
export const seedPlausibleGoals = async () => {
  try {
    for (const domain of plausibleDomains) {
      console.info(`Seeding plausible goals for ${domain}...`);
      for (const goal of goals) {
        await axios.put(
          "https://plausible.io/api/v1/sites/goals",
          {
            site_id: domain,
            goal_type: "event",
            event_name: goal,
          },
          {
            headers: {
              Authorization: `Bearer ${PLAUSIBLE_TOKEN}`,
            },
          }
        );
        console.info(` - goal ${goal} created/updated`);
      }
    }
  } catch (error: any) {
    console.error(error?.response?.data);
  }
};

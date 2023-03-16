import axios from "axios";

const plausibleDomains = [
  "cfas.apprentissage.beta.gouv.fr",
  "cfas-recette.apprentissage.beta.gouv.fr",
  "cfas-dev.apprentissage.beta.gouv.fr",
];

const goals = [
  // Page Statistiques
  "clic_statistiques",
  "clic_stats_visites",
  "clic_stats_profil-utilisateur",
  "clic_stats_acquisition",
  "clic_stats_qualite",
  "clic_stats_couverture",

  // page aide
  "clic_bouton_aide",
  "clic_aide_footer",

  // vue dreets
  "clic_dreets_vue_territoriale",
  "clic_dreets_vue_reseau",
  "clic_dreets_vue_of",
  "clic_dreets_vue_formation",
  "clic_filtre_territoire",
  "clic_selection_territoire",
  "clic_onglet_vue_globale",
  "clic_onglet_effectifs_organisme",
  "clic_onglet_vue_effectifs_niveau",
  "clic_organisme",
  "telechargement_donnees_territoire_dreets",

  // Vue OF
  "clic_organisme",
  "telechargement_effectifs_of",
  "clic_toggle",
  "clic_filtre_annee_scolaire",
  "clic_mes_parametres",
  "clic_nb_lignes_liste",
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
  } catch (/** @type {any}*/ error) {
    console.error(error?.response?.data);
  }
};

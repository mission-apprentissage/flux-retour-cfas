import { captureException } from "@sentry/node";
import axios from "axios";
import { plausibleGoals } from "shared";

const plausibleDomains = [
  "cfas.apprentissage.beta.gouv.fr",
  "cfas-recette.apprentissage.beta.gouv.fr",
  "cfas-dev.apprentissage.beta.gouv.fr",
];

const PLAUSIBLE_TOKEN = process.env.PLAUSIBLE_TOKEN;
export const seedPlausibleGoals = async () => {
  try {
    for (const domain of plausibleDomains) {
      console.info(`Seeding plausible goals for ${domain}...`);
      for (const goal of plausibleGoals) {
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
    captureException(error);
  }
};

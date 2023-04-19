import config from "./config.js";
import { createClamav } from "./common/services/clamav.js";
import { createMailerService } from "./common/services/mailer/mailer.js";

export let mailer: ReturnType<typeof createMailerService>;
export let clamav: ReturnType<typeof createClamav>;

const createGlobalServices = async () => {
  // Hack pour rendre ces services globaux
  // On pourra passer par un singleton global plus tard (pour rester dans la mouvance des actions)
  mailer = createMailerService();
  clamav = createClamav(config.clamav.uri);
};

export default createGlobalServices;

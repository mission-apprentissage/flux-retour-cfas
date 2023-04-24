import config from "@/config";

import { createClamav } from "./common/services/clamav";
import { createMailerService } from "./common/services/mailer/mailer";

export let mailer: ReturnType<typeof createMailerService>; // eslint-disable-line import/no-mutable-exports
export let clamav: ReturnType<typeof createClamav>; // eslint-disable-line import/no-mutable-exports

const createGlobalServices = () => {
  // Hack pour rendre ces services globaux
  // On pourra passer par un singleton global plus tard (pour rester dans la mouvance des actions)
  mailer = createMailerService();
  clamav = createClamav(config.clamav.uri);
};

export default createGlobalServices;

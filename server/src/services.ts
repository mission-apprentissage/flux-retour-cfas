import { createMailerService } from "./common/services/mailer/mailer";

export let mailer: ReturnType<typeof createMailerService>; // eslint-disable-line import/no-mutable-exports

const createGlobalServices = () => {
  // Hack pour rendre ces services globaux
  // On pourra passer par un singleton global plus tard (pour rester dans la mouvance des actions)
  mailer = createMailerService();
};

export default createGlobalServices;

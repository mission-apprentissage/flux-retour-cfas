import config from "./config.js";
import { createClamav } from "./common/services/clamav.js";
import { createMailerService } from "./common/services/mailer/mailer.js";
import { createMailer } from "./common/actions/emails.actions.js";
import { createRedis } from "./common/services/redis.js";
import logger from "./common/logger.js";

export let mailerActions: ReturnType<typeof createMailer>;

const createServices = async (options: any = {}) => {
  // Hack pour rendre global l'instance des emails
  // On pourra passer par un singleton global plus tard (pour rester dans la mouvance des actions)
  mailerActions = createMailer(options.mailerService || createMailerService());

  return {
    mailer: mailerActions,
    clamav: options.clamav || (await createClamav(config.clamav.uri)),
    cache:
      options.cache ||
      (await createRedis({
        uri: config.redis.uri,
        onError: (err) => logger.error("Redis client error", err),
        onReady: () => logger.info("Redis client ready!"),
      })),
  };
};

export default createServices;

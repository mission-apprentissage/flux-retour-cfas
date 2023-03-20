import config from "./config.js";
import { createClamav } from "./common/services/clamav.js";
import { createMailerService } from "./common/services/mailer/mailer.js";
import { createRedis } from "./common/services/redis.js";
import logger from "./common/logger.js";

export let mailer: ReturnType<typeof createMailerService>;
export let clamav: ReturnType<typeof createClamav>;
export let cache: Awaited<ReturnType<typeof createRedis>>;

const createGlobalServices = async () => {
  // Hack pour rendre ces services globaux
  // On pourra passer par un singleton global plus tard (pour rester dans la mouvance des actions)
  mailer = createMailerService();
  clamav = createClamav(config.clamav.uri);
  cache = await createRedis({
    uri: config.redis.uri,
    onError: (err) => logger.error("Redis client error", err),
    onReady: () => logger.info("Redis client ready!"),
  });
};

export default createGlobalServices;

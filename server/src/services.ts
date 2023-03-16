import config from "./config.js";
import { createClamav } from "./common/services/clamav.js";
import { createMailerService } from "./common/services/mailer/mailer.js";
import { createMailer } from "./common/actions/emails.actions.js";
import { createRedis } from "./common/services/redis.js";
import logger from "./common/logger.js";

const createServices = async (options = {}) => {
  return {
    mailer: createMailer(options.mailerService || createMailerService()),
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

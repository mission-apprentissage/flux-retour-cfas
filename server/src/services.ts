import config from "./config";
import { createClamav } from "./common/services/clamav";
import { createMailerService } from "./common/services/mailer/mailer";
import { createMailer } from "./common/actions/emails.actions";
import { createRedis } from "./common/services/redis";
import logger from "./common/logger";

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

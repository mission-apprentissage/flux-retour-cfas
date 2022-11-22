import config from "./config.js";
import { createClamav } from "./common/services/clamav.js";
import { createMailerService } from "./common/services/mailer/mailer.js";
import { createMailer } from "./common/actions/emails.actions.js";

const createServices = async (options = {}) => {
  return {
    mailer: createMailer(options.mailerService || createMailerService()),
    clamav: options.clamav || (await createClamav(config.clamav.uri)),
  };
};

export default createServices;

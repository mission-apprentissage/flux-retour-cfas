import nock from "nock";

import logger from "@/common/logger";

export const nockBrevo = () => {
  logger.info("Nocking Brevo");

  nock("https://api.brevo.com")
    .persist() // Keep the interceptor active for all tests
    .defaultReplyHeaders({ "Content-Type": "application/json" })
    .get(/.*/) // Matches all GET requests
    .reply(200, { message: "Mocked GET response" })
    .post(/.*/) // Matches all POST requests
    .reply(201, { message: "Mocked POST response" })
    .put(/.*/) // Matches all PUT requests
    .reply(200, { message: "Mocked PUT response" })
    .delete(/.*/) // Matches all DELETE requests
    .reply(204, { message: "Mocked DELETE response" });
};

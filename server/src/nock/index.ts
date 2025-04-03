import { nockBrevo } from "@tests/utils/nockApis/nock-brevo";

export const setupLocalNock = () => {
  if (process.env.NODE_ENV !== "developpement") {
    return;
  }

  nockBrevo();
};

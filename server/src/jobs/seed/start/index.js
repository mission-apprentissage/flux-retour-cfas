import logger from "../../../common/logger.js";
import { createUser } from "../../../common/components/usersComponent.js";
import defaultRolesAcls from "./fixtures/defaultRolesAcls.js";
import { createRole } from "../../../common/components/rolesComponent.js";
import { createSifa } from "../../../common/components/sifasComponent.js";

const createUsers = async ({ adminEmail }) => {
  await createUser(
    { email: adminEmail, password: "Secret!Password1" },
    {
      nom: "Admin",
      prenom: "test",
      permissions: { is_admin: true },
      account_status: "FORCE_RESET_PASSWORD",
    }
  );
  logger.info(`User ${adminEmail} with password 'Secret!Password1' and admin is successfully created `);
};

export const seed = async ({ adminEmail }) => {
  for (const key of Object.keys(defaultRolesAcls)) {
    await createRole(defaultRolesAcls[key]);
    logger.info(`Role ${key} created`);
  }

  await createUsers({ adminEmail });

  await createSifa(); // TODO TMP

  logger.info(`Seed tjp-pilotage created`);
};

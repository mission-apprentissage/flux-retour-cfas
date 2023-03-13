import logger from "../../../common/logger.js";
import { createUser, getUser } from "../../../common/actions/users.actions.js";
import defaultRolesAcls from "./fixtures/defaultRolesAcls.js";
import { createRole, findRoleByName } from "../../../common/actions/roles.actions.js";
import {
  addContributeurOrganisme,
  createOrganisme,
  findOrganismeByUai,
  findOrganismeByUaiAndSiret,
} from "../../../common/actions/organismes/organismes.actions.js";
import { createUserPermissions } from "../../../common/actions/users.afterCreate.actions.js";
import { buildAdresseFromUai } from "../../../common/utils/uaiUtils.js";

export const seedRoles = async () => {
  for (const key of Object.keys(defaultRolesAcls)) {
    if (!(await findRoleByName(defaultRolesAcls[key].name))) {
      await createRole(defaultRolesAcls[key]);
      logger.info(`Role ${key} created`);
    } else {
      logger.info(`Role ${key} already existant`);
    }
  }
};

export const seedAdmin = async ({ adminEmail }) => {
  // Create user Admin
  const aEmail = adminEmail || "admin@test.fr";
  const userAdmin = await createUser(
    { email: aEmail, password: "Secret!Password1" },
    {
      nom: "Admin",
      prenom: "test",
      permissions: { is_admin: true, is_cross_organismes: true },
      account_status: "DIRECT_PENDING_PASSWORD_SETUP",
      siret: "13002526500013", // Siret Dinum
    }
  );
  await createUserPermissions({ user: userAdmin, pending: false, notify: false });
  logger.info(`User ${aEmail} with password 'Secret!Password1' and admin is successfully created `);

  logger.info("Seed admin created");
};

export const seedSample = async () => {
  await seedSampleOrganismes();
  await seedSampleUsers();
};

const seedSampleOrganismes = async () => {
  // Create Organisme A reseau A erp A
  // Create Organisme B reseau A erp B
  // Create Organisme C reseau B erp A

  const organismeK = await findOrganismeByUaiAndSiret("0333326L", "51400512300062");
  if (!organismeK) {
    await createOrganisme(
      {
        uai: "0333326L",
        siret: "51400512300062",
        nature: "responsable_formateur",
        ...buildAdresseFromUai("0333326L"),
      },
      { callLbaApi: false, buildFormationTree: false, buildInfosFromSiret: false }
    );
  }

  const organismeA = await findOrganismeByUaiAndSiret("0142321X", "44492238900010");
  if (!organismeA) {
    await createOrganisme(
      {
        uai: "0142321X",
        siret: "44492238900010",
        reseaux: ["CCI"],
        nature: "responsable_formateur",
        nom: "ADEN Formations (Caen)",
        ...buildAdresseFromUai("0142321X"),
      },
      { callLbaApi: false, buildFormationTree: false, buildInfosFromSiret: false }
    );
    logger.info("organisme A created");
  }

  const organismeB = await findOrganismeByUaiAndSiret("0611309S", "44492238900010");
  if (!organismeB) {
    await createOrganisme(
      {
        uai: "0611309S",
        siret: "44492238900044",
        reseaux: ["CCI"],
        erps: ["GESTI"],
        nature: "inconnue",
        nom: "ADEN Formations (Damigny)",
        ...buildAdresseFromUai("0611309S"),
      },
      { callLbaApi: false, buildFormationTree: false, buildInfosFromSiret: false }
    );
    logger.info("organisme B created");
  }

  const organismeC = await findOrganismeByUaiAndSiret("0010856A", "77931004400028");
  if (!organismeC) {
    await createOrganisme(
      {
        uai: "0010856A",
        siret: "77931004400028",
        reseaux: ["UIMM"],
        erps: ["YMAG"],
        nature: "responsable_formateur",
        nom: "AFPMA APPRENTISSAGE - Site de Peronnas",
        ...buildAdresseFromUai("0010856A"),
      },
      { callLbaApi: false, buildFormationTree: false, buildInfosFromSiret: false }
    );
    logger.info("organisme C created");
  }

  const organismeZ = await findOrganismeByUaiAndSiret("0261098C", "34497770700027");
  if (!organismeZ) {
    await createOrganisme(
      {
        uai: "0261098C",
        siret: "34497770700027",
        reseaux: ["MFR"],
        erps: ["GESTI"],
        nature: "responsable_formateur",
        nom: "MAISON FAMILIALE RURALE CFA - 26300 CHATEAUNEUF SUR ISERE",
        ...buildAdresseFromUai("0261098C"),
      },
      { callLbaApi: false, buildFormationTree: false, buildInfosFromSiret: false }
    );
    logger.info("organisme Z created");
  }

  const organismeE = await findOrganismeByUaiAndSiret("0312755B", "49917930700024");
  if (!organismeE) {
    await createOrganisme(
      {
        uai: "0312755B",
        siret: "49917930700024",
        nature: "responsable_formateur",
        nom: "MIDISUP",
        ...buildAdresseFromUai("0312755B"),
      },
      { callLbaApi: false, buildFormationTree: false, buildInfosFromSiret: false }
    );
    logger.info("organisme E created");
  }
};

const seedSampleUsers = async () => {
  // Création des roles si nécessaire
  await seedRoles();

  // Create user Pilot
  if (!(await getUser("pilot@test.fr"))) {
    const userPilot = await createUser(
      { email: "pilot@test.fr", password: "Secret!Password1" },
      {
        nom: "pilot",
        prenom: "test",
        description: "DREETS AUVERGNE-RHONES-ALPES",
        permissions: { is_cross_organismes: true },
        roles: ["pilot"],
        account_status: "DIRECT_PENDING_PASSWORD_SETUP",
        siret: "13000992100011",
        codes_region: ["84"],
        organisation: "DREETS",
      }
    );
    await createUserPermissions({ user: userPilot, pending: false, notify: false });
    logger.info("User pilot created");
  }

  // Create user OF
  if (!(await getUser("of@test.fr"))) {
    const userOf = await createUser(
      { email: "of@test.fr", password: "Secret!Password1" },
      {
        nom: "of",
        prenom: "test",
        description: "Aden formation Caen - direction",
        roles: ["of"],
        account_status: "DIRECT_PENDING_PASSWORD_SETUP",
        siret: "44492238900010",
        uai: "0142321X",
        organisation: "ORGANISME_FORMATION",
      }
    );
    await createUserPermissions({ user: userOf, pending: false, notify: false, asRole: "organisme.admin" });
    logger.info("User off created");
  }

  // Create user OFR
  if (!(await getUser("ofr@test.fr"))) {
    const userOfR = await createUser(
      { email: "ofr@test.fr", password: "Secret!Password1" },
      {
        nom: "ofr",
        prenom: "test",
        description: "ADEN Formations (Damigny)",
        roles: ["of"],
        account_status: "DIRECT_PENDING_PASSWORD_SETUP",
        siret: "44492238900044",
        uai: "0611309S",
        organisation: "ORGANISME_FORMATION",
      }
    );
    await createUserPermissions({ user: userOfR, pending: false, notify: false, asRole: "organisme.admin" });
    // Get organisme id for user
    const organismeOff = await findOrganismeByUai("0142321X");
    await addContributeurOrganisme(organismeOff?._id, userOfR?.email, "organisme.statsonly", false);
    logger.info("User ofr created");
  }

  // Create user Reseau
  if (!(await getUser("reseau@test.fr"))) {
    const userReseau = await createUser(
      { email: "reseau@test.fr", password: "Secret!Password1" },
      {
        nom: "reseau",
        prenom: "test",
        description: "CCI paris",
        roles: ["reseau_of"],
        account_status: "DIRECT_PENDING_PASSWORD_SETUP",
        siret: "13001727000013",
        reseau: "CCI",
        organisation: "TETE_DE_RESEAU",
      }
    );
    await createUserPermissions({ user: userReseau, pending: false, notify: false });
    logger.info("User reseau created");
  }

  // Create user ERP
  if (!(await getUser("erp@test.fr"))) {
    const userErp = await createUser(
      { email: "erp@test.fr", password: "Secret!Password1" },
      {
        nom: "erp",
        prenom: "test",
        description: "Erp ymag salarié",
        roles: ["erp"],
        account_status: "DIRECT_PENDING_PASSWORD_SETUP",
        siret: "31497933700081",
        erp: "YMAG",
        organisation: "ERP",
      }
    );
    await createUserPermissions({ user: userErp, pending: false, notify: false });
    logger.info("User erp created");
  }
};

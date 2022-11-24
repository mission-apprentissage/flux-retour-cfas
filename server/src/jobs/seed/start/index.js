import logger from "../../../common/logger.js";
import { createUser } from "../../../common/actions/users.actions.js";
import defaultRolesAcls from "./fixtures/defaultRolesAcls.js";
import { createRole } from "../../../common/actions/roles.actions.js";
// import { createSifa } from "../../../common/actions/sifas.actions.js";
import { addContributeurOrganisme, createOrganisme } from "../../../common/actions/organismes.actions.js";
import { userAfterCreate } from "../../../common/actions/users.afterCreate.actions.js";

export const seed = async ({ adminEmail }) => {
  for (const key of Object.keys(defaultRolesAcls)) {
    await createRole(defaultRolesAcls[key]);
    logger.info(`Role ${key} created`);
  }

  // Create Organisme A reseau A erp A
  // Create Organisme B reseau A erp B
  // Create Organisme C reseau B erp A
  // Create Organisme D pas de reseau, pas d'erp, pas de siret
  const organismeOFF = await createOrganisme({
    uai: "0142321X",
    sirets: ["44492238900010"],
    adresse: {
      departement: "14",
      region: "28",
      academie: "70",
    },
    reseaux: ["CCI"],
    erps: ["YMAG"],
    nature: "responsable_formateur",
    nom: "ADEN Formations (Caen)",
  });
  logger.info(`organismeA created`);
  // const organismeB =
  await createOrganisme({
    uai: "0611309S",
    sirets: ["44492238900044"],
    adresse: {
      departement: "61",
      region: "28",
      academie: "70",
    },
    reseaux: ["CCI"],
    erps: ["GESTI"],
    nature: "inconnue",
    nom: "ADEN Formations (Damigny)",
  });
  logger.info(`organismeB created`);
  // const organismeC =
  await createOrganisme({
    uai: "0010856A",
    sirets: ["77931004400028"],
    adresse: {
      departement: "01",
      region: "84",
      academie: "10",
    },
    reseaux: ["UIMM"],
    erps: ["YMAG"],
    nature: "responsable_formateur",
    nom: "AFPMA APPRENTISSAGE - Site de Peronnas",
  });
  logger.info(`organismeC created`);
  // const organismeD =
  await createOrganisme({
    uai: "0780762E",
    adresse: {
      departement: "78",
      region: "11",
      academie: "25",
    },
    nature: "responsable_formateur",
    nom: "AFTRAL CFA TL LE TREMBLAY EPT",
  });
  logger.info(`organismeD created`);

  // Create user Admin
  const aEmail = adminEmail || "admin@test.fr";
  const userAdmin = await createUser(
    { email: aEmail, password: "Secret!Password1" },
    {
      nom: "Admin",
      prenom: "test",
      permissions: { is_admin: true, is_cross_organismes: true },
      account_status: "FORCE_RESET_PASSWORD",
      siret: "13002526500013", // Siret Dinum
    }
  );
  await userAfterCreate({ user: userAdmin, pending: false });
  logger.info(`User ${aEmail} with password 'Secret!Password1' and admin is successfully created `);

  // Create user Pilot
  const urserPilot = await createUser(
    { email: "pilot@test.fr", password: "Secret!Password1" },
    {
      nom: "pilot",
      prenom: "test",
      description: "DREETS AUVERGNE-RHONES-ALPES",
      permissions: { is_cross_organismes: true },
      roles: ["pilot"],
      account_status: "FORCE_RESET_PASSWORD",
      siret: "13000992100011",
      codes_region: ["84"],
      organisation: "DREETS",
    }
  );
  await userAfterCreate({ user: urserPilot, pending: false });
  logger.info(`User pilot created`);

  // Create user OF
  const urserOf = await createUser(
    { email: "of@test.fr", password: "Secret!Password1" },
    {
      nom: "of",
      prenom: "test",
      description: "Aden formation Caen - direction",
      roles: ["of"],
      account_status: "FORCE_RESET_PASSWORD",
      siret: "44492238900010",
      uai: "0142321X",
      organisation: "ORGANISME_FORMATION",
    }
  );
  await userAfterCreate({ user: urserOf, pending: false });
  logger.info(`User off created`);

  const urserOfR = await createUser(
    { email: "ofr@test.fr", password: "Secret!Password1" },
    {
      nom: "ofr",
      prenom: "test",
      description: "ADEN Formations (Damigny)",
      roles: ["of"],
      account_status: "FORCE_RESET_PASSWORD",
      siret: "44492238900044",
      uai: "0611309S",
      organisation: "ORGANISME_FORMATION",
    }
  );
  await userAfterCreate({ user: urserOfR, pending: false });
  await addContributeurOrganisme(organismeOFF._id, urserOfR.email, "organisme.admin", false);
  logger.info(`User ofr created`);

  // Create user Reseau
  const urserReseau = await createUser(
    { email: "reseau@test.fr", password: "Secret!Password1" },
    {
      nom: "reseau",
      prenom: "test",
      description: "CCI paris",
      roles: ["reseau_of"],
      account_status: "FORCE_RESET_PASSWORD",
      siret: "13001727000013",
      reseau: "CCI",
      organisation: "TETE_DE_RESEAU",
    }
  );
  await userAfterCreate({ user: urserReseau, pending: false });
  logger.info(`User reseau created`);

  // Create user ERP
  const urserErp = await createUser(
    { email: "erp@test.fr", password: "Secret!Password1" },
    {
      nom: "erp",
      prenom: "test",
      description: "Erp ymag salarié",
      roles: ["erp"],
      account_status: "FORCE_RESET_PASSWORD",
      siret: "31497933700081",
      erp: "YMAG",
      organisation: "ERP",
    }
  );
  await userAfterCreate({ user: urserErp, pending: false });
  logger.info(`User erp created`);

  ///BELOW OTHER STUFF

  // await createSifa(); // TODO TMP

  logger.info(`Seed tjp-pilotage created`);
};

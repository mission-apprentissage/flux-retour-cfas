const { program: cli } = require("commander");
const config = require("../../../config/index.js");
const { JOB_NAMES } = require("../../common/constants/jobsConstants.js");
const { PARTAGE_SIMPLIFIE_ROLES } = require("../../common/roles.js");
const { runScript } = require("../scriptWrapper.js");
const { runSendDossiersApprenantsToTdb } = require("./send-dossiersApprenants/index.js");
const { runCreateUser } = require("./users/create/index.js");
const { runGeneratePasswordUpdateToken } = require("./users/generate-password-update-token/index.js");

/**
 * Job de création d'utilisateur
 */
cli
  .command("create-user")
  .description("Création d'utilisateur partage simplifié")
  .requiredOption("-e, --email <string>", "Email de l'utilisateur à créer")
  .requiredOption("-r, --role <string>", "Role de l'utilisateur à créer")
  .action(({ email, role }) => {
    runScript(async ({ partageSimplifieUsers }) => {
      return runCreateUser(partageSimplifieUsers, { email, role });
    }, JOB_NAMES.createPsUser);
  });

/**
 * Job de création d'administrateur
 */
cli
  .command("create-admin")
  .description("Création d'administration")
  .requiredOption("-e, --email <string>", "Email de l'administrateur à créer")
  .action(({ email }) => {
    runScript(async ({ partageSimplifieUsers }) => {
      return runCreateUser(partageSimplifieUsers, { email, role: PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR });
    }, JOB_NAMES.createPsUser);
  });

/**
 * Job de génération de lien de modification de mot de passe
 */
cli
  .command("generate-password-update-token")
  .description("Génération du lien de MAJ de mot de passe")
  .requiredOption("-e, --email <string>", "Email de l'utilisateur à créer")
  .action(({ email }) => {
    runScript(async ({ partageSimplifieUsers }) => {
      console.log(config.publicUrl);
      return runGeneratePasswordUpdateToken(partageSimplifieUsers, { email });
    }, JOB_NAMES.generatePsPasswordUpdateToken);
  });

/**
 * Job d'envoi des données apprenants à l'API du TDB
 */
cli
  .command("send-dossiersApprenants")
  .description("Job d'envoi des données apprenants sous forme de dossiersApprenants à l'API du Tdb")
  .action(() => {
    runScript(async ({ jobEvents }) => {
      return runSendDossiersApprenantsToTdb(jobEvents);
    }, JOB_NAMES.sendDossiersApprenants);
  });

cli.parse(process.argv);

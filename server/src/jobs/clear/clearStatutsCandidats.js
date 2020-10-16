const { runScript } = require("../scriptWrapper");
const { ask } = require("stdio");
const logger = require("../../common/logger");
const { clearStatutsCandidats } = require("./utils/clearUtils");

runScript(async () => {
  try {
    const color = await ask("-> Êtes vous sur de vouloir supprimer tous les statutsCandidats ?", {
      options: ["oui", "non"],
    });
    if (color === "oui") {
      await clearStatutsCandidats();
    }
  } catch (err) {
    logger.info("Réponse non prise en charge...");
  }
});

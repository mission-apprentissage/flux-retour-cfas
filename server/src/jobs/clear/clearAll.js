const { runScript } = require("../scriptWrapper");
const { ask } = require("stdio");
const { clearAll } = require("./utils/clearUtils");
const logger = require("../../common/logger");

runScript(async () => {
  try {
    const color = await ask("-> Êtes vous sur de vouloir supprimer toutes les données ?", {
      options: ["oui", "non"],
    });
    if (color === "oui") {
      await clearAll();
    }
  } catch (err) {
    logger.info("Réponse non prise en charge...");
  }
});

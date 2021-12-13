const { runScript } = require("../../scriptWrapper");

runScript(async ({ db }) => {
  const collection = db.collection("statutsCandidats");

  await collection.updateMany(
    {},
    {
      $unset: { prenom2_apprenant: "", prenom3_apprenant: "" },
    }
  );
}, "remove-outdated-data");

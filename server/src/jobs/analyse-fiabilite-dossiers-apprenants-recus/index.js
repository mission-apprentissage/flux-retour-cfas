const { runScript } = require("../scriptWrapper");
const { v4: uuid } = require("uuid");
const cliProgress = require("cli-progress");
const { UserEventModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { validateNomApprenant } = require("../../common/domain/apprenant/nomApprenant");
const { validatePrenomApprenant } = require("../../common/domain/apprenant/prenomApprenant");
const { DossierApprenantApiInputFiabilite } = require("../../common/factory/dossierApprenantApiInputFiabilite");
const {
  DossierApprenantApiInputFiabiliteReport,
} = require("../../common/factory/dossierApprenantApiInputFiabiliteReport");
const { USER_EVENTS_ACTIONS } = require("../../common/constants/userEventsConstants");
const { validateIneApprenant } = require("../../common/domain/apprenant/ineApprenant");
const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const isSet = (value) => {
  return value !== null && value !== undefined && value !== "";
};

runScript(async ({ db }) => {
  // find all dossiers apprenants sent in the last 24 hours
  const latestReceivedDossiersApprenants = await UserEventModel.aggregate([
    {
      $match: {
        action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT,
        $expr: {
          $gte: ["$date", { $dateSubtract: { startDate: "$$NOW", unit: "hour", amount: 24 } }],
        },
      },
    },
    {
      $unwind: "$data",
    },
  ]);

  await db.collection("dossiersApprenantsApiInputFiabilite").deleteMany();

  const analysisId = uuid();
  const analysisDate = new Date();

  const fiabiliteCounts = {
    nomApprenantPresent: 0,
    nomApprenantFormatValide: 0,
    prenomApprenantPresent: 0,
    prenomApprenantFormatValide: 0,
    ineApprenantPresent: 0,
    ineApprenantFormatValide: 0,
  };
  // iterate over data and create an entry for each dossier apprenant sent with fiabilisation metadata
  loadingBar.start(latestReceivedDossiersApprenants.length, 0);
  await asyncForEach(latestReceivedDossiersApprenants, async (dossierApprenantSentEvent) => {
    const { data, username, date } = dossierApprenantSentEvent;

    const newDossierApprenantApiInputFiabiliteEntry = DossierApprenantApiInputFiabilite.create({
      analysisId,
      analysisDate,
      originalData: data,
      sentOnDate: date,
      erp: username,
      nomApprenantPresent: isSet(data.nom_apprenant),
      nomApprenantFormatValide: !validateNomApprenant(data.nom_apprenant).error,
      prenomApprenantPresent: isSet(data.prenom_apprenant),
      prenomApprenantFormatValide: !validatePrenomApprenant(data.prenom_apprenant).error,
      ineApprenantPresent: isSet(data.ine_apprenant),
      ineApprenantFormatValide: !validateIneApprenant(data.ine_apprenant).error,
    });
    await db.collection("dossiersApprenantsApiInputFiabilite").insertOne(newDossierApprenantApiInputFiabiliteEntry);

    Object.keys(fiabiliteCounts).forEach((key) => {
      if (newDossierApprenantApiInputFiabiliteEntry[key] === true) {
        fiabiliteCounts[key]++;
      }
    });
    loadingBar.increment();
  });

  await db.collection("dossiersApprenantsApiInputFiabiliteReport").insertOne(
    DossierApprenantApiInputFiabiliteReport.create({
      analysisId,
      analysisDate,
      totalDossiersApprenants: latestReceivedDossiersApprenants.length,
      totalNomApprenantPresent: fiabiliteCounts.nomApprenantPresent,
      totalNomApprenantFormatValide: fiabiliteCounts.nomApprenantFormatValide,
      totalPrenomApprenantPresent: fiabiliteCounts.prenomApprenantPresent,
      totalPrenomApprenantFormatValide: fiabiliteCounts.prenomApprenantFormatValide,
      totalIneApprenantPresent: fiabiliteCounts.ineApprenantPresent,
      totalIneApprenantFormatValide: fiabiliteCounts.ineApprenantFormatValide,
    })
  );
  loadingBar.stop();
}, "analyse-fiabilite-dossiers-apprenants-dernieres-24h");

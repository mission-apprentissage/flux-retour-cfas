const { runScript } = require("../scriptWrapper");
const { v4: uuid } = require("uuid");
const { UserEventModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { validateNomApprenant } = require("../../common/domain/apprenant/nomApprenant");
const { validatePrenomApprenant } = require("../../common/domain/apprenant/prenomApprenant");
const { DossierApprenantApiInputFiabilite } = require("../../common/factory/dossierApprenantApiInputFiabilite");
const {
  DossierApprenantApiInputFiabiliteReport,
} = require("../../common/factory/dossierApprenantApiInputFiabiliteReport");
const { USER_EVENTS_ACTIONS } = require("../../common/constants/userEventsConstants");

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
  const analysisTimestamp = new Date().getTime();

  const fiabiliteCounts = {
    nomApprenantPresent: 0,
    nomApprenantFormatValide: 0,
    prenomApprenantPresent: 0,
    prenomApprenantFormatValide: 0,
  };
  // iterate over data and create an entry for each dossier apprenant sent with fiabilisation metadata
  await asyncForEach(latestReceivedDossiersApprenants, async (dossierApprenantSentEvent) => {
    const { data, username, date } = dossierApprenantSentEvent;

    const newDossierApprenantApiInputFiabiliteEntry = DossierApprenantApiInputFiabilite.create({
      analysisId,
      analysisTimestamp,
      originalData: data,
      sentOnDate: date,
      erp: username,
      nomApprenantPresent: isSet(data.nom_apprenant),
      nomApprenantFormatValide: !validateNomApprenant(data.nom_apprenant).error,
      prenomApprenantPresent: isSet(data.prenom_apprenant),
      prenomApprenantFormatValide: !validatePrenomApprenant(data.prenom_apprenant).error,
    });
    await db.collection("dossiersApprenantsApiInputFiabilite").insertOne(newDossierApprenantApiInputFiabiliteEntry);

    Object.keys(fiabiliteCounts).forEach((key) => {
      if (newDossierApprenantApiInputFiabiliteEntry[key] === true) {
        fiabiliteCounts[key]++;
      }
    });
  });

  await db.collection("dossiersApprenantsApiInputFiabiliteReport").insertOne(
    DossierApprenantApiInputFiabiliteReport.create({
      analysisId,
      analysisTimestamp,
      totalDossiersApprenants: latestReceivedDossiersApprenants.length,
      totalNomApprenantPresent: fiabiliteCounts.nomApprenantPresent,
      totalNomApprenantFormatValide: fiabiliteCounts.nomApprenantFormatValide,
      totalPrenomApprenantPresent: fiabiliteCounts.prenomApprenantPresent,
      totalPrenomApprenantFormatValide: fiabiliteCounts.prenomApprenantFormatValide,
    })
  );
}, "analyse-fiabilite-dossiers-apprenants-dernieres-24h");

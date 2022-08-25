const { runScript } = require("../scriptWrapper");
const { v4: uuid } = require("uuid");
const { validateNomApprenant } = require("../../common/domain/apprenant/nomApprenant");
const { validatePrenomApprenant } = require("../../common/domain/apprenant/prenomApprenant");
const { DossierApprenantApiInputFiabilite } = require("../../common/factory/dossierApprenantApiInputFiabilite");
const {
  DossierApprenantApiInputFiabiliteReport,
} = require("../../common/factory/dossierApprenantApiInputFiabiliteReport");
const { USER_EVENTS_ACTIONS } = require("../../common/constants/userEventsConstants");
const { validateIneApprenant } = require("../../common/domain/apprenant/ineApprenant");
const { validateDateDeNaissanceApprenant } = require("../../common/domain/apprenant/dateDeNaissanceApprenant");
const { validateCodeCommune } = require("../../common/domain/codeCommune");
const { validateFrenchTelephoneNumber } = require("../../common/domain/frenchTelephoneNumber");
const { validateEmail } = require("../../common/domain/email");
const { validateUai } = require("../../common/domain/uai");
const { validateSiret } = require("../../common/domain/siret");

const isSet = (value) => {
  return value !== null && value !== undefined && value !== "";
};

runScript(async ({ db }) => {
  const analysisId = uuid();
  const analysisDate = new Date();

  let latestReceivedDossiersApprenantsCount = 0;
  const fiabiliteCounts = {
    nomApprenantPresent: 0,
    nomApprenantFormatValide: 0,
    prenomApprenantPresent: 0,
    prenomApprenantFormatValide: 0,
    ineApprenantPresent: 0,
    ineApprenantFormatValide: 0,
    dateDeNaissanceApprenantPresent: 0,
    dateDeNaissanceApprenantFormatValide: 0,
    codeCommuneInseeApprenantPresent: 0,
    codeCommuneInseeApprenantFormatValide: 0,
    telephoneApprenantPresent: 0,
    telephoneApprenantFormatValide: 0,
    emailApprenantPresent: 0,
    emailApprenantFormatValide: 0,
    uaiEtablissementPresent: 0,
    uaiEtablissementFormatValide: 0,
    siretEtablissementPresent: 0,
    siretEtablissementFormatValide: 0,
  };

  // find all dossiers apprenants sent in the last 24 hours
  const latestReceivedDossiersApprenantsCursor = db.collection("userEvents").aggregate([
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

  // delete existing dossiers apprenant analysis results
  await db.collection("dossiersApprenantsApiInputFiabilite").deleteMany();

  // iterate over data and create an entry for each dossier apprenant sent with fiabilisation metadata
  while (await latestReceivedDossiersApprenantsCursor.hasNext()) {
    const { data, username, date } = await latestReceivedDossiersApprenantsCursor.next();
    latestReceivedDossiersApprenantsCount++;

    const newDossierApprenantApiInputFiabiliteEntry = DossierApprenantApiInputFiabilite.create({
      analysisId,
      analysisDate,
      originalData: data,
      sentOnDate: date,
      erp: username,
      // Apprenant identification information
      nomApprenantPresent: isSet(data.nom_apprenant),
      nomApprenantFormatValide: !validateNomApprenant(data.nom_apprenant).error,
      prenomApprenantPresent: isSet(data.prenom_apprenant),
      prenomApprenantFormatValide: !validatePrenomApprenant(data.prenom_apprenant).error,
      ineApprenantPresent: isSet(data.ine_apprenant),
      ineApprenantFormatValide: !validateIneApprenant(data.ine_apprenant).error,
      dateDeNaissanceApprenantPresent: isSet(data.date_de_naissance_apprenant),
      dateDeNaissanceApprenantFormatValide: !validateDateDeNaissanceApprenant(data.date_de_naissance_apprenant).error,
      // Apprenant contact information
      codeCommuneInseeApprenantPresent: isSet(data.code_commune_insee_apprenant),
      codeCommuneInseeApprenantFormatValide: !validateCodeCommune(data.code_commune_insee_apprenant).error,
      telephoneApprenantPresent: isSet(data.tel_apprenant),
      telephoneApprenantFormatValide: !validateFrenchTelephoneNumber(data.tel_apprenant).error,
      emailApprenantPresent: isSet(data.email_contact),
      emailApprenantFormatValide: !validateEmail(data.email_contact).error,
      // Etablissement information
      uaiEtablissementPresent: isSet(data.uai_etablissement),
      uaiEtablissementFormatValide: !validateUai(data.uai_etablissement).error,
      siretEtablissementPresent: isSet(data.siret_etablissement),
      siretEtablissementFormatValide: !validateSiret(data.siret_etablissement).error,
    });
    await db.collection("dossiersApprenantsApiInputFiabilite").insertOne(newDossierApprenantApiInputFiabiliteEntry);

    Object.keys(fiabiliteCounts).forEach((key) => {
      if (newDossierApprenantApiInputFiabiliteEntry[key] === true) {
        fiabiliteCounts[key]++;
      }
    });
  }

  await db.collection("dossiersApprenantsApiInputFiabiliteReport").insertOne(
    DossierApprenantApiInputFiabiliteReport.create({
      analysisId,
      analysisDate,
      totalDossiersApprenants: latestReceivedDossiersApprenantsCount,
      totalNomApprenantPresent: fiabiliteCounts.nomApprenantPresent,
      totalNomApprenantFormatValide: fiabiliteCounts.nomApprenantFormatValide,
      totalPrenomApprenantPresent: fiabiliteCounts.prenomApprenantPresent,
      totalPrenomApprenantFormatValide: fiabiliteCounts.prenomApprenantFormatValide,
      totalIneApprenantPresent: fiabiliteCounts.ineApprenantPresent,
      totalIneApprenantFormatValide: fiabiliteCounts.ineApprenantFormatValide,
      totalDateDeNaissanceApprenantPresent: fiabiliteCounts.dateDeNaissanceApprenantPresent,
      totalDateDeNaissanceApprenantFormatValide: fiabiliteCounts.dateDeNaissanceApprenantFormatValide,
      totalCodeCommuneInseeApprenantPresent: fiabiliteCounts.codeCommuneInseeApprenantPresent,
      totalCodeCommuneInseeApprenantFormatValide: fiabiliteCounts.codeCommuneInseeApprenantFormatValide,
      totalTelephoneApprenantPresent: fiabiliteCounts.telephoneApprenantPresent,
      totalTelephoneApprenantFormatValide: fiabiliteCounts.telephoneApprenantFormatValide,
      totalEmailApprenantPresent: fiabiliteCounts.emailApprenantPresent,
      totalEmailApprenantFormatValide: fiabiliteCounts.emailApprenantFormatValide,
      totalUaiEtablissementPresent: fiabiliteCounts.uaiEtablissementPresent,
      totalUaiEtablissementFormatValide: fiabiliteCounts.uaiEtablissementFormatValide,
      totalSiretEtablissementPresent: fiabiliteCounts.siretEtablissementPresent,
      totalSiretEtablissementFormatValide: fiabiliteCounts.siretEtablissementFormatValide,
    })
  );
}, "analyse-fiabilite-dossiers-apprenants-dernieres-24h");

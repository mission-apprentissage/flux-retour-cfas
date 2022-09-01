const { runScript } = require("../scriptWrapper");
const { v4: uuid } = require("uuid");
const { validateNomApprenant, normalizeNomApprenant } = require("../../common/domain/apprenant/nomApprenant");
const { validatePrenomApprenant, normalizePrenomApprenant } = require("../../common/domain/apprenant/prenomApprenant");
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
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { getOrganismeWithSiret, getOrganismesWithUai } = require("../../common/apis/apiReferentielMna");

const isSet = (value) => {
  return value !== null && value !== undefined && value !== "";
};

runScript(async ({ db, cache }) => {
  const analysisId = uuid();
  const analysisDate = new Date();

  let latestReceivedDossiersApprenantsCount = 0;

  // find all dossiers apprenants sent in the last 24 hours
  const latestReceivedDossiersApprenantsCursor = getReceivedDossiersApprenantsInLast24hCursor(db);

  // delete existing dossiers apprenant analysis results
  await db.collection("dossiersApprenantsApiInputFiabilite").deleteMany();

  // warm cache for Referentiel UAI/SIRET API with valid SIRET already in dossiersApprenants collection
  const allSiretsInDossiersApprenants = await db.collection("dossiersApprenants").distinct("siret_etablissement");
  const getOrganismeWithSiretCached = getOrganismeWithSiret(cache);

  await asyncForEach(allSiretsInDossiersApprenants, async (siret) => {
    if (validateSiret(siret).error) return;
    await getOrganismeWithSiretCached(siret);
  });

  // warm cache for Referentiel UAI/SIRET API with valid UAI already in dossiersApprenants collection
  const allUaiInDossiersApprenants = await db.collection("dossiersApprenants").distinct("uai_etablissement");
  const getOrganismesWithUaiCached = getOrganismesWithUai(cache);

  await asyncForEach(allUaiInDossiersApprenants, async (uai) => {
    if (validateUai(uai).error) return;
    await getOrganismesWithUaiCached(uai);
  });

  const isSiretFoundInReferentielUaiSiret = async (siret) => {
    if (validateSiret(siret).error) return false;

    const organisme = await getOrganismeWithSiretCached(siret);
    if (organisme) return true;
    return false;
  };

  const isUaiFoundUniqueInReferentielUaiSiret = async (uai) => {
    if (validateUai(uai).error) return false;

    const result = await getOrganismesWithUaiCached(uai);
    return result?.pagination.total === 1;
  };

  // build map of non unique apprenants to mark them as such in fiabilité analysis
  const nonUniqueApprenants = await buildMapOfNonUniqueApprenants(latestReceivedDossiersApprenantsCursor);

  // rewind cursor so we can use it again to iterate over dossier apprenants and analyze them
  await latestReceivedDossiersApprenantsCursor.rewind();

  // initialize counts for final reports
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
    uaiEtablissementUniqueFoundInReferentiel: 0,
    siretEtablissementFoundInReferentiel: 0,
    uniqueApprenant: 0,
  };

  // iterate over data and create an entry for each dossier apprenant sent with fiabilité metadata
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
      uaiEtablissementUniqueFoundInReferentiel: await isUaiFoundUniqueInReferentielUaiSiret(data.uai_etablissement),
      siretEtablissementPresent: isSet(data.siret_etablissement),
      siretEtablissementFormatValide: !validateSiret(data.siret_etablissement).error,
      siretEtablissementFoundInReferentiel: await isSiretFoundInReferentielUaiSiret(data.siret_etablissement),
      uniqueApprenant: !nonUniqueApprenants.get(buildApprenantNormalizedId(data)),
    });

    // store analysis result for this dossier apprenant in db
    await db.collection("dossiersApprenantsApiInputFiabilite").insertOne(newDossierApprenantApiInputFiabiliteEntry);

    // update counts for final reports
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
      totalUaiEtablissementUniqueFoundInReferentiel: fiabiliteCounts.uaiEtablissementUniqueFoundInReferentiel,
      totalSiretEtablissementFoundInReferentiel: fiabiliteCounts.siretEtablissementFoundInReferentiel,
      totalUniqueApprenant: fiabiliteCounts.uniqueApprenant,
    })
  );
}, "analyse-fiabilite-dossiers-apprenants-dernieres-24h");

const getReceivedDossiersApprenantsInLast24hCursor = (db) => {
  return db.collection("userEvents").aggregate([
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
};

const buildApprenantNormalizedId = (apprenant) => {
  const normalizedPrenomApprenant = normalizePrenomApprenant(apprenant.prenom_apprenant);
  const normalizedNomApprenant = normalizeNomApprenant(apprenant.nom_apprenant);
  const normalizedDateDeNaissance = apprenant.date_de_naissance_apprenant
    ? new Date(apprenant.date_de_naissance_apprenant).getTime()
    : null;

  return `${normalizedPrenomApprenant}:${normalizedNomApprenant}:${normalizedDateDeNaissance}`;
};

const buildMapOfNonUniqueApprenants = async (dbCursor) => {
  const apprenantOccurencesCounts = new Map();

  while (await dbCursor.hasNext()) {
    const { data } = await dbCursor.next();
    const uniqueApprenantKey = buildApprenantNormalizedId(data);

    const found = apprenantOccurencesCounts.get(uniqueApprenantKey);
    if (!found) {
      apprenantOccurencesCounts.set(uniqueApprenantKey, 1);
    } else {
      apprenantOccurencesCounts.set(uniqueApprenantKey, found + 1);
    }
  }

  // return Map with unique values filtered out
  return new Map(
    Array.from(apprenantOccurencesCounts).filter(([, value]) => {
      return value > 1;
    })
  );
};

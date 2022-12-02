const { runScript } = require("../scriptWrapper");
const { fetchOrganismes } = require("../../common/apis/apiReferentielMna");
const { asyncForEach } = require("../../common/utils/asyncUtils");

const REFERENTIEL_FIELDS_TO_FETCH = [
  "siret",
  "uai",
  "etat_administratif",
  "qualiopi",
  "raison_sociale",
  "enseigne",
  "nature",
  "qualiopi",
  "adresse",
  "numero_declaration_activite",
];

/**
 * Script qui crée une collection contenant le référentiel UAI/SIRET enrichi des réseaux existants dans le TDB
 */
runScript(async ({ db, cfas }) => {
  const referentielSiretCollection = db.collection("referentielSiret");

  const { organismes } = await fetchOrganismes({
    champs: REFERENTIEL_FIELDS_TO_FETCH.join(","),
    itemsPerPage: 10000,
  });

  await referentielSiretCollection.deleteMany();

  await asyncForEach(organismes, async (organismeReferentiel) => {
    const reseaux = new Set();

    const organismesTdb = await cfas.getFromSiret(organismeReferentiel.siret);
    const reseauxFromTdb = organismesTdb.map((organisme) => organisme.reseaux).flat();
    reseauxFromTdb.forEach((reseau) => {
      reseaux.add(reseau);
    });

    await referentielSiretCollection.insertOne({
      ...organismeReferentiel,
      reseaux: [...reseaux],
    });
  });
}, "seed-organismes-from-referentiel");

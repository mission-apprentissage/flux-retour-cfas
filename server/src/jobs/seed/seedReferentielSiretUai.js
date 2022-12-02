import { __dirname } from "../../common/utils/esmUtils.js";
import { runScript } from "../scriptWrapper.js";
import { fetchOrganismes } from "../../common/apis/apiReferentielMna.js";
import { asyncForEach } from "../../common/utils/asyncUtils.js";
import { referentielSiretUaiDb } from "../../common/model/collections.js";

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
runScript(async ({ cfas }) => {
  const { organismes } = await fetchOrganismes({
    champs: REFERENTIEL_FIELDS_TO_FETCH.join(","),
    itemsPerPage: 10000,
  });

  await referentielSiretUaiDb().deleteMany();

  await asyncForEach(organismes, async (organismeReferentiel) => {
    const reseaux = new Set();

    const organismesTdb = await cfas.getFromSiret(organismeReferentiel.siret);
    const reseauxFromTdb = organismesTdb.map((organisme) => organisme.reseaux).flat();
    reseauxFromTdb.forEach((reseau) => {
      reseaux.add(reseau);
    });

    await referentielSiretUaiDb().insertOne({
      ...organismeReferentiel,
      reseaux: [...reseaux],
    });
  });
}, "seed-organismes-from-referentiel");

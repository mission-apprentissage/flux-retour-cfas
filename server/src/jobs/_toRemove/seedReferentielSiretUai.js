import { getDirname } from "../../../common/utils/esmUtils.js";
import path from "path";
import { runScript } from "../../scriptWrapper.js";
import { fetchOrganismes } from "../../../common/apis/apiReferentielMna.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { readJsonFromCsvFile } from "../../../common/utils/fileUtils.js";
import { referentielSiretUaiDb } from "../../../common/model/collections.js";

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
 * @param  {string} reseauText
 * @returns {[string]} List of parsed réseaux
 */
const parseReseauxTextFromCsv = (reseauText) => {
  if (!reseauText || reseauText === "Hors réseau CFA EC") {
    return [];
  }
  const reseaux = reseauText.split("|").map((reseau) => reseau.toUpperCase());
  return reseaux;
};

const EXCELLENCE_PRO_FILE_PATH = path.join(getDirname(import.meta.url), `./referentiel-reseau-excellence-pro.csv`);

/**
 * Script qui crée une collection contenant le référentiel UAI/SIRET enrichi des réseaux existants dans le TDB et dans le fichier Excellence Pro
 */
runScript(async ({ cfas }) => {
  const excellenceProReferentielJson = readJsonFromCsvFile(EXCELLENCE_PRO_FILE_PATH, ",").map((line) => {
    return {
      siret: line["Siret"],
      uai: line["UAIvalidée"],
      reseaux: parseReseauxTextFromCsv(line["Réseauàjour"]),
    };
  });

  await referentielSiretUaiDb().deleteMany();

  const { organismes } = await fetchOrganismes({
    champs: REFERENTIEL_FIELDS_TO_FETCH.join(","),
    itemsPerPage: 10000,
  });

  await asyncForEach(organismes, async (organismeReferentiel) => {
    const reseaux = new Set();

    const organismesTdb = await cfas.getFromSiret(organismeReferentiel.siret);
    const reseauxFromTdb = organismesTdb.map((organisme) => organisme.reseaux).flat();
    reseauxFromTdb.forEach((reseau) => {
      reseaux.add(reseau);
    });

    if (organismesTdb.length === 0) {
      const organismeExcellencePro = excellenceProReferentielJson.find(
        ({ siret }) => organismeReferentiel.siret === siret
      );

      if (organismeExcellencePro?.reseaux) {
        organismeExcellencePro.reseaux.forEach((reseau) => reseaux.add(reseau));
      }
    }

    await referentielSiretUaiDb().insertOne({
      ...organismeReferentiel,
      reseaux: [...reseaux],
    });
  });
}, "seed-organismes-from-referentiel");

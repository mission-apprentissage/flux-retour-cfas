import { omit } from "lodash-es";
import { RESEAUX_CFAS } from "../../../../common/constants/networksConstants.js";
import { organismesDb } from "../../../../common/model/collections.js";
import {
  defaultValuesOrganisme,
  validateOrganisme,
} from "../../../../common/model/next.toKeep.models/organismes.model.js";
import { buildTokenizedString } from "../../../../common/utils/buildTokenizedString.js";
import { buildAdresseFromUai } from "../../../../common/utils/uaiUtils.js";

/**
 * Méthode de création d'un organisme pour la migration des cfas
 * Checks uai format & existence
 * @param {*} organismeProps
 * @returns
 */
export const createOrganismeFromCfa = async ({ uai, sirets = [], nom, ...data }) => {
  if (await organismesDb().countDocuments({ uai })) {
    throw new Error(`Un organisme avec l'uai ${uai} existe déjà`);
  }

  const { insertedId } = await organismesDb().insertOne(
    validateOrganisme({
      uai,
      ...(nom ? { nom: nom.trim(), nom_tokenized: buildTokenizedString(nom.trim(), 4) } : {}),
      ...defaultValuesOrganisme(),
      sirets,
      ...data,
    })
  );

  return await organismesDb().findOne({ _id: insertedId });
};

/**
 * Map des réseaux names en key
 */
const RESEAUX_NAMES_TO_KEY = Object.keys(RESEAUX_CFAS).reduce(
  (acc, key) => ({ ...acc, [RESEAUX_CFAS[key].nomReseau]: key }),
  {}
);

/**
 * Méthode (temp) de transformation des props d'un cfa en props d'un organisme
 * Récupération de l'adresse depuis l'uai
 * Suppression des champs inutiles
 */
export const mapCfaPropsToOrganismeProps = (cfaProps) => {
  const mappedReseaux = cfaProps.reseaux.map((oldReseau) => RESEAUX_NAMES_TO_KEY[oldReseau]);

  return {
    // remove field not needed
    ...omit(cfaProps, ["region_nom", "region_num", "adresse", "private_url"]),
    // add adresse from uai
    ...buildAdresseFromUai(cfaProps.uai),
    // handle métiers null
    metiers: cfaProps.metiers ?? [],
    // handle updated_at null : only specific cases
    updated_at: cfaProps.updated_at ?? new Date(),
    // handle réseaux
    reseaux: mappedReseaux,
  };
};

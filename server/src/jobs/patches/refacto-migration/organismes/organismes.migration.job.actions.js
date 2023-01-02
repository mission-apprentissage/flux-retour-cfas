import { omit } from "lodash-es";
import { buildAdresseForOrganisme } from "../../../../common/actions/organismes.actions.js";
import { RESEAUX_CFAS } from "../../../../common/constants/networksConstants.js";
import { organismesDb } from "../../../../common/model/collections.js";
import {
  defaultValuesOrganisme,
  validateOrganisme,
} from "../../../../common/model/next.toKeep.models/organismes.model.js";
import { buildTokenizedString } from "../../../../common/utils/buildTokenizedString.js";

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
      ...(sirets.length === 1 ? { siret: sirets[0] } : {}), // Set siret unique if sirets contains 1 element
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
export const mapCfaPropsToOrganismeProps = async (cfaProps) => {
  const mappedReseaux = cfaProps.reseaux.map((oldReseau) => RESEAUX_NAMES_TO_KEY[oldReseau]);

  const adresseForOrganisme = await buildAdresseForOrganisme({ uai: cfaProps.uai, sirets: cfaProps.sirets });

  return {
    // remove field not needed
    ...omit(cfaProps, ["region_nom", "region_num", "adresse", "private_url"]),
    // add adresse from api entreprise or from uai
    ...adresseForOrganisme,
    // ...buildAdresseFromUai(cfaProps.uai),
    // handle métiers null
    metiers: cfaProps.metiers ?? [],
    // handle updated_at null : only specific cases
    updated_at: cfaProps.updated_at ?? new Date(),
    // handle réseaux
    reseaux: mappedReseaux,
    // handle réseaux
    mode_de_transmission: "API",
    setup_step_courante: "COMPLETE",
  };
};

import logger from "../../../common/logger.js";
import { organismesDb } from "../../../common/model/collections.js";

/**
 * Fonction "patch" de correction d'une mauvaise transmission de l'organisme CCI CHER
 * Il faut garder l'organisme de siret "18180001200021" et UAI "0180865T"
 * Il faut transférer les effectifs du mauvais organisme mauvais siret : "53825807000019" et UAI : "0180865T"
 * Et enfin il faudra supprimer le mauvais organisme
 */
export const patchCleanCciCher = async () => {
  logger.info("Suppression des organismes sans siret et sans aucun effectif ... ");

  const organismesIdSansSiretSansEffectifs = (
    await organismesDb()
      .aggregate([
        // Organismes sans siret
        { $match: { $or: [{ siret: null }, { siret: "" }] } },
        // Lookup OrganismeId sur effectifs
        {
          $lookup: {
            from: "effectifs",
            localField: "_id",
            foreignField: "organisme_id",
            as: "MatchOrganismeIdEffectifs",
          },
        },
        // Filtre sur aucun match sur effectifs
        { $match: { MatchOrganismeIdEffectifs: { $size: 0 } } },
        //  Récupération id de l'organisme
        { $project: { _id: 1 } },
      ])
      .toArray()
  ).map(({ _id }) => _id);

  logger.info(`${organismesIdSansSiretSansEffectifs.length} organismes a supprimer ...`);
  const { deletedCount } = await organismesDb().deleteMany({ _id: { $in: organismesIdSansSiretSansEffectifs } });
  logger.info(`${deletedCount} organismes supprimés avec succès !`);
};

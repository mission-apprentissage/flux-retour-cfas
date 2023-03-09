import logger from "../../../common/logger";
import { organismesDb } from "../../../common/model/collections";

/**
 * Fonction "patch" de suppression des organismes sans siret et sans aucun effectif
 */
export const removeOrganismesSansSiretSansEffectifs = async () => {
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

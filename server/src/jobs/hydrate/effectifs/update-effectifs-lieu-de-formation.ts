import { captureException } from "@sentry/node";

import { addComputedFields } from "@/common/actions/effectifs.actions";
import logger from "@/common/logger";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { getEffectifCertification } from "@/jobs/fiabilisation/certification/fiabilisation-certification";

export async function hydrateEffectifsLieuDeFormation() {
  let nbEffectifsMisAJour = 0;
  let nbEffectifsNonMisAJour = 0;

  const lieuFormationCache = new Map();
  logger.info("Starting hydrateEffectifsLieuDeFormation...");
  try {
    const cursor = effectifsDb().find({ lieu_de_formation: { $exists: false } });

    while (await cursor.hasNext()) {
      const effectif = await cursor.next();

      if (effectif) {
        let lieuFormation;

        if (lieuFormationCache.has(effectif.organisme_id)) {
          lieuFormation = lieuFormationCache.get(effectif.organisme_id);
        } else {
          const organisme = await organismesDb().findOne({ _id: effectif.organisme_id });

          if (organisme) {
            lieuFormation = {
              uai: organisme.uai,
              siret: organisme.siret,
            };
            lieuFormationCache.set(effectif.organisme_id, lieuFormation);
          }
        }
        if (lieuFormation) {
          const updateResult = await effectifsDb().updateOne(
            { _id: effectif._id },
            { $set: { lieu_de_formation: lieuFormation } }
          );

          if (updateResult.modifiedCount > 0) {
            nbEffectifsMisAJour++;
          } else {
            nbEffectifsNonMisAJour++;
          }
        } else {
          nbEffectifsNonMisAJour++;
        }
      }
    }

    logger.info(
      `${nbEffectifsMisAJour} effectifs mis à jour avec lieu_de_formation, ${nbEffectifsNonMisAJour} effectifs non mis à jour.`
    );
  } catch (err) {
    logger.error(`Échec de la mise à jour des effectifs: ${err}`);
    captureException(err);
  }
}

export async function hydrateEffectifsLieuDeFormationVersOrganismeFormateur() {
  let nbEffectifsMisAJour = 0;
  let nbEffectifsNonMisAJour = 0;

  const organismeFormateurCache = new Map();

  try {
    const cursor = effectifsDb().find({ organisme_formateur_id: { $exists: true } });

    while (await cursor.hasNext()) {
      const effectif = await cursor.next();

      if (effectif) {
        let organismeFormateur;

        if (organismeFormateurCache.has(effectif.organisme_formateur_id)) {
          organismeFormateur = organismeFormateurCache.get(effectif.organisme_formateur_id);
        } else if (effectif.organisme_formateur_id) {
          organismeFormateur = await organismesDb().findOne({ _id: effectif.organisme_formateur_id });
        }

        if (organismeFormateur) {
          const certification = await getEffectifCertification({
            cfd: effectif.formation?.cfd || null,
            rncp: effectif.formation?.rncp || null,
            date_entree: effectif.formation?.date_entree || null,
            date_fin: effectif.formation?.date_fin || null,
          });

          const updatedEffectif = {
            organisme_id: organismeFormateur._id,
            organisme_formateur_id: organismeFormateur._id,
            _computed: await addComputedFields({
              organisme: organismeFormateur,
              effectif,
              certification,
            }),
          };

          const updateResult = await effectifsDb().updateOne({ _id: effectif._id }, { $set: updatedEffectif });

          if (updateResult.modifiedCount > 0) {
            nbEffectifsMisAJour++;
          } else {
            nbEffectifsNonMisAJour++;
          }
        } else {
          nbEffectifsNonMisAJour++;
        }
      }
    }

    logger.info(
      `${nbEffectifsMisAJour} effectifs mis à jour avec l'organisme formateur, ${nbEffectifsNonMisAJour} effectifs non mis à jour.`
    );
  } catch (err) {
    logger.error(`Échec de la mise à jour des effectifs: ${err}`);
    captureException(err);
  }
}

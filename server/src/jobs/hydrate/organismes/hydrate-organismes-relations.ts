import { WithId } from "mongodb";
import { ArrayElement } from "type-fest/source/internal";

import { NATURE_ORGANISME_DE_FORMATION } from "@/common/constants/organisme";
import parentLogger from "@/common/logger";
import { Organisme } from "@/common/model/@types";
import { FormationsCatalogue } from "@/common/model/@types/FormationsCatalogue";
import { formationsCatalogueDb, organismesDb, organismesReferentielDb } from "@/common/model/collections";

const logger = parentLogger.child({
  module: "job:hydrate:organismes-relations",
});

/**
 * Ce job peuple le champ organisme.relatedOrganismes avec les relations du référentiel stockées dans la collection organismeReferentiel.
 *
 */
export const hydrateOrganismesRelations = async () => {
  const organismesCursor = organismesDb().find({}, { projection: { _id: 1, uai: 1, siret: 1 } });

  while (await organismesCursor.hasNext()) {
    const organisme = (await organismesCursor.next()) as WithId<Organisme>;
    if (organisme.siret !== "30469122300156") {
      continue;
    }
    const relatedOrganismes = await organismesReferentielDb()
      .aggregate([
        {
          $match: {
            "relations.type": "responsable->formateur",
          },
        },
        {
          $project: {
            relations: {
              $filter: {
                input: "$relations",
                as: "relation",
                cond: {
                  $eq: ["$$relation.type", "responsable->formateur"],
                },
              },
            },
          },
        },
        {
          $unwind: "$relations",
        },
        {
          $replaceRoot: {
            newRoot: "$relations",
          },
        },
      ])
      .toArray();

    logger.info(
      { uai: organisme.uai, siret: organisme.siret, relatedOrganismes: relatedOrganismes.length },
      "updating organisme related organismes"
    );
    await organismesDb().updateOne(
      { _id: organisme._id },
      {
        $set: {
          relatedOrganismes,
          updated_at: new Date(),
        },
      }
    );
  }
};

// ancienne version qui utilise toutes les formations du catalogue stockées dans la collection formationsCatalogue pour en déduire les relations (fonctionnement actuel)
export const hydrateOrganismesRelationsFromCatalogue = async () => {
  const organismesCursor = organismesDb().find({}, { projection: { _id: 1, uai: 1, siret: 1 } });

  while (await organismesCursor.hasNext()) {
    const organisme = (await organismesCursor.next()) as WithId<Organisme>;
    if (organisme.siret !== "30469122300156") {
      continue;
    }
    const formationsWhereGestionnaire = (
      await getFormationsWhereGestionnaireByUAIAndSIRET(organisme.siret, organisme.uai ?? null)
    ).filter(
      // on supprimer les formations dont l'organisme est formateur également
      (formation) =>
        !(
          formation.etablissement_formateur_uai === organisme.uai &&
          formation.etablissement_formateur_siret === organisme.siret
        )
    );

    logger.info(
      { uai: organisme.uai, siret: organisme.siret, relatedOrganismes: formationsWhereGestionnaire.length },
      "updating organisme related formations"
    );
    await organismesDb().updateOne(
      { _id: organisme._id },
      {
        $set: {
          organismesFormateurs: await Promise.all(
            formationsWhereGestionnaire.map((formation) => formatOrganisme(formation))
          ),
          updated_at: new Date(),
        },
      }
    );
  }
};

/**
 * Retourne les formations en faisant la correspondance avec l'uai + siret d'un organisme
 * Par priorité :
 * - (siret et uai) gestionnaire
 * - (siret) gestionnaire
 * - (uai) gestionnaire
 */
async function getFormationsWhereGestionnaireByUAIAndSIRET(
  siret: string,
  uai: string | null
): Promise<WithId<FormationsCatalogue>[]> {
  {
    const formations = await formationsCatalogueDb()
      .find({
        etablissement_gestionnaire_uai: uai,
        etablissement_gestionnaire_siret: siret,
      })
      .toArray();
    if (formations.length > 0) {
      return formations;
    }
  }
  {
    const formations = await formationsCatalogueDb()
      .find({
        etablissement_gestionnaire_siret: siret,
      })
      .toArray();
    if (formations.length > 0) {
      return formations;
    }
  }
  {
    if (uai) {
      const formations = await formationsCatalogueDb()
        .find({
          etablissement_gestionnaire_uai: uai,
        })
        .toArray();
      if (formations.length > 0) {
        return formations;
      }
    }
  }

  return [];
}

type LienOrganismeFormateur = ArrayElement<Organisme["relatedOrganismes"]>;

async function formatOrganisme(formationCatalogue: WithId<FormationsCatalogue>): Promise<LienOrganismeFormateur> {
  const organisme = await organismesDb().findOne(
    {
      uai: formationCatalogue.etablissement_gestionnaire_uai as string,
      siret: formationCatalogue.etablissement_gestionnaire_siret,
    },
    { projection: { _id: 1 } }
  );

  if (!organisme) {
    logger.warn(
      {
        uai: formationCatalogue.etablissement_gestionnaire_uai,
        siret: formationCatalogue.etablissement_gestionnaire_siret,
        cfd: formationCatalogue.cfd,
      },
      "organisme non trouvé pour la formation"
    );
  }

  return {
    ...(organisme ? { organisme_id: organisme._id } : {}),
    nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR,
    uai: formationCatalogue.etablissement_gestionnaire_uai,
    siret: formationCatalogue.etablissement_gestionnaire_siret,
    ferme: organisme?.ferme,
  };
}

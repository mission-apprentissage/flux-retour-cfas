import { WithId } from "mongodb";
import { ArrayElement } from "type-fest/source/internal";

import { NATURE_ORGANISME_DE_FORMATION } from "@/common/constants/organisme";
import parentLogger from "@/common/logger";
import { Organisme } from "@/common/model/@types";
import { FormationsCatalogue } from "@/common/model/@types/FormationsCatalogue";
import { formationsCatalogueDb, organismesDb } from "@/common/model/collections";

const logger = parentLogger.child({
  module: "job:hydrate:organismes-formations",
});

/**
 * Ce job peuple le champ organisme.relatedFormations avec toutes les formations du catalogue stockées dans la collection formationsCatalogue.
 */
export const hydrateOrganismesFormations = async () => {
  logger.info("récupération des formations depuis le catalogue");

  const organismesCursor = organismesDb().find({}, { projection: { _id: 1, uai: 1, siret: 1 } });

  while (await organismesCursor.hasNext()) {
    const organisme = (await organismesCursor.next()) as WithId<Organisme>;
    if (!organisme.uai) {
      continue;
    }
    const formations = await formationsCatalogueDb()
      .find({
        $or: [{ etablissement_formateur_uai: organisme.uai }, { etablissement_gestionnaire_uai: organisme.uai }],
      })
      .toArray();

    logger.info(
      { uai: organisme.uai, siret: organisme.siret, formations: formations.length },
      "updating organisme related formations"
    );
    await organismesDb().updateOne(
      { _id: organisme._id },
      {
        $set: {
          relatedFormations2: await Promise.all(formations.map((formation) => formatFormation(formation))),
          updated_at: new Date(),
        },
      }
    );
  }
};

type OrganismeFormation = ArrayElement<Organisme["relatedFormations"]>;
type FormationOrganisme = ArrayElement<OrganismeFormation["organismes"]>;

async function formatFormation(formationCatalogue: WithId<FormationsCatalogue>): Promise<OrganismeFormation> {
  return {
    formation_id: formationCatalogue._id,
    cle_ministere_educatif: formationCatalogue.cle_ministere_educatif,
    intitule_long: formationCatalogue.intitule_long,
    cfd: formationCatalogue.cfd,
    rncp: formationCatalogue.rncp_code,
    annee_formation: parseInt(formationCatalogue.annee, 10) || -1, // parfois annee === "X"
    duree_formation_theorique: parseInt(formationCatalogue.duree, 10),
    organismes: await buildOrganismesListFromFormationCatalogue(formationCatalogue),
  };
}

/**
 * Méthode de construction de la liste des organismes avec leur nature, rattachés à une formation du catalogue
 */
async function buildOrganismesListFromFormationCatalogue(
  formationCatalogue: FormationsCatalogue
): Promise<FormationOrganisme[]> {
  const organismesLinkedToFormation: FormationOrganisme[] = [];

  // Récupération du responsable (gestionnaire)
  if (formationCatalogue.etablissement_gestionnaire_uai) {
    const organisme = await organismesDb().findOne(
      {
        uai: formationCatalogue.etablissement_gestionnaire_uai,
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

    organismesLinkedToFormation.push({
      ...(organisme ? { organisme_id: organisme._id } : {}),
      nature: isOrganismeResponsableFormateur(formationCatalogue, organismesLinkedToFormation)
        ? NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR
        : NATURE_ORGANISME_DE_FORMATION.RESPONSABLE,
      uai: formationCatalogue.etablissement_gestionnaire_uai,
      siret: formationCatalogue.etablissement_gestionnaire_siret,
    });
  }

  // Gestion du formateur si nécessaire
  if (formationCatalogue.etablissement_formateur_uai) {
    const organisme = await organismesDb().findOne(
      {
        uai: formationCatalogue.etablissement_formateur_uai,
        siret: formationCatalogue.etablissement_formateur_siret,
      },
      { projection: { _id: 1 } }
    );

    if (!organisme) {
      logger.warn(
        {
          uai: formationCatalogue.etablissement_formateur_uai,
          siret: formationCatalogue.etablissement_formateur_siret,
          cfd: formationCatalogue.cfd,
        },
        "organisme non trouvé pour la formation"
      );
    }

    organismesLinkedToFormation.push({
      ...(organisme ? { organisme_id: organisme._id } : {}),
      nature: isOrganismeResponsableFormateur(formationCatalogue, organismesLinkedToFormation)
        ? NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR
        : NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
      uai: formationCatalogue.etablissement_formateur_uai,
      siret: formationCatalogue.etablissement_formateur_siret,
    });
  }

  organismesLinkedToFormation.push({
    nature: NATURE_ORGANISME_DE_FORMATION.LIEU,
    // uai: formationCatalog.XXXX, // TODO non récupérée par RCO donc pas présent dans le catalogue (vu avec Quentin)
    ...(formationCatalogue.lieu_formation_siret ? { siret: formationCatalogue.lieu_formation_siret } : {}),
    // TODO On récupère l'adresse depuis le référentiel en appelant avec le SIRET ?
  });

  return organismesLinkedToFormation;
}

function isOrganismeResponsableFormateur(
  formationCatalogue: FormationsCatalogue,
  organismesLinkedToFormation: FormationOrganisme[]
): boolean {
  // Vérification si OF a la fois identifié gestionnaire (responsable) & formateur
  const isResponsableEtFormateur =
    formationCatalogue.etablissement_gestionnaire_uai === formationCatalogue.etablissement_formateur_uai;

  // Vérification s'il n'est pas déjà dans la liste
  const isNotAlreadyInOrganismesLinkedToFormation = !organismesLinkedToFormation.some(
    (organisme) => organisme.uai === formationCatalogue.etablissement_gestionnaire_uai
  );

  return isResponsableEtFormateur && isNotAlreadyInOrganismesLinkedToFormation;
}

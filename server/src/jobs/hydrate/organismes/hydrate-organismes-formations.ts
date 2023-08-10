import { PromisePool } from "@supercharge/promise-pool";
import { ObjectId, WithId } from "mongodb";
import { ArrayElement } from "type-fest/source/internal";

import { getNiveauFormationFromLibelle } from "@/common/actions/formations.actions";
import { NATURE_ORGANISME_DE_FORMATION } from "@/common/constants/organisme";
import parentLogger from "@/common/logger";
import { Organisme } from "@/common/model/@types";
import { FormationsCatalogue } from "@/common/model/@types/FormationsCatalogue";
import { formationsCatalogueDb, organismesDb } from "@/common/model/collections";
import { stripEmptyFields } from "@/common/utils/miscUtils";

const logger = parentLogger.child({
  module: "job:hydrate:organismes-formations",
});

type FormationsFindQueryType = "uai/siret" | "siret" | "uai" | "none";

/**
 * Ce job peuple les champs formationsFormateur, formationsResponsable, formationsResponsableFormateur d'un organisme
 * avec les formations du catalogue stockées dans la collection formationsCatalogue.
 */
export const hydrateOrganismesFormations = async () => {
  logger.info("récupération des formations depuis le catalogue");

  const organismes = await organismesDb()
    .find({}, { projection: { _id: 1, uai: 1, siret: 1 } })
    .toArray();

  const organismeIdBySIRETAndUAI = organismes.reduce<Map<string, ObjectId>>((acc, organisme) => {
    acc.set(getOrganismeKey(organisme.siret, organisme.uai), organisme._id);
    return acc;
  }, new Map());

  await PromisePool.for(organismes).process(async (organisme) => {
    const { formationsFormateur, formationsResponsable, formationsResponsableFormateur, query } =
      await getFormationsParRelationByUAIAndSIRET(organisme.siret, organisme.uai ?? null);

    logger.info(
      {
        organisme_id: organisme._id,
        uai: organisme.uai,
        siret: organisme.siret,
        query,
        formationsFormateur: formationsFormateur.length,
        formationsResponsable: formationsResponsable.length,
        formationsResponsableFormateur: formationsResponsableFormateur.length,
      },
      "updating organisme formations"
    );

    await organismesDb().updateOne(
      { _id: organisme._id },
      {
        $set: {
          formationsFormateur: formationsFormateur.map((formation) =>
            stripEmptyFields<ArrayElement<Organisme["formationsFormateur"]>>({
              ...formatBaseFormation(formation),
              organisme_responsable: {
                siret: formation.etablissement_gestionnaire_siret,
                uai: formation.etablissement_gestionnaire_uai,
                organisme_id: organismeIdBySIRETAndUAI.get(
                  getOrganismeKey(formation.etablissement_gestionnaire_siret, formation.etablissement_gestionnaire_uai)
                ),
              },
            })
          ),
          formationsResponsable: formationsResponsable.map((formation) =>
            stripEmptyFields<ArrayElement<Organisme["formationsResponsable"]>>({
              ...formatBaseFormation(formation),
              organisme_formateur: {
                siret: formation.etablissement_formateur_siret,
                uai: formation.etablissement_formateur_uai,
                organisme_id: organismeIdBySIRETAndUAI.get(
                  getOrganismeKey(formation.etablissement_formateur_siret, formation.etablissement_formateur_uai)
                ),
              },
            })
          ),
          formationsResponsableFormateur: formationsResponsableFormateur.map((formation) =>
            stripEmptyFields<ArrayElement<Organisme["formationsResponsableFormateur"]>>(formatBaseFormation(formation))
          ),
          updated_at: new Date(),
        },
      }
    );
  });
};

/**
 * Retourne les formations en faisant la correspondance avec l'uai + siret d'un organisme
 * Par priorité :
 * - (siret et uai) gestionnaire ou formateur
 * - (siret) gestionnaire ou formateur
 * - (uai) gestionnaire ou formateur
 */
async function getFormationsByUAIAndSIRET(
  siret: string,
  uai: string | null
): Promise<{ formations: WithId<FormationsCatalogue>[]; query: FormationsFindQueryType }> {
  {
    const formations = await formationsCatalogueDb()
      .find({
        $or: [
          {
            etablissement_formateur_uai: uai,
            etablissement_formateur_siret: siret,
          },
          {
            etablissement_gestionnaire_uai: uai,
            etablissement_gestionnaire_siret: siret,
          },
        ],
      })
      .toArray();
    if (formations.length > 0) {
      return { formations, query: "uai/siret" };
    }
  }
  {
    const formations = await formationsCatalogueDb()
      .find({
        $or: [
          {
            etablissement_formateur_siret: siret,
          },
          {
            etablissement_gestionnaire_siret: siret,
          },
        ],
      })
      .toArray();
    if (formations.length > 0) {
      return { formations, query: "siret" };
    }
  }
  {
    if (uai) {
      const formations = await formationsCatalogueDb()
        .find({
          $or: [
            {
              etablissement_formateur_uai: uai,
            },
            {
              etablissement_gestionnaire_uai: uai,
            },
          ],
        })
        .toArray();
      if (formations.length > 0) {
        return { formations, query: "uai" };
      }
    }
  }
  return { formations: [], query: "none" };
}

/**
 * Retourne les formations pour lesquelles l'organisme est responsable, formateur ou les deux.
 * Fait la correspondance avec l'uai + siret d'un organisme.
 * Par priorité :
 * - siret et uai
 * - siret
 * - uai
 */
async function getFormationsParRelationByUAIAndSIRET(
  siret: string,
  uai: string | null
): Promise<{
  formationsFormateur: WithId<FormationsCatalogue>[];
  formationsResponsable: WithId<FormationsCatalogue>[];
  formationsResponsableFormateur: WithId<FormationsCatalogue>[];
  query: FormationsFindQueryType;
}> {
  const { formations, query } = await getFormationsByUAIAndSIRET(siret, uai);

  // note : l'UAI est comparé avec == ou != pour faire correspondre null et undefined
  return {
    formationsFormateur: formations.filter(
      (formation) =>
        formation.etablissement_formateur_siret === siret &&
        // rome-ignore lint/suspicious/noDoubleEquals:
        formation.etablissement_formateur_uai == uai &&
        // rome-ignore lint/suspicious/noDoubleEquals:
        (formation.etablissement_gestionnaire_siret !== siret || formation.etablissement_gestionnaire_uai != uai)
    ),
    formationsResponsable: formations.filter(
      (formation) =>
        formation.etablissement_gestionnaire_siret === siret &&
        // rome-ignore lint/suspicious/noDoubleEquals:
        formation.etablissement_gestionnaire_uai == uai &&
        // rome-ignore lint/suspicious/noDoubleEquals:
        (formation.etablissement_formateur_siret !== siret || formation.etablissement_formateur_uai != uai)
    ),
    formationsResponsableFormateur: formations.filter(
      (formation) =>
        formation.etablissement_formateur_siret === siret &&
        // rome-ignore lint/suspicious/noDoubleEquals:
        formation.etablissement_formateur_uai == uai &&
        formation.etablissement_gestionnaire_siret === siret &&
        // rome-ignore lint/suspicious/noDoubleEquals:
        formation.etablissement_gestionnaire_uai == uai
    ),
    query,
  };
}

type OrganismeFormation = ArrayElement<Organisme["relatedFormations"]>;
type FormationOrganisme = ArrayElement<OrganismeFormation["organismes"]>;

function formatBaseFormation(
  formationCatalogue: WithId<FormationsCatalogue>
): ArrayElement<Organisme["formationsResponsableFormateur"]> {
  return {
    formation_id: formationCatalogue._id,
    cle_ministere_educatif: formationCatalogue.cle_ministere_educatif,
    cfd: formationCatalogue.cfd,
    rncp: formationCatalogue.rncp_code,
    annee_formation: parseInt(formationCatalogue.annee, 10) || -1, // parfois annee === "X"
    niveau: getNiveauFormationFromLibelle(formationCatalogue.niveau),
    duree_formation_theorique: parseInt(formationCatalogue.duree, 10),
  };
}

// async function formatFormation(formationCatalogue: WithId<FormationsCatalogue>): Promise<OrganismeFormation> {
//   return {
//     formation_id: formationCatalogue._id,
//     cfd: formationCatalogue.cfd,
//     cle_ministere_educatif: formationCatalogue.cle_ministere_educatif,
//     annee_formation: parseInt(formationCatalogue.annee, 10) || -1, // parfois annee === "X"
//     duree_formation_theorique: parseInt(formationCatalogue.duree, 10),
//     organismes: await buildOrganismesListFromFormationCatalogue(formationCatalogue),
//   };
// }

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

function getOrganismeKey(siret?: string, uai?: string | null): string {
  return `${siret ?? null}-${uai ?? null}`; // null permet d'harmoniser undefined et null
}

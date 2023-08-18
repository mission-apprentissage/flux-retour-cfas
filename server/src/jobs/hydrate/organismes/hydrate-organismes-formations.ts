import { PromisePool } from "@supercharge/promise-pool";
import { ObjectId, WithId } from "mongodb";
import { ArrayElement } from "type-fest/source/internal";

import { getNiveauFormationFromLibelle } from "@/common/actions/formations.actions";
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
  logger.info("hydrate organisme formations");
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
          formationsFormateur: formationsFormateur
            .map((formation) =>
              stripEmptyFields<ArrayElement<Organisme["formationsFormateur"]>>({
                ...formatBaseFormation(formation),
                organisme_responsable: {
                  siret: formation.etablissement_gestionnaire_siret,
                  uai: formation.etablissement_gestionnaire_uai,
                  organisme_id: organismeIdBySIRETAndUAI.get(
                    getOrganismeKey(
                      formation.etablissement_gestionnaire_siret,
                      formation.etablissement_gestionnaire_uai
                    )
                  ),
                },
              })
            )
            .sort((a, b) => (a.intitule_long < b.intitule_long ? -1 : 1)),
          formationsResponsable: formationsResponsable
            .map((formation) =>
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
            )
            .sort((a, b) => (a.intitule_long < b.intitule_long ? -1 : 1)),
          formationsResponsableFormateur: formationsResponsableFormateur
            .map((formation) =>
              stripEmptyFields<ArrayElement<Organisme["formationsResponsableFormateur"]>>(
                formatBaseFormation(formation)
              )
            )
            .sort((a, b) => (a.intitule_long < b.intitule_long ? -1 : 1)),
          updated_at: new Date(),
        },
      }
    );
  });
};

/**
 * Retourne les formations pour lesquelles l'organisme est responsable, formateur ou les deux.
 * Fait la correspondance avec l'uai + siret d'un organisme.
 * Recherche dans les formations du catalogue selon l'UAI/SIRET par priorité :
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
        query: "uai/siret",
      };
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
      return {
        formationsFormateur: formations.filter(
          (formation) =>
            formation.etablissement_formateur_siret === siret && formation.etablissement_gestionnaire_siret !== siret
        ),
        formationsResponsable: formations.filter(
          (formation) =>
            formation.etablissement_gestionnaire_siret === siret && formation.etablissement_formateur_siret !== siret
        ),
        formationsResponsableFormateur: formations.filter(
          (formation) =>
            formation.etablissement_formateur_siret === siret && formation.etablissement_gestionnaire_siret === siret
        ),
        query: "siret",
      };
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
        return {
          formationsFormateur: formations.filter(
            (formation) =>
              // rome-ignore lint/suspicious/noDoubleEquals:
              formation.etablissement_formateur_uai == uai && formation.etablissement_gestionnaire_uai != uai
          ),
          formationsResponsable: formations.filter(
            (formation) =>
              // rome-ignore lint/suspicious/noDoubleEquals:
              formation.etablissement_gestionnaire_uai == uai && formation.etablissement_formateur_uai != uai
          ),
          formationsResponsableFormateur: formations.filter(
            (formation) =>
              // rome-ignore lint/suspicious/noDoubleEquals:
              formation.etablissement_formateur_uai == uai && formation.etablissement_gestionnaire_uai == uai
          ),
          query: "uai",
        };
      }
    }
  }
  return {
    formationsFormateur: [],
    formationsResponsable: [],
    formationsResponsableFormateur: [],
    query: "none",
  };
}

function formatBaseFormation(
  formationCatalogue: WithId<FormationsCatalogue>
): ArrayElement<Organisme["formationsResponsableFormateur"]> {
  return {
    formation_id: formationCatalogue._id,
    cle_ministere_educatif: formationCatalogue.cle_ministere_educatif,
    cfd: formationCatalogue.cfd,
    ...(formationCatalogue.rncp_code ? { rncp: formationCatalogue.rncp_code } : {}),
    intitule_long: formationCatalogue.intitule_long,
    lieu_formation_adresse:
      formationCatalogue.lieu_formation_adresse_computed ?? formationCatalogue.lieu_formation_adresse ?? "",
    annee_formation: parseInt(formationCatalogue.annee, 10) || -1, // parfois annee === "X"
    niveau: getNiveauFormationFromLibelle(formationCatalogue.niveau),
    duree_formation_theorique: parseInt(formationCatalogue.duree, 10),
  };
}

function getOrganismeKey(siret?: string, uai?: string | null): string {
  return `${siret ?? null}-${uai ?? null}`; // null permet d'harmoniser undefined et null
}

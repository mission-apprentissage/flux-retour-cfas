import { PromisePool } from "@supercharge/promise-pool";
import { ArrayElement, ObjectId } from "mongodb";
import { OrganismesReferentiel } from "shared/models/data/@types";

import parentLogger from "@/common/logger";
import { organismesDb, organismesReferentielDb } from "@/common/model/collections";
import { stripEmptyFields } from "@/common/utils/miscUtils";

const logger = parentLogger.child({
  module: "job:hydrate:organismes-relations",
});

interface OrganismeInfos {
  _id?: ObjectId;
  enseigne?: string;
  raison_sociale?: string;
  commune?: string;
  region?: string;
  departement?: string;
  academie?: string;
  reseaux?: string[];
}

/**
 * Ce job peuple le champ organisme.organismesFormateurs et organismesResponsables avec les relations du référentiel
 * stockées dans la collection organismeReferentiel.
 * Ces relations sont complétées avec quelques données de l'organisme (collection organismes).
 * La région, département, académie et réseaux sont notamment enregistrés afin qu'un utilisateur puisse savoir sur l'UI
 * s'il a les droits d'accès aux organismes formateurs liés (indiquer que les effectifs agrégés sont partiels).
 */
export const hydrateOrganismesRelations = async () => {
  const organismes = await organismesDb()
    .find(
      {},
      {
        projection: {
          _id: 1,
          uai: 1,
          siret: 1,
          enseigne: 1,
          raison_sociale: 1,
          "adresse.commune": 1,
          "adresse.region": 1,
          "adresse.departement": 1,
          "adresse.academie": 1,
          reseaux: 1,
        },
      }
    )
    .toArray();

  const organismeInfosBySIRETAndUAI = organismes.reduce<{ [organismeId: string]: OrganismeInfos }>((acc, organisme) => {
    acc[getOrganismeKey(organisme)] = {
      _id: organisme._id,
      enseigne: organisme.enseigne,
      raison_sociale: organisme.raison_sociale,
      commune: organisme.adresse?.commune,
      region: organisme.adresse?.region,
      departement: organisme.adresse?.departement,
      academie: organisme.adresse?.academie,
      reseaux: organisme.reseaux,
    };
    return acc;
  }, {});

  await PromisePool.for(organismes)
    .handleError(async (err, { _id, siret, uai }) => {
      logger.error({ _id, siret, uai, err }, "erreur traitement organisme");
      // throwing errors will stop PromisePool
      throw err;
    })
    .process(async (organisme) => {
      const organismesLiés = await organismesReferentielDb()
        .aggregate<ArrayElement<OrganismesReferentiel["relations"]>>([
          {
            $match: {
              siret: organisme.siret,
              uai: organisme.uai,
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

      const organismesFormateurs = organismesLiés.filter((organisme) => organisme.type === "responsable->formateur");
      const organismesResponsables = organismesLiés.filter((organisme) => organisme.type === "formateur->responsable");

      function addOrganismesInfos({
        type,
        ...organisme
      }: ArrayElement<OrganismesReferentiel["relations"]>): ArrayElement<OrganismesReferentiel["relations"]> &
        OrganismeInfos {
        const { _id, enseigne, raison_sociale, commune, region, departement, academie, reseaux } =
          organismeInfosBySIRETAndUAI[getOrganismeKey(organisme)] ?? {};
        return stripEmptyFields({
          ...organisme,
          _id,
          enseigne,
          raison_sociale,
          commune,
          region,
          departement,
          academie,
          reseaux,
        });
      }

      logger.info(
        {
          uai: organisme.uai,
          siret: organisme.siret,
          organismesFormateurs: organismesFormateurs.length,
          organismesResponsables: organismesResponsables.length,
        },
        "updating organisme relations"
      );
      await organismesDb().updateOne(
        { _id: organisme._id },
        {
          $set: {
            organismesFormateurs: organismesFormateurs
              .map((organisme) => addOrganismesInfos(organisme))
              .filter((organisme) => organisme._id !== undefined),
            organismesResponsables: organismesResponsables
              .map((organisme) => addOrganismesInfos(organisme))
              .filter((organisme) => organisme._id !== undefined),
            updated_at: new Date(),
          },
        }
      );
    });
};

function getOrganismeKey(organisme: { siret?: string; uai?: string | null }): string {
  return `${organisme.siret ?? null}-${organisme.uai ?? null}`; // null permet d'harmoniser undefined et null
}

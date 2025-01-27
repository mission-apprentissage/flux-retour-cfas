import Boom from "boom";
import { ObjectId, type AnyBulkWriteOperation } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import { IOrganisme, type IFormationCatalogue, type IRelatedOrganisme } from "shared/models";

import { isOrganismeFiable } from "@/common/actions/organismes/organismes.actions";
import parentLogger from "@/common/logger";
import { formationsCatalogueDb, organismesDb } from "@/common/model/collections";
import { stripEmptyFields } from "@/common/utils/miscUtils";

const logger = parentLogger.child({
  module: "job:hydrate:organismes-relations",
});

interface OrganismeInfos {
  _id?: ObjectId;
  enseigne?: string | null;
  raison_sociale?: string;
  commune?: string;
  region?: string;
  departement?: string;
  academie?: string;
  reseaux?: string[];
  fiable: boolean;
  nature: IOrganisme["nature"];
  last_transmission_date: Date | null | undefined;
  ferme: boolean | undefined;
}

type IFormateurToResponsables = {
  _id: {
    etablissement_formateur_siret: IFormationCatalogue["etablissement_formateur_siret"];
    etablissement_formateur_uai: IFormationCatalogue["etablissement_formateur_uai"];
  };
  responsables: Array<{
    etablissement_gestionnaire_siret: IFormationCatalogue["etablissement_gestionnaire_siret"];
    etablissement_gestionnaire_uai: IFormationCatalogue["etablissement_gestionnaire_uai"];
  }>;
};

type IReponsableToFormateurs = {
  _id: {
    etablissement_gestionnaire_siret: IFormationCatalogue["etablissement_gestionnaire_siret"];
    etablissement_gestionnaire_uai: IFormationCatalogue["etablissement_gestionnaire_uai"];
  };
  formateurs: Array<{
    etablissement_formateur_siret: IFormationCatalogue["etablissement_formateur_siret"];
    etablissement_formateur_uai: IFormationCatalogue["etablissement_formateur_uai"];
  }>;
};

export const hydrateOrganismesRelations = async () => {
  logger.info("Hydratation des relations entre organismes");
  const [formateurToResponsables, responsableToFormateurs] = await Promise.all([
    formationsCatalogueDb()
      .aggregate<IFormateurToResponsables>([
        {
          $match: { published: true },
        },
        {
          $group: {
            _id: {
              etablissement_formateur_siret: "$etablissement_formateur_siret",
              etablissement_formateur_uai: "$etablissement_formateur_uai",
            },
            responsables: {
              $addToSet: {
                etablissement_gestionnaire_siret: "$etablissement_gestionnaire_siret",
                etablissement_gestionnaire_uai: "$etablissement_gestionnaire_uai",
              },
            },
          },
        },
      ])
      .toArray(),
    formationsCatalogueDb()
      .aggregate<IReponsableToFormateurs>([
        {
          $match: { published: true },
        },
        {
          $group: {
            _id: {
              etablissement_gestionnaire_siret: "$etablissement_gestionnaire_siret",
              etablissement_gestionnaire_uai: "$etablissement_gestionnaire_uai",
            },
            formateurs: {
              $addToSet: {
                etablissement_formateur_siret: "$etablissement_formateur_siret",
                etablissement_formateur_uai: "$etablissement_formateur_uai",
              },
            },
          },
        },
      ])
      .toArray(),
  ]);

  const formateurToResponsablesMap: Map<string, IFormateurToResponsables> = new Map(
    formateurToResponsables.map((item) => [
      getOrganismeKey({ siret: item._id.etablissement_formateur_siret, uai: item._id.etablissement_formateur_uai }),
      item,
    ])
  );

  const responsableToFormateursMap: Map<string, IReponsableToFormateurs> = new Map(
    responsableToFormateurs.map((item) => [
      getOrganismeKey({
        siret: item._id.etablissement_gestionnaire_siret,
        uai: item._id.etablissement_gestionnaire_uai,
      }),
      item,
    ])
  );

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
          nature: 1,
          last_transmission_date: 1,
          fiabilisation_statut: 1,
          ferme: 1,
        },
      }
    )
    .toArray();

  const organismeInfosBySIRETAndUAI = organismes.reduce<Record<string, OrganismeInfos>>((acc, organisme) => {
    acc[getOrganismeKey(organisme)] = stripEmptyFields({
      _id: organisme._id,
      enseigne: organisme.enseigne,
      raison_sociale: organisme.raison_sociale,
      commune: organisme.adresse?.commune,
      region: organisme.adresse?.region,
      departement: organisme.adresse?.departement,
      academie: organisme.adresse?.academie,
      reseaux: organisme.reseaux,
      fiable: isOrganismeFiable(organisme),
      nature: organisme.nature,
      last_transmission_date: organisme.last_transmission_date,
      ferme: organisme.ferme,
    });
    return acc;
  }, {});

  const bulk: AnyBulkWriteOperation<IOrganisme>[] = [];
  for (const organisme of organismes) {
    bulk.push(
      getOrganismeRelationBulkWriteOperation(
        organisme,
        organismeInfosBySIRETAndUAI,
        formateurToResponsablesMap,
        responsableToFormateursMap
      )
    );

    if (bulk.length >= 1000) {
      logger.info("Bulk write", { count: bulk.length });
      await organismesDb().bulkWrite(bulk);
      bulk.length = 0;
    }
  }

  if (bulk.length > 0) {
    await organismesDb().bulkWrite(bulk);
  }
};

function getOrganismeKey(organisme: { siret?: string; uai?: string | null }): string {
  return `${organisme.siret ?? null}-${organisme.uai ?? null}`; // null permet d'harmoniser undefined et null
}

function getOrganismeRelationBulkWriteOperation(
  organisme: Pick<IOrganisme, "_id" | "siret" | "uai">,
  organismeInfosBySIRETAndUAI: Record<string, OrganismeInfos>,
  formateurToResponsablesMap: Map<string, IFormateurToResponsables>,
  responsableToFormateursMap: Map<string, IReponsableToFormateurs>
): AnyBulkWriteOperation<IOrganisme> {
  const organismeKey = getOrganismeKey(organisme);
  const organismeInfos = organismeInfosBySIRETAndUAI[organismeKey];

  if (!organismeInfos) {
    throw Boom.internal(`Organisme ${organismeKey} not found in organismeInfosBySIRETAndUAI`);
  }

  const sesFormateurs = responsableToFormateursMap.get(organismeKey)?.formateurs ?? [];
  const sesResponsables = formateurToResponsablesMap.get(organismeKey)?.responsables ?? [];

  const nature = getNature({
    sesFormateursCount: sesFormateurs.length,
    sesResponsablesCount: sesResponsables.length,
  });

  const organismesFormateurs = buildOrganismeFormateurs(
    organisme,
    organismeInfosBySIRETAndUAI,
    formateurToResponsablesMap,
    responsableToFormateursMap
  );

  const organismesResponsables = buildOrganismeResponsables(
    organisme,
    organismeInfosBySIRETAndUAI,
    formateurToResponsablesMap
  );

  return {
    updateOne: {
      filter: { _id: organismeInfos._id },
      update: {
        $set: {
          organismesFormateurs,
          organismesResponsables,
          nature,
          updated_at: new Date(),
        },
      },
    },
  };
}

function getNature({
  sesFormateursCount,
  sesResponsablesCount,
}: {
  sesFormateursCount: number;
  sesResponsablesCount: number;
}): IOrganisme["nature"] {
  if (sesFormateursCount > 0 && sesResponsablesCount > 0) {
    return NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR;
  }

  if (sesResponsablesCount > 0) {
    return NATURE_ORGANISME_DE_FORMATION.FORMATEUR;
  }

  if (sesFormateursCount > 0) {
    return NATURE_ORGANISME_DE_FORMATION.RESPONSABLE;
  }

  return NATURE_ORGANISME_DE_FORMATION.INCONNUE;
}

// Fix temporaire https://www.notion.so/mission-apprentissage/Permission-CNAM-PACA-305ab62fb1bf46e4907180597f6a57ef
function isResponsablePartiel(
  formateur: IFormateurToResponsables["_id"],
  responsableSiret: string,
  formateurToResponsablesMap: Map<string, IFormateurToResponsables>
): boolean {
  if (areSameCompany(formateur.etablissement_formateur_siret, responsableSiret)) {
    // Si le formateur et le responsable sont de la même entreprise, alors le responsable peut accéder à toutes les formations du formateur
    return false;
  }

  const formateurKey = getOrganismeKey({
    siret: formateur.etablissement_formateur_siret,
    uai: formateur.etablissement_formateur_uai,
  });
  const allResponsables = formateurToResponsablesMap.get(formateurKey)?.responsables ?? [];

  const uniqueResponsablesSiren = new Set(
    allResponsables.map((r) => getSirenFromSiret(r.etablissement_gestionnaire_siret))
  );

  // Si tous les responsables du formateur sont de la même entreprise, alors le responsable peut accéder à toutes les formations du formateur
  return uniqueResponsablesSiren.size > 1;
}

function getSirenFromSiret(siret: string): string {
  return siret.slice(0, 9);
}

function areSameCompany(siret1: string, siret2: string): boolean {
  return getSirenFromSiret(siret1) === getSirenFromSiret(siret2);
}

function buildOrganismeFormateurs(
  organisme: Pick<IOrganisme, "_id" | "siret" | "uai">,
  organismeInfosBySIRETAndUAI: Record<string, OrganismeInfos>,
  formateurToResponsablesMap: Map<string, IFormateurToResponsables>,
  responsableToFormateursMap: Map<string, IReponsableToFormateurs>
): IOrganisme["organismesFormateurs"] {
  const organismeKey = getOrganismeKey(organisme);
  const formateurs = responsableToFormateursMap.get(organismeKey)?.formateurs ?? [];

  return formateurs
    .map((formateur) => {
      const result: IRelatedOrganisme = {
        siret: formateur.etablissement_formateur_siret,
        uai: formateur.etablissement_formateur_uai,
        responsabilitePartielle: isResponsablePartiel(formateur, organisme.siret, formateurToResponsablesMap),
      };

      const formateurKey = getOrganismeKey(result);
      const formateurInfo = organismeInfosBySIRETAndUAI[formateurKey] ?? null;

      if (formateurInfo) {
        Object.assign(result, formateurInfo);
      }

      return stripEmptyFields(result);
    })
    .filter((f) => f._id != null && f._id !== organisme._id)
    .toSorted((a, b) => a.siret.localeCompare(b.siret));
}

function buildOrganismeResponsables(
  organisme: Pick<IOrganisme, "_id" | "siret" | "uai">,
  organismeInfosBySIRETAndUAI: Record<string, OrganismeInfos>,
  formateurToResponsablesMap: Map<string, IFormateurToResponsables>
): IOrganisme["organismesResponsables"] {
  const organismeKey = getOrganismeKey(organisme);
  const responsables = formateurToResponsablesMap.get(organismeKey)?.responsables ?? [];

  return responsables
    .map((responsable) => {
      const result: IRelatedOrganisme = {
        siret: responsable.etablissement_gestionnaire_siret,
        uai: responsable.etablissement_gestionnaire_uai,
        responsabilitePartielle: isResponsablePartiel(
          {
            etablissement_formateur_siret: organisme.siret,
            etablissement_formateur_uai: organisme.uai ?? null,
          },
          responsable.etablissement_gestionnaire_siret,
          formateurToResponsablesMap
        ),
      };

      const responsableKey = getOrganismeKey(result);
      const responsableInfo = organismeInfosBySIRETAndUAI[responsableKey] ?? null;

      if (responsableInfo) {
        Object.assign(result, responsableInfo);
      }

      return stripEmptyFields(result);
    })
    .filter((r) => r._id != null && r._id !== organisme._id)
    .toSorted((a, b) => a.siret.localeCompare(b.siret));
}

import { ObjectId } from "bson";

import { Effectif, Organisme } from "@/common/model/@types";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { Organisation, OrganisationByType } from "@/common/model/organisations.model";

import { getOrganismeByUAIAndSIRET } from "../organismes/organismes.actions";

import { findOrganismesAccessiblesByOrganisationOF } from "./permissions";

// Permissions Profils d'organisation vs Fonctionnalités de l'organisation (= 1er niveau d'onglet)
type PermissionOrganisation =
  | "IndicateursEffectifsParDepartement" // /api/v1/indicateurs/effectifs/par-departement
  | "IndicateursOrganismesParDepartement" // /api/v1/indicateurs/organismes/par-departement
  | "ListeOrganismes" // /api/v1/organisation/organismes
  | "IndicateursEffectifsParOrganisme" // /api/v1/indicateurs/effectifs/par-organisme
  | "TéléchargementListesNominatives"; // /api/v1/indicateurs/effectifs/{type}

// Schema permet de filtrer sur une collection
type APIConfig<Schema extends object, Filter = ToObjectFilter<Schema & { _id: ObjectId }>> = {
  [Type in keyof OrganisationByType]: Filter | ((organisation: OrganisationByType[Type]) => Filter | Promise<Filter>);
};

/**
 * Permet d'obtenir la liste des clés séparées par des points.
 * ex: "nom" | "adresse.commune"
 *
 * Note : ne gère pas encore les tableaux !
 */
type FlattenObjectKeys<Obj extends Record<string, unknown>, Key = keyof Obj> = Key extends string
  ? NonNullable<Obj[Key]> extends Record<string, unknown>
    ? `${Key}.${FlattenObjectKeys<NonNullable<Obj[Key]>>}`
    : `${Key}`
  : never;

/**
 * Permet d'obtenir un filtrage mongo en fonction d'un type
 */
export type ToObjectFilter<Obj> = {
  [key in FlattenObjectKeys<{ [K in keyof Obj]: Obj[K] }>]?: any;
} & {}; // eslint-disable-line @typescript-eslint/ban-types -- permet d'obtenir une copie des propriétés pour le debug

type PermissionConfig = {
  ui: Record<Organisation["type"], boolean | string[]>;
  api: APIConfig<any>;
};

const permissionsOrganisation: Record<PermissionOrganisation, PermissionConfig> = {
  IndicateursEffectifsParDepartement: {
    ui: {
      ORGANISME_FORMATION: true,
      TETE_DE_RESEAU: true,
      DREETS: true,
      DRAAF: true,
      CONSEIL_REGIONAL: true,
      CARIF_OREF_REGIONAL: true,
      DDETS: true,
      ACADEMIE: true,
      OPERATEUR_PUBLIC_NATIONAL: true,
      CARIF_OREF_NATIONAL: true,
      ADMINISTRATEUR: true,
    },
    api: {
      ORGANISME_FORMATION: async (organisation) => ({
        organisme_id: {
          $in: await findOrganismesAccessiblesByOrganisationOF(organisation),
        },
      }),
      TETE_DE_RESEAU: (organisation) => ({
        "_computed.organisme.reseaux": organisation.reseau,
      }),
      DREETS: {},
      DRAAF: {},
      CONSEIL_REGIONAL: {},
      CARIF_OREF_REGIONAL: {},
      DDETS: {},
      ACADEMIE: {},
      OPERATEUR_PUBLIC_NATIONAL: {},
      CARIF_OREF_NATIONAL: {},
      ADMINISTRATEUR: {},
    } satisfies APIConfig<Effectif>,
  },
  IndicateursOrganismesParDepartement: {
    ui: {
      ORGANISME_FORMATION: true,
      TETE_DE_RESEAU: true,
      DREETS: true,
      DRAAF: true,
      CONSEIL_REGIONAL: true,
      CARIF_OREF_REGIONAL: true,
      DDETS: true,
      ACADEMIE: true,
      OPERATEUR_PUBLIC_NATIONAL: true,
      CARIF_OREF_NATIONAL: true,
      ADMINISTRATEUR: true,
    },
    api: {
      ORGANISME_FORMATION: async (organisation) => ({
        _id: {
          $in: await findOrganismesAccessiblesByOrganisationOF(organisation),
        },
      }),
      TETE_DE_RESEAU: (organisation) => ({
        reseaux: organisation.reseau,
      }),
      DREETS: {},
      DRAAF: {},
      CONSEIL_REGIONAL: {},
      CARIF_OREF_REGIONAL: {},
      DDETS: {},
      ACADEMIE: {},
      OPERATEUR_PUBLIC_NATIONAL: {},
      CARIF_OREF_NATIONAL: {},
      ADMINISTRATEUR: {},
    } satisfies APIConfig<Organisme>,
  },
  ListeOrganismes: {
    ui: {
      ORGANISME_FORMATION: true, // dépend si des OF formateurs
      TETE_DE_RESEAU: true,
      DREETS: true,
      DRAAF: true,
      CONSEIL_REGIONAL: true,
      CARIF_OREF_REGIONAL: true,
      DDETS: true,
      ACADEMIE: true,
      OPERATEUR_PUBLIC_NATIONAL: true,
      CARIF_OREF_NATIONAL: true,
      ADMINISTRATEUR: true,
    },
    api: {
      ORGANISME_FORMATION: async (organisation) => {
        return {
          _id: {
            $in: await findOrganismesAccessiblesByOrganisationOF(organisation),
          },
        };
      },
      TETE_DE_RESEAU: (organisation) => ({
        reseaux: organisation.reseau,
      }),
      DREETS: (organisation) => ({
        "adresse.region": organisation.code_region,
      }),
      DRAAF: (organisation) => ({
        "adresse.region": organisation.code_region,
      }),
      CONSEIL_REGIONAL: (organisation) => ({
        "adresse.region": organisation.code_region,
      }),
      CARIF_OREF_REGIONAL: (organisation) => ({
        "adresse.region": organisation.code_region,
      }),
      DDETS: (organisation) => ({
        "adresse.departement": organisation.code_departement,
      }),
      ACADEMIE: (organisation) => ({
        "adresse.academie": organisation.code_academie,
      }),
      OPERATEUR_PUBLIC_NATIONAL: {},
      CARIF_OREF_NATIONAL: {},
      ADMINISTRATEUR: {},
    } satisfies APIConfig<Organisme>,
  },
  IndicateursEffectifsParOrganisme: {
    ui: {
      ORGANISME_FORMATION: true,
      TETE_DE_RESEAU: true,
      DREETS: true,
      DRAAF: true,
      CONSEIL_REGIONAL: true,
      CARIF_OREF_REGIONAL: true,
      DDETS: true,
      ACADEMIE: true,
      OPERATEUR_PUBLIC_NATIONAL: true,
      CARIF_OREF_NATIONAL: true,
      ADMINISTRATEUR: true,
    },
    api: {
      ORGANISME_FORMATION: async (organisation) => ({
        organisme_id: {
          $in: await findOrganismesAccessiblesByOrganisationOF(organisation),
        },
      }),
      TETE_DE_RESEAU: (organisation) => ({
        "_computed.organisme.reseaux": organisation.reseau,
      }),
      DREETS: (organisation) => ({
        "_computed.organisme.region": organisation.code_region,
      }),
      DRAAF: (organisation) => ({
        "_computed.organisme.region": organisation.code_region,
      }),
      CONSEIL_REGIONAL: (organisation) => ({
        "_computed.organisme.region": organisation.code_region,
      }),
      CARIF_OREF_REGIONAL: (organisation) => ({
        "_computed.organisme.region": organisation.code_region,
      }),
      DDETS: (organisation) => ({
        "_computed.organisme.departement": organisation.code_departement,
      }),
      ACADEMIE: (organisation) => ({
        "_computed.organisme.academie": organisation.code_academie,
      }),
      OPERATEUR_PUBLIC_NATIONAL: {},
      CARIF_OREF_NATIONAL: {},
      ADMINISTRATEUR: {},
    } satisfies APIConfig<Effectif>,
  },
  TéléchargementListesNominatives: {
    ui: {
      ORGANISME_FORMATION: true, // TODO seulement si aucun formateur
      TETE_DE_RESEAU: false,
      DREETS: ["inscritSansContrat", "rupturant", "abandon"],
      DRAAF: ["inscritSansContrat", "rupturant", "abandon"],
      CONSEIL_REGIONAL: false,
      CARIF_OREF_REGIONAL: false,
      DDETS: ["inscritSansContrat", "rupturant", "abandon"],
      ACADEMIE: false,
      OPERATEUR_PUBLIC_NATIONAL: false,
      CARIF_OREF_NATIONAL: false,
      ADMINISTRATEUR: true,
    },
    api: {
      ORGANISME_FORMATION: async (organisation) => {
        // TODO en principe, on a décidé de masquer le bouton téléchargement des effectifs nominatifs quand un organisme possède plusieurs formateurs
        // tout ça afin d'éviter que les effectifs d'un formateur avec plusieurs responsables ne remontent chez chacun des responsables
        // Cependant, les permissions n'ont pas été en accord, car un responsable peut toujours accéder aux listes nominatives via le 2e onglet.
        const organisme = await getOrganismeByUAIAndSIRET(organisation.uai, organisation.siret);
        const hasNoFormateurs = !organisme.organismesFormateurs || organisme.organismesFormateurs.length === 0;
        return hasNoFormateurs
          ? {
              organisme_id: organisme._id,
            }
          : {
              _id: new ObjectId("000000000000"),
            };
      },
      TETE_DE_RESEAU: () => ({
        _id: new ObjectId("000000000000"),
      }),
      DREETS: (organisation) => ({
        "_computed.organisme.region": organisation.code_region,
      }),
      DRAAF: (organisation) => ({
        "_computed.organisme.region": organisation.code_region,
      }),
      CONSEIL_REGIONAL: () => ({
        _id: new ObjectId("000000000000"),
      }),
      CARIF_OREF_REGIONAL: () => ({
        _id: new ObjectId("000000000000"),
      }),
      DDETS: (organisation) => ({
        "_computed.organisme.departement": organisation.code_departement,
      }),
      ACADEMIE: () => ({
        _id: new ObjectId("000000000000"),
      }),
      OPERATEUR_PUBLIC_NATIONAL: () => ({
        _id: new ObjectId("000000000000"),
      }),
      CARIF_OREF_NATIONAL: () => ({
        _id: new ObjectId("000000000000"),
      }),
      ADMINISTRATEUR: {},
    } satisfies APIConfig<Effectif>,
  },
};

export async function getPermissionOrganisation(ctx: AuthContext, permission: PermissionOrganisation) {
  const permissionConfig = permissionsOrganisation[permission].api[ctx.organisation.type];
  return typeof permissionConfig === "function" ? permissionConfig(ctx.organisation as any) : permissionConfig;
}

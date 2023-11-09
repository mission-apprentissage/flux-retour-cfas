import { ObjectId } from "bson";
import { PermissionOrganisation } from "shared/constants/permissions";

import { Effectif, Organisme } from "@/common/model/@types";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { Organisation, OrganisationByType } from "@/common/model/organisations.model";

import { getOrganismeByUAIAndSIRET } from "../organismes/organismes.actions";

import { findOrganismesAccessiblesByOrganisationOF } from "./permissions";

// Schema permet de filtrer sur une collection
type APIConfig<Schema extends object, Filter = ToObjectFilter<Schema & { _id: ObjectId }>, Result = false | Filter> = {
  [Type in keyof OrganisationByType]: Result | ((organisation: OrganisationByType[Type]) => Result | Promise<Result>);
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
export type ToObjectFilter<Obj extends Record<string, unknown>> = {
  [key in FlattenObjectKeys<Obj>]?: any;
} & {}; // eslint-disable-line @typescript-eslint/ban-types -- permet d'obtenir une copie des propriétés pour le debug

type PermissionConfig = {
  config?: Record<Organisation["type"], boolean | string[]>;
  api: APIConfig<any>;
};

// Référence : https://www.notion.so/mission-apprentissage/Permissions-afd9dc14606042e8b76b23aa57f516a8?pvs=4#bf039f348f1a4d8e84b065eafc1b6db1
const permissionsOrganisation: Record<PermissionOrganisation, PermissionConfig> = {
  IndicateursEffectifsParDepartement: {
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
    config: {
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
        const organisme = await getOrganismeByUAIAndSIRET(organisation.uai, organisation.siret);
        const hasNoFormateurs = !organisme.organismesFormateurs || organisme.organismesFormateurs.length === 0;
        return hasNoFormateurs
          ? {
              organisme_id: organisme._id,
            }
          : false;
      },
      TETE_DE_RESEAU: false,
      DREETS: (organisation) => ({
        "_computed.organisme.region": organisation.code_region,
      }),
      DRAAF: (organisation) => ({
        "_computed.organisme.region": organisation.code_region,
      }),
      CONSEIL_REGIONAL: false,
      CARIF_OREF_REGIONAL: false,
      DDETS: (organisation) => ({
        "_computed.organisme.departement": organisation.code_departement,
      }),
      ACADEMIE: false,
      OPERATEUR_PUBLIC_NATIONAL: false,
      CARIF_OREF_NATIONAL: false,
      ADMINISTRATEUR: {},
    } satisfies APIConfig<Effectif>,
  },
};

export async function getPermissionOrganisation(ctx: AuthContext, permission: PermissionOrganisation) {
  const permissionConfig = permissionsOrganisation[permission].api[ctx.organisation.type];
  return typeof permissionConfig === "function" ? permissionConfig(ctx.organisation as any) : permissionConfig;
}

export async function getPermissionOrganisationConfig(ctx: AuthContext, permission: PermissionOrganisation) {
  return permissionsOrganisation[permission].config?.[ctx.organisation.type];
}

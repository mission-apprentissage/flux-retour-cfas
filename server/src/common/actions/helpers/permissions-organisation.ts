import { PermissionOrganisation } from "shared/constants/permissions";

import { AuthContext } from "@/common/model/internal/AuthContext";
import { Organisation, OrganisationByType } from "@/common/model/organisations.model";

import { getOrganismeByUAIAndSIRET } from "../organismes/organismes.actions";

import { findOrganismesAccessiblesByOrganisationOF } from "./permissions";

type QueryFilter<Result = false | object> = {
  [Type in keyof OrganisationByType]: Result | ((organisation: OrganisationByType[Type]) => Result | Promise<Result>);
};

type PermissionConfig = {
  context?: Record<Organisation["type"], boolean | string[]>;
  queryFilter: QueryFilter;
};

// Référence : https://www.notion.so/mission-apprentissage/Permissions-afd9dc14606042e8b76b23aa57f516a8?pvs=4#bf039f348f1a4d8e84b065eafc1b6db1
const permissionsOrganisation: Record<PermissionOrganisation, PermissionConfig> = {
  IndicateursEffectifsParDepartement: {
    queryFilter: {
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
    },
  },
  IndicateursOrganismesParDepartement: {
    queryFilter: {
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
    },
  },
  ListeOrganismes: {
    queryFilter: {
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
    },
  },
  IndicateursEffectifsParOrganisme: {
    queryFilter: {
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
    },
  },
  TéléchargementListesNominatives: {
    context: {
      ORGANISME_FORMATION: true, // TODO seulement si aucun formateur
      TETE_DE_RESEAU: false,
      DREETS: ["inscritSansContrat", "rupturant", "abandon"],
      DRAAF: ["inscritSansContrat", "rupturant", "abandon"],
      CONSEIL_REGIONAL: false,
      CARIF_OREF_REGIONAL: false,
      DDETS: ["inscritSansContrat", "rupturant", "abandon"],
      ACADEMIE: ["inscritSansContrat", "rupturant", "abandon"],
      OPERATEUR_PUBLIC_NATIONAL: false,
      CARIF_OREF_NATIONAL: false,
      ADMINISTRATEUR: true,
    },
    queryFilter: {
      ORGANISME_FORMATION: async (organisation) => {
        const organisme = await getOrganismeByUAIAndSIRET(organisation.uai, organisation.siret);
        const hasNoFormateurs = !organisme.organismesFormateurs || organisme.organismesFormateurs.length === 0;
        return hasNoFormateurs
          ? {
              organisme_id: organisme._id,
            }
          : false;
      },
      TETE_DE_RESEAU: async (organisation) => {
        if (organisation.reseau !== "COMP_DU_DEVOIR") {
          return false;
        }

        return {
          "_computed.organisme.reseaux": organisation.reseau,
        };
      },
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
      ACADEMIE: (organisation) => ({
        "_computed.organisme.academie": organisation.code_academie,
      }),
      OPERATEUR_PUBLIC_NATIONAL: false,
      CARIF_OREF_NATIONAL: false,
      ADMINISTRATEUR: {},
    },
  },
};

export async function getPermissionOrganisationQueryFilter(ctx: AuthContext, permission: PermissionOrganisation) {
  const permissionConfig = permissionsOrganisation[permission].queryFilter[ctx.organisation.type];
  return typeof permissionConfig === "function" ? permissionConfig(ctx.organisation as any) : permissionConfig;
}

export async function getPermissionOrganisationContext(ctx: AuthContext, permission: PermissionOrganisation) {
  return permissionsOrganisation[permission].context?.[ctx.organisation.type];
}

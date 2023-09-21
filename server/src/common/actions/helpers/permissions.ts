import Boom from "boom";
import { ObjectId } from "mongodb";

import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { Organisme } from "@/common/model/@types/Organisme";
import { organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { OrganisationOrganismeFormation } from "@/common/model/organisations.model";

export async function requireOrganismeIndicateursAccess(ctx: AuthContext, organismeId: ObjectId): Promise<void> {
  if (!(await canAccessOrganismeIndicateurs(ctx, organismeId))) {
    throw Boom.forbidden("Permissions invalides");
  }
}

export function requireOrganisationOF(ctx: AuthContext): OrganisationOrganismeFormation {
  if (ctx.organisation.type !== "ORGANISME_FORMATION") {
    throw Boom.forbidden("Permissions invalides");
  }
  return (ctx as AuthContext<OrganisationOrganismeFormation>).organisation;
}

export async function getOrganismeRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        _id: {
          $in: linkedOrganismesIds,
        },
      };
    }
    case "TETE_DE_RESEAU":
      return {
        reseaux: organisation.reseau,
      };

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
      return {
        "adresse.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "adresse.departement": organisation.code_departement,
      };
    case "ACADEMIE":
      return {
        "adresse.academie": organisation.code_academie,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

export async function getIndicateursOrganismesRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        _id: {
          $in: linkedOrganismesIds,
        },
      };
    }
    case "TETE_DE_RESEAU":
      return {
        reseaux: organisation.reseau,
      };

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

/**
 * Restriction pour accéder aux indicateurs agrégés
 */
export async function getIndicateursEffectifsRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        organisme_id: {
          $in: linkedOrganismesIds,
        },
      };
    }

    case "TETE_DE_RESEAU":
      return {
        "_computed.organisme.reseaux": organisation.reseau,
      };

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

/**
 * Restriction pour accéder aux effectifs anonymes => FIXME devrait être supprimé ou changé pour indicateursEffectifs
 */
export async function getEffectifsAnonymesRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        organisme_id: {
          $in: linkedOrganismesIds,
        },
      };
    }

    case "TETE_DE_RESEAU":
      return {
        "_computed.organisme.reseaux": organisation.reseau,
      };

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
      return {
        "_computed.organisme.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "_computed.organisme.departement": organisation.code_departement,
      };
    case "ACADEMIE":
      return {
        "_computed.organisme.academie": organisation.code_academie,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

export async function getOrganismeIndicateursEffectifsRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        organisme_id: {
          $in: linkedOrganismesIds,
        },
      };
    }

    case "TETE_DE_RESEAU":
      return {
        "_computed.organisme.reseaux": organisation.reseau,
      };

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
      return {
        "_computed.organisme.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "_computed.organisme.departement": organisation.code_departement,
      };
    case "ACADEMIE":
      return {
        "_computed.organisme.academie": organisation.code_academie,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

/**
 * Restriction pour accéder aux effectifs nominatifs
 */
export async function getEffectifsNominatifsRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        organisme_id: {
          $in: linkedOrganismesIds,
        },
      };
    }

    case "TETE_DE_RESEAU":
      return {
        _id: new ObjectId("000000000000"),
      };

    case "DREETS":
    case "DRAAF":
      return {
        "_computed.organisme.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "_computed.organisme.departement": organisation.code_departement,
      };

    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
      return {
        _id: new ObjectId("000000000000"), // permet de tout rejeter
      };
    case "ADMINISTRATEUR":
      return {};
  }
}

/**
 * Liste tous les organismes accessibles pour une organisation (dont l'organisme lié à l'organisation)
 */
export async function findOrganismesAccessiblesByOrganisationOF(
  ctx: AuthContext<OrganisationOrganismeFormation>
): Promise<ObjectId[]> {
  const organisation = ctx.organisation;
  const userOrganisme = await organismesDb().findOne({
    siret: organisation.siret,
    uai: organisation.uai as string,
  });
  if (!userOrganisme) {
    logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
    throw new Error("organisme de l'organisation non trouvé");
  }

  return [userOrganisme._id, ...findOrganismeFormateursIds(userOrganisme)];
}

export async function findOrganismesFormateursIdsOfOrganisme(organismeId: ObjectId): Promise<ObjectId[]> {
  const organisme = await getOrganismeById(organismeId);
  return findOrganismeFormateursIds(organisme);
}

export function findOrganismeFormateursIds(organisme: Organisme): ObjectId[] {
  return (organisme.organismesFormateurs ?? [])
    .filter((organisme) => !!organisme._id)
    .map((organisme) => organisme._id as ObjectId);
}

export async function canAccessOrganismeIndicateurs(ctx: AuthContext, organismeId: ObjectId): Promise<boolean> {
  const organisme = await getOrganismeById(organismeId);
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return linkedOrganismesIds.some((linkedOrganismesId) => linkedOrganismesId.equals(organismeId));
    }

    case "TETE_DE_RESEAU":
      return (organisme.reseaux as string[])?.includes(organisation.reseau);

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
      return organisme.adresse?.region === organisation.code_region;
    case "DDETS":
      return organisme.adresse?.departement === organisation.code_departement;
    case "ACADEMIE":
      return organisme.adresse?.academie === organisation.code_academie;

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return true;
  }
}

export async function requireListOrganismesFormateursAccess(ctx: AuthContext, organismeId: ObjectId): Promise<void> {
  if (!(await canAccessOrganismesFormateurs(ctx, organismeId))) {
    throw Boom.forbidden("Permissions invalides");
  }
}

async function canAccessOrganismesFormateurs(ctx: AuthContext, organismeId: ObjectId): Promise<boolean> {
  const organisme = await getOrganismeById(organismeId);
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      return organisme._id.equals(organismeId);
    }

    case "TETE_DE_RESEAU":
      return (organisme.reseaux as string[])?.includes(organisation.reseau);

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
      return organisme.adresse?.region === organisation.code_region;
    case "DDETS":
      return organisme.adresse?.departement === organisation.code_departement;
    case "ACADEMIE":
      return organisme.adresse?.academie === organisation.code_academie;

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return true;
  }
}

export async function canManageOrganismeEffectifs(ctx: AuthContext, organismeId: ObjectId): Promise<boolean> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return linkedOrganismesIds.some((linkedOrganismesId) => linkedOrganismesId.equals(organismeId));
    }

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return true;

    default:
      return false;
  }
}

export async function requireManageOrganismeEffectifsPermission(
  ctx: AuthContext,
  organismeId: ObjectId
): Promise<void> {
  if (!(await canManageOrganismeEffectifs(ctx, organismeId))) {
    throw Boom.forbidden("Permissions invalides");
  }
}

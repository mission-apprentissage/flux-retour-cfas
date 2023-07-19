import Boom from "boom";
import { ObjectId } from "mongodb";

import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import { NATURE_ORGANISME_DE_FORMATION } from "@/common/constants/organisme";
import logger from "@/common/logger";
import { Organisme } from "@/common/model/@types/Organisme";
import { organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { OrganisationOrganismeFormation, OrganisationType } from "@/common/model/organisations.model";

export async function requireOrganismeIndicateursAccess(ctx: AuthContext, organismeId: ObjectId): Promise<void> {
  if (!(await canAccessOrganismeIndicateurs(ctx, organismeId))) {
    throw Boom.forbidden("Permissions invalides");
  }
}

export function requireOrganisationOF(ctx: AuthContext): OrganisationOrganismeFormation {
  if (!isOrganisationOF(ctx.organisation.type)) {
    throw Boom.forbidden("Permissions invalides");
  }
  return (ctx as AuthContext<OrganisationOrganismeFormation>).organisation;
}

export async function getOrganismeRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisation(
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
    case "ADMINISTRATEUR":
      return {};
  }
}

export async function getIndicateursOrganismesRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisation(
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
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
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
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisation(
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
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

/**
 * Restriction pour accéder aux effectifs anonymes
 */
export async function getEffectifsAnonymesRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisation(
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
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisation(
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
    case "CONSEIL_REGIONAL":
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
      return {
        _id: new ObjectId("000000000000"),
      };
    case "ADMINISTRATEUR":
      return {};
  }
}

/**
 * Liste tous les organismes accessibles pour une organisation (dont l'organisme lié à l'organisation)
 */
export async function findOrganismesAccessiblesByOrganisation(ctx: AuthContext<OrganisationOrganismeFormation>) {
  const organisation = ctx.organisation;
  const userOrganisme = await organismesDb().findOne({
    siret: organisation.siret,
    uai: organisation.uai as string,
  });
  if (!userOrganisme) {
    logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
    throw new Error("organisme de l'organisation non trouvé");
  }
  return [userOrganisme._id, ...(await findOrganismeFormateursIds(userOrganisme))];
}

export async function findOrganismesAccessiblesByOrganisme(organismeId: ObjectId) {
  const userOrganisme = await getOrganismeById(organismeId);
  return [userOrganisme._id, ...(await findOrganismeFormateursIds(userOrganisme))];
}

/**
 * Informations en provenance du référentiel :
 * organismes(siret=siret de l'organisation, uai=uai de l'organisation).relations.type = "responsable->formateur"
 */
export async function findOrganismeFormateursIds(userOrganisme: Organisme) {
  const subOrganismesIds = new Set<string>();
  if (
    userOrganisme.nature === NATURE_ORGANISME_DE_FORMATION.RESPONSABLE ||
    userOrganisme.nature === NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR
  ) {
    for (const { organismes } of userOrganisme.relatedFormations || []) {
      for (const subOrganismeCatalog of organismes || []) {
        if (
          subOrganismeCatalog.nature !== NATURE_ORGANISME_DE_FORMATION.LIEU &&
          subOrganismeCatalog.nature !== NATURE_ORGANISME_DE_FORMATION.INCONNUE &&
          !(userOrganisme.siret === subOrganismeCatalog.siret && userOrganisme.uai === subOrganismeCatalog.uai)
        ) {
          const subOrganisme = await organismesDb().findOne({
            siret: subOrganismeCatalog.siret,
            uai: subOrganismeCatalog.uai,
          });
          if (!subOrganisme) {
            logger.error(
              { siret: subOrganismeCatalog.siret, uai: subOrganismeCatalog.uai },
              "sous-organisme non trouvé"
            );
            throw new Error("sous-organisme non trouvé");
          } else {
            // FIX problème catalogue https://tableaudebord-apprentissage.atlassian.net/browse/TM-139
            // à supprimer très prochainement... (:
            if (
              (userOrganisme.siret === "13002087800240" && subOrganisme.siret === "41352152700056") ||
              (userOrganisme.siret === "41352152700056" && subOrganisme.siret === "13002087800240")
            ) {
              continue;
            }
            subOrganismesIds.add(subOrganisme._id.toString());
          }
        }
      }
    }
  }
  return [...subOrganismesIds.values()].map((id) => new ObjectId(id));
}

async function canAccessOrganismeIndicateurs(ctx: AuthContext, organismeId: ObjectId): Promise<boolean> {
  const organisme = await getOrganismeById(organismeId);
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisation(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return linkedOrganismesIds.map((id) => id.toString()).includes(organismeId.toString());
    }

    case "TETE_DE_RESEAU":
      return (organisme.reseaux as string[])?.includes(organisation.reseau);

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return organisme.adresse?.region === organisation.code_region;
    case "DDETS":
      return organisme.adresse?.departement === organisation.code_departement;
    case "ACADEMIE":
      return organisme.adresse?.academie === organisation.code_academie;

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return true;
  }
}

export function isOrganisationOF(type: OrganisationType): boolean {
  return (
    type === "ORGANISME_FORMATION_FORMATEUR" ||
    type === "ORGANISME_FORMATION_RESPONSABLE" ||
    type === "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR"
  );
}

export async function canManageOrganismeEffectifs(ctx: AuthContext, organismeId: ObjectId): Promise<boolean> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisation(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return linkedOrganismesIds.map((id) => id.toString()).includes(organismeId.toString());
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

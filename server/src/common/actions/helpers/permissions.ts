import Boom from "boom";
import { NATURE_ORGANISME_DE_FORMATION } from "../../constants/natureOrganismeConstants.js";
import logger from "../../logger.js";
import { organismesDb } from "../../model/collections.js";
import { AuthContext } from "../../model/internal/AuthContext.js";
import { OrganisationOrganismeFormation, OrganisationType } from "../../model/organisations.model.js";
import { getOrganismeById } from "../organismes/organismes.actions.js";

export async function requireOrganismeAccess(ctx: AuthContext, organismeId: string): Promise<void> {
  if (!(await canAccessOrganisme(ctx, organismeId))) {
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
      const linkedOrganismesIds = await findOFLinkedOrganismesIds(ctx as AuthContext<OrganisationOrganismeFormation>);
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
    case "DEETS":
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

/**
 * Même fonction que plus haut, mais pour un $lookup organisme
 */
export async function getEffectifsOrganismeRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOFLinkedOrganismesIds(ctx as AuthContext<OrganisationOrganismeFormation>);
      return {
        organisme_id: {
          $in: linkedOrganismesIds,
        },
      };
    }

    case "TETE_DE_RESEAU":
      return {
        "organisme.reseaux": organisation.reseau,
      };

    case "DREETS":
    case "DEETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return {
        "organisme.adresse.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "organisme.adresse.departement": organisation.code_departement,
      };
    case "ACADEMIE":
      return {
        "organisme.adresse.academie": organisation.code_academie,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

/**
 * Informations en provenance du catalogue :
 * organismes(siret=siret de l'organisation, uai=uai de l'organisation).formations.organismes
 */
async function findOFLinkedOrganismesIds(ctx: AuthContext<OrganisationOrganismeFormation>) {
  const organisation = ctx.organisation;
  const userOrganisme = await organismesDb().findOne({
    siret: organisation.siret,
    uai: organisation.uai,
  });
  if (!userOrganisme) {
    logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
    throw new Error("organisme de l'organisation non trouvé");
  }

  const subOrganismesIds = new Set<string>();
  subOrganismesIds.add(userOrganisme._id.toString());
  if (
    userOrganisme.nature === NATURE_ORGANISME_DE_FORMATION.RESPONSABLE ||
    userOrganisme.nature === NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR
  ) {
    for (const { organismes } of userOrganisme.relatedFormations) {
      for (const subOrganismeCatalog of organismes) {
        if (
          subOrganismeCatalog.nature !== NATURE_ORGANISME_DE_FORMATION.LIEU &&
          subOrganismeCatalog.nature !== NATURE_ORGANISME_DE_FORMATION.INCONNUE &&
          userOrganisme.siret !== subOrganismeCatalog.siret
        ) {
          const subOrganisme = await organismesDb().findOne({ siret: subOrganismeCatalog.siret as string });
          if (!subOrganisme) {
            logger.error({ siret: subOrganismeCatalog.siret }, "sous-organisme non trouvé");
            throw new Error("organisme de l'organisation non trouvé");
          } else {
            subOrganismesIds.add(subOrganisme._id.toString());
          }
        }
      }
    }
  }
  return [...subOrganismesIds.values()];
}

async function canAccessOrganisme(ctx: AuthContext, organismeId: string): Promise<boolean> {
  const organisme = await getOrganismeById(organismeId);
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOFLinkedOrganismesIds(ctx as AuthContext<OrganisationOrganismeFormation>);
      return linkedOrganismesIds.includes(organismeId);
    }

    case "TETE_DE_RESEAU":
      return (organisme.reseaux as string[])?.includes(organisation.reseau);

    case "DREETS":
    case "DEETS":
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

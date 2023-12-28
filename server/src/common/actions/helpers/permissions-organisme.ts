import { ObjectId } from "mongodb";
import { isTeteDeReseauResponsable } from "shared/constants";
import { PermissionsOrganisme } from "shared/constants/permissions";

import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { Organisme } from "@/common/model/@types/Organisme";
import { organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

import { findOrganismeFormateursIds, findOrganismesAccessiblesByOrganisationOF } from "./permissions";

export type OrganismeWithPermissions = Organisme & { permissions: PermissionsOrganisme };

// Référence : https://www.notion.so/mission-apprentissage/Permissions-afd9dc14606042e8b76b23aa57f516a8?pvs=4#790eaa3c87b24ceaa33a64cb4bf2513a
export async function buildOrganismePermissions(
  ctx: AuthContext,
  organismeId: ObjectId
): Promise<PermissionsOrganisme> {
  const organisme = await getOrganismeById(organismeId);
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const userOrganisme = await organismesDb().findOne({
        siret: organisation.siret,
        uai: organisation.uai as string,
      });
      if (!userOrganisme) {
        logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
        throw new Error("organisme de l'organisation non trouvé");
      }

      const linkedOrganismesIds = [userOrganisme._id, ...findOrganismeFormateursIds(userOrganisme)];
      const isOrganismeCible = organismeId.equals(userOrganisme._id);
      const isOrganismeOrFormateur = linkedOrganismesIds.some((linkedOrganismesId) =>
        linkedOrganismesId.equals(organismeId)
      );
      return {
        viewContacts: isOrganismeOrFormateur,
        infoTransmissionEffectifs: isOrganismeOrFormateur,
        indicateursEffectifs: isOrganismeOrFormateur,
        effectifsNominatifs: isOrganismeCible, // OFA interdit sur les formateurs
        manageEffectifs: isOrganismeOrFormateur,
        configurerModeTransmission: isOrganismeCible,
      };
    }

    case "TETE_DE_RESEAU": {
      const sameReseau = (organisme.reseaux as string[])?.includes(organisation.reseau);
      const isResponsable = isTeteDeReseauResponsable(organisation.reseau);
      return {
        viewContacts: sameReseau,
        infoTransmissionEffectifs: sameReseau,
        indicateursEffectifs: sameReseau,
        effectifsNominatifs: sameReseau && isResponsable,
        manageEffectifs: sameReseau && isResponsable,
        configurerModeTransmission: false,
      };
    }

    case "DREETS":
    case "DRAAF": {
      const sameRegion = organisme.adresse?.region === organisation.code_region;
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: sameRegion,
        effectifsNominatifs: sameRegion ? ["inscritSansContrat", "rupturant", "abandon"] : false,
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "CONSEIL_REGIONAL": {
      const sameRegion = organisme.adresse?.region === organisation.code_region;
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: sameRegion,
        effectifsNominatifs: false,
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "CARIF_OREF_REGIONAL": {
      const sameRegion = organisme.adresse?.region === organisation.code_region;
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: sameRegion,
        effectifsNominatifs: false,
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "DDETS": {
      const sameDepartement = organisme.adresse?.departement === organisation.code_departement;
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: sameDepartement,
        effectifsNominatifs: sameDepartement ? ["inscritSansContrat", "rupturant", "abandon"] : false,
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "ACADEMIE": {
      const sameAcademie = organisme.adresse?.academie === organisation.code_academie;
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: sameAcademie,
        effectifsNominatifs: sameAcademie ? ["inscritSansContrat", "rupturant", "abandon"] : false,
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }

    case "OPERATEUR_PUBLIC_NATIONAL":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: true,
        effectifsNominatifs: false,
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    case "CARIF_OREF_NATIONAL":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: true,
        effectifsNominatifs: false,
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    case "ADMINISTRATEUR":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: true,
        effectifsNominatifs: true,
        manageEffectifs: true,
        configurerModeTransmission: true,
      };
  }
}

export async function getOrganismePermission<Perm extends keyof PermissionsOrganisme>(
  ctx: AuthContext,
  organismeId: ObjectId,
  permission: Perm
): Promise<PermissionsOrganisme[Perm]> {
  const permissionsOrganisme = await buildOrganismePermissions(ctx, organismeId);
  return permissionsOrganisme[permission];
}

// indicateurs.actions : getOrganismeIndicateursEffectifsParFormation, getOrganismeIndicateursEffectifs
export async function getOrganismeIndicateursEffectifsRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(organisation);
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

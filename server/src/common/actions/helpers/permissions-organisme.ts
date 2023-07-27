import { ObjectId } from "mongodb";

import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { Organisme } from "@/common/model/@types/Organisme";
import { organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

import { findOrganismeFormateursIds } from "./permissions";

export type OrganismeWithPermissions = Organisme & { permissions: PermissionsOrganisme };

export interface PermissionsOrganisme {
  viewContacts: boolean;
  infoTransmissionEffectifs: boolean;
  indicateursEffectifs: boolean; // pourrait peut-être être false | "partial" (restriction réseau/territoire) | "full"
  manageEffectifs: boolean;
}

export async function buildOrganismePermissions(
  ctx: AuthContext,
  organismeId: ObjectId
): Promise<PermissionsOrganisme> {
  const organisme = await getOrganismeById(organismeId);
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const userOrganisme = await organismesDb().findOne({
        siret: organisation.siret,
        uai: organisation.uai as string,
      });
      if (!userOrganisme) {
        logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
        throw new Error("organisme de l'organisation non trouvé");
      }

      const linkedOrganismesIds = [userOrganisme._id, ...findOrganismeFormateursIds(userOrganisme)];
      const isOrganismeOrFormateur = linkedOrganismesIds.some((linkedOrganismesId) =>
        linkedOrganismesId.equals(organismeId)
      );
      return {
        viewContacts: isOrganismeOrFormateur,
        infoTransmissionEffectifs: isOrganismeOrFormateur,
        indicateursEffectifs: isOrganismeOrFormateur,
        manageEffectifs: userOrganisme._id.equals(organismeId),
      };
    }

    case "TETE_DE_RESEAU": {
      const sameReseau = (organisme.reseaux as string[])?.includes(organisation.reseau);
      return {
        viewContacts: sameReseau,
        infoTransmissionEffectifs: sameReseau,
        indicateursEffectifs: sameReseau,
        manageEffectifs: false,
      };
    }

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: organisme.adresse?.region === organisation.code_region,
        manageEffectifs: false,
      };
    case "DDETS":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: organisme.adresse?.departement === organisation.code_departement,
        manageEffectifs: false,
      };
    case "ACADEMIE":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: organisme.adresse?.academie === organisation.code_academie,
        manageEffectifs: false,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: true,
        manageEffectifs: false,
      };
    case "ADMINISTRATEUR":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: true,
        manageEffectifs: true,
      };
  }
}

export async function hasOrganismePermission(
  ctx: AuthContext,
  organismeId: ObjectId,
  permission: keyof PermissionsOrganisme
): Promise<boolean> {
  const permissionsOrganisme = await buildOrganismePermissions(ctx, organismeId);
  return permissionsOrganisme[permission];
}

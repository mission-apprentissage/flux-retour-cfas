import { ObjectId } from "mongodb";

import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { Organisme } from "@/common/model/@types/Organisme";
import { organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

import { typesEffectifNominatif } from "../indicateurs/indicateurs.actions";

import { findOrganismeFormateursIds } from "./permissions";

export type OrganismeWithPermissions = Organisme & { permissions: PermissionsOrganisme };

export interface PermissionsOrganisme {
  viewContacts: boolean;
  infoTransmissionEffectifs: boolean;
  indicateursEffectifs: boolean; // pourrait peut-être être false | "partial" (restriction réseau/territoire) | "full"
  effectifsNominatifs: boolean | Array<(typeof typesEffectifNominatif)[number]>;
  manageEffectifs: boolean;
}

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
      const isOrganismeOrFormateur = linkedOrganismesIds.some((linkedOrganismesId) =>
        linkedOrganismesId.equals(organismeId)
      );
      return {
        viewContacts: isOrganismeOrFormateur,
        infoTransmissionEffectifs: isOrganismeOrFormateur,
        indicateursEffectifs: isOrganismeOrFormateur,
        effectifsNominatifs: organismeId.equals(userOrganisme._id), // OFA interdit sur les formateurs
        manageEffectifs: isOrganismeOrFormateur,
      };
    }

    case "TETE_DE_RESEAU": {
      const sameReseau = (organisme.reseaux as string[])?.includes(organisation.reseau);
      return {
        viewContacts: sameReseau,
        infoTransmissionEffectifs: sameReseau,
        indicateursEffectifs: sameReseau,
        effectifsNominatifs: false,
        manageEffectifs: false,
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
      };
    }
    case "ACADEMIE": {
      const sameAcademie = organisme.adresse?.academie === organisation.code_academie;
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: sameAcademie,
        effectifsNominatifs: false,
        manageEffectifs: false,
      };
    }

    case "OPERATEUR_PUBLIC_NATIONAL":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: true,
        effectifsNominatifs: false,
        manageEffectifs: false,
      };
    case "CARIF_OREF_NATIONAL":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: true,
        effectifsNominatifs: false,
        manageEffectifs: false,
      };
    case "ADMINISTRATEUR":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: true,
        effectifsNominatifs: true,
        manageEffectifs: true,
      };
  }
}

export async function hasOrganismePermission<Perm extends keyof PermissionsOrganisme>(
  ctx: AuthContext,
  organismeId: ObjectId,
  permission: Perm
): Promise<PermissionsOrganisme[Perm]> {
  const permissionsOrganisme = await buildOrganismePermissions(ctx, organismeId);
  return permissionsOrganisme[permission];
}

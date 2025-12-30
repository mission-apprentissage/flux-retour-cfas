import { IMissionLocale } from "api-alternance-sdk";
import Boom from "boom";
import { ObjectId } from "mongodb";
import {
  throwUnexpectedError,
  TypeEffectifNominatif,
  Acl,
  PermissionScope,
  PermissionsOrganisme,
  assertUnreachable,
  IUsersMigration,
} from "shared";
import { IOrganisation } from "shared/models/data/organisations.model";
import { IOrganisme } from "shared/models/data/organismes.model";

import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { organismesDb, reseauxDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

import { findOrganismeFormateursIds } from "./permissions";

export type OrganismeWithPermissions = IOrganisme & { permissions: PermissionsOrganisme } & {
  formationsCount?: number;
} & {
  missionLocale?: IMissionLocale & { contactsTDB?: IUsersMigration[] };
};
export async function getAcl(organisation: IOrganisation): Promise<Acl> {
  switch (organisation.type) {
    // Tout a false pour les missions locales
    // Cela assure aucun accès potentiels aux autres apis
    case "FRANCE_TRAVAIL": {
      return {
        viewContacts: false,
        infoTransmissionEffectifs: false,
        indicateursEffectifs: false,
        effectifsNominatifs: {
          apprenant: false,
          apprenti: false,
          inscritSansContrat: false,
          rupturant: false,
          abandon: false,
          inconnu: false,
        },
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "MISSION_LOCALE": {
      return {
        viewContacts: false,
        infoTransmissionEffectifs: false,
        indicateursEffectifs: false,
        effectifsNominatifs: {
          apprenant: false,
          apprenti: false,
          inscritSansContrat: false,
          rupturant: false,
          abandon: false,
          inconnu: false,
        },
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "ARML": {
      return {
        viewContacts: false,
        infoTransmissionEffectifs: false,
        indicateursEffectifs: false,
        effectifsNominatifs: {
          apprenant: false,
          apprenti: false,
          inscritSansContrat: false,
          rupturant: false,
          abandon: false,
          inconnu: false,
        },
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "ORGANISME_FORMATION": {
      const userOrganisme = await organismesDb().findOne({
        siret: organisation.siret,
        uai: organisation.uai as string,
      });

      if (!userOrganisme) {
        logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
        throw Boom.forbidden("organisme de l'organisation non trouvé");
      }

      // Fix temporaire https://www.notion.so/mission-apprentissage/Permission-CNAM-PACA-305ab62fb1bf46e4907180597f6a57ef
      const linkedOrganismesWithPartialRespIds = [
        userOrganisme._id,
        ...findOrganismeFormateursIds(userOrganisme, true),
      ].map((o) => o.toString());
      const linkedOrganismesFullAccessIds = [
        userOrganisme._id,
        ...findOrganismeFormateursIds(userOrganisme, false),
      ].map((o) => o.toString());
      const isOrganismeOrFormateur = { id: { $in: linkedOrganismesWithPartialRespIds } };
      const hasFullAccess = { id: { $in: linkedOrganismesFullAccessIds } };
      const isOrganismeCible = { id: { $in: [userOrganisme._id.toString()] } };

      return {
        viewContacts: isOrganismeOrFormateur,
        infoTransmissionEffectifs: isOrganismeOrFormateur,
        indicateursEffectifs: isOrganismeOrFormateur,
        effectifsNominatifs: {
          apprenant: hasFullAccess,
          apprenti: hasFullAccess,
          inscritSansContrat: hasFullAccess,
          rupturant: hasFullAccess,
          abandon: hasFullAccess,
          inconnu: hasFullAccess,
        },
        manageEffectifs: hasFullAccess,
        configurerModeTransmission: isOrganismeCible,
      };
    }
    case "TETE_DE_RESEAU": {
      const sameReseau = { reseau: { $in: [organisation.reseau] } };
      const reseau = await reseauxDb().findOne({ key: organisation.reseau });
      if (!reseau) {
        logger.error({ reseau: organisation.reseau }, "reseau de l'organisation non trouvé");
        throw Boom.forbidden("reseau de l'organisation non trouvé");
      }

      const isResponsable = reseau?.responsable;

      return {
        viewContacts: sameReseau,
        infoTransmissionEffectifs: sameReseau,
        indicateursEffectifs: sameReseau,
        effectifsNominatifs: {
          apprenant: isResponsable ? sameReseau : false,
          apprenti: isResponsable ? sameReseau : false,
          inscritSansContrat: isResponsable ? sameReseau : false,
          rupturant: isResponsable ? sameReseau : false,
          abandon: isResponsable ? sameReseau : false,
          inconnu: isResponsable ? sameReseau : false,
        },
        manageEffectifs: isResponsable ? sameReseau : false,
        configurerModeTransmission: false,
      };
    }
    case "DREETS": {
      return {
        viewContacts: false,
        infoTransmissionEffectifs: false,
        indicateursEffectifs: false,
        effectifsNominatifs: {
          apprenant: false,
          apprenti: false,
          inscritSansContrat: false,
          rupturant: false,
          abandon: false,
          inconnu: false,
        },
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "DRAAF":
    case "DRAFPIC": {
      const sameRegion = { region: { $in: [organisation.code_region] } };
      return {
        viewContacts: sameRegion,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: sameRegion,
        effectifsNominatifs: {
          apprenant: false,
          apprenti: false,
          inscritSansContrat: sameRegion,
          rupturant: sameRegion,
          abandon: sameRegion,
          inconnu: false,
        },
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "CONSEIL_REGIONAL": {
      const sameRegion = { region: { $in: [organisation.code_region] } };
      return {
        viewContacts: sameRegion,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: sameRegion,
        effectifsNominatifs: {
          apprenant: false,
          apprenti: false,
          inscritSansContrat: false,
          rupturant: false,
          abandon: false,
          inconnu: false,
        },
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "DDETS": {
      return {
        viewContacts: false,
        infoTransmissionEffectifs: false,
        indicateursEffectifs: false,
        effectifsNominatifs: {
          apprenant: false,
          apprenti: false,
          inscritSansContrat: false,
          rupturant: false,
          abandon: false,
          inconnu: false,
        },
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "ACADEMIE": {
      const sameAcademie = { academie: { $in: [organisation.code_academie] } };
      return {
        viewContacts: sameAcademie,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: sameAcademie,
        effectifsNominatifs: {
          apprenant: false,
          apprenti: false,
          inscritSansContrat: sameAcademie,
          rupturant: sameAcademie,
          abandon: sameAcademie,
          inconnu: false,
        },
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "CARIF_OREF_NATIONAL":
    case "CARIF_OREF_REGIONAL":
    case "OPERATEUR_PUBLIC_NATIONAL":
      return {
        viewContacts: false,
        infoTransmissionEffectifs: false,
        indicateursEffectifs: false,
        effectifsNominatifs: {
          apprenant: false,
          apprenti: false,
          inscritSansContrat: false,
          rupturant: false,
          abandon: false,
          inconnu: false,
        },
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    case "ADMINISTRATEUR":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: true,
        effectifsNominatifs: {
          apprenant: true,
          apprenti: true,
          inscritSansContrat: true,
          rupturant: true,
          abandon: true,
          inconnu: true,
        },
        manageEffectifs: true,
        configurerModeTransmission: true,
      };
  }
}

function isInScope(scope: PermissionScope | boolean, organisme: IOrganisme): boolean {
  if (typeof scope === "boolean") return scope;

  return Object.keys(scope).every((k) => {
    const key = k as keyof PermissionScope;

    switch (key) {
      case "id": {
        const criteria = scope[key] ?? throwUnexpectedError();
        return criteria.$in.includes(organisme._id.toString());
      }
      case "reseau": {
        const criteria = scope[key] ?? throwUnexpectedError();
        if (!organisme.reseaux) return false;
        return organisme.reseaux.some((reseau) => criteria.$in.includes(reseau));
      }
      case "region": {
        const criteria = scope[key] ?? throwUnexpectedError();
        if (!organisme.adresse?.region) return false;
        return criteria.$in.includes(organisme.adresse.region);
      }
      case "departement": {
        const criteria = scope[key] ?? throwUnexpectedError();
        if (!organisme.adresse?.departement) return false;
        return criteria.$in.includes(organisme.adresse.departement);
      }
      case "academie": {
        const criteria = scope[key] ?? throwUnexpectedError();
        if (!organisme.adresse?.academie) return false;
        return criteria.$in.includes(organisme.adresse.academie);
      }
      default: {
        assertUnreachable(key);
      }
    }
  });
}

// Référence : https://www.notion.so/mission-apprentissage/Permissions-afd9dc14606042e8b76b23aa57f516a8?pvs=4#790eaa3c87b24ceaa33a64cb4bf2513a
export async function buildOrganismePermissions(
  ctx: AuthContext,
  organismeId: ObjectId
): Promise<PermissionsOrganisme> {
  const organisme = await getOrganismeById(organismeId);

  const acl = ctx.acl;
  const typeEffectifs = Object.keys(acl.effectifsNominatifs) as TypeEffectifNominatif[];
  const allowedEffectifsNominatifs = typeEffectifs.filter((type) =>
    isInScope(acl.effectifsNominatifs[type], organisme)
  );

  const effectifsNominatifs =
    allowedEffectifsNominatifs.length === 0
      ? false
      : allowedEffectifsNominatifs.length === typeEffectifs.length
        ? true
        : allowedEffectifsNominatifs;

  return {
    viewContacts: isInScope(acl.viewContacts, organisme),
    infoTransmissionEffectifs: isInScope(acl.infoTransmissionEffectifs, organisme),
    indicateursEffectifs: isInScope(acl.indicateursEffectifs, organisme),
    effectifsNominatifs,
    manageEffectifs: isInScope(acl.manageEffectifs, organisme),
    configurerModeTransmission: isInScope(acl.configurerModeTransmission, organisme),
  };
}

export async function getOrganismePermission<Perm extends keyof PermissionsOrganisme>(
  ctx: AuthContext,
  organismeId: ObjectId,
  permission: Perm
): Promise<PermissionsOrganisme[Perm]> {
  const permissionsOrganisme = await buildOrganismePermissions(ctx, organismeId);
  return permissionsOrganisme[permission];
}

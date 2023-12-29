import { ObjectId, WithId } from "mongodb";
import { ITeteDeReseauKey, isTeteDeReseauResponsable } from "shared/constants";
import { TypeEffectifNominatif } from "shared/constants/indicateurs";
import { Acl, PermissionScope, PermissionsOrganisme } from "shared/constants/permissions";

import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { Organisme } from "@/common/model/@types/Organisme";
import { organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

import { findOrganismeFormateursIds } from "./permissions";

export type OrganismeWithPermissions = Organisme & { permissions: PermissionsOrganisme };

export async function getAcl(ctx: AuthContext): Promise<Acl> {
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

      const linkedOrganismesIds = [userOrganisme._id, ...findOrganismeFormateursIds(userOrganisme)].map((o) =>
        o.toString()
      );
      const isOrganismeOrFormateur = { id: { $in: linkedOrganismesIds } };
      const isOrganismeCible = { id: { $in: [userOrganisme._id.toString()] } };

      return {
        viewContacts: isOrganismeOrFormateur,
        infoTransmissionEffectifs: isOrganismeOrFormateur,
        indicateursEffectifs: isOrganismeOrFormateur,
        effectifsNominatifs: {
          apprenant: isOrganismeOrFormateur,
          apprenti: isOrganismeOrFormateur,
          inscritSansContrat: isOrganismeOrFormateur,
          rupturant: isOrganismeOrFormateur,
          abandon: isOrganismeOrFormateur,
          inconnu: isOrganismeOrFormateur,
        },
        manageEffectifs: isOrganismeOrFormateur,
        configurerModeTransmission: isOrganismeCible,
      };
    }
    case "TETE_DE_RESEAU": {
      const sameReseau = { reseau: { $in: [organisation.reseau] } };
      const isResponsable = isTeteDeReseauResponsable(organisation.reseau);
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
    case "DREETS":
    case "DRAAF": {
      const sameRegion = { region: { $in: [organisation.code_region] } };
      return {
        viewContacts: true,
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
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL": {
      const sameRegion = { region: { $in: [organisation.code_region] } };
      return {
        viewContacts: true,
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
      const sameDepartement = { departement: { $in: [organisation.code_departement] } };
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: sameDepartement,
        effectifsNominatifs: {
          apprenant: false,
          apprenti: false,
          inscritSansContrat: sameDepartement,
          rupturant: sameDepartement,
          abandon: sameDepartement,
          inconnu: false,
        },
        manageEffectifs: false,
        configurerModeTransmission: false,
      };
    }
    case "ACADEMIE": {
      const sameAcademie = { academie: { $in: [organisation.code_academie] } };
      return {
        viewContacts: true,
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
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
      return {
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: true,
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

function throwUnexpectedError(): never {
  throw new Error("Unexpected Error");
}

function assertUnreachable(_key: never): never {
  throwUnexpectedError();
}

function isInScope(scope: PermissionScope | boolean, organisme: WithId<Organisme>): boolean {
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
  const [acl, organisme] = await Promise.all([getAcl(ctx), getOrganismeById(organismeId)]);

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

type IndicateursEffectifsRestriction = {
  _id?: null;
  organisme_id?: { $in: ReadonlyArray<ObjectId> };
  "_computed.organisme.reseaux"?: { $in: ReadonlyArray<ITeteDeReseauKey> };
  "_computed.organisme.region"?: { $in: ReadonlyArray<string> };
  "_computed.organisme.departement"?: { $in: ReadonlyArray<string> };
  "_computed.organisme.academie"?: { $in: ReadonlyArray<string> };
};

// indicateurs.actions : getOrganismeIndicateursEffectifsParFormation, getOrganismeIndicateursEffectifs
export async function getOrganismeIndicateursEffectifsRestriction(ctx: AuthContext): Promise<any> {
  const acl = await getAcl(ctx);
  const scope = acl.indicateursEffectifs;

  if (scope === true) {
    return {};
  }

  if (scope === false) {
    return { _id: null };
  }

  return Object.keys(scope).reduce((acc, k): IndicateursEffectifsRestriction => {
    const key = k as keyof PermissionScope;

    switch (key) {
      case "id": {
        const criteria = scope[key] ?? throwUnexpectedError();
        return { ...acc, organisme_id: { $in: criteria.$in.map((id) => new ObjectId(id)) } };
      }
      case "reseau": {
        const criteria = scope[key] ?? throwUnexpectedError();
        return { ...acc, "_computed.organisme.reseaux": criteria };
      }
      case "region": {
        const criteria = scope[key] ?? throwUnexpectedError();
        return { ...acc, "_computed.organisme.region": criteria };
      }
      case "departement": {
        const criteria = scope[key] ?? throwUnexpectedError();
        return { ...acc, "_computed.organisme.departement": criteria };
      }
      case "academie": {
        const criteria = scope[key] ?? throwUnexpectedError();
        return { ...acc, "_computed.organisme.academie": criteria };
      }
      default: {
        assertUnreachable(key);
      }
    }
  }, {});
}

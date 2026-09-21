import Boom from "boom";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { ObjectId } from "mongodb";
import {
  IEffectif,
  IOrganisation,
  IOrganisationFranceTravail,
  IOrganisationMissionLocale,
  IOrganisationOperateurPublicAcademie,
  IOrganisationOperateurPublicRegion,
  ORGANISATION_TYPE,
  PermissionOrganisme,
} from "shared";
import { getAcademieListByRegion } from "shared/constants/territoires";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { getRegionsFromOrganisation, OrganisationWithRegions } from "shared/utils/organisationRegions";

import { getOrganismePermission } from "@/common/actions/helpers/permissions-organisme";
import { effectifsDb, effectifsDECADb, organisationsDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

export type DefaultParams = Record<string, string>;
export type DefaultQuery = Request["query"];

export type RouteHandler<
  TLocals extends Record<string, unknown> = Record<string, unknown>,
  TParams = DefaultParams,
  TQuery = DefaultQuery,
  TBody = unknown,
> = (
  req: Request<TParams, unknown, TBody, TQuery, TLocals>,
  res: Response<unknown, TLocals>,
  next: NextFunction
) => unknown;

export interface MissionLocaleLocals extends Record<string, unknown> {
  missionLocale: IOrganisationMissionLocale;
}

export interface FranceTravailLocals extends Record<string, unknown> {
  franceTravail: IOrganisationFranceTravail;
}

export interface OrganismeLocals extends Record<string, unknown> {
  organismeId: ObjectId;
}

export interface RegionalLocals extends Record<string, unknown> {
  academie_list: string[];
}

export interface IndicateursMlLocals extends Record<string, unknown> {
  organisation: IOrganisation;
  regions: string[];
}

// catch errors and return the result of the request handler
export function returnResult<
  TLocals extends Record<string, unknown> = Record<string, unknown>,
  TParams = DefaultParams,
  TQuery = DefaultQuery,
  TBody = unknown,
>(
  serviceFunc: RouteHandler<TLocals, TParams, TQuery, TBody>
): RequestHandler<TParams, unknown, TBody, TQuery, TLocals> {
  return async (req, res, next) => {
    const result = await serviceFunc(req, res, next);
    // le résultat est à renvoyer en JSON par défaut
    if (!res.getHeader("Content-Type")) {
      res.set("Content-Type", "application/json");
    }
    res.send(
      result ?? {
        message: "success",
      }
    );
  };
}

// helpers
function ensureValidUser(user: AuthContext) {
  if (user.account_status !== "CONFIRMED") {
    throw Boom.forbidden("Accès non autorisé");
  }
}

export function requireAdministrator(req: Request, _res: Response, next: NextFunction) {
  ensureValidUser(req.user);
  if (req.user.organisation.type !== "ADMINISTRATEUR") {
    throw Boom.forbidden("Accès non autorisé");
  }
  next();
}

export function requireCfaAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = req.user as AuthContext;
  ensureValidUser(user);

  if (user.organisation.type !== "ORGANISME_FORMATION") {
    throw Boom.forbidden("Accès non autorisé");
  }

  if (user.impersonating) {
    next();
    return;
  }

  if (user.organisation_role !== "admin") {
    throw Boom.forbidden("Accès réservé aux administrateurs de l'établissement");
  }

  next();
}

/**
 * Pour les routes partagées entre tous les types d'org :
 * si l'org est un CFA, on exige le rôle admin CFA. Sinon, on laisse passer.
 */
export function requireCfaAdminIfCfa(req: Request, _res: Response, next: NextFunction) {
  const user = req.user as AuthContext;
  ensureValidUser(user);

  if (user.organisation.type === "ORGANISME_FORMATION") {
    return requireCfaAdmin(req, _res, next);
  }

  next();
}

export async function requireMissionLocale(
  req: Request,
  res: Response<unknown, MissionLocaleLocals>,
  next: NextFunction
) {
  const user = req.user as AuthContext;
  ensureValidUser(user);
  if (user.organisation.type !== "MISSION_LOCALE") {
    throw Boom.forbidden("Accès non autorisé");
  }

  const orga = await organisationsDb().findOne({
    _id: new ObjectId(user.organisation._id),
  });

  if (!orga || orga.type !== "MISSION_LOCALE") {
    throw Boom.notFound("Organisation non trouvée");
  }

  res.locals.missionLocale = orga;
  next();
}

export async function requireFranceTravail(
  req: Request,
  res: Response<unknown, FranceTravailLocals>,
  next: NextFunction
) {
  const user = req.user as AuthContext;
  ensureValidUser(user);
  if (user.organisation.type !== "FRANCE_TRAVAIL") {
    throw Boom.forbidden("Accès non autorisé");
  }

  const orga = await organisationsDb().findOne({
    _id: new ObjectId(user.organisation._id),
  });

  if (!orga || orga.type !== "FRANCE_TRAVAIL") {
    throw Boom.notFound("Organisation non trouvée");
  }

  res.locals.franceTravail = orga;
  next();
}

export function requireOrganismePermission(
  permission: PermissionOrganisme
): RequestHandler<never, unknown, never, never, OrganismeLocals> {
  return async (req, res, next) => {
    try {
      if (!(await getOrganismePermission(req.user, res.locals.organismeId, permission))) {
        throw Boom.forbidden("Permissions invalides");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireEffectifOrganismePermission(
  permission: PermissionOrganisme
): RequestHandler<{ id: string }, unknown, never, never, Record<string, unknown>> {
  return async (req, res, next) => {
    try {
      // On récupère l'organisme rattaché à l'effectif
      let effectif: IEffectif | IEffectifDECA | null = await effectifsDb().findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!effectif) {
        effectif = await effectifsDECADb().findOne({ _id: new ObjectId(req.params.id) });
      }

      if (!effectif) {
        throw Boom.notFound("effectif non trouvé");
      }
      if (!(await getOrganismePermission(req.user, effectif.organisme_id, permission))) {
        throw Boom.forbidden("Permissions invalides");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireOrganismeRegional(req: Request, res: Response<unknown, RegionalLocals>, next: NextFunction) {
  ensureValidUser(req.user);

  switch (req.user.organisation.type) {
    case ORGANISATION_TYPE.DREETS:
      res.locals.academie_list = getAcademieListByRegion(
        (req.user.organisation as IOrganisationOperateurPublicRegion).code_region
      );
      break;
    case ORGANISATION_TYPE.ACADEMIE:
      res.locals.academie_list = [(req.user.organisation as IOrganisationOperateurPublicAcademie).code_academie];
      break;
    default:
      throw Boom.forbidden("Accès non autorisé");
  }
  next();
}

export async function requireIndicateursMlAccess(
  req: Request,
  res: Response<unknown, IndicateursMlLocals>,
  next: NextFunction
) {
  const user = req.user as AuthContext;
  ensureValidUser(user);

  const allowedTypes = [
    ORGANISATION_TYPE.ARML,
    ORGANISATION_TYPE.DREETS,
    ORGANISATION_TYPE.DDETS,
    ORGANISATION_TYPE.ADMINISTRATEUR,
  ];

  if (!allowedTypes.includes(user.organisation.type as (typeof allowedTypes)[number])) {
    throw Boom.forbidden("Accès non autorisé");
  }

  const orga = await organisationsDb().findOne({
    _id: new ObjectId(user.organisation._id),
  });

  if (!orga) {
    throw Boom.notFound("Organisation non trouvée");
  }

  const regions = getRegionsFromOrganisation(orga as OrganisationWithRegions);
  if (orga.type !== ORGANISATION_TYPE.ADMINISTRATEUR && regions.length === 0) {
    throw Boom.forbidden("Aucun périmètre territorial n'est rattaché à votre organisation");
  }

  res.locals.organisation = orga;
  res.locals.regions = regions;

  next();
}

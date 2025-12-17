import Boom from "boom";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { ObjectId } from "mongodb";
import {
  getAcademieListByRegion,
  IEffectif,
  IOrganisationFranceTravail,
  IOrganisationOperateurPublicAcademie,
  IOrganisationOperateurPublicRegion,
  ORGANISATION_TYPE,
  PermissionOrganisme,
} from "shared";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { getRegionsFromOrganisation, OrganisationWithRegions } from "shared/utils/organisationRegions";

import { getOrganismePermission } from "@/common/actions/helpers/permissions-organisme";
import { effectifsDb, effectifsDECADb, organisationsDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

// catch errors and return the result of the request handler
export function returnResult<TParams = any, TQuery = any, TBody = any, TLocals extends Record<string, any> = any>(
  serviceFunc: RequestHandler<TParams, any, TBody, TQuery, TLocals>
): RequestHandler<TParams, any, TBody, TQuery, TLocals> {
  return async (req, res, next) => {
    const result = (await serviceFunc(req, res, next)) as any;
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

export function blockDREETSDDETS(req: Request, _res: Response, next: NextFunction) {
  const blockedTypes = [ORGANISATION_TYPE.DREETS, ORGANISATION_TYPE.DDETS];
  if (blockedTypes.includes(req.user.organisation.type as (typeof blockedTypes)[number])) {
    throw Boom.forbidden("Accès non autorisé");
  }
  next();
}

export async function requireMissionLocale(req: Request, res: Response, next: NextFunction) {
  const user = req.user as AuthContext;
  ensureValidUser(user);
  if (user.organisation.type !== "MISSION_LOCALE") {
    throw Boom.forbidden("Accès non autorisé");
  }

  const orga = await organisationsDb().findOne({
    _id: new ObjectId(user.organisation._id),
  });

  res.locals.missionLocale = orga;
  next();
}

export async function requireARML(req: Request, res: Response, next: NextFunction) {
  const user = req.user as AuthContext;
  ensureValidUser(user);
  if (user.organisation.type !== "ARML") {
    throw Boom.forbidden("Accès non autorisé");
  }

  const orga = await organisationsDb().findOne({
    _id: new ObjectId(user.organisation._id),
  });

  res.locals.arml = orga;
  next();
}

export async function requireFranceTravail(req: Request, res: Response, next: NextFunction) {
  const user = req.user as AuthContext;
  ensureValidUser(user);
  if (user.organisation.type !== "FRANCE_TRAVAIL") {
    throw Boom.forbidden("Accès non autorisé");
  }

  const orga = (await organisationsDb().findOne({
    _id: new ObjectId(user.organisation._id),
  })) as IOrganisationFranceTravail;

  res.locals.franceTravail = orga;
  next();
}

interface MyLocals {
  organismeId: ObjectId;
}

export function requireOrganismePermission<TParams = any, TQuery = any, TBody = any, TLocals = any>(
  permission: PermissionOrganisme
): RequestHandler<TParams, any, TBody, TQuery, TLocals & MyLocals> {
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

export function requireEffectifOrganismePermission<TParams = any, TQuery = any, TBody = any, TLocals = any>(
  permission: PermissionOrganisme
): RequestHandler<TParams, any, TBody, TQuery, TLocals & MyLocals> {
  return async (req, res, next) => {
    try {
      // On récupère l'organisme rattaché à l'effectif
      let effectif: IEffectif | IEffectifDECA | null = await effectifsDb().findOne({
        _id: new ObjectId((req.params as any).id),
      });

      if (!effectif) {
        effectif = await effectifsDECADb().findOne({ _id: new ObjectId((req.params as any).id) });
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

export function requireOrganismeRegional(req: Request, res: Response, next: NextFunction) {
  ensureValidUser(req.user);

  switch (req.user.organisation.type) {
    case ORGANISATION_TYPE.DRAFPIC:
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

export async function requireIndicateursMlAccess(req: Request, res: Response, next: NextFunction) {
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

  res.locals.organisation = orga;
  res.locals.regions = getRegionsFromOrganisation(orga as OrganisationWithRegions);

  next();
}

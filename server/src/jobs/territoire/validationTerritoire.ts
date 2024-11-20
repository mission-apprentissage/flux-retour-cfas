// La liste des territoires est une liste statique, ce job a pour but d'identifier de potentiels changements
// L'objectif est de vérifier que les territoires sont toujours valides. Avoir les territoires de manière statique permet de na pas avoir à appeler l'API à chaque fois

import { captureException } from "@sentry/node";
import type { IDepartement as IApiDepartement } from "api-alternance-sdk";
import Boom from "boom";
import { isEqual } from "lodash-es";
import { ACADEMIES_BY_CODE, DEPARTEMENTS_BY_CODE, REGIONS_BY_CODE } from "shared/constants";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import logger from "@/common/logger";

function validationRegions(apiDepartements: IApiDepartement[]): number {
  let count = 0;
  const seen = new Set<string>();
  const todo = new Set(Object.keys(REGIONS_BY_CODE));

  for (const apiDepartement of apiDepartements) {
    if (seen.has(apiDepartement.region.codeInsee)) {
      continue;
    }

    seen.add(apiDepartement.region.codeInsee);

    if (!todo.has(apiDepartement.region.codeInsee)) {
      const err = Boom.internal(`La région n'est pas dans la liste des régions`, { apiDepartement });
      captureException(err, { level: "fatal" });
      logger.error(err, err.data);
      count++;
      continue;
    }

    todo.delete(apiDepartement.region.codeInsee);

    const tdbRegion = REGIONS_BY_CODE[apiDepartement.region.codeInsee];
    const expectedTdbRegion = {
      code: apiDepartement.region.codeInsee,
      nom: apiDepartement.region.nom,
    };
    if (!isEqual(tdbRegion, expectedTdbRegion)) {
      const err = Boom.internal(`Les informations de la région ont changés`, {
        tdbRegion,
        apiDepartement,
        expectedTdbRegion,
      });
      captureException(err, { level: "fatal" });
      logger.error(err, err.data);
      count++;
    }
  }

  for (const code of todo) {
    const err = Boom.internal(`La région n'existe pas`, { code });
    captureException(err, { level: "fatal" });
    logger.error(err, err.data);
    count++;
  }

  return count;
}

function validationDepartements(apiDepartements: IApiDepartement[]): number {
  let count = 0;
  const todo = new Set(Object.keys(DEPARTEMENTS_BY_CODE));

  for (const apiDepartement of apiDepartements) {
    if (!todo.has(apiDepartement.codeInsee)) {
      const err = Boom.internal(`Le département n'est pas dans la liste des départements`, { apiDepartement });
      captureException(err, { level: "fatal" });
      logger.error(err, err.data);
      count++;
      continue;
    }

    todo.delete(apiDepartement.codeInsee);

    const tdbDepartement = DEPARTEMENTS_BY_CODE[apiDepartement.codeInsee];
    const expectedTdbDepartement = {
      code: apiDepartement.codeInsee,
      nom: apiDepartement.nom,
      region: {
        code: apiDepartement.region.codeInsee,
        nom: apiDepartement.region.nom,
      },
      academie: {
        code: apiDepartement.academie.code,
        nom: apiDepartement.academie.nom,
      },
    };

    if (!isEqual(tdbDepartement, expectedTdbDepartement)) {
      const err = Boom.internal(`Les informations du département ont changés`, {
        tdbDepartement,
        apiDepartement,
        expectedTdbDepartement,
      });
      captureException(err, { level: "fatal" });
      logger.error(err, err.data);
      count++;
    }
  }

  for (const code of todo) {
    const err = Boom.internal(`Le département n'existe pas`, { code });
    captureException(err, { level: "fatal" });
    logger.error(err, err.data);
    count++;
  }

  return count;
}

function validationAcademies(apiDepartements: IApiDepartement[]): number {
  let count = 0;
  const seen = new Set<string>();
  const todo = new Set(Object.keys(ACADEMIES_BY_CODE));

  for (const apiDepartement of apiDepartements) {
    if (seen.has(apiDepartement.academie.code)) {
      continue;
    }

    seen.add(apiDepartement.academie.code);

    if (!todo.has(apiDepartement.academie.code)) {
      const err = Boom.internal(`L'académie n'est pas dans la liste des académies`, { apiDepartement });
      captureException(err, { level: "fatal" });
      logger.error(err, err.data);
      count++;
      continue;
    }

    todo.delete(apiDepartement.academie.code);

    const tdbAcademie = ACADEMIES_BY_CODE[apiDepartement.academie.code];
    const expectedTdbAcademie = {
      code: apiDepartement.academie.code,
      nom: apiDepartement.academie.nom,
    };

    if (!isEqual(tdbAcademie, expectedTdbAcademie)) {
      const err = Boom.internal(`Les informations de l'académie ont changés`, { tdbAcademie, apiDepartement });
      captureException(err, { level: "fatal" });
      logger.error(err, err.data);
      count++;
    }
  }

  for (const code of todo) {
    const err = Boom.internal(`L'académie n'est pas dans la liste des académies`, { code });
    captureException(err, { level: "fatal" });
    logger.error(err, err.data);
    count++;
  }

  return count;
}

// Attention: en cas de changement des territoires, il faudra probablement remettre à jour les territoires dans la base de données.
export async function validationTerritoires(): Promise<number> {
  const departements = await apiAlternanceClient.geographie.listDepartements();

  let count = 0;
  count += validationRegions(departements);
  count += validationDepartements(departements);
  count += validationAcademies(departements);

  return count;
}

// La liste des territoires est une liste statique, ce job a pour but d'identifier de potentiels changements
// L'objectif est de vérifier que les territoires sont toujours valides. Avoir les territoires de manière statique permet de na pas avoir à appeler l'API à chaque fois

import { captureMessage, withScope } from "@sentry/node";
import type { IDepartement as IApiDepartement } from "api-alternance-sdk";
import { isEqual } from "lodash-es";
import { ACADEMIES_BY_CODE, DEPARTEMENTS_BY_CODE, REGIONS_BY_CODE } from "shared/constants";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import logger from "@/common/logger";

type Divergence = { motif: string; detail: Record<string, unknown> };

function validationRegions(apiDepartements: IApiDepartement[]): Divergence[] {
  const divergences: Divergence[] = [];
  const seen = new Set<string>();
  const todo = new Set(Object.keys(REGIONS_BY_CODE));

  for (const apiDepartement of apiDepartements) {
    if (seen.has(apiDepartement.region.codeInsee)) {
      continue;
    }

    seen.add(apiDepartement.region.codeInsee);

    if (!todo.has(apiDepartement.region.codeInsee)) {
      divergences.push({ motif: "La région n'est pas dans la liste des régions", detail: { apiDepartement } });
      continue;
    }

    todo.delete(apiDepartement.region.codeInsee);

    const tdbRegion = REGIONS_BY_CODE[apiDepartement.region.codeInsee as keyof typeof REGIONS_BY_CODE];
    const expectedTdbRegion = {
      code: apiDepartement.region.codeInsee,
      nom: apiDepartement.region.nom,
    };
    if (!isEqual(tdbRegion, expectedTdbRegion)) {
      divergences.push({
        motif: "Les informations de la région ont changé",
        detail: { tdbRegion, apiDepartement, expectedTdbRegion },
      });
    }
  }

  for (const code of todo) {
    divergences.push({ motif: "La région n'existe pas", detail: { code } });
  }

  return divergences;
}

function validationDepartements(apiDepartements: IApiDepartement[]): Divergence[] {
  const divergences: Divergence[] = [];
  const todo = new Set(Object.keys(DEPARTEMENTS_BY_CODE));

  for (const apiDepartement of apiDepartements) {
    if (!todo.has(apiDepartement.codeInsee)) {
      divergences.push({
        motif: "Le département n'est pas dans la liste des départements",
        detail: { apiDepartement },
      });
      continue;
    }

    todo.delete(apiDepartement.codeInsee);

    const tdbDepartement = DEPARTEMENTS_BY_CODE[apiDepartement.codeInsee as keyof typeof DEPARTEMENTS_BY_CODE];
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
      divergences.push({
        motif: "Les informations du département ont changé",
        detail: { tdbDepartement, apiDepartement, expectedTdbDepartement },
      });
    }
  }

  for (const code of todo) {
    divergences.push({ motif: "Le département n'existe pas", detail: { code } });
  }

  return divergences;
}

function validationAcademies(apiDepartements: IApiDepartement[]): Divergence[] {
  const divergences: Divergence[] = [];
  const seen = new Set<string>();
  const todo = new Set(Object.keys(ACADEMIES_BY_CODE));

  for (const apiDepartement of apiDepartements) {
    if (seen.has(apiDepartement.academie.code)) {
      continue;
    }

    seen.add(apiDepartement.academie.code);

    if (!todo.has(apiDepartement.academie.code)) {
      divergences.push({ motif: "L'académie n'est pas dans la liste des académies", detail: { apiDepartement } });
      continue;
    }

    todo.delete(apiDepartement.academie.code);

    const tdbAcademie = ACADEMIES_BY_CODE[apiDepartement.academie.code];
    const expectedTdbAcademie = {
      code: apiDepartement.academie.code,
      nom: apiDepartement.academie.nom,
    };

    if (!isEqual(tdbAcademie, expectedTdbAcademie)) {
      divergences.push({
        motif: "Les informations de l'académie ont changé",
        detail: { tdbAcademie, apiDepartement, expectedTdbAcademie },
      });
    }
  }

  for (const code of todo) {
    divergences.push({ motif: "L'académie n'est pas dans la liste des académies", detail: { code } });
  }

  return divergences;
}

// Attention: en cas de changement des territoires, il faudra probablement remettre à jour les territoires dans la base de données.
export async function validationTerritoires(): Promise<number> {
  const departements = await apiAlternanceClient.geographie.listDepartements();

  const divergences = [
    ...validationRegions(departements),
    ...validationDepartements(departements),
    ...validationAcademies(departements),
  ];

  if (divergences.length === 0) {
    return 0;
  }

  logger.warn({ divergences }, "Dérive du référentiel des territoires");

  // Un renommage de région ne doit pas réveiller une astreinte : warning, pas fatal.
  withScope((scope) => {
    scope.setTag("alert_tier", "veille");
    scope.setTag("error_kind", "data-drift");
    scope.setFingerprint(["territoires-drift"]);
    scope.setContext("dérive", { total: divergences.length, divergences: divergences.slice(0, 20) });
    captureMessage("Dérive du référentiel des territoires", "warning");
  });

  return divergences.length;
}

import * as Boom from "@hapi/boom";
import { ObjectId } from "mongodb";
import { CHAMPS_TELEVERSEMENT_PAR_CLE, ERREURS_TELEVERSEMENT, TELEVERSEMENT_MAX_LIGNES } from "shared/constants";
import {
  computeWarningsForDossierApprenantSchemaV3,
  dossierApprenantSchemaFichier,
  IDossierApprenantSchemaV3,
  lireCleEffectifFichier,
  PARAMS_TELEVERSEMENT,
  SUFFIXES_CONTRATS,
  verifierReglesFichierSurLigneBrute,
} from "shared/models/parts/dossierApprenantSchemaV3";
import { z } from "zod";

import { effectifsDb } from "@/common/model/collections";
import { validateArrayInput } from "@/common/utils/inputValidationError";
import stripNullProperties from "@/common/utils/stripNullProperties";

import { verifierEtablissementsTeleversement } from "./perimetre.actions";

export type IssueTeleversement = {
  path: [number, string];
  message: string;
  code: string;
  motif?: string;
};

export type AvertissementsTeleversement = {
  contratCount: number;
  nouveaux: number;
  misAJour: number;
  contratsEffaces: number[];
};

export type ResultatVerificationTeleversement =
  | { indisponible: true }
  | { indisponible: false; issues: IssueTeleversement[]; warnings: AvertissementsTeleversement };

type Ligne = Record<string, unknown>;

type CleEffectif = { annee_scolaire: string | undefined; id_erp_apprenant: string | undefined };

export function lireLignesTeleversement(body: unknown): Ligne[] {
  const lignes = validateArrayInput(body, TELEVERSEMENT_MAX_LIGNES);
  if (!lignes.every((ligne) => typeof ligne === "object" && ligne !== null && !Array.isArray(ligne))) {
    throw Boom.badRequest(ERREURS_TELEVERSEMENT.erreurs_avant_import());
  }
  return lignes as Ligne[];
}

const estVide = (valeur: unknown) =>
  valeur === undefined || valeur === null || (typeof valeur === "string" && valeur.trim() === "");

const texte = (valeur: unknown) => (estVide(valeur) ? "" : String(valeur).trim());

const numeroDeLigne = (ligne: Ligne, index: number) =>
  typeof ligne.ligne_fichier === "number" ? ligne.ligne_fichier : index + 2;

function traduireIssue(issue: z.ZodIssue, lignes: Ligne[]): IssueTeleversement {
  const index = Number(issue.path[0]);
  const cle = String(issue.path[1] ?? "");
  const path: [number, string] = [index, cle];
  if (issue.code === z.ZodIssueCode.custom && issue.params?.televersement === PARAMS_TELEVERSEMENT.televersement) {
    return { path, message: issue.message, code: issue.code };
  }
  const champ = CHAMPS_TELEVERSEMENT_PAR_CLE[cle];
  const libelle = champ?.libelle ?? cle;
  const valeur = lignes[index]?.[cle];
  if (estVide(valeur)) {
    return { path, message: ERREURS_TELEVERSEMENT.cellule_obligatoire_vide({ libelle }), code: issue.code };
  }
  if (cle === "sexe_apprenant") {
    return { path, message: ERREURS_TELEVERSEMENT.sexe(), code: issue.code };
  }
  return {
    path,
    message: ERREURS_TELEVERSEMENT.valeur_mal_formee({
      libelle,
      valeur: texte(valeur),
      attendu: champ ? `Exemple : ${champ.exemple}.` : "",
    }),
    code: issue.code,
  };
}

function verifierSchema(lignes: Ligne[]): IssueTeleversement[] {
  const vues = new Set<string>();
  return lignes.flatMap((ligne, index) => {
    const dossier = stripNullProperties(ligne);
    const resultat = dossierApprenantSchemaFichier.safeParse(dossier);
    if (resultat.success) {
      return [];
    }
    return [...resultat.error.issues, ...verifierReglesFichierSurLigneBrute(dossier)]
      .map((issue) => traduireIssue({ ...issue, path: [index, ...issue.path] }, lignes))
      .filter(({ path, message }) => {
        const cle = `${path.join(".")}|${message}`;
        if (vues.has(cle)) {
          return false;
        }
        vues.add(cle);
        return true;
      });
  });
}

const cleEffectif = (organismeId: string, anneeScolaire: string, idErp: string) =>
  `${organismeId}|${anneeScolaire}|${idErp}`;

function verifierDoublons(
  lignes: Ligne[],
  cles: CleEffectif[],
  organismeIdParLigne: (string | null)[]
): IssueTeleversement[] {
  const groupes = new Map<string, number[]>();
  lignes.forEach((_ligne, index) => {
    const organismeId = organismeIdParLigne[index];
    const { annee_scolaire, id_erp_apprenant } = cles[index];
    if (!organismeId || !annee_scolaire || !id_erp_apprenant) {
      return;
    }
    const cle = cleEffectif(organismeId, annee_scolaire, id_erp_apprenant);
    groupes.set(cle, [...(groupes.get(cle) ?? []), index]);
  });

  return [...groupes.values()]
    .filter((indexes) => indexes.length > 1)
    .flatMap((indexes) => {
      const premiere = lignes[indexes[0]];
      const message = ERREURS_TELEVERSEMENT.doublon_fichier({
        apprenant: `${texte(premiere.prenom_apprenant)} ${texte(premiere.nom_apprenant)}`.trim(),
        lignes: indexes.map((index) => numeroDeLigne(lignes[index], index)),
      });
      return indexes.map(
        (index): IssueTeleversement => ({ path: [index, "nom_apprenant"], message, code: "custom", motif: "doublon" })
      );
    });
}

const nombreDeContrats = (ligne: Ligne) =>
  SUFFIXES_CONTRATS.filter((suffixe) =>
    ["contrat_date_debut", "contrat_date_fin", "contrat_date_rupture"].some(
      (champ) => !estVide(ligne[`${champ}${suffixe}`])
    )
  ).length;

async function comparerAuxEffectifsConnus(
  lignes: Ligne[],
  cles: CleEffectif[],
  organismeIdParLigne: (string | null)[]
): Promise<Omit<AvertissementsTeleversement, "contratCount">> {
  const resolues = lignes.flatMap((ligne, index) => {
    const organismeId = organismeIdParLigne[index];
    const { annee_scolaire, id_erp_apprenant } = cles[index];
    return organismeId && annee_scolaire && id_erp_apprenant
      ? [{ ligne, index, organismeId, annee_scolaire, id_erp_apprenant }]
      : [];
  });
  if (resolues.length === 0) {
    return { nouveaux: 0, misAJour: 0, contratsEffaces: [] };
  }

  const connus = await effectifsDb()
    .find(
      {
        organisme_id: {
          $in: [...new Set(resolues.map(({ organismeId }) => organismeId))].map((id) => new ObjectId(id)),
        },
        annee_scolaire: { $in: [...new Set(resolues.map(({ annee_scolaire }) => annee_scolaire))] },
        id_erp_apprenant: { $in: [...new Set(resolues.map(({ id_erp_apprenant }) => id_erp_apprenant))] },
      },
      { projection: { organisme_id: 1, annee_scolaire: 1, id_erp_apprenant: 1, contrats: 1 } }
    )
    .toArray();
  const contratsConnus = new Map(
    connus.map((effectif) => [
      cleEffectif(effectif.organisme_id.toString(), effectif.annee_scolaire, effectif.id_erp_apprenant),
      effectif.contrats?.length ?? 0,
    ])
  );

  let misAJour = 0;
  const contratsEffaces: number[] = [];
  for (const { ligne, index, organismeId, annee_scolaire, id_erp_apprenant } of resolues) {
    const connu = contratsConnus.get(cleEffectif(organismeId, annee_scolaire, id_erp_apprenant));
    if (connu === undefined) {
      continue;
    }
    misAJour++;
    if (nombreDeContrats(ligne) < connu) {
      contratsEffaces.push(index);
    }
  }
  return { nouveaux: resolues.length - misAJour, misAJour, contratsEffaces };
}

export async function verifierTeleversement(
  sourceOrganismeId: ObjectId,
  lignes: Ligne[]
): Promise<ResultatVerificationTeleversement> {
  const etablissements = await verifierEtablissementsTeleversement(sourceOrganismeId, lignes);
  if (etablissements.indisponible) {
    return { indisponible: true };
  }

  const cles = lignes.map((ligne) => lireCleEffectifFichier(ligne));
  const issues = [
    ...verifierSchema(lignes),
    ...etablissements.issues,
    ...verifierDoublons(lignes, cles, etablissements.organismeIdParLigne),
  ].sort((a, b) => a.path[0] - b.path[0]);

  return {
    indisponible: false,
    issues,
    warnings: {
      ...computeWarningsForDossierApprenantSchemaV3(lignes as IDossierApprenantSchemaV3[]),
      ...(issues.length > 0
        ? { nouveaux: 0, misAJour: 0, contratsEffaces: [] }
        : await comparerAuxEffectifsConnus(lignes, cles, etablissements.organismeIdParLigne)),
    },
  };
}

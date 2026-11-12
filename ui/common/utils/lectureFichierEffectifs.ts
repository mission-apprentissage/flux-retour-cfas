import {
  CATALOGUE_CHAMPS_TELEVERSEMENT,
  CHAMPS_TELEVERSEMENT_PAR_CLE,
  CLES_DATE_DEBUT_CONTRAT,
  ERREURS_TELEVERSEMENT,
  normaliserEnTeteTeleversement,
  type ChampTeleversement,
  type CodeErreurTeleversement,
} from "shared";
import * as XLSX from "xlsx";

export interface ErreurLecture {
  code: CodeErreurTeleversement;
  cle: string;
  message: string;
}

export interface LigneLue {
  numero: number;
  valeurs: Record<string, unknown>;
  erreurs: ErreurLecture[];
}

export interface LectureReussie {
  succes: true;
  lignes: LigneLue[];
  colonnesReconnues: string[];
  colonnesObligatoiresAbsentes: string[];
  colonnesEnDouble: string[];
}

export type ResultatLecture = { succes: false; code: CodeErreurTeleversement; message: string } | LectureReussie;

const ANNEE_MIN = 1950;
const ANNEE_MAX = 2100;
const FEUILLE_AIDE = "aide";
const LIGNES_OU_CHERCHER_LES_EN_TETES = 10;
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const JOUR_MS = 24 * 60 * 60 * 1000;
const DECALAGE_1904_JOURS = 1462;

const PRIORITE_NOM_TECHNIQUE = 0;
const PRIORITE_LIBELLE = 1;
const PRIORITE_ALIAS = 2;

interface EnTeteReconnu {
  cle: string;
  priorite: number;
}

const CLES_TECHNIQUES = new Set(CATALOGUE_CHAMPS_TELEVERSEMENT.map(({ cle }) => cle));

const EN_TETES_RECONNUS = new Map<string, EnTeteReconnu>();
CATALOGUE_CHAMPS_TELEVERSEMENT.forEach((champ) => {
  const enTetes: [string, number][] = [
    [champ.libelle, PRIORITE_LIBELLE],
    [champ.cle, PRIORITE_ALIAS],
    ...champ.alias.map((alias): [string, number] => [alias, PRIORITE_ALIAS]),
  ];
  enTetes.forEach(([enTete, priorite]) => {
    const normalise = normaliserEnTeteTeleversement(enTete);
    const connu = EN_TETES_RECONNUS.get(normalise);
    if (!connu || (connu.cle === champ.cle && priorite < connu.priorite)) {
      EN_TETES_RECONNUS.set(normalise, { cle: champ.cle, priorite });
    }
  });
});

function reconnaitreEnTete(enTete: unknown): EnTeteReconnu | null {
  if (typeof enTete !== "string") {
    return null;
  }
  const technique = enTete.replace(/\*/g, "").trim().toLowerCase();
  if (CLES_TECHNIQUES.has(technique)) {
    return { cle: technique, priorite: PRIORITE_NOM_TECHNIQUE };
  }
  return EN_TETES_RECONNUS.get(normaliserEnTeteTeleversement(enTete)) ?? null;
}

export const reconnaitreColonne = (enTete: unknown): string | null => reconnaitreEnTete(enTete)?.cle ?? null;

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

const formaterDate = (annee: number, mois: number, jour: number) =>
  `${annee}-${deuxChiffres(mois)}-${deuxChiffres(jour)}`;

type DateLue = { date: string } | { code: "date_illisible" | "date_impossible" };

const verifierDate = (annee: number, mois: number, jour: number): DateLue => {
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31 || annee < ANNEE_MIN || annee > ANNEE_MAX) {
    return { code: "date_illisible" };
  }
  if (new Date(Date.UTC(annee, mois - 1, jour)).getUTCDate() !== jour) {
    return { code: "date_impossible" };
  }
  return { date: formaterDate(annee, mois, jour) };
};

const dateDepuisUTC = (date: Date): DateLue =>
  Number.isNaN(date.getTime())
    ? { code: "date_illisible" }
    : verifierDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

const HEURE_EN_FIN = /(?:\s+|T)\d{1,2}:\d{2}(?::\d{2}(?:[.,]\d+)?)?\s*(?:Z|[+-]\d{2}(?::?\d{2})?)?$/i;

export function lireDate(valeur: unknown, { date1904 = false }: { date1904?: boolean } = {}): DateLue {
  if (valeur instanceof Date) {
    return dateDepuisUTC(valeur);
  }
  if (typeof valeur === "number") {
    const jours = valeur + (date1904 ? DECALAGE_1904_JOURS : 0);
    return dateDepuisUTC(new Date(EXCEL_EPOCH_UTC + Math.round(jours * JOUR_MS)));
  }
  const texte = String(valeur).trim().replace(HEURE_EN_FIN, "").replace(/\s+/g, "");
  const iso = texte.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return verifierDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }
  const francaise = texte.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})$/);
  if (francaise) {
    const anneeLue = Number(francaise[3]);
    const annee = francaise[3].length === 2 ? (anneeLue <= 40 ? 2000 + anneeLue : 1900 + anneeLue) : anneeLue;
    return verifierDate(annee, Number(francaise[2]), Number(francaise[1]));
  }
  return { code: "date_illisible" };
}

const BOOLEENS = new Map<string, boolean>([
  ["oui", true],
  ["vrai", true],
  ["true", true],
  ["1", true],
  ["non", false],
  ["faux", false],
  ["false", false],
  ["0", false],
]);

const SEXES = new Map<string, "F" | "M">([
  ["F", "F"],
  ["FEMME", "F"],
  ["FEMININ", "F"],
  ["2", "F"],
  ["M", "M"],
  ["H", "M"],
  ["HOMME", "M"],
  ["MASCULIN", "M"],
  ["1", "M"],
]);

const estVide = (valeur: unknown) =>
  valeur === null || valeur === undefined || (typeof valeur === "string" && valeur.trim() === "");

const texteDeLaCellule = (valeur: unknown) =>
  valeur instanceof Date
    ? `${deuxChiffres(valeur.getUTCDate())}/${deuxChiffres(valeur.getUTCMonth() + 1)}/${valeur.getUTCFullYear()}`
    : String(valeur).trim();

const sansAccents = (texte: string) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "");

function lireCellule(
  champ: ChampTeleversement,
  valeur: unknown,
  { date1904 }: { date1904: boolean }
): { valeur: unknown } | { erreur: Omit<ErreurLecture, "cle"> } {
  if (champ.type === "date") {
    const date = lireDate(valeur, { date1904 });
    if ("date" in date) {
      return { valeur: date.date };
    }
    const texte = texteDeLaCellule(valeur);
    return {
      erreur: {
        code: date.code,
        message:
          date.code === "date_impossible"
            ? ERREURS_TELEVERSEMENT.date_impossible({ valeur: texte })
            : ERREURS_TELEVERSEMENT.date_illisible({ libelle: champ.libelle, valeur: texte }),
      },
    };
  }
  if (champ.type === "boolean") {
    if (typeof valeur === "boolean") {
      return { valeur };
    }
    const booleen = BOOLEENS.get(texteDeLaCellule(valeur).toLowerCase());
    return booleen === undefined
      ? {
          erreur: {
            code: "valeur_mal_formee",
            message: ERREURS_TELEVERSEMENT.valeur_mal_formee({
              libelle: champ.libelle,
              valeur: texteDeLaCellule(valeur),
              attendu: "Indiquez Oui ou Non.",
            }),
          },
        }
      : { valeur: booleen };
  }
  if (champ.cle === "sexe_apprenant" && (typeof valeur === "string" || typeof valeur === "number")) {
    return { valeur: SEXES.get(sansAccents(String(valeur).trim()).toUpperCase()) ?? valeur };
  }
  return { valeur };
}

function colonnesObligatoiresAbsentes(colonnesReconnues: Set<string>): string[] {
  const absentes = CATALOGUE_CHAMPS_TELEVERSEMENT.flatMap((champ, index) => {
    if (champ.obligation === "obligatoire") {
      return colonnesReconnues.has(champ.cle) ? [] : [champ.libelle];
    }
    if (champ.obligation === "un_des_deux" && champ.avec) {
      const autre = CHAMPS_TELEVERSEMENT_PAR_CLE[champ.avec];
      const premierDeLaPaire = CATALOGUE_CHAMPS_TELEVERSEMENT.indexOf(autre) > index;
      if (!premierDeLaPaire || colonnesReconnues.has(champ.cle) || colonnesReconnues.has(autre.cle)) {
        return [];
      }
      return [`${champ.libelle} ou ${autre.libelle.charAt(0).toLowerCase()}${autre.libelle.slice(1)}`];
    }
    return [];
  });
  const avecContrat = CLES_DATE_DEBUT_CONTRAT.some((cle) => colonnesReconnues.has(cle));
  return avecContrat ? absentes : [...absentes, CHAMPS_TELEVERSEMENT_PAR_CLE.contrat_date_debut.libelle];
}

const SIGNATURES_BINAIRES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0xd0, 0xcf, 0x11, 0xe0],
  [0x09, 0x08],
  [0x09, 0x04],
  [0x09, 0x02],
  [0x09, 0x00],
];

const aUneSignatureBinaire = (contenu: ArrayBuffer) => {
  const debut = new Uint8Array(contenu.slice(0, 4));
  return SIGNATURES_BINAIRES.some((signature) => signature.every((octet, index) => debut[index] === octet));
};

const OPTIONS_LECTURE: XLSX.ParsingOptions = { cellDates: true, UTC: true, nodim: true };

function ouvrirClasseur(contenu: ArrayBuffer, nomFichier: string): XLSX.WorkBook {
  if (aUneSignatureBinaire(contenu)) {
    return XLSX.read(contenu, { ...OPTIONS_LECTURE, type: "array" });
  }
  const extension = nomFichier.toLowerCase().split(".").pop();
  if (extension === "xlsx" || extension === "ods") {
    throw new Error("Pas un classeur");
  }
  let texte: string;
  try {
    texte = new TextDecoder("utf-8", { fatal: true }).decode(contenu);
  } catch {
    texte = new TextDecoder("windows-1252").decode(contenu);
  }
  if (texte.includes("\u0000")) {
    throw new Error("Pas un tableur");
  }
  return XLSX.read(texte.replace(/^\uFEFF/, ""), { ...OPTIONS_LECTURE, type: "string", raw: true });
}

const OPTIONS_CONVERSION: XLSX.Sheet2JSONOpts = { header: 1, raw: true, defval: null, blankrows: true, UTC: true };

interface FeuilleRetenue {
  feuille: XLSX.WorkSheet;
  plage: XLSX.Range;
  ligneDesEnTetes: number;
  enTetes: unknown[];
}

function trouverLesEnTetes(classeur: XLSX.WorkBook): FeuilleRetenue | null {
  for (const nom of classeur.SheetNames) {
    const feuille = classeur.Sheets[nom];
    if (normaliserEnTeteTeleversement(nom) === FEUILLE_AIDE || !feuille?.["!ref"]) {
      continue;
    }
    const plage = XLSX.utils.decode_range(feuille["!ref"]);
    const premieresLignes = XLSX.utils.sheet_to_json<unknown[]>(feuille, {
      ...OPTIONS_CONVERSION,
      range: {
        s: plage.s,
        e: { r: Math.min(plage.e.r, plage.s.r + LIGNES_OU_CHERCHER_LES_EN_TETES - 1), c: plage.e.c },
      },
    });
    let meilleure = -1;
    let reconnuesDansLaMeilleure = 0;
    for (const [index, cellules] of premieresLignes.entries()) {
      const reconnues = new Set((cellules ?? []).map(reconnaitreColonne).filter(Boolean)).size;
      if (reconnues > reconnuesDansLaMeilleure) {
        meilleure = index;
        reconnuesDansLaMeilleure = reconnues;
      }
    }
    if (meilleure >= 0) {
      return { feuille, plage, ligneDesEnTetes: plage.s.r + meilleure, enTetes: premieresLignes[meilleure] ?? [] };
    }
  }
  return null;
}

function associerLesColonnes(enTetes: unknown[]) {
  const parCle = new Map<string, { priorite: number; colonnes: number[] }>();
  enTetes.forEach((enTete, colonne) => {
    const reconnu = reconnaitreEnTete(enTete);
    if (!reconnu) {
      return;
    }
    const connu = parCle.get(reconnu.cle);
    if (!connu || reconnu.priorite < connu.priorite) {
      parCle.set(reconnu.cle, { priorite: reconnu.priorite, colonnes: [colonne] });
    } else if (reconnu.priorite === connu.priorite) {
      connu.colonnes.push(colonne);
    }
  });
  const retenues = [...parCle.entries()].sort(([, a], [, b]) => a.colonnes[0] - b.colonnes[0]);
  return {
    colonnes: new Map(retenues.map(([cle, { colonnes }]) => [colonnes[0], CHAMPS_TELEVERSEMENT_PAR_CLE[cle]])),
    colonnesEnDouble: retenues
      .filter(([, { colonnes }]) => colonnes.length > 1)
      .map(([cle]) => CHAMPS_TELEVERSEMENT_PAR_CLE[cle].libelle),
  };
}

export function lireFichierEffectifs(
  contenu: ArrayBuffer,
  nomFichier: string,
  { maximumLignes }: { maximumLignes: number }
): ResultatLecture {
  let classeur: XLSX.WorkBook;
  try {
    classeur = ouvrirClasseur(contenu, nomFichier);
  } catch (err) {
    const protege = err instanceof Error && /password|encrypt/i.test(err.message);
    const code = protege ? "fichier_protege" : "format_refuse";
    return { succes: false, code, message: ERREURS_TELEVERSEMENT[code]() };
  }

  const retenue = trouverLesEnTetes(classeur);
  if (!retenue) {
    return { succes: false, code: "fichier_vide", message: ERREURS_TELEVERSEMENT.fichier_vide() };
  }
  const { feuille, plage, ligneDesEnTetes, enTetes } = retenue;
  const { colonnes, colonnesEnDouble } = associerLesColonnes(enTetes);
  const date1904 = Boolean(classeur.Workbook?.WBProps?.date1904);

  const lignes: LigneLue[] = [];
  XLSX.utils
    .sheet_to_json<unknown[]>(feuille, {
      ...OPTIONS_CONVERSION,
      range: { s: { r: ligneDesEnTetes + 1, c: plage.s.c }, e: plage.e },
    })
    .forEach((cellules, index) => {
      if ((cellules ?? []).every(estVide)) {
        return;
      }
      const ligne: LigneLue = { numero: ligneDesEnTetes + index + 2, valeurs: {}, erreurs: [] };
      colonnes.forEach((champ, colonne) => {
        const valeur = cellules[colonne];
        if (estVide(valeur)) {
          return;
        }
        const lu = lireCellule(champ, typeof valeur === "string" ? valeur.trim() : valeur, { date1904 });
        if ("erreur" in lu) {
          ligne.erreurs.push({ ...lu.erreur, cle: champ.cle });
        } else {
          ligne.valeurs[champ.cle] = lu.valeur;
        }
      });
      lignes.push(ligne);
    });

  if (lignes.length === 0) {
    return { succes: false, code: "fichier_vide", message: ERREURS_TELEVERSEMENT.fichier_vide() };
  }
  if (lignes.length > maximumLignes) {
    return {
      succes: false,
      code: "trop_de_lignes",
      message: ERREURS_TELEVERSEMENT.trop_de_lignes({ lignes: lignes.length, maximum: maximumLignes }),
    };
  }

  const colonnesReconnues = new Set([...colonnes.values()].map(({ cle }) => cle));
  return {
    succes: true,
    lignes,
    colonnesReconnues: [...colonnesReconnues],
    colonnesObligatoiresAbsentes: colonnesObligatoiresAbsentes(colonnesReconnues),
    colonnesEnDouble,
  };
}

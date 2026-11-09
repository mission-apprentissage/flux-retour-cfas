import {
  CATALOGUE_CHAMPS_TELEVERSEMENT,
  CHAMPS_TELEVERSEMENT_PAR_CLE,
  CLES_DATE_DEBUT_CONTRAT,
  ERREURS_TELEVERSEMENT,
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

export type ResultatLecture =
  | { succes: false; code: CodeErreurTeleversement; message: string }
  | {
      succes: true;
      lignes: LigneLue[];
      colonnesReconnues: string[];
      colonnesObligatoiresAbsentes: string[];
    };

const ANNEE_MIN = 1950;
const ANNEE_MAX = 2100;
const FEUILLE_AIDE = "aide";
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const JOUR_MS = 24 * 60 * 60 * 1000;

export const normaliserEnTete = (enTete: string) =>
  enTete
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const CLES_PAR_EN_TETE = new Map<string, string>(
  CATALOGUE_CHAMPS_TELEVERSEMENT.flatMap((champ) =>
    [champ.cle, champ.libelle, ...champ.alias].map((enTete) => [normaliserEnTete(enTete), champ.cle] as const)
  )
);

export const reconnaitreColonne = (enTete: unknown): string | null =>
  typeof enTete === "string" ? (CLES_PAR_EN_TETE.get(normaliserEnTete(enTete)) ?? null) : null;

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

const formaterDate = (annee: number, mois: number, jour: number) =>
  `${annee}-${deuxChiffres(mois)}-${deuxChiffres(jour)}`;

type DateLue = { date: string } | { code: "date_illisible" | "date_impossible" };

const verifierDate = (annee: number, mois: number, jour: number): DateLue => {
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  if (date.getUTCFullYear() !== annee || date.getUTCMonth() !== mois - 1 || date.getUTCDate() !== jour) {
    return { code: "date_impossible" };
  }
  if (annee < ANNEE_MIN || annee > ANNEE_MAX) {
    return { code: "date_illisible" };
  }
  return { date: formaterDate(annee, mois, jour) };
};

const dateDepuisUTC = (date: Date): DateLue =>
  Number.isNaN(date.getTime())
    ? { code: "date_illisible" }
    : verifierDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

export function lireDate(valeur: unknown): DateLue {
  if (valeur instanceof Date) {
    return dateDepuisUTC(valeur);
  }
  if (typeof valeur === "number") {
    return dateDepuisUTC(new Date(EXCEL_EPOCH_UTC + Math.round(valeur * JOUR_MS)));
  }
  const texte = String(valeur).replace(/\s+/g, "");
  const iso = texte.match(/^(\d{4})-(\d{2})-(\d{2})(T.*)?$/);
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

const BOOLEENS: Record<string, boolean> = {
  oui: true,
  vrai: true,
  true: true,
  "1": true,
  non: false,
  faux: false,
  false: false,
  "0": false,
};

const SEXES: Record<string, string> = { homme: "M", femme: "F" };

const estVide = (valeur: unknown) =>
  valeur === null || valeur === undefined || (typeof valeur === "string" && valeur.trim() === "");

const texteDeLaCellule = (valeur: unknown) =>
  valeur instanceof Date ? valeur.toISOString().slice(0, 10) : String(valeur).trim();

function lireCellule(
  champ: ChampTeleversement,
  valeur: unknown
): { valeur: unknown } | { erreur: Omit<ErreurLecture, "cle"> } {
  if (champ.type === "date") {
    const date = lireDate(valeur);
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
    const booleen = BOOLEENS[texteDeLaCellule(valeur).toLowerCase()];
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
  if (champ.cle === "sexe_apprenant" && typeof valeur === "string") {
    return { valeur: SEXES[valeur.trim().toLowerCase()] ?? valeur };
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

const SIGNATURES_CLASSEUR = [
  [0x50, 0x4b, 0x03, 0x04],
  [0xd0, 0xcf, 0x11, 0xe0],
];

const aUneSignatureDeClasseur = (contenu: ArrayBuffer) => {
  const debut = new Uint8Array(contenu.slice(0, 4));
  return SIGNATURES_CLASSEUR.some((signature) => signature.every((octet, index) => debut[index] === octet));
};

function ouvrirClasseur(contenu: ArrayBuffer, nomFichier: string): XLSX.WorkBook {
  const extension = nomFichier.toLowerCase().split(".").pop();
  if ((extension === "xlsx" || extension === "ods") && !aUneSignatureDeClasseur(contenu)) {
    throw new Error("Pas un classeur");
  }
  if (extension === "csv") {
    let texte: string;
    try {
      texte = new TextDecoder("utf-8", { fatal: true }).decode(contenu);
    } catch {
      texte = new TextDecoder("windows-1252").decode(contenu);
    }
    return XLSX.read(texte.replace(/^\uFEFF/, ""), { type: "string", raw: true });
  }
  return XLSX.read(contenu, { type: "array", cellDates: true, UTC: true });
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

  const feuilles = classeur.SheetNames.filter((nom) => normaliserEnTete(nom) !== FEUILLE_AIDE).map((nom) =>
    XLSX.utils.sheet_to_json<unknown[]>(classeur.Sheets[nom], {
      header: 1,
      raw: true,
      defval: null,
      blankrows: true,
      UTC: true,
    })
  );
  const lignesDeLaFeuille = feuilles.find((lignes) => (lignes[0] ?? []).some((enTete) => reconnaitreColonne(enTete)));
  if (!lignesDeLaFeuille) {
    return { succes: false, code: "fichier_vide", message: ERREURS_TELEVERSEMENT.fichier_vide() };
  }

  const colonnes = new Map<number, ChampTeleversement>();
  (lignesDeLaFeuille[0] ?? []).forEach((enTete, index) => {
    const cle = reconnaitreColonne(enTete);
    if (cle && ![...colonnes.values()].some((champ) => champ.cle === cle)) {
      colonnes.set(index, CHAMPS_TELEVERSEMENT_PAR_CLE[cle]);
    }
  });

  const lignes: LigneLue[] = [];
  lignesDeLaFeuille.slice(1).forEach((cellules, index) => {
    if ((cellules ?? []).every(estVide)) {
      return;
    }
    const ligne: LigneLue = { numero: index + 2, valeurs: {}, erreurs: [] };
    colonnes.forEach((champ, colonne) => {
      const valeur = cellules[colonne];
      if (estVide(valeur)) {
        return;
      }
      const lu = lireCellule(champ, typeof valeur === "string" ? valeur.trim() : valeur);
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
  };
}

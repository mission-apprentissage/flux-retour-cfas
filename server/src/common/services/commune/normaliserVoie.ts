const ABREVIATIONS: Record<string, string> = {
  r: "rue",
  av: "avenue",
  ave: "avenue",
  bd: "boulevard",
  bld: "boulevard",
  blvd: "boulevard",
  pl: "place",
  imp: "impasse",
  all: "allee",
  ch: "chemin",
  che: "chemin",
  rte: "route",
  sq: "square",
  res: "residence",
  fg: "faubourg",
  qu: "quai",
  crs: "cours",
  st: "saint",
  ste: "sainte",
  lot: "lotissement",
};

const MOTS_VIDES = new Set(["de", "du", "des", "la", "le", "les", "l", "d", "et", "a", "au", "aux"]);

export function normaliserVoie(texte: string | null | undefined): string {
  if (!texte) return "";

  return texte
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((mot) => mot && !MOTS_VIDES.has(mot))
    .map((mot) => ABREVIATIONS[mot] ?? mot)
    .join(" ");
}

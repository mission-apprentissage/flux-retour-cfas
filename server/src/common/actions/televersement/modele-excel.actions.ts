import ExcelJs from "exceljs";
import {
  CATALOGUE_CHAMPS_TELEVERSEMENT,
  CHAMPS_TELEVERSEMENT_PAR_CLE,
  type ChampTeleversement,
} from "shared/constants";

const LIGNES_DE_SAISIE = 5000;

const VALEURS_PERMISES: Record<string, string[]> = {
  sexe_apprenant: ["F", "M"],
  annee_formation: ["1", "2", "3", "4", "5"],
};

const COLONNES_TEXTE = new Set([
  "code_postal_apprenant",
  "code_postal_de_naissance_apprenant",
  "code_commune_insee_apprenant",
  "code_commune_insee_de_naissance_apprenant",
  "tel_apprenant",
  "ine_apprenant",
  "etablissement_responsable_uai",
  "etablissement_responsable_siret",
  "etablissement_formateur_uai",
  "etablissement_formateur_siret",
  "etablissement_lieu_de_formation_uai",
  "etablissement_lieu_de_formation_siret",
  "etablissement_lieu_de_formation_code_postal",
  "formation_rncp",
  "formation_cfd",
  "siret_employeur",
  "siret_employeur_2",
  "siret_employeur_3",
  "siret_employeur_4",
]);

const formatDeColonne = (champ: ChampTeleversement) => {
  if (champ.type === "date") {
    return { numFmt: "dd/mm/yyyy" };
  }
  return COLONNES_TEXTE.has(champ.cle) ? { numFmt: "@" } : {};
};

const valeursPermises = (champ: ChampTeleversement) =>
  VALEURS_PERMISES[champ.cle] ?? (champ.type === "boolean" ? ["Oui", "Non"] : null);

const libelleObligation = (champ: ChampTeleversement) => {
  switch (champ.obligation) {
    case "obligatoire":
      return "Obligatoire";
    case "un_des_deux":
      return `Obligatoire, ou à défaut : ${CHAMPS_TELEVERSEMENT_PAR_CLE[champ.avec as string].libelle}`;
    case "selon_contrat":
      return "Obligatoire si le contrat a une fin, une rupture ou une cause de rupture";
    default:
      return "Facultatif";
  }
};

async function construireModeleExcel(): Promise<Buffer> {
  const champs = CATALOGUE_CHAMPS_TELEVERSEMENT.filter((champ) => !champ.sifa);
  const workbook = new ExcelJs.Workbook();

  const saisie = workbook.addWorksheet("Effectifs", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { outlineLevelCol: 1 },
  });
  saisie.columns = champs.map((champ) => ({
    header: champ.libelle,
    key: champ.cle,
    width: Math.max(14, champ.libelle.length + 4),
    outlineLevel: champ.obligation === "facultatif" ? 1 : 0,
    hidden: champ.obligation === "facultatif",
    style: formatDeColonne(champ),
  }));

  const enTetes = saisie.getRow(1);
  enTetes.font = { bold: true };
  champs.forEach((champ, index) => {
    enTetes.getCell(index + 1).note = `Nom technique : ${champ.cle}\n${libelleObligation(champ)}`;
    const valeurs = valeursPermises(champ);
    if (valeurs) {
      const lettre = saisie.getColumn(champ.cle).letter;
      for (let ligne = 2; ligne <= LIGNES_DE_SAISIE + 1; ligne++) {
        saisie.getCell(`${lettre}${ligne}`).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${valeurs.join(",")}"`],
        };
      }
    }
  });

  const aide = workbook.addWorksheet("Aide");
  aide.columns = [
    { header: "Colonne", key: "libelle", width: 36 },
    { header: "Nom technique", key: "cle", width: 40 },
    { header: "Obligation", key: "obligation", width: 48 },
    { header: "Format", key: "format", width: 40 },
    { header: "Exemple", key: "exemple", width: 24 },
    { header: "Aide", key: "aide", width: 90 },
  ];
  aide.getRow(1).font = { bold: true };
  aide.views = [{ state: "frozen", ySplit: 1 }];
  aide.addRows(
    champs.map((champ) => ({
      libelle: champ.libelle,
      cle: champ.cle,
      obligation: libelleObligation(champ),
      format: champ.format,
      exemple: champ.exemple,
      aide: champ.aide,
    }))
  );

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

let modeleEnCache: Promise<Buffer> | null = null;

export function genererModeleExcelTeleversement(): Promise<Buffer> {
  if (!modeleEnCache) {
    modeleEnCache = construireModeleExcel().catch((err) => {
      modeleEnCache = null;
      throw err;
    });
  }
  return modeleEnCache;
}

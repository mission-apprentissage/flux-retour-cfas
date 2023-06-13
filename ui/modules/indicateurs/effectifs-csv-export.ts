import { escapeCSVField } from "@/common/utils/stringUtils";

export function getEffectifsCSVColumns(): string[] {
  return [
    "organisme_uai",
    "organisme_siret",
    "organisme_nom",
    "organisme_nature",

    "apprenant_nom",
    "apprenant_prenom",
    "apprenant_date_de_naissance",

    "formation_cfd",
    "formation_rncp",
    "formation_libelle_long",
    "formation_annee",
    "formation_niveau",
    "formation_date_debut_formation",
    "formation_date_fin_formation",
  ];
}

function getEffectifsCSVFields(effectif: any): any[] {
  return [
    effectif.organisme_uai,
    effectif.organisme_siret,
    effectif.organisme_nom,
    effectif.organisme_nature,

    effectif.apprenant_nom,
    effectif.apprenant_prenom,
    effectif.apprenant_date_de_naissance,

    effectif.formation_cfd,
    effectif.formation_rncp,
    effectif.formation_libelle_long,
    effectif.formation_annee,
    effectif.formation_niveau,
    effectif.formation_date_debut_formation,
    effectif.formation_date_fin_formation,
  ].map((v) => escapeCSVField(v));
}

export function exportEffectifsAsCSV(effectifs: any[]): string {
  return [
    getEffectifsCSVColumns().join(","),
    ...effectifs.map((effectif) => getEffectifsCSVFields(effectif).join(",")),
  ].join("\n");
}

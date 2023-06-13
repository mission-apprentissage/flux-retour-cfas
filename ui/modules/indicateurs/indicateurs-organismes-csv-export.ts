import { escapeCSVField } from "@/common/utils/stringUtils";

import { IndicateursEffectifsAvecOrganisme } from "../models/indicateurs";

export function getIndicateursParOrganismeCSVColumns(): string[] {
  return [
    "organisme_uai",
    "organisme_siret",
    "organisme_nom",
    "organisme_nature",

    "apprentis",
    "inscritsSansContrat",
    "rupturants",
    "sorties",
  ];
}

function getIndicateursParOrganismeCSVFields(indicateurs: IndicateursEffectifsAvecOrganisme): any[] {
  return [
    indicateurs.uai,
    indicateurs.siret,
    indicateurs.nom,
    indicateurs.nature,

    `${indicateurs.apprentis}`,
    `${indicateurs.inscritsSansContrat}`,
    `${indicateurs.rupturants}`,
    `${indicateurs.abandons}`,
  ].map((v) => escapeCSVField(v));
}

export function exportIndicateursParOrganismeAsCSV(effectifs: any[]): string {
  return [
    getIndicateursParOrganismeCSVColumns().join(","),
    ...effectifs.map((effectif) => getIndicateursParOrganismeCSVFields(effectif).join(",")),
  ].join("\n");
}

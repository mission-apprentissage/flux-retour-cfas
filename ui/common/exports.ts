import { ExportColumn } from "./utils/exportUtils";

export const indicateursParOrganismeExportColumns: ExportColumn[] = [
  {
    label: "organisme_uai",
    key: "uai",
    width: 15,
  },
  {
    label: "organisme_siret",
    key: "siret",
    width: 15,
  },
  {
    label: "organisme_nom",
    key: "nom",
    width: 60,
  },
  {
    label: "organisme_nature",
    key: "nature",
    width: 20,
  },
  {
    label: "apprentis",
    key: "apprentis",
    width: 10,
  },
  {
    label: "inscritsSansContrat",
    key: "inscritsSansContrat",
    width: 16,
  },
  {
    label: "rupturants",
    key: "rupturants",
    width: 10,
  },
  {
    label: "sorties",
    key: "abandons",
    width: 10,
  },
];

export const effectifsExportColumns: ExportColumn[] = [
  {
    label: "organisme_uai",
    key: "organisme_uai",
    width: 15,
  },
  {
    label: "organisme_siret",
    key: "organisme_siret",
    width: 15,
  },
  {
    label: "organisme_nom",
    key: "organisme_nom",
    width: 60,
  },
  {
    label: "organisme_nature",
    key: "organisme_nature",
    width: 20,
  },
  {
    label: "apprenant_nom",
    key: "apprenant_nom",
    width: 20,
  },
  {
    label: "apprenant_prenom",
    key: "apprenant_prenom",
    width: 20,
  },
  {
    label: "apprenant_date_de_naissance",
    key: "apprenant_date_de_naissance",
    width: 20,
  },
  {
    label: "formation_cfd",
    key: "formation_cfd",
    width: 15,
  },
  {
    label: "formation_rncp",
    key: "formation_rncp",
    width: 15,
  },
  {
    label: "formation_libelle_long",
    key: "formation_libelle_long",
    width: 40,
  },
  {
    label: "formation_annee",
    key: "formation_annee",
    width: 15,
  },
  {
    label: "formation_niveau",
    key: "formation_niveau",
    width: 15,
  },
  {
    label: "formation_date_debut_formation",
    key: "formation_date_debut_formation",
    width: 20,
  },
  {
    label: "formation_date_fin_formation",
    key: "formation_date_fin_formation",
    width: 20,
  },
];

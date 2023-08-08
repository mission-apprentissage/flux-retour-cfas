import { Organisme } from "./internal/Organisme";
import { ExportColumn } from "./utils/exportUtils";

export const indicateursParOrganismeExportColumns = [
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
] as const satisfies ReadonlyArray<ExportColumn>;

export const effectifsExportColumns = [
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
    label: "apprenant_statut",
    key: "apprenant_statut",
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
] as const satisfies ReadonlyArray<ExportColumn>;

export const organismesExportColumns = [
  {
    label: "uai",
    key: "uai",
    width: 15,
  },
  {
    label: "siret",
    key: "siret",
    width: 15,
  },
  {
    label: "raison_sociale",
    key: "raison_sociale",
    width: 60,
  },
  {
    label: "enseigne",
    key: "enseigne",
    width: 60,
  },
  {
    label: "nature",
    key: "nature",
    width: 20,
  },
  {
    label: "departement",
    key: "departement",
    width: 10,
  },
  {
    label: "commune",
    key: "commune",
    width: 40,
  },
  {
    label: "adresse",
    key: "adresse",
    width: 120,
  },
] as const satisfies ReadonlyArray<ExportColumn>;

export function convertOrganismeToExport(
  organisme: Organisme
): Record<(typeof organismesExportColumns)[number]["key"], string> {
  return {
    uai: organisme.uai ?? "",
    siret: organisme.siret,
    raison_sociale: organisme.raison_sociale ?? "",
    enseigne: organisme.enseigne ?? "",
    nature: organisme.nature,
    departement: organisme.adresse?.departement ?? "",
    commune: organisme.adresse?.commune ?? "",
    adresse: organisme.adresse?.complete ?? "",
  };
}

export const formationsExportColumns = [
  {
    label: "intitule_long",
    key: "intitule_long",
    width: 60,
  },
  {
    label: "duree",
    key: "duree",
    width: 10,
  },
  {
    label: "niveau",
    key: "niveau",
    width: 20,
  },
  {
    label: "cfd",
    key: "cfd",
    width: 15,
  },
  {
    label: "rncp",
    key: "rncp_code",
    width: 15,
  },
  {
    label: "cle_ministere_educatif",
    key: "cle_ministere_educatif",
    width: 60,
  },
  {
    label: "lieu_formation_adresse",
    key: "lieu_formation_adresse",
    width: 80,
  },
] as const satisfies ReadonlyArray<ExportColumn>;

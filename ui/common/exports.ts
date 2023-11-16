import { Organisme } from "./internal/Organisme";
import { formatDateNumericDayMonthYear } from "./utils/dateUtils";
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
    xlsxType: "string",
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
    xlsxType: "string",
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
    xlsxType: "date",
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
    xlsxType: "string",
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
    xlsxType: "date",
    width: 20,
  },
  {
    label: "formation_date_fin_formation",
    key: "formation_date_fin_formation",
    xlsxType: "date",
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
    xlsxType: "string",
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
    xlsxType: "string",
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
  {
    label: "dernière transmission",
    key: "last_transmission_date",
    xlsxType: "date",
    width: 120,
  },
] as const satisfies ReadonlyArray<ExportColumn>;

export const usersExportColumns = [
  { label: "account_status", key: "account_status", width: 20 },
  { label: "civility", key: "civility", width: 20 },
  { label: "created_at", key: "created_at", width: 20, xlsxType: "date" },
  { label: "nom", key: "nom", width: 20 },
  { label: "prenom", key: "prenom", width: 20 },
  { label: "email", key: "email", width: 20 },
  { label: "telephone", key: "telephone", width: 20, xlsxType: "string" },
  { label: "fonction", key: "fonction", width: 20 },
  { label: "organisation.type", key: "organisation.type", width: 20 },
  { label: "organisation.siret", key: "organisation.siret", width: 20, xlsxType: "string" },
  { label: "organisation.uai", key: "organisation.uai", width: 20, xlsxType: "string" },
  { label: "organisation.label", key: "organisation.label", width: 20 },
  { label: "organisation.organisme.nature", key: "organisation.organisme.nature", width: 20 },
  { label: "organisation.organisme.nature", key: "organisation.organisme.nature", width: 20 },
  { label: "organisation.organisme.nom", key: "organisation.organisme.nom", width: 20 },
  { label: "organisation.organisme.raison_sociale", key: "organisation.organisme.raison_sociale", width: 20 },
  { label: "organisation.organisme.reseaux", key: "organisation.organisme.reseaux", width: 20 },
  { label: "password_updated_at", key: "password_updated_at", width: 20, xlsxType: "date" },
  { label: "has_accept_cgu_version", key: "has_accept_cgu_version", width: 20 },
  { label: "last_connection", key: "last_connection", width: 20, xlsxType: "date" },
  { label: "_id", key: "_id", width: 20 },
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
    last_transmission_date: organisme.last_transmission_date
      ? formatDateNumericDayMonthYear(organisme.last_transmission_date)
      : "",
  };
}

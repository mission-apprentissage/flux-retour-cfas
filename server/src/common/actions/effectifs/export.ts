import { getStatutApprenantNameFromCode } from "shared/constants/dossierApprenant";

export type FieldExport = {
  label: string;
  csvField: string;
  projectedMongoField?: string;
  valueGetter: (item: any) => any;
};

export const exportedFields: FieldExport[] = [
  {
    label: "Intitulé de la formation",
    csvField: "formation_libelle_long",
    projectedMongoField: "formation.libelle_long",
    valueGetter: (item) => item.formation.libelle_long,
  },
  {
    label: "Code formation diplôme",
    csvField: "formation_cfd",
    projectedMongoField: "formation.cfd",
    valueGetter: (item) => item.formation.cfd,
  },
  {
    label: "RNCP",
    csvField: "formation_rncp",
    projectedMongoField: "formation.rncp",
    valueGetter: (item) => item.formation.rncp,
  },
  {
    label: "Année de la formation",
    csvField: "formation_annee",
    projectedMongoField: "formation.annee",
    valueGetter: (item) => item.formation.annee,
  },
  {
    label: "Date de début de la formation",
    csvField: "date_debut_formation",
    projectedMongoField: "date_debut_formation",
    valueGetter: (item) => item.date_debut_formation,
  },
  {
    label: "Date de fin de la formation",
    csvField: "date_fin_formation",
    projectedMongoField: "date_fin_formation",
    valueGetter: (item) => item.date_fin_formation,
  },
  {
    label: "UAI de l’organisme de formation",
    csvField: "organisme_uai",
    projectedMongoField: "organisme.uai",
    valueGetter: (item) => item.organisme[0].uai,
  },
  {
    label: "SIRET de l’organisme de formation",
    csvField: "organisme_siret",
    projectedMongoField: "organisme.siret",
    valueGetter: (item) => item.organisme[0].siret,
  },
  {
    label: "Dénomination de l’organisme",
    csvField: "organisme_nom",
    projectedMongoField: "organisme.nom",
    valueGetter: (item) => item.organisme[0].nom,
  },
  {
    label: "Réseau(x)",
    csvField: "organisme_reseaux",
    projectedMongoField: "organisme.reseaux",
    valueGetter: (item) => item.organisme[0].reseaux,
  },
  {
    label: "Région de l’organisme",
    csvField: "organisme_region",
    projectedMongoField: "organisme.adresse.region",
    valueGetter: (item) => item.organisme[0].adresse.region,
  },
  {
    label: "Département de l’organisme",
    csvField: "organisme_departement",
    projectedMongoField: "organisme.adresse.departement",
    valueGetter: (item) => item.organisme[0].adresse.departement,
  },
  {
    label: "Statut apprennant",
    csvField: "statut",
    valueGetter: (item) => getStatutApprenantNameFromCode(item.statut_apprenant_at_date.valeur_statut),
  },
  {
    label: "Historique apprenant",
    csvField: "historique_statut_apprenant",
    valueGetter: (item) =>
      JSON.stringify(
        item.apprenant.historique_statut.map((item) => ({
          date: item.date_statut,
          statut: getStatutApprenantNameFromCode(item.valeur_statut),
        }))
      ),
  },
];

/**
 * Contains the MongoDB projection with all exported fields
 * "apprenant.nom": 1,
 * "apprenant.prenom": 1,
 */
export const exportedMongoFieldsProjection = exportedFields
  .map((item) => item.projectedMongoField)
  .reduce((acc, projectedMongoField) => {
    if (projectedMongoField) {
      acc[projectedMongoField] = 1;
    }
    return acc;
  }, {});

export function mapMongoObjectToCSVObject(item) {
  return exportedFields.reduce((acc, exportedField) => {
    acc[exportedField.csvField] = exportedField.valueGetter(item);
    return acc;
  }, {});
}

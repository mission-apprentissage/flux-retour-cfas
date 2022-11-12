import { object, string, arrayOf, integer, date, objectId } from "./json-schema/jsonSchemaTypes";

export const collectionName = "effectifsApprenants";

export const schema = object({
  _id: objectId(),
  dossierApprenantId: string({ description: "Identifiant du dossier apprenant d'origine" }),
  uai_etablissement: string({ description: "Code uai de l'établissement d'origine" }),
  nom_etablissement: string({ description: "Nom de l'établissement d'origine" }),
  formation_cfd: string({ description: "CFD de la formation du dossierApprenant" }),
  periode_formation: arrayOf(integer(), { description: "Date debut & date de fin de la formation" }),
  annee_formation: integer({ description: "Numéro de l'année dans la formation (promo)" }),
  annee_scolaire: string({
    description: 'Année scolaire sur laquelle le dossierApprenant est enregistré (ex: "2020-2021")',
  }),
  code_commune_insee_apprenant: string({ description: "Code commune insee du jeune" }),
  date_de_naissance_apprenant: date({ description: "Date de naissance du jeune" }),
  contrat_date_debut: date({ description: "Date de début du contrat" }),
  contrat_date_fin: date({ description: "Date de fin du contrat" }),
  contrat_date_rupture: date({ description: "Date de rupture du contrat" }),
  formation_rncp: string({ description: "Code RNCP de la formation du dossierApprenant" }),
  indicateur_effectif: string({ description: "Indicateur lié au dossierApprenant" }),
  updated_at: date({ description: "Date d'ajout en base de données" }),
  created_at: date({ description: "Date d'ajout en base de données" }),
});

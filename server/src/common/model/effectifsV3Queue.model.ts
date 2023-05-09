import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { CODES_STATUT_APPRENANT_ENUM } from "@/common/constants/dossierApprenant";

import effectifsModel from "./effectifs.model/effectifs.model";
import { apprenantSchema } from "./effectifs.model/parts/apprenant.part";
import { contratSchema } from "./effectifs.model/parts/contrat.part";
import { formationEffectifSchema } from "./effectifs.model/parts/formation.effectif.part";
import { internalFields } from "./effectifsQueue.model";
import { object, any } from "./json-schema/jsonSchemaTypes";
import organismesModel from "./organismes.model";

const collectionName = "effectifsV3Queue";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ effectif_id: 1 }, {}],
  [{ processed_at: 1 }, {}],
  [{ created_at: 1 }, {}],
  [{ id_erp_apprenant: 1 }, {}],
  [{ source: 1 }, {}],
  [{ annee_scolaire: 1 }, {}],
];

const effectifsProps = effectifsModel.schema.properties;
const formationProps = formationEffectifSchema.properties;
const organismeProps = organismesModel.schema.properties;
const contratProps = contratSchema.properties;
const apprenantProps = apprenantSchema.properties;

/**
 * this schema doesn't contain any constraint
 */
export const schema = object(
  {
    apprenant: object({
      nom: any({ description: apprenantProps.nom.description }),
      prenom: any({ description: apprenantProps.prenom.description }),
      date_de_naissance: any({ description: apprenantProps.date_de_naissance.description }),
      statut: any({ description: CODES_STATUT_APPRENANT_ENUM.join(",") }),
      date_metier_mise_a_jour_statut: any(),
      id_erp: any({ description: effectifsProps.id_erp_apprenant.description }),
      // V1 - OPTIONAL FIELDS
      ine: any({ description: apprenantProps.ine.description }),
      email: any({ description: apprenantProps.courriel.description }),
      telephone: any({ description: apprenantProps.telephone.description }),
      code_commune_insee: any({ description: apprenantProps.adresse.properties.code_insee.description }),
      // V3 - OPTIONAL FIELDS
      sexe: any({ description: apprenantProps.sexe.description }),
      rqth: any({ description: "Reconnaissance de la Qualité de Travailleur Handicapé de l'apprenant" }),
      date_rqth: any({ description: "Date de reconnaissance du RQTH de l'apprenant" }),
    }),
    etablissement_responsable: object(
      {
        siret: any({ description: organismeProps.siret.description }),
        uai: any({ description: organismeProps.uai.description }),
        nom: any({ description: organismeProps.nom.description }),
        code_commune_insee: any({ description: organismeProps.adresse.properties.code_insee.description }),
      },
      { description: "Information sur l'établissement responsable" }
    ),
    etablissement_formateur: object(
      {
        siret: any({ description: organismeProps.siret.description }),
        uai: any({ description: organismeProps.uai.description }),
        nom: any({ description: organismeProps.nom.description }),
        code_commune_insee: any({ description: organismeProps.adresse.properties.code_insee.description }),
      },
      { description: "Information sur l'établissement formateur" }
    ),
    formation: object({
      libelle_long: any({ description: formationProps.libelle_long.description }),
      periode: any({ description: formationProps.periode.description }),
      annee_scolaire: any({ description: effectifsProps.annee_scolaire.description }),
      annee: any({ description: formationProps.annee.description }),
      code_rncp: any({ description: formationProps.rncp.description }),
      code_cfd: any({ description: formationProps.cfd.description }),
      // V3 - REQUIRED FIELDS
      date_inscription: any({ description: formationProps.date_debut_formation.description }),
      date_entree: any({ description: formationProps.date_debut_formation.description }),
      date_fin: any({ description: formationProps.date_fin_formation.description }),
      // V3 - OPTIONAL FIELDS
      obtention_diplome: any(),
      date_obtention_diplome: any({ description: formationProps.date_obtention_diplome.description }),
      date_exclusion: any(),
      cause_exclusion: any(),
      referent_handicap: object({
        nom: any(),
        prenom: any(),
        email: any(),
      }),
    }),
    contrat: object(
      {
        date_debut: any({ description: contratProps.date_debut.description }),
        date_fin: any({ description: contratProps.date_fin.description }),
        date_rupture: any({ description: contratProps.date_rupture.description }),
        // V3 - OPTIONAL FIELDS
        cause_rupture: any({ description: contratProps.cause_rupture.description }),
      },
      { description: "Information sur le contrat d'apprentissage" }
    ),
    employeur: object(
      {
        siret: any({ description: organismeProps.siret.description }),
        code_commune_insee: any({ description: organismeProps.adresse.properties.code_insee.description }),
        code_naf: any({ description: "Code NAF de l'employeur" }),
      },
      { description: "Information sur l'employeur de l'apprenti" }
    ),

    // internal fields
    ...internalFields,
  },
  {
    additionalProperties: true,
  }
);

// Default value
export function defaultValuesEffectifQueue() {
  return {
    validation_errors: [],
    updated_at: new Date(),
    created_at: new Date(),
  };
}

export default { schema, indexes, collectionName };

import { primitivesV1, primitivesV3 } from "shared/models/data/zodPrimitives";
import { z } from "zod";

/**
 * Note: ce schema est seulement utilisé pour générer la documentation OpenAPI pour l'API v1.
 * Les données entrantes de l'API V1 sont validées par dossierApprenantSchema (Joi).
 * @returns
 */
const dossierApprenantSchemaV1V2 = () =>
  z.object({
    // REQUIRED FIELDS
    nom_apprenant: primitivesV1.apprenant.nom,
    prenom_apprenant: primitivesV1.apprenant.prenom,
    date_de_naissance_apprenant: primitivesV1.apprenant.date_de_naissance,
    uai_etablissement: primitivesV1.etablissement_responsable.uai,
    nom_etablissement: primitivesV1.etablissement_responsable.nom,
    id_formation: primitivesV1.formation.code_cfd,
    annee_scolaire: primitivesV1.formation.annee_scolaire,
    statut_apprenant: primitivesV1.apprenant.statut,
    date_metier_mise_a_jour_statut: primitivesV1.apprenant.date_metier_mise_a_jour_statut,
    id_erp_apprenant: primitivesV1.apprenant.id_erp,
    source: primitivesV1.source,

    // OPTIONAL FIELDS
    api_version: primitivesV1.api_version.optional(),
    ine_apprenant: primitivesV1.apprenant.ine.optional(),
    email_contact: primitivesV1.apprenant.email.optional(),
    tel_apprenant: primitivesV1.apprenant.telephone.nullish(),
    code_commune_insee_apprenant: primitivesV1.apprenant.code_commune_insee.optional(),
    siret_etablissement: primitivesV1.etablissement_responsable.siret.optional(),
    libelle_court_formation: primitivesV1.formation.libelle_court.optional(),
    libelle_long_formation: primitivesV1.formation.libelle_long.optional(),
    periode_formation: primitivesV1.formation.periode.nullish(),
    annee_formation: primitivesV1.formation.annee.optional(),
    formation_rncp: primitivesV1.formation.code_rncp.optional(),
    contrat_date_debut: primitivesV1.contrat.date_debut.optional(),
    contrat_date_fin: primitivesV1.contrat.date_fin.optional(),
    contrat_date_rupture: primitivesV1.contrat.date_rupture.optional(),

    // OPTIONAL V2 BUT REQUIRED V3

    date_inscription_formation: primitivesV3.formation.date_inscription.optional(),
    date_entree_formation: primitivesV3.formation.date_entree.optional(),
    date_fin_formation: primitivesV3.formation.date_fin.optional(),
  });

export type DossierApprenantSchemaV1V2ZodType = z.input<ReturnType<typeof dossierApprenantSchemaV1V2>>;

export default dossierApprenantSchemaV1V2;

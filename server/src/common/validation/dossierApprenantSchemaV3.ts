import { z } from "zod";

import { primitivesV1, primitivesV3 } from "@/common/validation/utils/zodPrimitives";

const dossierApprenantSchemaV3 = () =>
  z.object({
    // REQUIRED FIELDS
    nom_apprenant: primitivesV1.apprenant.nom,
    prenom_apprenant: primitivesV1.apprenant.prenom,
    date_de_naissance_apprenant: primitivesV1.apprenant.date_de_naissance,
    // The following fields are missing in V3
    // uai_etablissement: primitivesV1.etablissement_responsable.uai,
    // nom_etablissement: primitivesV1.etablissement_responsable.nom,
    // id_formation: primitivesV1.formation.code_cfd,
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
    // The following field is missing in V3
    // siret_etablissement: primitivesV1.etablissement_responsable.siret.optional(),
    // code_commune_insee_apprenant: primitivesV1.apprenant.code_commune_insee.optional(),
    libelle_court_formation: primitivesV1.formation.libelle_court.optional(),
    // The following field are missing in V3
    // libelle_long_formation: primitivesV1.formation.libelle_long.optional(),
    // periode_formation: primitivesV1.formation.periode.nullish(),
    annee_formation: primitivesV1.formation.annee.optional(),
    formation_rncp: primitivesV1.formation.code_rncp.optional(),
    contrat_date_debut: primitivesV1.contrat.date_debut.optional(),
    contrat_date_fin: primitivesV1.contrat.date_fin.optional(),
    contrat_date_rupture: primitivesV1.contrat.date_rupture.optional(),

    // V3 FIELDS
    // OPTIONAL FIELDS
    nir_apprenant: primitivesV3.apprenant.nir.optional(),
    adresse_apprenant: primitivesV3.apprenant.adresse.optional(),
    code_postal_apprenant: primitivesV3.apprenant.code_postal.optional(),
    sexe_apprenant: primitivesV3.apprenant.sexe.optional(),
    rqth_apprenant: primitivesV3.apprenant.rqth.optional(),
    date_rqth_apprenant: primitivesV3.apprenant.date_rqth.optional(),
    responsable_apprenant_mail1: primitivesV3.responsable.email.optional(),
    responsable_apprenant_mail2: primitivesV3.responsable.email.optional(),
    obtention_diplome_formation: primitivesV3.formation.obtention_diplome.optional(),
    date_obtention_diplome_formation: primitivesV3.formation.date_obtention_diplome.optional(),
    date_exclusion_formation: primitivesV3.formation.date_exclusion.optional(),
    cause_exclusion_formation: primitivesV3.formation.cause_exclusion.optional(),
    nom_referent_handicap_formation: primitivesV3.formation.referent_handicap.nom.optional(),
    prenom_referent_handicap_formation: primitivesV3.formation.referent_handicap.prenom.optional(),
    email_referent_handicap_formation: primitivesV3.formation.referent_handicap.email.optional(),
    cause_rupture_contrat: primitivesV3.contrat.cause_rupture.optional(),
    contrat_date_debut_2: primitivesV1.contrat.date_debut.optional(),
    contrat_date_fin_2: primitivesV1.contrat.date_fin.optional(),
    contrat_date_rupture_2: primitivesV1.contrat.date_rupture.optional(),
    cause_rupture_contrat_2: primitivesV3.contrat.cause_rupture.optional(),
    contrat_date_debut_3: primitivesV1.contrat.date_debut.optional(),
    contrat_date_fin_3: primitivesV1.contrat.date_fin.optional(),
    contrat_date_rupture_3: primitivesV1.contrat.date_rupture.optional(),
    cause_rupture_contrat_3: primitivesV3.contrat.cause_rupture.optional(),
    contrat_date_debut_4: primitivesV1.contrat.date_debut.optional(),
    contrat_date_fin_4: primitivesV1.contrat.date_fin.optional(),
    contrat_date_rupture_4: primitivesV1.contrat.date_rupture.optional(),
    cause_rupture_contrat_4: primitivesV3.contrat.cause_rupture.optional(),
    siret_employeur: primitivesV3.employeur.siret.optional(),
    siret_employeur_2: primitivesV3.employeur.siret.optional(),
    siret_employeur_3: primitivesV3.employeur.siret.optional(),
    siret_employeur_4: primitivesV3.employeur.siret.optional(),
    formation_presentielle: primitivesV3.formation.presentielle.optional(),

    // REQUIRED FIELDS
    date_inscription_formation: primitivesV3.formation.date_inscription,
    date_entree_formation: primitivesV3.formation.date_entree,
    date_fin_formation: primitivesV3.formation.date_fin,
    duree_theorique_formation: primitivesV3.formation.duree_theorique,

    etablissement_responsable_uai: primitivesV1.etablissement_responsable.uai,
    etablissement_responsable_siret: primitivesV1.etablissement_responsable.siret,
    etablissement_formateur_uai: primitivesV1.etablissement_formateur.uai,
    etablissement_formateur_siret: primitivesV1.etablissement_formateur.siret,

    formation_cfd: primitivesV1.formation.code_cfd,
  });

export type DossierApprenantSchemaV3ZodType = z.input<ReturnType<typeof dossierApprenantSchemaV3>>;

export default dossierApprenantSchemaV3;

export interface EffectifsQueue {
  nom_apprenant?: any; // Nom de l'apprenant
  prenom_apprenant?: any; // Prénom de l'apprenant
  date_de_naissance_apprenant?: any; // Date de naissance de l'apprenant
  uai_etablissement?: any; // Code UAI de l'établissement
  nom_etablissement?: any; // Nom de l'organisme de formation
  id_formation?: any; // Code CFD de la formation
  annee_scolaire?: any; // Année scolaire sur laquelle l'apprenant est enregistré (ex: "2020-2021")
  statut_apprenant?: any; // 0,2,3
  date_metier_mise_a_jour_statut?: any;
  id_erp_apprenant?: any; // Identifiant de l'apprenant dans l'erp
  ine_apprenant?: any; // N° INE de l'apprenant
  email_contact?: any; // Adresse mail de contact de l'apprenant
  tel_apprenant?: any; // Téléphone de l'apprenant
  code_commune_insee_apprenant?: any; // Code commune insee de l'apprenant
  siret_etablissement?: any; // N° SIRET de l'établissement
  libelle_long_formation?: any; // Libellé long de la formation visée
  periode_formation?: any; // Période de la formation, en année (peut être sur plusieurs années)
  annee_formation?: any; // Numéro de l'année dans la formation (promo)
  formation_rncp?: any; // Code RNCP de la formation à laquelle l'apprenant est inscrit
  contrat_date_debut?: any; // Date de début du contrat
  contrat_date_fin?: any; // Date de fin du contrat
  contrat_date_rupture?: any; // Date de rupture du contrat
  nir_apprenant?: any; // Identification nationale securité social
  adresse_apprenant?: any; // Adresse de l'apprenant
  code_postal_apprenant?: any; // Code postal de l'apprenant
  sexe_apprenant?: any; // Sexe de l'apprenant (M: Homme, F: Femme)
  rqth_apprenant?: any; // Reconnaissance de la Qualité de Travailleur Handicapé de l'apprenant
  date_rqth_apprenant?: any; // Date de reconnaissance du RQTH de l'apprenant
  responsable_apprenant_mail1?: any; // Mail du responsable de l'apprenant
  responsable_apprenant_mail2?: any; // Mail du responsable de l'apprenant
  obtention_diplome_formation?: any;
  date_obtention_diplome_formation?: any; // Date d'obtention du diplôme
  date_exclusion_formation?: any;
  cause_exclusion_formation?: any;
  nom_referent_handicap_formation?: any;
  prenom_referent_handicap_formation?: any;
  email_referent_handicap_formation?: any;
  cause_rupture_contrat?: any; // Cause de rupture du contrat
  contrat_date_debut_2?: any; // Date de début du contrat 2
  contrat_date_fin_2?: any; // Date de fin du contrat 2
  contrat_date_rupture_2?: any; // Date de rupture du contrat 2
  cause_rupture_contrat_2?: any; // Cause de rupture du contrat 2
  contrat_date_debut_3?: any; // Date de début du contrat 3
  contrat_date_fin_3?: any; // Date de fin du contrat 3
  contrat_date_rupture_3?: any; // Date de rupture du contrat 3
  cause_rupture_contrat_3?: any; // Cause de rupture du contrat 3
  contrat_date_debut_4?: any; // Date de début du contrat 4
  contrat_date_fin_4?: any; // Date de fin du contrat 4
  contrat_date_rupture_4?: any; // Date de rupture du contrat 4
  cause_rupture_contrat_4?: any; // Cause de rupture du contrat 4
  siret_employeur?: any; // N° SIRET de l'établissement
  siret_employeur_2?: any; // N° SIRET de l'établissement
  siret_employeur_3?: any; // N° SIRET de l'établissement
  siret_employeur_4?: any; // N° SIRET de l'établissement
  formation_presentielle?: any; // Formation 100% à distance ou non
  date_inscription_formation?: any; // Date de début de la formation
  date_entree_formation?: any; // Date de début de la formation
  date_fin_formation?: any; // Date de fin de la formation
  duree_theorique_formation?: any; // Durée théorique de la formation
  etablissement_responsable_uai?: any; // UAI de l'établissement responsable
  etablissement_responsable_siret?: any; // SIRET de l'établissement responsable
  etablissement_formateur_uai?: any; // UAI de l'établissement formateur
  etablissement_formateur_siret?: any; // SIRET de l'établissement formateur
  etablissement_lieu_de_formation_uai?: any; // UAI de l'établissement de formation
  etablissement_lieu_de_formation_siret?: any; // SIRET de l'établissement de formation
  formation_cfd?: any; // Code CFD de la formation
  source: string; // Source du dossier apprenant (Ymag, Gesti, TDB_MANUEL, TDB_FILE...)
  effectif_id?: any; // Id de l'effectif associé, objectId
  organisme_id?: any; // Id de l'organisme associé, objectId
  updated_at?: Date; // Date de mise à jour en base de données
  created_at: Date; // Date d'ajout en base de données
  processed_at?: Date; // Date de process des données
  error?: any; // Erreur rencontrée lors de la création de l'effectif
  validation_errors?: ValidationError[]; // Erreurs de validation de cet effectif
  api_version?: any; // Version de l'api utilisée pour l'import
}

export interface ValidationError {
  message?: any; // message d'erreur
  path?: any; // champ en erreur
}

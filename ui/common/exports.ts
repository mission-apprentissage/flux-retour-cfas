import { DEPARTEMENTS, IOrganisation, IUsersMigration } from "shared";

import { Organisme } from "./internal/Organisme";
import { ExportColumn } from "./utils/exportUtils";

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
    width: 20,
  },
  {
    label: "formation_date_fin_formation",
    key: "formation_date_fin_formation",
    width: 20,
  },
] as const satisfies ReadonlyArray<ExportColumn>;

export const effectifsExportWithContactColumns = [
  {
    label: "apprenant_telephone",
    key: "apprenant_telephone",
    width: 20,
  },
  {
    label: "apprenant_courriel",
    key: "apprenant_courriel",
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
    label: "region",
    key: "region",
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
  {
    label: "email de contact",
    key: "email",
    width: 60,
  },
  {
    label: "téléphone de contact",
    key: "telephone",
    width: 60,
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
  { label: "organisation.organisme.nom", key: "organisation.organisme.nom", width: 20 },
  { label: "organisation.organisme.raison_sociale", key: "organisation.organisme.raison_sociale", width: 20 },
  { label: "organisation.organisme.reseaux", key: "organisation.organisme.reseaux", width: 20 },
  { label: "code_departement", key: "code_departement", width: 15, xlsxType: "string" },
  { label: "nom_departement", key: "nom_departement", width: 25 },
  { label: "code_region", key: "code_region", width: 15, xlsxType: "string" },
  { label: "nom_region", key: "nom_region", width: 25 },
  { label: "password_updated_at", key: "password_updated_at", width: 20, xlsxType: "date" },
  { label: "has_accept_cgu_version", key: "has_accept_cgu_version", width: 20 },
  { label: "last_connection", key: "last_connection", width: 20, xlsxType: "date" },
  { label: "_id", key: "_id", width: 20 },
] as const satisfies ReadonlyArray<ExportColumn>;

export function convertOrganismeToExport(
  organisme: Organisme & { relatedOrganisation?: IOrganisation; relatedUser?: IUsersMigration }
): Record<(typeof organismesExportColumns)[number]["key"], string> {
  return {
    uai: organisme.uai ?? "",
    siret: organisme.siret,
    raison_sociale: organisme.raison_sociale ?? "",
    enseigne: organisme.enseigne ?? "",
    nature: organisme.nature,
    departement: organisme.adresse?.departement ?? "",
    region: DEPARTEMENTS.find((dept) => dept.region.code === String(organisme.adresse?.region))?.region.nom ?? "",
    commune: organisme.adresse?.commune ?? "",
    adresse: organisme.adresse?.complete ?? "",
    last_transmission_date: organisme.last_transmission_date ?? "",
    email: organisme.relatedUser?.email ?? "",
    telephone: organisme.relatedUser?.telephone ?? "",
  };
}

export const traitementMLExportColumns = [
  { label: "Région", key: "region_nom", width: 30 },
  { label: "Département", key: "departement_nom", width: 25 },
  { label: "Code département", key: "departement_code", xlsxType: "string", width: 18 },
  { label: "Mission Locale", key: "nom", width: 40 },
  { label: "SIRET", key: "siret", xlsxType: "string", width: 15 },
  { label: "Total jeunes", key: "total_jeunes", width: 12 },
  { label: "À traiter", key: "a_traiter", width: 12 },
  { label: "Traités", key: "traites", width: 12 },
  { label: "% Traités", key: "pourcentage_traites", width: 12 },
  { label: "% A recontacter", key: "pourcentage_a_recontacter", width: 15 },
  { label: "% RDV pris", key: "pourcentage_rdv_pris", width: 12 },
  { label: "% Connu de la ML", key: "pourcentage_connu_ml", width: 16 },
  { label: "Date activation", key: "date_activation", xlsxType: "date", width: 15 },
  { label: "Dernière activité", key: "derniere_activite", xlsxType: "date", width: 18 },
  { label: "RDV pris", key: "rdv_pris", width: 10 },
  { label: "Nouveau projet", key: "nouveau_projet", width: 14 },
  { label: "A recontacter", key: "contacte_sans_retour", width: 13 },
  { label: "Injoignable", key: "injoignables", width: 12 },
  { label: "Coordonnées incorrectes", key: "coordonnees_incorrectes", width: 22 },
  { label: "Autre", key: "autre_avec_contact", width: 10 },
  { label: "Collab total", key: "collab_total", width: 12 },
  { label: "Collab non traité", key: "collab_non_traite", width: 16 },
  { label: "Collab traité", key: "collab_traite", width: 13 },
  { label: "Collab à recontacter", key: "collab_a_recontacter", width: 20 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const cfaEtablissementsExportColumns = [
  { label: "Région", key: "region", width: 25 },
  { label: "Département", key: "departement", width: 22 },
  { label: "Raison sociale", key: "nom", width: 45 },
  { label: "UAI", key: "uai", xlsxType: "string", width: 12 },
  { label: "SIRET", key: "siret", xlsxType: "string", width: 16 },
  { label: "Nature", key: "nature", width: 22 },
  { label: "Qualiopi", key: "qualiopi", width: 10 },
  { label: "Code postal", key: "code_postal", xlsxType: "string", width: 12 },
  { label: "Commune", key: "commune", width: 25 },
  { label: "Adresse", key: "adresse", width: 50 },
  { label: "Compte TBA", key: "compte_tba", width: 12 },
  { label: "Collaboration active", key: "collab_active", width: 20 },
  { label: "Collaborations", key: "nb_collaborations", width: 15 },
  { label: "Dernière activité", key: "derniere_activite", xlsxType: "date", width: 18 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const cfaInvitesSansCollabExportColumns = [
  { label: "Raison sociale", key: "raison_sociale", width: 45 },
  { label: "UAI", key: "uai", xlsxType: "string", width: 12 },
  { label: "SIRET", key: "siret", xlsxType: "string", width: 16 },
  { label: "Compte TBA", key: "compte_tba", width: 12 },
  { label: "Code postal", key: "code_postal", xlsxType: "string", width: 12 },
  { label: "Commune", key: "commune", width: 25 },
  { label: "Adresse", key: "adresse", width: 50 },
  { label: "Invitations reçues", key: "invitations_recues", width: 18 },
  { label: "ML invitantes", key: "ml_invitantes", width: 14 },
  { label: "Dernière invitation", key: "derniere_invitation_at", xlsxType: "date", width: 18 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const mlAlertesExportColumns = [
  { label: "Mission Locale", key: "nom", width: 45 },
  { label: "Code postal", key: "code_postal", xlsxType: "string", width: 12 },
  { label: "Commune", key: "commune", width: 25 },
  { label: "Utilise le service", key: "utilise_service", width: 16 },
  { label: "Total dossiers", key: "total_jeunes", width: 14 },
  { label: "À traiter", key: "a_traiter", width: 12 },
  { label: "À recontacter", key: "a_recontacter", width: 14 },
  { label: "Traités (%)", key: "pourcentage_traites", width: 12 },
  { label: "Délai moyen (jours)", key: "delai_moyen_jours", width: 18 },
  { label: "Jours depuis la dernière activité", key: "jours_depuis_activite", width: 28 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const cfaInjoignablesExportColumns = [
  { label: "Raison sociale", key: "nom", width: 45 },
  { label: "UAI", key: "uai", xlsxType: "string", width: 12 },
  { label: "SIRET", key: "siret", xlsxType: "string", width: 16 },
  { label: "Code postal", key: "code_postal", xlsxType: "string", width: 12 },
  { label: "Commune", key: "commune", width: 25 },
  { label: "Adresse", key: "adresse", width: 50 },
  { label: "Dossiers traités par la ML", key: "traites", width: 22 },
  { label: "Jeunes injoignables", key: "injoignables", width: 18 },
  { label: "Taux injoignables (%)", key: "taux", width: 18 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const collaborationDossiersExportColumns = [
  { label: "Prénom", key: "prenom", width: 18 },
  { label: "Nom", key: "nom", width: 22 },
  { label: "Mission Locale", key: "mission_locale", width: 35 },
  { label: "Commune ML", key: "mission_locale_commune", width: 20 },
  { label: "CFA", key: "cfa", width: 40 },
  { label: "Commune CFA", key: "cfa_commune", width: 20 },
  { label: "Statut", key: "statut", width: 28 },
  { label: "Situation du jeune", key: "situation", width: 24 },
  { label: "Objectifs d'accompagnement", key: "objectifs", width: 50 },
  { label: "Résultat du traitement ML", key: "resultat", width: 30 },
  { label: "Date d'envoi", key: "date_envoi", xlsxType: "date", width: 14 },
  { label: "Délai de traitement (jours)", key: "delai_jours", width: 24 },
  { label: "Traité par la ML", key: "traite_par_ml", width: 16 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const traitementRegionExportColumns = [
  { label: "Région", key: "region_nom", width: 30 },
  { label: "Total jeunes", key: "total_jeunes", width: 12 },
  { label: "À traiter", key: "a_traiter", width: 12 },
  { label: "Traités", key: "traites", width: 12 },
  { label: "% Traités", key: "pourcentage_traites", width: 12 },
  { label: "% A recontacter", key: "pourcentage_a_recontacter", width: 15 },
  { label: "% RDV pris", key: "pourcentage_rdv_pris", width: 12 },
  { label: "% Connu de la ML", key: "pourcentage_connu_ml", width: 16 },
  { label: "Nb ML actives", key: "ml_actives", width: 13 },
  { label: "Dernière activité", key: "derniere_activite", xlsxType: "date", width: 18 },
  { label: "RDV pris", key: "rdv_pris", width: 10 },
  { label: "Nouveau projet", key: "nouveau_projet", width: 14 },
  { label: "A recontacter", key: "contacte_sans_retour", width: 13 },
  { label: "Injoignable", key: "injoignables", width: 12 },
  { label: "Coordonnées incorrectes", key: "coordonnees_incorrectes", width: 22 },
  { label: "Autre", key: "autre_avec_contact", width: 10 },
  { label: "Collab total", key: "collab_total", width: 12 },
  { label: "Collab non traité", key: "collab_non_traite", width: 16 },
  { label: "Collab traité", key: "collab_traite", width: 13 },
  { label: "Collab à recontacter", key: "collab_a_recontacter", width: 20 },
] as const satisfies ReadonlyArray<ExportColumn>;

const traitementSegmentBaseColumns = [
  { label: "Région", key: "region_nom", width: 30 },
  { label: "Département", key: "departement_nom", width: 25 },
  { label: "Code département", key: "departement_code", xlsxType: "string", width: 18 },
  { label: "Mission Locale", key: "nom", width: 40 },
  { label: "SIRET", key: "siret", xlsxType: "string", width: 15 },
  { label: "Date activation", key: "date_activation", xlsxType: "date", width: 15 },
  { label: "Dernière activité", key: "derniere_activite", xlsxType: "date", width: 18 },
  { label: "Total jeunes", key: "total_jeunes", width: 12 },
  { label: "À traiter", key: "a_traiter", width: 12 },
  { label: "Traités", key: "traites", width: 12 },
  { label: "% Traités", key: "pourcentage_traites", width: 12 },
  { label: "Ayant répondu", key: "repondu", width: 14 },
  { label: "RDV pris", key: "rdv_pris", width: 10 },
  { label: "Accompagnés découverts", key: "rdv_pris_decouverts", width: 22 },
  { label: "Projet pro sécurisé", key: "projet_pro_securise", width: 18 },
  { label: "Ne souhaite pas d'accompagnement", key: "ne_souhaite_pas_accompagnement", width: 30 },
  { label: "À recontacter", key: "a_recontacter", width: 13 },
  { label: "Injoignable", key: "injoignable", width: 12 },
  { label: "Autre", key: "autre", width: 10 },
  { label: "Déjà connus accompagnés", key: "deja_connu_accompagne", width: 22 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const traitementRuptureExportColumns = traitementSegmentBaseColumns;

export const traitementCollabExportColumns = [
  ...traitementSegmentBaseColumns.map((column) =>
    column.key === "total_jeunes" ? { ...column, label: "Total collab" } : column
  ),
  { label: "Situation : rupture", key: "situation_rupture", width: 18 },
  { label: "Situation : abandon", key: "situation_abandon", width: 18 },
  { label: "Prévention : inévitable", key: "situation_prevention_inevitable", width: 22 },
  { label: "Prévention : très élevé", key: "situation_prevention_tres_eleve", width: 22 },
  { label: "Prévention : modéré", key: "situation_prevention_modere", width: 20 },
  { label: "Besoin d'aide hors rupture", key: "situation_besoin_aide_hors_rupture", width: 24 },
  { label: "Délai moyen (jours)", key: "delai_moyen_jours", width: 18 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const collaborationCfaCompatiblesExportColumns = [
  { label: "SIRET", key: "siret", xlsxType: "string", width: 18 },
  { label: "Nom", key: "nom", width: 50 },
  { label: "Région", key: "region", width: 30 },
  { label: "Département", key: "departement", width: 25 },
  { label: "Code département", key: "departement_code", xlsxType: "string", width: 18 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const collaborationCfaActivesExportColumns = [
  { label: "SIRET", key: "siret", xlsxType: "string", width: 18 },
  { label: "Nom", key: "nom", width: 50 },
  { label: "Région", key: "region", width: 30 },
  { label: "Département", key: "departement", width: 25 },
  { label: "Code département", key: "departement_code", xlsxType: "string", width: 18 },
  { label: "Date d'activation", key: "date_activation", xlsxType: "date", width: 18 },
  { label: "Sources", key: "sources", width: 16 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const collaborationCfaWithCollabExportColumns = [
  { label: "SIRET", key: "siret", xlsxType: "string", width: 18 },
  { label: "Nom", key: "nom", width: 50 },
  { label: "Région", key: "region", width: 30 },
  { label: "Département", key: "departement", width: 25 },
  { label: "Code département", key: "departement_code", xlsxType: "string", width: 18 },
  { label: "Nb collaborations", key: "nb_collaborations", width: 18 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const collaborationDetailsExportColumns = [
  { label: "SIRET CFA", key: "siret_cfa", xlsxType: "string", width: 18 },
  { label: "Nom CFA", key: "nom_cfa", width: 40 },
  { label: "Région CFA", key: "region_cfa", width: 30 },
  { label: "Département CFA", key: "departement_cfa", width: 25 },
  { label: "Code département CFA", key: "departement_code_cfa", xlsxType: "string", width: 22 },
  { label: "Mission Locale", key: "nom_ml", width: 40 },
  { label: "Nom", key: "nom_jeune", width: 25 },
  { label: "Prénom", key: "prenom_jeune", width: 25 },
  { label: "Date de naissance", key: "date_naissance_jeune", xlsxType: "date", width: 18 },
  { label: "Statut apprenant", key: "statut_apprenant", width: 22 },
  { label: "Dossier envoyé", key: "dossier_envoye", width: 14 },
  { label: "Date envoi CFA", key: "date_envoi_cfa", xlsxType: "date", width: 16 },
  { label: "Dossier traité", key: "dossier_traite", width: 14 },
  { label: "Date traitement ML", key: "date_traitement_ml", xlsxType: "date", width: 18 },
  { label: "Réponse jeune", key: "reponse_jeune", width: 14 },
  { label: "RDV pris", key: "rdv_pris", width: 10 },
  { label: "Source", key: "source", width: 10 },
] as const satisfies ReadonlyArray<ExportColumn>;

export const cfaInvitationsExportColumns = [
  { label: "date_invitation", key: "date_invitation", xlsxType: "date", width: 16 },
  { label: "ml_nom", key: "ml_nom", width: 40 },
  { label: "region_ml", key: "region_ml", width: 26 },
  { label: "siret_CFA", key: "siret_cfa", xlsxType: "string", width: 18 },
  { label: "raison_sociale_CFA", key: "raison_sociale_cfa", width: 40 },
  { label: "region_cfa", key: "region_cfa", width: 26 },
  { label: "departement_cfa", key: "departement_cfa", width: 26 },
  { label: "departement_code_cfa", key: "departement_code_cfa", xlsxType: "string", width: 24 },
  { label: "nb_nouveaux_comptes_apres_CFA", key: "nb_nouveaux_comptes_apres_cfa", width: 30 },
  { label: "date_derniere_connexion_CFA", key: "date_derniere_connexion_cfa", xlsxType: "date", width: 28 },
  { label: "collab_apres_invitation_CFA", key: "collab_apres_invitation_cfa", width: 27 },
  { label: "contacts_CFA_qui_ont_collaboré", key: "contacts_cfa_qui_ont_collabore", width: 45 },
  { label: "nb_collab_apres_invitation_CFA", key: "nb_collab_apres_invitation_cfa", width: 30 },
  { label: "date_premiere_collab_apres_CFA", key: "date_premiere_collab_apres_cfa", xlsxType: "date", width: 30 },
  { label: "date_derniere_collab_CFA", key: "date_derniere_collab_cfa", xlsxType: "date", width: 25 },
  { label: "Connexion_apres_invitation_CFA", key: "connexion_apres_invitation_cfa", width: 30 },
  {
    label: "date_premiere_connexion_apres_invitation_CFA",
    key: "date_premiere_connexion_apres_invitation_cfa",
    xlsxType: "date",
    width: 44,
  },
] as const satisfies ReadonlyArray<ExportColumn>;

export const cfaInvitationsChampsExportColumns = [
  { label: "Champ", key: "champ", width: 44 },
  { label: "Description", key: "description", width: 90 },
  { label: "Format", key: "format", width: 40 },
  { label: "Pourquoi", key: "pourquoi", width: 60 },
] as const satisfies ReadonlyArray<ExportColumn>;

const FORMAT_DATE = "Date (JJ/MM/AAAA)";

export const cfaInvitationsChampsRows = [
  {
    champ: "Une ligne",
    description:
      "Une invitation envoyée par une Mission Locale à un CFA. Toutes les invitations sont exportées, y compris celles qui ont abouti à une collaboration.",
    format: "",
    pourquoi: "",
  },
  {
    champ: "date_invitation",
    description: "Date d'envoi de l'invitation par la ML",
    format: FORMAT_DATE,
    pourquoi: "Point de départ : tout ce qui suit est mesuré après cette date",
  },
  {
    champ: "ml_nom",
    description: "Nom de la Mission Locale",
    format: "Texte",
    pourquoi: "Identifier la ML qui invite",
  },
  {
    champ: "region_ml",
    description: "Région de la Mission Locale",
    format: "Texte",
    pourquoi: "Savoir si la ML est en région pilote",
  },
  {
    champ: "siret_CFA",
    description: "SIRET du CFA invité, tel qu'au moment de l'envoi",
    format: "Texte, 14 chiffres (garder les zéros)",
    pourquoi: "Identifier le CFA et croiser avec nos fichiers",
  },
  {
    champ: "raison_sociale_CFA",
    description: "Nom du CFA invité (nom d'usage, à défaut raison sociale)",
    format: "Texte",
    pourquoi: "Identifier le CFA de façon lisible",
  },
  {
    champ: "region_cfa",
    description: "Région du CFA invité",
    format: "Texte",
    pourquoi: "Savoir si le CFA est en région pilote",
  },
  {
    champ: "departement_cfa",
    description: "Département du CFA invité",
    format: "Texte",
    pourquoi: "Cibler un département, croiser avec les ML du territoire",
  },
  {
    champ: "departement_code_cfa",
    description: "Code INSEE du département du CFA invité",
    format: "Texte, 2 ou 3 caractères (garder les zéros)",
    pourquoi: "Croiser avec nos fichiers",
  },
  {
    champ: "nb_nouveaux_comptes_apres_CFA",
    description: "Nombre de comptes utilisateurs créés sur ce CFA après la date d'invitation, validés ou en attente",
    format: "Nombre entier",
    pourquoi: "De nouveaux utilisateurs sont-ils créés ?",
  },
  {
    champ: "date_derniere_connexion_CFA",
    description: "Date de la dernière connexion d'un utilisateur de ce CFA, tous utilisateurs confondus",
    format: FORMAT_DATE,
    pourquoi: "Le CFA s'est-il reconnecté après l'invitation ?",
  },
  {
    champ: "collab_apres_invitation_CFA",
    description: "Le CFA a-t-il fait au moins une collaboration après la date d'invitation, avec n'importe quelle ML ?",
    format: "Oui / Non",
    pourquoi: "Y a-t-il au moins une collab après l'invitation ?",
  },
  {
    champ: "contacts_CFA_qui_ont_collaboré",
    description: "Emails des comptes du CFA ayant envoyé au moins une collaboration après la date d'invitation",
    format: "Texte, emails séparés par « ; », vide si aucun",
    pourquoi: "Savoir qui porte la collaboration au CFA",
  },
  {
    champ: "nb_collab_apres_invitation_CFA",
    description: "Nombre de collaborations faites par le CFA après la date d'invitation",
    format: "Nombre entier",
    pourquoi: "Quel volume de collabs est généré ?",
  },
  {
    champ: "date_premiere_collab_apres_CFA",
    description: "Date de la première collaboration après la date d'invitation",
    format: `${FORMAT_DATE}, vide si aucune collab`,
    pourquoi: "En combien de temps la première collab arrive-t-elle ?",
  },
  {
    champ: "date_derniere_collab_CFA",
    description: "Date de la dernière collaboration du CFA",
    format: `${FORMAT_DATE}, vide si aucune collab`,
    pourquoi: "La collaboration se poursuit-elle ?",
  },
  {
    champ: "Connexion_apres_invitation_CFA",
    description: "Le CFA s'est-il connecté au moins une fois après la date d'invitation ?",
    format: "Oui / Non",
    pourquoi: "Mesurer si l'invitation a été suivie d'une connexion au TBA",
  },
  {
    champ: "date_premiere_connexion_apres_invitation_CFA",
    description: "Date de la première connexion d'un utilisateur du CFA après la date d'invitation",
    format: `${FORMAT_DATE}, vide si aucune connexion`,
    pourquoi: "Mesurer le délai entre l'invitation et la première connexion du CFA",
  },
  {
    champ: "Définition : connexion",
    description:
      "Authentification par mot de passe. Un utilisateur dont la session (7 jours) est encore ouverte arrive sur le TBA sans être recompté : la première connexion après l'invitation peut être datée jusqu'à 7 jours trop tard, voire manquer. Un CFA qui se connectait déjà régulièrement apparaît « Oui » sans que l'invitation en soit la cause.",
    format: "",
    pourquoi: "",
  },
  {
    champ: "Définition : collaboration",
    description:
      "Dossier de jeune envoyé par le CFA à une Mission Locale, daté de son premier envoi, toutes ML confondues. Sont exclus les dossiers supprimés et ceux envoyés par l'équipe du Tableau de bord pour le compte du CFA.",
    format: "",
    pourquoi: "",
  },
];

import { Parser } from "json2csv";
import { findEffectifs } from "../effectifs.actions.js";
import { findFormationById } from "../formations.actions.js";
import { findOrganismeById } from "../organismes.actions.js";
import { SIFA_FIELDS } from "./sifaCsvFields.js";

/**
 * Méthode
 * @param {*} props
 */
export const generateSifa = async (organisme_id) => {
  const organisme = await findOrganismeById(organisme_id);
  const effectifs = await findEffectifs(organisme_id);

  const organismeFields = {
    NUMERO_UAI: organisme.uai, // REQUIRED
  };

  const items = [];
  for (const effectif of effectifs) {
    const apprenantFields = {
      INE: effectif.apprenant.ine,
      NOM: effectif.apprenant.nom, // REQUIRED
      PRENOM1: effectif.apprenant.prenom, // REQUIRED
      TEL_JEUNE: effectif.apprenant.telephone,
      MAIL_JEUNE: effectif.apprenant.courriel,
      DATE_NAIS: effectif.apprenant.date_de_naissance, // REQUIRED
      LIEU_NAIS: effectif.apprenant.code_postal_de_naissance, // REQUIRED
      SEXE: effectif.apprenant.sexe, // REQUIRED
      HANDI: effectif.apprenant.handicap ? "1" : "0",
      NATIO: effectif.apprenant.nationalite,
      ADRESSE:
        effectif.apprenant.adresse?.complete ??
        `${effectif.apprenant.adresse.numero} ${effectif.apprenant.adresse.repetition_voie} ${effectif.apprenant.adresse.voie}`, // REQUIRED
      COD_POST: effectif.apprenant.adresse?.code_postal,
      COM_RESID: effectif.apprenant.adresse?.code_insee,
      REGIME_SCO: effectif.apprenant.regime_scolaire,

      TEL_RESP1_PERSO: effectif.apprenant.representant_legal?.telephone,
      TEL_RESP1_PRO: effectif.apprenant.representant_legal?.telephone,
      MAIL_RESP1: effectif.apprenant.representant_legal?.courriel,
      PCS: "", // representant_legal

      SIT_AV_APP: effectif.apprenant.situation_avant_contrat,
      DIP_OBT: effectif.apprenant.dernier_diplome,
      SIT_N_1: effectif.apprenant.derniere_situation, // REQUIRED
      ETAB_N_1: effectif.apprenant.dernier_organisme_uai, // REQUIRED
    };

    const dernierContratActif = effectif.apprenant.contrats?.[0];
    const employeurFields = {
      SIRET_EMP: dernierContratActif?.siret,
      TYPE_EMP: dernierContratActif?.type_employeur,
      DATE_DEB_CONT: dernierContratActif?.date_debut,
      DATE_RUPT_CONT: dernierContratActif?.date_rupture,
      NAF_ETAB: dernierContratActif?.naf,
      NBSAL_EMP: dernierContratActif?.nombre_de_salaries,
      COM_ETAB: dernierContratActif?.adresse.code_postal,
    };

    const formationBcn = await findFormationById(effectif.formation.formation_id);
    const formationOrganisme = organisme.formations.filter((f) => f.formation_id === effectif.formation.formation_id);
    // date_debut_formation
    // date_fin_formation
    // date_obtention_diplome
    // duree_formation_relle
    const formationFields = {
      DIPLOME: formationBcn?.cfd || effectif.formation.cfd, // REQUIRED
      DUR_FORM_THEO: formationOrganisme?.duree_formation_theorique, // REQUIRED
      DUR_FORM_REELLE: effectif.formation.duree_formation_relle, // REQUIRED
      AN_FORM: effectif.formation.annee, // REQUIRED

      SIT_FORM: "", // REQUIRED //RESPONSABLE / FORMATEUR / RESPONSABLE_FORMATEUR / LIEU
    };

    const statutFields = {
      STATUT: "APP", // REQUIRED // STATUT courant // TODO
      DATE_ENTREE_CFA: "", // STATUT Inscrit // TODO
    };

    items.push({
      ...organismeFields,
      ...apprenantFields,
      ...employeurFields,
      ...formationFields,
      ...statutFields,
      OG: 24, // Unknown for now    // REQUIRED
      UAI_EPLE: "NC", // Unknown for now // REQUIRED
      NAT_STR_JUR: "NC", // Unknown for now // REQUIRED

      NOM2: "", // Always empty
      PRENOM2: "", // Always empty
      PRENOM3: "", // Always empty
      TEL_RESP2_PERSO: "", // Always empty
      TEL_RESP2_PRO: "", // Always empty
      MAIL_RESP2: "", // Always empty
    });
  }

  const json2csvParser = new Parser({ fields: SIFA_FIELDS, delimiter: ";", withBOM: true });
  const csv = await json2csvParser.parse(items);

  return csv;
};

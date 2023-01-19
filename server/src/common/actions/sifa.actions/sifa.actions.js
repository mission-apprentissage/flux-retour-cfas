import { Parser } from "json2csv";
import { DateTime } from "luxon";
import { findEffectifs } from "../effectifs.actions.js";
import { findFormationById } from "../formations.actions.js";
import { findOrganismeById } from "../organismes/organismes.actions.js";
import { SIFA_FIELDS } from "./sifaCsvFields.js";
import { getCpInfo } from "../../apis/apiTablesCorrespondances.js";
import { CODES_STATUT_APPRENANT } from "../../constants/dossierApprenantConstants.js";

export const isEligibleSIFA = ({ historique_statut }) => {
  const filtered = historique_statut.filter(({ date_statut }) => {
    const dateStatut = DateTime.fromJSDate(new Date(date_statut)).setZone("Europe/Paris").setLocale("fr-FR");
    const endOfyear = DateTime.fromFormat("31/12/2022", "dd/MM/yyyy").setLocale("fr-FR");
    return dateStatut <= endOfyear;
  });
  const historiqueSorted = filtered.sort((a, b) => {
    return new Date(a.date_statut).getTime() - new Date(b.date_statut).getTime();
  });
  const current = [...historiqueSorted].pop();
  if (current?.valeur_statut === CODES_STATUT_APPRENANT.apprenti) {
    // Décision 18/01/2023 - Les CFAs connectés en API ne renseigne pas tjrs la date d'inscription de l'apprenant
    // let aEteInscrit = false;
    // for (let index = 0; index < historiqueSorted.length - 1; index++) {
    //   const element = historiqueSorted[index];
    //   if (element.valeur_statut === CODES_STATUT_APPRENANT.inscrit) {
    //     aEteInscrit = true;
    //     break;
    //   }
    // }
    // if (aEteInscrit) {
    //   return true;
    // }
    return true;
  }
  return false;
};

/**
 * Méthode
 * @param {*} props
 */
export const generateSifa = async (organisme_id) => {
  const organisme = await findOrganismeById(organisme_id);
  const effectifsDb = await findEffectifs(organisme_id);
  let effectifs = [];
  for (const effectif of effectifsDb) {
    if (isEligibleSIFA({ historique_statut: effectif.apprenant.historique_statut })) effectifs.push(effectif);
  }

  const items = [];
  for (const effectif of effectifs) {
    const formationBcn = await findFormationById(effectif.formation.formation_id);
    const [formationOrganisme] = organisme.formations.filter(
      (f) => f.formation_id.toString() === effectif.formation.formation_id.toString()
    );
    const { result: cpNaissanceInfo } = await getCpInfo(effectif.apprenant.code_postal_de_naissance);

    const formatStringForSIFA = (str) => str.replaceAll(/[^0-9a-zA-Z\- ]/g, "") ?? undefined;

    const wrapNumString = (str) => {
      if (!str) return str;
      return `="${str}"`;
    };

    const requiredFields = {
      NUMERO_UAI: organisme.uai, // REQUIRED
      NOM: formatStringForSIFA(effectif.apprenant.nom), // REQUIRED
      PRENOM1: formatStringForSIFA(effectif.apprenant.prenom), // REQUIRED
      DATE_NAIS: effectif.apprenant.date_de_naissance
        ? wrapNumString(
            DateTime.fromJSDate(new Date(effectif.apprenant.date_de_naissance))
              .setZone("Europe/Paris")
              .setLocale("fr-FR")
              .toFormat("ddMMyyyy")
          )
        : undefined, // REQUIRED

      LIEU_NAIS: wrapNumString(cpNaissanceInfo.code_commune_insee), // REQUIRED
      SEXE: effectif.apprenant.sexe === "M" ? "1" : "2", // REQUIRED
      ADRESSE: effectif.apprenant.adresse
        ? effectif.apprenant.adresse?.complete ??
          `${effectif.apprenant.adresse?.numero ?? ""} ${effectif.apprenant.adresse?.repetition_voie ?? ""} ${
            effectif.apprenant.adresse?.voie
          }`
        : undefined, // REQUIRED
      SIT_N_1: effectif.apprenant.derniere_situation, // REQUIRED
      ETAB_N_1: effectif.apprenant.dernier_organisme_uai, // REQUIRED
      DIPLOME: wrapNumString(formationBcn?.cfd || effectif.formation.cfd), // REQUIRED
      DUR_FORM_THEO: formationOrganisme?.duree_formation_theorique
        ? formationOrganisme?.duree_formation_theorique * 12
        : undefined, // REQUIRED
      DUR_FORM_REELLE: effectif.formation.duree_formation_relle, // REQUIRED
      AN_FORM: effectif.formation.annee, // REQUIRED
      SIT_FORM: "", // REQUIRED //RESPONSABLE / FORMATEUR / RESPONSABLE_FORMATEUR / LIEU
      STATUT: "APP", // REQUIRED // STATUT courant
      OG: effectif.apprenant.organisme_gestionnaire, // REQUIRED
      UAI_EPLE: "NC", // Unknown for now // REQUIRED
      NAT_STR_JUR: "NC", // Unknown for now // REQUIRED
    };

    if (!Object.values(requiredFields).some((val) => val === undefined)) {
      const apprenantFields = {
        INE: wrapNumString(effectif.apprenant.ine) ?? "ine",
        TEL_JEUNE: wrapNumString(effectif.apprenant.telephone?.replace("+33", "0")),
        MAIL_JEUNE: effectif.apprenant.courriel,
        HANDI: effectif.apprenant.handicap ? "1" : "0",
        NATIO: effectif.apprenant.nationalite,
        COD_POST: wrapNumString(effectif.apprenant.adresse?.code_postal),
        COM_RESID: wrapNumString(effectif.apprenant.adresse?.code_insee),
        REGIME_SCO: effectif.apprenant.regime_scolaire,
        TEL_RESP1_PERSO: wrapNumString(effectif.apprenant.representant_legal?.telephone?.replace("+33", "0")),
        TEL_RESP1_PRO: wrapNumString(effectif.apprenant.representant_legal?.telephone?.replace("+33", "0")),
        MAIL_RESP1: effectif.apprenant.representant_legal?.courriel,
        PCS: effectif.apprenant.representant_legal?.pcs,
        SIT_AV_APP: effectif.apprenant.situation_avant_contrat,
        DIP_OBT: effectif.apprenant.dernier_diplome
          ? wrapNumString(`${effectif.apprenant.dernier_diplome}`.padStart(2, "0"))
          : "",
      };

      const dernierContratActif = effectif.apprenant.contrats?.[0];
      const employeurFields = {
        SIRET_EMP: dernierContratActif?.siret,
        TYPE_EMP: dernierContratActif?.type_employeur,
        DATE_DEB_CONT: dernierContratActif?.date_debut
          ? wrapNumString(
              DateTime.fromJSDate(new Date(dernierContratActif.date_debut))
                .setZone("Europe/Paris")
                .setLocale("fr-FR")
                .toFormat("ddMMyyyy")
            )
          : undefined,
        DATE_RUPT_CONT: dernierContratActif?.date_rupture
          ? wrapNumString(
              DateTime.fromJSDate(new Date(dernierContratActif.date_rupture))
                .setZone("Europe/Paris")
                .setLocale("fr-FR")
                .toFormat("ddMMyyyy")
            )
          : undefined,
        NAF_ETAB: dernierContratActif?.naf,
        NBSAL_EMP: dernierContratActif?.nombre_de_salaries,
        COM_ETAB: wrapNumString(dernierContratActif?.adresse?.code_postal),
      };

      // date_debut_formation
      // date_fin_formation
      // date_obtention_diplome
      // duree_formation_relle

      const statutFields = {
        DATE_ENTREE_CFA: "", // STATUT Inscrit // TODO
      };

      items.push({
        ...requiredFields,
        ...apprenantFields,
        ...employeurFields,
        ...statutFields,
        NOM2: "", // Always empty
        PRENOM2: "", // Always empty
        PRENOM3: "", // Always empty
        TEL_RESP2_PERSO: "", // Always empty
        TEL_RESP2_PRO: "", // Always empty
        MAIL_RESP2: "", // Always empty
      });
    }
  }

  const json2csvParser = new Parser({ fields: SIFA_FIELDS, delimiter: ";", withBOM: true });
  const csv = await json2csvParser.parse(items);

  return csv;
};

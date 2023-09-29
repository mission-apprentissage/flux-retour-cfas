import { Parser } from "json2csv";
import { DateTime } from "luxon";
import { ObjectId, WithId } from "mongodb";
import { getAnneesScolaireListFromDate, getSIFADate } from "shared";

import { findEffectifsByQuery } from "@/common/actions/effectifs.actions";
import { findFormationById, getFormationWithCfd, getFormationWithRNCP } from "@/common/actions/formations.actions";
import { findOrganismeById } from "@/common/actions/organismes/organismes.actions";
import { getCodePostalInfo } from "@/common/apis/apiTablesCorrespondances";
import { CODES_STATUT_APPRENANT } from "@/common/constants/dossierApprenant";
import { Effectif } from "@/common/model/@types/Effectif";

import { SIFA_FIELDS } from "./sifaCsvFields";

const formatStringForSIFA = (str) => {
  if (!str) return undefined;
  const accent = [
    /[\300-\306]/g,
    /[\340-\346]/g, // A, a
    /[\310-\313]/g,
    /[\350-\353]/g, // E, e
    /[\314-\317]/g,
    /[\354-\357]/g, // I, i
    /[\322-\330]/g,
    /[\362-\370]/g, // O, o
    /[\331-\334]/g,
    /[\371-\374]/g, // U, u
    /[\321]/g,
    /[\361]/g, // N, n
    /[\307]/g,
    /[\347]/g, // C, c
  ];
  const noaccent = ["A", "a", "E", "e", "I", "i", "O", "o", "U", "u", "N", "n", "C", "c"];

  for (var i = 0; i < accent.length; i++) {
    str = str.replace(accent[i], noaccent[i]);
  }

  return str.replaceAll(/[^0-9a-zA-Z\- ]/g, "") ?? undefined;
};

const wrapNumString = (str) => {
  if (!str) return str;
  return `="${str}"`;
};

export const isEligibleSIFA = (historique_statut: Effectif["apprenant"]["historique_statut"]) => {
  const endOfyear = getSIFADate(new Date());

  const historiqueSorted = historique_statut
    .filter(({ date_statut }) => date_statut <= endOfyear)
    .sort((a, b) => {
      return new Date(a.date_statut).getTime() - new Date(b.date_statut).getTime();
    });

  const current = historiqueSorted[0];
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

export const generateSifa = async (organisme_id: ObjectId) => {
  const organisme = await findOrganismeById(organisme_id);
  if (!organisme) {
    throw new Error("organisme not found");
  }

  const effectifs = (
    await findEffectifsByQuery({
      organisme_id: new ObjectId(organisme_id),
      annee_scolaire: getAnneesScolaireListFromDate(getSIFADate(new Date())),
    })
  ).filter((effectif) => isEligibleSIFA(effectif.apprenant.historique_statut)) as Required<WithId<Effectif>>[];

  const items: any[] = [];
  for (const effectif of effectifs) {
    const formationBcn =
      (await findFormationById(effectif.formation.formation_id)) ||
      (effectif.formation.cfd ? await getFormationWithCfd(effectif.formation.cfd) : null) ||
      (effectif.formation.rncp ? await getFormationWithRNCP(effectif.formation.rncp) : null);
    const formationOrganisme = organisme.relatedFormations?.find(
      (f) => f.formation_id?.toString() === effectif.formation.formation_id?.toString()
    );
    const cpInfo = await getCodePostalInfo(effectif.apprenant.code_postal_de_naissance);
    const cpNaissanceInfo = cpInfo?.result;

    const requiredFields = {
      NUMERO_UAI: organisme.uai,
      NOM: formatStringForSIFA(effectif.apprenant.nom),
      PRENOM1: formatStringForSIFA(effectif.apprenant.prenom),
      DATE_NAIS: effectif.apprenant.date_de_naissance
        ? wrapNumString(
            DateTime.fromJSDate(new Date(effectif.apprenant.date_de_naissance))
              .setZone("Europe/Paris")
              .setLocale("fr-FR")
              .toFormat("ddMMyyyy")
          )
        : undefined,

      LIEU_NAIS: wrapNumString(cpNaissanceInfo?.code_commune_insee),
      SEXE: effectif.apprenant.sexe === "M" ? "1" : "2",
      ADRESSE: effectif.apprenant.adresse
        ? effectif.apprenant.adresse?.complete ??
          `${effectif.apprenant.adresse?.numero ?? ""} ${effectif.apprenant.adresse?.repetition_voie ?? ""} ${effectif
            .apprenant.adresse?.voie}`
        : undefined,
      SIT_N_1: effectif.apprenant.derniere_situation,
      ETAB_N_1: effectif.apprenant.dernier_organisme_uai
        ? effectif.apprenant.dernier_organisme_uai.length === 8
          ? effectif.apprenant.dernier_organisme_uai
          : wrapNumString(effectif.apprenant.dernier_organisme_uai.padStart(3, "0"))
        : undefined,
      DIPLOME: wrapNumString(formationBcn?.cfd || effectif.formation.cfd),
      DUR_FORM_THEO: effectif.formation.duree_theorique
        ? effectif.formation.duree_theorique * 12
        : formationOrganisme?.duree_formation_theorique
        ? formationOrganisme?.duree_formation_theorique * 12
        : undefined,
      DUR_FORM_REELLE: effectif.formation.duree_formation_relle,
      AN_FORM: effectif.formation.annee,
      SIT_FORM: "", //RESPONSABLE / FORMATEUR / RESPONSABLE_FORMATEUR / LIEU
      STATUT: "APP", // STATUT courant
      OG: effectif.apprenant.organisme_gestionnaire,
      UAI_EPLE: "NC", // Unknown for now
      NAT_STR_JUR: "NC", // Unknown for now
    };

    // Note for later: maybe we should not remove incomplete effectifs, to allow the user to fix them manually.
    if (Object.values(requiredFields).some((val) => val === undefined)) {
      continue;
    }

    const apprenantFields = {
      INE: wrapNumString(effectif.apprenant.ine) ?? "ine",
      TEL_JEUNE: wrapNumString(effectif.apprenant.telephone?.replace("+33", "0")),
      MAIL_JEUNE: effectif.apprenant.courriel,
      HANDI: effectif.apprenant.rqth ? "1" : "0",
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

    const dernierContratActif = effectif.contrats?.[0];
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

  const json2csvParser = new Parser({ fields: SIFA_FIELDS, delimiter: ";", withBOM: true });
  const csv = await json2csvParser.parse(items);

  return csv;
};

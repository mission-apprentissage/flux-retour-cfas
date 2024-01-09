import { Parser } from "json2csv";
import { DateTime } from "luxon";
import { ObjectId, WithId } from "mongodb";
import { getAnneesScolaireListFromDate, getSIFADate, CODES_STATUT_APPRENANT } from "shared";

import { findFormationById, getFormationWithCfd, getFormationWithRNCP } from "@/common/actions/formations.actions";
import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import { getCodePostalInfo } from "@/common/apis/apiTablesCorrespondances";
import { Effectif } from "@/common/model/@types/Effectif";
import { effectifsDb } from "@/common/model/collections";

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
      // Si les dates sont identiques, on préfère mettre le statut "apprenti" (3) en premier
      // pour éviter de sortir de la liste des apprenants qui sont en contrat (et en même temps inscrits)
      // dans les résultats de SIFA
      // cf: https://tableaudebord-apprentissage.atlassian.net/browse/TM-554
      if (new Date(a.date_statut).getTime() === new Date(b.date_statut).getTime()) {
        return a.valeur_statut === CODES_STATUT_APPRENANT.apprenti ? -1 : 1;
      }
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
  const organisme = await getOrganismeById(organisme_id);

  const effectifs = (
    await effectifsDb()
      .find({
        organisme_id: new ObjectId(organisme_id),
        annee_scolaire: {
          $in: getAnneesScolaireListFromDate(getSIFADate(new Date())),
        },
      })
      .toArray()
  ).filter((effectif) => isEligibleSIFA(effectif.apprenant.historique_statut)) as Required<WithId<Effectif>>[];

  const items: any[] = [];
  const organismesUaiCache: Record<string, string> = {};
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

    let organismeResponsableUai = organisme.uai;
    let organismeFormateurUai = "";
    let organismeLieuDeFormationUai = "NC";

    // Vu avec Nadine le 21 septembre 2023 dans Slack, si on a les 3 (c'est à dire en API v3) on les renseigne dans les champs suivants :
    // NUMERO_UAI = uai_organisme_responsable
    // SIT_FORM = uai_organisme_formateur
    // UAI_EPLE = uai_organisme_lieu_de_formation
    if (effectif.organisme_formateur_id && effectif.organisme_responsable_id && effectif.organisme_id) {
      //  organismeResponsableUai
      if (organismesUaiCache[effectif.organisme_responsable_id.toString()]) {
        organismeResponsableUai = organismesUaiCache[effectif.organisme_responsable_id.toString()];
      } else {
        const organismeResponsable = await getOrganismeById(effectif.organisme_responsable_id);
        if (organismeResponsable?.uai) {
          organismesUaiCache[effectif.organisme_responsable_id.toString()] = organismeResponsable.uai;
          organismeResponsableUai = organismeResponsable.uai;
        }
      }
      // organismeFormateurUai
      if (organismesUaiCache[effectif.organisme_formateur_id.toString()]) {
        organismeFormateurUai = organismesUaiCache[effectif.organisme_formateur_id.toString()];
      } else {
        const organismeFormateur = await getOrganismeById(effectif.organisme_formateur_id);
        if (organismeFormateur?.uai) {
          organismesUaiCache[effectif.organisme_formateur_id.toString()] = organismeFormateur.uai;
          organismeFormateurUai = organismeFormateur.uai;
        }
      }
      // organismeLieuDeFormationUai
      if (organismesUaiCache[effectif.organisme_id.toString()]) {
        organismeLieuDeFormationUai = organismesUaiCache[effectif.organisme_id.toString()];
      } else {
        const organismeEple = await getOrganismeById(effectif.organisme_id);
        if (organismeEple?.uai) {
          organismesUaiCache[effectif.organisme_id.toString()] = organismeEple.uai;
          organismeLieuDeFormationUai = organismeEple.uai;
        }
      }
    }

    const requiredFields = {
      NUMERO_UAI: organismeResponsableUai,
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
          `${effectif.apprenant.adresse?.numero ?? ""} ${effectif.apprenant.adresse?.repetition_voie ?? ""} ${
            effectif.apprenant.adresse?.voie ?? ""
          }`
        : undefined,
      SIT_N_1: effectif.apprenant.derniere_situation,
      ETAB_N_1: effectif.apprenant.dernier_organisme_uai
        ? effectif.apprenant.dernier_organisme_uai.length === 8
          ? effectif.apprenant.dernier_organisme_uai
          : wrapNumString(effectif.apprenant.dernier_organisme_uai.padStart(3, "0"))
        : undefined,
      DIPLOME: wrapNumString(formationBcn?.cfd || effectif.formation.cfd),
      DUR_FORM_THEO: effectif.formation.duree_theorique_mois
        ? effectif.formation.duree_theorique_mois
        : // Les ERPs (ou les anciens fichiers de téléversement) pouvaient envoyer duree_theorique_formation
        // qui est l'ancien champ en années (contrairement à duree_theorique_formation_mois qui est en mois).
        // On assure donc une rétrocompatibilité discrète en convertissant le champ en mois si besoin et
        // en mettant dans le bon champ.
        formationOrganisme?.duree_formation_theorique
        ? formationOrganisme?.duree_formation_theorique * 12
        : undefined,
      DUR_FORM_REELLE: effectif.formation.duree_formation_relle,
      AN_FORM: effectif.formation.annee,
      SIT_FORM: organismeFormateurUai,
      STATUT: "APP", // STATUT courant
      TYPE_CFA: wrapNumString(effectif.apprenant.type_cfa),
      UAI_EPLE: organismeLieuDeFormationUai,
      NAT_STR_JUR: "NC", // Unknown for now
    };

    const notRequiredFields = {
      TYPE_CFA: wrapNumString(effectif.apprenant.type_cfa),
      RNCP: effectif.formation.rncp || "",
    };

    const apprenantFields = {
      INE: wrapNumString(effectif.apprenant.ine) ?? "",
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
      ...notRequiredFields,
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

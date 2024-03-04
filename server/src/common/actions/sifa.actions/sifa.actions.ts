import { Parser } from "json2csv";
import { DateTime } from "luxon";
import { ObjectId, WithId } from "mongodb";
import { getAnneesScolaireListFromDate, getSIFADate, CODES_STATUT_APPRENANT } from "shared";
import { IEffectif } from "shared/models/data/effectifs.model";

import { getFormationCfd } from "@/common/actions/formations.actions";
import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import { getCodePostalInfo } from "@/common/apis/apiTablesCorrespondances";
import { effectifsDb } from "@/common/model/collections";

import { SIFA_FIELDS, formatAN_FORM, formatINE, formatStringForSIFA, wrapNumString } from "./sifaCsvFields";

export const isEligibleSIFA = (historique_statut: IEffectif["apprenant"]["historique_statut"]) => {
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
  ).filter((effectif) => isEligibleSIFA(effectif.apprenant.historique_statut)) as Required<WithId<IEffectif>>[];

  const items: any[] = [];
  const organismesUaiCache: Record<string, string> = {};
  for (const effectif of effectifs) {
    const formationCfd = await getFormationCfd(effectif);
    const formationOrganisme = organisme.relatedFormations?.find(
      (f) => f.formation_id?.toString() === effectif.formation?.formation_id?.toString()
    );
    const cpInfo = await getCodePostalInfo(effectif.apprenant.code_postal_de_naissance);
    const cpNaissanceInfo = cpInfo?.result;

    let organismeResponsableUai = organisme.uai;
    let organismeFormateurUai = "";

    // Vu avec Nadine le 21 septembre 2023 dans Slack, si on a les 3 (c'est à dire en API v3) on les renseigne dans les champs suivants :
    // NUMERO_UAI = uai_organisme_responsable
    // SIT_FORM = uai_organisme_formateur
    // UAI_EPLE = NC (car on ne peux pas le detérminer pour le moment)
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
    }

    // Extraction du code diplome cfd
    const codeDiplome = wrapNumString(formationCfd);
    // Adresse de l'effectif
    const effectifAddress = effectif.apprenant.adresse
      ? effectif.apprenant.adresse?.complete ??
        `${effectif.apprenant.adresse?.numero ?? ""} ${effectif.apprenant.adresse?.repetition_voie ?? ""} ${
          effectif.apprenant.adresse?.voie ?? ""
        }`
      : undefined;

    const requiredFields = {
      NUMERO_UAI: organismeResponsableUai,
      NOM: formatStringForSIFA(effectif.apprenant.nom)?.slice(0, 100),
      PRENOM1: formatStringForSIFA(effectif.apprenant.prenom)?.slice(0, 100),
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
      ADRESSE: effectifAddress?.slice(0, 200) || "",
      SIT_N_1: effectif.apprenant.derniere_situation,
      ETAB_N_1: effectif.apprenant.dernier_organisme_uai
        ? effectif.apprenant.dernier_organisme_uai.length === 8
          ? effectif.apprenant.dernier_organisme_uai
          : wrapNumString(effectif.apprenant.dernier_organisme_uai.padStart(3, "0"))
        : undefined,
      DIPLOME: codeDiplome,
      DUR_FORM_THEO: effectif.formation?.duree_theorique_mois
        ? effectif.formation.duree_theorique_mois
        : // Les ERPs (ou les anciens fichiers de téléversement) pouvaient envoyer duree_theorique_formation
          // qui est l'ancien champ en années (contrairement à duree_theorique_formation_mois qui est en mois).
          // On assure donc une rétrocompatibilité discrète en convertissant le champ en mois si besoin et
          // en mettant dans le bon champ.
          formationOrganisme?.duree_formation_theorique
          ? formationOrganisme?.duree_formation_theorique * 12
          : undefined,
      DUR_FORM_REELLE: effectif.formation?.duree_formation_relle,
      AN_FORM: formatAN_FORM(effectif.formation?.annee),
      SIT_FORM: organismeFormateurUai,
      STATUT: "APP", // STATUT courant
      TYPE_CFA: wrapNumString(String(effectif.apprenant.type_cfa).padStart(2, "0")),
      UAI_EPLE: "NC",
      NAT_STR_JUR: "NC", // Unknown for now
    };

    const notRequiredFields = {
      TYPE_CFA: wrapNumString(effectif.apprenant.type_cfa),
      // Si i n'y a pas de code displome on renseigne le RNCP
      RNCP: !codeDiplome ? effectif.formation?.rncp : "",
    };

    const apprenantFields = {
      INE: formatINE(effectif.apprenant.ine),
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
      SIRET_EMP: wrapNumString(dernierContratActif?.siret),
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

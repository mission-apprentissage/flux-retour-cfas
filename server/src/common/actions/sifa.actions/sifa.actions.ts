import { Parser } from "json2csv";
import { DateTime } from "luxon";
import { ObjectId, WithId } from "mongodb";
import { getAnneesScolaireListFromDate, getSIFADate, STATUT_APPRENANT, StatutApprenant } from "shared";
import { IEffectif, IEffectifComputedStatut } from "shared/models/data/effectifs.model";

import { getFormationCfd } from "@/common/actions/formations.actions";
import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import { getCommune } from "@/common/apis/apiAlternance/apiAlternance";
import { effectifsDb } from "@/common/model/collections";

import { SIFA_FIELDS, formatAN_FORM, formatINE, formatStringForSIFA, wrapNumString } from "./sifaCsvFields";

export const isEligibleSIFA = (statut?: IEffectifComputedStatut | null): boolean => {
  if (!statut) return false;

  const endOfYear = getSIFADate(new Date()).getTime();
  const parcours = statut.parcours || [];

  let latestStatus: StatutApprenant | null = null;
  let latestDate = 0;

  parcours.forEach((parcour) => {
    const parcourDate = new Date(parcour.date).getTime();
    if (parcourDate <= endOfYear && parcourDate >= latestDate) {
      latestStatus = parcour.valeur;
      latestDate = parcourDate;
    }
  });

  return latestStatus === STATUT_APPRENANT.APPRENTI || latestStatus === STATUT_APPRENANT.RUPTURANT;
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
  ).filter((effectif) => isEligibleSIFA(effectif._computed?.statut)) as Required<WithId<IEffectif>>[];

  const items: any[] = [];
  const organismesUaiCache: Record<string, string> = {};
  for (const effectif of effectifs) {
    const formationCfd = await getFormationCfd(effectif);
    const formationOrganisme = organisme.relatedFormations?.find(
      (f) => f.formation_id?.toString() === effectif.formation?.formation_id?.toString()
    );
    const communeInfo = await getCommune(effectif.apprenant.code_postal_de_naissance);

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
      ? (effectif.apprenant.adresse?.complete ??
        `${effectif.apprenant.adresse?.numero ?? ""} ${effectif.apprenant.adresse?.repetition_voie ?? ""} ${
          effectif.apprenant.adresse?.voie ?? ""
        }`)
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

      LIEU_NAIS: wrapNumString(communeInfo?.code.insee),
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

    const dernierContratActif = effectif.contrats?.length ? effectif.contrats[effectif.contrats.length - 1] : undefined;
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

  const effectifsIds = effectifs.map((effectif) => effectif._id.toString());
  return { csv, effectifsIds };
};

import Joi from "joi";
import { cloneDeep, get } from "lodash-es";
import { dateFormatter, dateStringToLuxon } from "../../utils/formatterUtils.js";
import {
  buildEffectif,
  findEffectifById,
  findEffectifByQuery,
  insertEffectif,
  updateEffectif,
  updateEffectifAndLock,
  validateEffectifObject,
} from "../effectifs.actions.js";
import {
  findOrganismeBySiret,
  findOrganismeByUai,
  findOrganismeByUaiAndSiret,
  insertOrganisme,
} from "../organismes.actions.js";
import { mapFiabilizedOrganismeUaiSiretCouple } from "./engine.organismes.utils.js";

/**
 * Fonction de remplissage d'un effectif à créer ou à mettre à jour
 * Contrôle si l'effectif en entrée existe déja en base
 * Va créer un effectif structuré avec les erreurs éventuelles de modèle
 * @param {*} effectifs
 */
export const hydrateEffectif = async (effectifData, options) => {
  const queryKeys = options?.queryKeys ?? ["formation.cfd", "annee_scolaire", "apprenant.nom", "apprenant.prenom"];
  const checkIfExist = options?.checkIfExist ?? false;

  let {
    organisme_id,
    annee_scolaire,
    source,
    id_erp_apprenant,
    apprenant: { nom, prenom },
    formation: { cfd },
  } = await Joi.object({
    organisme_id: Joi.string().required(),
    annee_scolaire: Joi.string().required(),
    source: Joi.string().required(),
    id_erp_apprenant: Joi.string().required(),
    apprenant: Joi.object({
      nom: Joi.string().allow("").required(),
      prenom: Joi.string().allow("").required(),
    }).unknown(),
    formation: Joi.object({
      cfd: Joi.string().allow("").required(),
    }).unknown(),
  })
    .unknown()
    .validateAsync(effectifData, { abortEarly: false });

  let convertedEffectif = cloneDeep(effectifData);

  const dataConverter = (date) => {
    // TODO If more than year 4000 error
    const date_ISO = dateStringToLuxon(dateFormatter(date)).toISO();
    return date_ISO ?? date;
  };

  if (effectifData.apprenant.date_de_naissance) {
    convertedEffectif.apprenant.date_de_naissance = dataConverter(effectifData.apprenant.date_de_naissance);
  }

  if (effectifData.apprenant.contrats?.length) {
    for (const [key, contrat] of effectifData.apprenant.contrats.entries()) {
      if (contrat.date_debut) {
        convertedEffectif.apprenant.contrats[key].date_debut = dataConverter(contrat.date_debut);
      }
      if (contrat.date_fin) {
        convertedEffectif.apprenant.contrats[key].date_fin = dataConverter(contrat.date_fin);
      }
      if (contrat.date_rupture) {
        convertedEffectif.apprenant.contrats[key].date_rupture = dataConverter(contrat.date_rupture);
      }
    }
  }

  const effectif = buildEffectif(
    {
      organisme_id,
      annee_scolaire,
      source,
      id_erp_apprenant,
      ...convertedEffectif,
      apprenant: {
        nom,
        prenom,
        ...convertedEffectif.apprenant,
      },
      formation: {
        cfd,
        ...convertedEffectif.formation,
      },
    },
    false
  );

  const validatedEffectif = validateEffectifObject(effectif);

  let found = null;
  if (checkIfExist) {
    // Recherche de l'effectif via sa clé d'unicité
    const query = queryKeys.reduce((acc, item) => ({ ...acc, [item]: get(effectif, item) }), {});
    found = await findEffectifByQuery(query);
  }

  return { effectif: validatedEffectif, found };
};

/**
 * Fonction de remplissage et contrôle des données d'un organisme
 * Contrôle si l'organisme passe la fiabilisation
 * Contrôle si l'organisme existe déja
 * Si nécessaire va renvoyer un organisme fiabilisé à créer
 * ?? Pas besoin d'update car le runEngine ne va que créer / contrôler l'existant
 * ?? -> La MAJ d'un organisme ne doit pas se faire via l'API / migration ???
 * TODO Contrôle base ACCESS à ajouter ici
 * @param {*} organismesData
 */
export const hydrateOrganisme = async (organisme) => {
  let organismeToCreate = null;
  let organismeFoundId = null;
  let organismeFoundError = null;

  // Applique le mapping de fiabilisation
  const { cleanUai, cleanSiret } = await mapFiabilizedOrganismeUaiSiretCouple({
    uai: organisme.uai,
    siret: organisme.siret,
  });

  // Si pas de siret après fiabilisation -> erreur
  if (!cleanSiret) organismeFoundError = `Impossible de créer l'organisme d'uai ${organisme.uai} avec un siret vide`;

  // Applique les règles de rejection si pas dans la db
  const organismeFoundWithUaiSiret = await findOrganismeByUaiAndSiret(cleanUai, cleanSiret);

  if (organismeFoundWithUaiSiret?._id) {
    organismeFoundId = organismeFoundWithUaiSiret?._id;
  } else {
    const organismeFoundWithSiret = await findOrganismeBySiret(cleanSiret);
    // Si pour le couple uai-siret IN on trouve le siret mais un uai différent -> erreur
    if (organismeFoundWithSiret?._id)
      organismeFoundError = `L'organisme ayant le siret ${organisme.siret} existe déja en base avec un uai différent : ${organismeFoundWithSiret.uai}`;

    const organismeFoundWithUai = await findOrganismeByUai(cleanUai);
    // Si pour le couple uai-siret IN on trouve l'uai mais un siret différent -> erreur
    if (organismeFoundWithUai?._id)
      organismeFoundError = `L'organisme ayant l'uai ${organisme.uai} existe déja en base avec un siret différent : ${organismeFoundWithUai.siret}`;

    // TODO CHECK BASE ACCES

    // Création de l'organisme avec uai / siret fiabilisés
    organismeToCreate = { ...organisme, uai: cleanUai, siret: cleanSiret, sirets: [cleanSiret] };
  }

  return { organismeToCreate, organismeFound: { _id: organismeFoundId, error: organismeFoundError } };
};

/**
 * Fonction de run du moteur de construction d'organisme et d'effectifs
 * Prends en entrée un objet effectifData contenant les propriétés d'un effectif à créer ou maj
 * et un objet organismeData contenant les propriétés d'un organisme à créer ou identifier
 *
 * 1 - SOURCE : Migration
 *     Depuis la migration des dossiersApprenants le run est exécuté avec organismeData vide
 *     On va lui fournir en entrée un effectif contenant déja un organisme_id donc pas nécessaire de traiter les organismes
 *     On va appeler l'hydrateEffectifs avec un seul élément (celui en input du runEngine) et récupérer soit un objet à créer soit à maj
 *     On va ensuite selon le cas (create ou update)
 *        soit le créer puis faire un updateAndLock pour locker les champs
 *        soit faire uniquement un updateAndLock
 *     On renvoie l'id de l'effectif créé et / ou maj
 *
 * 2 - SOURCE : API
 *     Depuis l'API le run est exécuté pour chaque item itéré, donc avec un effectifData et un organismeData provenant de l'input API
 *     On va appeler l'hydrateOrganisme qui va contrôler l'organisme à créer ou à identifier
 *     Si l'organisme passe le contrôle de fiabilisation et est identifié comme nouveau, alors on va le créer et le relier à l'effectif fourni en entrée
 *     Si l'organisme passe le contrôle de fiabilisation et est identifié comme existant, alors on va le relier à l'effectif fourni en entrée // TODO Pas besoin d'update ?
 *     Si l'organisme ne passe pas le contrôle de fiabilisation car erreur, alors on va throw l'erreur // TODO Faire autre chose ?
 *
 * 2 - SOURCE : UPLOAD
 *     Depuis l'upload le run devra être exécuté avec organismeData vide vu que l'organisme est déja existant
 *     Idem API itérer sur un élément de l'upload et faire un runEngine
 *     Va créer / update l'effectif provenant de l'upload
 *     lockEffectif false
 *
 *
 *
 *
 * @param {*} dossiersApprenants
 */
export const runEngine = async ({ effectifData, lockEffectif = true }, organismeData) => {
  let organismeCreatedId = null;
  let organismeFoundId = null;

  let effectifCreatedId = null;
  let effectifUpdatedId = null;

  // Gestion de l'organisme : hydrate et ensuite create or update
  if (organismeData) {
    const { organismeToCreate, organismeFound } = await hydrateOrganisme(organismeData);

    // Organisme existant avec erreur on throw
    if (organismeFound?.error) {
      // TODO Here log ? action ? update ?
      throw new Error(organismeFound.error);
    }

    // Organisme a créer
    if (organismeToCreate) {
      organismeCreatedId = await insertOrganisme(organismeToCreate);
      // Ajout organisme id a l'effectifData
      effectifData.organisme_id = organismeCreatedId.toString();
    }

    // Organisme existant sans erreur
    if (organismeFound?._id) {
      // Ajout organisme id a l'effectifData
      // Pas besoin d'update l'organisme
      organismeFoundId = organismeFound?._id;
      effectifData.organisme_id = organismeFound?._id.toString();
    }
  }

  // Gestion de l'effectif
  if (effectifData) {
    const { effectif, found } = await hydrateEffectif(effectifData, {
      queryKeys: ["id_erp_apprenant", "organisme_id", "annee_scolaire"],
      checkIfExist: true,
    });

    if (!found) {
      effectifCreatedId = await insertEffectif(effectif);

      // Lock des champs API si option active
      if (lockEffectif) {
        const effectifCreated = await findEffectifById(effectifCreatedId);
        await updateEffectifAndLock(effectifCreatedId, {
          apprenant: effectifCreated.apprenant,
          formation: effectifCreated.formation,
        });
      }
    }

    // Gestion des maj d'effectif
    if (found) {
      effectifUpdatedId = found._id;
      if (lockEffectif) {
        await updateEffectifAndLock(effectifUpdatedId, effectif);
      } else {
        await updateEffectif(effectifUpdatedId, effectif);
      }
    }
  }

  return {
    effectif: {
      created: effectifCreatedId,
      updated: effectifUpdatedId,
    },
    organisme: {
      createdId: organismeCreatedId,
      foundId: organismeFoundId,
    },
  };
};

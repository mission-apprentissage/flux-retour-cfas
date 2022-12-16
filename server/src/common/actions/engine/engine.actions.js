import {
  findEffectifById,
  findEffectifByQuery,
  insertEffectif,
  structureEffectifWithEventualErrors,
  updateEffectif,
  updateEffectifAndLock,
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
export const hydrateEffectif = async (effectif) => {
  let effectifToCreate = null;
  let effectifToUpdate = null;

  // Recherche de l'effectif via sa clé d'unicité
  const foundEffectifWithUnicityFields = await findEffectifByQuery(
    {
      id_erp_apprenant: effectif.id_erp_apprenant,
      organisme_id: effectif.organisme_id,
      annee_scolaire: effectif.annee_scolaire,
    },
    { _id: 1 }
  );

  // Ajout à la liste de création ou update
  // On ajoute un effectif structuré avec les erreurs éventuelles de validation
  if (!foundEffectifWithUnicityFields) {
    effectifToCreate = structureEffectifWithEventualErrors(effectif);
  } else {
    effectifToUpdate = { ...structureEffectifWithEventualErrors(effectif), _id: foundEffectifWithUnicityFields?._id };
  }

  return { effectifToCreate, effectifToUpdate };
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
      effectifData.organisme_id = organismeCreatedId;
    }

    // Organisme existant sans erreur
    if (organismeFound?._id) {
      // Ajout organisme id a l'effectifData
      // Pas besoin d'update l'organisme
      organismeFoundId = organismeFound?._id;
      effectifData.organisme_id = organismeFound?._id;
    }
  }

  // Gestion de l'effectif
  if (effectifData) {
    const { effectifToCreate, effectifToUpdate } = await hydrateEffectif(effectifData);

    if (effectifToCreate) {
      effectifCreatedId = await insertEffectif(effectifToCreate);

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
    if (effectifToUpdate) {
      effectifUpdatedId = effectifToUpdate?._id;
      if (lockEffectif) {
        await updateEffectifAndLock(effectifUpdatedId, effectifToUpdate);
      } else {
        await updateEffectif(effectifUpdatedId, effectifToUpdate);
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

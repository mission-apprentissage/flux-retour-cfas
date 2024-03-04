import { captureException } from "@sentry/node";
import { PromisePool } from "@supercharge/promise-pool";
import Boom from "boom";
import { STATUT_FIABILISATION_ORGANISME, STATUT_PRESENCE_REFERENTIEL } from "shared";

import {
  createOrganisme,
  findOrganismeByUaiAndSiret,
  updateOrganisme,
} from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { organismesDb, organismesReferentielDb } from "@/common/model/collections";

const JOB_NAME = "hydrate-organismes";

let nbOrganismeCreated = 0;
let nbOrganismeNotCreated = 0;
let nbOrganismeUpdated = 0;
let nbOrganismeNotUpdated = 0;

/**
 * Script qui initialise le stock des organismes
 * 1. On va créer tous les organismes "stock" non présents dans le tdb mais existants dans le référentiel
 * 2. Pour les organismes déjà présents va MAJ les organismes présent
 * Le format adresse des organismes du référentiel est différent du format tdb donc on va transformer le champ adresse
 */
export const hydrateOrganismesFromReferentiel = async () => {
  // On reset tous les organismes comme non présents dans le référentiel
  await resetOrganismesReferentielPresence();

  // On récupère l'intégralité des organismes depuis le référentiel
  const organismesFromReferentiel = await organismesReferentielDb().find().toArray();
  logger.info(`Traitement de ${organismesFromReferentiel.length} organismes provenant du référentiel...`);

  // Processes 10 organismes en // par défaut
  await PromisePool.for(organismesFromReferentiel).process(insertOrUpdateOrganisme);

  // Log & stats
  logger.info(`--> ${nbOrganismeCreated} organismes créés depuis le référentiel`);
  logger.info(`--> ${nbOrganismeNotCreated} organismes non créés depuis le référentiel (erreur)`);
  logger.info(`---> ${nbOrganismeUpdated} organismes mis à jour`);
  logger.info(`---> ${nbOrganismeNotUpdated} organismes non mis à jour depuis le référentiel (erreur)`);

  return {
    nbOrganismesCrees: nbOrganismeCreated,
    nbOrganismesNonCreesErreur: nbOrganismeNotCreated,
    nbOrganismesMaj: nbOrganismeUpdated,
    nbOrganismesNonMajErreur: nbOrganismeNotUpdated,
  };
};

/**
 * Fonction d'insertion ou de maj d'un organisme dans la collection
 * @param {*} organismeFromReferentiel
 */
const insertOrUpdateOrganisme = async (organismeFromReferentiel) => {
  const { uai, siret, nature, raison_sociale, adresse, etat_administratif, qualiopi, enseigne } =
    organismeFromReferentiel;

  const adresseFormatted = mapAdresseReferentielToAdresseTdb(adresse);
  const isFerme = etat_administratif ? (etat_administratif === "fermé" ? true : false) : false;

  // Recherche de l'organisme via le couple UAI - SIRET
  const organismeInTdb = await findOrganismeByUaiAndSiret(uai, siret);
  const uaiMultiplesInTdb = (await organismesDb().countDocuments({ siret })) > 1;

  // Ajout de l'organisme sans appels API si non existant dans le tdb
  if (!organismeInTdb) {
    try {
      await createOrganisme({
        ...(uai ? { uai } : {}),
        siret,
        ...(raison_sociale ? { nom: raison_sociale } : {}),
        ...(raison_sociale ? { raison_sociale } : {}),
        ...(enseigne ? { enseigne } : {}),
        nature,
        adresse: adresseFormatted,
        ferme: isFerme,
        qualiopi: qualiopi || false,
        fiabilisation_statut:
          !isFerme && uai ? STATUT_FIABILISATION_ORGANISME.FIABLE : STATUT_FIABILISATION_ORGANISME.INCONNU,
        est_dans_le_referentiel: uaiMultiplesInTdb
          ? STATUT_PRESENCE_REFERENTIEL.PRESENT_UAI_MULTIPLES_TDB
          : STATUT_PRESENCE_REFERENTIEL.PRESENT,
        organismesFormateurs: [],
        organismesResponsables: [],
      });
      nbOrganismeCreated++;
    } catch (error) {
      const err = Boom.internal("Erreur lors de la création de l'organisme", {
        organismeFromReferentiel,
        jobname: JOB_NAME,
      });
      err.cause = error;
      nbOrganismeNotCreated++;
      captureException(err);
    }
  } else {
    // Update de l'organisme sans appels API si existant
    const updatedOrganisme = {
      ...organismeInTdb,
      ...(raison_sociale ? { nom: raison_sociale } : {}),
      ...(raison_sociale ? { raison_sociale } : {}),
      ...(enseigne ? { enseigne } : {}),
      nature: nature,
      adresse: adresseFormatted,
      ferme: isFerme,
      qualiopi: qualiopi || false,
      fiabilisation_statut:
        !isFerme && uai ? STATUT_FIABILISATION_ORGANISME.FIABLE : STATUT_FIABILISATION_ORGANISME.INCONNU,
      est_dans_le_referentiel: uaiMultiplesInTdb
        ? STATUT_PRESENCE_REFERENTIEL.PRESENT_UAI_MULTIPLES_TDB
        : STATUT_PRESENCE_REFERENTIEL.PRESENT,
    };
    try {
      await updateOrganisme(organismeInTdb._id, updatedOrganisme);
      nbOrganismeUpdated++;
    } catch (error) {
      nbOrganismeNotUpdated++;
      const err = Boom.internal("Erreur lors de la mise à jour de l'organisme", {
        organismeFromReferentiel,
        jobname: JOB_NAME,
      });
      err.cause = error;
      captureException(err);
    }
  }
};

/**
 * Fonction de transformation de l'adresse au format référentiel vers le format attendu dans le tdb
 * @param {*} adresseReferentiel
 * @returns
 */
const mapAdresseReferentielToAdresseTdb = (adresseReferentiel) => {
  if (!adresseReferentiel) return {};

  const { code_insee, code_postal, localite, departement, region, academie, label } = adresseReferentiel;

  return {
    code_postal,
    code_insee,
    commune: localite,
    departement: departement?.code,
    region: region?.code,
    academie: academie?.code.replace(/^0+/, ""), // Mapping pour coller à notre constante ACADEMIES
    complete: label,
  };
};

/**
 * Reset du flag est_dans_le_referentiel pour tous les organismes
 */
export const resetOrganismesReferentielPresence = async () => {
  logger.info("Remise à 0 des organismes comme non présents dans le référentiel...");
  await organismesDb().updateMany({}, { $set: { est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT } });
};

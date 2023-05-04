import { PromisePool } from "@supercharge/promise-pool";

import { createJobEvent } from "@/common/actions/jobEvents.actions";
import {
  createOrganisme,
  findOrganismeByUaiAndSiret,
  updateOrganisme,
} from "@/common/actions/organismes/organismes.actions";
import { STATUT_FIABILISATION_ORGANISME } from "@/common/constants/fiabilisation";
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
 * 2. Pour les organismes déja présents va MAJ les organismes présent
 * Le format adresse des organismes du référentiel est différent du format tdb donc on va transformer le champ adresse
 * En cas d'erreurs on log via un createJobEvent()
 */
export const hydrateOrganismesFromReferentiel = async () => {
  // On remet à 0 l'information de présence dans le référentiel
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
 * Reset du flag est_dans_le_referentiel pour tous les organismes ayant au moins un siret
 */
const resetOrganismesReferentielPresence = async () => {
  logger.info("Remise à 0 des organismes comme non présents dans le référentiel...");
  await organismesDb().updateMany(
    { siret: { $exists: true } },
    { $set: { est_dans_le_referentiel: false, fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.INCONNU } }
  );
};

/**
 * Fonction d'insertion ou de maj d'un organisme dans la collection
 * @param {*} organismeFromReferentiel
 */
const insertOrUpdateOrganisme = async (organismeFromReferentiel) => {
  const { uai, siret, nature, raison_sociale, adresse, etat_administratif, qualiopi } = organismeFromReferentiel;

  const adresseFormatted = mapAdresseReferentielToAdresseTdb(adresse);
  const isFerme = etat_administratif ? (etat_administratif === "fermé" ? true : false) : false;

  // Recherche de l'organisme via le couple UAI - SIRET
  const organismeInTdb = await findOrganismeByUaiAndSiret(uai, siret);

  // Ajout de l'organisme sans appels API si non existant dans le tdb
  if (!organismeInTdb) {
    try {
      await createOrganisme(
        {
          ...(uai ? { uai } : {}),
          siret,
          ...(raison_sociale ? { nom: raison_sociale } : {}),
          nature,
          adresse: adresseFormatted,
          ferme: isFerme,
          qualiopi: qualiopi || false,
          est_dans_le_referentiel: true,
        },
        {
          buildFormationTree: false,
          buildInfosFromSiret: false,
          callLbaApi: false,
        }
      );
      nbOrganismeCreated++;
    } catch (error) {
      nbOrganismeNotCreated++;
      await createJobEvent({
        jobname: JOB_NAME,
        date: new Date(),
        action: "organisme-not-created",
        data: { organisme: organismeFromReferentiel, error },
      });
    }
  } else {
    // Update de l'organisme sans appels API si existant
    const updatedOrganisme = {
      ...organismeInTdb,
      ...(raison_sociale ? { nom: raison_sociale } : {}),
      nature: nature,
      adresse: adresseFormatted,
      ferme: isFerme,
      qualiopi: qualiopi || false,
      nature_validity_warning: false,
      est_dans_le_referentiel: true,
    };
    try {
      await updateOrganisme(organismeInTdb._id, updatedOrganisme, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });
      nbOrganismeUpdated++;
    } catch (error) {
      nbOrganismeNotUpdated++;
      await createJobEvent({
        jobname: JOB_NAME,
        date: new Date(),
        action: "organisme-notUpdated",
        data: { organisme: updatedOrganisme, error },
      });
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

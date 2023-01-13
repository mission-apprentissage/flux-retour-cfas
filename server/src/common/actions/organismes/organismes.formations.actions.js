import { ObjectId } from "mongodb";
import { getCatalogFormationsForOrganisme } from "../../apis/apiCatalogueMna.js";
import { organismesDb } from "../../model/collections.js";
import { asyncForEach } from "../../utils/asyncUtils.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../../utils/validationsUtils/organisme-de-formation/nature.js";
import { createFormation, getFormationWithCfd } from "../formations.actions.js";
import { findOrganismeByUai } from "./organismes.actions.js";

/**
 * Méthode de récupération de l'arbre des formations issues du catalogue liées à un organisme
 * @param {*} uai
 */
export const getFormationsTreeForOrganisme = async (uai) => {
  // Récupération des formations liés à l'organisme
  const catalogFormationsForOrganisme = await getCatalogFormationsForOrganisme(uai);

  // Construction d'une liste de formations pour cet organisme
  let formationsForOrganismeArray = [];
  let nbFormationsCreatedForOrganisme = 0;
  // let nbFormationsUpdatedForOrganisme = 0;
  let nbFormationsNotCreatedForOrganisme = 0;

  if (catalogFormationsForOrganisme?.length > 0) {
    await asyncForEach(catalogFormationsForOrganisme, async (currentFormation) => {
      let currentFormationId;

      // Récupération de la formation du catalogue dans le TDB, si pas présente on la créé
      // On count les formations créés / non crées (erreur)
      const formationFoundInTdb = await getFormationWithCfd(currentFormation.cfd);
      if (!formationFoundInTdb) {
        try {
          currentFormationId = await createFormation(currentFormation);
          nbFormationsCreatedForOrganisme++;
        } catch (error) {
          nbFormationsNotCreatedForOrganisme++;
        }
      } else {
        currentFormationId = formationFoundInTdb._id;
      }

      // Ajout à la liste des formation de l'organisme d'un item contenant
      // formation_id si trouvé dans le tdb
      // année & durée trouvé dans le catalog & formatted
      // ainsi que la liste des organismes construite depuis l'API Catalogue
      // unicité sur la formation_id

      const formationAlreadyInOrganismeArray = formationsForOrganismeArray.some(
        (item) => item.formation_id.toString() === currentFormationId.toString()
      );

      if (currentFormationId && !formationAlreadyInOrganismeArray) {
        formationsForOrganismeArray.push({
          ...(currentFormationId ? { formation_id: currentFormationId } : {}),
          annee_formation: parseInt(currentFormation.annee) || -1,
          duree_formation_theorique: parseInt(currentFormation.duree) || -1,
          organismes: await buildOrganismesListFromFormationFromCatalog(currentFormation),
        });
      }
    });
  }

  return {
    formations: formationsForOrganismeArray,
    nbFormationsCreatedForOrganisme,
    nbFormationsNotCreatedForOrganisme,
  };
};

/**
 * Méthode de construction de la liste des organismes avec leur nature, rattachés à une formation du catalogue
 * @param {*} formationCatalog
 * @returns
 */
const buildOrganismesListFromFormationFromCatalog = async (formationCatalog) => {
  let organismesLinkedToFormation = [];

  // Récupération du responsable (gestionnaire)
  if (formationCatalog.etablissement_gestionnaire_uai) {
    const organismeInTdb = await findOrganismeByUai(formationCatalog.etablissement_gestionnaire_uai);

    organismesLinkedToFormation.push({
      ...(organismeInTdb ? { organisme_id: organismeInTdb._id } : {}), // Si organisme trouvé dans le tdb
      ...(organismeInTdb ? { adresse: organismeInTdb.adresse } : {}), // Si organisme trouvé dans le tdb on son adresse
      nature: getOrganismeNature(
        NATURE_ORGANISME_DE_FORMATION.RESPONSABLE,
        formationCatalog,
        organismesLinkedToFormation
      ),
      uai: formationCatalog.etablissement_gestionnaire_uai,
      siret: formationCatalog.etablissement_gestionnaire_siret,
    });

    // TODO Voir ce qu'on fait si on ne trouve pas l'OF dans le tdb ? on le créé ? on logge l'anomalie ?
    // TODO Si pas d'organisme depuis le Tdb on récupère l'adresse from référentiel ?
  }

  // Gestion du formateur si nécessaire
  if (formationCatalog.etablissement_formateur_uai) {
    const organismeInTdb = await findOrganismeByUai(formationCatalog.etablissement_formateur_uai);

    organismesLinkedToFormation.push({
      ...(organismeInTdb ? { organisme_id: organismeInTdb._id } : {}), // Si organisme trouvé dans le tdb
      ...(organismeInTdb ? { adresse: organismeInTdb.adresse } : {}), // Si organisme trouvé dans le tdb on son adresse
      nature: getOrganismeNature(
        NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
        formationCatalog,
        organismesLinkedToFormation
      ),
      uai: formationCatalog.etablissement_formateur_uai,
      siret: formationCatalog.etablissement_formateur_siret,
    });

    // TODO Voir ce qu'on fait si on ne trouve pas l'OF dans le tdb ? on le créé ? on logge l'anomalie ?
    // TODO Si pas d'organisme depuis le Tdb on récupère l'adresse from référentiel ?
  }

  // Gestion du lieu de formation
  // TODO WIP
  organismesLinkedToFormation.push({
    nature: NATURE_ORGANISME_DE_FORMATION.LIEU,
    // uai: formationCatalog.XXXX, // TODO non récupérée par RCO donc pas présent dans le catalogue (vu avec Quentin)
    ...(formationCatalog.lieu_formation_siret ? { siret: formationCatalog.lieu_formation_siret } : {}),
    // TODO On récupère l'adresse depuis le référentiel en appelant avec le siret ?
  });

  return organismesLinkedToFormation;
};

/**
 * Vérifie la nature, si on détecte un uai formateur = responsable alors on est dans le cas d'un responsable_formateur
 * sinon on renvoi la nature default
 * @param {*} defaultNature
 * @param {*} formationCatalog
 * @param {*} organismesLinkedToFormation
 * @returns
 */
const getOrganismeNature = (defaultNature, formationCatalog, organismesLinkedToFormation) => {
  // Vérification si OF a la fois identifié gestionnaire (responsable) & formateur
  const isResponsableEtFormateur =
    formationCatalog.etablissement_gestionnaire_uai === formationCatalog.etablissement_formateur_uai;

  // Vérification s'il n'est pas déja dans la liste
  const isNotAlreadyInOrganismesLinkedToFormation = !organismesLinkedToFormation.some(
    (item) => item.uai === formationCatalog.etablissement_gestionnaire_uai
  );

  return isResponsableEtFormateur && isNotAlreadyInOrganismesLinkedToFormation
    ? NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR
    : defaultNature;
};

/**
 * Méthode de recherche d'une formation dans un organisme depuis un cfd
 * @param {string|ObjectId} id
 * @param {*} projection
 * @returns
 */
export const findOrganismeFormationByCfd = async (organisme_id, cfd) => {
  const organisme = await organismesDb().findOne({ _id: ObjectId(organisme_id) });

  const { _id: formationId } = await getFormationWithCfd(cfd, { _id: 1 });
  if (!formationId) return null;

  let found = null;
  for (const formation of organisme.formations) {
    if (formation.formation_id.toString() === formationId.toString()) {
      found = { ...formation };
    }
  }
  return found;
};

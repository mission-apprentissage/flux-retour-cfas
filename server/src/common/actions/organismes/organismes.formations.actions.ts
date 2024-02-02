import { ObjectId } from "mongodb";

import { createFormation, getFormationWithCfd } from "@/common/actions/formations.actions";
import { NATURE_ORGANISME_DE_FORMATION } from "@/common/constants/organisme";
import { formationsCatalogueDb } from "@/common/model/collections";

import { findOrganismeByUai } from "./organismes.actions";

/**
 * Méthode de récupération de l'arbre des formations issues du catalogue liées à un organisme
 */
export const getFormationsTreeForOrganisme = async (uai: string | undefined) => {
  if (!uai)
    return {
      formations: [],
      nbFormationsCreatedForOrganisme: 0,
      nbFormationsNotCreatedForOrganisme: 0,
    };

  // Récupération des formations liés à l'organisme
  const catalogFormationsForOrganismeCursor = formationsCatalogueDb().find({
    published: true,
    catalogue_published: true,
    $or: [{ etablissement_formateur_uai: uai }, { etablissement_gestionnaire_uai: uai }],
  });

  // Construction d'une liste de formations pour cet organisme
  let formationsForOrganismeArray: any[] = [];
  let nbFormationsCreatedForOrganisme = 0;
  let nbFormationsNotCreatedForOrganisme = 0;

  for await (const currentFormation of catalogFormationsForOrganismeCursor) {
    let currentFormationId: ObjectId;

    // Récupération de la formation du catalogue dans le TDB, si pas présente on la crée
    // On compte les formations créées / non créées (erreur)
    const formationFoundInTdb = await getFormationWithCfd(currentFormation.cfd);
    if (!formationFoundInTdb) {
      try {
        currentFormationId = await createFormation(currentFormation);
        nbFormationsCreatedForOrganisme++;
      } catch (error) {
        nbFormationsNotCreatedForOrganisme++;
        continue;
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
        cle_ministere_educatif: currentFormation.cle_ministere_educatif,
        duree_formation_theorique: parseInt(currentFormation.duree) || -1,
        organismes: await buildOrganismesListFromFormationFromCatalog(currentFormation),
      });
    }
  }

  return {
    formations: formationsForOrganismeArray,
    nbFormationsCreatedForOrganisme,
    nbFormationsNotCreatedForOrganisme,
  };
};

/**
 * Méthode de construction de la liste des organismes avec leur nature, rattachés à une formation du catalogue
 */
const buildOrganismesListFromFormationFromCatalog = async (formationCatalog: any) => {
  let organismesLinkedToFormation: any[] = [];

  // Récupération du responsable (gestionnaire)
  if (formationCatalog.etablissement_gestionnaire_uai) {
    const organismeInTdb = await findOrganismeByUai(formationCatalog.etablissement_gestionnaire_uai);

    organismesLinkedToFormation.push({
      ...(organismeInTdb ? { organisme_id: organismeInTdb._id } : {}), // Si organisme trouvé dans le tdb
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
    // TODO On récupère l'adresse depuis le référentiel en appelant avec le SIRET ?
  });

  return organismesLinkedToFormation;
};

/**
 * Vérifie la nature, si on détecte un UAI formateur = responsable alors on est dans le cas d'un responsable_formateur
 * sinon on renvoi la nature default
 */
const getOrganismeNature = (defaultNature: any, formationCatalog: any, organismesLinkedToFormation: any) => {
  // Vérification si OF a la fois identifié gestionnaire (responsable) & formateur
  const isResponsableEtFormateur =
    formationCatalog.etablissement_gestionnaire_uai === formationCatalog.etablissement_formateur_uai;

  // Vérification s'il n'est pas déjà dans la liste
  const isNotAlreadyInOrganismesLinkedToFormation = !organismesLinkedToFormation.some(
    (item) => item.uai === formationCatalog.etablissement_gestionnaire_uai
  );

  return isResponsableEtFormateur && isNotAlreadyInOrganismesLinkedToFormation
    ? NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR
    : defaultNature;
};

export async function searchOrganismesFormations(searchTerm: string): Promise<any[]> {
  const formations = await formationsCatalogueDb()
    .aggregate([
      {
        $match: {
          $or: [
            { intitule_long: { $regex: searchTerm, $options: "i" } },
            { cfd: searchTerm },
            { rncp_code: searchTerm },
          ],
        },
      },
      {
        $group: {
          _id: {
            cfd: "$cfd",
            rncp: "$rncp_code",
          },
          cle_ministere_educatif: { $last: "$cle_ministere_educatif" },
          intitule_long: { $last: "$intitule_long" },
          cfd: { $last: "$cfd" },
          rncp: { $last: "$rncp_code" },
          cfd_start_date: { $last: { $arrayElemAt: ["$periode", 0] } },
          cfd_end_date: { $last: { $arrayElemAt: ["$periode", 1] } },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: {
          intitule_long: 1,
        },
      },
      {
        $limit: 50,
      },
    ])
    .toArray();

  return formations;
}

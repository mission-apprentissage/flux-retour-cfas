import { AnyBulkWriteOperation, Db, Document, ObjectId } from "mongodb";

import logger from "@/common/logger";
import { normalisePersonIdentifiant } from "@/common/utils/identifiantUtils";

const DEFAULT_BATCH_SIZE = 1_000;
const WRITE_CONCERN = { w: "majority", wtimeoutMS: 60_000 } as const;

type Identifiant = { nom: string; prenom: string; date_de_naissance: Date };

type DossierFt = {
  _id: ObjectId;
  person_id?: ObjectId | null;
  effectif_snapshot?: { apprenant?: { nom?: string | null; prenom?: string | null; date_de_naissance?: Date | null } };
};

const identifiantDuSnapshot = (dossier: DossierFt): Identifiant | null => {
  const apprenant = dossier.effectif_snapshot?.apprenant;
  if (!apprenant?.nom || !apprenant.prenom || !(apprenant.date_de_naissance instanceof Date)) {
    return null;
  }
  return normalisePersonIdentifiant({
    nom: apprenant.nom,
    prenom: apprenant.prenom,
    date_de_naissance: apprenant.date_de_naissance,
  });
};

const collectionExiste = async (db: Db, name: string) => (await db.listCollections({ name }).toArray()).length > 0;

export const poserIdentifiantFranceTravail = async (db: Db, batchSize = DEFAULT_BATCH_SIZE) => {
  const dossiers = db.collection<DossierFt>("franceTravailEffectif");
  const personnes = db.collection<{ _id: ObjectId; identifiant: Identifiant }>("personV2");
  const personnesPresentes = await collectionExiste(db, "personV2");

  const compteurs = { depuisPersonne: 0, depuisSnapshot: 0, sansIdentifiant: 0 };
  for (;;) {
    const lot = await dossiers
      .find(
        { person_id: { $exists: true } },
        { projection: { _id: 1, person_id: 1, "effectif_snapshot.apprenant": 1 } }
      )
      .limit(batchSize)
      .toArray();
    if (lot.length === 0) break;

    const personIds = lot.flatMap(({ person_id }) => (person_id ? [person_id] : []));
    const identifiantsParPersonne = new Map<string, Identifiant>();
    if (personnesPresentes && personIds.length > 0) {
      for (const personne of await personnes.find({ _id: { $in: personIds } }).toArray()) {
        identifiantsParPersonne.set(personne._id.toString(), personne.identifiant);
      }
    }

    const operations: AnyBulkWriteOperation<DossierFt>[] = lot.map((dossier) => {
      const depuisPersonne = dossier.person_id ? identifiantsParPersonne.get(dossier.person_id.toString()) : undefined;
      const identifiant = depuisPersonne ?? identifiantDuSnapshot(dossier);
      if (depuisPersonne) compteurs.depuisPersonne++;
      else if (identifiant) compteurs.depuisSnapshot++;
      else compteurs.sansIdentifiant++;

      const update: Document = { $unset: { person_id: "" } };
      if (identifiant) update.$set = { identifiant_normalise: identifiant };
      return { updateOne: { filter: { _id: dossier._id }, update } };
    });
    await dossiers.bulkWrite(operations, {
      ordered: false,
      writeConcern: WRITE_CONCERN,
      bypassDocumentValidation: true,
    });
  }

  if (personnesPresentes) {
    await personnes.drop();
  }

  logger.info(
    { ...compteurs, personV2Supprimee: personnesPresentes },
    "[Migration] Identité posée sur les dossiers France Travail, personV2 supprimée"
  );
};

export const up = async (db: Db) => {
  await poserIdentifiantFranceTravail(db);
};

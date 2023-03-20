import { uploadsDb } from "../model/collections.js";
import { ObjectId, WithId } from "mongodb";
import { find, findIndex } from "lodash-es";
import { defaultValuesUpload } from "../model/uploads.model/uploads.model.js";

/**
 * Méthode de création d'un set d'uploads pour un organisme
 * @param {*} uploadProps
 * @returns
 */
export const createUpload = async ({ organisme_id }) => {
  const { insertedId } = await uploadsDb().insertOne({
    ...defaultValuesUpload(),
    organisme_id: new ObjectId(organisme_id),
  });

  const effectifCreated = await uploadsDb().findOne({ _id: insertedId });
  return effectifCreated;
};

export const getUploadEntryByOrgaId = async (organismeId, projection = {}) => {
  const organisme_id = typeof organismeId === "string" ? new ObjectId(organismeId) : organismeId;
  if (!ObjectId.isValid(organisme_id)) throw new Error("Invalid organismeId passed");

  const uploadEntry = await uploadsDb().findOne({ organisme_id }, { projection });
  if (!uploadEntry) {
    throw new Error(`Unable to find uploadEntry ${organisme_id.toString()}`);
  }

  return uploadEntry;
};

export const getDocument = async (organismeId, nom_fichier, chemin_fichier) => {
  const { documents } = await getUploadEntryByOrgaId(organismeId);

  const foundDocument = find(documents, {
    nom_fichier,
    chemin_fichier,
  });
  if (!foundDocument) {
    throw new Error("Document doesn't exist");
  }

  return foundDocument;
};

export const addDocument = async (
  organisme_id,
  { nom_fichier, chemin_fichier, taille_fichier, ext_fichier, hash_fichier, userEmail }
) => {
  /** @type {any} */
  let found: any = null;
  try {
    found = await getUploadEntryByOrgaId(organisme_id);
  } catch (error: any) {
    if (error.message.includes("Unable to find uploadEntry")) {
      found = await createUpload({ organisme_id });
    }
  }

  const newDocument = {
    document_id: new ObjectId(),
    ext_fichier,
    nom_fichier,
    chemin_fichier,
    taille_fichier,
    hash_fichier,
    confirm: false,
    created_at: new Date(),
    updated_at: new Date(),
    added_by: userEmail.toLowerCase(),
  };

  let newDocuments = [...found.documents];
  const foundIndexDocument = findIndex(newDocuments, {
    nom_fichier: newDocument.nom_fichier,
    taille_fichier: newDocument.taille_fichier,
  });
  if (foundIndexDocument !== -1) {
    newDocuments.splice(foundIndexDocument, 1);
  }
  newDocuments = [...newDocuments, newDocument];

  found.documents = newDocuments;

  const updated = await uploadsDb().findOneAndUpdate(
    { _id: found._id },
    {
      $set: { ...found, updated_at: new Date() },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

// TODO DIRTY update, to clean
export const updateDocument = async (organisme_id, { nom_fichier, taille_fichier, ...data }) => {
  /** @type {any} */
  let found: any = null;
  try {
    found = await getUploadEntryByOrgaId(organisme_id);
  } catch (error: any) {
    if (error.message.includes("Unable to find uploadEntry")) {
      found = await createUpload({ organisme_id });
    }
  }

  const foundIndexDocument = findIndex(found.documents, {
    nom_fichier: nom_fichier,
    taille_fichier: taille_fichier,
  });

  found.documents[foundIndexDocument] = {
    ...found.documents[foundIndexDocument],
    ...data,
  };

  const updated = await uploadsDb().findOneAndUpdate(
    { _id: found._id },
    {
      $set: { ...found, updated_at: new Date() },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

export const removeDocument = async (
  organismeId,
  { nom_fichier, chemin_fichier, taille_fichier }
): Promise<WithId<any>> => {
  const found = await getUploadEntryByOrgaId(organismeId);

  let newDocuments = [...found.documents];
  const foundIndexDocument = findIndex(newDocuments, {
    nom_fichier,
    chemin_fichier,
    taille_fichier,
  });
  if (foundIndexDocument === -1) {
    throw new Error("Something went wrong");
  }

  newDocuments.splice(foundIndexDocument, 1);

  const updated = await uploadsDb().findOneAndUpdate(
    { _id: found._id },
    {
      $set: {
        documents: newDocuments,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

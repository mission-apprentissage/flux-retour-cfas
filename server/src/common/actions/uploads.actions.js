import { uploadsDb } from "../model/collections.js";
import { ObjectId } from "mongodb";
import { find, findIndex } from "lodash-es";
import { defaultValuesUpload } from "../model/next.toKeep.models/uploads.model/uploads.model.js";

/**
 * Méthode de création d'un set d'uploads pour un organisme
 * @param {*} uploadProps
 * @returns
 */
export const createUpload = async ({ organisme_id }) => {
  const { insertedId } = await uploadsDb().insertOne({
    ...defaultValuesUpload(),
    organisme_id: ObjectId(organisme_id),
  });

  const effectifCreated = await uploadsDb().findOne({ _id: insertedId });
  return effectifCreated;
};

export const getUploadEntryByOrgaId = async (organismeId) => {
  const organisme_id = typeof organismeId === "string" ? ObjectId(organismeId) : organismeId;
  if (!ObjectId.isValid(organisme_id)) throw new Error("Invalid organismeId passed");

  const uploadEntry = await uploadsDb().findOne({ organisme_id });
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
  { type_document, nom_fichier, chemin_fichier, taille_fichier, ext_fichier, hash_fichier, userEmail }
) => {
  let found = null;
  try {
    found = await getUploadEntryByOrgaId(organisme_id);
  } catch (error) {
    if (error.message.includes("Unable to find uploadEntry")) {
      found = await createUpload({ organisme_id });
    }
  }

  const newDocument = {
    document_id: new ObjectId(),
    type_document,
    ext_fichier,
    nom_fichier,
    chemin_fichier,
    taille_fichier,
    hash_fichier,
    created_at: new Date(),
    updated_at: new Date(),
    added_by: userEmail.toLowerCase(),
  };

  let newDocuments = [...found.documents];
  const foundIndexDocument = findIndex(newDocuments, {
    type_document: newDocument.type_document,
    nom_fichier: newDocument.nom_fichier,
    taille_fichier: newDocument.taille_fichier,
  });
  if (foundIndexDocument != -1) {
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

export const removeDocument = async (organismeId, { type_document, nom_fichier, chemin_fichier, taille_fichier }) => {
  const found = await getUploadEntryByOrgaId(organismeId);

  let newDocuments = [...found.documents];
  const foundIndexDocument = findIndex(newDocuments, {
    type_document,
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

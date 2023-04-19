import { uploadsDb } from "../model/collections.js";
import { ObjectId, WithId } from "mongodb";
import { find, findIndex } from "lodash-es";
import { defaultValuesUpload } from "../model/uploads.model/uploads.model.js";
import { Upload } from "../model/@types/Upload.js";

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
  return effectifCreated as WithId<Required<Upload>>;
};

export const getUploadByOrgId = async (organisme_id: ObjectId, projection = {}) => {
  const upload = await uploadsDb().findOne({ organisme_id }, { projection });
  if (!upload) {
    throw new Error(`Unable to find upload ${organisme_id.toString()}`);
  }

  return upload as WithId<Required<Upload>>;
};

export const getOrCreateUploadByOrgId = async (organisme_id: ObjectId, projection = {}) => {
  let upload = await uploadsDb().findOne({ organisme_id }, { projection });
  if (!upload) {
    upload = await createUpload({ organisme_id });
  }
  return upload as WithId<Required<Upload>>;
};

export const getDocument = async (organismeId: ObjectId, nom_fichier: string, chemin_fichier: string) => {
  const { documents } = await getUploadByOrgId(organismeId);

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
  organisme_id: ObjectId,
  {
    nom_fichier,
    chemin_fichier,
    taille_fichier,
    ext_fichier,
    hash_fichier,
    userEmail,
  }: {
    nom_fichier: string;
    chemin_fichier: string;
    taille_fichier: number;
    ext_fichier: "xlsx" | "xls" | "csv";
    hash_fichier: string;
    userEmail: string;
  }
) => {
  const found = await getOrCreateUploadByOrgId(organisme_id);

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

export const updateDocument = async (organisme_id, document_id, data: Partial<Required<Upload>["documents"][0]>) => {
  // https://www.mongodb.com/docs/manual/reference/operator/update/positional/#update-documents-in-an-array
  const mongoUpdates = Object.entries(data).reduce(
    (acc, [key, value]) => ({ ...acc, [`documents.$.${key}`]: value }),
    {}
  );

  const updated = await uploadsDb().findOneAndUpdate(
    { organisme_id, documents: { $elemMatch: { document_id } } },
    { $set: mongoUpdates },
    { returnDocument: "after" }
  );
  return updated.value;
};

export const removeDocument = async (organisme_id: ObjectId, document_id: ObjectId) => {
  const updated = await uploadsDb().findOneAndUpdate(
    { organisme_id, documents: { $elemMatch: { document_id } } },
    { $pull: { documents: { document_id } } },
    { returnDocument: "before" }
  );
  const removedDoc = updated.value?.documents?.find((d) => d.document_id.equals(document_id));

  if (!removedDoc) {
    throw new Error(`Unable to remove document: document ${document_id} not found`);
  }

  return removedDoc;
};

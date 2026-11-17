import { isEqual } from "lodash-es";

import { modelDescriptors } from "@/common/model/collections";
import { buildCollectionValidator, getDatabase } from "@/common/mongodb";

export async function validateModels(): Promise<void> {
  const db = getDatabase();
  const collections = await db.listCollections({}, { nameOnly: false }).toArray();
  const optionsByName = new Map(collections.map((collection) => [collection.name, collection.options]));

  const misconfigured: string[] = [];
  const invalid: string[] = [];
  for (const { collectionName, zod } of modelDescriptors) {
    const validator = buildCollectionValidator(collectionName, zod);
    if (!validator || !optionsByName.has(collectionName)) continue;

    const options = optionsByName.get(collectionName);
    if (!isEqual(options?.validator, validator)) {
      misconfigured.push(`${collectionName} (absent ou différent du modèle)`);
    } else if (options?.validationLevel !== "strict" || options?.validationAction !== "error") {
      misconfigured.push(`${collectionName} (${options?.validationLevel}, ${options?.validationAction})`);
    }

    const invalidCount = await db.collection(collectionName).countDocuments({ $nor: [validator] });
    if (invalidCount > 0) {
      invalid.push(`${collectionName} (${invalidCount})`);
    }
  }

  const problems = [
    misconfigured.length > 0 ? `Validateurs non conformes : ${misconfigured.join(", ")}` : null,
    invalid.length > 0 ? `Documents invalides : ${invalid.join(", ")}` : null,
  ].filter((problem) => problem !== null);

  if (problems.length > 0) {
    throw new Error(problems.join(". "));
  }
}

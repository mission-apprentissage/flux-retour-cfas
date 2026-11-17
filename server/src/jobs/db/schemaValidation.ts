import { modelDescriptors } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";

export async function validateModels(): Promise<void> {
  const db = getDatabase();
  const collections = await db.listCollections({}, { nameOnly: false }).toArray();
  const validators = new Map(collections.map((collection) => [collection.name, collection.options?.validator]));

  const invalid: string[] = [];
  for (const { collectionName } of modelDescriptors) {
    const validator = validators.get(collectionName);
    if (!validator) continue;

    const invalidCount = await db.collection(collectionName).countDocuments({ $nor: [validator] });
    if (invalidCount > 0) {
      invalid.push(`${collectionName} (${invalidCount})`);
    }
  }

  if (invalid.length > 0) {
    throw new Error(`Documents invalides : ${invalid.join(", ")}`);
  }
}

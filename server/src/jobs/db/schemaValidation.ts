import { modelDescriptors } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";

async function countInvalidDocuments(collectionName: string): Promise<number> {
  const collection = getDatabase().collection(collectionName);
  const options = await collection.options();

  return collection.countDocuments({ $nor: [options.validator] });
}

export async function validateModels(): Promise<void> {
  const counts = await Promise.all(
    modelDescriptors.map(async (d) => ({
      collectionName: d.collectionName,
      invalidCount: await countInvalidDocuments(d.collectionName),
    }))
  );

  const invalid = counts.filter(({ invalidCount }) => invalidCount > 0);
  if (invalid.length > 0) {
    const detail = invalid.map(({ collectionName, invalidCount }) => `${collectionName} (${invalidCount})`).join(", ");
    // Le job relance : job-processor capture, inutile de le faire ici.
    throw new Error(`Documents invalides : ${detail}`);
  }
}

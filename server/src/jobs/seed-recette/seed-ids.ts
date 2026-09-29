import { ObjectId } from "mongodb";

const PREFIX = "5eed";
const SUFFIX_LENGTH = 24 - PREFIX.length;

export const SEED_ID_RANGE = {
  $gte: new ObjectId(PREFIX + "0".repeat(SUFFIX_LENGTH)),
  $lte: new ObjectId(PREFIX + "f".repeat(SUFFIX_LENGTH)),
};

export function seedId(n: number): ObjectId {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new Error(`Index de seed invalide : ${n}`);
  }
  return new ObjectId(PREFIX + n.toString(16).padStart(SUFFIX_LENGTH, "0"));
}

export function isSeedId(id: ObjectId): boolean {
  return id.toHexString().startsWith(PREFIX);
}

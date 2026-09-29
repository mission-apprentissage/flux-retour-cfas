import { ObjectId } from "mongodb";

const PREFIX = "5eed";
const SUFFIX_LENGTH = 24 - PREFIX.length;
const KIND_LENGTH = 2;
const INDEX_LENGTH = SUFFIX_LENGTH - KIND_LENGTH;

const SEED_KINDS = {
  effectif: 1,
  effectifDeca: 2,
  decaRaw: 3,
  dossierMl: 4,
  log: 5,
  user: 6,
  invitation: 7,
} as const;

export type SeedKind = keyof typeof SEED_KINDS;

export const SEED_ID_RANGE = {
  $gte: new ObjectId(PREFIX + "0".repeat(SUFFIX_LENGTH)),
  $lte: new ObjectId(PREFIX + "f".repeat(SUFFIX_LENGTH)),
};

export function seedId(kind: SeedKind, n: number): ObjectId {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new Error(`Index de seed invalide : ${n}`);
  }
  const kindHex = SEED_KINDS[kind].toString(16).padStart(KIND_LENGTH, "0");
  return new ObjectId(PREFIX + kindHex + n.toString(16).padStart(INDEX_LENGTH, "0"));
}

export function isSeedId(id: ObjectId): boolean {
  return id.toHexString().startsWith(PREFIX);
}

import { ObjectId, WithId } from "mongodb";

/**
 * Supprime toutes les attributs à false ou 0 pour éviter une erreur mongodb
 */
export function cleanProjection<
  Document = object,
  Projection = Partial<Record<keyof WithId<Document>, any | boolean | 0 | 1>>,
>(projection: Projection): Projection {
  return Object.entries(projection as any).reduce((acc, value) => {
    if (value[1] !== false && value[1] !== 0) {
      acc[value[0]] = value[1];
    }
    return acc;
  }, {} as Projection);
}

/**
 * Crée un type qui convertit tous les ObjectId en string.
 * Pour transformer un type de la BDD en type serialisé par exemple.
 */
export type MapObjectIdToString<Type> = Type extends ObjectId
  ? string
  : Type extends Record<any, any>
  ? {
      [K in keyof Type]: MapObjectIdToString<Type[K]>;
    }
  : Type;

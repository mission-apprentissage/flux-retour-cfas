import { EnhancedOmit } from "mongodb";

/** Add an _id field of type string to an object shaped type */
export declare type WithStringId<TSchema> = EnhancedOmit<TSchema, "_id"> & {
  _id: string;
};

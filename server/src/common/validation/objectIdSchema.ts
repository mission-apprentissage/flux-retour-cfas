import { ObjectId } from "mongodb";
import { z } from "zod";

const objectIdSchema = (idField: string) =>
  z.object({
    [idField]: z.preprocess((v: any) => (ObjectId.isValid(v) ? new ObjectId(v) : v), z.instanceof(ObjectId)),
  });

export default objectIdSchema;

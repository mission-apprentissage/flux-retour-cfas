import { z } from "zod";

const uploadUpdateDocumentSchema = () =>
  z.object({
    type_document: z.string(),
  });

export default uploadUpdateDocumentSchema;

import { z } from "zod";

const uploadedDocumentSchema = () =>
  z.object({
    path: z.string(),
    name: z.string(),
  });

export default uploadedDocumentSchema;

import { z } from "zod";

const uploadedDocumentSchema = () =>
  z.object({
    document_id: z.string(),
  });

export default uploadedDocumentSchema;

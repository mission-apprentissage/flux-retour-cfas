import { strict as assert } from "assert";

import { effectifsDb } from "@/common/model/collections";
import { formatError } from "@/common/utils/errorUtils";
import { useMongo } from "@tests/jest/setupMongo";

describe("ErrorUtils", () => {
  useMongo();
  it("display details for Document failed validation on one document", async () => {
    try {
      await effectifsDb().insertOne({} as any);
    } catch (error) {
      const newError = formatError(error);
      assert.deepEqual(newError.message, "Document failed validation");
      assert.deepEqual(
        newError.toString(),
        'Document failed validation: [{"operatorName":"required","specifiedAs":{"required":["_id","organisme_id","id_erp_apprenant","source","annee_scolaire","apprenant"]},"missingProperties":["annee_scolaire","apprenant","id_erp_apprenant","organisme_id","source"]}]'
      );
    }
  });

  it("doesn't display details for Document failed validation on many documents", async () => {
    try {
      await effectifsDb().insertMany([{ name: "test1" }, { name: "test2" }] as any[]);
    } catch (error) {
      const newError = formatError(error);
      assert.deepEqual(newError.message, "Document failed validation");
      assert.deepEqual(newError.toString(), "Document failed validation");
    }
  });
});

import { strict as assert } from "assert";

import paginationShema from "../../../../src/common/validation/paginationSchema.js";
import searchShema from "../../../../src/common/validation/searchSchema.js";
import organismesFilterSchema from "../../../../src/common/validation/organismesFilterSchema.js";

const listSchema = paginationShema({ defaultSort: "created_at:-1" })
  .merge(searchShema())
  .merge(organismesFilterSchema())
  .strict();

describe("paginationShema", () => {
  it("returns default if nothing is provided", () => {
    const output = paginationShema({ defaultSort: "created_at:-1" }).strict().safeParse({});
    assert.deepStrictEqual(output, {
      success: true,
      data: { page: 1, limit: 10, sort: { created_at: -1 } },
    });
  });
  it("returns default if nothing is provided", () => {
    const output = paginationShema({ defaultSort: "created_at:-1" })
      .strict()
      .safeParse({ page: "2", limit: "100", sort: "name:1" });

    assert.deepStrictEqual(output, {
      success: true,
      data: { page: 2, limit: 100, sort: { name: 1 } },
    });
  });

  it("should work also with a merged schema", () => {
    const output = listSchema.strict().safeParse({ page: "1" });

    assert.deepStrictEqual(output, {
      success: true,
      data: { page: 1, limit: 10, sort: { created_at: -1 } },
    });
  });
});

import { strict as assert } from "assert";

import paginationShema from "../../../../src/common/validation/paginationSchema.js";

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
});

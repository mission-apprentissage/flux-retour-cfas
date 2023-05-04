import { schema } from "@/common/model/effectifs.model/effectifs.model";

describe("Model Effectif", () => {
  it("should have a valid JSON schema", () => {
    expect(schema).toMatchSnapshot();
  });
});

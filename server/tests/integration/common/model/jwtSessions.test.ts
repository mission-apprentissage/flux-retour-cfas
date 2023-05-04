import jwtSessionsModel from "@/common/model/jwtSessions.model";

describe("Model JwtSession", () => {
  it("should have a valid JSON schema", () => {
    expect(jwtSessionsModel.schema).toMatchSnapshot();
  });
});

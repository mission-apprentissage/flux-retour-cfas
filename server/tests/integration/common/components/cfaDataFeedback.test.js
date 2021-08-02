const assert = require("assert").strict;
const omit = require("lodash.omit");
const integrationTests = require("../../../utils/integrationTests");
const cfaDataFeedbackComponent = require("../../../../src/common/components/cfaDataFeedback");

integrationTests(__filename, () => {
  describe("createCfaDataFeedback", () => {
    const { createCfaDataFeedback } = cfaDataFeedbackComponent();

    it("throws when given uai is invalid", async () => {
      try {
        await createCfaDataFeedback("invalid");
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("returns created CfaDataFeedback", async () => {
      const props = {
        uai: "0451582A",
        details: "blabla",
        email: "mail@example.com",
      };
      const created = await createCfaDataFeedback(props);

      assert.deepEqual(omit(created, ["created_at", "_id", "__v"]), {
        uai: props.uai,
        details: props.details,
        email: props.email,
      });
    });
  });
});

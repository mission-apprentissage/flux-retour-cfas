const assert = require("assert").strict;
const omit = require("lodash.omit");
const cfaDataFeedbackComponent = require("../../../../src/common/components/cfaDataFeedback");
const { CfaModel } = require("../../../../src/common/model");

describe(__filename, () => {
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
      const sampleUai = "0451582A";
      const sampleRegion_nom = "Normandie";
      const sampleRegion_num = "28";

      // Add Cfa with region_num / region_nom for valid UAI
      await new CfaModel({
        uai: sampleUai,
        region_nom: sampleRegion_nom,
        region_num: sampleRegion_num,
      }).save();

      const props = {
        uai: sampleUai,
        details: "blabla",
        email: "mail@example.com",
        region_nom: sampleRegion_nom,
        region_num: sampleRegion_num,
      };
      const created = await createCfaDataFeedback(props);

      assert.deepEqual(omit(created, ["created_at", "_id", "__v"]), {
        uai: props.uai,
        details: props.details,
        email: props.email,
        region_nom: props.region_nom,
        region_num: props.region_num,
      });
    });
  });
});

const assert = require("assert").strict;
const omit = require("lodash.omit");
const integrationTests = require("../../../utils/integrationTests");
const cfaDataFeedbackComponent = require("../../../../src/common/components/cfaDataFeedback");
const { CfaDataFeedback: CfaDataFeedbackModel } = require("../../../../src/common/model");

integrationTests(__filename, () => {
  describe("getCfaDataFeedbackBySiret", () => {
    const { getCfaDataFeedbackBySiret } = cfaDataFeedbackComponent();

    it("returns null when no CfaDataFeedback exists with given siret", async () => {
      const found = await getCfaDataFeedbackBySiret("blabla");
      assert.equal(found, null);
    });

    it("returns CfaDataFeedback with given siret when it exists", async () => {
      const siret = "80320291800022";
      const createdCfaDataFeedback = await new CfaDataFeedbackModel({
        siret,
        details: "blabla",
        email: "mail@example.com",
        donnee_est_valide: true,
        created_at: new Date(),
      }).save();

      const found = await getCfaDataFeedbackBySiret(siret);
      assert.deepEqual(createdCfaDataFeedback.toObject(), found);
    });
  });

  describe("createCfaDataFeedback", () => {
    const { createCfaDataFeedback } = cfaDataFeedbackComponent();

    it("throws when given siret is invalid", async () => {
      try {
        await createCfaDataFeedback("invalid");
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("returns created CfaDataFeedback", async () => {
      const props = {
        siret: "80320291800022",
        details: "blabla",
        email: "mail@example.com",
        dataIsValid: true,
      };
      const created = await createCfaDataFeedback(props);

      assert.deepEqual(omit(created, ["created_at", "_id", "__v"]), {
        siret: props.siret,
        details: props.details,
        email: props.email,
        donnee_est_valide: props.dataIsValid,
      });
    });
  });
});

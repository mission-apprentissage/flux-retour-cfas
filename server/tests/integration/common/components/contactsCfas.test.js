const assert = require("assert").strict;
const contactsCfas = require("../../../../src/common/components/contactsCfas");
const { ContactCfaModel } = require("../../../../src/common/model");

describe(__filename, () => {
  it("Permet de vérifier la création d'un contact de cfa", async () => {
    const { create } = await contactsCfas();

    const testContactCfa = {
      uai: "0670141P",
      siret: "19880153200047",
      email_contact: "test@email.fr",
      email_contact_confirme: true,
      sources: ["catalogue", "affelnet"],
    };

    await create(testContactCfa);

    const found = await ContactCfaModel.findOne({ siret: testContactCfa.siret }).lean();
    assert.equal(found.uai, testContactCfa.uai);
    assert.equal(found.email_contact, testContactCfa.email_contact);
    assert.equal(found.email_contact_confirme, testContactCfa.email_contact_confirme);
    assert.equal(JSON.stringify(found.sources), JSON.stringify(testContactCfa.sources));
    assert.notEqual(found.created_at, null);
  });
});

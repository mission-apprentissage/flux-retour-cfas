const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const userEvents = require("../../../../src/common/components/userEvents");
const { UserEventModel } = require("../../../../src/common/model");

integrationTests(__filename, () => {
  it("Permet de retrouver la date du dernier userEvent", async () => {
    const { getLastUserEventDate } = await userEvents();

    // Add first user event
    const firstEvent = new UserEventModel({
      username: "TEST",
      type: "TYPE",
      action: "ACTION",
      data: null,
    });
    await firstEvent.save();
    const firstDateCreated = await UserEventModel.findOne({ username: "TEST", type: "TYPE", action: "ACTION" });

    // Add second user event
    const secondEvent = new UserEventModel({
      username: "TEST",
      type: "TYPE",
      action: "ACTION",
      data: null,
    });
    await secondEvent.save();

    const found = await getLastUserEventDate({ username: "TEST", type: "TYPE", action: "ACTION" });
    assert.notEqual(found, null);
    assert.notEqual(found, firstDateCreated);
  });

  it("Permet de retrouver les données envoyées pour un uai", async () => {
    const { getDataForUai } = await userEvents();

    // Add events
    const gestiEvent = new UserEventModel({
      username: "gesti",
      type: "ftp",
      action: "upload",
      data: [{ uai_etablissement: "123456" }],
    });
    const ymagEvent = new UserEventModel({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ uai_etablissement: "123456" }],
    });
    await gestiEvent.save();
    await ymagEvent.save();

    const found = await getDataForUai("123456");
    assert.notDeepEqual(found, []);
    assert.deepEqual(found.length, 2);
    assert.deepEqual(found[0].username, "gesti");
    assert.deepEqual(found[1].username, "ymag");
  });

  it("Permet de retrouver les données envoyées pour un siret", async () => {
    const { getDataForSiret } = await userEvents();

    // Add events
    const gestiEvent = new UserEventModel({
      username: "gesti",
      type: "ftp",
      action: "upload",
      data: [{ siret_etablissement: "12345678911111" }],
    });
    const ymagEvent = new UserEventModel({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ siret_etablissement: "12345678911111" }],
    });
    await gestiEvent.save();
    await ymagEvent.save();

    const found = await getDataForSiret("12345678911111");
    assert.notDeepEqual(found, []);
    assert.deepEqual(found.length, 2);
    assert.deepEqual(found[0].username, "gesti");
    assert.deepEqual(found[1].username, "ymag");
  });

  it("Permet de ne pas retrouver les données envoyées pour un mauvais uai", async () => {
    const { getDataForUai } = await userEvents();

    // Add events
    const ymagEvent = new UserEventModel({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ uai_etablissement: "123456" }],
    });
    await ymagEvent.save();

    const badUaiFound = await getDataForUai("BADUAI");
    assert.deepEqual(badUaiFound, []);

    const goodUaiFound = await getDataForUai("123456");
    assert.notDeepEqual(goodUaiFound, []);
    assert.deepEqual(goodUaiFound.length, 1);
    assert.deepEqual(goodUaiFound[0].username, "ymag");
  });

  it("Permet de ne pas retrouver les données envoyées pour un mauvais siret", async () => {
    const { getDataForSiret } = await userEvents();

    // Add events
    const ymagEvent = new UserEventModel({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ siret_etablissement: "12345678911111" }],
    });
    await ymagEvent.save();

    const badFound = await getDataForSiret("BADSIRET");
    assert.deepEqual(badFound, []);

    const goodFound = await getDataForSiret("12345678911111");
    assert.notDeepEqual(goodFound, []);
    assert.deepEqual(goodFound.length, 1);
    assert.deepEqual(goodFound[0].username, "ymag");
  });

  it("Permet de compter les données envoyées pour un uai", async () => {
    const { countDataForUai } = await userEvents();

    // Add events
    const gestiEvent = new UserEventModel({
      username: "gesti",
      type: "ftp",
      action: "upload",
      data: [{ uai_etablissement: "123456" }],
    });
    const ymagEvent = new UserEventModel({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ uai_etablissement: "123456" }],
    });
    await gestiEvent.save();
    await ymagEvent.save();

    const count = await countDataForUai("123456");
    assert.deepEqual(count, 2);
  });

  it("Permet de compter les données envoyées pour un siret", async () => {
    const { countDataForSiret } = await userEvents();

    // Add events
    const gestiEvent = new UserEventModel({
      username: "gesti",
      type: "ftp",
      action: "upload",
      data: [{ siret_etablissement: "12345678911111" }],
    });
    const ymagEvent = new UserEventModel({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ siret_etablissement: "12345678911111" }],
    });
    await gestiEvent.save();
    await ymagEvent.save();

    const count = await countDataForSiret("12345678911111");
    assert.deepEqual(count, 2);
  });
});

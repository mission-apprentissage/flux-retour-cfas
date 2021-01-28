const assert = require("assert");
const integrationTests = require("../../utils/integrationTests");
const userEvents = require("../../../src/common/components/userEvents");
const { UserEvent } = require("../../../src/common/model");

integrationTests(__filename, () => {
  it("Permet de retrouver la date du dernier userEvent", async () => {
    const { getLastUserEventDate } = await userEvents();

    // Add first user event
    const firstEvent = new UserEvent({
      username: "TEST",
      type: "TYPE",
      action: "ACTION",
      data: null,
    });
    await firstEvent.save();
    const firstDateCreated = await UserEvent.findOne({ username: "TEST", type: "TYPE", action: "ACTION" });

    // Add second user event
    const secondEvent = new UserEvent({
      username: "TEST",
      type: "TYPE",
      action: "ACTION",
      data: null,
    });
    await secondEvent.save();

    const found = await getLastUserEventDate({ username: "TEST", type: "TYPE", action: "ACTION" });
    assert.notStrictEqual(found, null);
    assert.notStrictEqual(found, firstDateCreated);
  });

  it("Permet de retrouver la date des derniers imports par source", async () => {
    const { getLastImportDatesForSources } = await userEvents();

    // Add events
    const gestiEvent = new UserEvent({
      username: "gesti",
      type: "ftp",
      action: "upload",
      data: null,
    });
    const ymagEvent = new UserEvent({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: null,
    });
    await gestiEvent.save();
    await ymagEvent.save();

    const found = await getLastImportDatesForSources();
    assert.notStrictEqual(found, null);
    assert.strictEqual(found.length, 2);
    assert.strictEqual(found[0].source, "gesti");
    assert.strictEqual(found[1].source, "ymag");
  });

  it("Permet de retrouver les données envoyées pour un uai", async () => {
    const { getDataForUai } = await userEvents();

    // Add events
    const gestiEvent = new UserEvent({
      username: "gesti",
      type: "ftp",
      action: "upload",
      data: [{ uai_etablissement: "123456" }],
    });
    const ymagEvent = new UserEvent({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ uai_etablissement: "123456" }],
    });
    await gestiEvent.save();
    await ymagEvent.save();

    const found = await getDataForUai("123456");
    assert.notDeepStrictEqual(found, []);
    assert.deepStrictEqual(found.length, 2);
    assert.deepStrictEqual(found[0].username, "gesti");
    assert.deepStrictEqual(found[1].username, "ymag");
  });

  it("Permet de retrouver les données envoyées pour un siret", async () => {
    const { getDataForSiret } = await userEvents();

    // Add events
    const gestiEvent = new UserEvent({
      username: "gesti",
      type: "ftp",
      action: "upload",
      data: [{ siret_etablissement: "12345678911111" }],
    });
    const ymagEvent = new UserEvent({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ siret_etablissement: "12345678911111" }],
    });
    await gestiEvent.save();
    await ymagEvent.save();

    const found = await getDataForSiret("12345678911111");
    assert.notDeepStrictEqual(found, []);
    assert.deepStrictEqual(found.length, 2);
    assert.deepStrictEqual(found[0].username, "gesti");
    assert.deepStrictEqual(found[1].username, "ymag");
  });

  it("Permet de ne pas retrouver les données envoyées pour un mauvais uai", async () => {
    const { getDataForUai } = await userEvents();

    // Add events
    const ymagEvent = new UserEvent({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ uai_etablissement: "123456" }],
    });
    await ymagEvent.save();

    const badUaiFound = await getDataForUai("BADUAI");
    assert.deepStrictEqual(badUaiFound, []);

    const goodUaiFound = await getDataForUai("123456");
    assert.notDeepStrictEqual(goodUaiFound, []);
    assert.deepStrictEqual(goodUaiFound.length, 1);
    assert.deepStrictEqual(goodUaiFound[0].username, "ymag");
  });

  it("Permet de ne pas retrouver les données envoyées pour un mauvais siret", async () => {
    const { getDataForSiret } = await userEvents();

    // Add events
    const ymagEvent = new UserEvent({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ siret_etablissement: "12345678911111" }],
    });
    await ymagEvent.save();

    const badFound = await getDataForSiret("BADSIRET");
    assert.deepStrictEqual(badFound, []);

    const goodFound = await getDataForSiret("12345678911111");
    assert.notDeepStrictEqual(goodFound, []);
    assert.deepStrictEqual(goodFound.length, 1);
    assert.deepStrictEqual(goodFound[0].username, "ymag");
  });

  it("Permet de compter les données envoyées pour un uai", async () => {
    const { countDataForUai } = await userEvents();

    // Add events
    const gestiEvent = new UserEvent({
      username: "gesti",
      type: "ftp",
      action: "upload",
      data: [{ uai_etablissement: "123456" }],
    });
    const ymagEvent = new UserEvent({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ uai_etablissement: "123456" }],
    });
    await gestiEvent.save();
    await ymagEvent.save();

    const count = await countDataForUai("123456");
    assert.deepStrictEqual(count, 2);
  });

  it("Permet de compter les données envoyées pour un siret", async () => {
    const { countDataForSiret } = await userEvents();

    // Add events
    const gestiEvent = new UserEvent({
      username: "gesti",
      type: "ftp",
      action: "upload",
      data: [{ siret_etablissement: "12345678911111" }],
    });
    const ymagEvent = new UserEvent({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
      data: [{ siret_etablissement: "12345678911111" }],
    });
    await gestiEvent.save();
    await ymagEvent.save();

    const count = await countDataForSiret("12345678911111");
    assert.deepStrictEqual(count, 2);
  });
});

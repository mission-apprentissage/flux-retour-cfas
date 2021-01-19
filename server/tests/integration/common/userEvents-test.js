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
});

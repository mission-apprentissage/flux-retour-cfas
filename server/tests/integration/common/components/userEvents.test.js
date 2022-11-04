const assert = require("assert").strict;
const userEvents = require("../../../../src/common/components/userEvents");
const { UserEventModel, UserModel } = require("../../../../src/common/model");
const users = require("../../../../src/common/components/users");
// eslint-disable-next-line node/no-unpublished-require
const MockDate = require("mockdate");
const { USER_EVENTS_TYPES, USER_EVENTS_ACTIONS } = require("../../../../src/common/constants/userEventsConstants.js");
const { addMinutes } = require("date-fns");

describe(__filename, () => {
  describe("createUserEvent", () => {
    it("Permet de créer un userEvent et de le sauver en base", async () => {
      const { create } = userEvents();

      await create({ username: "admin", type: "any", action: "test", data: { hello: "world" }, date: new Date() });
      const foundInDb = await UserEventModel.findOne({ username: "admin" });
      assert.ok(foundInDb);
    });

    it("Permet de créer un userEvent pour un user avec region", async () => {
      const { create } = userEvents();
      const { createUser } = await users();

      const usernameTest = "userTest";
      const regionTest = "REGION";

      await createUser({
        username: usernameTest,
        password: "password",
        email: "email@test.fr",
        region: regionTest,
      });

      const foundUser = await UserModel.findOne({ username: usernameTest });
      assert.equal(foundUser.region === regionTest, true);

      await create({ username: usernameTest, type: "any", action: "test", data: { hello: "world" }, date: new Date() });
      const foundUserEvent = await UserEventModel.findOne({ username: usernameTest });
      assert.ok(foundUserEvent);
      assert.equal(foundUserEvent.username === usernameTest, true);
      assert.equal(foundUserEvent.user_region === regionTest, true);
    });

    it("Permet de créer un userEvent pour un user avec organisme", async () => {
      const { create } = userEvents();
      const { createUser } = await users();

      const usernameTest = "userTest";
      const organismeTest = "ORGANISME";

      await createUser({
        username: usernameTest,
        password: "password",
        email: "email@test.fr",
        organisme: organismeTest,
      });

      const foundUser = await UserModel.findOne({ username: usernameTest });
      assert.equal(foundUser.organisme === organismeTest, true);

      await create({ username: usernameTest, type: "any", action: "test", data: { hello: "world" }, date: new Date() });
      const foundUserEvent = await UserEventModel.findOne({ username: usernameTest });
      assert.ok(foundUserEvent);
      assert.equal(foundUserEvent.username === usernameTest, true);
      assert.equal(foundUserEvent.user_organisme === organismeTest, true);
    });

    it("Permet de créer un userEvent pour un user avec réseau", async () => {
      const { create } = userEvents();
      const { createUser } = await users();

      const usernameTest = "userTest";
      const networkTest = "RESEAU";

      await createUser({
        username: usernameTest,
        password: "password",
        email: "email@test.fr",
        network: networkTest,
      });

      const foundUser = await UserModel.findOne({ username: usernameTest });
      assert.equal(foundUser.network === networkTest, true);

      await create({ username: usernameTest, type: "any", action: "test", data: { hello: "world" }, date: new Date() });
      const foundUserEvent = await UserEventModel.findOne({ username: usernameTest });
      assert.ok(foundUserEvent);
      assert.equal(foundUserEvent.username === usernameTest, true);
      assert.equal(foundUserEvent.user_network === networkTest, true);
    });
  });

  describe("getUploadHistoryList", () => {
    it("Permet de récupérer un historique de téléchargement valide et trié par date_creation desc", async () => {
      const { getUploadHistoryList, create } = userEvents();

      const testUserMail = "testUser@test.fr";

      const firstDate = new Date();
      MockDate.set(firstDate);

      await create({
        username: testUserMail,
        type: USER_EVENTS_TYPES.POST,
        action: USER_EVENTS_ACTIONS.UPLOAD.SUCCESS,
        data: { originalname: "monFichier.xlsx" },
      });

      const secondDate = addMinutes(firstDate, 5);
      MockDate.set(secondDate);

      // Not valid for upload
      await create({
        username: testUserMail,
        type: USER_EVENTS_TYPES.POST,
        action: USER_EVENTS_ACTIONS.UPLOAD.INIT,
        data: { originalname: "monFichierNotValid.xlsx" },
      });

      // Not valid for user
      await create({
        username: "otherUser@test.fr",
        type: USER_EVENTS_TYPES.POST,
        action: USER_EVENTS_ACTIONS.UPLOAD.SUCCESS,
        data: { originalname: "monFichierPourUnAutreUser.xlsx" },
      });

      await create({
        username: testUserMail,
        type: USER_EVENTS_TYPES.POST,
        action: USER_EVENTS_ACTIONS.UPLOAD.SUCCESS,
        data: { originalname: "monFichier2.xlsx" },
      });

      const uploadHistory = await getUploadHistoryList({ username: "testUser@test.fr" });

      assert.deepEqual(uploadHistory.length === 2, true);
      assert.equal(uploadHistory[0].nom_fichier === "monFichier2.xlsx", true);
      assert.equal(uploadHistory[0].date_creation.getTime() === secondDate.getTime(), true);
      assert.equal(uploadHistory[1].nom_fichier === "monFichier.xlsx", true);
      assert.equal(uploadHistory[1].date_creation.getTime() === firstDate.getTime(), true);
    });

    it("Permet de récupérer un historique de téléchargement vide", async () => {
      const { getUploadHistoryList } = userEvents();

      const uploadHistory = await getUploadHistoryList({ username: "testUser@test.fr" });
      assert.deepEqual(uploadHistory, []);
    });
  });
});

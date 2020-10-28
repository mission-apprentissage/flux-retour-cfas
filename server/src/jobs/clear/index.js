const { runScript } = require("../scriptWrapper");
const clear = require("./clear");

runScript(async () => {
  await clear();
});

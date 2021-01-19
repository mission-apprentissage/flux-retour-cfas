const { UserEvent } = require("../model");

module.exports = () => ({
  getLastUserEventDate,
  getLastImportDatesForSources,
});

const getLastUserEventDate = async ({ username, type, action }) => {
  const lastUserEventDate = await UserEvent.findOne({ username: username, type: type, action: action }).sort({
    date: "desc",
  });
  return lastUserEventDate?.date.toLocaleString("fr-FR");
};

const getLastImportDatesForSources = async () => [
  {
    source: "gesti",
    date: await getLastUserEventDate({
      username: "gesti",
      type: "ftp",
      action: "upload",
    }),
  },
  {
    source: "ymag",
    date: await getLastUserEventDate({
      username: "ymag",
      type: "POST",
      action: "statut-candidats",
    }),
  },
];

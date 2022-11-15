export const up = async (db) => {
  await db.collection("demandesAcces").rename("demandesIdentifiants", (err) => console.log(err));
};

export const down = async (db) => {
  await db.collection("demandesIdentifiants").rename("demandesAcces", (err) => console.log(err));
};

// statut_mise_a_jour_statut are not useful to us

export const up = async (db) => {
  db.collection("croisementCfasDeca").drop();
};

export const down = async () => {};

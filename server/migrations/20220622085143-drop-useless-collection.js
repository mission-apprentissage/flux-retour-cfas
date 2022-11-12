export const up = async (db) => {
  if (db.collections.cfasAnnuaire) {
    db.collection("cfasAnnuaire").drop();
  }
  if (db.collections.croisementCfaAnnuaireassociés) {
    db.collection("croisementCfaAnnuaireassociés").drop();
  }
  if (db.collections.croisementVoeuxAffelnet) {
    db.collection("croisementVoeuxAffelnet").drop();
  }
};

export const down = async () => {};

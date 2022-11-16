export const up = async (db) => {
  if (db.collections.statutsCandidatsDoublonsCfd) {
    await db.collection("statutsCandidatsDoublonsCfd").rename("dossiersApprenantsDoublonsCfd");
  }
};

export const down = async (db) => {
  if (db.collections.dossiersApprenantsDoublonsCfd) {
    await db.collection("dossiersApprenantsDoublonsCfd").rename("statutsCandidatsDoublonsCfd");
  }
};

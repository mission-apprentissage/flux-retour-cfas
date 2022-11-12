export const up = async (db) => {
  if (db.collections.statutsCandidatsDoublonsUais) {
    await db.collection("statutsCandidatsDoublonsUais").rename("dossiersApprenantsDoublonsUais");
  }
};

export const down = async (db) => {
  if (db.collections.dossiersApprenantsDoublonsUais) {
    await db.collection("dossiersApprenantsDoublonsUais").rename("statutsCandidatsDoublonsUais");
  }
};

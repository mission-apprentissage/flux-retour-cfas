module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany(
      {},
      {
        $unset: {
          formation_cfd_is_outdated: "",
          formation_cfd_new: "",
          formation_cfd_start_date: "",
          formation_cfd_end_date: "",
        },
      }
    );
  },

  async down() {},
};

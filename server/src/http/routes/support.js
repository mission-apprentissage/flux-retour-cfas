const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ statutsCandidats }) => {
  const router = express.Router();

  /**
   * Get duplicates route for Statuts Candidats
   */
  router.post(
    "/statutsCandidats/duplicates",
    tryCatch(async (req, res) => {
      let { filters, page, limit } = req.body;
      filters = filters ?? {};
      page = page ?? 1;
      limit = limit ?? 50;

      const duplicates = await statutsCandidats.getDuplicatesList(filters, page, limit);

      return res.send({
        duplicates: duplicates.data,
        pagination: {
          page: duplicates.page,
          resultats_par_page: duplicates.per_page,
          nombre_de_page: duplicates.total_pages,
          total: duplicates.total,
        },
      });
    })
  );

  return router;
};

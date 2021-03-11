const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { JobEvent } = require("../../common/model");

module.exports = () => {
  const router = express.Router();

  router.post(
    "/",
    tryCatch(async (req, res) => {
      let { query, page, limit } = req.body;
      query = query ?? {};
      page = page ?? 1;
      limit = limit ?? 50;

      const allData = await JobEvent.paginate(query, { page, limit });

      return res.send({
        jobEvents: allData.docs,
        pagination: {
          page: allData.page,
          resultats_par_page: limit,
          nombre_de_page: allData.pages,
          total: allData.total,
        },
      });
    })
  );

  return router;
};

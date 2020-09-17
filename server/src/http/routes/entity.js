const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { SampleEntity } = require("../../common/model");
const logger = require("../../common/logger");

/**
 * Schema for validation
 */
const sampleEntitySchema = Joi.object({
  id: Joi.number().required(),
  nom: Joi.string().required(),
  valeur: Joi.string().required(),
});

/**
 * Sample entity route module for GET / POST / PUT / DELETE entity
 */
module.exports = () => {
  const router = express.Router();

  /**
   * Get all items
   * */
  router.get(
    "/items",
    tryCatch(async (req, res) => {
      const allData = await SampleEntity.find({});
      return res.json(allData);
    })
  );

  /**
   * Get item by id
   */
  router.get(
    "/items/:id",
    tryCatch(async (req, res) => {
      const itemId = req.params.id;
      const retrievedData = await SampleEntity.findOne({ id: itemId });
      if (retrievedData) {
        res.json(retrievedData);
      } else {
        res.json({ message: `Item ${itemId} doesn't exist` });
      }
    })
  );

  /**
   * Add/Post an item validated by schema
   */
  router.post(
    "/items",
    tryCatch(async (req, res) => {
      await sampleEntitySchema.validateAsync(req.body, { abortEarly: false });

      const item = req.body;
      logger.info("Adding new item: ", item);

      const sampleToAdd = new SampleEntity({
        id: req.body.id,
        nom: req.body.nom,
        valeur: req.body.valeur,
      });

      await sampleToAdd.save();

      // return updated list
      res.json(sampleToAdd);
    })
  );

  /**
   * Update an item validated by schema
   */
  router.put(
    "/items",
    tryCatch(async (req, res) => {
      await sampleEntitySchema.validateAsync(req.body, { abortEarly: false });
      const item = req.body;
      logger.info("Updating new item: ", item);
      await SampleEntity.findOneAndUpdate({ id: req.body.id }, item, { new: true });
      res.json(req.body);
    })
  );

  /**
   * Delete an item by id
   */
  router.delete(
    "/items/:id",
    tryCatch(async (req, res) => {
      const itemId = req.params.id;
      await SampleEntity.deleteOne({ id: itemId });
      res.json({ message: `Item ${itemId} deleted !` });
    })
  );

  return router;
};

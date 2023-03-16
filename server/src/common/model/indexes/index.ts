import { getDbCollection } from "../../mongodb.js";
import { doesCollectionExistInDb } from "../../utils/dbUtils.js";
import { modelDescriptors } from "../collections.js";

/**
 * Classe BaseIndexer de base
 */
export class BaseIndexer {
  collectionName: string;
  indexesList: any;

  /**
   *
   * @param {object} options
   * @param {string} options.collectionName - Nom de la collection
   * @param {function} options.indexesList - Liste des index à créer
   */
  constructor({ collectionName, indexesList }) {
    this.indexesList = indexesList;
    this.collectionName = collectionName;
  }

  /**
   * Méthode de création des index
   */
  async createIndexes() {
    const isCollectionInDb = await doesCollectionExistInDb(this.collectionName);
    const collection = getDbCollection(this.collectionName);

    if (isCollectionInDb === true) {
      await Promise.all(
        this.indexesList().map(([index, options]) => {
          return collection.createIndex(index, options);
        })
      );
    }
  }

  /**
   * Méthode de destruction des index
   */
  async dropIndexes() {
    const isCollectionInDb = await doesCollectionExistInDb(this.collectionName);
    if (isCollectionInDb === true) {
      getDbCollection(this.collectionName).dropIndexes();
    }
  }
}

export const createIndexes = async () => {
  for (const descriptor of modelDescriptors) {
    if ((descriptor as any).indexes) {
      await new BaseIndexer({
        collectionName: descriptor.collectionName,
        indexesList: (descriptor as any).indexes,
      }).createIndexes();
    }
  }
};

export const dropIndexes = async () => {
  for (const descriptor of modelDescriptors) {
    if ((descriptor as any).indexes) {
      await new BaseIndexer({
        collectionName: descriptor.collectionName,
        indexesList: (descriptor as any).indexes,
      }).dropIndexes();
    }
  }
};

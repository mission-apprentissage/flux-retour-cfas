/**
 * Méthode de split en chunks de taille fixe
 * @param {*} arr
 * @param {*} chunk
 * @returns
 */
const splitIntoChunksList = (arr, chunk) => {
  let chunksList = [];
  for (let i = 0; i < arr.length; i += chunk) {
    chunksList.push(arr.slice(i, i + chunk));
  }
  return chunksList;
};

module.exports = { splitIntoChunksList };

const { buildTokenizedString } = require("../utils/buildTokenizedString");

class Cfa {
  static createTokenizedNom(nom) {
    return buildTokenizedString(nom.trim(), 4);
  }
}

module.exports = { Cfa };

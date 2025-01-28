import type { Jsonify } from "type-fest";

import type { IFormationCatalogue } from "../../data";

type CatalogueFormation = Jsonify<IFormationCatalogue>;

export default CatalogueFormation;

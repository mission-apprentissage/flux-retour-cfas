import CatalogueFormation from "./CatalogueFormation";

type CatalogueFormations = {
  formations: Array<CatalogueFormation>;
  pagination: {
    page: string;
    resultats_par_page: number;
    nombre_de_page: number;
    total: number;
  };
};

export default CatalogueFormations;

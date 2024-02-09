type MnaOrganisme = {
  siret: string;
  _meta: {
    anomalies: Array<any>;
    date_import: string;
    date_dernier_import: string;
    date_collecte: string;
    uai_probable: string;
    nouveau: boolean;
  };
  certifications: Array<{
    type: string;
    code: string;
    label: string;
    sources: Array<string>;
    date_collecte: string;
  }>;
  contacts: Array<{
    email: string;
    confirmé: boolean;
    sources: Array<string>;
    date_collecte: string;
  }>;
  diplomes: Array<{
    type: string;
    code: string;
    niveau: string;
    label: string;
    sources: Array<string>;
    date_collecte: string;
  }>;
  lieux_de_formation: Array<{
    code: string;
    adresse: {
      label: string;
      code_postal: string;
      code_insee: string;
      localite: string;
      geojson: {
        type: string;
        geometry: {
          type: string;
          coordinates: Array<number>;
        };
        properties: {
          score: number;
          source: string;
        };
      };
      departement: {
        code: string;
        nom: string;
      };
      region: {
        code: string;
        nom: string;
      };
      academie: {
        code: string;
        nom: string;
      };
    };
    sources: Array<string>;
    date_collecte: string;
  }>;
  referentiels: Array<string>;
  relations: Array<{
    type: string;
    siret: string;
    label: string;
    referentiel: boolean;
    sources: Array<string>;
    date_collecte: string;
  }>;
  reseaux: Array<any>;
  uai_potentiels: Array<{
    uai: string;
    sources: Array<string>;
    date_collecte: string;
  }>;
  etat_administratif: string;
  forme_juridique: {
    code: string;
    label: string;
  };
  raison_sociale: string;
  siege_social: boolean;
  adresse: {
    academie: {
      code: string;
      nom: string;
    };
    code_insee: string;
    code_postal: string;
    departement: {
      code: string;
      nom: string;
    };
    geojson: {
      geometry: {
        coordinates: Array<number>;
        type: string;
      };
      properties: {
        score: number;
        source: string;
      };
      type: string;
    };
    label: string;
    localite: string;
    region: {
      code: string;
      nom: string;
    };
  };
  nature: string;
  numero_declaration_activite: string;
  qualiopi: boolean;
  uai: string;
};

export default MnaOrganisme;

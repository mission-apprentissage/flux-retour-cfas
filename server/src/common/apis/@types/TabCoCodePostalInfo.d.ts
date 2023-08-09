type TabCoCodePostalInfo = {
  result: {
    code_postal: string;
    code_commune_insee: string;
    commune: string;
    num_departement: string;
    nom_departement: string;
    region: string;
    num_region: string;
    nom_academie: string;
    num_academie: number;
  };
  messages: {
    error?: string;
    cp: string;
    update: string;
  };
};

export default TabCoCodePostalInfo;

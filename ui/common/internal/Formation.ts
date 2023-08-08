// récupéré de l'API et adapté pour ne pas avoir certains champs optionnels
export interface Formation {
  cle_ministere_educatif: string;
  cfd: string;
  rncp_code: string | null; // 1000 cas avec null
  intitule_long: string;
  lieu_formation_adresse: string;
  duree: string;
  niveau: string;
}

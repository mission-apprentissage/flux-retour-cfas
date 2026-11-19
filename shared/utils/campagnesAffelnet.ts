const SEPTEMBER_MONTH_INDEX = 8;

export const NOMBRE_CAMPAGNES_AFFELNET_CONSERVEES = 2;

export const getPremiereCampagneAffelnetConservee = (date: Date): number => {
  const annee = date.getUTCFullYear();
  const rentreeCommencee = date.getTime() >= Date.UTC(annee, SEPTEMBER_MONTH_INDEX, 1);
  return annee - NOMBRE_CAMPAGNES_AFFELNET_CONSERVEES + (rentreeCommencee ? 1 : 0);
};

export const getCampagnesAffelnetConservees = (date: Date): number[] => {
  const premiere = getPremiereCampagneAffelnetConservee(date);
  const derniere = date.getUTCFullYear();
  return Array.from({ length: derniere - premiere + 1 }, (_, index) => derniere - index);
};

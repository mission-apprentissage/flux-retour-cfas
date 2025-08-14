export const isMissionLocaleUser = (userType: string): userType is "MISSION_LOCALE" => {
  return userType === "MISSION_LOCALE";
};

export const formatContactTimeText = (daysSince: number): string => {
  if (daysSince === 0) {
    return "aujourd'hui";
  } else if (daysSince === 1) {
    return "il y a 1 jour";
  } else {
    return `il y a ${daysSince} jours`;
  }
};

export const calculateDaysSince = (date: Date | string): number => {
  const contactDate = new Date(date);
  const today = new Date();

  const contactDateNormalized = new Date(contactDate.getFullYear(), contactDate.getMonth(), contactDate.getDate());
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return Math.floor((todayNormalized.getTime() - contactDateNormalized.getTime()) / (1000 * 60 * 60 * 24));
};

export const shouldShowContactForm = (
  userType: string,
  effectif: { injoignable?: boolean | null | undefined },
  effectifUpdated: boolean
): boolean => {
  return userType === "MISSION_LOCALE" && !!effectif.injoignable && !effectifUpdated;
};

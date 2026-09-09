export const isMissionLocaleUser = (userType: string): userType is "MISSION_LOCALE" => {
  return userType === "MISSION_LOCALE";
};

// you can use the following dynamic args in Stories to mock auth context
export const authArgTypes = {
  auth__roles: {
    name: "roles",
    description: "overwritten description",
    control: "multi-select",
    options: ["of", "ofr", "pilot"],
  },
  auth__permissions: { name: "permissions", control: "select", options: ["page/mes-organismes"] },
  auth__isInPendingValidation: { name: "is Pending validation", control: "boolean" },
  auth__hasAtLeastOneUserToValidate: { name: "has At Least One User To Validate", control: "boolean" },
  auth__account_status: {
    name: "Account status",
    control: "select",
    options: [
      "NOT_CONFIRMED",
      "FIRST_FORCE_RESET_PASSWORD",
      "FORCE_COMPLETE_PROFILE_STEP1",
      "FORCE_COMPLETE_PROFILE_STEP2",
      "CONFIRMED",
      "FORCE_RESET_PASSWORD",
    ],
  },
  auth__organisation: {
    name: "Organisation",
    control: "select",
    options: ["DDETS", "DREETS", "DEETS", "DRAAF", "CONSEIL_REGIONAL", "ACADEMIE"],
  },
};

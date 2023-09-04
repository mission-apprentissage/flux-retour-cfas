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
  auth__isOrganismeAdmin: { name: "has At Least One User To Validate", control: "boolean" },
  auth__account_status: {
    name: "Account status",
    control: "select",
    options: ["PENDING_EMAIL_VALIDATION", "PENDING_ADMIN_VALIDATION", "CONFIRMED"],
  },
  auth__organisation: {
    name: "Organisation",
    control: "select",
    options: ["DDETS", "DREETS", "DRAAF", "CONSEIL_REGIONAL", "ACADEMIE"],
  },
};

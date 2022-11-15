import { runScript } from "../../scriptWrapper.js";
import logger from "../../../common/logger.js";
import { JOB_NAMES } from "../../../common/constants/jobsConstants.js";
import arg from "arg";
import { apiRoles, tdbRoles } from "../../../common/roles.js";

let args = [];

runScript(async ({ users }) => {
  args = arg(
    { "--username": String, "--email": String, "--network": String, "--permission": [String] },
    { argv: process.argv.slice(2) }
  );

  const username = args["--username"];
  const permissions = args["--permission"];
  const email = args["--email"];
  const network = args["--network"];

  logger.info(`Will create user ${username} with permissions ${JSON.stringify(permissions)} `);

  if (!username) {
    throw new Error("--username required argument is missing");
  }

  if (!permissions) {
    throw new Error("--permissions required argument is missing");
  }

  permissions.forEach((currentPermission) => {
    if (!isPermissionExistantInRoles(currentPermission)) {
      throw new Error(`Permission ${currentPermission} doesn't exists !`);
    }
  });

  await users.createUser({ username, email, network, permissions: permissions });

  logger.info(`User ${username} successfully created with permissions ${JSON.stringify(permissions)}`);
}, JOB_NAMES.createUser);

/**
 * Check if permission string is in api or tdb roles
 * @param {*} permissionToCheck
 * @returns
 */
const isPermissionExistantInRoles = (permissionToCheck) => {
  const isInApiPermissions = Object.keys(apiRoles).some((item) => item === permissionToCheck);
  const isInTdbPermissions = Object.keys(tdbRoles).some((item) => item === permissionToCheck);
  return isInApiPermissions || isInTdbPermissions;
};

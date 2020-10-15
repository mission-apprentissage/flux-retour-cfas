const request = require("requestretry");
const config = require("config");

async function getUser(email) {
  const options = {
    method: "GET",
    url: `https://api.sendinblue.com/v3/contacts/${email.replace("@", "%40")}`,
    headers: {
      accept: "application/json",
      "api-key": config.sendinblue.apiKey,
    },
  };
  try {
    const res = await request(options);
    console.log(`contact ${res.attempts} — ${res.statusCode}`, JSON.parse(res.body));
    return JSON.parse(res.body);
  } catch (error) {
    throw new Error(error);
  }
}

async function getAllUsers(offset = 0, allUsers = []) {
  const options = {
    method: "GET",
    url: "https://api.sendinblue.com/v3/contacts",
    qs: { limit: "1000", offset: offset },
    headers: { accept: "application/json", "api-key": config.sendinblue.apiKey },
  };
  try {
    const { body } = await request(options);
    const user = JSON.parse(body);
    allUsers = allUsers.concat(user.contacts);
    if (allUsers.length < user.count) {
      console.log("length", allUsers.length);
      return getAllUsers((offset += 1000), allUsers);
    } else {
      return allUsers;
    }
  } catch (error) {
    throw new Error(error);
  }
}

async function getContactsFromList(listId, offset = 0, allUsers = []) {
  const options = {
    method: "GET",
    url: `https://api.sendinblue.com/v3/contacts/lists/${listId}/contacts`,
    qs: { limit: "500", offset: offset },
    headers: { accept: "application/json", "api-key": config.sendinblue.apiKey },
  };
  try {
    const { body } = await request(options);
    const user = JSON.parse(body);
    allUsers = allUsers.concat(user.contacts);
    if (allUsers.length < user.count) {
      console.log("length", allUsers.length);
      return getContactsFromList(listId, (offset += 500), allUsers);
    } else {
      return allUsers;
    }
  } catch (error) {
    throw new Error(error);
  }
}

async function updateContactAttributes(email, body, displayLog = false) {
  const options = {
    method: "PUT",
    url: `https://api.sendinblue.com/v3/contacts/${email.replace("@", "%40")}`,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.sendinblue.apiKey,
    },
    body: body,
    json: true,
    maxAttempts: 10,
    retryDelay: 5000,
    retryStrategy: request.RetryStrategies.HTTPOrNetworkError,
  };

  try {
    const res = await request(options);
    if (res.statusCode === 204 && displayLog) {
      console.log(`contact ${email} updated — attemps: ${res.attempts}`);
    }
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = { getAllUsers, getUser, updateContactAttributes, getContactsFromList };
